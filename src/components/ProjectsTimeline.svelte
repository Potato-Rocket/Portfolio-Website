<script lang="ts">
  import TagPill from "./TagPill.svelte";

  type ProjectRow = {
    id: string;
    title: string;
    summary: string;
    tags: string[];
    status: "complete" | "wip" | "ongoing";
    dateLabel: string;
    year: number;
    thumbPath: string | null;
  };

  interface Props {
    projects: ProjectRow[];
  }

  const { projects }: Props = $props();

  let selectedTags = $state(new Set<string>());
  let mode = $state<"or" | "and">("or");

  // Seed from URL query params (?tags=a,b&mode=and).
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const tagsParam = params.get("tags");
    const initialTags = tagsParam
      ? new Set(tagsParam.split(",").filter(Boolean))
      : new Set<string>();
    selectedTags = initialTags;
    if (params.get("mode") === "and" && initialTags.size >= 2) {
      mode = "and";
    }
  }

  // Reflect filter state in the URL — replaceState so toggling tags doesn't pollute history.
  $effect(() => {
    const params = new URLSearchParams();
    if (selectedTags.size > 0) {
      params.set("tags", [...selectedTags].join(","));
    }
    if (mode === "and" && selectedTags.size >= 2) {
      params.set("mode", "and");
    }
    const query = params.toString();
    const newUrl = window.location.pathname + (query ? "?" + query : "");
    history.replaceState(history.state, "", newUrl);
  });

  // Re-sync state on browser back/forward (popstate fires when the URL changes without a nav).
  $effect(() => {
    function syncFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const tagsParam = params.get("tags");
      const newTags = tagsParam ? new Set(tagsParam.split(",").filter(Boolean)) : new Set<string>();
      selectedTags = newTags;
      mode = params.get("mode") === "and" && newTags.size >= 2 ? "and" : "or";
    }
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  });

  function toggleTag(tag: string) {
    const next = new Set(selectedTags);
    if (next.has(tag)) {
      next.delete(tag);
    } else {
      next.add(tag);
    }
    selectedTags = next;
    if (selectedTags.size < 2) mode = "or";
  }

  let filteredProjects = $derived(
    selectedTags.size === 0
      ? projects
      : projects.filter((p) =>
          mode === "or"
            ? p.tags.some((t) => selectedTags.has(t))
            : [...selectedTags].every((t) => p.tags.includes(t)),
        ),
  );

  let rows = $derived.by(() => {
    let prevYear: number | null = null;
    return filteredProjects.map((p, i) => {
      const isFirstOfYear = p.year !== prevYear;
      prevYear = p.year;
      return { ...p, isFirstOfYear, filteredIndex: i };
    });
  });


</script>

<!-- Thumbnail: img if available, hatch SVG otherwise -->
{#snippet thumbnail(row: ProjectRow)}
  <div class="h-32 shrink-0 self-start aspect-video border border-rule-strong overflow-hidden">
    {#if row.thumbPath}
      <img
        src={row.thumbPath}
        alt=""
        class="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />
    {:else}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        class="transition-transform duration-500 ease-out group-hover:scale-105"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id={`hatch-${row.id}`}
            patternUnits="userSpaceOnUse"
            width="12"
            height="12"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="12" stroke="var(--color-rule-strong)" stroke-width="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#hatch-${row.id})`} />
      </svg>
    {/if}
  </div>
{/snippet}

<div class="max-w-4xl mx-auto px-4 sm:px-12 py-8">
  <!-- Tag filter bar: mirrors the timeline grid so the content column aligns with thumbnails -->
  <div class="xs:grid xs:grid-cols-[4rem_1fr] xs:gap-x-8 sm:grid-cols-[6rem_1fr] sm:gap-x-12 mb-8">
    <div class="hidden xs:block"></div>
    <div class="flex flex-wrap items-center gap-1 min-h-6">
    {#if selectedTags.size === 0}
      <p class="text-ink-muted text-xs italic">Click a tag to filter projects.</p>
    {:else}
      {#each [...selectedTags] as tag}
        <TagPill {tag} onclick={() => toggleTag(tag)} />
      {/each}
      {#if selectedTags.size >= 2}
        <button
          onclick={() => (mode = mode === "or" ? "and" : "or")}
          title={mode === "or"
            ? "Switch to: all selected tags must match"
            : "Switch to: any selected tag must match"}
          class="ml-1 text-xs border border-rule px-2 py-0.5 text-ink-muted hover:text-ink hover:border-rule-strong transition-colors cursor-pointer"
        >
          {mode === "or" ? "ANY" : "ALL"}
        </button>
      {/if}
    {/if}
    </div>
  </div>

  <!-- Timeline -->
  <div class="relative">
    <!-- Vertical rail — xs+ only.
         left- is measured from this div's edge (no padding here), so values are
         year-col-width + half-gap: xs = 4rem + 1rem = 5rem, sm = 6rem + 1.5rem = 7.5rem. -->
    <div class="hidden xs:block absolute inset-y-0 border-l border-rule xs:left-20 sm:left-30"></div>

    {#if rows.length === 0}
      <p class="text-ink-muted italic text-center py-12">No projects match the selected tags.</p>
    {:else}
      <div
        class="flex flex-col gap-6 xs:grid xs:grid-cols-[4rem_1fr] xs:gap-x-8 xs:gap-y-6 xs:items-start sm:grid-cols-[6rem_1fr] sm:gap-x-12"
      >
        {#each rows as row}
          <!-- Year cell -->
          <div
            class="text-2xl font-serif text-left xs:text-right
              {!row.isFirstOfYear ? 'hidden xs:block' : ''}
              {row.isFirstOfYear && row.filteredIndex > 0 ? 'xs:pt-4' : ''}"
          >
            {#if row.isFirstOfYear}
              <span class="relative inline-block">
                {row.year}
                <span class="hidden xs:block absolute left-full top-1/2 xs:w-8 sm:w-12 border-t border-rule"
                ></span>
              </span>
            {/if}
          </div>

          <!-- Entry cell -->
          <div class={row.isFirstOfYear && row.filteredIndex > 0 ? "xs:pt-4" : ""}>
            <article class="group relative z-0 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <!-- Stretched background link: makes the thumbnail area navigate to the project.
                   Tag buttons in the text content sit above it via z-10. -->
              <a href={`/projects/${row.id}`} tabindex="-1" aria-hidden="true" class="absolute inset-0 z-0"
              ></a>

              {@render thumbnail(row)}

              <!-- Text content: z-10 so it sits above the stretched link -->
              <div class="relative z-10 max-w-104 sm:flex-1 sm:min-w-[18rem]">
                <h2 class="text-xl">
                  <a href={`/projects/${row.id}`} class="group-hover:underline underline-offset-2">
                    {row.title}{#if row.status === "wip"}<span class="font-light font-sans">&nbsp;· WIP</span>{/if}
                  </a>
                </h2>
                <p class="text-ink-muted text-sm">{row.dateLabel}</p>
                <div class="py-1">
                  {#each row.tags as tag}
                    <TagPill {tag} onclick={() => toggleTag(tag)} class="mr-1 mb-1" />
                  {/each}
                </div>
                <p>{row.summary}</p>
              </div>
            </article>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
