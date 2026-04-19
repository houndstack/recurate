import {
  type AgentRecommendResponse,
  type MapResponse,
  type Recommendation,
} from "./types";

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

export async function fetchAnimeMap(
  limit = 180,
  neighbors = 5
): Promise<MapResponse> {
  const res = await fetch(
    `${API_BASE}/map?limit=${limit}&neighbors=${neighbors}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch map data");
  }

  return res.json();
}

export async function fetchAgentRecommendations(payload: {
  user_prompt: string;
  liked_anime_ids: number[];
  disliked_anime_ids?: number[];
  k?: number;
  min_score?: number;
}): Promise<AgentRecommendResponse> {
  const res = await fetch(`${API_BASE}/agent/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch agent recommendations");
  }

  return res.json();
}
