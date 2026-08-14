const { fetch } = require("undici");
require("dotenv").config();

const BASE = (process.env.AUTHLYX_API_BASE || "https://authly.cc").replace(/\/+$/, "");
const KEY = process.env.AUTHLYX_ELITE_KEY;

const SENSITIVE_ACTIONS = new Set([
  "add", "generate", "create", "edit", "delete", "ban", "unban",
  "pause", "unpause", "extend", "shorten", "reset_password", "set", "reset",
  "verify_password",
]);

async function eliteRequest(fn, action, appName, params = {}) {
  if (!KEY) throw new Error("AUTHLYX_ELITE_KEY is not set in .env");

  const isPost = SENSITIVE_ACTIONS.has(action);

  const url = new URL(`${BASE}/api/elite-key`);
  url.searchParams.set("function", fn);
  url.searchParams.set("action", action);

  if (!isPost) {
    url.searchParams.set("url_prefix", BASE);
    url.searchParams.set("app_name", appName);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    });
  }

  const res = await fetch(url.toString(), {
    method: isPost ? "POST" : "GET",
    headers: {
      "x-elite-key": KEY,
      ...(isPost ? { "content-type": "application/json" } : {}),
    },
    body: isPost ? JSON.stringify({ url_prefix: BASE, app_name: appName, ...params }) : undefined,
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`Invalid response from AuthlyX: ${text.slice(0, 200)}`); }

  if (!res.ok) {
    throw new Error(data?.error || data?.detail || `AuthlyX error ${res.status}`);
  }
  return data;
}

module.exports = { eliteRequest };
