import json
import numpy as np
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Query
from pydantic import BaseModel

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.decomposition import TruncatedSVD
from sklearn.cluster import MiniBatchKMeans
from scipy.sparse import hstack



# =============================
# FastAPI App
# =============================
app = FastAPI(
    title="Anime Recommendation API",
    description="Cosine similarity + kNN anime recommender using AniList data",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://recurate-woad.vercel.app"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



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
    score: int
    cover_image: str
    anilist_url: str
    explanation: str


class SimilarAnime(BaseModel):
    id: int
    title: str
    similarity: float


class MapNode(BaseModel):
    id: int
    title: str
    score: int
    popularity: int
    cover_image: str
    anilist_url: str
    genres: List[str]
    radius: float
    x: float
    y: float
    cluster: int
    similar: List[SimilarAnime]


class MapEdge(BaseModel):
    source: int
    target: int
    weight: float


class MapResponse(BaseModel):
    nodes: List[MapNode]
    edges: List[MapEdge]


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
        self.images = []
        self.scores = []
        self.popularity = []
        self.links = []

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
        self.images = [
            a["coverImage"]["large"]
            for a in self.anime
        ]
        self.scores = [
            int(a["averageScore"] or 0)
            for a in self.anime
        ]
        self.links = [
            a["siteUrl"]
            for a in self.anime
        ]
        self.popularity = [
            int(a.get("popularity") or 0)
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

        # CSR is required for fast row slicing (used by recommend/map endpoints).
        self.X = hstack([X_genres, X_tags], format="csr").astype(np.float32)

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
        print(anime_ids, k)
        indices = []
        for aid in anime_ids:
            if aid not in self.ids:
                #raise ValueError(f"Anime ID {aid} not found")
                print(f"Anime ID {aid} not found")
                continue
            indices.append(self.ids.index(aid))
        if len(indices) == 0:
            return []
        # ---- Multi-anime user vector ----
        user_vector = np.asarray(self.X[indices].mean(axis=0))

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
        #print(results)
        return results

    def build_similarity_map(self, limit: int = 180, neighbors: int = 5):
        if limit < 20:
            limit = 20
        if limit > 1200:
            limit = 1200
        if neighbors < 2:
            neighbors = 2
        if neighbors > 10:
            neighbors = 10

        ranked = sorted(
            range(len(self.anime)),
            key=lambda i: (self.popularity[i], self.scores[i]),
            reverse=True
        )[:limit]

        sub_X = self.X[ranked]

        layout_svd = TruncatedSVD(n_components=2, random_state=42)
        coords_2d = layout_svd.fit_transform(sub_X)

        cluster_dims = min(16, max(4, sub_X.shape[1] - 1))
        cluster_svd = TruncatedSVD(n_components=cluster_dims, random_state=42)
        cluster_space = cluster_svd.fit_transform(sub_X)
        cluster_count = int(max(8, min(22, round(np.sqrt(limit) / 1.6))))
        kmeans = MiniBatchKMeans(
            n_clusters=cluster_count,
            random_state=42,
            n_init="auto",
            batch_size=256,
        )
        cluster_labels = kmeans.fit_predict(cluster_space)

        global_center = np.mean(coords_2d, axis=0)
        cluster_centers = {}
        for c in range(cluster_count):
            cluster_points = coords_2d[cluster_labels == c]
            if len(cluster_points) == 0:
                cluster_centers[c] = global_center.copy()
            else:
                cluster_centers[c] = np.mean(cluster_points, axis=0)

        separated = np.zeros_like(coords_2d)
        for i in range(len(coords_2d)):
            c = int(cluster_labels[i])
            direction = cluster_centers[c] - global_center
            separated[i] = coords_2d[i] + direction * 0.55

        x_vals = separated[:, 0]
        y_vals = separated[:, 1]
        x_min, x_max = float(np.min(x_vals)), float(np.max(x_vals))
        y_min, y_max = float(np.min(y_vals)), float(np.max(y_vals))
        x_span = max(x_max - x_min, 1e-6)
        y_span = max(y_max - y_min, 1e-6)
        sub_knn = NearestNeighbors(metric="cosine", algorithm="brute")
        sub_knn.fit(sub_X)

        distances, neighbor_ix = sub_knn.kneighbors(
            sub_X,
            n_neighbors=neighbors + 1
        )

        max_pop = max(self.popularity[i] for i in ranked) or 1
        min_pop = min(self.popularity[i] for i in ranked)
        pop_span = max(max_pop - min_pop, 1)

        edges = {}
        nodes = []

        for local_i, global_i in enumerate(ranked):
            local_neighbors = []
            for local_j, dist in zip(
                neighbor_ix[local_i][1:],
                distances[local_i][1:]
            ):
                global_j = ranked[int(local_j)]
                sim = float(round(max(0.0, 1 - float(dist)), 4))
                local_neighbors.append({
                    "id": self.ids[global_j],
                    "title": self.titles[global_j],
                    "similarity": sim,
                })

                a = self.ids[global_i]
                b = self.ids[global_j]
                edge_key = (a, b) if a < b else (b, a)
                if edge_key not in edges or sim > edges[edge_key]["weight"]:
                    edges[edge_key] = {
                        "source": edge_key[0],
                        "target": edge_key[1],
                        "weight": sim,
                    }

            pop_norm = (self.popularity[global_i] - min_pop) / pop_span
            radius = round(8.0 + pop_norm * 18.0, 2)
            x = float((separated[local_i][0] - x_min) / x_span)
            y = float((separated[local_i][1] - y_min) / y_span)

            nodes.append({
                "id": self.ids[global_i],
                "title": self.titles[global_i],
                "score": self.scores[global_i],
                "popularity": self.popularity[global_i],
                "cover_image": self.images[global_i],
                "anilist_url": self.links[global_i],
                "genres": self.genres[global_i][:4],
                "radius": radius,
                "x": round(x, 4),
                "y": round(y, 4),
                "cluster": int(cluster_labels[local_i]),
                "similar": local_neighbors,
            })

        return {
            "nodes": nodes,
            "edges": sorted(
                edges.values(),
                key=lambda e: e["weight"],
                reverse=True
            ),
        }

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
            "score": self.scores[idx],
            "cover_image": self.images[idx],
            "anilist_url": self.links[idx],
            "explanation": generate_explanation(
                sorted(shared_genres), sorted(list(shared_tags))[:5]
            )
        }

def generate_explanation(shared_genres, shared_tags):

    parts = []

    if shared_genres:
        parts.append(
            "Shared genres: " + ", ".join(list(shared_genres)[:3])
        )

    if shared_tags:
        parts.append(
            "Common themes: " + ", ".join(list(shared_tags)[:3])
        )

    if not parts:
        return "Recommended based on overall similarity in style and structure."

    return " · ".join(parts)


recommender = AnimeRecommender("anime_data.json")


@app.post("/recommend", response_model=List[Recommendation])
def recommend(req: RecommendRequest):
    try:
        return recommender.recommend(req.anime_ids, req.k)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/map", response_model=MapResponse)
def map_data(
    limit: int = Query(180, ge=20, le=1200),
    neighbors: int = Query(5, ge=2, le=10),
):
    return recommender.build_similarity_map(limit=limit, neighbors=neighbors)


@app.get("/")
def root():
    return {"status": "Anime recommender running"}
