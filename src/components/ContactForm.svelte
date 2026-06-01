<script lang="ts">
  import { onMount, tick } from "svelte";
  import { ContactSchema, CONTACT_LIMITS, fieldErrorsFrom, type ContactInput } from "../lib/contactSchema";

  // Public Turnstile site key (safe to ship — the secret half lives server-side).
  const TURNSTILE_SITE_KEY = "0x4AAAAAADbr4aEuUD2rthdN";
  // Reply-to-sender address surfaced as a fallback when the form itself fails.
  const FALLBACK_EMAIL = "contact@stomberg.us";

  type Status = "idle" | "sending" | "success" | "error";
  let status = $state<Status>("idle");

  let name = $state("");
  let email = $state("");
  let subject = $state("");
  let message = $state("");

  // Per-field zod error codes (keyed by field name) — set by either the client
  // pre-check or the server's response; both use the same shared schema.
  let fieldErrors = $state<Record<string, string>>({});
  // General error message for the error state (captcha/server/network).
  let errorMessage = $state("");

  // Focus target for the success state so SR users aren't stranded when the
  // form is swapped out (it had focus on the submit button, now gone).
  let successHeadingEl: HTMLElement | null = $state(null);

  // Turnstile renders into this div once its script loads. Token is read on submit.
  // `turnstileEl` is null whenever the form isn't on screen (success state swaps it
  // out); the $effect below keys the widget's lifecycle off it. `scriptReady` flips
  // once the external API is available.
  let turnstileEl: HTMLDivElement | null = $state(null);
  let scriptReady = $state(false);
  let turnstileWidgetId: string | null = null;

  // Maps the endpoint's top-level `error` codes to user-facing copy. Only codes
  // that warrant distinct wording need an entry; everything else (send_failed,
  // bad_request, network) falls through to GENERIC_ERROR.
  const GENERIC_ERROR = "Something went wrong sending your message.";
  const ERROR_MESSAGES: Record<string, string> = {
    verification_failed: "We couldn't verify you're human. Please try again.",
  };

  // Maps a field's zod issue code to copy. Codes (`too_big` / `too_small` /
  // `invalid_format`) and bounds both come from the shared schema/limits.
  function fieldMessage(field: string, code: string): string {
    switch (field) {
      case "name":
        return code === "too_big"
          ? `Your name is too long (${CONTACT_LIMITS.name} characters max).`
          : "Please enter your name.";
      case "email":
        return code === "too_big" ? "That email address is too long." : "Please enter a valid email address.";
      case "subject":
        return `Subject is too long (${CONTACT_LIMITS.subject} characters max).`;
      case "message":
        return code === "too_big"
          ? `Your message is too long (${CONTACT_LIMITS.message} characters max).`
          : "Please enter a message.";
      default:
        return "Please check this field.";
    }
  }

  // The Turnstile global is injected by the external script.
  interface TurnstileAPI {
    render: (
      el: HTMLElement,
      opts: { sitekey: string; theme?: string; callback?: (t: string) => void },
    ) => string;
    reset: (id?: string) => void;
    remove: (id?: string) => void;
    getResponse: (id?: string) => string | undefined;
  }
  function getTurnstile(): TurnstileAPI | undefined {
    return (window as unknown as { turnstile?: TurnstileAPI }).turnstile;
  }

  onMount(() => {
    // Load the Turnstile script once and flip `scriptReady`; the $effect below
    // does the actual rendering. We don't render here because the container may
    // not exist yet (or may be recreated later, e.g. after "Send another").
    const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

    if (getTurnstile()) {
      scriptReady = true;
    } else if (!document.querySelector(`script[src="${SRC}"]`)) {
      const s = document.createElement("script");
      s.src = SRC;
      s.async = true;
      s.defer = true;
      s.addEventListener("load", () => (scriptReady = true));
      document.head.appendChild(s);
    } else {
      // Script tag exists (e.g. after a view-transition nav) but global may lag.
      const poll = setInterval(() => {
        if (getTurnstile()) {
          clearInterval(poll);
          scriptReady = true;
        }
      }, 100);
      return () => clearInterval(poll);
    }
  });

  // Render the widget whenever the container is mounted and the script is ready,
  // and tear it down when either goes away. This keys the widget's whole lifecycle
  // to `turnstileEl`, so the success-state swap (form removed) cleans up the old
  // widget and "Send another" (form re-rendered → fresh div) gets a fresh widget.
  $effect(() => {
    if (!scriptReady || !turnstileEl) return;
    const ts = getTurnstile();
    if (!ts) return;
    const id = ts.render(turnstileEl, { sitekey: TURNSTILE_SITE_KEY, theme: "auto" });
    turnstileWidgetId = id;
    return () => {
      ts.remove(id);
      turnstileWidgetId = null;
    };
  });

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (status === "sending") return;

    fieldErrors = {};
    errorMessage = "";

    // Client-side pre-check with the same schema the server enforces. Pure UX —
    // catches bad input without a round trip; the server still re-validates.
    const fields: ContactInput = { name, email, subject, message };
    const check = ContactSchema.safeParse(fields);
    if (!check.success) {
      fieldErrors = fieldErrorsFrom(check.error);
      return;
    }

    status = "sending";

    try {
      // Read the token inside the try — getResponse can throw on a stale widget id,
      // and we want that to land in the catch (and reset status) rather than hang.
      const turnstileToken = getTurnstile()?.getResponse(turnstileWidgetId ?? undefined) ?? "";

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...fields, turnstileToken }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        fields?: Record<string, string>;
      };

      if (res.ok && data.ok) {
        status = "success";
        await tick(); // wait for the success block to render, then move focus to it
        successHeadingEl?.focus();
        return;
      }

      // Reset the captcha token — it's single-use, so a retry needs a fresh one.
      getTurnstile()?.reset(turnstileWidgetId ?? undefined);

      if (res.status === 400 && data.fields) {
        // Validation: stay on the form, mark the offending fields.
        fieldErrors = data.fields;
        status = "idle";
      } else {
        // Everything else (verification_failed / send_failed / network) shares
        // the error state, message driven by the backend's error code.
        errorMessage = ERROR_MESSAGES[data.error ?? ""] ?? GENERIC_ERROR;
        status = "error";
      }
    } catch {
      getTurnstile()?.reset(turnstileWidgetId ?? undefined);
      errorMessage = GENERIC_ERROR;
      status = "error";
    }
  }

  function resetForm() {
    name = email = subject = message = "";
    fieldErrors = {};
    errorMessage = "";
    // No Turnstile reset here: the form (and its widget) is currently swapped out,
    // so the $effect cleanup already removed it. Flipping back to "idle" re-renders
    // the form, and the $effect renders a fresh widget into the new container.
    status = "idle";
  }

  // Shared field styling — mirrors TagFilter's inputs (hairline border, sharp
  // corners, paper bg). Invalid fields get the error-token border.
  const fieldClass =
    "w-full border border-rule px-3 py-2 bg-transparent text-ink " +
    "focus:outline-none focus:border-rule-strong placeholder:text-ink-muted placeholder:italic " +
    "aria-[invalid=true]:border-error";
