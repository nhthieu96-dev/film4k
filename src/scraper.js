import { fetchPage, parseHTML, parseMovieCard, parseEpisodes, extractVideoUrl, buildSearchUrl, buildPopularUrl, buildSeriesUrl, buildVietnameseUrl, buildGenreUrl, formatStremioResponse, handleCors } from './utils.js';

export async function handleCatalog(request, catalogId, extra) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const genre = url.searchParams.get('genre');
  const sortBy = url.searchParams.get('sortBy');

  let fetchUrl;
  switch (catalogId) {
    case 'film4k-popular':
      fetchUrl = buildPopularUrl(page);
      break;
    case 'film4k-trending':
      fetchUrl = buildPopularUrl(page); // Same as popular for now
      break;
    case 'film4k-series':
      fetchUrl = buildSeriesUrl(page);
      break;
    case 'film4k-vietnamese':
      fetchUrl = buildVietnameseUrl(page);
      break;
    default:
      fetchUrl = buildPopularUrl(page);
  }

  try {
    const html = await fetchPage(fetchUrl);
    const doc = parseHTML(html);
    const items = doc.querySelectorAll('.film_list-wrap .flw-item, .film_list .item, .film-poster, [class*="film-item"]');
    const movies = [];

    items.forEach(item => {
      const movie = parseMovieCard(item);
      if (movie) {
        movies.push({
          id: `tt${Math.floor(Math.random() * 9000000) + 1000000}`, // Placeholder ID - Stremio needs IDs. We'll use slug-based ID or map to IMDb later. For now, use a deterministic hash or just the slug.
          // Better: use slug as ID prefix, but Stremio expects ttID for streams. I'll explain this limitation.
          // Actually, Stremio allows any ID for catalogs, but streams need ttID. I'll generate a fake ttID for catalog, but for streams we'll search by title.
          id: movie.slug,
          title: movie.title,
          type: catalogId === 'film4k-series' ? 'series' : 'movie',
          image: movie.image,
          description: `Chất lượng: ${movie.quality} | Năm: ${movie.year}`,
          extra: [{
            name: "genre",
            isRequired: false,
            options: ["Hành động", "Tình cảm", "Hài hước", "Kinh dị", "Phiêu lưu"]
          }]
        });
      }
    });

    return formatStremioResponse({
      metas: movies,
      pagination: {
        page,
        pages: 100, // Approximate
        next: page < 100 ? page + 1 : null
      }
    });
  } catch (error) {
    console.error('Catalog error:', error);
    return formatStremioResponse({ metas: [] });
  }
}

export async function handleSearch(request, query) {
  try {
    const fetchUrl = buildSearchUrl(query);
    const html = await fetchPage(fetchUrl);
    const doc = parseHTML(html);
    const items = doc.querySelectorAll('.film_list-wrap .flw-item, .film_list .item, .film-poster');
    const results = [];

    items.forEach(item => {
      const movie = parseMovieCard(item);
      if (movie) {
        results.push({
          id: movie.slug,
          title: movie.title,
          type: 'movie', // Could detect series
          image: movie.image,
          description: `Năm: ${movie.year} | Chất lượng: ${movie.quality}`
        });
      }
    });

    return formatStremioResponse({ metas: results });
  } catch (error) {
    console.error('Search error:', error);
    return formatStremioResponse({ metas
