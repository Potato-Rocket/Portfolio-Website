<script lang="ts">
  import Icon from "@iconify/svelte";

  interface Props {
    id: string;
    href: string;
    thumbPath: string | null;
    demoHref?: string | null;
  }

  const { id, href, thumbPath, demoHref }: Props = $props();
</script>

<div class="relative h-32 shrink-0 self-start aspect-video">
  <!-- aria-hidden + tabindex=-1: the title link below is the canonical, named link for screen
       readers and keyboard nav. This is a mouse/touch affordance only — no double-announce. -->
  <a
    {href}
    tabindex="-1"
    aria-hidden="true"
    class="block w-full h-full border border-rule-strong overflow-hidden"
  >
    {#if thumbPath}
      <img
        src={thumbPath}
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
            id={`hatch-${id}`}
            patternUnits="userSpaceOnUse"
            width="12"
            height="12"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="12" stroke="var(--color-rule-strong)" stroke-width="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#hatch-${id})`} />
      </svg>
    {/if}
  </a>
  {#if demoHref}
    <a
      href={demoHref}
      aria-label="Watch demo"
      class="absolute top-2 right-2 z-10 flex items-center justify-center w-7 h-7 border border-rule bg-paper hover:border-rule-strong focus:outline-none focus-visible:border-rule-strong transition-colors"
    >
      <Icon icon="lucide:circle-play" width={16} class="text-ink" />
    </a>
  {/if}
</div>