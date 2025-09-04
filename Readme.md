# OAuth token manager

Allows storage and retrieval of tokens generated through OAuth2 flow for multiple apps

### Configuration

Add client ids and secrets in `clients.js`
Postgres credentials in `credentials.js`
Postgres server configuration and token TTL in `config.js`

### Usage

1. GET /start?app=YOUR_APP&auid=UNIQUE_ID
2. Complete OAuth flow
3. GET /token?auid=UNIQUE_ID
