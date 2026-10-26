/* Shared marking-resource behaviour for all Question Explorers. */
(function (global) {
  "use strict";
  const disabledClasses = ["disabled", "notes-disabled", "marking-disabled", "resource-disabled"];
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
        updateLink(link, year, paper) {
          const needsSelection = year === "all" || (separatePapers && (!paper || paper === "all"));
          const filename = needsSelection ? null : file(year, paper);
          for (const attr of ["href", "target", "rel"]) link.removeAttribute(attr);
          disabledClasses.forEach(name => link.classList.remove(name));
          const label = year + (separatePapers ? " Paper " + paper : "");
          if (filename) {
            link.href = filename;
            link.target = "_blank";
            link.rel = "noopener";
            link.textContent = label + " marking instructions";
            link.removeAttribute("aria-disabled");
          } else {
            link.textContent = needsSelection
              ? (year === "all" ? "Choose a year" + (separatePapers ? " and paper" : "") : "Choose a paper") + " for marking instructions"
              : label + " marking instructions unavailable on this site";
            link.classList.add("disabled");
            link.style.pointerEvents = "none";
            link.style.opacity = ".55";
            link.setAttribute("aria-disabled", "true");
          }
          if (filename) { link.style.pointerEvents = ""; link.style.opacity = ""; }
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
