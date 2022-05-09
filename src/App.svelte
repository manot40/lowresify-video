<script>
  import { onMount } from "svelte";
  import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
  import readFromBlobOrFile from "./lib/readFromBlobOrFile";

  let ffmpeg,
    inFile,
    inUrl = "",
    crf = 42,
    resolution = "256x144",
    inFilename = "video.mp4",
    outFilename = "lowres.mp4",
    isProc = false,
    sError = "",
    sMessage = "",
    sProgress = 0,
    resultUrl = "";

  onMount(() => {
    if (!ffmpeg) initFfmpeg();
  });

  function initFfmpeg() {
    ffmpeg = createFFmpeg({
      log: true,
      corePath: "/script/ffmpeg-core.js",
    });
    ffmpeg.setProgress(({ ratio }) => {
      console.log(ratio);
      if (ratio >= 0 && ratio <= 1) {
        sProgress = ratio * 100;
      }
      if (ratio === 1) {
        setTimeout(() => {
          sProgress = 0;
        }, 1000);
      }
    });
  }

  function cleanup() {
    sMessage = "";
    sError = "";
    resultUrl = "";
    inFile = null;
    isProc = false;
    URL.revokeObjectURL(resultUrl);
    initFfmpeg();
  }

  const fetchVideo = async () => {
    const urlRegex =
      /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;
    if (!inUrl.match(urlRegex)) throw "Invalid URL";
    const video = await fetch(inUrl);
    const blob = await video.blob();
    inFile = new Uint8Array(await readFromBlobOrFile(blob));
  };

  const onFileUploaded = async (e) => {
    const {
      target: { files },
    } = e;
    inFile = new Uint8Array(await readFromBlobOrFile(files[0]));
  };

  const submitAction = async () => {
    sError = "";
    isProc = true;
    if (!inFile && !inUrl) {
      sError = "No file/url selected";
      isProc = false;
    } else {
      try {
        if (!inFile) await fetchVideo();
      } catch (e) {
        console.error(e);
        sError =
          "Can`t fetch video file from remote URL\nMake sure source URL correct or allowing cross-origin requests";
        isProc = false;
        return;
      }
      const start = Date.now();
      sMessage = "Loading neccessary toolkit";
      if (!ffmpeg.isLoaded()) {
        sMessage = "Loading neccessary toolkit (May take few minutes for first time)";
        const init = await ffmpeg.load().catch((e) => e);
        if (init?.message) {
          console.error(init.message);
          sError = "Error loading neccessary toolkit. Maybe reload and try once again?";
          isProc = false;
          return;
        }
      }
      sMessage = "Processing video...";
      ffmpeg.FS("writeFile", inFilename, await fetchFile(inFile));
      await ffmpeg.run(
        ...[
          "-i",
          inFilename,
          "-s",
          resolution,
          "-c:v",
          "libx264",  
          "-crf",
          crf.toString(),
          outFilename,
        ]
      );
      try {
        const data = ffmpeg.FS("readFile", outFilename);
        resultUrl = URL.createObjectURL(
          new Blob([data.buffer], { type: "video/mp4" })
        );
        sMessage = `Done in ${(Date.now() - start) / 1000} seconds`;
      } catch (e) {
        console.error(e);
        cleanup();
        sError = "Make sure you choose correct video format";
        isProc = false;
      }
    }
  };

  const download = () => {
    if (resultUrl) {
      const a = document.createElement("a");
      a.href = resultUrl;
      a.download = `${Date.parse(Date()) / 1000}_${outFilename}`;
      a.click();
    }
  }

  $: isLowres = () => {
    if (crf < 32) return "Not LowRes 😡";
    if (crf < 40) return "Almost LowRes 😳";
    if (crf < 50) return "LowRes 😍";
    if (crf >= 50) return "True LowRes 😎";
  };
</script>

