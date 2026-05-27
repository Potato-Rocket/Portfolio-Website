<script lang="ts">
  import { onMount } from "svelte";

  // Matches StoredGreeting in the greeting-worker (UpstreamGreeting + lastSynced).
  interface GreetingData {
    date: string;
    greeting: string;
    log: string;
    pipeline: string;
    album: { name: string; artist: string; year: number; genres: string[] };
    weather: { temperature: number; humidity: number; windSpeed: string; conditions: string };
    lastSynced: string;
  }

  const MOCK: GreetingData = {
    date: "2026-05-26",
    greeting:
      "Good morning. The forecast calls for scattered clouds and a high near 64°F -- a reasonable backdrop for today's selection. This morning's excerpt comes courtesy of Project Gutenberg, and the album pairs with it better than expected. Enjoy the day ahead.",
    log: "[08:00:01] Weather fetched\n[08:00:02] Gutenberg excerpt accepted on attempt 1\n[08:00:04] Album selected\n[08:00:05] Greeting generated\n[08:00:07] TTS complete",
    pipeline: "weather → excerpt  Live · synced less than an hour ago→ album_select → album_art_desc → greeting → tts",
    album: { name: "Mad Mad World", artist: "Tom Cochrane", year: 1991, genres: ["rock", "pop"] },
    weather: { temperature: 64, humidity: 62, windSpeed: "8 mph", conditions: "Partly cloudy" },
    lastSynced: new Date(Date.now() - 2 * 3_600_000).toISOString(),
  };

  let status = $state<"loading" | "success" | "offline">("loading");
  let data = $state<GreetingData | null>(null);

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  function formatDate(ymd: string, short: boolean = false): string {
    const d = new Date(ymd + "T00:00:00Z");
    return short
      ? `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`
      : `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  }

  function albumLabel(a: GreetingData["album"]): string {
    return `${a.name} — ${a.artist} (${a.year})`;
  }

  function isStale(ymd: string): boolean {
    const d = new Date();
    const today = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    return ymd !== today;
  }

  function syncedAgo(iso: string): string {
    const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
    if (h < 1) return "synced less than an hour ago";
    if (h === 1) return "synced 1 hour ago";
    if (h < 24) return `synced ${h} hours ago`;
    return "synced yesterday";
  }

  onMount(() => {
    if (import.meta.env.DEV) {
      const greetingParam = new URLSearchParams(location.search).get("greeting");
      setTimeout(() => {
        if (greetingParam === "offline") { status = "offline"; return; }
        if (greetingParam === "stale") {
          data = { ...MOCK, date: "2026-05-26" };
        } else {
          data = MOCK;
        }
        status = "success";
        document.dispatchEvent(new CustomEvent("greeting:live"));
      }, 400);
      return;
    }

    fetch("/api/greeting")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<GreetingData>;
      })
      .then((json) => {
        data = json;
        status = "success";
        document.dispatchEvent(new CustomEvent("greeting:live"));
      })
      .catch(() => {
        status = "offline";
      });
  });
</script>

<figure class="not-prose my-8 border border-rule-strong">
  {#if status === "loading"}
    <div class="p-6 sm:p-8 font-sans text-sm text-ink-muted italic">
      Loading today's greeting&hellip;
    </div>
  {:else if status === "offline" || !data}
    <div class="p-6 sm:p-8">
      <p class="font-sans text-sm text-ink-muted italic">
        The live demo is currently offline. See the example below.
      </p>
    </div>
    <figcaption
      class="border-t border-rule px-6 py-2 font-sans text-xs text-ink-muted italic text-center flex items-center justify-center gap-1.5"
    >
      <span class="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shrink-0"></span>
      Live demo &middot; currently offline
    </figcaption>
  {:else}
    <div class="p-6 sm:p-8">
      <h2 class="font-serif text-lg text-ink mb-1">{formatDate(data.date)}</h2>
      <p class="font-sans text-xs text-ink-muted mb-4">
        {data.weather.temperature}&deg;F &middot; {data.weather.conditions} &middot; Humidity: {Math.round(data.weather.humidity)}% &middot; Wind: {data.weather.windSpeed}
      </p>

      <div
        class="border border-rule p-4 sm:p-6 mb-4 font-sans text-base text-ink leading-relaxed whitespace-pre-wrap"
      >
        {data.greeting}
      </div>

      <div class="flex items-center gap-4 mb-4 flex-wrap">
        <img
          src="/api/greeting/cover"
          alt="Album cover art"
          title={albumLabel(data.album)}
          class="w-24 h-24 object-cover border border-rule-strong shrink-0"
          loading="lazy"
        />
        <audio
          controls
          preload="none"
          src="/api/greeting/audio"
          class="flex-1 min-w-56 max-w-lg"
        ></audio>
      </div>

      <details class="mb-2">
        <summary
          class="cursor-pointer font-sans font-semibold text-sm text-ink-muted select-none"
        >
          Pipeline Log
        </summary>
        <pre
          class="mt-2 border border-rule p-3 overflow-x-auto max-h-72 text-xs leading-relaxed whitespace-pre-wrap wrap-break-word font-mono text-ink"
        >{data.pipeline}</pre>
      </details>

      <details class="mb-2">
        <summary
          class="cursor-pointer font-sans font-semibold text-sm text-ink-muted select-none"
        >
          Execution Log
        </summary>
        <pre
          class="mt-2 border border-rule p-3 overflow-x-auto max-h-72 text-xs leading-relaxed whitespace-pre-wrap wrap-break-word font-mono text-ink"
        >{data.log}</pre>
      </details>
    </div>

    <figcaption
      class="border-t border-rule px-6 py-2 font-sans text-xs text-ink-muted italic text-center flex items-center justify-center gap-1.5"
    >
      <span class="w-1.5 h-1.5 rounded-full animate-pulse shrink-0 {isStale(data.date) ? 'bg-yellow-500' : 'bg-green-500'}"></span>
      {#if isStale(data.date)}
        Live &middot; showing {formatDate(data.date, true)} greeting &middot; today's generation may be delayed
      {:else}
        Live &middot; {syncedAgo(data.lastSynced)}
      {/if}
    </figcaption>
  {/if}
</figure>