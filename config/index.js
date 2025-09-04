module.exports = {
  // postgres server/database
  pg: {
    host: "localhost",
    database: "sso",
    port: 5432,
  },
  // token ttl in seconds
  tokenTtl: 120,
};
