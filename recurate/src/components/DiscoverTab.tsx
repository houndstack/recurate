import { useEffect, useMemo, useState } from "react";
import React from "react";
import AnimeCard from "./AnimeCard";
import { fetchRecommendations } from "../api";
import AnimeSearchInput from "./AnimeSearchInput";
import type { Recommendation } from "../types";
import type { AniListResult } from "../api/anilist";

type SortMode = "match" | "score";

export default function DiscoverTab() {
  const [selected, setSelected] = useState<AniListResult[]>([]);
  const [results, setResults] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showWakeMessage, setShowWakeMessage] = useState(false);
  const [error, setError] = useState("");

  const [k, setK] = useState(8);
  const [minScore, setMinScore] = useState(65);
  const [sortMode, setSortMode] = useState<SortMode>("match");

  const recommend = async () => {
    setLoading(true);
    setError("");

    try {
      const recs = await fetchRecommendations(
        selected.map((a) => a.id),
        k
      );
      setResults(recs);
    } catch {
      setError("Could not load recommendations. Check API connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  function removeAnime(id: number) {
    setSelected((prev) => prev.filter((a) => a.id !== id));
  }

  useEffect(() => {
    if (!loading) {
      setShowWakeMessage(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowWakeMessage(true);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [loading]);

  const filteredResults = useMemo(() => {
    const next = results.filter((anime) => anime.score >= minScore);
    next.sort((a, b) =>
      sortMode === "score" ? b.score - a.score : b.similarity - a.similarity
    );
    return next;
  }, [minScore, results, sortMode]);

  return (
    <div className="h-full overflow-auto px-6 py-6 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 overflow-hidden rounded-3xl border border-white/50 bg-white/60 p-6 shadow-2xl shadow-slate-900/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-black/20">
          <div className="mb-6">
            <p className="mb-2 inline-flex rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium tracking-wide text-cyan-700 dark:text-cyan-300">
              ANIME DISCOVERY
            </p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Recurate
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Pick favorites, then tune recommendations by match strength and score.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <AnimeSearchInput
              onAdd={(anime) =>
                setSelected((prev) =>
                  prev.find((a) => a.id === anime.id) ? prev : [...prev, anime]
                )
              }
            />
            <button
              onClick={recommend}
              disabled={selected.length === 0 || loading}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Finding..." : "Get Recommendations"}
            </button>
          </div>

          <div className="mt-4 grid gap-4 rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/50 md:grid-cols-3">
            <label className="text-xs">
              <span className="mb-2 block font-semibold tracking-wide text-slate-700 dark:text-slate-300">
                Number of Results ({k})
              </span>
              <input
                type="range"
                min={4}
                max={20}
                value={k}
                onChange={(e) => setK(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </label>

            <label className="text-xs">
              <span className="mb-2 block font-semibold tracking-wide text-slate-700 dark:text-slate-300">
                Minimum Score ({minScore})
              </span>
              <input
                type="range"
                min={40}
                max={95}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </label>

            <label className="text-xs">
              <span className="mb-2 block font-semibold tracking-wide text-slate-700 dark:text-slate-300">
                Sort By
              </span>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="w-full rounded-lg border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="match">Best Match</option>
                <option value="score">Highest Score</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {selected.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Add at least one anime to start.
              </p>
            )}
            {selected.map((anime) => (
              <button
                key={anime.id}
                onClick={() => removeAnime(anime.id)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-xs text-slate-700 transition hover:border-rose-400 hover:text-rose-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-rose-500 dark:hover:text-rose-300"
              >
                <img
                  src={anime.coverImage}
                  alt={anime.title}
                  className="h-6 w-5 rounded object-cover"
                />
                {anime.title}
                <span className="font-semibold">x</span>
              </button>
            ))}
          </div>
        </header>

        {error && (
          <p className="mb-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
            {error}
          </p>
        )}
        {loading && showWakeMessage && (
          <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            Backend may be waking up on Render free tier. This can take ~30-60 seconds.
          </p>
        )}

        {loading ? (
          <section className="grid grid-cols-2 gap-4 pb-8 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: k }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-200/80 dark:border-slate-800 dark:bg-slate-800/70"
              />
            ))}
          </section>
        ) : (
          <section className="grid grid-cols-2 gap-4 pb-8 sm:grid-cols-3 md:grid-cols-4">
            {filteredResults.map((anime, index) => (
              <AnimeCard key={anime.id} anime={anime} index={index} />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
