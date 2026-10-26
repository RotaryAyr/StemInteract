/* Shared marking-resource behaviour for all Question Explorers. */
(function (global) {
  "use strict";
  const disabledClasses = ["disabled", "notes-disabled", "marking-disabled", "resource-disabled"];
  const checks = new Map();
  const selections = new WeakMap();
  async function readablePdf(url) {
    if (!checks.has(url)) checks.set(url, (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await global.fetch(url, {headers: {Range: "bytes=0-4"}, signal: controller.signal});
        if (!response.ok || !response.body) return false;
        const reader = response.body.getReader();
        let signature = "";
        try {
          while (signature.length < 5) {
            const chunk = await reader.read();
            if (chunk.done) break;
            signature += String.fromCharCode(...chunk.value.slice(0, 5 - signature.length));
          }
        } finally { await reader.cancel(); }
        return signature === "%PDF-";
      } catch (_) { return false; }
      finally { clearTimeout(timeout); }
    })());
    return checks.get(url);
  }
  global.StemMarking = {
    forExplorer(directory) {
      const files = global.StemMarkingAvailability[directory] || {};
      const separatePapers = Object.keys(files).some(key => key.includes(":"));
      function file(year, paper) {
        if (!year || year === "all") return null;
        return files[String(year) + (separatePapers ? ":" + paper : "")] || null;
      }
      return {
        file,
        async updateLink(link, year, paper) {
          const selection = {};
          selections.set(link, selection);
          const needsSelection = year === "all" || (separatePapers && (!paper || paper === "all"));
          const filename = needsSelection ? null : file(year, paper);
          for (const attr of ["href", "target", "rel"]) link.removeAttribute(attr);
          disabledClasses.forEach(name => link.classList.remove(name));
          const label = year + (separatePapers ? " Paper " + paper : "");
          let available = false;
          if (filename) {
            link.textContent = "Checking marking instructions…";
            link.style.pointerEvents = "none";
            link.setAttribute("aria-disabled", "true");
            const url = new URL(filename, global.location.href).href;
            available = await readablePdf(url);
            if (selections.get(link) !== selection) return;
          }
          if (available) {
            link.href = filename;
            link.target = "_blank";
            link.rel = "noopener";
            link.textContent = label + " marking instructions";
            link.removeAttribute("aria-disabled");
          } else {
            link.textContent = needsSelection
              ? (year === "all" ? "Choose a year" + (separatePapers ? " and paper" : "") : "Choose a paper") + " for marking instructions"
              : "Marking instructions unavailable for this paper.";
            link.classList.add("disabled");
            link.style.pointerEvents = "none";
            link.style.opacity = ".55";
            link.setAttribute("aria-disabled", "true");
          }
          if (available) { link.style.pointerEvents = ""; link.style.opacity = ""; }
        },
        prompt(item) {
          const filename = file(item.y || 2025, item.p || item.s);
          const reference = filename
            ? "Official marking instructions: " + new URL(filename, "https://steminteract.uk/" + directory + "/").href +
              "\nTry to open these instructions and read the relevant section. Use them as authoritative only if you can actually read them. If the link fails or the relevant guidance cannot be read, continue from the original question using the fallback below."
            : "Official marking instructions: unavailable on this site for this paper. This does not establish whether they have been published elsewhere.";
          return "Marking-resource guidance:\n" + reference +
            "\nWhen official instructions are missing or unreadable, continue helping from the original question and course knowledge. Clearly label any proposed solution or feedback as AI-generated, not an official marking scheme. Do not claim official marking points or marks earned, invent an official scheme or marking-instructions URL, or require the learner to supply marking instructions before helping. Ask for missing question text, figures or passage lines only after trying the supplied question sources and finding them unreadable. Refer to a checked guidance summary only if an explicitly checked summary with actual solution guidance is supplied; a publication-status notice is not a solution summary.\n\n";
        }
      };
    }
  };
})(window);
