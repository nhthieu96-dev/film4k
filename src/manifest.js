export const manifest = {
  id: "film4k",
  version: "1.0.0",
  name: "Film4K",
  description: "Addon xem phim từ Film4K.net - Phim Việt, Phim Lẻ, Phim Bộ",
  catalogues: [
    {
      id: "film4k-popular",
      name: "Film4K - Phim Phổ Biến",
      type: "movie",
      extraSupported: ["genre", "sortBy"],
      behaviorHints: {
        configurable: true,
        configurationRequired: false
      }
    },
    {
      id: "film4k-trending",
      name: "Film4K - Phim Hot",
      type: "movie",
      extraSupported: ["genre"],
      behaviorHints: {
        configurable: true,
        configurationRequired: false
      }
    },
    {
      id: "film4k-series",
      name: "Film4K - Phim Bộ",
      type: "series",
      extraSupported: ["genre"],
      behaviorHints: {
        configurable: true,
        configurationRequired: false
      }
    },
    {
      id: "film4k-vietnamese",
      name: "Film4K - Phim Việt",
      type: "movie",
      extraSupported: ["genre"],
      behaviorHints: {
        configurable: true,
        configurationRequired: false
      }
    }
  ],
  streams: [
    {
      id: "movie",
      type: "movie"
    },
    {
      id: "series",
      type: "series"
    }
  ],
  resources: ["catalog", "stream", "search"],
  types: ["movie", "series"],
  idPrefixes: ["tt"],
  behaviorHints: {
    configurable: true,
    configurationRequired: false
  }
};
