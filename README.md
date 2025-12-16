# Cognito PKCE React + Node Demo

## Overview

Simple demo showing Amazon Cognito Hosted UI with PKCE using:

- React (frontend)
- Node.js + Express (backend)

## Prerequisites

- Node.js 18+

## Setup

### Backend

```bash
cd cognito-backend
npm install
node index.js
```

### Frontend

```bash
cd cognito-react-app
npm install
npm start
```

## Cognito Configuration (Required)

Configure your Cognito App Client with:

- OAuth Flow: Authorization code grant (PKCE)
- Allowed OAuth Scopes:
  - openid
  - email
  - profile
- Callback URL:
  - http://localhost:3000
- Sign-out URL:
  - http://localhost:3000

```

```
