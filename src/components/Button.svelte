<script>
  import { createEventDispatcher } from "svelte";

  export let type = "",
    className = "",
    disabled = false;

  let style;
  const dispatch = createEventDispatcher();

  const clicked = () => dispatch("click");

  switch (type) {
    case "primary":
      style =
        "relative inline-flex items-center justify-center p-0.5 mb-4 overflow-hidden rounded-lg group bg-blue-500 disabled:bg-gray-800 disabled:saturate-50 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-cyan-200 dark:focus:ring-cyan-800";
      break;
    case "secondary":
      style =
        "py-2.5 px-5 focus:outline-none rounded-lg border focus:z-10 focus:ring-4 focus:ring-gray-700 bg-gray-800 text-gray-400 border-gray-600 hover:text-white hover:bg-gray-700";
      break;
    default:
      style =
        "rounded-lg px-5 py-2.5 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-blue-800 focus:ring-4";
      break;
  }
</script>

<button
  {disabled}
  class={`${className} ${style} disabled:cursor-not-allowed`}
  on:click={clicked}
>
  {#if type === "primary"}
    <span
      class="relative w-full px-5 py-2.5 transition-all ease-in duration-75 bg-gray-900 rounded-md"
      class:text-gray-400={disabled}
      class:group-hover:bg-opacity-0={!disabled}
    >
      <slot />
    </span>
  {:else}
    <slot />
  {/if}
</button>
