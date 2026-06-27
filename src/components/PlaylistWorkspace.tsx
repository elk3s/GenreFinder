import React, { useState, useMemo } from "react";
import { Music, Trash2, Copy, Download, Check, Sparkles, AlertCircle, FileSpreadsheet, ListMusic, ChevronRight, HelpCircle, Play, Square, Volume2, Cloud, CloudOff, LogIn, LogOut, Loader2, Save } from "lucide-react";
import { PlaylistSong } from "../types";
import { CloudPlaylist } from "../lib/playlistStore";
import { User } from "../lib/firebase";

interface PlaylistWorkspaceProps {
  songs: PlaylistSong[];
  playlistName: string;
  setPlaylistName: (name: string) => void;
  playlistDesc: string;
  setPlaylistDesc: (desc: string) => void;
  onRemoveSong: (idx: number) => void;
  onClearPlaylist: () => void;
  onPlayPreview: (title: string, artist: string, genre: string, previewUrl?: string) => void;
  onStopPreview: () => void;
  activePreview: { title: string; artist: string } | null;
  // Cloud additions
  user: User | null;
  cloudPlaylists: CloudPlaylist[];
  isSavingCloud: boolean;
  isLoadingCloud: boolean;
  onSaveToCloud: () => Promise<void>;
  onLoadCloudPlaylist: (playlist: CloudPlaylist) => void;
  onDeleteCloudPlaylist: (playlistId: string) => Promise<void>;
  onSignInWithGoogle: () => void;
}

