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

