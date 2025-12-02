document.addEventListener("DOMContentLoaded", () => {
  const summarizeBtn = document.getElementById("summarize-btn");
  const emptyState = document.getElementById("empty-state");
  const copyBtn = document.getElementById("copy-btn");
  const summaryContent = document.getElementById("summary-content");

  const lengthSelect = document.getElementById("opt-length");
  const styleSelect = document.getElementById("opt-style");

  summarizeBtn.addEventListener("click", async () => {
    setLoading(true);
    emptyState.style.display = "none";
    summaryContent.style.display = "block";
    summaryContent.textContent = "";
    summaryContent.innerHTML = '<span class="blinking-cursor">▍</span>';

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab) {
        throw new Error("Could not access current tab.");
      }

      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: extractContent,
      });

      if (!result) throw new Error("No content found");

      const response = await fetch("http://localhost:3000/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: result,
          length: lengthSelect.value,
          style: styleSelect.value,
        }),
      });

      if (!response.ok) {
        let message = "Gisty couldn't process your request. Please try again.";
        try {
          const data = await response.json();
          if (data.error) message = data.error;
        } catch (_) {}
        throw new Error(message);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      summaryContent.textContent = "";
      copyBtn.classList.remove("visible");

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          copyBtn.classList.add("visible");
          break;
        }

        const textChunk = decoder.decode(value, { stream: true });
        summaryContent.textContent += textChunk;

        const main = document.getElementById("summary-container");
        main.scrollTop = main.scrollHeight;
      }
    } catch (error) {
      summaryContent.innerHTML = `<p style="color: red; text-align: center; font-size: 13px;">${error.message}</p>`;
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    summarizeBtn.disabled = isLoading;
    summarizeBtn.innerHTML = isLoading
      ? "Summarizing..."
      : 'Summarize <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
  }

  copyBtn.addEventListener("click", () => {
    const text = summaryContent.innerText;
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      copyBtn.classList.add("success");

      const originalIcon = copyBtn.innerHTML;
      copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

      setTimeout(() => {
        copyBtn.classList.remove("success");
        copyBtn.innerHTML = originalIcon;
      }, 2000);
    });
  });
});

function extractContent() {
  const clone = document.body.cloneNode(true);

  const selectorsToRemove = [
    "script",
    "style",
    "noscript",
    "iframe",
    "nav",
    "footer",
    "header",
    "[role='alert']",
    "[role='banner']",
    "[role='navigation']",
  ];

  selectorsToRemove.forEach((selector) => {
    const elements = clone.querySelectorAll(selector);
    elements.forEach((el) => el.remove());
  });

  return clone.innerText.replace(/\s+/g, " ").trim();
}
