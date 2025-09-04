const clients = require("./config/clients"),
  { initDb } = require("./db"),
  express = require("express"),
  axios = require("axios"),
  app = express(),
  PORT = process.env.PORT || 8080,
  { PROVIDERS, DEFAULT_PROVIDER } = require("./constants");

const db = initDb();

const validateAndExtractData = (appName) => {
  const client = clients[appName];
  if (!client) return { error: "Unknown app" };

  const provider = PROVIDERS[client.provider || DEFAULT_PROVIDER];
  if (!provider) return { error: "Unknown provider" };

  return { client, provider };
};

app.get("/start", (req, res) => {
  const { app: appName, auid } = req.query;
  if (!appName || !auid) return res.status(400).send("Missing app or auid");

  const { client, provider, error } = validateAndExtractData(appName);
  if (error) return res.status(400).send(error);

  const state = JSON.stringify({ app: appName, auid });
  const params = new URLSearchParams({
    client_id: client.client_id,
    redirect_uri: client.redirect_uri,
    response_type: "code",
    scope: client.scope || "openid email profile",
    state,
  });

  res.redirect(provider.getInitUrl(params));
});

// OAuth2 callback endpoint
app.get("/", async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) return res.status(400).send("Missing code or state");

  let appName, auid;
  try {
    const stateObj = JSON.parse(state);
    appName = stateObj.app;
    auid = stateObj.auid;
  } catch (e) {
    return res.status(400).send("Invalid state parameter");
  }

  const { client, provider, error } = validateAndExtractData(appName);
  if (error) return res.status(400).send(error);

  try {
    const tokenRes = await axios.post(
      provider.getAuthorizationUrl(),
      null,
      provider.formatAuthorizationPayload(code, client)
    );
    const token = tokenRes.data.access_token;
    await db.saveToken(token, auid);
    res.send(`
        <html>
            <body>
                <div style="margin: 15% auto; text-align: center">
                    <h3>OAuth2 Success</h3>
                    <p>${token}</p>
                </div>
            </body>
        </html>
    `);
  } catch (err) {
    res.status(500).send("Token exchange failed: " + err.message);
  }
});

// GET /token?auid=...
app.get("/token", async (req, res) => {
  const { auid } = req.query;
  if (!auid) return res.status(400).send("Missing auid");
  try {
    const token = await db.getTokenByAuid(auid);
    if (!token) return res.status(404).send("Token not found or expired");
    res.json({ token });
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
});

// Every 5 minutes, delete expired tokens
setInterval(() => {
  db.deleteExpiredTokens()
    .then(() => console.log("Expired tokens deleted"))
    .catch((err) => console.error("Error deleting expired tokens:", err));
}, 5 * 60 * 1000);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`OAuth2 landing page listening on port ${PORT}`);
});
