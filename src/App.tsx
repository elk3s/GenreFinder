import React, { useState, useEffect } from "react";
import { Music, Sparkles, Disc, Radio, AlertCircle, HelpCircle, Square, Volume2, Palette } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SearchSection from "./components/SearchSection";
import SongProfile from "./components/SongProfile";
import SuggestionsList from "./components/SuggestionsList";
import PlaylistWorkspace from "./components/PlaylistWorkspace";
import AudioVisualizer from "./components/AudioVisualizer";
import { SongMatch, SongSuggestion, PlaylistSong } from "./types";
import { globalSynthPlayer } from "./lib/synthPlayer";
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "./lib/firebase";
import { savePlaylistToCloud, fetchPlaylistsFromCloud, deletePlaylistFromCloud, saveActiveWorkspaceToCloud, loadActiveWorkspaceFromCloud, CloudPlaylist } from "./lib/playlistStore";
import { LogIn, LogOut, Cloud, Loader2 } from "lucide-react";

const getApiUrl = (path: string): string => {
  const base = ((import.meta as any).env.VITE_API_URL || "").replace(/\/$/, "");
  if (base) {
    return `${base}${path}`;
  }
  
  if (typeof window !== "undefined") {
    const host = window.location.host;
    const isDevOrBackend = host.includes("localhost:3000") || 
                           host.includes("127.0.0.1:3000") || 
                           host.includes("asia-east1.run.app");
    if (!isDevOrBackend) {
      return `https://ais-pre-lvdzvtlo5rrfo4snjogvdt-411097741215.asia-east1.run.app${path}`;
    }
  }
  
  return path;
};

