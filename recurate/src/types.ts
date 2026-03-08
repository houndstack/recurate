export interface Recommendation {
  id: number;
  title: string;
  score: number;
  similarity: number;
  shared_genres: string[];
  shared_tags: string[];
  cover_image: string;
  anilist_url: string;
  explanation: string;
}

export interface SimilarAnime {
  id: number;
  title: string;
  similarity: number;
}

export interface MapNode {
  id: number;
  title: string;
  score: number;
  popularity: number;
  cover_image: string;
  anilist_url: string;
  genres: string[];
  radius: number;
  x: number;
  y: number;
  cluster: number;
  similar: SimilarAnime[];
}

export interface MapEdge {
  source: number;
  target: number;
  weight: number;
}

export interface MapResponse {
  nodes: MapNode[];
  edges: MapEdge[];
}

export interface AgentPreferences {
  moods: string[];
  genres_include: string[];
  genres_exclude: string[];
  max_episodes: number | null;
  extra_constraints: string[];
}

export interface AgentRecommendation {
  id: number;
  title: string;
  score: number;
  similarity: number;
  cover_image: string;
  anilist_url: string;
  rationale: string;
}

export interface AgentRecommendResponse {
  mode: string;
  parsed_preferences: AgentPreferences;
  candidate_ids: number[];
  recommendations: AgentRecommendation[];
  reasoning_summary: string;
}

