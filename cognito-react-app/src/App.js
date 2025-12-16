import React, { useState, useEffect } from "react";

// -------------------
// Cognito Configuration
// -------------------
const CLIENT_ID = ""; // Replace with your App Client ID
const REDIRECT_URI = "http://localhost:3000"; // Must match Cognito app
const LOGOUT_URI = "http://localhost:3000"; // Must match Cognito app
const COGNITO_DOMAIN = ""; // e.g., 'myapp.auth.us-west-2.amazoncognito.com'

// -------------------
// PKCE Helper Functions
// -------------------
const generateRandomString = (length) => {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  for (let i = 0; i < array.length; i++) {
    result += charset[array[i] % charset.length];
  }
  return result;
};

const base64UrlEncode = (arrayBuffer) => {
  let str = "";
  const bytes = new Uint8Array(arrayBuffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const generateCodeChallenge = async (codeVerifier) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
};

// Decode JWT to extract user info
const parseJwt = (token) => {
  const base64Url = token.split(".")[1];
  const base64 = decodeURIComponent(
    atob(base64Url)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(base64);
};

// -------------------
// Main App
// -------------------
const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // -------------------
  // Check for authorization code in URL
  // -------------------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      fetchTokens(code);
      // Remove code from URL for clean UI
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  // -------------------
  // Login using PKCE
  // -------------------
  const login = async () => {
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Store code_verifier temporarily
    sessionStorage.setItem("code_verifier", codeVerifier);

    const scope = "openid email profile";
    const codeChallengeMethod = "S256";

    const cognitoAuthUrl =
      `${COGNITO_DOMAIN}/login?` +
      `response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
      )}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&code_challenge_method=${codeChallengeMethod}` +
      `&code_challenge=${codeChallenge}`;

    window.location.href = cognitoAuthUrl;
  };

  const fetchTokens = async (code) => {
    // Retrieve code_verifier from sessionStorage
    const codeVerifier = sessionStorage.getItem("code_verifier");
    if (!codeVerifier) {
      console.error("No code_verifier found in sessionStorage");
      return;
    }

    try {
      // Call your backend to exchange code for tokens
      const response = await fetch("http://localhost:4000/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, code_verifier: codeVerifier }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Token request failed: ${errText}`);
      }

      const data = await response.json();
      const { id_token, access_token } = data;

      if (access_token) localStorage.setItem("accessToken", access_token);

      // Parse user info from ID token
      const user = parseJwt(id_token);
      setUserInfo(user);
      setIsAuthenticated(true);

      // Remove code_verifier from storage
      sessionStorage.removeItem("code_verifier");

      // Clean URL
      window.history.replaceState({}, document.title, "/");
    } catch (err) {
      console.error("Error fetching tokens:", err);
    }
  };

  // -------------------
  // Logout
  // -------------------
  const logout = () => {
    localStorage.removeItem("accessToken");
    setIsAuthenticated(false);
    setUserInfo(null);

    // alert()

    window.location.href =
      `${COGNITO_DOMAIN}/logout` +
      `?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent(LOGOUT_URI)}`;
  };

  // -------------------
  // UI
  // -------------------
  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>React + Cognito Login (PKCE)</h1>

      {!isAuthenticated ? (
        <button
          onClick={login}
          style={{ padding: "0.5rem 1rem", fontSize: "1rem" }}
        >
          Login with Cognito
        </button>
      ) : (
        <div>
          <h2>Welcome, {userInfo?.name || userInfo?.email}</h2>
          <p>Email: {userInfo?.email}</p>
          <button
            onClick={logout}
            style={{ padding: "0.5rem 1rem", fontSize: "1rem" }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
