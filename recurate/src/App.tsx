import { useState } from "react";
import React from "react"
import AnimeInput from "./components/AnimeInput";
import AnimeCard from "./components/AnimeCard";
import { fetchRecommendations } from "./api";
import { type Recommendation } from "./types";

export default function App() {
  const [results, setResults] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecommend = async (titles: string[]) => {
    try {
      setLoading(true);
      setError(null);
      console.log(titles)
      const recs = await fetchRecommendations(titles, 8);
      console.log(recs)
      setResults(recs);
    } catch {
      setError("Could not fetch recommendations.");
    } finally {
      setLoading(false);
    }
  };
  console.log(results)
  return (
    <main className="container">
      <header>
        <h1>Anime Recommender</h1>
        <p>
          Content-based recommendations using similarity in latent feature
          space.
        </p>
      </header>

      <AnimeInput onSubmit={handleRecommend} />

      {loading && <p className="status">Loading recommendations…</p>}
      {error && <p className="error">{error}</p>}

      <section className="grid">
        {results.map((anime) => (
          <AnimeCard key={anime.title} anime={anime} />
        ))}
      </section>
    </main>
  );
}
