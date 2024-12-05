document.addEventListener("DOMContentLoaded", () => {
  const resultsDiv = document.getElementById("results");
  const displayedMedia = new Set(); // Track already displayed URLs

  // Establish a connection with the background script
  const port = chrome.runtime.connect({ name: "popup" });

  const updateUI = (media) => {
    // Clear previous results
    resultsDiv.innerHTML = '';
    displayedMedia.clear();

    media.forEach(({ m4sUrl, jpgUrl }) => {
      if (!displayedMedia.has(m4sUrl)) {
        displayedMedia.add(m4sUrl);

        const mp4Url = m4sUrl.replace(/\.m4s$/, ".mp4");
        const mediaItem = document.createElement("div");
        mediaItem.className = "media-item";

        const link = document.createElement("a");
        link.href = mp4Url;
        link.target = "_blank";
        link.download = mp4Url.split("/").pop();

        const img = document.createElement("img");
        img.src = jpgUrl;
        img.alt = `Preview for ${mp4Url}`;
        img.style.width = "100%";
        link.appendChild(img);

        mediaItem.appendChild(link);
        resultsDiv.appendChild(mediaItem);
      }
    });

    // Automatically scroll to the bottom of the results div
    resultsDiv.scrollTop = resultsDiv.scrollHeight;
  };

  // Handle messages from the background script
  port.onMessage.addListener((response) => {
    if (response.media) {
      updateUI(response.media);
    }
  });

  // Periodically request media data from the background script
  const intervalId = setInterval(() => {
    port.postMessage({ action: "getMedia" });
  }, 250);

  // Clear the interval when the popup is closed
  window.addEventListener("unload", () => {
    clearInterval(intervalId);
  });

  // Initial request for media data
  port.postMessage({ action: "getMedia" });
});
