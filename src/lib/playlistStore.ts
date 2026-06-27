import { db } from "./firebase";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, addDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { PlaylistSong } from "../types";

export interface CloudPlaylist {
  id: string;
  name: string;
  description: string;
  songs: PlaylistSong[];
  updatedAt: any;
}

// Save a playlist to the user's saved collection
export async function savePlaylistToCloud(
  userId: string,
  name: string,
  description: string,
  songs: PlaylistSong[]
): Promise<string> {
  const playlistsRef = collection(db, "users", userId, "playlists");
  const docRef = await addDoc(playlistsRef, {
    name,
    description,
    songs,
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// Fetch all saved cloud playlists for the user
export async function fetchPlaylistsFromCloud(userId: string): Promise<CloudPlaylist[]> {
  try {
    const playlistsRef = collection(db, "users", userId, "playlists");
    // Simple query first, fallback to basic retrieval if index isn't built yet
    const querySnapshot = await getDocs(playlistsRef);
    
    const playlists: CloudPlaylist[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      playlists.push({
        id: doc.id,
        name: data.name || "Untitled Playlist",
        description: data.description || "",
        songs: data.songs || [],
        updatedAt: data.updatedAt,
      });
    });
    
    // Sort locally in memory to guarantee it works without requiring Firestore composite indexes
    return playlists.sort((a, b) => {
      const aTime = a.updatedAt?.seconds || 0;
      const bTime = b.updatedAt?.seconds || 0;
      return bTime - aTime;
    });
  } catch (error: any) {
    const msg = error?.message || String(error);
    if (msg.includes("offline") || error?.code === "unavailable" || msg.includes("failed-precondition")) {
      console.warn("[Firebase Store] Fetching playlists from cloud failed (client offline or sandbox restriction). Returning empty saved list.");
    } else {
      console.error("Error fetching playlists from cloud:", error);
    }
    return [];
  }
}

// Delete a saved cloud playlist
export async function deletePlaylistFromCloud(userId: string, playlistId: string): Promise<void> {
  const docRef = doc(db, "users", userId, "playlists", playlistId);
  await deleteDoc(docRef);
}

// Save active draft workspace state to cloud so it is synced across devices
export async function saveActiveWorkspaceToCloud(
  userId: string,
  name: string,
  description: string,
  songs: PlaylistSong[]
): Promise<void> {
  try {
    const docRef = doc(db, "users", userId, "workspace", "active");
    await setDoc(docRef, {
      name,
      description,
      songs,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error saving active workspace to cloud:", error);
  }
}

// Load active draft workspace state from cloud
export async function loadActiveWorkspaceFromCloud(
  userId: string
): Promise<{ name: string; description: string; songs: PlaylistSong[] } | null> {
  try {
    const docRef = doc(db, "users", userId, "workspace", "active");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        name: data.name || "My Genre Match Blend",
        description: data.description || "",
        songs: data.songs || [],
      };
    }
  } catch (error: any) {
    const msg = error?.message || String(error);
    if (msg.includes("offline") || error?.code === "unavailable" || msg.includes("failed-precondition")) {
      console.warn("[Firebase Store] Loading active workspace from cloud failed (client offline or sandbox restriction). Falling back to local state.");
    } else {
      console.error("Error loading active workspace from cloud:", error);
    }
  }
  return null;
}
