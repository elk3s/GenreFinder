import React, { useState } from "react";
import { Search, Sparkles, Music, Calendar, CornerDownRight, Loader2 } from "lucide-react";
import { SongMatch } from "../types";

interface SearchSectionProps {
  onSelectSong: (song: SongMatch) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  error: string | null;
  setError: (err: string | null) => void;
}

const PRESETS = [
  { title: "U Weren't Here I Really Miss You", artist: "Cult Member", query: "U Weren't Here I Really Miss You" },
  { title: "Show Me Love", artist: "WizTheMC", query: "Show Me Love WizTheMC" },
  { title: "Blinding Lights", artist: "The Weeknd", query: "Blinding Lights The Weeknd" },
  { title: "Get Lucky", artist: "Daft Punk", query: "Get Lucky Daft Punk" },
];

export default function SearchSection({
  onSelectSong,
  isLoading,
  setIsLoading,
  error,
  setError,
}: SearchSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [artistFilter, setArtistFilter] = useState("");
  const [matches, setMatches] = useState<SongMatch[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (titleToUse?: string, artistToUse?: string) => {
    const title = (titleToUse !== undefined ? titleToUse : searchQuery).trim();
    const artist = (artistToUse !== undefined ? artistToUse : artistFilter).trim();
    
    if (!title) return;

    setIsLoading(true);
    setError(null);
    setMatches([]);
    setHasSearched(true);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: title, artist }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze song.");
      }

      const data = await response.json();
      if (data.matches && data.matches.length > 0) {
        setMatches(data.matches);
      } else {
        throw new Error("No songs found matching that description. Please try another search.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const selectMatch = (song: SongMatch) => {
    onSelectSong(song);
    // Clear search results to keep layout minimal once song is loaded
    setMatches([]);
    setHasSearched(false);
    setSearchQuery("");
    setArtistFilter("");
  };

  return (
    <div id="search-section" className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-xs">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-zinc-50 rounded-lg text-zinc-900 border border-zinc-100">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 leading-snug">Song Genre Search</h2>
          <p className="text-xs text-zinc-500">Search any track to decode its underlying genre structure</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Song Title Input */}
        <div className="relative">
          <label htmlFor="song-title-input" className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">
            Song Title
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              id="song-title-input"
              type="text"
              className="w-full pl-10 pr-4 py-3 bg-zinc-50/50 hover:bg-zinc-50 focus:bg-white text-zinc-900 placeholder-zinc-400 text-sm rounded-xl border border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all outline-hidden font-medium"
              placeholder="e.g. 3:00 AM or Show Me Love..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Artist Input Filter */}
        <div className="relative">
          <label htmlFor="artist-filter-input" className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">
            Artist Filter <span className="text-zinc-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <Music className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              id="artist-filter-input"
              type="text"
              className="w-full pl-10 pr-4 py-3 bg-zinc-50/50 hover:bg-zinc-50 focus:bg-white text-zinc-900 placeholder-zinc-400 text-sm rounded-xl border border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all outline-hidden font-medium"
              placeholder="e.g. Finding Hope or WizTheMC..."
              value={artistFilter}
              onChange={(e) => setArtistFilter(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-4 font-sans">
        <button
          id="search-submit-btn"
          onClick={() => handleSearch()}
          disabled={isLoading || !searchQuery.trim()}
          className="w-full sm:w-auto px-6 py-3 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs hover:shadow-md disabled:shadow-none"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Analyze & Match Genres</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
          {error}
        </div>
      )}

      {/* Preset Suggestions */}
      {!hasSearched && matches.length === 0 && !isLoading && (
        <div className="mt-5">
          <p className="text-xs text-zinc-400 font-medium mb-2.5">Try popular search presets:</p>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.query}
                id={`preset-${preset.title.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => {
                  setSearchQuery(preset.title);
                  setArtistFilter(preset.artist);
                  handleSearch(preset.title, preset.artist);
                }}
                className="flex flex-col items-start p-3 bg-zinc-50/50 hover:bg-zinc-50 border border-zinc-100 hover:border-zinc-200 rounded-xl transition-all text-left group cursor-pointer"
              >
                <span className="text-xs font-semibold text-zinc-800 group-hover:text-zinc-900 leading-tight">
                  {preset.title}
                </span>
                <span className="text-[10px] text-zinc-400 group-hover:text-zinc-500 mt-0.5">
                  by {preset.artist}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search results candidates */}
      {matches.length > 0 && (
        <div className="mt-5 border-t border-zinc-100 pt-5">
          <p className="text-xs font-medium text-zinc-500 mb-3 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Select the matching song to view its genres:
          </p>
          <div className="space-y-2">
            {matches.map((match, idx) => (
              <button
                key={`${match.title}-${match.artist}-${idx}`}
                id={`match-option-${idx}`}
                onClick={() => selectMatch(match)}
                className="w-full p-4 bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/60 rounded-xl transition-all text-left flex items-start gap-3 group cursor-pointer"
              >
                <div className="p-2 bg-white rounded-lg border border-zinc-200/50 text-zinc-500 group-hover:text-zinc-950 transition-colors">
                  <Music className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-zinc-900 truncate group-hover:text-zinc-950">
                      {match.title}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-0.5 shrink-0">
                      <Calendar className="w-3 h-3" /> {match.releaseYear}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500 block truncate mt-0.5">
                    by {match.artist}
                  </span>
                  
                  {/* Small genre tags display */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[9px] font-semibold bg-zinc-900 text-white px-2 py-0.5 rounded-md">
                      {match.primaryGenre}
                    </span>
                    {match.genres.filter(g => g !== match.primaryGenre).slice(0, 3).map((g, gi) => (
                      <span key={gi} className="text-[9px] font-medium bg-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded-md">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="self-center text-zinc-300 group-hover:text-zinc-600 transition-colors shrink-0">
                  <CornerDownRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
