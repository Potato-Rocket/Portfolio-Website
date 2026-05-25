<script lang="ts">
  import Icon from "@iconify/svelte";
  import TagPill from "./TagPill.svelte";
  import ProjectThumbnailLink from "./ProjectThumbnailLink.svelte";

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

  // Seed from URL synchronously at component init so the writeback effect below
  // doesn't see empty state on its first run and overwrite the URL with blanks.
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

  // Re-sync on navigation. `popstate` covers back/forward; `astro:page-load`
  // covers ClientRouter view-transition swaps where the island may not be
  // re-instanced, so the top-of-script seed above wouldn't re-run.
  $effect(() => {
    function syncFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const tagsParam = params.get("tags");
      const newTags = tagsParam ? new Set(tagsParam.split(",").filter(Boolean)) : new Set<string>();
      selectedTags = newTags;
      mode = params.get("mode") === "and" && newTags.size >= 2 ? "and" : "or";
    }
    window.addEventListener("popstate", syncFromUrl);
    document.addEventListener("astro:page-load", syncFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      document.removeEventListener("astro:page-load", syncFromUrl);
    };
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

<div class="max-w-4xl mx-auto px-4 sm:px-12 py-8">
  <!-- Tag filter bar: mirrors the timeline grid so the content column aligns with thumbnails -->
  <div class="xs:grid xs:grid-cols-[4rem_1fr] xs:gap-x-8 sm:grid-cols-[6rem_1fr] sm:gap-x-12 mb-8">
    <div class="hidden xs:block"></div>
    <div class="flex flex-wrap items-center gap-1 min-h-6">
    {#if selectedTags.size === 0}
      <p class="text-ink-muted text-xs italic">Click a tag to filter projects.</p>
    {:else}
      <span class="translate-y-0.5 flex flex-wrap items-center gap-1 min-h-6">
        {#each [...selectedTags] as tag}
          <TagPill {tag} onclick={() => toggleTag(tag)} selected class="hover:translate-y-0"/>
        {/each}
      </span>
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
      <button
        onclick={() => {
          selectedTags = new Set();
          mode = "or";
        }}
        title="Clear all tags"
        aria-label="Clear all tags"
        class="ml-1 inline-flex items-center justify-center border border-rule text-ink-muted hover:text-ink hover:border-rule-strong transition-colors cursor-pointer"
      >
        <Icon icon="lucide:x" width={12} style="stroke-width: 1" aria-hidden="true" />
      </button>
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
            <article class="group flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <ProjectThumbnailLink id={row.id} href={`/projects/${row.id}`} thumbPath={row.thumbPath} />

              <div class="max-w-104 sm:flex-1 sm:min-w-[18rem]">
                <h2 class="text-xl">
                  <a href={`/projects/${row.id}`} class="group-hover:underline underline-offset-2">
                    {row.title}{#if row.status === "wip"}<span class="font-light font-sans">&nbsp;· WIP</span>{/if}
                  </a>
                </h2>
                <p class="text-ink-muted text-sm">{row.dateLabel}</p>
                <div class="py-1">
                  {#each row.tags as tag}
                    <TagPill
                      {tag}
                      onclick={() => toggleTag(tag)}
                      selected={selectedTags.has(tag)}
                      class="mr-1 mb-1"
                    />
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
