import React from "react";
import { Plus, Check, Music, Star, Zap, Flame, Sparkles, CheckCheck, Play, Square, Volume2 } from "lucide-react";
import { SongSuggestion, PlaylistSong } from "../types";

interface SuggestionsListProps {
  suggestions: SongSuggestion[];
  playlistSongs: PlaylistSong[];
  onAddSong: (song: SongSuggestion) => void;
  onAddAllSongs: () => void;
  onPlayPreview: (title: string, artist: string, genre: string, previewUrl?: string) => void;
  onStopPreview: () => void;
  activePreview: { title: string; artist: string } | null;
}

export default function SuggestionsList({
  suggestions,
  playlistSongs,
  onAddSong,
  onAddAllSongs,
  onPlayPreview,
  onStopPreview,
  activePreview,
}: SuggestionsListProps) {
  
  const isSongInPlaylist = (title: string, artist: string) => {
    return playlistSongs.some(
      (s) => s.title.toLowerCase() === title.toLowerCase() && s.artist.toLowerCase() === artist.toLowerCase()
    );
  };

  const getEnergyBadgeColor = (energy: string) => {
    switch (energy.toLowerCase()) {
      case "high":
        return "bg-amber-50 text-amber-700 border-amber-200/50";
      case "low":
        return "bg-cyan-50 text-cyan-700 border-cyan-200/50";
      default:
        return "bg-zinc-50 text-zinc-600 border-zinc-200/50";
    }
  };

  const isPreviewPlaying = (title: string, artist: string) => {
    return activePreview && 
      activePreview.title.toLowerCase() === title.toLowerCase() && 
      activePreview.artist.toLowerCase() === artist.toLowerCase();
  };

  const handlePreviewClick = (item: SongSuggestion) => {
    if (isPreviewPlaying(item.title, item.artist)) {
      onStopPreview();
    } else {
      onPlayPreview(item.title, item.artist, item.primaryGenre, item.previewUrl);
    }
  };

  return (
    <div id="suggestions-list-section" className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-xs">
      <div className="flex items-center justify-between mb-5 border-b border-zinc-100 pb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 leading-snug">Similar Vibe Matches</h2>
            <p className="text-xs text-zinc-500 font-medium">Gemini-analyzed tracks with matching genres and textures</p>
          </div>
        </div>

        {suggestions.length > 0 && (
          <button
            id="add-all-suggestions-btn"
            onClick={onAddAllSongs}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add All to Playlist</span>
          </button>
        )}
      </div>

      {suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 bg-zinc-50 rounded-full text-zinc-300 border border-zinc-100 mb-3 animate-pulse">
            <Music className="w-8 h-8" />
          </div>
          <p className="text-sm font-semibold text-zinc-700">No suggestions yet</p>
          <p className="text-xs text-zinc-400 max-w-xs mt-1">
            Search and select a song above, then click "Generate Similar Vibe Songs" to load recommendations.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((item, idx) => {
            const added = isSongInPlaylist(item.title, item.artist);
            const playing = isPreviewPlaying(item.title, item.artist);

            return (
              <div
                key={`${item.title}-${item.artist}-${idx}`}
                id={`suggestion-card-${idx}`}
                className={`group relative p-4 border rounded-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  playing
                    ? "bg-emerald-50/40 border-emerald-200"
                    : "bg-zinc-50/40 hover:bg-zinc-50/80 border-zinc-100 hover:border-zinc-200/60"
                }`}
              >
                {/* Main Song Metadata */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start gap-3">
                    {/* Score badge / Play button combo */}
                    <div className="relative group/play flex-shrink-0">
                      <button
                        onClick={() => handlePreviewClick(item)}
                        className={`absolute inset-0 flex items-center justify-center rounded-lg transition-all z-10 cursor-pointer ${
                          playing
                            ? "bg-emerald-600/90 text-white"
                            : "bg-black/40 text-white opacity-0 group-hover/play:opacity-100"
                        }`}
                        title={playing ? "Stop preview" : "Play preview"}
                      >
                        {playing ? (
                          <Square className="w-4 h-4 fill-white" />
                        ) : (
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        )}
                      </button>

                      <div className={`flex flex-col items-center justify-center w-11 h-11 rounded-lg text-white shrink-0 select-none ${
                        playing ? "bg-emerald-600" : "bg-zinc-900 border border-zinc-950"
                      }`}>
                        <span className="text-[9px] font-semibold text-zinc-300 font-mono leading-none">FIT</span>
                        <span className="text-sm font-bold font-mono mt-0.5 leading-none">{item.suitabilityScore}%</span>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-zinc-900 truncate leading-snug group-hover:text-emerald-950">
                          {item.title}
                        </h4>
                        {playing && (
                          <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-600 bg-emerald-100/60 px-1.5 py-0.5 rounded animate-pulse">
                            <Volume2 className="w-3 h-3 animate-bounce" /> Playing Preview
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">by {item.artist}</p>
                    </div>
                  </div>

                  {/* Why it matches */}
                  <div className="pl-14 text-[11px] text-zinc-600 leading-relaxed italic border-l-2 border-zinc-200 mt-2">
                    "{item.matchingReason}"
                  </div>

                  {/* Badges / Genres */}
                  <div className="pl-14 flex flex-wrap items-center gap-1.5 mt-2">
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 shrink-0 ${getEnergyBadgeColor(item.energyLevel)}`}>
                      <Zap className="w-2.5 h-2.5" />
                      {item.energyLevel} Energy
                    </span>
                    <span className="text-[9px] font-semibold bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded-md">
                      {item.primaryGenre}
                    </span>
                    {item.genres.filter(g => g !== item.primaryGenre).slice(0, 2).map((g, gi) => (
                      <span key={gi} className="text-[9px] font-medium bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-md">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Add to Playlist button */}
                <div className="flex items-center gap-2 md:self-center self-end pl-14 md:pl-0 shrink-0">
                  <button
                    id={`add-song-btn-${idx}`}
                    onClick={() => onAddSong(item)}
                    disabled={added}
                    className={`h-9 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      added
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed"
                        : "bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-200 shadow-xs"
                    }`}
                  >
                    {added ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
