<script lang="ts">
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
  let visible = $state(true);

  onMount(() => {
    document.addEventListener("greeting:live", () => { visible = false; }, { once: true });
  });
</script>

{#if visible}
  {@render children()}
{/if}