<script>
  import Radio from "./components/Radio.svelte";
  import readFromBlobOrFile from "./lib/readFromBlobOrFile";

  export let crf = 42,
    isVertical = false,
    inFile = null,
    inUrl = "",
    resolution = "256x144",
    inFilename = "";

  $: isLowres = () => {
    if (crf < 32) return "Not LowRes 😡";
    if (crf < 40) return "Almost LowRes 😳";
    if (crf < 50) return "LowRes 😍";
    if (crf >= 50) return "True LowRes 😎";
  };

  const onFileUploaded = async (e) => {
    const {
      target: { files },
    } = e;
    inFilename = files[0].name;
    inFile = new Uint8Array(await readFromBlobOrFile(files[0]));
  };
</script>

<div class="flex">
  <label class="file-input" for="file-input">Upload Video</label>
  <div class="ml-4 mt-2.5">
    <p class:text-gray-400={!inFilename} class="select-none max-w-xs truncate">
      {inFilename || "No file selected"}
    </p>
  </div>
  <input id="file-input" type="file" on:change={(e) => onFileUploaded(e)} />
</div>
<input
  class="mb-4 block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
  type="url"
  placeholder="Or paste video URL [ e.g https://some.url/xxx.mp4 ]"
  bind:value={inUrl}
/>
<div class="mb-4">
  <div class="flex justify-between">
    <Radio bind:group={resolution} value="170x96" label="96p 🔥" />
    <Radio bind:group={resolution} value="256x144" label="144p 💗" />
    <Radio bind:group={resolution} value="426x240" label="240p ✨" />
    <Radio bind:group={resolution} value="640x360" label="360p 🅱️" />
  </div>
</div>
<div class="flex items-center mb-4 space-x-2">
  <input
    class="w-4 h-4 rounded focus:ring-blue-600 ring-offset-gray-800 focus:ring-2 bg-gray-700 border-gray-600"
    id="isVertical"
    type="checkbox"
    bind:checked={isVertical}
  />
  <label for="isVertical">Video have vertical ratio</label>
</div>
<div class="mb-8">
  <div class="flex justify-between">
    <label for="minmax-range">Quality</label>
    <span>{isLowres()}</span>
  </div>
  <input
    class="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-700"
    id="minmax-range"
    type="range"
    min="16"
    max="64"
    bind:value={crf}
  />
</div>
