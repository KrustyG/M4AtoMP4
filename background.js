let foundMedia = new Map(); // Store unique media pairs with the .m4s URL as the key
let listenerRegistered = false;

// Function to start listening for network requests
function startListening() {
  if (listenerRegistered) return;

  chrome.webRequest.onCompleted.addListener(
    (details) => {
      const url = details.url;

      if (url.endsWith(".m4s")) {
        const baseName = url.replace(/\.m4s$/, "");
        const jpgUrl = `${baseName}.jpg`;

        // If the .m4s URL is new
        if (!foundMedia.has(url)) {
          foundMedia.set(url, { m4sUrl: url, jpgUrl });

          // Update storage with new data
          chrome.storage.local.set({ foundMedia: Object.fromEntries(foundMedia) });
        }
      } else if (url.endsWith(".jpg")) {
        // Check if the .jpg matches any existing .m4s
        const m4sUrl = url.replace(/\.jpg$/, ".m4s");
        if (foundMedia.has(m4sUrl)) {
          const existingEntry = foundMedia.get(m4sUrl);
          foundMedia.set(m4sUrl, { ...existingEntry, jpgUrl: url });

          // Update storage with updated data
          chrome.storage.local.set({ foundMedia: Object.fromEntries(foundMedia) });
        }
      }
    },
    { urls: ["<all_urls>"] }
  );

  listenerRegistered = true;
}

// Function to stop listening for web requests
function stopListening() {
  if (!listenerRegistered) return;

  chrome.webRequest.onCompleted.removeListener(startListening);
  listenerRegistered = false;
  foundMedia.clear(); // Clear stored media when listener stops
}

// Handle connection from the popup
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup") {
    // Start listening when the popup connects
    startListening();

    // Handle messages from the popup
    port.onMessage.addListener((message) => {
      if (message.action === "getMedia") {
        // Respond with the media data
        const media = Array.from(foundMedia.values());
        port.postMessage({ media });
      }
    });

    // Stop listening when the popup disconnects
    port.onDisconnect.addListener(() => {
      stopListening();
    });
  }
});