export default function App() {
  const [selectedSong, setSelectedSong] = useState<SongMatch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SongSuggestion[]>([]);

  // Theme states
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    return localStorage.getItem("genre_finder_theme") || "light-mineral";
  });

  useEffect(() => {
    document.documentElement.className = "theme-" + currentTheme;
    localStorage.setItem("genre_finder_theme", currentTheme);
  }, [currentTheme]);

  // Playlist states
  const [playlistSongs, setPlaylistSongs] = useState<PlaylistSong[]>([]);
  const [playlistName, setPlaylistName] = useState("My Genre Match Blend");
  const [playlistDesc, setPlaylistDesc] = useState("Curated similar songs with matching vibe profiles.");

  // Firebase Cloud Sync States
  const [user, setUser] = useState<User | null>(null);
  const [cloudPlaylists, setCloudPlaylists] = useState<CloudPlaylist[]>([]);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);

  // Authentication state listener and cloud data loader
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsLoadingCloud(true);
        try {
          const playlists = await fetchPlaylistsFromCloud(currentUser.uid);
          setCloudPlaylists(playlists);

          // Restores the user's active cloud draft session on startup if local list is empty
          const activeCloudWorkspace = await loadActiveWorkspaceFromCloud(currentUser.uid);
          if (activeCloudWorkspace && activeCloudWorkspace.songs.length > 0 && playlistSongs.length === 0) {
            setPlaylistSongs(activeCloudWorkspace.songs);
            setPlaylistName(activeCloudWorkspace.name);
            setPlaylistDesc(activeCloudWorkspace.description);
          }
        } catch (e) {
          console.error("Failed loading user's cloud data", e);
        } finally {
          setIsLoadingCloud(false);
        }
      } else {
        setCloudPlaylists([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync workspace active draft state to cloud with 1.5s debounce to save writes
  useEffect(() => {
    if (user && playlistSongs.length > 0) {
      const delayDebounce = setTimeout(() => {
        saveActiveWorkspaceToCloud(user.uid, playlistName, playlistDesc, playlistSongs);
      }, 1500);
      return () => clearTimeout(delayDebounce);
    }
  }, [playlistSongs, playlistName, playlistDesc, user]);

  // Google Sign-In and Cloud storage handlers
  const handleSignInWithGoogle = async () => {
    try {
      setError(null);
      
      // If we are nested inside an iframe, proactively print a notice to developer log
      const isInIframe = typeof window !== "undefined" && window.self !== window.top;
      if (isInIframe) {
        console.warn("[Notice] Attempting Google sign-in within an iframe preview. If popups are blocked by your browser, please click 'Open in New Tab' to sign in stand-alone.");
      }

      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google login failed", err);
      const msg = err?.message || String(err);
      
      if (
        msg.includes("popup-blocked") || 
        msg.includes("cancelled-popup-request") || 
        msg.includes("popup_blocked_by_browser") ||
        msg.includes("closed-by-user")
      ) {
        setError(
          "Google Sign-In was blocked or closed. Because the developer preview runs inside a nested iframe, browsers block popups for security. To sign in successfully, click the 'Open in New Tab' button in the top-right corner of AI Studio."
        );
      } else if (msg.includes("Pending promise") || msg.includes("INTERNAL ASSERTION FAILED")) {
        setError(
          "A browser sandbox security restriction was encountered. Please open this app in a separate standalone tab (click 'Open in New Tab' in the top-right of AI Studio) to sign in securely with Google."
        );
      } else {
        setError("Google Sign-In failed: " + msg);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setCloudPlaylists([]);
    } catch (err: any) {
      console.error("Logout failed", err);
    }
  };

  const handleSaveToCloud = async () => {
    if (!user) return;
    if (playlistSongs.length === 0) {
      setError("Cannot save an empty playlist to the cloud.");
      return;
    }
    setIsSavingCloud(true);
    try {
      setError(null);
      await savePlaylistToCloud(user.uid, playlistName, playlistDesc, playlistSongs);
      // Refresh
      const playlists = await fetchPlaylistsFromCloud(user.uid);
      setCloudPlaylists(playlists);
    } catch (err: any) {
      console.error("Failed saving playlist to cloud", err);
      setError("Failed to save playlist: " + (err.message || err));
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleLoadCloudPlaylist = (playlist: CloudPlaylist) => {
    if (playlist.songs) {
      setPlaylistSongs(playlist.songs);
      setPlaylistName(playlist.name);
      setPlaylistDesc(playlist.description || "");
    }
  };

  const handleDeleteCloudPlaylist = async (playlistId: string) => {
    if (!user) return;
    if (window.confirm("Are you sure you want to delete this playlist from your cloud storage?")) {
      try {
        setError(null);
        await deletePlaylistFromCloud(user.uid, playlistId);
        // Refresh
        const playlists = await fetchPlaylistsFromCloud(user.uid);
        setCloudPlaylists(playlists);
      } catch (err: any) {
        console.error("Failed to delete cloud playlist", err);
        setError("Failed to delete cloud playlist: " + (err.message || err));
      }
    }
  };

  // Global Audio Preview States
  const [activePreview, setActivePreview] = useState<{ title: string; artist: string; genre: string; previewUrl?: string } | null>(null);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewAnalyser, setPreviewAnalyser] = useState<AnalyserNode | null>(null);

  // 1. Local Storage synchronization on mount
  useEffect(() => {
    try {
      const storedSongs = localStorage.getItem("genre_finder_playlist_songs");
      if (storedSongs) {
        setPlaylistSongs(JSON.parse(storedSongs));
      }
      const storedName = localStorage.getItem("genre_finder_playlist_name");
      if (storedName) {
        setPlaylistName(storedName);
      }
      const storedDesc = localStorage.getItem("genre_finder_playlist_desc");
      if (storedDesc) {
        setPlaylistDesc(storedDesc);
      }
    } catch (e) {
      console.error("Failed to load playlist from localStorage", e);
    }
  }, []);

  // 2. Persist playlist states on update
  useEffect(() => {
    try {
      localStorage.setItem("genre_finder_playlist_songs", JSON.stringify(playlistSongs));
    } catch (e) {
      console.error("Failed to save playlist songs", e);
    }
  }, [playlistSongs]);

  useEffect(() => {
    localStorage.setItem("genre_finder_playlist_name", playlistName);
  }, [playlistName]);

  useEffect(() => {
    localStorage.setItem("genre_finder_playlist_desc", playlistDesc);
  }, [playlistDesc]);

  // Cleanup synthesizer on component unmount
  useEffect(() => {
    return () => {
      globalSynthPlayer.stop();
    };
  }, []);

  // Global Audio Preview Handlers
  const handlePlayPreview = (title: string, artist: string, genre: string, previewUrl?: string) => {
    setActivePreview({ title, artist, genre, previewUrl });
    setPreviewProgress(0);
    setPreviewAnalyser(null);

    globalSynthPlayer.play(
      genre,
      title,
      artist,
      previewUrl,
      (elapsed, analyser) => {
        setPreviewProgress(elapsed);
        setPreviewAnalyser(analyser);
      },
      () => {
        setActivePreview(null);
        setPreviewProgress(0);
        setPreviewAnalyser(null);
      }
    );
  };

  const handleStopPreview = () => {
    globalSynthPlayer.stop();
    setActivePreview(null);
    setPreviewProgress(0);
    setPreviewAnalyser(null);
  };

  // Handle song selection from search
  const handleSelectSong = (song: SongMatch) => {
    setSelectedSong(song);
    setSuggestions([]);
    setError(null);
    handleStopPreview(); // Stop active preview on new song selection

    // Auto-update playlist name based on seed song to save user effort
    if (playlistSongs.length === 0) {
      setPlaylistName(`${song.title} - Similar Vibe Blend`);
      setPlaylistDesc(`A custom compilation of tracks inspired by the ${song.primaryGenre} and rhythmic style of "${song.title}" by ${song.artist}.`);
    }
  };

  // Call the recommend API
  const handleGenerateSuggestions = async (
    selectedGenres: string[],
    focusAttribute: string,
    count: number
  ) => {
    if (!selectedSong) return;
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl("/api/recommend"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedSong.title,
          artist: selectedSong.artist,
          genres: selectedSong.genres,
          primaryGenre: selectedSong.primaryGenre,
          genreBranches: selectedSong.genreBranches,
          popularity: selectedSong.popularity,
          selectedGenres,
          focusAttribute,
          count,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate suggestions.");
      }

      const data = await response.json();
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      } else {
        throw new Error("No suggestions were returned. Please try matching other genres.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not fetch recommendations. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Add individual song to playlist
  const handleAddSong = (song: SongSuggestion) => {
    const isDuplicate = playlistSongs.some(
      (s) => s.title.toLowerCase() === song.title.toLowerCase() && s.artist.toLowerCase() === song.artist.toLowerCase()
    );

    if (isDuplicate) return;

    const newSong: PlaylistSong = {
      title: song.title,
      artist: song.artist,
      genres: song.genres,
      primaryGenre: song.primaryGenre,
      addedAt: Date.now(),
    };

    setPlaylistSongs((prev) => [...prev, newSong]);
  };

  // Add all suggestions to playlist
  const handleAddAllSongs = () => {
    const songsToAdd: PlaylistSong[] = [];
    suggestions.forEach((item) => {
      const isDuplicate = playlistSongs.some(
        (s) => s.title.toLowerCase() === item.title.toLowerCase() && s.artist.toLowerCase() === item.artist.toLowerCase()
      ) || songsToAdd.some(
        (s) => s.title.toLowerCase() === item.title.toLowerCase() && s.artist.toLowerCase() === item.artist.toLowerCase()
      );

      if (!isDuplicate) {
        songsToAdd.push({
          title: item.title,
          artist: item.artist,
          genres: item.genres,
          primaryGenre: item.primaryGenre,
          addedAt: Date.now(),
        });
      }
    });

    if (songsToAdd.length > 0) {
      setPlaylistSongs((prev) => [...prev, ...songsToAdd]);
    }
  };

  // Remove song from playlist
  const handleRemoveSong = (idx: number) => {
    setPlaylistSongs((prev) => prev.filter((_, i) => i !== idx));
  };

  // Clear playlist
  const handleClearPlaylist = () => {
    if (window.confirm("Are you sure you want to empty your compiled playlist?")) {
      setPlaylistSongs([]);
    }
  };

  return (
    <div className={`min-h-screen theme-${currentTheme} bg-zinc-50/50 text-zinc-900 font-sans antialiased pb-28 selection:bg-zinc-900 selection:text-white`}>
      {/* Sleek Minimal Header */}
      <header className="border-b border-zinc-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-xs">
              <Disc className={`w-5 h-5 ${activePreview ? 'animate-[spin_2s_linear_infinite]' : 'animate-[spin_5s_linear_infinite]'}`} />
            </div>
            <div>
              <h1 className="text-base font-bold text-zinc-900 tracking-tight leading-none">Music Genre Finder</h1>
              <p className="text-[10px] text-zinc-400 font-medium mt-1">Vibe Matcher & Playlist Compiler</p>
            </div>
          </div>

          {/* Centered Themes Selector Button */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => setIsThemeModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs hover:shadow-xs"
              title="Customize App Theme"
            >
              <Palette className="w-3.5 h-3.5 text-zinc-500" />
              <span>Themes</span>
            </button>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-mono text-zinc-500 font-medium">
              <Radio className={`w-3.5 h-3.5 ${activePreview ? 'text-emerald-500 animate-pulse' : 'text-zinc-400'}`} />
              <span>{activePreview ? "Playing Preview" : "Engine Online"}</span>
            </div>

            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-zinc-100">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "User"} className="w-8 h-8 rounded-full border border-zinc-200" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-900 text-white font-bold flex items-center justify-center text-xs">
                    {user.displayName?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-zinc-800 leading-none">{user.displayName}</p>
                  <p className="text-[9px] text-zinc-400 font-medium mt-0.5">{user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-zinc-400 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignInWithGoogle}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-all cursor-pointer text-xs font-bold shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 mt-8">
        {/* Welcome Pitch banner */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1 max-w-2xl">
            <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">Solve the Missing Genre Problem</h2>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
              Spotify, Apple Music, and YouTube Music don't show song genres in their main interfaces, making it hard to find exactly what you like. 
              Search any song below to decode its underlying primary and sub-genres, view its detailed branching taxonomy, listen to dynamic 20-second musical previews, and compile custom playlists.
            </p>
          </div>
          <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-zinc-500 hover:text-zinc-900 transition-colors shrink-0 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-semibold">100% Standalone Previews</span>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Search & Configurations */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <SearchSection
              onSelectSong={handleSelectSong}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              error={error}
              setError={setError}
            />

            <AnimatePresence mode="wait">
              {selectedSong && (
                <motion.div
                  key={selectedSong.title + selectedSong.artist}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <SongProfile
                    song={selectedSong}
                    onGenerateSuggestions={handleGenerateSuggestions}
                    isGenerating={isGenerating}
                    onPlayPreview={handlePlayPreview}
                    onStopPreview={handleStopPreview}
                    activePreview={activePreview}
                    previewAnalyser={previewAnalyser}
                    previewProgress={previewProgress}
                  />

                  <SuggestionsList
                    suggestions={suggestions}
                    playlistSongs={playlistSongs}
                    onAddSong={handleAddSong}
                    onAddAllSongs={handleAddAllSongs}
                    onPlayPreview={handlePlayPreview}
                    onStopPreview={handleStopPreview}
                    activePreview={activePreview}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Playlist Creation Workspace */}
          <div className="lg:col-span-5 xl:col-span-4">
            <PlaylistWorkspace
              songs={playlistSongs}
              playlistName={playlistName}
              setPlaylistName={setPlaylistName}
              playlistDesc={playlistDesc}
              setPlaylistDesc={setPlaylistDesc}
              onRemoveSong={handleRemoveSong}
              onClearPlaylist={handleClearPlaylist}
              onPlayPreview={handlePlayPreview}
              onStopPreview={handleStopPreview}
              activePreview={activePreview}
              user={user}
              cloudPlaylists={cloudPlaylists}
              isSavingCloud={isSavingCloud}
              isLoadingCloud={isLoadingCloud}
              onSaveToCloud={handleSaveToCloud}
              onLoadCloudPlaylist={handleLoadCloudPlaylist}
              onDeleteCloudPlaylist={handleDeleteCloudPlaylist}
              onSignInWithGoogle={handleSignInWithGoogle}
            />
          </div>
        </div>
      </main>

      {/* Floating Global Glass Media Player Bar */}
      <AnimatePresence>
        {activePreview && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl bg-zinc-950/95 backdrop-blur-md border border-zinc-800 text-white rounded-2xl p-4 shadow-2xl z-50 flex items-center justify-between gap-4"
          >
            {/* Spinning Disc and Track Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0 relative animate-[spin_4s_linear_infinite]">
                <Disc className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest leading-none mb-1">Previewing Vibe</p>
                <h4 className="text-xs sm:text-sm font-bold truncate leading-tight">{activePreview.title}</h4>
                <p className="text-[10px] text-zinc-400 truncate mt-0.5">by {activePreview.artist}</p>
              </div>
            </div>

            {/* Small center waveform */}
            <div className="hidden sm:block w-36 h-8">
              <AudioVisualizer isPlaying={true} analyser={previewAnalyser} height={32} />
            </div>

            {/* Timer and Stop controls */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-zinc-300 block">
                  {Math.floor(previewProgress)}s / {activePreview.previewUrl ? "30s" : "20s"}
                </span>
                <span className="text-[9px] font-bold text-zinc-400 block uppercase tracking-wider truncate max-w-[80px]">{activePreview.genre}</span>
              </div>
              <button
                onClick={handleStopPreview}
                className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center"
                title="Stop preview"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Themes Customizer Modal */}
      <AnimatePresence>
        {isThemeModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsThemeModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-md bg-white rounded-2xl border border-zinc-100 shadow-2xl p-6 overflow-hidden z-10"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <Palette className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-base font-extrabold text-zinc-900 tracking-tight">Select Vibe Theme</h3>
                </div>
                <button
                  onClick={() => setIsThemeModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  Personalize your Music Genre Finder layout. Switch between light and dark environments optimized with tailored high-contrast accents.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: "dark-tech",
                      name: "The Tech Core",
                      type: "Dark",
                      bgClass: "bg-[#1F2326]",
                      cardClass: "bg-[#2D3436]",
                      accentClass: "bg-[#00FFC2]",
                      desc: "Anthracite base with dark slate and precise electric mint accent.",
                    },
                    {
                      id: "light-mineral",
                      name: "Airy Luxury",
                      type: "Light",
                      bgClass: "bg-[#F2F2EE]",
                      cardClass: "bg-white",
                      accentClass: "bg-[#C2A58C]",
                      desc: "Warm mineral-sand canvas paired with muted terracotta.",
                    },
                    {
                      id: "light-corporate",
                      name: "Trustworthy Classic",
                      type: "Light",
                      bgClass: "bg-white",
                      cardClass: "bg-[#F8FAFC]",
                      accentClass: "bg-[#E85D3F]",
                      desc: "High-contrast corporate setup with midnight navy and vibrant orange.",
                    },
                    {
                      id: "dark-nordic",
                      name: "The Nordic Night",
                      type: "Dark",
                      bgClass: "bg-[#1E2229]",
                      cardClass: "bg-[#282E38]",
                      accentClass: "bg-[#D97706]",
                      desc: "Sophisticated, warm minimalist, premium, and atmospheric.",
                    },
                  ].map((t) => {
                    const isSelected = currentTheme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setCurrentTheme(t.id)}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-36 group relative ${
                          isSelected
                            ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-zinc-50/20"
                            : "border-zinc-100 bg-white hover:border-zinc-200 hover:bg-zinc-50/20"
                        }`}
                      >
                        <div className="w-full">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-900 tracking-tight">{t.name}</span>
                            <span className={`text-[8px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded-xs ${
                              t.type === "Light" 
                                ? "bg-amber-50 text-amber-800 border border-amber-100" 
                                : "bg-purple-950/50 text-purple-200 border border-purple-800/40"
                            }`}>
                              {t.type}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 font-medium leading-relaxed mt-1.5 group-hover:text-zinc-500 transition-colors">
                            {t.desc}
                          </p>
                        </div>

                        <div className="flex items-center justify-between w-full mt-2">
                          <div className="flex gap-1.5">
                            <div className={`w-3.5 h-3.5 rounded-full border border-zinc-200 ${t.bgClass}`} title="Background" />
                            <div className={`w-3.5 h-3.5 rounded-full border border-zinc-200 ${t.cardClass}`} title="Card" />
                            <div className={`w-3.5 h-3.5 rounded-full ${t.accentClass}`} title="Accent" />
                          </div>
                          
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${
                            isSelected ? "bg-emerald-500 text-white" : "border border-zinc-300 bg-white"
                          }`}>
                            {isSelected && (
                              <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 border-t border-zinc-100 pt-4 flex justify-end">
                <button
                  onClick={() => setIsThemeModalOpen(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
