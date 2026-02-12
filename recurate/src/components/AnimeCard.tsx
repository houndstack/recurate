import React from "react";
import type { Recommendation } from "../types";

export default function AnimeCard({
  anime,
  index,
}: {
  anime: Recommendation;
  index: number;
}) {
  return (
    <a
      href={anime.anilist_url}
      target="_blank"
      rel="noreferrer"
      className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-lg shadow-slate-900/5 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/10 dark:border-slate-700/70 dark:bg-slate-900/70 dark:shadow-black/30"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <img
        src={anime.cover_image}
        alt={anime.title}
        className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
      />

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-4 text-white">
        <p className="mb-1 text-xs tracking-[0.18em] text-cyan-300">RECOMMENDED</p>
        <h3 className="text-sm font-semibold">{anime.title}</h3>
        <div className="mt-2 flex items-center gap-2 text-[11px]">
          <span className="rounded-full bg-cyan-400/20 px-2 py-1">
            Match {Math.round(anime.similarity * 100)}%
          </span>
          <span className="rounded-full bg-emerald-400/20 px-2 py-1">
            Score {anime.score}
          </span>
        </div>
      </div>

      <div className="absolute inset-0 flex items-center bg-slate-950/90 p-4 text-xs text-slate-100 opacity-0 transition group-hover:opacity-100">
        {anime.explanation}
      </div>
    </a>
  );
}
