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
        // ... continuing from handleSearch
       });

       return formatStremioResponse({ metas: results });
     } catch (error) {
       console.error('Search error:', error);
       return formatStremioResponse({ metas: [] });
     }
   }

   export async function handleStreams(imdbId, type, extra) {
     // Stremio sends IMDb ID. film4k.net doesn't use IMDb IDs.
     // Strategy: Extract title from IMDb ID (requires external API or user input) OR
     // Use a workaround: Stremio can pass extra parameters. We'll search by title if provided,
     // or return a placeholder stream asking user to search manually.
     // Better approach for this demo: Use the 'name' from extra if available, or fallback to search.
     // Actually, Stremio passes 'name' in extra when available.
     
     const name = extra?.name || imdbId;
     const season = extra?.season;
     const episode = extra?.episode;

     try {
       // Search for the movie/series on film4k.net
       const searchUrl = buildSearchUrl(name);
       const html = await fetchPage(searchUrl);
       const doc = parseHTML(html);
       const items = doc.querySelectorAll('.film_list-wrap .flw-item, .film_list .item, .film-poster');
       
       let targetSlug = null;
       items.forEach(item => {
         const movie = parseMovieCard(item);
         if (movie && movie.title && movie.title.toLowerCase().includes(name.toLowerCase().replace(/tt\d+/, '').trim())) {
           targetSlug = movie.slug;
         }
       });

       if (!targetSlug) {
         return formatStremioResponse({ streams: [] });
       }

       // Build URL based on type
       let detailUrl;
       if (type === 'series' && season && episode) {
         detailUrl = `${BASE_URL}/phim/${targetSlug}/tap-${episode}`;
       } else {
         detailUrl = `${BASE_URL}/phim/${targetSlug}`;
       }

       const detailHtml = await fetchPage(detailUrl);
       
       // Extract video URL
       // Note: film4k.net likely uses iframes or encrypted players.
       // This is a basic extractor. You may need to reverse-engineer the specific player.
       const videoUrl = extractVideoUrl(detailHtml);
       
       const streams = [];
       if (videoUrl) {
         streams.push({
           url: videoUrl.startsWith('http') ? videoUrl : `${BASE_URL}${videoUrl}`,
           title: `Film4K - ${name}`,
           type: 'video/mp4', // or 'video/webm'
           behaviorHints: {
             notWebReady: false,
             countryWhitelist: ['VN']
           }
         });
       } else {
         // Fallback: Link to the page if direct extraction fails
         streams.push({
           url: detailUrl,
           title: `Mở trang Film4K cho ${name} (Yêu cầu mở trong trình duyệt)`,
           type: 'http',
           behaviorHints: {
             notWebReady: true,
             countryWhitelist: ['VN']
           }
         });
       }

       return formatStremioResponse({ streams });
     } catch (error) {
       console.error('Stream error:', error);
       return formatStremioResponse({ streams: [] });
     }
   }

   export function handleManifest() {
     return formatStremioResponse(manifest);
   }                          
