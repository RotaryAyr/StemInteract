(function () {
  const IS_MARKING_PAGE =
    window.location.pathname.toLowerCase().endsWith("/marking.html") ||
    window.location.pathname.toLowerCase().endsWith("marking.html");

  const AI_SERVICES = {
    chatgpt: {
      name: "ChatGPT",
      url: "https://chatgpt.com/"
    },
    claude: {
      name: "Claude",
      url: "https://claude.ai/new",
      promptParameter: "q"
    },
    gemini: {
      name: "Gemini",
      url: "https://gemini.google.com/app",
      promptParameter: "text"
    }
  };

  function buildStemInteractPrompt(questionLabel, pdfUrl) {
    return [
      `This is an SQA Higher (Scottish Qualifications Authority) past-paper exam question.`,
      ``,
      `Question: ${questionLabel}`,
      `PDF: ${pdfUrl}`,
      ``,
      `Please use the PDF above as the source of the question, including any diagram, graph, table, formula or data shown there.`,
      ``,
      `Task: Give strategy hints first.`,
      `Do NOT give the full worked solution unless I explicitly ask for it.`,
      ``,
      `What I want:`,
      `- A short strategy for each part of the question.`,
      `- The key idea needed to start each part.`,
      `- Common traps to avoid.`,
      `- The minimum working needed to earn method marks.`,
      `- Clear reference to any relevant diagram or information in the PDF.`,
      ``,
      `Style: concise, student-friendly, and exam-focused.`
    ].join("\n");
  }

  async function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (e) {
        // Safari can expose the Clipboard API but still reject the write.
        // Keep the click active and continue to the selection-based fallback.
      }
    }

    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const copied = document.execCommand("copy");
    document.body.removeChild(ta);

    if (!copied) {
      throw new Error("Clipboard copy was not supported");
    }
  }

  function toAbsoluteUrl(href) {
    return new URL(href, window.location.origin).toString();
  }

  function buildHandoffUrl(service, prompt) {
    const url = new URL(service.url);

    if (service.promptParameter) {
      url.searchParams.set(service.promptParameter, prompt);
    }

    return url.toString();
  }

  function closeAllDropdowns() {
    document.querySelectorAll(".ai-dd.open").forEach((d) => d.classList.remove("open"));
  }

  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  function showHandoffToast(service, copied) {
    let toast = document.getElementById("copyToast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "copyToast";
      toast.className = "copy-toast";
      document.body.appendChild(toast);
    }

    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.innerHTML = service.promptParameter
      ? `<strong>Opening ${service.name}.</strong>${copied ? " The prompt is copied as a backup." : ""}`
      : `<strong>Prompt copied.</strong> Paste and send it in ${service.name}.`;

    toast.classList.add("show");

    clearTimeout(toast.hideTimeout);
    toast.hideTimeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 5000);
  }

  function makeDropdown(label, pdfUrl) {
    const wrap = document.createElement("span");
    wrap.className = "ai-dd";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "button ai-dd-btn";
    btn.textContent = "Ask AI ▾";

    const menu = document.createElement("div");
    menu.className = "ai-dd-menu";

    function makeItem(key) {
      const service = AI_SERVICES[key];
      const item = document.createElement("button");
      item.type = "button";
      item.className = "ai-dd-item";
      item.textContent = service.name;

      item.addEventListener("click", async () => {
        const openedWindow = isIOS() ? null : window.open("about:blank", "_blank");

        try {
          closeAllDropdowns();

          const prompt = buildStemInteractPrompt(label, pdfUrl);
          const handoffUrl = buildHandoffUrl(service, prompt);
          let copied = false;

          try {
            await copyTextToClipboard(prompt);
            copied = true;
          } catch (copyError) {
            if (!service.promptParameter) throw copyError;
          }

          showHandoffToast(service, copied);

          if (isIOS()) {
            window.location.href = handoffUrl;
          } else if (openedWindow) {
            openedWindow.opener = null;
            openedWindow.location.replace(handoffUrl);
          } else {
            window.location.href = handoffUrl;
          }
        } catch (e) {
          if (openedWindow) openedWindow.close();
          alert("Sorry - copying failed on this browser. Please copy the question details manually.");
        }
      });

      return item;
    }

    menu.appendChild(makeItem("chatgpt"));
    menu.appendChild(makeItem("gemini"));
    menu.appendChild(makeItem("claude"));

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const willOpen = !wrap.classList.contains("open");
      closeAllDropdowns();
      if (willOpen) wrap.classList.add("open");
    });

    wrap.appendChild(btn);
    wrap.appendChild(menu);
    return wrap;
  }

  function injectDropdowns() {
    const lists = document.querySelectorAll(".button-row ul.actions");

    lists.forEach((ul) => {
      if (ul.dataset.aiInjected === "1") return;

      const qLink = ul.querySelector("a.button.big");
      if (!qLink) return;

      const label = (qLink.textContent || "").trim();
      const href = qLink.getAttribute("href") || "";
      const pdfUrl = toAbsoluteUrl(href);

      if (!pdfUrl.toLowerCase().endsWith(".pdf")) return;

      const li = document.createElement("li");
li.appendChild(makeDropdown(label, pdfUrl));

const questionItem = qLink.closest("li");

if (questionItem) {
  questionItem.insertAdjacentElement("afterend", li);
} else {
  ul.prepend(li);
}

      ul.dataset.aiInjected = "1";
    });
  }

  function injectMarkingInstructionsButton() {
    const MARKING_PAGE = "/marking.html";

    const noteLinks = Array.from(document.querySelectorAll("a.button")).filter(
      (a) => (a.textContent || "").trim().toLowerCase() === "notes"
    );

    noteLinks.forEach((notesBtn) => {
      const parent = notesBtn.parentElement;
      if (!parent) return;

      if (parent.querySelector('[data-si-marking-btn="1"]')) return;

      const mi = document.createElement("a");
      mi.className = notesBtn.className;
      mi.href = MARKING_PAGE;
      mi.target = "_blank";
      mi.rel = "noopener noreferrer";
      mi.setAttribute("data-si-marking-btn", "1");
      mi.style.marginLeft = "0.8em";
      mi.textContent = "Marking Instructions";

      notesBtn.insertAdjacentElement("afterend", mi);
    });
  }

  if (!IS_MARKING_PAGE) {
    document.addEventListener("click", closeAllDropdowns);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAllDropdowns();
    });
  }

  function init() {
    if (IS_MARKING_PAGE) return;
    injectDropdowns();
    injectMarkingInstructionsButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
