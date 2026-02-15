import React, { useState } from "react";
import { useDarkMode } from "./hooks/useDarkMode";
import AnimeMapTab from "./components/AnimeMapTab";
import DiscoverTab from "./components/DiscoverTab";

type ViewMode = "map" | "discover";

export default function App() {
  const { dark, toggle } = useDarkMode();
  const [mode, setMode] = useState<ViewMode>("map");
  const [navOpen, setNavOpen] = useState(true);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,#f8fafc_35%,#f1f5f9_60%,#e2e8f0_100%)] text-slate-900 transition-colors dark:bg-[radial-gradient(circle_at_top_left,#0f172a_0%,#020617_45%,#000000_100%)] dark:text-slate-100">
      <button
        onClick={() => setNavOpen((v) => !v)}
        className="absolute left-4 top-4 z-40 rounded-xl border border-slate-300 bg-white/85 px-3 py-2 text-xs font-semibold text-slate-700 shadow dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-200"
      >
        {navOpen ? "Hide Menu" : "Show Menu"}
      </button>

      <aside
        className={`absolute left-4 top-16 z-40 rounded-2xl border border-slate-200/80 bg-white/85 p-3 shadow-2xl shadow-slate-900/15 backdrop-blur transition-all dark:border-slate-700 dark:bg-slate-900/85 ${
          navOpen ? "w-[220px] opacity-100" : "w-0 overflow-hidden border-0 p-0 opacity-0"
        }`}
      >
        <p className="mb-2 text-[11px] font-bold tracking-[0.14em] text-slate-600 dark:text-slate-300">
          NAVIGATION
        </p>
        <div className="space-y-2">
          <button
            onClick={() => setMode("map")}
            className={`w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${
              mode === "map"
                ? "bg-cyan-500 text-white"
                : "border border-slate-300 text-slate-700 hover:border-cyan-400 dark:border-slate-700 dark:text-slate-200"
            }`}
          >
            Similarity Map
          </button>
          <button
            onClick={() => setMode("discover")}
            className={`w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${
              mode === "discover"
                ? "bg-cyan-500 text-white"
                : "border border-slate-300 text-slate-700 hover:border-cyan-400 dark:border-slate-700 dark:text-slate-200"
            }`}
          >
            Recommender
          </button>
          <button
            onClick={toggle}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:border-cyan-400 dark:border-slate-700 dark:text-slate-200"
          >
            {dark ? "Switch to Light" : "Switch to Dark"}
          </button>
        </div>
      </aside>

      <div className="h-full w-full">
        {mode === "map" ? <AnimeMapTab /> : <DiscoverTab />}
      </div>
    </div>
  );
}
