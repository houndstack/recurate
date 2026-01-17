export interface AniListResult {
  id: number;
  title: string;
  coverImage: string;
  url: string;
}

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

export async function searchAnime(query: string): Promise<AniListResult[]> {
  const gql = `
    query ($search: String) {
      Page(perPage: 5) {
        media(search: $search, type: ANIME) {
          id
          title {
            romaji
          }
          coverImage {
            large
          }
          siteUrl
        }
      }
    }
  `;

  const res = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: gql,
      variables: { search: query },
    }),
  });

  const json = await res.json();

  return json.data.Page.media.map((m: any) => ({
    id: m.id,
    title: m.title.romaji,
    coverImage: m.coverImage.large,
    url: m.siteUrl,
  }));
}
