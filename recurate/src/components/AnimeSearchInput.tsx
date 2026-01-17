import { useEffect, useState } from "react";
import { searchAnime, type AniListResult } from "../api/anilist";
import React from "react"

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
    }, 300); // debounce

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="relative w-full max-w-xl">
      <input
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Search anime…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg">
          {results.map((anime) => (
            <button
              key={anime.id}
              onClick={() => {
                onAdd(anime);
                setQuery("");
                setResults([]);
              }}
              className="flex w-full items-center gap-3 px-3 py-2 hover:bg-gray-100"
            >
              <img
                src={anime.coverImage}
                className="h-12 w-9 rounded object-cover"
              />
              <span className="text-sm font-medium">{anime.title}</span>
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="absolute right-3 top-2 text-sm text-gray-400">
          searching…
        </div>
      )}
    </div>
  );
}