</script>

<section class="mt-12 pt-8 border-t border-rule">
  <h2 class="font-serif text-2xl mb-1">Get in touch</h2>
  <p class="text-ink-muted text-sm mb-6">
    Drop me a message and it'll land straight in my inbox.
  </p>

  {#if status === "success"}
    <div class="border border-rule-strong px-4 py-6 text-center" role="status" aria-live="polite">
      <p
        bind:this={successHeadingEl}
        tabindex="-1"
        class="font-serif text-lg focus:outline-none"
      >
        Thanks — your message is on its way.
      </p>
      <p class="text-ink-muted text-sm mt-1">I'll get back to you soon.</p>
      <button
        type="button"
        onclick={resetForm}
        class="mt-4 text-xs border border-rule px-3 py-1 text-ink-muted hover:text-ink hover:border-rule-strong transition-colors cursor-pointer"
      >
        Send another
      </button>
    </div>
  {:else}
    <form onsubmit={handleSubmit} novalidate class="flex flex-col gap-4 max-w-xl">
      <div>
        <label for="cf-name" class="block font-serif text-sm mb-1">
          Name <span class="text-error" aria-hidden="true">*</span>
        </label>
        <input
          id="cf-name"
          type="text"
          bind:value={name}
          required
          maxlength={CONTACT_LIMITS.name}
          placeholder="Your name"
          aria-invalid={!!fieldErrors.name}
          aria-describedby={fieldErrors.name ? "cf-name-error" : undefined}
          class={fieldClass}
        />
        {#if fieldErrors.name}
          <p id="cf-name-error" class="text-error text-xs mt-1">{fieldMessage("name", fieldErrors.name)}</p>
        {/if}
      </div>

      <div>
        <label for="cf-email" class="block font-serif text-sm mb-1">
          Email <span class="text-error" aria-hidden="true">*</span>
        </label>
        <input
          id="cf-email"
          type="email"
          bind:value={email}
          required
          maxlength={CONTACT_LIMITS.email}
          placeholder="address@example.com"
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? "cf-email-error" : undefined}
          class={fieldClass}
        />
        {#if fieldErrors.email}
          <p id="cf-email-error" class="text-error text-xs mt-1">{fieldMessage("email", fieldErrors.email)}</p>
        {/if}
      </div>

      <div>
        <label for="cf-subject" class="block font-serif text-sm mb-1">Subject</label>
        <input
          id="cf-subject"
          type="text"
          bind:value={subject}
          maxlength={CONTACT_LIMITS.subject}
          placeholder="What's this about? (optional)"
          aria-invalid={!!fieldErrors.subject}
          aria-describedby={fieldErrors.subject ? "cf-subject-error" : undefined}
          class={fieldClass}
        />
        {#if fieldErrors.subject}
          <p id="cf-subject-error" class="text-error text-xs mt-1">{fieldMessage("subject", fieldErrors.subject)}</p>
        {/if}
      </div>

      <div>
        <label for="cf-message" class="block font-serif text-sm mb-1">
          Message <span class="text-error" aria-hidden="true">*</span>
        </label>
        <textarea
          id="cf-message"
          bind:value={message}
          required
          rows="6"
          maxlength={CONTACT_LIMITS.message}
          placeholder="Your message…"
          aria-invalid={!!fieldErrors.message}
          aria-describedby={fieldErrors.message ? "cf-message-error" : undefined}
          class={`${fieldClass} resize-y`}
        ></textarea>
        {#if fieldErrors.message}
          <p id="cf-message-error" class="text-error text-xs mt-1">{fieldMessage("message", fieldErrors.message)}</p>
        {/if}
      </div>

      <div bind:this={turnstileEl} class="cf-turnstile"></div>

      {#if status === "error"}
        <p class="text-error text-sm" role="alert">
          {errorMessage}
          You can email me directly at
          <a href={`mailto:${FALLBACK_EMAIL}`} class="underline underline-offset-2">{FALLBACK_EMAIL}</a>.
        </p>
      {/if}

      <div>
        <button
          type="submit"
          disabled={status === "sending"}
          class="inline-flex items-center gap-2 border border-rule px-4 py-1.5 text-ink-muted hover:text-ink hover:border-rule-strong transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if status === "sending"}
            <svg
              class="w-4 h-4 motion-safe:animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" opacity="0.25" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            Sending…
          {:else}
            Send message
          {/if}
        </button>
      </div>
    </form>
  {/if}
</section>
