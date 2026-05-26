<script lang="ts">
  import Icon from "@iconify/svelte";
  import type { SvelteSet } from "svelte/reactivity";
  import TagPill from "./TagPill.svelte";

  interface Props {
    allTags: string[];
    selectedTags: SvelteSet<string>;
    mode: "or" | "and";
  }

  // selectedTags is a shared reactive reference (no $bindable needed — mutations propagate);
  // mode is a primitive, so $bindable lets the child write back to the parent.
  let { allTags, selectedTags, mode = $bindable() }: Props = $props();

  let query = $state("");
  let isOpen = $state(false);
  let highlightedIndex = $state(0);
  let inputEl: HTMLInputElement | null = $state(null);
  let containerEl: HTMLDivElement | null = $state(null);
  let dropdownEl: HTMLDivElement | null = $state(null);

  // Seed from URL synchronously at init so the writeback effect below doesn't see
  // empty state on its first run and overwrite the URL with blanks. Wrapped in a
  // function so Svelte treats `selectedTags`/`mode` access as a closure read,
  // not a top-level reactive capture (state_referenced_locally).
  function seedFromUrl() {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const initialTags = params.get("tags")?.split(",").filter(Boolean) ?? [];
    for (const t of initialTags) selectedTags.add(t);
    if (params.get("mode") === "and" && initialTags.length >= 2) {
      mode = "and";
    }
  }
  seedFromUrl();

  // Reflect filter state in the URL — replaceState so toggling tags doesn't pollute history.
  $effect(() => {
    const params = new URLSearchParams();
    if (selectedTags.size > 0) {
      params.set("tags", [...selectedTags].join(","));
    }
    if (mode === "and" && selectedTags.size >= 2) {
      params.set("mode", "and");
    }
    const queryStr = params.toString();
    const newUrl = window.location.pathname + (queryStr ? "?" + queryStr : "");
    history.replaceState(history.state, "", newUrl);
  });

  // Re-sync on navigation. `popstate` covers back/forward; `astro:page-load`
  // covers ClientRouter view-transition swaps where the island may not be
  // re-instanced, so the top-of-script seed wouldn't re-run.
  $effect(() => {
    function syncFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const newTags = params.get("tags")?.split(",").filter(Boolean) ?? [];
      selectedTags.clear();
      for (const t of newTags) selectedTags.add(t);
      mode = params.get("mode") === "and" && newTags.length >= 2 ? "and" : "or";
      query = "";
      isOpen = false;
    }
    window.addEventListener("popstate", syncFromUrl);
    document.addEventListener("astro:page-load", syncFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      document.removeEventListener("astro:page-load", syncFromUrl);
    };
  });

  // Close the dropdown on outside pointerdown (fires before click, so the
  // dropdown is gone by the time a stray click would land elsewhere).
  $effect(() => {
    function handler(e: PointerEvent) {
      if (containerEl && !containerEl.contains(e.target as Node)) {
        isOpen = false;
      }
    }
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  });

  function matchTags(q: string, pool: string[]): string[] {
    const needle = q.trim().toLowerCase();
    if (!needle) return pool;
    const prefix: string[] = [];
    const interior: string[] = [];
    for (const t of pool) {
      const i = t.toLowerCase().indexOf(needle);
      if (i === 0) prefix.push(t);
      else if (i > 0) interior.push(t);
    }
    return [...prefix, ...interior];
  }

  let candidates = $derived(
    matchTags(
      query,
      allTags.filter((t) => !selectedTags.has(t)),
    ),
  );

  // Reset highlight to the top match whenever the query changes.
  $effect(() => {
    query;
    highlightedIndex = 0;
  });

  // Clamp highlight if the candidates list shrinks under it.
  $effect(() => {
    if (highlightedIndex >= candidates.length) {
      highlightedIndex = Math.max(0, candidates.length - 1);
    }
  });

  // Keep the highlighted row visible when arrow-key navigation moves past the viewport.
  $effect(() => {
    if (!isOpen) return;
    const el = dropdownEl?.querySelector(`[data-idx="${highlightedIndex}"]`);
    (el as HTMLElement | null)?.scrollIntoView({ block: "nearest" });
  });

  function selectTag(tag: string) {
    selectedTags.add(tag);
    query = "";
    highlightedIndex = 0;
    inputEl?.focus();
  }

  function removeTag(tag: string) {
    selectedTags.delete(tag);
    if (selectedTags.size < 2) mode = "or";
  }

  function clearAll() {
    selectedTags.clear();
    mode = "or";
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      isOpen = true;
      if (candidates.length > 0) {
        highlightedIndex = Math.min(highlightedIndex + 1, candidates.length - 1);
      }
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      if (candidates.length > 0) {
        highlightedIndex = Math.max(highlightedIndex - 1, 0);
      }
    } else if (e.key === "Enter") {
      if (isOpen && candidates[highlightedIndex]) {
        e.preventDefault();
        selectTag(candidates[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      isOpen = false;
      inputEl?.blur();
    }
  }
</script>

<div bind:this={containerEl}>
  {#if selectedTags.size > 0}
    <div class="flex flex-wrap items-center gap-1 min-h-6 mb-2">
      {#each [...selectedTags] as tag (tag)}
        <TagPill {tag} onclick={() => removeTag(tag)} class="hover:translate-y-0.5"/>
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
      <button
        onclick={clearAll}
        title="Clear all tags"
        aria-label="Clear all tags"
        class="ml-1 inline-flex items-center justify-center border border-rule text-ink-muted hover:text-ink hover:border-rule-strong transition-colors cursor-pointer"
      >
        <Icon icon="lucide:x" width={12} style="stroke-width: 1" aria-hidden="true" />
      </button>
    </div>
  {/if}

  <input
    bind:this={inputEl}
    type="text"
    bind:value={query}
    onfocus={() => (isOpen = true)}
    onkeydown={onKeyDown}
    placeholder="Filter by tag…"
    class="w-full max-w-lg text-xs border border-rule px-2 py-1 bg-transparent text-ink focus:outline-none focus:border-rule-strong placeholder:text-ink-muted placeholder:italic"
    role="combobox"
    aria-label="Filter projects by tag"
    aria-autocomplete="list"
    aria-expanded={isOpen}
    aria-controls="tag-filter-listbox"
  />

  {#if isOpen}
    <div
      bind:this={dropdownEl}
      id="tag-filter-listbox"
      class="mt-1 w-full max-w-lg border border-rule bg-paper max-h-64 overflow-y-auto p-2"
      role="listbox"
    >
      {#if candidates.length === 0}
        <p class="text-ink-muted text-xs italic">No matching tags.</p>
      {:else}
        <div class="flex flex-wrap gap-1">
          {#each candidates as tag, i (tag)}
            <span
              data-idx={i}
              onpointerenter={() => (highlightedIndex = i)}
              role="option"
              tabindex="-1"
              aria-selected={i === highlightedIndex}
            >
              <TagPill
                {tag}
                onclick={() => selectTag(tag)}
                class={i === highlightedIndex ? "-translate-y-0.5" : "hover:-translate-y-0.5"}
              />
            </span>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>