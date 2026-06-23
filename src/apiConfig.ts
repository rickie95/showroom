const BASE_URL_COOKIE = "showroom.baseUrl";
const AUTH_TOKEN_COOKIE = "showroom.authToken";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type ApiConfig = {
  baseUrl: string;
  authToken: string;
};

function isBrowser() {
  return typeof document !== "undefined";
}

function isSecureContext() {
  return globalThis.location?.protocol === "https:";
}

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/$/, "");
}

function normalizeToken(value: string) {
  return value.trim();
}

function readCookie(name: string) {
  if (!isBrowser()) {
    return "";
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  if (!cookie) {
    return "";
  }

  return decodeURIComponent(cookie.slice(name.length + 1));
}

function writeCookie(name: string, value: string) {
  if (!isBrowser()) {
    return;
  }

  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Max-Age=${COOKIE_MAX_AGE}`,
    "Path=/",
    "SameSite=Lax",
  ];

  if (isSecureContext()) {
    parts.push("Secure");
  }

  document.cookie = parts.join("; ");
}

function deleteCookie(name: string) {
  if (!isBrowser()) {
    return;
  }

  const parts = [`${name}=`, "Max-Age=0", "Path=/", "SameSite=Lax"];

  if (isSecureContext()) {
    parts.push("Secure");
  }

  document.cookie = parts.join("; ");
}

export function getApiConfig(): ApiConfig {
  const baseUrl = normalizeBaseUrl(readCookie(BASE_URL_COOKIE));
  const authToken = normalizeToken(readCookie(AUTH_TOKEN_COOKIE));

  return {
    baseUrl,
    authToken,
  };
}

export function hasApiConfig() {
  const config = getApiConfig();
  return Boolean(config.baseUrl && config.authToken);
}

export function saveApiConfig(config: ApiConfig) {
  writeCookie(BASE_URL_COOKIE, normalizeBaseUrl(config.baseUrl));
  writeCookie(AUTH_TOKEN_COOKIE, normalizeToken(config.authToken));
}

export function clearApiConfig() {
  deleteCookie(BASE_URL_COOKIE);
  deleteCookie(AUTH_TOKEN_COOKIE);
}
