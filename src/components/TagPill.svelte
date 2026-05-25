<script lang="ts">
  import tagColors from "../data/tag-colors.json";

  interface Props {
    tag: string;
    onclick: () => void;
    selected?: boolean;
    class?: string;
  }

  const { tag, onclick, selected = false, class: extraClass = "" }: Props = $props();

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