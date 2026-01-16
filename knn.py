import json
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import MultiLabelBinarizer
from scipy.sparse import hstack


class AnimeRecommender:
    def __init__(self, json_path: str):
        self.json_path = json_path
        self.anime = []
        self.ids = []
        self.titles = []
        self.X = None
        self.knn = None

        self._load_data()
        self._build_features()
        self._fit_knn()

    # -----------------------------
    # Data loading
    # -----------------------------
    def _load_data(self):
        with open(self.json_path, "r", encoding="utf-8") as f:
            self.anime = json.load(f)

        # basic filtering
        self.anime = [
            a for a in self.anime
            if a.get("genres") and a.get("tags")
        ]

        self.ids = [a["id"] for a in self.anime]
        self.titles = [
            a["title"]["english"] or a["title"]["romaji"]
            for a in self.anime
        ]

    # -----------------------------
    # Feature engineering
    # -----------------------------
    def _build_features(self):
        # ---- Genres (one-hot) ----
        genres = [a["genres"] for a in self.anime]
        mlb = MultiLabelBinarizer()
        X_genres = mlb.fit_transform(genres)

        # ---- Tags (TF-IDF, weighted by rank) ----
        tag_strings = []
        for a in self.anime:
            weighted_tags = []
            for tag in a["tags"]:
                # repeat tag name proportional to rank
                weight = max(1, tag["rank"] // 20)
                weighted_tags.extend([tag["name"]] * weight)
            tag_strings.append(" ".join(weighted_tags))

        tfidf = TfidfVectorizer(
            max_features=300,
            stop_words="english"
        )
        X_tags = tfidf.fit_transform(tag_strings)

        # ---- Combine ----
        self.X = hstack([X_genres, X_tags]).astype(np.float32)

    # -----------------------------
    # k-NN model
    # -----------------------------
    def _fit_knn(self):
        self.knn = NearestNeighbors(
            metric="cosine",
            algorithm="brute"
        )
        self.knn.fit(self.X)

    # -----------------------------
    # Recommendation
    # -----------------------------
    def recommend_by_id(self, anime_id: int, k: int = 10):
        if anime_id not in self.ids:
            raise ValueError("Anime ID not found")

        idx = self.ids.index(anime_id)
        distances, indices = self.knn.kneighbors(
            self.X.todok()[idx],
            n_neighbors=k + 1
        )

        results = []
        for i, d in zip(indices[0][1:], distances[0][1:]):
            results.append({
                "id": self.ids[i],
                "title": self.titles[i],
                "similarity": round(1 - d, 3)
            })

        return results

    def recommend_by_title(self, title: str, k: int = 10):
        matches = [
            i for i, t in enumerate(self.titles)
            if title.lower() in t.lower()
        ]

        if not matches:
            raise ValueError("Title not found")

        return self.recommend_by_id(self.ids[matches[0]], k)


# -----------------------------
# Example usage
# -----------------------------
if __name__ == "__main__":
    rec = AnimeRecommender("anime_data.json")

    # Example: Attack on Titan
    results = rec.recommend_by_title("Hand Shakers", k=10)

    for r in results:
        print(f"{r['title']} (similarity={r['similarity']})")
