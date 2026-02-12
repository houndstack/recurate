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

