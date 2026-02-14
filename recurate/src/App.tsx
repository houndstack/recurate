import { useMemo, useState } from "react";
import React from "react";
import AnimeCard from "./components/AnimeCard";
import { fetchRecommendations } from "./api";
import { useDarkMode } from "./hooks/useDarkMode";
import AnimeSearchInput from "./components/AnimeSearchInput";
import type { Recommendation } from "./types";
import type { AniListResult } from "./api/anilist";
import AnimeMapTab from "./components/AnimeMapTab";

type SortMode = "match" | "score";
type ViewTab = "discover" | "map";

export default function App() {
  const { dark, toggle } = useDarkMode();
  const [selected, setSelected] = useState<AniListResult[]>([]);
  const [results, setResults] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [k, setK] = useState(8);
  const [minScore, setMinScore] = useState(65);
  const [sortMode, setSortMode] = useState<SortMode>("match");
  const [tab, setTab] = useState<ViewTab>("discover");

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

  const filteredResults = useMemo(() => {
    const next = results.filter((anime) => anime.score >= minScore);

    next.sort((a, b) =>
      sortMode === "score"
        ? b.score - a.score
        : b.similarity - a.similarity
    );

    return next;
  }, [minScore, results, sortMode]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,#f8fafc_35%,#f1f5f9_60%,#e2e8f0_100%)] text-slate-900 transition-colors dark:bg-[radial-gradient(circle_at_top_left,#0f172a_0%,#020617_45%,#000000_100%)] dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-8 overflow-hidden rounded-3xl border border-white/50 bg-white/60 p-6 shadow-2xl shadow-slate-900/5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-black/20">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium tracking-wide text-cyan-700 dark:text-cyan-300">
                ANIME DISCOVERY
              </p>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Recurate
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                Discover recommendations or explore the interactive similarity
                map where connected clusters reveal related anime.
              </p>
            </div>

            <button
              onClick={toggle}
              className="rounded-xl border border-slate-300 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
            >
              {dark ? "Switch to Light" : "Switch to Dark"}
            </button>
          </div>

          <div className="mb-4 inline-flex rounded-xl border border-slate-300/80 bg-white/80 p-1 dark:border-slate-700 dark:bg-slate-900/70">
            <button
              onClick={() => setTab("discover")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                tab === "discover"
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                  : "text-slate-700 hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-300"
              }`}
            >
              Discover
            </button>
            <button
              onClick={() => setTab("map")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                tab === "map"
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                  : "text-slate-700 hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-300"
              }`}
            >
              Similarity Map
            </button>
          </div>

          {tab === "discover" && (
            <>
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
                className="group inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-xs text-slate-700 transition hover:border-rose-400 hover:text-rose-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-rose-500 dark:hover:text-rose-300"
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
            </>
          )}
        </header>

        {tab === "discover" && error && (
          <p className="mb-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
            {error}
          </p>
        )}

        {tab === "discover" && loading ? (
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: k }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-200/80 dark:border-slate-800 dark:bg-slate-800/70"
              />
            ))}
          </section>
        ) : null}

        {tab === "discover" && !loading ? (
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {filteredResults.map((anime, index) => (
              <AnimeCard key={anime.id} anime={anime} index={index} />
            ))}
          </section>
        ) : null}

        {tab === "map" && <AnimeMapTab />}
      </div>
    </div>
  );
}
