import { type Recommendation } from "./types";

const API_BASE = import.meta.env.VITE_API_URL

export async function fetchRecommendations(
  animeTitles: number[],
  k: number
): Promise<Recommendation[]> {
  console.log(animeTitles, k)
  const res = await fetch(`${API_BASE}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      anime_ids: animeTitles,
      k: k,
    }),
  });
  console.log(animeTitles, k)
  if (!res.ok) {
    throw new Error("Failed to fetch recommendations");
  }

  const data = await res.json();
  console.log(data)
  return data;
}
