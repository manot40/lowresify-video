<script>
  export let group,
    value = "",
    label = "";
  import randHex from "../lib/randHex";
  const id = randHex(12);
</script>

<div class="flex items-center mr-4">
  <input id={`radio_${id}`} class="radio" type="radio" bind:group {value} />
  <label for={`radio_${id}`} class="radio-label">
    {label || value}
  </label>
</div>
