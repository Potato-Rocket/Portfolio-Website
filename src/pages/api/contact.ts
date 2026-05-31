import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

// On-demand route: this is the only SSR endpoint on an otherwise prerendered site.
// Under `astro dev` the Cloudflare adapter is skipped, so this won't run there —
// test it with `npm run preview` (real wrangler). See CLAUDE.md.
export const prerender = false;

// Runtime secrets. `env` from cloudflare:workers is typed by the generated Env
// (worker-configuration.d.ts via `npm run generate-types`), which is gitignored and
// may not exist yet — cast so this typechecks before the keys are wired up.
const secrets = env as unknown as {
  FASTMAIL_API_TOKEN?: string;
  TURNSTILE_SECRET_KEY?: string;
};

// --- Config (non-secret) ---------------------------------------------------
const JMAP_SESSION_URL = "https://api.fastmail.com/jmap/session";
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const MAIL_CAPABILITY = "urn:ietf:params:jmap:mail";
// Where the synthetic message is addressed; also the name of the Fastmail folder
// we drop it into. Architecture B: we never actually send (no EmailSubmission) —
// we create the message directly in this folder via Email/set.
const CONTACT_ADDRESS = "contact@stomberg.us";
const CONTACT_FOLDER_NAME = "Contact";

// Minimum seconds between page render and submit. Bots post instantly; humans don't.
const MIN_FILL_SECONDS = 2.5;
const MAX_NAME = 100;
const MAX_MESSAGE = 5000;

// --- Per-isolate caches ----------------------------------------------------
// A Worker isolate is reused across requests, so resolve the session + folder id
// once and reuse them. Cold request pays two extra JMAP round trips; warm ones don't.
let cachedSession: { apiUrl: string; accountId: string } | null = null;
let cachedMailboxId: string | null = null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function getSession(token: string) {
  if (cachedSession) return cachedSession;
  const res = await fetch(JMAP_SESSION_URL, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`JMAP session ${res.status}`);
  const data = (await res.json()) as {
    apiUrl: string;
    primaryAccounts: Record<string, string>;
  };
  const accountId = data.primaryAccounts[MAIL_CAPABILITY];
  if (!accountId) throw new Error("No mail account on JMAP session");
  cachedSession = { apiUrl: data.apiUrl, accountId };
  return cachedSession;
}

async function jmapCall(apiUrl: string, token: string, methodCalls: unknown[]) {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      using: ["urn:ietf:params:jmap:core", MAIL_CAPABILITY],
      methodCalls,
    }),
  });
  if (!res.ok) throw new Error(`JMAP api ${res.status}`);
  return (await res.json()) as { methodResponses: [string, any, string][] };
}

async function getContactMailboxId(apiUrl: string, accountId: string, token: string) {
  if (cachedMailboxId) return cachedMailboxId;
  // Fetch all mailboxes and match by exact name — cheaper to reason about than a
  // server-side substring filter, and the mailbox list is tiny.
  const result = await jmapCall(apiUrl, token, [
    ["Mailbox/get", { accountId, ids: null }, "0"],
  ]);
  const list = result.methodResponses[0]?.[1]?.list as
    | { id: string; name: string }[]
    | undefined;
  const folder = list?.find((m) => m.name === CONTACT_FOLDER_NAME);
  if (!folder) throw new Error(`Mailbox "${CONTACT_FOLDER_NAME}" not found`);
  cachedMailboxId = folder.id;
  return cachedMailboxId;
}

async function verifyTurnstile(secret: string, token: string, ip: string | null) {
  const form = new URLSearchParams({ secret, response: token });
  if (ip) form.set("remoteip", ip);
  const res = await fetch(TURNSTILE_VERIFY_URL, { method: "POST", body: form });
  if (!res.ok) return false;
  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}

export const POST: APIRoute = async ({ request }) => {
  // --- Parse ---------------------------------------------------------------
  let payload: {
    name?: string;
    email?: string;
    message?: string;
    website?: string; // honeypot
    ts?: number; // client render timestamp (ms epoch)
    turnstileToken?: string;
  };
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  // --- Honeypot: a filled hidden field means a bot. Pretend success. -------
  if (payload.website && payload.website.trim() !== "") {
    return json({ ok: true });
  }

  // --- Timing trap ---------------------------------------------------------
  const elapsed = typeof payload.ts === "number" ? (Date.now() - payload.ts) / 1000 : -1;
  if (elapsed < MIN_FILL_SECONDS) {
    return json({ ok: false, error: "too_fast" }, 400);
  }

  // --- Validate ------------------------------------------------------------
  const name = (payload.name ?? "").trim();
  const email = (payload.email ?? "").trim();
  const message = (payload.message ?? "").trim();
  if (!name || name.length > MAX_NAME) return json({ ok: false, error: "invalid_name" }, 400);
  if (!email || !EMAIL_RE.test(email)) return json({ ok: false, error: "invalid_email" }, 400);
  if (!message || message.length > MAX_MESSAGE)
    return json({ ok: false, error: "invalid_message" }, 400);

  // --- Turnstile (skipped if not configured yet, so JMAP can be tested first)
  if (secrets.TURNSTILE_SECRET_KEY) {
    if (!payload.turnstileToken) return json({ ok: false, error: "verification_failed" }, 403);
    const ip = request.headers.get("cf-connecting-ip");
    const ok = await verifyTurnstile(secrets.TURNSTILE_SECRET_KEY, payload.turnstileToken, ip);
    if (!ok) return json({ ok: false, error: "verification_failed" }, 403);
  } else {
    console.warn("TURNSTILE_SECRET_KEY not set — skipping captcha verification");
  }

  // --- Deliver via JMAP: create the message directly in the Contact folder --
  const token = secrets.FASTMAIL_API_TOKEN;
  if (!token) {
    console.error("FASTMAIL_API_TOKEN not set");
    return json({ ok: false, error: "send_failed" }, 502);
  }

  try {
    const { apiUrl, accountId } = await getSession(token);
    const mailboxId = await getContactMailboxId(apiUrl, accountId, token);

    // from = the visitor, so reply-to-sender just works and Fastmail composes the
    // reply as contact@ (the delivered-to identity). keywords:{} → shows unread.
    const receivedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    const result = await jmapCall(apiUrl, token, [
      [
        "Email/set",
        {
          accountId,
          create: {
            msg: {
              mailboxIds: { [mailboxId]: true },
              keywords: {},
              from: [{ name, email }],
              to: [{ email: CONTACT_ADDRESS }],
              replyTo: [{ name, email }],
              subject: `Portfolio contact from ${name}`,
              receivedAt,
              bodyValues: {
                body: {
                  value: `${message}\n\n— sent via the portfolio contact form (${email})`,
                },
              },
              textBody: [{ partId: "body", type: "text/plain" }],
            },
          },
        },
        "0",
      ],
    ]);

    const setResponse = result.methodResponses[0]?.[1];
    if (!setResponse?.created?.msg) {
      console.error("Email/set did not create message", JSON.stringify(setResponse));
      return json({ ok: false, error: "send_failed" }, 502);
    }
  } catch (err) {
    console.error("Contact JMAP error", err);
    return json({ ok: false, error: "send_failed" }, 502);
  }

  return json({ ok: true });
};
