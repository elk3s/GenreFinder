export interface SongMatch {
  title: string;
  artist: string;
  primaryGenre: string;
  genres: string[];
  genreBranches?: string[];
  mood: string;
  releaseYear: string;
  description: string;
  previewUrl?: string;
  popularity?: string;
}

export interface SongSuggestion {
  title: string;
  artist: string;
  primaryGenre: string;
  genres: string[];
  genreBranches?: string[];
  mood: string;
  energyLevel: string; // High, Medium, Low
  suitabilityScore: number; // 0-100
  matchingReason: string;
  previewUrl?: string;
  popularity?: string;
}

export interface PlaylistSong {
  title: string;
  artist: string;
  genres: string[];
  primaryGenre: string;
  genreBranches?: string[];
  addedAt: number;
  previewUrl?: string;
  popularity?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  songs: PlaylistSong[];
  createdAt: number;
}
