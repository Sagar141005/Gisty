document.addEventListener("DOMContentLoaded", () => {
  const summarizeBtn = document.getElementById("summarize-btn");
  const emptyState = document.getElementById("empty-state");
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

      if (!response.ok) throw new Error("API Error");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      summaryContent.textContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value, { stream: true });
        summaryContent.textContent += textChunk;

        const main = document.getElementById("summary-container");
        main.scrollTop = main.scrollHeight;
      }
    } catch (error) {
      summaryDiv.innerHTML = `<p style="color: red; text-align: center; font-size: 13px;">${error.message}</p>`;
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
