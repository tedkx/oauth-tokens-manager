const config = require("./config"),
  credentials = require("./config/credentials"),
  { Pool } = require("pg");

const client = new pg.Client({
  /* conn config */
});

// Helper: Get token by auid, only if created within 2 minutes
async function getTokenByAuid(pool, auid) {
  const res = await pool.query(
    `SELECT token FROM tokens 
    WHERE auid = $1 AND created > NOW() - INTERVAL '${config.tokenTtl} seconds' 
    ORDER BY created DESC 
    LIMIT 1`,
    [auid]
  );
  return res.rows[0]?.token;
}

async function deleteExpiredTokens(pool) {
  await pool.query(
    `DELETE FROM tokens WHERE created < NOW() - INTERVAL '${config.tokenTtl} seconds'`
  );
}

module.exports = {
  initDb: () => {
    const pool = new Pool({
      ...credentials.pg,
      ...config.pg,
    });

    pool
      .query(
        `
      CREATE TABLE IF NOT EXISTS tokens (
        id SERIAL PRIMARY KEY,
        token TEXT NOT NULL,
        auid TEXT NOT NULL,
        created TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `
      )
      .catch((err) => {
        console.error("Error creating tokens table:", err);
      });

    return {
      saveToken: async (token, auid) => {
        return await saveToken(pool, token, auid);
      },
      getTokenByAuid: async (auid) => {
        return await getTokenByAuid(pool, auid);
      },
      deleteExpiredTokens: async () => {
        return await deleteExpiredTokens(pool);
      },
    };
  },
};
