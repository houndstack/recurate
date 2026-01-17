export interface Recommendation {
  title: string;
  score: number;
  similarity: number;
  shared_genres: string[];
  shared_tags: string[];
  cover_image: string;
  anilist_url: string;
}

