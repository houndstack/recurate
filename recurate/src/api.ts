import { type Recommendation } from "./types";

export async function fetchRecommendations(
  animeTitles: string[],
  k: number
): Promise<Recommendation[]> {
  const res = await fetch("http://localhost:8000/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      anime_ids: animeTitles,
      k: k,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch recommendations");
  }

  const data = await res.json();
  console.log(data)
  return data;
}
