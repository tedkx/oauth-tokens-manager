const config = require("./config"),
  credentials = require("./config/credentials"),
  { Pool } = require("pg");

async function saveToken(pool, token, auid) {
  await pool.query(
    "INSERT INTO tokens(token, auid, created) VALUES($1, $2, NOW())",
    [token, auid]
  );
}

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
