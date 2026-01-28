
import React from "react"

export default function AnimeCard({ anime }: { anime: any }) {
  return (
    <a
      href={anime.anilist_url}
      target="_blank"
      rel="noreferrer"
      className="group relative rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
    >
      <img
        src={anime.cover_image}
        className="h-64 w-full object-cover"
      />

      <div className="p-3">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
          {anime.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <strong>Similarity:</strong> {anime.similarity.toFixed(2)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <strong>Average Score:</strong> {anime.score.toFixed(2)}
        </p>
      </div>

      {/* Hover explanation */}
      <div className="absolute inset-0 bg-black/75 text-white opacity-0 group-hover:opacity-100 transition flex items-center p-4 text-sm">
        {anime.explanation}
      </div>
    </a>
  );
}

