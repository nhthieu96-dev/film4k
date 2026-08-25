// src/scraper.js
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Lấy danh sách phim mới (trang 1)
 * @returns {Promise<Array<{id:string, name:string, poster:string, year:string}>>}
 */
async function getLatestMovies() {
  const url = 'https://film4k.net/category/phim-le/';
  const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const $ = cheerio.load(data);
  const movies = [];

  $('.post').each((_, el) => {
    const a = $(el).find('h2.entry-title a');
    const link = a.attr('href');
    const id = `film4k:${link.replace('https://film4k.net/', '').replace(/\//g, '-')}`;
    const name = a.text().trim();
    const poster = $(el).find('img').attr('src') || '';
    const year = $(el).find('.meta-year').text().trim() || '';

    movies.push({ id, name, poster, year });
  });

  return movies;
}

/**
 * Lấy chi tiết một bộ phim
 * @param {string} id   (định dạng film4k:slug)
 * @returns {Promise<Object>}
 */
async function getMeta(id) {
  const slug = id.replace('film4k:', '').replace(/-/g, '/');
  const url = `https://film4k.net/${slug}/`;
  const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const $ = cheerio.load(data);

  const name = $('h1.entry-title').text().trim();
  const poster = $('.post-thumbnail img').attr('src') || '';
  const description = $('.entry-content p').first().text().trim();
  const year = $('.meta-year').text().trim();

  return {
    id,
    type: 'movie',
    name,
    poster,
    description,
    year,
    imdbRating: null,
    runtime: null,
    genres: []   // có thể lấy thêm từ trang nếu muốn
  };
}

/**
 * Lấy danh sách stream (link video) cho một bộ phim
 * @param {string} id
 * @returns {Promise<Array<{url:string, name:string, quality:string}>>}
 */
async function getStreams(id) {
  const slug = id.replace('film4k:', '').replace(/-/g, '/');
  const playerUrl = `https://film4k.net/player/${slug.split('/').pop()}/`;
  const { data } = await axios.get(playerUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const $ = cheerio.load(data);

  // Giả sử có <iframe src="...embed..."> hoặc <source src="...m3u8">
  const iframeSrc = $('iframe').attr('src');
  if (!iframeSrc) return [];

  // Nếu iframe dẫn tới một trang khác, ta fetch lại
  const { data: embedHtml } = await axios.get(iframeSrc, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const $$ = cheerio.load(embedHtml);
  const videoUrl = $$('source').attr('src') || $$('video').attr('src');

  if (!videoUrl) return [];

  // Xác định chất lượng (nếu có trong URL)
  const quality = videoUrl.includes('1080') ? '1080p' :
                  videoUrl.includes('720')  ? '720p'  : 'SD';

  return [{
    url: videoUrl,
    name: `${quality} (Film4K)`,
    quality
  }];
}

module.exports = {
  getLatestMovies,
  getMeta,
  getStreams
};
