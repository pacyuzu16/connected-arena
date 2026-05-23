"use client";
/**
 * cognito.js  —  thin wrapper around amazon-cognito-identity-js
 *
 * Exports:
 *   signUp(email, password, name)  → Promise<void>  (sends verification email)
 *   confirmSignUp(email, code)     → Promise<void>
 *   signIn(email, password)        → Promise<{ jwt, sub, email, name }>
 *   signOut()                      → void
 *   getGoogleOAuthUrl()            → string  (redirect URL for Google login)
 *   exchangeCodeForTokens(code)    → Promise<{ jwt, sub, email, name }>
 *   currentUser()                  → { jwt, sub, email, name } | null  (from localStorage)
 *   refreshSession()               → Promise<{ jwt, sub, email, name } | null>
 */

import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";

const POOL_ID   = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
const DOMAIN    = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
const CDN_BASE  = process.env.NEXT_PUBLIC_CDN_BASE || "https://d1706ex99mjina.cloudfront.net";

// Redirect URI — current origin so it works on both localhost and CloudFront
function redirectUri() {
  if (typeof window === "undefined") return CDN_BASE;
  return window.location.origin;
}

let _pool = null;
function getPool() {
  if (!_pool) {
    _pool = new CognitoUserPool({ UserPoolId: POOL_ID, ClientId: CLIENT_ID });
  }
  return _pool;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function parseJwt(token) {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch {
    return {};
  }
}

function storeSession({ jwt, sub, email, name }) {
  localStorage.setItem("arena-cognito-jwt",   jwt);
  localStorage.setItem("arena-cognito-sub",   sub);
  localStorage.setItem("arena-cognito-email", email || "");
  localStorage.setItem("arena-cognito-name",  name  || "");
}

function clearSession() {
  ["arena-cognito-jwt","arena-cognito-sub","arena-cognito-email","arena-cognito-name"]
    .forEach(k => localStorage.removeItem(k));
}

function buildResult(session) {
  const jwt     = session.getIdToken().getJwtToken();
  const payload = parseJwt(jwt);
  const result  = {
    jwt,
    sub:   payload.sub   || "",
    email: payload.email || "",
    name:  payload.name  || payload["cognito:username"] || "",
  };
  storeSession(result);
  return result;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function currentUser() {
  if (typeof window === "undefined") return null;
  const jwt = localStorage.getItem("arena-cognito-jwt");
  if (!jwt) return null;
  const payload = parseJwt(jwt);
  // Check expiry (exp is seconds since epoch)
  if (payload.exp && payload.exp * 1000 < Date.now()) return null;
  return {
    jwt,
    sub:   localStorage.getItem("arena-cognito-sub")   || "",
    email: localStorage.getItem("arena-cognito-email") || "",
    name:  localStorage.getItem("arena-cognito-name")  || "",
  };
}

export function signUp(email, password, displayName) {
  return new Promise((resolve, reject) => {
    const attrs = [
      new CognitoUserAttribute({ Name: "email", Value: email }),
      new CognitoUserAttribute({ Name: "name",  Value: displayName }),
    ];
    getPool().signUp(email, password, attrs, null, (err) => {
      if (err) reject(err);
      else     resolve();
    });
  });
}

export function confirmSignUp(email, code) {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: getPool() });
    user.confirmRegistration(code, true, (err) => {
      if (err) reject(err);
      else     resolve();
    });
  });
}

export function signIn(email, password) {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: getPool() });
    const auth = new AuthenticationDetails({ Username: email, Password: password });
    user.authenticateUser(auth, {
      onSuccess: (session) => resolve(buildResult(session)),
      onFailure: (err)     => reject(err),
      newPasswordRequired: (attrs) => reject(new Error("NEW_PASSWORD_REQUIRED")),
    });
  });
}

export function signOut() {
  const pool = getPool();
  const user = pool.getCurrentUser();
  if (user) user.signOut();
  clearSession();
}

export function refreshSession() {
  return new Promise((resolve) => {
    const pool = getPool();
    const user = pool.getCurrentUser();
    if (!user) { resolve(null); return; }
    user.getSession((err, session) => {
      if (err || !session?.isValid()) { clearSession(); resolve(null); return; }
      resolve(buildResult(session));
    });
  });
}

/**
 * Cognito Managed Login URL — redirects to the hosted UI.
 * Shows all configured identity providers (Cognito + Google once added).
 * Do NOT pass identity_provider here — let Cognito show what's available.
 */
export function getManagedLoginUrl() {
  const params = new URLSearchParams({
    response_type: "code",
    client_id:     CLIENT_ID,
    redirect_uri:  redirectUri(),
    scope:         "openid email profile",
  });
  return `https://${DOMAIN}/oauth2/authorize?${params}`;
}

/**
 * Google-specific URL — only use once Google IdP is added to the User Pool.
 * Skips the hosted UI and goes straight to Google's consent page.
 */
export function getGoogleOAuthUrl() {
  const params = new URLSearchParams({
    response_type:     "code",
    client_id:         CLIENT_ID,
    redirect_uri:      redirectUri(),
    identity_provider: "Google",
    scope:             "openid email profile",
  });
  return `https://${DOMAIN}/oauth2/authorize?${params}`;
}

/**
 * Exchange the authorization code (from ?code=... in the URL) for tokens.
 * Called once after Google redirects back to the app.
 */
export async function exchangeCodeForTokens(code) {
  const resp = await fetch(`https://${DOMAIN}/oauth2/token`, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:   "authorization_code",
      client_id:    CLIENT_ID,
      redirect_uri: redirectUri(),
      code,
    }),
  });
  if (!resp.ok) throw new Error("Token exchange failed: " + (await resp.text()));
  const tokens  = await resp.json();
  const payload = parseJwt(tokens.id_token);
  const result  = {
    jwt:   tokens.id_token,
    sub:   payload.sub   || "",
    email: payload.email || "",
    name:  payload.name  || payload["cognito:username"] || "",
  };
  storeSession(result);
  return result;
}
