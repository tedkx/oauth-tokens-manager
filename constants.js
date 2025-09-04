const DEFAULT_PROVIDER = "google";

const PROVIDERS = {
  google: {
    getInitUrl: (params) =>
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    getAuthorizationUrl: () => "https://oauth2.googleapis.com/token",
    formatAuthorizationPayload: (code, client) => ({
      params: {
        code,
        client_id: client.client_id,
        client_secret: client.client_secret,
        redirect_uri: client.redirect_uri,
        grant_type: "authorization_code",
      },
    }),
  },
};

module.exports = {
  DEFAULT_PROVIDER,
  PROVIDERS,
};
