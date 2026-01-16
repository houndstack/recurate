import requests
import json
import time

ANILIST_API_URL = "https://graphql.anilist.co"
OUTPUT_FILE = "anime_data.json"

QUERY = """
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      hasNextPage
      currentPage
    }
    media(type: ANIME, sort: POPULARITY_DESC) {
      id
      title {
        romaji
        english
      }
      genres
      tags {
        name
        rank
      }
      averageScore
      popularity
      episodes
      format
    }
  }
}
"""

def fetch_all_anime(per_page=50, max_pages=200):
    all_anime = []
    page = 1

    while page <= max_pages:
        print(f"Fetching page {page}...")

        response = requests.post(
            ANILIST_API_URL,
            json={
                "query": QUERY,
                "variables": {
                    "page": page,
                    "perPage": per_page
                }
            },
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        )

        if response.status_code != 200:
            print("Error:", response.text)
            break

        data = response.json()
        page_data = data["data"]["Page"]["media"]

        if not page_data:
            break

        all_anime.extend(page_data)

        if not data["data"]["Page"]["pageInfo"]["hasNextPage"]:
            break

        page += 1
        time.sleep(1)  # polite rate limiting
        if page % 30 == 0:
            time.sleep(60)

    return all_anime


def main():
    anime_list = fetch_all_anime(per_page=50, max_pages=200)

    print(f"Fetched {len(anime_list)} anime")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(anime_list, f, indent=2, ensure_ascii=False)

    print(f"Saved to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
