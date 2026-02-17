import axios from "axios";

export interface HLTBData {
  main: string;
  extra: string;
  completionist: string;
}

/**
 * Fetch game length data from HowLongToBeat using a public CORS proxy.
 * Note: Scrapers are fragile, but this is the standard community approach.
 */
export const fetchHLTBStats = async (
  title: string,
): Promise<HLTBData | null> => {
  try {
    // We use a search approach. HLTB internal API endpoint:
    // https://howlongtobeat.com/api/search
    // Request is a POST with a specific JSON structure.

    // To avoid CORS in the browser, we use a proxy.
    // For production app, you'd usually have your own backend.
    const proxyUrl = "https://api.allorigins.win/get?url=";
    const targetUrl = encodeURIComponent(
      "https://howlongtobeat.com/api/search",
    );

    const payload = {
      searchType: "games",
      searchTerms: title.split(" "),
      searchPage: 1,
      size: 20,
      searchOptions: {
        games: {
          userId: 0,
          platform: "",
          sortCategory: "popular",
          rangeCategory: "main",
          rangeTime: { min: 0, max: 0 },
          gameplay: { perspective: "", flow: "", genre: "" },
          rangeYear: { min: "", max: "" },
          modifier: "",
        },
        users: { sortCategory: "postcount" },
        lists: { sortCategory: "follows" },
        filter: "",
        sort: 0,
        randomizer: 0,
      },
    };

    // Note: allorigins returns the response in a 'contents' field as string
    const response = await axios.get(
      `${proxyUrl}${targetUrl}&method=POST&body=${encodeURIComponent(JSON.stringify(payload))}`,
      { timeout: 8000 },
    );

    if (!response.data?.contents) return null;

    let data;
    try {
      const parsed = JSON.parse(response.data.contents);
      data = parsed.data;
    } catch (e) {
      return null;
    }

    if (!data || data.length === 0) return null;

    // Find the best match (simple title comparison)
    const bestMatch = data[0];

    // Convert seconds to hours
    const toHours = (seconds: number) => {
      if (!seconds) return "--";
      const hours = Math.round(seconds / 3600);
      return `${hours}ч`;
    };

    return {
      main: toHours(bestMatch.comp_main),
      extra: toHours(bestMatch.comp_plus),
      completionist: toHours(bestMatch.comp_100),
    };
  } catch (error) {
    console.warn("HLTB Fetch failed:", error);
    return null;
  }
};
