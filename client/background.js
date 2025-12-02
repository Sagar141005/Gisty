chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "gisty-summarize",
    title: "Summarize with Gisty",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "gisty-summarize") {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: injectOverlay,
      args: ["loading"],
    });

    try {
      const response = await fetch("http://localhost:3000/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: info.selectionText,
          length: "short",
          style: "casual",
        }),
      });

      if (!response.ok) throw new Error("Gisty Server Error");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: injectOverlay,
        args: ["success", fullText],
      });
    } catch (error) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: injectOverlay,
        args: ["error", error.message],
      });
    }
  }
});

function injectOverlay(state, content = "") {
  const isDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const theme = {
    bg: isDark ? "#0a0a0a" : "#ffffff",
    fg: isDark ? "#ededed" : "#000000",
    fgMuted: isDark ? "#888888" : "#666666",
    border: isDark ? "#333333" : "#e5e5e5",
    success: "#22c55e",
    error: "#ef4444",
    shadow: isDark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.1)",
  };

  let container = document.getElementById("gisty-root");
  if (!container) {
    container = document.createElement("div");
    container.id = "gisty-root";
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 350px;
        max-height: 80vh;
        background-color: ${theme.bg};
        color: ${theme.fg};
        border: 1px solid ${theme.border};
        border-radius: 8px;
        box-shadow: 0 10px 30px ${theme.shadow};
        font-family: 'Inter', sans-serif;
        font-size: 12px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        z-index: 2147483647;
        opacity: 0;
        transform: translateY(-10px);
        transition: all 0.3s ease;
      `;
    document.body.appendChild(container);
    requestAnimationFrame(() => {
      container.style.opacity = "1";
      container.style.transform = "translateY(0)";
    });
  }

  const headerHTML = `
      <div style="padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid ${theme.border};">
        <div style="display: flex; align-items: center; gap: 8px;">
        <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="lucide lucide-shredder-icon lucide-shredder"
      >
        <path
          d="M4 13V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v5"
        />
        <path d="M14 2v5a1 1 0 0 0 1 1h5" />
        <path d="M10 22v-5" />
        <path d="M14 19v-2" />
        <path d="M18 20v-3" />
        <path d="M2 13h20" />
        <path d="M6 20v-3" />
      </svg>
          <span style="font-weight:600; font-size:13px;">Gisty</span>
        </div>
        <button id="gisty-close" style="background:none; border:none; color:${theme.fgMuted}; cursor:pointer; padding:4px;">
          ✕
        </button>
      </div>
    `;

  let bodyHTML = "";
  if (state === "loading") {
    bodyHTML = `
        <div style="padding:20px; display:flex; align-items:center; gap:10px; color:${theme.fgMuted};">
          <div style="width:16px; height:16px; border:2px solid ${theme.border}; border-top-color:${theme.fg}; border-radius:50%; animation:spin 0.8s linear infinite;"></div>
          <span style="font-size:12px;">Summarizing selection...</span>
        </div>
        <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
      `;
  } else if (state === "error") {
    bodyHTML = `
        <div style="padding:16px; font-size:12px; color:${theme.error};">
          <strong>Error:</strong> ${content}
        </div>
      `;
  } else if (state === "success") {
    const itemsHTML = content
      .split("\n")
      .map((l) => l.trim().replace(/^[\-*•]\s*/, ""))
      .filter((l) => l.length)
      .map(
        (line) => `
        <div style="
          padding-left: 20px;
          margin-bottom: 12px;
          position: relative;
          line-height: 1.6;
          animation: fadeIn 0.4s ease-out;
        ">
          <span style="
            position:absolute;
            left:0;
            top:0;
            color:${theme.fgMuted};
          ">—</span>
          ${line}
        </div>`
      )
      .join("");

    bodyHTML = `
      <div style="padding:16px; overflow-y:auto; max-height:60vh;">
        ${itemsHTML}
      </div>

      <div style="padding:10px 16px; display:flex; justify-content:flex-end;">
        <button id="gisty-copy" style="
          font-size:11px;
          font-weight:500;
          color:${theme.fgMuted};
          background:transparent;
          border:1px solid ${theme.border};
          padding:6px 10px;
          border-radius:6px;
          cursor:pointer;
        ">Copy</button>
      </div>

      <style>
        @keyframes fadeIn {
          from { opacity:0; transform:translateY(4px); }
          to   { opacity:1; transform:translateY(0); }
        }
      </style>
    `;
  }

  container.innerHTML = headerHTML + bodyHTML;

  document.getElementById("gisty-close").onclick = () => {
    container.style.opacity = "0";
    container.style.transform = "translateY(-10px)";
    setTimeout(() => container.remove(), 200);
  };

  if (state === "success") {
    const btn = document.getElementById("gisty-copy");
    btn.onclick = () => {
      navigator.clipboard.writeText(content).then(() => {
        btn.textContent = "Copied!";
        btn.style.color = theme.success;
        btn.style.borderColor = theme.success;

        setTimeout(() => {
          btn.textContent = "Copy";
          btn.style.color = theme.fgMuted;
          btn.style.borderColor = theme.border;
        }, 2000);
      });
    };
  }
}
