<script lang="ts">
  import { onMount } from "svelte";
  import Icon from "@iconify/svelte";

  let visible = $state(false);

  onMount(() => {
    const update = () => { visible = window.scrollY > 300; };
    window.addEventListener("scroll", update, { passive: true });
    update();
    // Returning a function from onMount registers it as a cleanup — runs when
    // the component unmounts. Same idea as useEffect's return value in React.
    return () => window.removeEventListener("scroll", update);
  });
</script>

<button
  type="button"
  title="Go to top"
  aria-label="Go to top"
  onclick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
  class="fixed bottom-14 right-4 z-50 flex items-center justify-center w-8 h-8 border border-rule text-ink-muted hover:text-ink hover:border-rule-strong transition-opacity"
  class:opacity-0={!visible}
  class:pointer-events-none={!visible}
>
  <Icon icon="lucide:arrow-up" width={16} style="stroke-width: 1" aria-hidden="true" />
</button>
