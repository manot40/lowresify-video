<script>
  // Modules
  import { onMount } from "svelte";
  import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
  // Component
  import Form from "./Form.svelte";
  import ErrorAlert from "./ErrorAlert.svelte";
  import Button from "./components/Button.svelte";
  // Libs
  import readFromBlobOrFile from "./lib/readFromBlobOrFile";
  import BlobStore from "./lib/BlobStore";

  const blobStore = new BlobStore();

  let ffmpeg,
    inFile = null,
    inUrl = "",
    crf = 42,
    resolution = "256x144",
    inFilename = "",
    outFilename = "lowres.mp4",
    isRun = false,
    isVertical = false,
    logErr = "",
    logMsg = "",
    progress = 0,
    resultUrl = "";

  onMount(() => {
    if (!ffmpeg) {
      ffmpeg = createFFmpeg({
        log: process.env.NODE_ENV === "development",
        corePath: "/script/ffmpeg-core.js",
      });
      ffmpeg.setProgress(({ ratio }) => {
        if (ratio >= 0 && ratio <= 1) {
          progress = ratio * 100;
        }
        if (ratio === 1) {
          setTimeout(() => {
            progress = 0;
          }, 1000);
        }
      });
    }
  });

  function cleanup(all) {
    if (all) {
      inFilename = "";
      inFile = null;
      inUrl = "";
    }
    logMsg = "";
    logErr = "";
    isRun = false;
    resultUrl = "";
    blobStore.dispose();
  }

  function handleError(err) {
    cleanup();
    console.error(err.message);
    logErr = err.message;
  }

  const fetchVideo = async () => {
    logMsg = "Fetching video file...";
    const isUrl = /^http(s)?:\/\//.test(inUrl);
    if (!isUrl) throw new Error("Invalid URL entered!");
    const res = await fetch(inUrl);
    if (res.status < 400) {
      const blob = await res.blob();
      inFilename = "video.mp4";
      inFile = new Uint8Array(await readFromBlobOrFile(blob));
    } else {
      throw new Error("Remote server refusing to give required resource");
    }
  };

  const submitAction = async () => {
    logErr = "";
    isRun = true;

    // Verify if the file from URL is a video
    try {
      if (inUrl) await fetchVideo();
    } catch (err) {
      handleError(err);
      return;
    }

    // Verify if the file uploaded is a video
    const isVideo = /\.(mp4|webm|avi|mkv)$/i.test(inFilename);
    if (!isVideo || (!inFile && !inUrl)) {
      cleanup();
      !isVideo
        ? (logErr = "Invalid video type. Accepted type: mp4, webm, avi, mkv")
        : (logErr = "No file/url selected");
      return;
    }

    // For Encode speed metric
    const start = Date.now();

    // Fetching WASM module
    if (!ffmpeg.isLoaded()) {
      logMsg = "Loading neccessary toolkit (Take few minutes for first time)";
      const init = await ffmpeg.load().catch((e) => e);
      if (init?.message) {
        handleError({
          message: "Error loading neccessary toolkit. Reload and try again?",
        });
        return;
      }
    }

    // Begin encoding
    logMsg = "Processing video...";
    ffmpeg.FS("writeFile", inFilename, await fetchFile(inFile));
    await ffmpeg.run(
      ...[
        "-i",
        inFilename,
        "-c:v",
        "libx264",
        "-s",
        !isVertical ? resolution : resolution.split("x").reverse().join("x"),
        "-crf",
        crf.toString(),
        outFilename,
      ]
    );

    // Encode finished, writing result to blob
    try {
      const data = ffmpeg.FS("readFile", outFilename);
      blobStore.setBlob([data.buffer], { type: "video/mp4" });
      resultUrl = blobStore.getURL();
      logMsg = `Done in ${(Date.now() - start) / 1000} seconds`;
    } catch (err) {
      handleError({
        message: "Make sure resource have correct video format"
      });
    }
  };

  // Download result from blob storage
  const download = () => {
    if (resultUrl) {
      const a = document.createElement("a");
      a.href = resultUrl;
      a.download = `${Date.parse(Date()) / 1000}_${outFilename}`;
      a.click();
    }
  };
</script>

<main>
  <div class="flex justify-center items-center my-12 h-[85vh] md:my-0 md:h-screen">
    <div class="max-w-xl w-full px-8">
      <div class="-mt-12 mb-24 text-center select-none">
        <h1 class="text-[3.25rem] md:text-[4.8rem] font-glitch">LowResify</h1>
      </div>
      {#if !resultUrl}
        <Form
          bind:inFilename
          bind:resolution
          bind:isVertical
          bind:inFile
          bind:inUrl
          bind:crf
        />
      {:else}
        <div class="w-full mb-12">
          <!-- svelte-ignore a11y-media-has-caption -->
          <video class="mb-4" src={resultUrl} width="100%" controls />
          <Button className="w-full mb-3" on:click={download}>
            Download Video
          </Button>
          <Button
            type="secondary"
            className="w-full"
            on:click={() => cleanup(true)
          }>
            Lowresify Another Video
          </Button>
        </div>
      {/if}
      {#if !isRun}
        <Button
          disabled={!inFile && !inUrl}
          className="w-full"
          on:click={submitAction}
          type="primary"
        >
          Lowresify
        </Button>
      {:else}
        <div class="flex justify-between mb-1">
          <span>{logMsg}</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
          <div
            class="bg-blue-600 h-1.5 rounded-full"
            style={`width: ${progress}%`}
          />
        </div>
      {/if}
    </div>
    {#if logErr}
      <ErrorAlert
        message={logErr}
        on:dismiss={() => {
          logErr = "";
        }}
      />
    {/if}
  </div>
</main>
