// src/index.js
const { addonBuilder } = require('stremio-addon-sdk');
const scraper = require('./scraper');

const manifest = require('../manifest.json');
const builder = new addonBuilder(manifest);

// ------------------- Catalog -------------------
builder.defineCatalogHandler(async ({ type, id, extra }) => {
  if (type !== 'movie' || id !== 'latest') {
    return { metas: [] };
  }

  const movies = await scraper.getLatestMovies();
  const metas = movies.map(m => ({
    id: m.id,
    type: 'movie',
    name: m.name,
    poster: m.poster,
    year: m.year
  }));

  // Tìm kiếm (nếu có extra.search)
  if (extra && extra.search) {
    const term = extra.search.toLowerCase();
    return {
      metas: metas.filter(m => m.name.toLowerCase().includes(term))
    };
  }

  return { metas };
});

// ------------------- Meta -------------------
builder.defineMetaHandler(async ({ type, id }) => {
  if (type !== 'movie') return { meta: {} };
  const meta = await scraper.getMeta(id);
  return { meta };
});

// ------------------- Stream -------------------
builder.defineStreamHandler(async ({ type, id }) => {
  if (type !== 'movie') return { streams: [] };
  const streams = await scraper.getStreams(id);
  // Định dạng lại cho Stremio
  const formatted = streams.map(s => ({
    url: s.url,
    title: s.name,
    name: s.name,
    // quality được Stremio hiểu nếu có trong `title` hoặc `name`
  }));
  return { streams: formatted };
});

// Export handler cho Cloudflare Workers
module.exports = builder.getInterface();
