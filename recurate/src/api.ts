import { type Recommendation } from "./types";

const API_BASE = import.meta.env.VITE_API_URL

export async function fetchRecommendations(
  animeIds: number[],
  k: number
): Promise<Recommendation[]> {
  const res = await fetch(`${API_BASE}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      anime_ids: animeIds,
      k: k,
    }),
  });
  if (!res.ok) {
    throw new Error("Failed to fetch recommendations");
  }

  return res.json();
}
