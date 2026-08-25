const BASE_URL = "https://film4k.net";

/**
 * Parse HTML để lấy text content
 */
export function parseHTML(html) {
  const parser = new DOMParser();
  return parser.parseFromString(html, "text/html");
}

/**
 * Clean string - remove extra whitespace
 */
export function cleanText(text) {
  if (!text) return "";
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Extract IMDb ID from URL or title
 */
export function extractImdbId(url) {
  if (!url) return null;
  const match = url.match(/tt\d{7,8}/);
  return match ? match[0] : null;
}

/**
 * Build search URL for film4k.net
 */
export function buildSearchUrl(query, page = 1) {
  const encoded = encodeURIComponent(query);
  return `${BASE_URL}/tim-kiem?keyword=${encoded}&page=${page}`;
}

/**
 * Build movie detail URL
 */
export function buildMovieUrl(slug) {
  return `${BASE_URL}/phim/${slug}`;
}

/**
 * Build episode URL
 */
export function buildEpisodeUrl(slug, episode) {
  return `${BASE_URL}/phim/${slug}/tap-${episode}`;
}

/**
 * Build catalog URL by genre
 */
export function buildGenreUrl(genre, page = 1) {
  return `${BASE_URL}/the-loai/${genre}/page-${page}`;
}

/**
 * Build popular/trending URL
 */
export function buildPopularUrl(page = 1) {
  return `${BASE_URL}/phim-le/page-${page}`;
}

/**
 * Build series URL
 */
export function buildSeriesUrl(page = 1) {
  return `${BASE_URL}/phim-bo/page-${page}`;
}

/**
 * Build Vietnamese movie URL
 */
export function buildVietnameseUrl(page = 1) {
  return `${BASE_URL}/phim-viet/page-${page}`;
}

/**
 * Extract video URL from iframe or direct link
 */
export function extractVideoUrl(html) {
  // Try to find direct video source
  const videoMatch = html.match(/<source[^>]+src=["']([^"']+\.mp4)["']/i);
  if (videoMatch) {
    return videoMatch[1];
  }

  // Try to find iframe src
  const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch) {
    return iframeMatch[1];
  }

  // Try data-src
  const dataSrcMatch = html.match(/data-src=["']([^"']+)["']/i);
  if (dataSrcMatch) {
    return dataSrcMatch[1];
  }

  return null;
}

/**
 * Parse movie card from search/catalog results
 */
export function parseMovieCard(item) {
  try {
    const linkEl = item.querySelector("a");
    const imgEl = item.querySelector("img");
    const titleEl = item.querySelector(".title, .film-name, h2, h3, .film-poster a");
    const qualityEl = item.querySelector(".quality, .film-quality, .film-infor .quality");
    const yearEl = item.querySelector(".year, .film-year, .film-infor .year");

    if (!linkEl) return null;

    const href = linkEl.getAttribute("href") || "";
    const slug = href.replace(`${BASE_URL}/phim/`, "").replace(/\/$/, "");

    const title = titleEl ? cleanText(titleEl.textContent) : "";
    const image = imgEl ? imgEl.getAttribute("src") || imgEl.getAttribute("data-src") : "";
    const quality = qualityEl ? cleanText(qualityEl.textContent) : "";
    const year = yearEl ? cleanText(yearEl.textContent) : "";

    return {
      slug,
      title,
      image,
      quality,
      year,
      url: href
    };
  } catch (e) {
    console.error("Error parsing movie card:", e);
    return null;
  }
}

/**
 * Parse episode list from movie detail page
 */
export function parseEpisodes(html) {
  const episodes = [];
  const doc = parseHTML(html);

  // Try multiple selectors for episode links
  const episodeLinks = doc.querySelectorAll(
    ".episode-list a, .server-list a, .play-episode a, [class*='episode'] a, [class*='tap'] a"
  );

  episodeLinks.forEach((link) => {
    const href = link.getAttribute("href") || "";
    const text = cleanText(link.textContent);
    const match = href.match(/tap-(\d+)/);
    if (match) {
      episodes.push({
        episode: parseInt(match[1]),
        title: text || `Tập ${match[1]}`,
        url: href
      });
   
