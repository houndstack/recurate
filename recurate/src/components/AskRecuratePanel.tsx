import React, { useEffect, useState } from "react";
import { fetchAgentRecommendations } from "../api";
import type { AgentRecommendResponse, Recommendation } from "../types";

export default function AskRecuratePanel({
  likedAnimeIds,
  k,
  minScore,
  onApplyRecommendations,
}: {
  likedAnimeIds: number[];
  k: number;
  minScore: number;
  onApplyRecommendations: (next: Recommendation[]) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWakeMessage, setShowWakeMessage] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<AgentRecommendResponse | null>(null);

  useEffect(() => {
    if (!loading) {
      setShowWakeMessage(false);
      return;
    }
    const timer = window.setTimeout(() => setShowWakeMessage(true), 5000);
    return () => window.clearTimeout(timer);
  }, [loading]);

  const askAgent = async () => {
    if (prompt.trim().length < 2) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetchAgentRecommendations({
        user_prompt: prompt.trim(),
        liked_anime_ids: likedAnimeIds,
        disliked_anime_ids: [],
        k,
        min_score: minScore,
      });
      setResponse(res);

      const mapped: Recommendation[] = res.recommendations.map((r) => ({
        id: r.id,
        title: r.title,
        score: r.score,
        similarity: r.similarity,
        shared_genres: [],
        shared_tags: [],
        cover_image: r.cover_image,
        anilist_url: r.anilist_url,
        explanation: r.rationale,
      }));
      onApplyRecommendations(mapped);
    } catch {
      setError("Could not reach Ask Recurate. Check API/deployment status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mb-6 rounded-3xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50/90 to-sky-50/80 p-4 shadow-xl shadow-cyan-900/5 dark:border-cyan-900/60 dark:from-slate-900/95 dark:to-cyan-950/30 dark:shadow-black/20">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-wide text-slate-900 dark:text-slate-100">
          Ask Recurate
        </h2>
      </div>

      <p className="mb-3 text-xs text-slate-600 dark:text-slate-300">
        Describe what you want in plain English. Recurate will parse your preferences and run recommendations.
      </p>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Example: dark psychological anime, no romance, under 24 episodes"
          className="min-h-20 w-full resize-y rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <button
          onClick={askAgent}
          disabled={likedAnimeIds.length === 0 || loading || prompt.trim().length < 2}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Ask"}
        </button>
      </div>

      {likedAnimeIds.length === 0 && (
        <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
          Add at least one anime first so the agent has grounding context.
        </p>
      )}

      {loading && showWakeMessage && (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          Backend may be waking up on Render free tier. This can take ~30-60 seconds.
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
          {error}
        </p>
      )}

      {response && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white/80 p-3 text-xs dark:border-slate-700 dark:bg-slate-900/70">
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            {response.reasoning_summary}
          </p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            Candidates: {response.candidate_ids.length}
          </p>
        </div>
      )}
    </section>
  );
}
