<script lang="ts">
  import { SvelteSet } from "svelte/reactivity";
  import TagPill from "./TagPill.svelte";
  import ProjectThumbnail from "./ProjectThumbnail.svelte";
  import TagFilter from "./TagFilter.svelte";

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

  // SvelteSet is its own reactive primitive — do NOT wrap it in $state. Doing so layers
  // a second proxy on top that breaks the in-place reactivity on .add/.delete/.clear.
  // The Set is passed by reference to TagFilter, which mutates it; URL sync lives there.
  const selectedTags = new SvelteSet<string>();
  let mode = $state<"or" | "and">("or");

  let allTags = $derived([...new Set(projects.flatMap((p) => p.tags))].sort());

  function toggleTag(tag: string) {
    if (selectedTags.has(tag)) selectedTags.delete(tag);
    else selectedTags.add(tag);
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

  // $derived.by (block form) instead of $derived(expr): we need a local accumulator
  // (prevYear) carried across the map, which the single-expression form can't express.
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
    <TagFilter {allTags} {selectedTags} bind:mode />
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
        {#each rows as row (row.id)}
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
              <ProjectThumbnail id={row.id} href={`/projects/${row.id}`} thumbPath={row.thumbPath} />

              <div class="max-w-104 sm:flex-1 sm:min-w-[18rem]">
                <h2 class="text-xl">
                  <a href={`/projects/${row.id}`} class="group-hover:underline underline-offset-2">
                    {row.title}{#if row.status === "wip"}<span class="font-light font-sans">&nbsp;· WIP</span>{/if}
                  </a>
                </h2>
                <p class="text-ink-muted text-sm">{row.dateLabel}</p>
                <div class="py-1">
                  {#each row.tags as tag (tag)}
                    <TagPill
                      {tag}
                      onclick={() => toggleTag(tag)}
                      class="mr-1 mb-1 hover:-translate-y-0.5"
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