export default function PlaylistWorkspace({
  songs,
  playlistName,
  setPlaylistName,
  playlistDesc,
  setPlaylistDesc,
  onRemoveSong,
  onClearPlaylist,
  onPlayPreview,
  onStopPreview,
  activePreview,
  user,
  cloudPlaylists,
  isSavingCloud,
  isLoadingCloud,
  onSaveToCloud,
  onLoadCloudPlaylist,
  onDeleteCloudPlaylist,
  onSignInWithGoogle,
}: PlaylistWorkspaceProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "export" | "stats" | "cloud">("list");
  const [showGuide, setShowGuide] = useState(false);

  // Compute genre statistics for dynamic SVG chart
  const genreStats = useMemo(() => {
    const stats: Record<string, number> = {};
    songs.forEach((song) => {
      // Add primary genre
      if (song.primaryGenre) {
        stats[song.primaryGenre] = (stats[song.primaryGenre] || 0) + 2; // Extra weight to primary
      }
      // Add other sub-genres
      song.genres.forEach((genre) => {
        if (genre !== song.primaryGenre) {
          stats[genre] = (stats[genre] || 0) + 1;
        }
      });
    });

    // Convert to sorted array
    return Object.entries(stats)
      .map(([genre, weight]) => ({ genre, weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5); // Show top 5 genres
  }, [songs]);

  // Max weight for scaling the SVG bars
  const maxWeight = useMemo(() => {
    if (genreStats.length === 0) return 1;
    return Math.max(...genreStats.map((s) => s.weight));
  }, [genreStats]);

  // 1. Copy to clipboard format (Optimized for TuneMyMusic / Soundiiz / Spotify search)
  const handleCopyToClipboard = () => {
    if (songs.length === 0) return;
    const text = songs.map((s) => `${s.title} - ${s.artist}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 2. Export M3U file
  const handleDownloadM3U = () => {
    if (songs.length === 0) return;
    let m3uContent = "#EXTM3U\n";
    songs.forEach((s) => {
      m3uContent += `#EXTINF:0,${s.artist} - ${s.title}\n`;
      m3uContent += `${s.title} - ${s.artist}\n`; // Fallback search query line
    });

    const blob = new Blob([m3uContent], { type: "audio/x-mpegurl" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${playlistName.toLowerCase().replace(/\s+/g, "-") || "my-vibe-playlist"}.m3u`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 3. Export CSV file
  const handleDownloadCSV = () => {
    if (songs.length === 0) return;
    let csvContent = "Title,Artist,Primary Genre,All Genres\n";
    songs.forEach((s) => {
      const escapedTitle = `"${s.title.replace(/"/g, '""')}"`;
      const escapedArtist = `"${s.artist.replace(/"/g, '""')}"`;
      const escapedPrimary = `"${s.primaryGenre.replace(/"/g, '""')}"`;
      const escapedGenres = `"${s.genres.join(", ").replace(/"/g, '""')}"`;
      csvContent += `${escapedTitle},${escapedArtist},${escapedPrimary},${escapedGenres}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${playlistName.toLowerCase().replace(/\s+/g, "-") || "my-vibe-playlist"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isPreviewPlaying = (title: string, artist: string) => {
    return activePreview && 
      activePreview.title.toLowerCase() === title.toLowerCase() && 
      activePreview.artist.toLowerCase() === artist.toLowerCase();
  };

  const handlePlayClick = (song: PlaylistSong) => {
    if (isPreviewPlaying(song.title, song.artist)) {
      onStopPreview();
    } else {
      onPlayPreview(song.title, song.artist, song.primaryGenre, song.previewUrl);
    }
  };

  return (
    <div id="playlist-workspace" className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-xs sticky top-6">
      <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-zinc-900 text-white rounded-lg shadow-xs">
            <ListMusic className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900">Playlist Creator</h2>
            <p className="text-[11px] text-zinc-500 font-mono font-medium">{songs.length} tracks compiled</p>
          </div>
        </div>
        {songs.length > 0 && (
          <button
            id="clear-playlist-btn"
            onClick={onClearPlaylist}
            className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/50 px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-50 border border-dashed border-zinc-200 flex items-center justify-center text-zinc-300 mb-4">
            <Music className="w-6 h-6 animate-pulse" />
          </div>
          <p className="text-sm font-semibold text-zinc-700">Your playlist is empty</p>
          <p className="text-xs text-zinc-400 max-w-[240px] mt-1 leading-relaxed">
            Generate recommendations and click "Add" to start crafting your customized music blend.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Metadata editor cards */}
          <div className="bg-zinc-50/50 rounded-xl p-4 border border-zinc-100 space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Playlist Name</label>
              <input
                id="playlist-name-input"
                type="text"
                className="w-full bg-white text-zinc-900 text-sm font-semibold px-3 py-2 rounded-lg border border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-hidden transition-all"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="Enter playlist name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Description</label>
              <textarea
                id="playlist-desc-textarea"
                rows={2}
                className="w-full bg-white text-zinc-800 text-xs px-3 py-2 rounded-lg border border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-hidden transition-all resize-none"
                value={playlistDesc}
                onChange={(e) => setPlaylistDesc(e.target.value)}
                placeholder="Describe your playlist vibe"
              />
            </div>
          </div>

          {/* Navigation tabs inside Workspace */}
          <div className="flex border-b border-zinc-100 text-xs">
            <button
              id="workspace-tab-list"
              onClick={() => setActiveTab("list")}
              className={`flex-1 py-2 text-center font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "list"
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-400 hover:text-zinc-600"
              }`}
            >
              List ({songs.length})
            </button>
            <button
              id="workspace-tab-stats"
              onClick={() => setActiveTab("stats")}
              className={`flex-1 py-2 text-center font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "stats"
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-400 hover:text-zinc-600"
              }`}
            >
              Stats
            </button>
            <button
              id="workspace-tab-export"
              onClick={() => setActiveTab("export")}
              className={`flex-1 py-2 text-center font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "export"
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-400 hover:text-zinc-600"
              }`}
            >
              Export
            </button>
            <button
              id="workspace-tab-cloud"
              onClick={() => setActiveTab("cloud")}
              className={`flex-1 py-2 text-center font-semibold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === "cloud"
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <Cloud className="w-3.5 h-3.5 shrink-0" />
              <span>Cloud {user ? `(${cloudPlaylists.length})` : ""}</span>
            </button>
          </div>

          {/* Tab Content: Songs list */}
          {activeTab === "list" && (
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {songs.map((song, idx) => {
                const playing = isPreviewPlaying(song.title, song.artist);
                return (
                  <div
                    key={`${song.title}-${idx}`}
                    id={`playlist-item-${idx}`}
                    className={`group flex items-center justify-between p-3 border rounded-xl transition-all ${
                      playing
                        ? "bg-emerald-50/40 border-emerald-200"
                        : "bg-zinc-50 hover:bg-zinc-100/50 border-zinc-100"
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="text-xs font-bold text-zinc-900 truncate leading-snug group-hover:text-zinc-950">
                          {song.title}
                        </h4>
                        {playing && (
                          <Volume2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">by {song.artist}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[8px] font-mono font-semibold bg-zinc-200 text-zinc-700 px-1 rounded">
                          {song.primaryGenre}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Play Preview button */}
                      <button
                        onClick={() => handlePlayClick(song)}
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                          playing
                            ? "bg-emerald-100 text-emerald-800"
                            : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
                        }`}
                        title={playing ? "Stop preview" : "Play preview"}
                      >
                        {playing ? (
                          <Square className="w-3 h-3 fill-emerald-800" />
                        ) : (
                          <Play className="w-3 h-3 fill-zinc-400" />
                        )}
                      </button>

                      <button
                        id={`remove-playlist-item-btn-${idx}`}
                        onClick={() => onRemoveSong(idx)}
                        className="p-1.5 hover:bg-red-50 text-zinc-300 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                        title="Remove from playlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab Content: Stats/Analytics */}
          {activeTab === "stats" && (
            <div className="space-y-4 py-2">
              <div>
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Vibe Composition</p>
                <p className="text-xs text-zinc-400 mb-4 leading-normal">
                  Based on primary classification (weighted heavier) and secondary styles compiled in your playlist.
                </p>
              </div>

              {genreStats.length === 0 ? (
                <p className="text-xs text-zinc-400">Add songs to see stats.</p>
              ) : (
                <div className="space-y-3.5">
                  {genreStats.map((stat, i) => {
                    const pct = Math.round((stat.weight / maxWeight) * 100);
                    return (
                      <div key={stat.genre} id={`genre-stat-row-${i}`} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-800">{stat.genre}</span>
                          <span className="font-mono text-zinc-500 font-medium">score: {stat.weight}</span>
                        </div>
                        {/* Dynamic SVG / Div horizontal bar */}
                        <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-zinc-900 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Export Systems */}
          {activeTab === "export" && (
            <div className="space-y-4 py-2">
              <div>
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Export Anywhere</p>
                <p className="text-xs text-zinc-400 leading-normal">
                  Stream services don't support native direct write interfaces without tedious authentication. Choose a clean method below:
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {/* 1. Clipboard Copy */}
                <button
                  id="export-copy-clipboard-btn"
                  onClick={handleCopyToClipboard}
                  className="p-3 bg-zinc-950 text-white rounded-xl hover:bg-zinc-800 transition-colors flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Copy className="w-4 h-4" />
                    <div>
                      <p className="text-xs font-bold leading-none">Copy Song List</p>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-none">Optimized for Song Converters & Search</p>
                    </div>
                  </div>
                  <div className="p-1 bg-white/10 rounded-md">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />}
                  </div>
                </button>

                {/* 2. Download M3U */}
                <button
                  id="export-download-m3u-btn"
                  onClick={handleDownloadM3U}
                  className="p-3 bg-white border border-zinc-200 rounded-xl hover:border-zinc-300 hover:bg-zinc-50/50 transition-colors flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 text-zinc-800">
                    <Download className="w-4 h-4 text-zinc-500" />
                    <div>
                      <p className="text-xs font-bold leading-none">Download .m3u File</p>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-none">Standard audio playlist format</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </button>

                {/* 3. Download CSV */}
                <button
                  id="export-download-csv-btn"
                  onClick={handleDownloadCSV}
                  className="p-3 bg-white border border-zinc-200 rounded-xl hover:border-zinc-300 hover:bg-zinc-50/50 transition-colors flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 text-zinc-800">
                    <FileSpreadsheet className="w-4 h-4 text-zinc-500" />
                    <div>
                      <p className="text-xs font-bold leading-none">Download .csv SpreadSheet</p>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-none">Structured song list with metadata</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              </div>

              {/* Guide trigger */}
              <div className="mt-3">
                <button
                  id="toggle-guide-btn"
                  onClick={() => setShowGuide(!showGuide)}
                  className="w-full py-2 bg-zinc-100 hover:bg-zinc-200/60 text-zinc-700 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showGuide ? "Hide Import Guide" : "How do I import this?"}</span>
                </button>

                {showGuide && (
                  <div className="mt-3 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/50 text-[11px] text-zinc-600 leading-relaxed space-y-2">
                    <p className="font-bold text-zinc-800">Easy 2-Step Import Guide:</p>
                    
                    <div className="space-y-1 pt-1">
                      <p className="font-semibold text-zinc-800">Step 1. Copy your track list</p>
                      <p className="text-zinc-500">Click the <strong className="text-zinc-700">"Copy Song List"</strong> button above to save the structured tracklist in your clipboard.</p>
                    </div>

                    <div className="space-y-1">
                      <p className="font-semibold text-zinc-800">Step 2. Load into Spotify, Apple Music, or YouTube Music</p>
                      <ul className="list-disc list-inside text-zinc-500 space-y-1.5">
                        <li>Go to a free converter like <strong className="text-zinc-700">TuneMyMusic.com</strong> or <strong className="text-zinc-700">Soundiiz.com</strong>.</li>
                        <li className="pl-2">
                          On <strong className="text-zinc-700">TuneMyMusic.com</strong>: Click <strong className="text-zinc-700">"Let's Start"</strong>, select <strong className="text-zinc-700">"Upload File"</strong> or <strong className="text-zinc-700">"Text"</strong> as the source, paste your song list, or upload the downloaded <strong className="text-zinc-700">.m3u</strong> file.
                        </li>
                        <li className="pl-2">
                          On <strong className="text-zinc-700">Soundiiz.com</strong>: Log in, click <strong className="text-zinc-700">"Import Playlist"</strong> in the sidebar or top toolbar, select <strong className="text-zinc-700">"From File"</strong> or <strong className="text-zinc-700">"Plain Text"</strong>, and paste your tracklist or upload the <strong className="text-zinc-700">.m3u</strong> file.
                        </li>
                        <li>Choose your target destination (like <strong className="text-zinc-700">Spotify, Apple Music, or YouTube Music</strong>) to match the tracks and automatically sync the playlist to your music library!</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Content: Cloud Systems */}
          {activeTab === "cloud" && (
            <div className="space-y-4 py-2 animate-fadeIn">
              {!user ? (
                <div className="space-y-4 text-center py-6">
                  <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-full flex items-center justify-center mx-auto text-zinc-400">
                    <CloudOff className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-800">Secure Cloud Sync</p>
                    <p className="text-[11px] text-zinc-400 max-w-[220px] mx-auto leading-normal">
                      Sign in with Google to securely save your curated music blends, access them on any device, and preserve your work.
                    </p>
                  </div>
                  <button
                    onClick={onSignInWithGoogle}
                    className="mx-auto px-4 py-2 bg-white border border-zinc-200 text-zinc-800 rounded-xl hover:bg-zinc-50 transition-colors text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.66-.23-1.23-.63-1.67-1.11z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign In with Google</span>
                  </button>

                  {typeof window !== "undefined" && window.self !== window.top && (
                    <div className="mx-auto max-w-[260px] p-2.5 bg-amber-50/70 border border-amber-100 rounded-xl text-left mt-3">
                      <p className="text-[10px] text-amber-800 leading-normal font-medium">
                        <strong>🔒 Preview Environment:</strong> Browser security blocks login popups within developer frames. Click <strong>"Open in New Tab"</strong> in the top-right corner of the workspace to sign in securely.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Cloud save workspace panel */}
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Save Current Workspace</span>
                      <span className="text-[9px] font-mono font-semibold bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-sm">
                        {songs.length} tracks
                      </span>
                    </div>
                    <button
                      onClick={onSaveToCloud}
                      disabled={isSavingCloud || songs.length === 0}
                      className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 text-white rounded-xl transition-all cursor-pointer font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      {isSavingCloud ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving to Cloud Vault...</span>
                        </>
                      ) : (
                        <>
                          <Cloud className="w-3.5 h-3.5" />
                          <span>Save current to Cloud</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* List of saved cloud playlists */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Your Saved Blends ({cloudPlaylists.length})</p>
                    
                    {isLoadingCloud ? (
                      <div className="flex items-center justify-center py-6 text-zinc-400 gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs font-medium">Loading Cloud Vault...</span>
                      </div>
                    ) : cloudPlaylists.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-zinc-200 rounded-xl">
                        <p className="text-xs font-semibold text-zinc-500">No saved blends yet</p>
                        <p className="text-[10px] text-zinc-400 mt-1 max-w-[180px] mx-auto leading-normal">
                          Compile some songs and click "Save current to Cloud" above to build your vault!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                        {cloudPlaylists.map((playlist) => (
                          <div
                            key={playlist.id}
                            className="p-3 bg-zinc-50 hover:bg-zinc-100/50 border border-zinc-100 rounded-xl space-y-2 flex flex-col justify-between"
                          >
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-zinc-900 truncate leading-tight">
                                {playlist.name}
                              </h4>
                              {playlist.description && (
                                <p className="text-[10px] text-zinc-400 truncate mt-0.5 leading-snug">
                                  {playlist.description}
                                </p>
                              )}
                              <span className="inline-block text-[9px] font-mono font-semibold bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-xs mt-1">
                                {playlist.songs?.length || 0} tracks
                              </span>
                            </div>
                            <div className="flex items-center gap-2 pt-1 border-t border-zinc-200/40">
                              <button
                                onClick={() => onLoadCloudPlaylist(playlist)}
                                className="flex-1 py-1 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center"
                              >
                                Load
                              </button>
                              <button
                                onClick={() => onDeleteCloudPlaylist(playlist.id)}
                                className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                title="Delete from Cloud"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
