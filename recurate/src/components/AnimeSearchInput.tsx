import { useEffect, useState } from "react";
import { searchAnime, type AniListResult } from "../api/anilist";
import React from "react";

interface Props {
  onAdd: (anime: AniListResult) => void;
}

export default function AnimeSearchInput({ onAdd }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AniListResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      const res = await searchAnime(query);
      setResults(res);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="relative w-full">
      <input
        className="w-full rounded-xl border border-slate-300/70 bg-white/80 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:bg-slate-900"
        placeholder="Search anime title..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {results.length > 0 && (
        <div className="absolute z-10 mt-2 max-h-96 w-full overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          {results.map((anime) => (
            <button
              key={anime.id}
              onClick={() => {
                onAdd(anime);
                setQuery("");
                setResults([]);
              }}
              className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <img
                src={anime.coverImage}
                alt={anime.title}
                className="h-12 w-9 rounded object-cover"
              />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {anime.title}
              </span>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="absolute right-3 top-3 text-xs text-slate-500 dark:text-slate-400">
          searching...
        </div>
      )}
    </div>
  );
}
