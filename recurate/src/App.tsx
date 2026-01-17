import { useState } from "react";
import React from "react"
//import AnimeInput from "./components/AnimeInput";
import AnimeCard from "./components/AnimeCard";
import { fetchRecommendations } from "./api";

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

  function removeAnime(id: number) {
    setSelected(prev => prev.filter(a => a.id !== id))
  }


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
        <div className="flex flex-wrap gap-3 mt-4">
          {selected.map(anime => (
            <div
              key={anime.id}
              className="
                flex items-center gap-3
                bg-gray-100 dark:bg-gray-800
                border border-gray-300 dark:border-gray-700
                rounded-xl px-3 py-2
                shadow-sm
              "
            >
              <img
                src={anime.coverImage}
                alt={anime.title}
                className="w-10 h-14 rounded object-cover"
              />

              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {anime.title}
              </span>

              <button
                onClick={() => removeAnime(anime.id)}
                className="
                  ml-2 text-gray-500 hover:text-red-500
                  dark:text-gray-400 dark:hover:text-red-400
                  transition-colors
                "
                aria-label="Remove anime"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        

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
