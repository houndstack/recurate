import { type Recommendation } from "./types";

export async function fetchRecommendations(
  animeTitles: number[],
  k: number
): Promise<Recommendation[]> {
  console.log(animeTitles, k)
  const res = await fetch("http://localhost:8000/recommend", {
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
