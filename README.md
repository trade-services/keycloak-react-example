# Keycloak React Authentication Sample

A simple React application demonstrating Keycloak authentication with standard OAuth 2.0 flow.

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Keycloak

Update `src/App.js` with your Keycloak settings:

```javascript
let initOptions = {
  url: "https://your-keycloak-server.com/",
  realm: "your-realm-name",
  clientId: "your-client-id",
};
```

### 3. Run the Application

#### HTTPS Mode (Recommended)

```bash
npm run start-https
```

Access: `https://localhost:3000`

#### HTTP Mode

```bash
npm start
```

Access: `http://localhost:3000`

## Keycloak Client Configuration

Your Keycloak client should be configured as:

- **Client authentication**: `Off` (public client)
- **Standard flow**: `Enabled`
- **Valid redirect URIs**: `https://localhost:3000/*`
- **Web origins**: `https://localhost:3000`

## Features

- ✅ Standard OAuth 2.0 flow with PKCE
- ✅ Automatic token refresh
- ✅ HTTPS support
- ✅ Error handling
- ✅ HTTP client with token injection

## Dependencies

- **keycloak-js**: ^26.0.1
- **react**: ^18.2.0
- **axios**: ^1.4.0

## Sample Login Credentials

For testing purposes, use these credentials:

- **Username**: `custom-officer`
- **Password**: `p@55w0rd`

## Usage

The app automatically handles:

- User authentication
- Token management
- API requests with authentication headers

Check browser console for authentication status and token information.
