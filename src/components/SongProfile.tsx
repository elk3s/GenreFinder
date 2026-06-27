import React, { useState, useEffect } from "react";
import { Music, Sliders, Play, Square, Info, Check, Sparkles, Loader2, GitBranch, Volume2 } from "lucide-react";
import { SongMatch } from "../types";
import AudioVisualizer from "./AudioVisualizer";

interface SongProfileProps {
  song: SongMatch;
  onGenerateSuggestions: (selectedGenres: string[], focusAttribute: string, count: number) => void;
  isGenerating: boolean;
  onPlayPreview: (title: string, artist: string, genre: string, previewUrl?: string) => void;
  onStopPreview: () => void;
  activePreview: { title: string; artist: string } | null;
  previewAnalyser: AnalyserNode | null;
  previewProgress: number;
}

export default function SongProfile({
  song,
  onGenerateSuggestions,
  isGenerating,
  onPlayPreview,
  onStopPreview,
  activePreview,
  previewAnalyser,
  previewProgress,
}: SongProfileProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [focusAttribute, setFocusAttribute] = useState<string>("hybrid");
  const [count, setCount] = useState<number>(10);

  // Sync state when song changes
  useEffect(() => {
    setSelectedGenres(song.genres);
  }, [song]);

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      if (selectedGenres.length > 1) {
        setSelectedGenres(selectedGenres.filter((g) => g !== genre));
      }
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const selectAllGenres = () => {
    setSelectedGenres(song.genres);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerateSuggestions(selectedGenres, focusAttribute, count);
  };

  const isCurrentPreviewPlaying = 
    activePreview && 
    activePreview.title.toLowerCase() === song.title.toLowerCase() && 
    activePreview.artist.toLowerCase() === song.artist.toLowerCase();

  const handlePreviewClick = () => {
    if (isCurrentPreviewPlaying) {
      onStopPreview();
    } else {
      onPlayPreview(song.title, song.artist, song.primaryGenre, song.previewUrl);
    }
  };

  // Generate dynamic taxonomy tree branches if not provided by server
  const buildTaxonomyTree = () => {
    if (song.genreBranches && song.genreBranches.length > 0) {
      return song.genreBranches;
    }

    // Dynamic heuristic fallbacks to ensure every searched song displays a stunning branching tree
    const pGenre = (song.primaryGenre || "Pop").toLowerCase();
    if (pGenre.includes("amapiano")) {
      return ["Electronic Soundscapes", "House Music", "South African Amapiano", "Private School log-drum vibe"];
    } else if (pGenre.includes("synth") || pGenre.includes("dance-pop") || pGenre.includes("retro") || pGenre.includes("disco")) {
      return ["Electronic & Pop", "Synth-pop", "80s New Wave", "Modern Neon-Retro"];
    } else if (pGenre.includes("rock") || pGenre.includes("indie") || pGenre.includes("alternative")) {
      return ["Alternative Music", "Indie Rock", "Reverb Guitars", "Post-punk Revival"];
    } else if (pGenre.includes("r&b") || pGenre.includes("soul") || pGenre.includes("lo-fi")) {
      return ["Urban & Soul", "Contemporary R&B", "Neo-soul", "Lo-Fi Midnight Melodies"];
    } else if (pGenre.includes("afrobeats") || pGenre.includes("afro")) {
      return ["Global Beats", "Afrobeats", "Afro-Pop fusion", "West African Shaker Grooves"];
    }
    return ["Music Spectrum", "Contemporary Styles", song.primaryGenre, ...song.genres.filter(g => g !== song.primaryGenre).slice(0, 1)];
  };

  const treeBranches = buildTaxonomyTree();

  return (
    <div id="song-profile" className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-xs space-y-6">
      
      {/* Song Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-zinc-900 text-white rounded-xl shadow-xs self-start shrink-0 relative group">
            <Music className={`w-6 h-6 ${isCurrentPreviewPlaying ? 'animate-pulse text-emerald-400' : ''}`} />
            {isCurrentPreviewPlaying && (
              <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h3 className="text-xl font-bold text-zinc-900 truncate">{song.title}</h3>
              <span className="text-xs font-mono text-zinc-400 shrink-0">{song.releaseYear}</span>
            </div>
            <p className="text-sm font-medium text-zinc-600 truncate mt-0.5">by {song.artist}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] font-extrabold bg-zinc-950 text-white px-2.5 py-1 rounded-md tracking-wider uppercase">
                {song.primaryGenre} (Primary)
              </span>
            </div>
          </div>
        </div>

        {/* 20s Audio Preview Panel */}
        <div className="sm:self-center bg-zinc-50 border border-zinc-100 rounded-xl p-3 flex flex-col gap-2 min-w-[220px] shadow-2xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <Volume2 className={`w-4 h-4 ${isCurrentPreviewPlaying ? 'text-emerald-500 animate-bounce' : 'text-zinc-400'}`} />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Chorus Preview</span>
            </div>
            {isCurrentPreviewPlaying && (
              <span className="text-[10px] font-mono font-bold text-emerald-600">
                {Math.floor(previewProgress)}s / 20s
              </span>
            )}
          </div>

          <button
            type="button"
            id="play-chorus-preview-btn"
            onClick={handlePreviewClick}
            className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isCurrentPreviewPlaying
                ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            {isCurrentPreviewPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-red-700" />
                <span>Stop Preview</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-emerald-800" />
                <span>Play Chorus Preview</span>
              </>
            )}
          </button>

          {/* Real-time spectrum visualizer */}
          <div className="h-6 overflow-hidden">
            <AudioVisualizer isPlaying={isCurrentPreviewPlaying} analyser={isCurrentPreviewPlaying ? previewAnalyser : null} height={24} />
          </div>
        </div>
      </div>

      {/* Description blurb */}
      <div className="bg-zinc-50/50 rounded-xl p-4 border border-zinc-100 flex items-start gap-3">
        <Info className="w-4.5 h-4.5 text-zinc-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Musicology Profile</p>
          <p className="text-xs text-zinc-600 leading-relaxed font-medium">{song.description}</p>
        </div>
      </div>

      {/* TREE ANALOGY: Cascading Genre Taxonomy Tree */}
      <div className="bg-zinc-50/30 rounded-2xl border border-zinc-100 p-4 space-y-3.5">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-zinc-600" />
          <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">🌳 Genre Branching Taxonomy</h4>
        </div>
        <p className="text-[11px] text-zinc-400 leading-normal">
          How this track branches out from a broad cultural roots umbrella, through mid-level subgenres, down to micro-genres:
        </p>

        {/* Tree branch list with connector visual lines */}
        <div className="pl-2 space-y-1 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-100">
          {treeBranches.map((branch, i) => {
            const isLast = i === treeBranches.length - 1;
            return (
              <div key={branch + i} className="flex items-start gap-3 relative group py-1">
                {/* Visual Branch circle Node */}
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 z-10 transition-all ${
                  isLast 
                    ? "bg-zinc-900 border-2 border-white ring-2 ring-zinc-900/40 animate-pulse scale-110" 
                    : "bg-zinc-300 border-2 border-white group-hover:bg-zinc-500"
                }`}></div>
                
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                    {i === 0 ? "Root Trunk" : i === 1 ? "Major Limb" : i === 2 ? "Sub-Branch" : "Micro-Leaf"}
                  </span>
                  <span className={`text-xs font-bold leading-none ${isLast ? "text-zinc-900 font-extrabold" : "text-zinc-600"}`}>
                    {branch}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Genre Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">1. Filter Genres to Target</label>
            <button
              type="button"
              id="select-all-genres-btn"
              onClick={selectAllGenres}
              className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              Reset to all
            </button>
          </div>
          <p className="text-[11px] text-zinc-400 mb-2.5 leading-snug">
            Choose which sub-genres/mood classifications Gemini should focus on:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {song.genres.map((g) => {
              const isSelected = selectedGenres.includes(g);
              const isPrimary = g === song.primaryGenre;
              return (
                <button
                  type="button"
                  key={g}
                  id={`genre-toggle-${g.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => toggleGenre(g)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-zinc-900 border-zinc-900 text-white shadow-xs"
                      : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50/50"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  <span>{g}</span>
                  {isPrimary && (
                    <span className={`text-[8px] font-bold px-1 rounded ${
                      isSelected ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"
                    }`}>
                      Main
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Suggestion Mode Focus */}
        <div>
          <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block mb-2">2. Match Vibe Focus</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "genre", title: "Pure Genre", desc: "Focus on genre match" },
              { id: "mood", title: "Acoustic Vibe", desc: "Focus on sound mood" },
              { id: "hybrid", title: "Hybrid Match", desc: "Balanced blend" },
            ].map((option) => (
              <button
                type="button"
                key={option.id}
                id={`focus-option-${option.id}`}
                onClick={() => setFocusAttribute(option.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                  focusAttribute === option.id
                    ? "border-zinc-900 bg-zinc-50/50 ring-1 ring-zinc-900"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                <span className="text-xs font-bold text-zinc-800 leading-none">{option.title}</span>
                <span className="text-[10px] text-zinc-400 leading-tight mt-1">{option.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Suggestion Limit count */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">3. Suggested Songs Limit</label>
            <span className="text-xs font-bold font-mono text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-md">{count} tracks</span>
          </div>
          <div className="flex gap-2">
            {[5, 10, 15, 20].map((num) => (
              <button
                type="button"
                key={num}
                id={`count-option-${num}`}
                onClick={() => setCount(num)}
                className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  count === num
                    ? "bg-zinc-900 border-zinc-900 text-white"
                    : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Run Button */}
        <button
          type="submit"
          id="generate-suggestions-btn"
          disabled={isGenerating}
          className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:bg-zinc-100 disabled:text-zinc-400"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Decoding recommendations...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Similar Vibe Songs</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
