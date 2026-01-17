import { useState } from "react";
import React from "react"
//import AnimeInput from "./components/AnimeInput";
import AnimeCard from "./components/AnimeCard";
import { fetchRecommendations } from "./api";
//import { type Recommendation } from "./types";

import { useDarkMode } from "./hooks/useDarkMode";
import AnimeSearchInput from "./components/AnimeSearchInput";




export default function App() {
  const { dark, toggle } = useDarkMode();
  const [selected, setSelected] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const recommend = async () => {
    setLoading(true);
    const recs = await fetchRecommendations(
      selected.map((a) => a.id),
      8
    );
    setResults(recs);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Anime Recommendation Engine
            </h1>
            <p className="mt-2 max-w-2xl text-gray-600 dark:text-gray-400">
              Content-based recommendations using latent similarity.
            </p>
          </div>

          <button
            onClick={toggle}
            className="rounded-lg border px-3 py-2 text-sm dark:border-gray-700 dark:text-gray-200"
          >
            {dark ? "Light mode" : "Dark mode"}
          </button>
        </header>


        <div className="flex gap-4 items-start">
          <AnimeSearchInput
            onAdd={(anime) =>
              setSelected((prev) =>
                prev.find((a) => a.id === anime.id)
                  ? prev
                  : [...prev, anime]
              )
            }
          />
          <button
            onClick={recommend}
            disabled={selected.length === 0}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium disabled:opacity-50"
          >
            Recommend
          </button>
        </div>
        {/* Selected anime */}
        {selected.length > 0 && (
          <div className="mt-6 flex gap-3 flex-wrap">
            {selected.map((a) => (
              <span
                key={a.id}
                className="rounded-full bg-gray-200 dark:bg-gray-800 px-3 py-1 text-sm"
              >
                {a.title}
              </span>
            ))}
          </div>
        )}

        {/* Results */}
        <section className="mt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 rounded-xl bg-gray-200 animate-pulse"
                />
              ))
            : results.map((anime) => (
                <AnimeCard key={anime.title} anime={anime} />
              ))}
        </section>
      </div>
    </div>
  );
}
