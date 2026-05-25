<script lang="ts">
  import { onMount } from "svelte";
  import Icon from "@iconify/svelte";

  // $state() is Svelte 5's reactive primitive. Reading `isDark` anywhere in
  // the template automatically re-renders that part when the value changes —
  // no useState setter, no dependency array, no manual DOM query needed.
  let isDark = $state(false);

  onMount(() => {
    // The Layout inline script already applied the class before this component
    // mounted, so we just sync our state to match the DOM.
    isDark = document.documentElement.classList.contains("dark");
  });

  function toggle() {
    isDark = !isDark;
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }
</script>

<button
  type="button"
  title={isDark ? "Switch to light mode" : "Switch to dark mode"}
  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
  onclick={toggle}
  class="fixed bottom-4 right-4 z-50 flex items-center justify-center w-8 h-8 border border-rule text-ink-muted hover:text-ink hover:border-rule-strong transition-colors"
>
  <!--
    {#if} is Svelte's conditional block — compiles to a direct DOM insert/remove,
    not a CSS toggle. The old component toggled visibility with dark:hidden /
    dark:block, which required both icons to always be in the DOM.
  -->
  {#if isDark}
    <Icon icon="lucide:sun" width={16} style="stroke-width: 1" aria-hidden="true" />
  {:else}
    <Icon icon="lucide:moon" width={16} style="stroke-width: 1" aria-hidden="true" />
  {/if}
</button>