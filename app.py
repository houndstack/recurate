import json
import numpy as np
from typing import List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import MultiLabelBinarizer
from scipy.sparse import hstack, vstack


# =============================
# Data Models (API)
# =============================
class RecommendRequest(BaseModel):
    anime_ids: List[int]
    k: int = 10


class Recommendation(BaseModel):
    id: int
    title: str
    similarity: float
    shared_genres: List[str]
    shared_tags: List[str]


# =============================
# Recommender Core
# =============================
class AnimeRecommender:
    def __init__(self, json_path: str):
        self.anime = []
        self.ids = []
        self.titles = []
        self.genres = []
        self.tags = []

        self.X = None
        self.knn = None
        self.genre_mlb = None
        self.tfidf = None

        self._load_data(json_path)
        self._build_features()
        self._fit_knn()

    def _load_data(self, path):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.anime = [
            a for a in data if a.get("genres") and a.get("tags")
        ]

        self.ids = [a["id"] for a in self.anime]
        self.titles = [
            a["title"]["english"] or a["title"]["romaji"]
            for a in self.anime
        ]
        self.genres = [a["genres"] for a in self.anime]
        self.tags = [
            [t["name"] for t in a["tags"]]
            for a in self.anime
        ]

    # -------------------------
    # Feature Engineering
    # -------------------------
    def _build_features(self):
        # Genres (one-hot)
        self.genre_mlb = MultiLabelBinarizer()
        X_genres = self.genre_mlb.fit_transform(self.genres)

        # Tags (TF-IDF with rank weighting)
        tag_strings = []
        for a in self.anime:
            weighted = []
            for t in a["tags"]:
                weight = max(1, t["rank"] // 20)
                weighted.extend([t["name"]] * weight)
            tag_strings.append(" ".join(weighted))

        self.tfidf = TfidfVectorizer(
            max_features=300,
            stop_words="english"
        )
        X_tags = self.tfidf.fit_transform(tag_strings)

        self.X = hstack([X_genres, X_tags]).astype(np.float32)

    def _fit_knn(self):
        self.knn = NearestNeighbors(
            metric="cosine",
            algorithm="brute"
        )
        self.knn.fit(self.X)

    # -------------------------
    # Recommendation Logic
    # -------------------------
    def recommend(self, anime_ids: List[int], k: int):
        indices = []
        for aid in anime_ids:
            if aid not in self.ids:
                raise ValueError(f"Anime ID {aid} not found")
            indices.append(self.ids.index(aid))

        # ---- Multi-anime user vector ----
        user_vector = np.asarray(self.X.todok()[indices].mean(axis=0))

        distances, neighbors = self.knn.kneighbors(
            user_vector,
            n_neighbors=k + len(indices)
        )

        results = []
        for idx, dist in zip(neighbors[0], distances[0]):
            if idx in indices:
                continue

            results.append(self._build_explanation(idx, dist))

            if len(results) >= k:
                break

        return results

    # -------------------------
    # Explanations
    # -------------------------
    def _build_explanation(self, idx, dist):
        shared_genres = set(self.genres[idx])
        shared_tags = set(self.tags[idx])

        return {
            "id": self.ids[idx],
            "title": self.titles[idx],
            "similarity": round(1 - dist, 3),
            "shared_genres": sorted(shared_genres),
            "shared_tags": sorted(list(shared_tags))[:5],
        }


# =============================
# FastAPI App
# =============================
app = FastAPI(
    title="Anime Recommendation API",
    description="Cosine similarity + kNN anime recommender using AniList data",
)

recommender = AnimeRecommender("anime_data.json")


@app.post("/recommend", response_model=List[Recommendation])
def recommend(req: RecommendRequest):
    try:
        return recommender.recommend(req.anime_ids, req.k)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/")
def root():
    return {"status": "Anime recommender running"}
