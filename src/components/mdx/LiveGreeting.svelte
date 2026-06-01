<script lang="ts">
  import { onMount } from "svelte";
  import SAMPLE from "../../data/daily-greeting.json";

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

  let { devCoverSrc, devAudioSrc }: { devCoverSrc?: string; devAudioSrc?: string } = $props();

  const _d = new Date();
  const todayYMD = `${_d.getUTCFullYear()}-${String(_d.getUTCMonth() + 1).padStart(2, "0")}-${String(_d.getUTCDate()).padStart(2, "0")}`;

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
    return ymd !== todayYMD;
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
        data = SAMPLE as GreetingData;
        data.date = greetingParam === "stale" ? "2026-04-19" : todayYMD;
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
      <span class="w-1.5 h-1.5 bg-error rounded-full animate-pulse shrink-0"></span>
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

      <div class="flex items-start gap-4 mb-4 flex-wrap">
        <div class="shrink-0 flex flex-col gap-1.5">
          <img
            src={import.meta.env.DEV && devCoverSrc ? devCoverSrc : `/api/greeting/cover?d=${data.date}`}
            alt="Album cover art"
            class="w-24 h-24 object-cover border border-rule-strong"
            loading="lazy"
          />
          <p class="font-sans text-xs text-ink-muted leading-snug w-24">{albumLabel(data.album)}</p>
        </div>
        <div class="flex-1 min-w-56 max-w-lg flex items-center h-24">
          <audio
            controls
            preload="none"
            src={import.meta.env.DEV && devAudioSrc ? devAudioSrc : `/api/greeting/audio?d=${data.date}`}
            class="w-full"
          ></audio>
        </div>
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
      <span class="w-1.5 h-1.5 rounded-full animate-pulse shrink-0 {isStale(data.date) ? 'bg-warning' : 'bg-success'}"></span>
      {#if isStale(data.date)}
        Live &middot; showing {formatDate(data.date, true)} greeting &middot; today's generation may be delayed
      {:else}
        Live &middot; {syncedAgo(data.lastSynced)}
      {/if}
    </figcaption>
  {/if}
</figure>