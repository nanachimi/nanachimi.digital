import "dotenv/config";
import * as OTPAuth from "otpauth";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const BASE = "http://127.0.0.1:3000";
const USER = process.env.ADMIN_USERNAME;
const PASS = process.env.ADMIN_PASSWORD;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Read secret (DB first, env fallback — same logic as src/lib/auth/totp.ts)
async function getSecret() {
  try {
    const s = await prisma.adminSetting.findUnique({ where: { key: "admin_totp_secret" } });
    if (s?.value) return s.value;
  } catch {}
  return process.env.ADMIN_TOTP_SECRET;
}

// Step 1: login
const loginRes = await fetch(`${BASE}/api/admin/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: USER, password: PASS }),
});
const loginJson = await loginRes.json();
console.log("login:", loginRes.status, loginJson);
const setCookie = loginRes.headers.get("set-cookie");
let cookie = (setCookie?.match(/ncd-admin-session=[^;]+/) ?? [""])[0];

if (loginJson.next === "totp") {
  const secret = await getSecret();
  if (!secret) throw new Error("no stored TOTP secret");
  const totp = new OTPAuth.TOTP({
    issuer: "NanaChimi Digital",
    label: "Admin",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  const code = totp.generate();
  const verifyRes = await fetch(`${BASE}/api/admin/auth/verify-totp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ code }),
  });
  console.log("verify:", verifyRes.status, await verifyRes.text());
  const s2 = verifyRes.headers.get("set-cookie");
  const m2 = s2?.match(/ncd-admin-session=[^;]+/);
  if (m2) cookie = m2[0];
} else if (loginJson.next === "setup-2fa") {
  const enrollRes = await fetch(`${BASE}/api/admin/auth/setup-totp`, {
    headers: { Cookie: cookie },
  });
  const enrollJson = await enrollRes.json();
  const totp = new OTPAuth.TOTP({
    issuer: "NanaChimi Digital",
    label: "Admin",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(enrollJson.secret),
  });
  const code = totp.generate();
  const confirmRes = await fetch(`${BASE}/api/admin/auth/setup-totp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ code, secret: enrollJson.secret }),
  });
  console.log("confirm:", confirmRes.status, await confirmRes.text());
  const s2 = confirmRes.headers.get("set-cookie");
  const m2 = s2?.match(/ncd-admin-session=[^;]+/);
  if (m2) cookie = m2[0];
}

const sessRes = await fetch(`${BASE}/api/admin/auth/session`, { headers: { Cookie: cookie } });
console.log("session:", sessRes.status, await sessRes.text());
fs.writeFileSync("scripts/tmp/admin-cookie.txt", cookie);
console.log("cookie written");
await prisma.$disconnect();
