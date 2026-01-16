import { type Recommendation } from "../types";
import React from "react"

export default function AnimeCard({ anime }: { anime: Recommendation }) {
  return (
    <a
      className="anime-card"
      href={anime.anilist_url}
      target="_blank"
      rel="noreferrer"
    >
      <img src={anime.cover_image} alt={anime.title} />
      <div className="anime-meta">
        <h3>{anime.title}</h3>
        <p><strong>Similarity:</strong> {anime.similarity.toFixed(2)}</p>
        {/* <p><strong>Genres:</strong></p>
        <div className="tags">{anime.shared_genres.map((g)=>(
          <span className="tag" key={g}>{g}</span>))}</div>
        <p><strong>Tags:</strong></p>
        <div className="tags">{anime.shared_tags.map((t)=>(
          <span className="tag" key={t}>{t}</span>))}</div> */}
        <p><strong>Average score:</strong> {anime.score}</p>
      </div>
    </a>
  );
}
