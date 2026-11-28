/* STEMInteract RD-007B: shared examination quality control. */
(function (global) {
  "use strict";
  const visuals = {
    Economics: "Check axes, units, curves, equilibrium points, movements versus shifts, shaded areas and annotations; verify revenue rectangles and economic relationships where relevant.",
    Mathematics: "Check scales, axes, coordinates, domains, boundaries, shading and mathematical notation.",
    Physics: "Check units, scales, vectors, directions, circuit connections, symbols and graph relationships.",
    Chemistry: "Check bonds, charges, stereochemistry, structural formulae, mechanisms, electron arrows and graph labels.",
    Biology: "Check biological labels, scales, units, genetic notation, crosses and graph conventions.",
    "Human Biology": "Check biological labels, scales, units, genetic notation, crosses and graph conventions.",
    "Computing Science": "Check diagram notation, connections, flow directions, data relationships and code conventions.",
    Accounting: "Check required statement and budget layouts, headings, figures, workings, totals and balancing.",
    "Business Management": "Check required organisational charts, tables, labels and case-study relationships.",
    "Administration and IT": "Check required document, spreadsheet, database and presentation layouts, formulas, outputs and print settings against the actual source files; never invent cell addresses or claim to have created a file you did not create.",
    English: "Check required textual evidence, analysis and question-specific response format."
  };
  global.STEMInteractQuality = function (original, subject, full) {
    const common = "\n\nRD-007B EXAMINATION QUALITY CONTROL (applies to complete solutions, including any later explicit request for one):\n" +
      "Identify every question part, command word and required output from the original question. Inspect relevant original figures, tables, continuation pages and case-study material. Check the official marking instructions if accessible; distinguish verified marking points from guidance, and disclose missing sources rather than inventing details.\n" +
      "MANDATORY VISUAL OUTPUT: If the question asks for a diagram, graph, sketch, drawing, chart, table or other visual output, produce the actual usable, correctly labelled output in the answer, not merely instructions or a description. Use a purpose-built rendered diagram, SVG or a clear text-based diagram only if it adequately meets the requirements; never substitute a stock image. Verify technical accuracy and every accessible visual-related marking point. " + (visuals[subject] || "Check all relevant labels, scales and relationships.") + "\n" +
      "MANDATORY VISUAL ACCURACY AND RENDERING CHECK (RD-007B): Inspect the actual output independently of its written explanation. Prefer a rendered graphical diagram to plain text; use plain text only when its geometry and labels are unambiguous. Verify directions, shapes, intersections, coordinates, labels, scales, shaded regions and agreement with the explanation. For price-inelastic demand and a price increase, where relevant, check that the demand curve slopes downwards, the higher price intersects at the lower quantity, gained revenue is (P1 - P) times Q1, lost revenue is P times (Q - Q1), and the gained area exceeds the lost area. Do not infer elasticity from steepness alone. An empty container, disconnected labels or unrendered code is not a usable diagram. If you cannot inspect the rendered result, explicitly say so; offer a supported alternative and ask the student to confirm visibility if needed. Never award visual marks on the strength of correct prose alone. Do not certify completeness or full marks when required visual accuracy or rendering remains unverified.\n" +
      "FINAL CHECK: all parts answered; command words followed; required visuals actually included and labels checked; calculations, workings and units checked; case-study application included where required; official marking instructions checked where accessible; any claimed mark allocations and totals independently checked; no invented facts or marking points. If a required output or source cannot be supplied or verified, state the limitation and do not present the solution as complete or fully verified. Never mark a required diagram as fully answered until it has actually been produced and checked against the marking instructions.\n";
    return original + common + (full ? "Apply this checklist before presenting the requested complete solution." : "For now remain in strategy-first mode: ask what I have tried, give only one small hint at a time and wait. Use the checklist internally; do not reveal the full solution or completed required visual unless I explicitly ask for it later.");
  };
})(window);
