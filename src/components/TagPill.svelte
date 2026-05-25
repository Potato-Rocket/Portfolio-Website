<script lang="ts">
  import tagColors from "../data/tag-colors.json";

  interface Props {
    tag: string;
    onclick: () => void;
    selected?: boolean;
    class?: string;
  }

  // `class` is reserved in JS — rename on destructure so the prop name stays `class` for callers.
  const { tag, onclick, selected = false, class: extraClass = "" }: Props = $props();

  // $derived (not const): an {#each} block can reuse a component instance with a new `tag`,
  // and a `const` evaluates once at init — it would go stale on prop change.
  let h = $derived((tagColors as unknown as Record<string, number | null>)[tag] ?? null);
</script>

<button
  {onclick}
  class="font-thin text-xs border py-0.5 px-1 inline-flex cursor-pointer transition-transform {selected ? '-translate-y-0.5' : 'hover:-translate-y-0.5'} {extraClass}"
  class:tag-color={h !== null}
  class:tag-grey={h === null}
  style={h !== null ? `--hue: ${h}` : undefined}
>
  {tag.toUpperCase()}
</button>