<main>
  <div class="flex justify-center items-center h-screen">
    <div class="max-w-xl w-full px-8">
      <div class="-mt-12 mb-24 text-center select-none">
        <h1 class="text-[3.25rem] md:text-[4.8rem] font-glitch">LowResify</h1>
      </div>
      {#if !resultUrl}
        <input
          class="mb-4 text-sm"
          id="file_input"
          type="file"
          on:change={(e) => onFileUploaded(e)}
        />
        <input
          class="mb-4 text-sm block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
          type="url"
          placeholder="Or paste video URL"
          bind:value={inUrl}
        />
        <div class="mb-4">
          <div class="flex justify-between">
            <div class="flex items-center mr-4">
              <input
                checked
                type="radio"
                bind:group={resolution}
                value={"170x96"}
                name="inline-radio-group"
                class="radio"
              />
              <label for="inline-radio" class="radio-label">
                96p 🔥
              </label>
            </div>
            <div class="flex items-center mr-4">
              <input
                checked
                type="radio"
                bind:group={resolution}
                value={"256x144"}
                name="inline-radio-group"
                class="radio"
              />
              <label for="inline-radio" class="radio-label">
                144p 💗
              </label>
            </div>
            <div class="flex items-center mr-4">
              <input
                type="radio"
                bind:group={resolution}
                value={"426x240"}
                name="inline-radio-group"
                class="radio"
              />
              <label for="inline-radio" class="radio-label">
                240p ✨
              </label>
            </div>
            <div class="flex items-center mr-4">
              <input
                type="radio"
                bind:group={resolution}
                value={"640x360"}
                name="inline-radio-group"
                class="radio"
              />
              <label for="inline-radio" class="radio-label">
                360p 🅱️
              </label>
            </div>
          </div>
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
        {:else}
        <div class="w-full mb-12">
          <!-- svelte-ignore a11y-media-has-caption -->
          <video class="mb-4" src={resultUrl} width="100%" controls />
          <button
            class="mb-4 w-full rounded-lg px-5 py-2.5 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-blue-800 focus:ring-4"
            on:click={download}
          >
            Download
          </button>
          <button
          class="mb-10 w-full py-2.5 px-5 focus:outline-none rounded-lg border focus:z-10 focus:ring-4 focus:ring-gray-700 bg-gray-800 text-gray-400 border-gray-600 hover:text-white hover:bg-gray-700"
          on:click={cleanup}
          >
            Lowresify Another Video
          </button>
        </div>
      {/if}
      {#if !isProc}
        <button
          class="relative w-full inline-flex items-center justify-center p-0.5 mb-4 overflow-hidden text-sm rounded-lg group bg-blue-500 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:saturate-50 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-cyan-200 dark:focus:ring-cyan-800"
          disabled={!inFile && !inUrl}
          on:click={submitAction}
        >
          <span
            class="relative w-full px-5 py-2.5 transition-all ease-in duration-75 bg-gray-900 rounded-md"
            class:text-gray-400={!inFile && !inUrl}
            class:group-hover:bg-opacity-0={inFile || inUrl}
          >
            Submit
          </span>
        </button>
      {:else}
        <div class="flex justify-between mb-1">
          <span>{sMessage}</span>
          <span>{sProgress.toFixed(0)}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
          <div
            class="bg-blue-600 h-1.5 rounded-full"
            style={`width: ${sProgress}%`}
          />
        </div>
      {/if}
    </div>
    {#if sError}
      <div class="fixed top-8 max-w-xl">
        <div class="flex p-4 rounded-lg bg-red-200 text-red-800" role="alert" id="alert">
          <svg class="inline flex-shrink-0 mr-3 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
          <div>
            <h1 class="font-bold">Failed!</h1>
            <p class="text-sm">{sError}</p>
          </div>
          <button
            class="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg focus:ring-2 inline-flex h-8 w-8 bg-red-200 text-red-600 hover:bg-red-300"
            type="button"
            aria-label="Close"
            on:click={() => {sError = ""}}
          >
            <span class="sr-only">Close</span>
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
          </button>
        </div>
      </div>
    {/if}
  </div>
</main>
