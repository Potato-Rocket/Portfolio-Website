<script lang="ts">
  import tagColors from "../data/tag-colors.json";

  interface Props {
    tag: string;
    onclick?: () => void;
    class?: string;
  }

  const { tag, onclick, class: extraClass = "" }: Props = $props();

  const h = (tagColors as unknown as Record<string, number | null>)[tag] ?? null;
</script>

{#if onclick}
  <button
    {onclick}
    class="font-thin text-xs border py-0.5 px-1 inline-flex cursor-pointer {extraClass}"
    class:tag-color={h !== null}
    class:tag-grey={h === null}
    style={h !== null ? `--hue: ${h}` : undefined}
  >
    {tag.toUpperCase()}
  </button>
{:else}
  <span
    class="font-thin text-xs border py-0.5 px-1 inline-flex {extraClass}"
    class:tag-color={h !== null}
    class:tag-grey={h === null}
    style={h !== null ? `--hue: ${h}` : undefined}
  >
    {tag.toUpperCase()}
  </span>
{/if}