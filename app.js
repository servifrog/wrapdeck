"use strict";

// ── Constants ────────────────────────────────────────────────────────────────

const defaultRules = Object.freeze({
  start: "CALL START",
  callEnded: "CALL END",
  transferPrefix: "TRANSFER TO"
});

const setupStringPrefix = "WDSTRING_V1:";
const legacySetupStringPrefix = "WRAPDECK_V1:";
const setupStringSorts = Object.freeze(["workflow", "recent", "az", "custom"]);
const templateSetupSorts = Object.freeze(["workflow", "az", "custom"]);

const limits = Object.freeze({
  templates: 100,
  templateLine: 1000,
  quickPieces: 300,
  quickForms: 50,
  quickFormTitle: 80,
  quickFormBody: 4000,
  currentPieces: 300,
  savedReference: 4000,
  templateListHeightMin: 120,
  templateListHeightMax: 760,
  templateListHeightDefault: 220,
  templateListHeightStep: 40,
  noteBlocksListHeightMin: 96,
  noteBlocksListHeightMax: 520,
  noteBlocksListHeightDefault: 220,
  noteBlocksListHeightStep: 36,
  scratchpadHeightMin: 88,
  scratchpadHeightMax: 320,
  scratchpadHeightDefault: 110,
  scratchpadHeightStep: 28,
  dockPreviewHeightMin: 42,
  dockPreviewHeightMax: 126,
  dockPreviewHeightDefault: 54,
  dockPreviewHeightStep: 18,
  setupStringItems: 500,
  zoomMin: 0.9,
  zoomMax: 1.18,
  zoomDefault: 1,
  zoomStep: 0.07
});

// ── State ────────────────────────────────────────────────────────────────────

const state = {
  templates: [],
  customQuickPieces: [],
  hiddenQuickPieceKeys: [],
  customQuickPieceOrder: [],
  recentQuickPieceKeys: [],
  editingQuickPieceKey: "",
  quickForms: [],
  activeQuickFormKey: "",
  activeQuickFormTitle: "",
  activeQuickFormTemplate: "",
  activeQuickFormContent: "",
  highlightedQuickPieceKey: "",
  highlightedTemplateKey: "",
  highlightTimer: 0,
  pieces: [],
  editingPieceIndex: -1,
  movedPieceIndex: -1,
  movedPieceDirection: 0,
  movedPieceTimer: 0,
  draggingPieceIndex: -1,
  dragTargetPieceIndex: -1,
  dragInsertAfter: false,
  ending: "call-ended",
  rules: { ...defaultRules },
  quickSort: "workflow",
  quickFilter: "",
  templateSort: "workflow",
  templateFilter: "",
  templatePinnedOnly: false,
  customTemplateOrder: [],
  recentTemplateKeys: [],
  editingTemplateKey: "",
  templateListHeight: 220,
  noteBlocksListHeight: 220,
  scratchpadHeight: 110,
  scratchpadSnapped: false,
  savedReferenceText: "",
  editingSavedReference: false,
  resizingTemplates: false,
  resizingNoteBlocks: false,
  resizingScratchpad: false,
  theme: "light",
  zoom: 1,
  editingNote: false,
  editBaseNote: "",
  dockPreviewHeight: 54,
  clearSessionArmed: false,
  copyFlashTimer: 0
};

// ── DOM refs ─────────────────────────────────────────────────────────────────

const els = {
  templateInput:       document.querySelector("#templateInput"),
  templateList:        document.querySelector("#templateList"),
  templateFilter:      document.querySelector("#templateFilter"),
  templateFilterClear: document.querySelector("#templateFilterClear"),
  pieceList:           document.querySelector("#pieceList"),
  currentList:         document.querySelector("#currentList"),
  quickFilter:         document.querySelector("#quickFilter"),
  newQuickPiece:       document.querySelector("#newQuickPiece"),
  customDetail:        document.querySelector("#customDetail"),
  transferTarget:      document.querySelector("#transferTarget"),
  ruleStart:           document.querySelector("#ruleStart"),
  ruleCallEnded:       document.querySelector("#ruleCallEnded"),
  ruleTransferPrefix:  document.querySelector("#ruleTransferPrefix"),
  noteOutput:          document.querySelector("#noteOutput"),
  noteEditor:          document.querySelector("#noteEditor"),
  editNotice:          document.querySelector("#editNotice"),
  editNote:            document.querySelector("#editNote"),
  status:              document.querySelector("#status"),
  callDock:            document.querySelector("#callDock"),
  dockPreview:         document.querySelector("#dockPreview"),
  resizeDockPreview:   document.querySelector("#resizeDockPreview"),
  dockNoteEditor:      document.querySelector("#dockNoteEditor"),
  dockEditNote:        document.querySelector("#dockEditNote"),
  copyNote:            document.querySelector("#copyNote"),
  copyNoteLabel:       document.querySelector("#copyNoteLabel"),
  editModeCue:         document.querySelector("#editModeCue"),
  endCall:             document.querySelector("#endCall"),
  endTransfer:         document.querySelector("#endTransfer"),
  themeLight:          document.querySelector("#themeLight"),
  themeBlackout:       document.querySelector("#themeBlackout"),
  zoomOut:             document.querySelector("#zoomOut"),
  zoomIn:              document.querySelector("#zoomIn"),
  zoomLevel:           document.querySelector("#zoomLevel"),
  quickSortSelect:     document.querySelector("#quickSortSelect"),
  templateSortLoaded:  document.querySelector("#templateSortLoaded"),
  templateSortAZ:      document.querySelector("#templateSortAZ"),
  templateSortCustom:  document.querySelector("#templateSortCustom"),
  templatePinnedOnly:  document.querySelector("#templatePinnedOnly"),
  templateTools:       document.querySelector("#templateTools"),
  toggleTemplateTools: document.querySelector("#toggleTemplateTools"),
  templateResultState: document.querySelector("#templateResultState"),
  copySetupString:     document.querySelector("#copySetupString"),
  copyQuickSetup:      document.querySelector("#copyQuickSetup"),
  quickFormsPanel:     document.querySelector("#quickFormsPanel"),
  quickFormsBody:      document.querySelector("#quickFormsBody"),
  toggleQuickForms:    document.querySelector("#toggleQuickForms"),
  quickFormsSummary:   document.querySelector("#quickFormsSummary"),
  quickFormSetup:      document.querySelector("#quickFormSetup"),
  toggleQuickFormSetup: document.querySelector("#toggleQuickFormSetup"),
  quickFormTitle:      document.querySelector("#quickFormTitle"),
  quickFormBody:       document.querySelector("#quickFormBody"),
  quickFormList:       document.querySelector("#quickFormList"),
  addQuickForm:        document.querySelector("#addQuickForm"),
  noteBlockLibrary:    document.querySelector("#noteBlockLibrary"),
  toggleNoteBlockLibrary: document.querySelector("#toggleNoteBlockLibrary"),
  noteBlockSetup:      document.querySelector("#noteBlockSetup"),
  toggleNoteBlockSetup: document.querySelector("#toggleNoteBlockSetup"),
  quickFormDock:       document.querySelector("#quickFormDock"),
  quickFormDockTitle:  document.querySelector("#quickFormDockTitle"),
  quickFormDockStatus: document.querySelector("#quickFormDockStatus"),
  quickFormEditor:     document.querySelector("#quickFormEditor"),
  copyQuickForm:       document.querySelector("#copyQuickForm"),
  resetQuickForm:      document.querySelector("#resetQuickForm"),
  clearQuickForm:      document.querySelector("#clearQuickForm"),
  setupPanel:          document.querySelector("#setupPanel"),
  setupBody:           document.querySelector("#setupBody"),
  toggleSetup:         document.querySelector("#toggleSetup"),
  setupSummary:        document.querySelector("#setupSummary"),
  fullTemplatePanel:   document.querySelector("#fullTemplatePanel"),
  templateBody:        document.querySelector("#templateBody"),
  toggleTemplates:     document.querySelector("#toggleTemplates"),
  templateSummary:     document.querySelector("#templateSummary"),
  buildPanel:          document.querySelector("#buildPanel"),
  buildBody:           document.querySelector("#buildBody"),
  toggleBuild:         document.querySelector("#toggleBuild"),
  buildSummary:        document.querySelector("#buildSummary"),
  saveBuiltTemplate:   document.querySelector("#saveBuiltTemplate"),
  finishPanel:         document.querySelector("#finishPanel"),
  finishBody:          document.querySelector("#finishBody"),
  toggleFinish:        document.querySelector("#toggleFinish"),
  finishSummary:       document.querySelector("#finishSummary"),
  copyFullSetup:       document.querySelector("#copyFullSetup"),
  resizeTemplates:     document.querySelector("#resizeTemplates"),
  resizeNoteBlocks:    document.querySelector("#resizeNoteBlocks"),
  resizeScratchpad:    document.querySelector("#resizeScratchpad"),
  rulesPanel:          document.querySelector("#rulesPanel"),
  rulesBody:           document.querySelector("#rulesBody"),
  toggleRules:         document.querySelector("#toggleRules"),
  clearSession:        document.querySelector("#clearSession"),
  templateCount:       document.querySelector("#templateCount"),
  headerTemplateCount: document.querySelector("#headerTemplateCount"),
  quickPieceCount:     document.querySelector("#quickPieceCount"),
  currentPieceCount:   document.querySelector("#currentPieceCount"),
  dockPieceCount:      document.querySelector("#dockPieceCount"),
  scratchpad:          document.querySelector("#scratchpad"),
  scratchpadSummary:   document.querySelector("#scratchpadSummary"),
  clearScratchpad:     document.querySelector("#clearScratchpad"),
  toggleScratchpad:    document.querySelector("#toggleScratchpad"),
  scratchpadPanel:     document.querySelector("#scratchpadPanel"),
  scratchpadBody:      document.querySelector("#scratchpadBody"),
  scratchpadHome:      document.querySelector("#scratchpadHome"),
  scratchpadWorkSurface: document.querySelector("#scratchpadWorkSurface"),
  snapScratchpad:      document.querySelector("#snapScratchpad"),
  scratchpadSnap:      document.querySelector("#scratchpadSnap"),
  scratchpadSnapMount: document.querySelector("#scratchpadSnapMount"),
  sendScratchpadAway:  document.querySelector("#sendScratchpadAway"),
  savedReferenceView:  document.querySelector("#savedReferenceView"),
  savedReferenceEditorWrap: document.querySelector("#savedReferenceEditorWrap"),
  savedReferenceEditor: document.querySelector("#savedReferenceEditor"),
  copySavedReference:  document.querySelector("#copySavedReference"),
  editSavedReference:  document.querySelector("#editSavedReference"),
  saveSavedReference:  document.querySelector("#saveSavedReference"),
  cancelSavedReference: document.querySelector("#cancelSavedReference"),
  infoTips:            Array.from(document.querySelectorAll(".info-tip"))
};

let activeInfoTip = null;
let infoTipBubble = null;

// ── String helpers ───────────────────────────────────────────────────────────

function clean(value) {
  return value.trim().replace(/\s+/g, " ");
}

function cleanCopiedNote(value) {
  return clean(value.replace(/[\r\n\t]+/g, " "));
}

function cleanPiece(value) {
  return clean(value.replace(/\/+/g, " "));
}

function ensureInfoTipBubble() {
  if (infoTipBubble) return infoTipBubble;
  infoTipBubble = document.createElement("div");
  infoTipBubble.id = "infoTipBubble";
  infoTipBubble.className = "info-tip-bubble";
  infoTipBubble.setAttribute("role", "tooltip");
  infoTipBubble.hidden = true;
  document.body.append(infoTipBubble);
  return infoTipBubble;
}

function positionInfoTip(button) {
  const bubble = ensureInfoTipBubble();
  const rect = button.getBoundingClientRect();
  const margin = 8;
  bubble.style.visibility = "hidden";
  bubble.hidden = false;
  bubble.style.maxWidth = `${Math.max(160, Math.min(272, window.innerWidth - (margin * 2)))}px`;
  const bubbleRect = bubble.getBoundingClientRect();
  let left = rect.left;
  let top = rect.bottom + 6;

  if (left + bubbleRect.width > window.innerWidth - margin) {
    left = window.innerWidth - bubbleRect.width - margin;
  }
  if (left < margin) left = margin;
  if (top + bubbleRect.height > window.innerHeight - margin) {
    top = rect.top - bubbleRect.height - 6;
  }
  if (top < margin) top = margin;

  bubble.style.left = `${Math.round(left)}px`;
  bubble.style.top = `${Math.round(top)}px`;
  bubble.style.visibility = "";
}

function showInfoTip(button, options = {}) {
  const bubble = ensureInfoTipBubble();
  if (!button || !button.dataset.tip) return;
  if (options.expanded || (activeInfoTip && activeInfoTip !== button && activeInfoTip.getAttribute("aria-expanded") === "true")) {
    closeInfoTips();
  }
  activeInfoTip = button;
  bubble.textContent = button.dataset.tip;
  button.setAttribute("aria-describedby", bubble.id);
  if (options.expanded) button.setAttribute("aria-expanded", "true");
  positionInfoTip(button);
}

function hideInfoTip(button, options = {}) {
  if (!button || (!options.force && button.getAttribute("aria-expanded") === "true")) return;
  button.removeAttribute("aria-describedby");
  if (activeInfoTip === button) {
    activeInfoTip = null;
    if (infoTipBubble) infoTipBubble.hidden = true;
  }
}

function closeInfoTips() {
  els.infoTips.forEach(button => {
    button.setAttribute("aria-expanded", "false");
    button.removeAttribute("aria-describedby");
  });
  activeInfoTip = null;
  if (infoTipBubble) infoTipBubble.hidden = true;
}

function cleanRule(value) {
  return cleanPiece(value).slice(0, 120);
}

function cleanSavedReference(value) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim()
    .slice(0, limits.savedReference);
}

function pieceKey(value) {
  return cleanPiece(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cleanQuickFormTitle(value) {
  return clean(String(value || "")).slice(0, limits.quickFormTitle);
}

function cleanQuickFormBody(value) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .trim()
    .slice(0, limits.quickFormBody);
}

function quickFormKey(form) {
  return `${cleanQuickFormTitle(form.title)}\n${cleanQuickFormBody(form.body)}`
    .toLowerCase()
    .replace(/[^\S\n]+/g, " ")
    .trim();
}

function templateKey(template) {
  return clean(template.source).toLowerCase();
}

function phraseEquals(left, right) {
  return cleanRule(left).toLowerCase() === cleanRule(right).toLowerCase();
}

function phraseStartsWith(value, prefix) {
  const normalizedValue = cleanRule(value).toLowerCase();
  const normalizedPrefix = cleanRule(prefix).toLowerCase();
  return normalizedValue === normalizedPrefix
    || normalizedValue.startsWith(`${normalizedPrefix} `);
}

function removePhrasePrefix(value, prefix) {
  const source = cleanRule(value);
  const targetLength = cleanRule(prefix).length;
  return clean(source.slice(targetLength));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── Template parsing ─────────────────────────────────────────────────────────

function markerPattern(marker) {
  return escapeRegExp(cleanRule(marker)).replace(/\s+/g, "\\s+");
}

function normalizeStartMarker(source) {
  const start = cleanRule(state.rules.start);
  if (!start) return source;
  const pattern = markerPattern(start);
  const titleStart = new RegExp(`^(.+?:\\s*)(${pattern})(?=\\s+)(?!\\s*\\/\\/)`, "i");
  const plainStart = new RegExp(`^(${pattern})(?=\\s+)(?!\\s*\\/\\/)`, "i");
  if (titleStart.test(source)) {
    return source.replace(titleStart, "$1$2//");
  }
  return source.replace(plainStart, "$1//");
}

function normalizeTrailingEndedMarker(source) {
  const ended = cleanRule(state.rules.callEnded);
  if (!ended) return source;
  const match = source.match(new RegExp(`(^|\\s)(${markerPattern(ended)})$`, "i"));
  if (!match) return source;
  const markerStart = match.index + match[1].length;
  const before = source.slice(0, markerStart).trimEnd();
  if (!before || before.endsWith("//")) return source;
  return `${before}// ${source.slice(markerStart)}`;
}

function normalizeTrailingTransferMarker(source) {
  const transfer = cleanRule(state.rules.transferPrefix);
  if (!transfer) return source;
  const pattern = new RegExp(`(^|\\s)(${markerPattern(transfer)})(?=\\s+\\S)`, "ig");
  let match = null;
  for (const candidate of source.matchAll(pattern)) match = candidate;
  if (!match) return source;
  const markerStart = match.index + match[1].length;
  const before = source.slice(0, markerStart).trimEnd();
  const markerAndTarget = source.slice(markerStart);
  if (!before || before.endsWith("//") || markerAndTarget.includes("//")) return source;
  return `${before}// ${markerAndTarget}`;
}

function normalizeTemplateSource(rawLine) {
  let source = clean(rawLine);
  if (!source) return "";
  source = normalizeStartMarker(source);
  source = normalizeTrailingEndedMarker(source);
  source = normalizeTrailingTransferMarker(source);
  return clean(source);
}

function parseTemplate(rawLine) {
  const source = normalizeTemplateSource(rawLine);
  if (!source || source.length > limits.templateLine) return null;

  const parts = source.split("//").map(clean).filter(Boolean);
  if (!parts.length) return null;

  let explicitName = "";
  const startPattern = escapeRegExp(state.rules.start);
  const nameMatch = parts[0].match(new RegExp(`^(.+?):\\s*${startPattern}$`, "i"));
  if (nameMatch) {
    explicitName = clean(nameMatch[1]);
    parts[0] = state.rules.start;
  }

  if (phraseEquals(parts[0], state.rules.start)) parts.shift();

  let ending = { type: "call-ended", target: "" };
  const last = parts.at(-1) || "";
  if (phraseEquals(last, state.rules.callEnded)) {
    parts.pop();
  } else if (phraseStartsWith(last, state.rules.transferPrefix)) {
    ending = {
      type: "transfer",
      target: removePhrasePrefix(last, state.rules.transferPrefix)
    };
    parts.pop();
  }

  const body = parts.map(cleanPiece).filter(Boolean);
  if (!body.length) return null;

  const inferred = body[0]
    .split(" ")
    .slice(0, 4)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return { name: explicitName || inferred, generatedName: !explicitName, body, ending, source };
}

// ── Full template helpers ────────────────────────────────────────────────────

function titleCase(value) {
  return clean(value)
    .split(" ")
    .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : "")
    .join(" ");
}

function templateIsTransfer(template) {
  if (template.ending && template.ending.type === "transfer") return true;
  const transfer = cleanRule(state.rules.transferPrefix).toLowerCase();
  return Boolean(transfer && clean(template.source).toLowerCase().includes(transfer));
}

function transferSearchSynonyms(template) {
  return templateIsTransfer(template)
    ? ` ${state.rules.transferPrefix} transfer transferred transf xfer`
    : "";
}

function templateGeneratedBaseName(template) {
  return clean(template.name || "Full template");
}

function duplicateGeneratedTitleSet() {
  const counts = new Map();
  state.templates.forEach(template => {
    if (template.customName || template.generatedName === false) return;
    const key = templateGeneratedBaseName(template).toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key));
}

function templateTitleDisambiguator(template) {
  if (templateIsTransfer(template)) return "Transfer";
  const base = templateGeneratedBaseName(template).toLowerCase();
  const candidate = template.body.find(piece => clean(piece).toLowerCase() !== base) || "";
  return titleCase(candidate).slice(0, 38);
}

function templateDisplayName(template) {
  if (template.customName) return clean(template.customName);
  const base = templateGeneratedBaseName(template);
  if (template.generatedName === false || !duplicateGeneratedTitleSet().has(base.toLowerCase())) {
    return base;
  }
  const disambiguator = templateTitleDisambiguator(template);
  return disambiguator ? `${base} — ${disambiguator}` : base;
}

function templateSearchText(template) {
  return `${templateDisplayName(template)} ${template.source}${transferSearchSynonyms(template)}`.toLowerCase();
}

function templateMatchesFilter(template) {
  const filter = clean(state.templateFilter).toLowerCase();
  if (state.templatePinnedOnly && !template.pinned) return false;
  if (!filter) return true;
  return templateSearchText(template).includes(filter);
}

function syncCustomTemplateOrder(orderSource = null) {
  const available = new Set(state.templates.map(templateKey));
  const preferred = orderSource
    ? orderSource.map(templateKey).filter(Boolean)
    : state.customTemplateOrder.filter(key => available.has(key));
  const next = [];
  const seen = new Set();
  preferred.forEach(key => {
    if (!available.has(key) || seen.has(key)) return;
    next.push(key);
    seen.add(key);
  });
  state.templates.forEach(template => {
    const key = templateKey(template);
    if (key && !seen.has(key)) {
      next.push(key);
      seen.add(key);
    }
  });
  state.customTemplateOrder = next;
}

function sortedTemplates(options = {}) {
  const templates = [...state.templates];
  const workflowPos = new Map(state.templates.map((template, index) => [templateKey(template), index]));
  const recentPos = new Map(state.recentTemplateKeys.map((key, index) => [key, index]));
  let order = workflowPos;

  if (state.templateSort === "custom") {
    syncCustomTemplateOrder();
    order = new Map(state.customTemplateOrder.map((key, index) => [key, index]));
  }

  const sorted = templates.sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    if (state.templateSort === "az") {
      const nameCompare = templateDisplayName(a).localeCompare(templateDisplayName(b));
      if (nameCompare) return nameCompare;
    }
    if (state.templateSort === "recent") {
      const aKey = templateKey(a);
      const bKey = templateKey(b);
      const aRecent = recentPos.has(aKey);
      const bRecent = recentPos.has(bKey);
      if (aRecent && bRecent) return recentPos.get(aKey) - recentPos.get(bKey);
      if (aRecent) return -1;
      if (bRecent) return 1;
    }
    return (order.get(templateKey(a)) ?? 0) - (order.get(templateKey(b)) ?? 0);
  });

  if (options.includeFilter === false) return sorted;
  return sorted.filter(templateMatchesFilter);
}

function visibleTemplates() {
  return sortedTemplates();
}

// ── Quick piece helpers ───────────────────────────────────────────────────────

function sourceQuickPieces() {
  return [
    ...state.templates.flatMap(t => t.body),
    ...state.customQuickPieces
  ];
}

function promoteRecentQuickPiece(key) {
  if (!key) return;
  state.recentQuickPieceKeys = [
    key,
    ...state.recentQuickPieceKeys.filter(candidate => candidate !== key)
  ].slice(0, limits.quickPieces);
  if (state.quickSort === "custom") {
    state.customQuickPieceOrder = [
      key,
      ...state.customQuickPieceOrder.filter(candidate => candidate !== key)
    ];
  }
}

function hiddenQuickPieceSet() {
  return new Set(state.hiddenQuickPieceKeys);
}

function uniquePieces(options = {}) {
  const seen = new Set();
  const hidden = options.includeHidden ? new Set() : hiddenQuickPieceSet();
  return sourceQuickPieces()
    .filter(piece => {
      const key = pieceKey(piece);
      if (!key || hidden.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limits.quickPieces);
}

function sortedQuickPieces() {
  const pieces = uniquePieces();
  if (state.quickSort === "custom") {
    syncCustomQuickOrder(pieces);
    const order = new Map(state.customQuickPieceOrder.map((key, index) => [key, index]));
    return [...pieces].sort((a, b) => order.get(pieceKey(a)) - order.get(pieceKey(b)));
  }
  if (state.quickSort === "az") {
    return [...pieces].sort((a, b) => a.localeCompare(b));
  }
  if (state.quickSort === "recent") {
    const workflowPos = new Map(pieces.map((p, i) => [pieceKey(p), i]));
    const recentPos = new Map(state.recentQuickPieceKeys.map((key, i) => [key, i]));
    return [...pieces].sort((a, b) => {
      const aKey = pieceKey(a);
      const bKey = pieceKey(b);
      const aRecent = recentPos.has(aKey);
      const bRecent = recentPos.has(bKey);
      if (aRecent && bRecent) return recentPos.get(aKey) - recentPos.get(bKey);
      if (aRecent) return -1;
      if (bRecent) return 1;
      return workflowPos.get(aKey) - workflowPos.get(bKey);
    });
  }
  return pieces;
}

function visibleQuickPieces() {
  const filter = pieceKey(state.quickFilter);
  const pieces = sortedQuickPieces();
  if (!filter) return pieces;
  return pieces.filter(piece => pieceKey(piece).includes(filter));
}

function syncCustomQuickOrder(pieces = uniquePieces()) {
  const keys = pieces.map(pieceKey).filter(Boolean);
  const available = new Set(keys);
  const kept = state.customQuickPieceOrder.filter(key => available.has(key));
  const seen = new Set(kept);
  const recentMissing = state.recentQuickPieceKeys.filter(key => {
    if (!available.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  keys.forEach(key => {
    if (!seen.has(key)) {
      kept.push(key);
      seen.add(key);
    }
  });
  state.customQuickPieceOrder = [...recentMissing, ...kept];
}

// ── Manual setup string ──────────────────────────────────────────────────────

function isSetupString(value) {
  const text = value.trim();
  return text.startsWith(setupStringPrefix) || text.startsWith(legacySetupStringPrefix);
}

function encodeSetupJson(value) {
  return btoa(encodeURIComponent(JSON.stringify(value)).replace(/%([0-9A-F]{2})/g, (_match, hex) => {
    return String.fromCharCode(Number.parseInt(hex, 16));
  }));
}

function decodeSetupJson(value) {
  const text = value.trim();
  const prefix = text.startsWith(setupStringPrefix) ? setupStringPrefix : legacySetupStringPrefix;
  const encoded = text.slice(prefix.length).trim();
  if (!encoded) throw new Error("Setup string is empty.");
  const json = decodeURIComponent([...atob(encoded)].map(char => {
    return `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`;
  }).join(""));
  return JSON.parse(json);
}

function safeStringArray(value, maxItems = limits.setupStringItems, maxLength = 1000) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(item => typeof item === "string")
    .map(item => clean(item).slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function safeSort(value) {
  return setupStringSorts.includes(value) ? value : "workflow";
}

function safeTemplateSort(value) {
  return templateSetupSorts.includes(value) ? value : "workflow";
}

function safeTheme(value) {
  if (value === "dark" || value === "pink" || value === "frog") return "blackout";
  return ["light", "blackout"].includes(value) ? value : "light";
}

function safeQuickForms(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.slice(0, limits.quickForms).map(item => {
    const title = cleanQuickFormTitle(item && item.title);
    const body = cleanQuickFormBody(item && item.body);
    if (!title || !body) return null;
    const form = { title, body };
    const key = quickFormKey(form);
    if (!key || seen.has(key)) return null;
    seen.add(key);
    return form;
  }).filter(Boolean);
}

// A setup string only needs to carry what differs from the defaults the
// decoder already fills in. Everything below emits the minimal shape that
// round-trips exactly, so the copied string stays short. Schema stays at
// version 1, so older builds still read these strings.

function compactTemplate(template) {
  const pinned = Boolean(template.pinned);
  const customName = template.customName || "";
  if (!pinned && !customName) return template.source;
  const out = { source: template.source };
  if (pinned) out.pinned = true;
  if (customName) out.customName = customName;
  return out;
}

function compactNoteBlocks() {
  const out = {};
  if (state.customQuickPieces.length) out.customBlocks = [...state.customQuickPieces];
  if (state.hiddenQuickPieceKeys.length) out.hiddenKeys = [...state.hiddenQuickPieceKeys];
  if (state.customQuickPieceOrder.length) out.customOrder = [...state.customQuickPieceOrder];
  if (state.recentQuickPieceKeys.length) out.recentKeys = [...state.recentQuickPieceKeys];
  if (state.quickSort !== "workflow") out.sort = state.quickSort;
  return out;
}

function compactSections() {
  const out = {};
  if (els.setupPanel.classList.contains("is-collapsed")) out.setupCollapsed = true;
  // Rules default to collapsed, so only an open rules card needs recording.
  if (!els.rulesPanel.classList.contains("is-collapsed")) out.rulesCollapsed = false;
  if (els.fullTemplatePanel.classList.contains("is-collapsed")) out.templatesCollapsed = true;
  if (els.quickFormsPanel.classList.contains("is-collapsed")) out.quickFormsCollapsed = true;
  if (els.buildPanel.classList.contains("is-collapsed")) out.noteBlocksCollapsed = true;
  // Setup sub-areas default to collapsed once content exists, so only record
  // an explicitly-open setup that has content to keep open.
  if (state.quickForms.length
      && els.quickFormSetup
      && !els.quickFormSetup.classList.contains("is-collapsed")) {
    out.quickFormSetupCollapsed = false;
  }
  if (uniquePieces({ includeHidden: true }).length
      && els.noteBlockSetup
      && !els.noteBlockSetup.classList.contains("is-collapsed")) {
    out.noteBlockSetupCollapsed = false;
  }
  if (state.templateListHeight !== limits.templateListHeightDefault) {
    out.templateListHeight = state.templateListHeight;
  }
  if (state.noteBlocksListHeight !== limits.noteBlocksListHeightDefault) {
    out.noteBlocksListHeight = state.noteBlocksListHeight;
  }
  return out;
}

function rulesAreDefault() {
  return cleanRule(state.rules.start) === defaultRules.start
    && cleanRule(state.rules.callEnded) === defaultRules.callEnded
    && cleanRule(state.rules.transferPrefix) === defaultRules.transferPrefix;
}

function setupPayload() {
  syncCustomTemplateOrder();
  syncCustomQuickOrder(uniquePieces({ includeHidden: true }));

  const payload = {
    app: "WrapDeck",
    version: 1,
    templates: state.templates.map(compactTemplate)
  };

  if (!rulesAreDefault()) payload.rules = { ...state.rules };
  if (state.templateSort !== "workflow") payload.templateSort = state.templateSort;

  // customTemplateOrder and recentTemplateKeys are both just the templates'
  // load order until the user reorders. When either still matches that order
  // the decoder rebuilds it, so it does not need to be carried in the string.
  const orderKeys = state.templates.map(templateKey);
  const matchesOrder = list => list.length === orderKeys.length
    && list.every((key, index) => key === orderKeys[index]);

  if (state.customTemplateOrder.length && !matchesOrder(state.customTemplateOrder)) {
    payload.customTemplateOrder = [...state.customTemplateOrder];
  }
  if (state.recentTemplateKeys.length && !matchesOrder(state.recentTemplateKeys)) {
    payload.recentTemplateKeys = [...state.recentTemplateKeys];
  }

  if (state.quickForms.length) {
    payload.quickForms = state.quickForms.map(form => ({ title: form.title, body: form.body }));
  }

  if (state.savedReferenceText) {
    payload.savedReferenceText = state.savedReferenceText;
  }

  const noteBlocks = compactNoteBlocks();
  if (Object.keys(noteBlocks).length) payload.noteBlocks = noteBlocks;

  const sections = compactSections();
  if (Object.keys(sections).length) payload.sections = sections;

  if (state.theme !== "light") payload.theme = state.theme;
  if (state.zoom !== limits.zoomDefault) payload.zoom = state.zoom;

  return payload;
}

function setupString() {
  return `${setupStringPrefix}${encodeSetupJson(setupPayload())}`;
}

function parseSetupTemplates(rawTemplates, nextRules) {
  const previousRules = state.rules;
  state.rules = nextRules;
  try {
    const templates = Array.isArray(rawTemplates) ? rawTemplates : [];
    const seen = new Set();
    return templates.slice(0, limits.templates).map(item => {
      const source = typeof item === "string" ? item : item && item.source;
      if (typeof source !== "string") return null;
      const parsed = parseTemplate(source);
      if (!parsed) return null;
      const key = templateKey(parsed);
      if (!key || seen.has(key)) return null;
      seen.add(key);
      parsed.pinned = Boolean(item && typeof item === "object" && item.pinned);
      parsed.customName = typeof item?.customName === "string" ? clean(item.customName).slice(0, 80) : "";
      return parsed;
    }).filter(Boolean);
  } finally {
    state.rules = previousRules;
  }
}

function normalizeSetupPayload(payload) {
  if (!payload || payload.app !== "WrapDeck" || payload.version !== 1) {
    throw new Error("Setup string is not a supported WrapDeck setup string.");
  }

  const nextRules = {
    start: cleanRule(payload.rules?.start || defaultRules.start),
    callEnded: cleanRule(payload.rules?.callEnded || defaultRules.callEnded),
    transferPrefix: cleanRule(payload.rules?.transferPrefix || defaultRules.transferPrefix)
  };
  if (!nextRules.start || !nextRules.callEnded || !nextRules.transferPrefix) {
    throw new Error("Setup string has invalid note rules.");
  }

  const templates = parseSetupTemplates(payload.templates, nextRules);
  const templateKeys = new Set(templates.map(templateKey));
  const noteBlocks = payload.noteBlocks || {};
  const sections = payload.sections || {};
  const theme = safeTheme(payload.theme);
  const zoom = Number.isFinite(payload.zoom) ? clampZoom(payload.zoom) : limits.zoomDefault;

  return {
    rules: nextRules,
    templates,
    templateSort: safeTemplateSort(payload.templateSort),
    customTemplateOrder: safeStringArray(payload.customTemplateOrder).filter(key => templateKeys.has(key)),
    recentTemplateKeys: Array.isArray(payload.recentTemplateKeys)
      ? safeStringArray(payload.recentTemplateKeys).filter(key => templateKeys.has(key))
      : templates.map(templateKey),
    quickForms: safeQuickForms(payload.quickForms),
    savedReferenceText: cleanSavedReference(payload.savedReferenceText),
    customQuickPieces: safeStringArray(noteBlocks.customBlocks || noteBlocks.customPieces, limits.quickPieces, 300).map(cleanPiece),
    hiddenQuickPieceKeys: safeStringArray(noteBlocks.hiddenKeys, limits.quickPieces, 300),
    customQuickPieceOrder: safeStringArray(noteBlocks.customOrder, limits.quickPieces, 300),
    recentQuickPieceKeys: safeStringArray(noteBlocks.recentKeys, limits.quickPieces, 300),
    quickSort: safeSort(noteBlocks.sort),
    sections: {
      setupCollapsed: sections.setupCollapsed !== false,
      rulesCollapsed: sections.rulesCollapsed !== false,
      templatesCollapsed: Boolean(sections.templatesCollapsed),
      quickFormsCollapsed: Boolean(sections.quickFormsCollapsed),
      quickFormSetupCollapsed: typeof sections.quickFormSetupCollapsed === "boolean"
        ? sections.quickFormSetupCollapsed
        : undefined,
      noteBlocksCollapsed: Boolean(sections.noteBlocksCollapsed),
      noteBlockSetupCollapsed: typeof sections.noteBlockSetupCollapsed === "boolean"
        ? sections.noteBlockSetupCollapsed
        : undefined,
      finishCollapsed: Boolean(sections.finishCollapsed),
      templateListHeight: Number.isFinite(sections.templateListHeight)
        ? clampTemplateListHeight(sections.templateListHeight)
        : limits.templateListHeightDefault,
      noteBlocksListHeight: Number.isFinite(sections.noteBlocksListHeight)
        ? clampNoteBlocksListHeight(sections.noteBlocksListHeight)
        : limits.noteBlocksListHeightDefault
    },
    theme,
    zoom
  };
}

function applySetupState(next) {
  state.templates = next.templates;
  state.customQuickPieces = next.customQuickPieces;
  state.hiddenQuickPieceKeys = next.hiddenQuickPieceKeys;
  state.customQuickPieceOrder = next.customQuickPieceOrder;
  state.recentQuickPieceKeys = next.recentQuickPieceKeys;
  state.quickForms = next.quickForms;
  state.savedReferenceText = next.savedReferenceText;
  state.editingSavedReference = false;
  clearActiveQuickForm({ render: false, status: false });
  state.highlightedQuickPieceKey = "";
  state.highlightedTemplateKey = "";
  state.editingQuickPieceKey = "";
  state.rules = next.rules;
  state.quickSort = next.quickSort;
  state.quickFilter = "";
  state.templateSort = next.templateSort;
  state.templateFilter = "";
  state.templatePinnedOnly = false;
  state.customTemplateOrder = next.customTemplateOrder;
  state.recentTemplateKeys = next.recentTemplateKeys;
  state.editingTemplateKey = "";
  state.theme = next.theme;
  state.zoom = next.zoom;

  syncCustomTemplateOrder();
  syncCustomQuickOrder(uniquePieces({ includeHidden: true }));
  resetCall();
  els.templateInput.value = "";
  els.quickFilter.value = "";
  els.templateFilter.value = "";
  els.newQuickPiece.value = "";
  els.quickFormTitle.value = "";
  els.quickFormBody.value = "";
  els.customDetail.value = "";
  if (els.savedReferenceEditor) els.savedReferenceEditor.value = "";
  setTheme(state.theme);
  setZoom(state.zoom);
  setTemplateListHeight(next.sections.templateListHeight);
  setNoteBlocksListHeight(next.sections.noteBlocksListHeight);
  setScratchpadHeight(limits.scratchpadHeightDefault);
  renderRuleInputs();
  renderTemplateSort();
  renderTemplates();
  renderQuickForms();
  renderSavedReference();
  renderQuickSort();
  renderQuickPieces();
  setSetupCollapsed(next.sections.setupCollapsed);
  setRulesCollapsed(next.sections.rulesCollapsed);
  setTemplatesCollapsed(next.sections.templatesCollapsed);
  setQuickFormsCollapsed(next.sections.quickFormsCollapsed);
  setBuildCollapsed(next.sections.noteBlocksCollapsed);
  setFinishCollapsed(next.sections.finishCollapsed);
  setTemplateToolsCollapsed(true);
  setNoteBlockLibraryCollapsed(true);
  setQuickFormSetupCollapsed(state.quickForms.length ? next.sections.quickFormSetupCollapsed ?? true : true);
  if (uniquePieces({ includeHidden: true }).length) {
    setNoteBlockSetupCollapsed(next.sections.noteBlockSetupCollapsed ?? true);
  }
  setScratchpadCollapsed(true);
  updateTemplateFilterClear();
  renderSectionSummaries();
}

function loadSetupString(value) {
  try {
    const payload = decodeSetupJson(value);
    const next = normalizeSetupPayload(payload);
    applySetupState(next);
    setStatus(`Board setup loaded. ${state.templates.length} Full Template${state.templates.length === 1 ? "" : "s"} restored.`, "good");
  } catch (error) {
    const message = error.message && error.message.startsWith("Setup string")
      ? error.message
      : "Setup string could not be read.";
    setStatus(message, "bad");
  }
}

async function copySetupString() {
  try {
    await writeClipboard(setupString());
    setStatus("Setup string copied. Store only where allowed.", "warn");
  } catch (error) {
    setStatus(error.message || "Clipboard copy was blocked", "bad");
  }
}

// ── Quick Forms ──────────────────────────────────────────────────────────────

function quickFormPreview(body) {
  const lines = cleanQuickFormBody(body).split("\n").filter(Boolean);
  return lines.slice(0, 3).join(" / ");
}

function renderQuickForms() {
  els.quickFormList.replaceChildren();
  renderCounts();
  const hasForms = state.quickForms.length > 0;
  if (els.toggleQuickFormSetup) els.toggleQuickFormSetup.hidden = false;
  if (!hasForms) {
    setQuickFormSetupCollapsed(true);
    els.quickFormList.append(emptyMessage("No Quick Forms saved. Use Add form only when this call needs a separate copyable form."));
    return;
  }
  state.quickForms.forEach(form => {
    const key = quickFormKey(form);
    const item = document.createElement("article");
    const text = document.createElement("div");
    const name = document.createElement("div");
    const summary = document.createElement("div");
    const actions = document.createElement("div");
    const select = makeButton("Use", () => selectQuickForm(form), "quick-form-use");
    const remove = makeButton("×", () => removeQuickForm(form), "quick-form-remove");
    item.className = "quick-form-item";
    item.classList.toggle("is-active", key === state.activeQuickFormKey);
    text.className = "quick-form-text";
    name.className = "quick-form-name";
    summary.className = "quick-form-summary";
    actions.className = "quick-form-actions";
    name.textContent = form.title;
    summary.textContent = quickFormPreview(form.body);
    select.setAttribute("aria-label", `Use Quick Form: ${form.title}`);
    remove.setAttribute("aria-label", `Remove Quick Form: ${form.title}`);
    remove.title = "Remove Quick Form";
    actions.append(select, remove);
    text.append(name, summary);
    item.append(text, actions);
    els.quickFormList.append(item);
  });
}

function renderQuickFormDock() {
  const active = Boolean(state.activeQuickFormKey);
  if (els.quickFormDock) els.quickFormDock.hidden = !active;
  document.body.classList.toggle("has-quick-form", active);
  if (!active) {
    if (els.quickFormDockTitle) els.quickFormDockTitle.textContent = "Quick Form";
    if (els.quickFormDockStatus) els.quickFormDockStatus.textContent = "Separate from call note";
    if (els.quickFormEditor && document.activeElement !== els.quickFormEditor) els.quickFormEditor.value = "";
    if (els.copyQuickForm) els.copyQuickForm.disabled = true;
    if (els.resetQuickForm) els.resetQuickForm.disabled = true;
    if (els.clearQuickForm) els.clearQuickForm.disabled = true;
    renderSectionSummaries();
    queueDockClearanceSync();
    return;
  }

  if (els.quickFormDockTitle) els.quickFormDockTitle.textContent = state.activeQuickFormTitle;
  if (els.quickFormDockStatus) els.quickFormDockStatus.textContent = "Separate from call note";
  if (els.quickFormEditor && document.activeElement !== els.quickFormEditor) {
    els.quickFormEditor.value = state.activeQuickFormContent;
  }
  const hasCopyText = Boolean(cleanQuickFormBody(els.quickFormEditor?.value || state.activeQuickFormContent));
  if (els.copyQuickForm) els.copyQuickForm.disabled = !hasCopyText;
  if (els.resetQuickForm) els.resetQuickForm.disabled = !active;
  if (els.clearQuickForm) els.clearQuickForm.disabled = !active;
  renderSectionSummaries();
  queueDockClearanceSync();
}

function addQuickForm() {
  const title = cleanQuickFormTitle(els.quickFormTitle.value);
  const body = cleanQuickFormBody(els.quickFormBody.value);
  if (!title || !body) {
    setStatus("Quick Form title and body are required.", "bad");
    return;
  }
  if (state.quickForms.length >= limits.quickForms) {
    setStatus(`Quick Form limit reached (${limits.quickForms}).`, "bad");
    return;
  }

  const form = { title, body };
  const key = quickFormKey(form);
  const existing = state.quickForms.find(candidate => quickFormKey(candidate) === key);
  if (existing) {
    setStatus("Quick Form already exists.", "warn");
    els.quickFormTitle.focus();
    return;
  }

  state.quickForms.unshift(form);
  els.quickFormTitle.value = "";
  els.quickFormBody.value = "";
  renderQuickForms();
  selectQuickForm(form);
  setStatus("Quick Form added.");
}

function selectQuickForm(form) {
  state.activeQuickFormKey = quickFormKey(form);
  state.activeQuickFormTitle = form.title;
  state.activeQuickFormTemplate = form.body;
  state.activeQuickFormContent = form.body;
  if (els.quickFormEditor) els.quickFormEditor.value = form.body;
  renderQuickFormDock();
  renderQuickForms();
  setStatus("Quick Form ready.", "good");
  if (els.quickFormEditor && typeof els.quickFormEditor.focus === "function") {
    els.quickFormEditor.focus();
  }
}

function removeQuickForm(form) {
  const key = quickFormKey(form);
  state.quickForms = state.quickForms.filter(candidate => quickFormKey(candidate) !== key);
  if (state.activeQuickFormKey === key) {
    clearActiveQuickForm({ render: false, status: false });
  }
  renderQuickForms();
  renderQuickFormDock();
  setStatus("Quick Form removed.", "warn");
  focusFirst(".quick-form-use, #quickFormTitle", els.quickFormTitle);
}

function clearActiveQuickForm(options = {}) {
  state.activeQuickFormKey = "";
  state.activeQuickFormTitle = "";
  state.activeQuickFormTemplate = "";
  state.activeQuickFormContent = "";
  if (els.quickFormEditor) els.quickFormEditor.value = "";
  if (options.render !== false) {
    renderQuickFormDock();
    renderQuickForms();
  }
  if (options.status !== false) setStatus("Quick Form cleared.");
  if (options.focus && typeof options.focus.focus === "function") options.focus.focus();
}

function resetActiveQuickForm() {
  if (!state.activeQuickFormKey) return;
  state.activeQuickFormContent = state.activeQuickFormTemplate;
  if (els.quickFormEditor) {
    els.quickFormEditor.value = state.activeQuickFormTemplate;
    els.quickFormEditor.focus();
  }
  renderQuickFormDock();
  setStatus("Quick Form reset.");
}

async function copyActiveQuickForm() {
  if (!state.activeQuickFormKey) return;
  const text = cleanQuickFormBody(els.quickFormEditor?.value || state.activeQuickFormContent);
  if (!text) {
    renderQuickFormDock();
    return;
  }
  try {
    await writeClipboard(text);
    setStatus("Quick Form copied.", "warn");
  } catch (error) {
    setStatus(error.message || "Clipboard copy was blocked", "bad");
  }
}

// ── Note composition ─────────────────────────────────────────────────────────

function composeNote() {
  const parts = [state.rules.start, ...state.pieces];
  if (state.ending === "transfer") {
    const target = clean(els.transferTarget.value);
    parts.push(target ? `${state.rules.transferPrefix} ${target}` : state.rules.transferPrefix);
  } else {
    parts.push(state.rules.callEnded);
  }
  return parts.join("// ");
}

function currentCopyText() {
  return state.editingNote ? cleanCopiedNote(els.noteEditor.value) : composeNote();
}

function noteIsValid() {
  if (!state.pieces.length) return false;
  return state.ending !== "transfer" || Boolean(clean(els.transferTarget.value));
}

function editedNoteIsCopyable() {
  const note = cleanCopiedNote(els.noteEditor.value);
  const startPat = escapeRegExp(state.rules.start);
  const endedPat = escapeRegExp(state.rules.callEnded);
  const transferPat = escapeRegExp(state.rules.transferPrefix);
  return new RegExp(`^${startPat}\\s*\\/\\/`, "i").test(note)
    && new RegExp(`\\/\\/\\s*(?:${endedPat}|${transferPat}\\s+.+)$`, "i").test(note);
}

// ── UI helpers ───────────────────────────────────────────────────────────────

function setStatus(message, tone = "neutral") {
  els.status.textContent = message;
  els.status.dataset.tone = tone;
}

function dockPreviewText() {
  if (state.editingNote) return cleanCopiedNote(els.noteEditor.value) || composeNote();
  return composeNote();
}

function dockEndingText() {
  if (state.ending === "transfer") {
    const target = clean(els.transferTarget.value);
    return target ? `${state.rules.transferPrefix} ${target}` : state.rules.transferPrefix;
  }
  return state.rules.callEnded;
}

function appendDockPreviewSegment(parent, text, options = {}) {
  const span = document.createElement("span");
  span.className = options.className || "dock-preview-segment";
  if (options.pieceIndex !== undefined) {
    span.dataset.pieceIndex = String(options.pieceIndex);
  }
  span.textContent = text;
  parent.append(span);
}

function renderGeneratedDockPreview() {
  els.dockPreview.replaceChildren();
  appendDockPreviewSegment(els.dockPreview, state.rules.start, { className: "dock-preview-segment is-rule" });
  state.pieces.forEach((piece, index) => {
    els.dockPreview.append(document.createTextNode("// "));
    const moved = state.movedPieceIndex === index;
    const directionClass = state.movedPieceDirection < 0 ? "is-moved-up" : "is-moved-down";
    appendDockPreviewSegment(els.dockPreview, piece, {
      pieceIndex: index,
      className: `dock-preview-segment is-piece${moved ? ` is-current-moved ${directionClass}` : ""}`
    });
  });
  els.dockPreview.append(document.createTextNode("// "));
  appendDockPreviewSegment(els.dockPreview, dockEndingText(), { className: "dock-preview-segment is-rule" });
}

function noteCursorBeforeEnding(note) {
  const transfer = state.ending === "transfer";
  const marker = transfer ? state.rules.transferPrefix : state.rules.callEnded;
  const pattern = new RegExp(`\\/\\/\\s*${escapeRegExp(marker)}${transfer ? "(?=\\s|$)" : "\\s*$"}`, "i");
  const match = pattern.exec(note);
  return match ? match.index : note.length;
}

function updateDockPreview() {
  if (!els.callDock || !els.dockPreview) return;
  els.callDock.classList.toggle("is-editing", state.editingNote);
  if (state.editingNote) {
    els.dockPreview.textContent = dockPreviewText();
  } else {
    renderGeneratedDockPreview();
  }
  if (els.dockNoteEditor && document.activeElement !== els.dockNoteEditor) {
    els.dockNoteEditor.value = els.noteEditor.value;
  }
  queueDockClearanceSync();
}

function emptyMessage(message) {
  const p = document.createElement("p");
  p.className = "empty";
  p.textContent = message;
  return p;
}

function makeButton(label, onClick, className = "") {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = label;
  btn.className = className;
  btn.addEventListener("click", onClick);
  return btn;
}

function focusFirst(selector, fallback = null) {
  const target = document.querySelector(selector) || fallback;
  if (target && typeof target.focus === "function") target.focus();
}

let dockClearanceFrame = 0;

function queueDockClearanceSync() {
  if (!els.callDock || dockClearanceFrame) return;
  dockClearanceFrame = window.requestAnimationFrame(() => {
    dockClearanceFrame = 0;
    const dockHeight = Math.ceil(els.callDock.getBoundingClientRect().height);
    const clearance = Math.max(180, dockHeight + 32);
    document.documentElement.style.setProperty("--dock-clearance", `${clearance}px`);
  });
}

function queueReusablePhrasesReveal() {
  if (!els.noteBlockLibrary || !els.pieceList || !els.callDock) return;
  if (els.noteBlockLibrary.classList.contains("is-collapsed")) return;
  queueDockClearanceSync();
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const dockTop = els.callDock.getBoundingClientRect().top;
      const listRect = els.pieceList.getBoundingClientRect();
      const overshoot = listRect.bottom - (dockTop - 20);
      if (overshoot > 0) window.scrollBy({ top: overshoot, left: 0, behavior: "auto" });
    });
  });
}

function markMovedItem(type, key) {
  window.clearTimeout(state.highlightTimer);
  if (type === "template") {
    state.highlightedTemplateKey = key;
  } else {
    state.highlightedQuickPieceKey = key;
  }
  state.highlightTimer = window.setTimeout(() => {
    if (type === "template") state.highlightedTemplateKey = "";
    else state.highlightedQuickPieceKey = "";
    document.querySelectorAll(".is-moved").forEach(item => item.classList.remove("is-moved"));
  }, 1400);
}

function clearMovedCurrentPiece() {
  window.clearTimeout(state.movedPieceTimer);
  state.movedPieceIndex = -1;
  state.movedPieceDirection = 0;
  document.querySelectorAll(
    ".current-control.is-current-moved, .current-move.is-move-trigger, .dock-preview-segment.is-current-moved"
  ).forEach(item => {
    item.classList.remove("is-current-moved", "is-move-trigger", "is-moved-up", "is-moved-down");
  });
}

function clearCurrentPieceDragVisuals() {
  document.querySelectorAll(
    ".current-control.is-dragging, .current-control.is-drop-before, .current-control.is-drop-after"
  ).forEach(item => {
    item.classList.remove("is-dragging", "is-drop-before", "is-drop-after");
  });
}

function resetCurrentPieceDragState() {
  state.draggingPieceIndex = -1;
  state.dragTargetPieceIndex = -1;
  state.dragInsertAfter = false;
  clearCurrentPieceDragVisuals();
  document.body.classList.remove("is-current-piece-dragging");
}

function setCurrentPieceDropTarget(targetIndex, insertAfter) {
  clearCurrentPieceDragVisuals();
  state.dragTargetPieceIndex = targetIndex;
  state.dragInsertAfter = Boolean(insertAfter);

  const items = document.querySelectorAll(".current-control");
  const dragged = items[state.draggingPieceIndex];
  const target = items[targetIndex];
  if (dragged) dragged.classList.add("is-dragging");
  if (!target) return;
  target.classList.add(insertAfter ? "is-drop-after" : "is-drop-before");
}

function updateCurrentPieceDropTarget(event) {
  if (state.draggingPieceIndex < 0) return;

  const list = els.currentList;
  const rect = list.getBoundingClientRect();
  if (event.clientY < rect.top + 24) list.scrollTop -= 10;
  if (event.clientY > rect.bottom - 24) list.scrollTop += 10;

  const items = [...list.querySelectorAll(".current-control[data-current-index]")];
  if (!items.length) return;

  for (const item of items) {
    const itemRect = item.getBoundingClientRect();
    if (event.clientY < itemRect.top + itemRect.height / 2) {
      setCurrentPieceDropTarget(Number(item.dataset.currentIndex), false);
      return;
    }
  }

  setCurrentPieceDropTarget(Number(items[items.length - 1].dataset.currentIndex), true);
}

function adjustedIndexAfterCurrentPieceMove(currentIndex, fromIndex, toIndex) {
  if (currentIndex < 0) return currentIndex;
  if (currentIndex === fromIndex) return toIndex;
  if (fromIndex < toIndex && currentIndex > fromIndex && currentIndex <= toIndex) {
    return currentIndex - 1;
  }
  if (fromIndex > toIndex && currentIndex >= toIndex && currentIndex < fromIndex) {
    return currentIndex + 1;
  }
  return currentIndex;
}

function reorderCurrentPiece(fromIndex, toIndex) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= state.pieces.length ||
    toIndex >= state.pieces.length ||
    fromIndex === toIndex
  ) {
    return false;
  }

  const [piece] = state.pieces.splice(fromIndex, 1);
  state.pieces.splice(toIndex, 0, piece);
  state.editingPieceIndex = adjustedIndexAfterCurrentPieceMove(
    state.editingPieceIndex,
    fromIndex,
    toIndex
  );
  markMovedCurrentPiece(toIndex, toIndex < fromIndex ? -1 : 1);
  return true;
}

function markMovedCurrentPiece(index, direction) {
  window.clearTimeout(state.movedPieceTimer);
  state.movedPieceIndex = index;
  state.movedPieceDirection = direction;
  state.movedPieceTimer = window.setTimeout(() => {
    clearMovedCurrentPiece();
  }, 1400);
}

function currentPieceDropIndex() {
  if (state.dragTargetPieceIndex < 0) return -1;
  const rawIndex = state.dragTargetPieceIndex + (state.dragInsertAfter ? 1 : 0);
  const adjusted = rawIndex > state.draggingPieceIndex ? rawIndex - 1 : rawIndex;
  return Math.max(0, Math.min(state.pieces.length - 1, adjusted));
}

function endCurrentPieceDrag({ canceled = false } = {}) {
  const fromIndex = state.draggingPieceIndex;
  const toIndex = currentPieceDropIndex();
  resetCurrentPieceDragState();

  window.removeEventListener("pointermove", handleCurrentPieceDragMove);
  window.removeEventListener("pointerup", handleCurrentPieceDragEnd);
  window.removeEventListener("pointercancel", handleCurrentPieceDragCancel);
  window.removeEventListener("keydown", handleCurrentPieceDragKeydown);

  if (canceled) {
    setStatus("Piece drag canceled.", "warn");
    return;
  }

  if (!reorderCurrentPiece(fromIndex, toIndex)) {
    setStatus("Piece order unchanged.");
    renderCurrentPieces();
    renderNote();
    focusFirst(".current-drag-handle", els.customDetail);
    return;
  }

  renderCurrentPieces();
  renderNote();
  setStatus("Current piece moved.");
  const moved = document.querySelectorAll(".current-control")[toIndex];
  const target = moved && moved.querySelector(".current-drag-handle");
  if (target && typeof target.focus === "function") target.focus();
}

function handleCurrentPieceDragMove(event) {
  if (state.draggingPieceIndex < 0) return;
  event.preventDefault();
  updateCurrentPieceDropTarget(event);
}

function handleCurrentPieceDragEnd(event) {
  if (state.draggingPieceIndex < 0) return;
  event.preventDefault();
  updateCurrentPieceDropTarget(event);
  endCurrentPieceDrag();
}

function handleCurrentPieceDragCancel(event) {
  if (state.draggingPieceIndex < 0) return;
  event.preventDefault();
  endCurrentPieceDrag({ canceled: true });
}

function handleCurrentPieceDragKeydown(event) {
  if (event.key !== "Escape" || state.draggingPieceIndex < 0) return;
  event.preventDefault();
  endCurrentPieceDrag({ canceled: true });
}

function beginCurrentPieceDrag(event, index) {
  if (event.button !== 0 || index < 0 || index >= state.pieces.length) return;
  if (state.pieces.length < 2) {
    setStatus("Add another note piece before dragging.", "warn");
    return;
  }
  if (state.editingPieceIndex !== -1) {
    setStatus("Save or cancel the open piece edit before dragging.", "warn");
    return;
  }

  event.preventDefault();
  clearMovedCurrentPiece();
  state.draggingPieceIndex = index;
  state.dragTargetPieceIndex = index;
  state.dragInsertAfter = false;
  document.body.classList.add("is-current-piece-dragging");
  setCurrentPieceDropTarget(index, false);
  setStatus("Dragging note piece. Release to place it, or press Escape to cancel.");

  window.addEventListener("pointermove", handleCurrentPieceDragMove);
  window.addEventListener("pointerup", handleCurrentPieceDragEnd);
  window.addEventListener("pointercancel", handleCurrentPieceDragCancel);
  window.addEventListener("keydown", handleCurrentPieceDragKeydown);
}

// ── Render: counts ────────────────────────────────────────────────────────────

function renderCounts() {
  const templateCount    = state.templates.length;
  const visibleTemplateCount = visibleTemplates().length;
  const allQuickPieces   = uniquePieces().length;
  const quickPieceCount  = visibleQuickPieces().length;
  const currentPieceCount = state.pieces.length;
  els.templateCount.textContent       = state.templateFilter || state.templatePinnedOnly
    ? `${visibleTemplateCount}/${templateCount}`
    : templateCount;
  els.headerTemplateCount.textContent = templateCount;
  els.quickPieceCount.textContent     = state.quickFilter
    ? `${quickPieceCount}/${allQuickPieces}`
    : allQuickPieces;
  els.currentPieceCount.textContent   = currentPieceCount;
  els.dockPieceCount.textContent      = currentPieceCount;
  renderTemplateResultState(templateCount, visibleTemplateCount);
  renderSectionSummaries();
}

function renderTemplateResultState(templateCount = state.templates.length, visibleTemplateCount = visibleTemplates().length) {
  if (!els.templateResultState) return;
  if (!templateCount) {
    els.templateResultState.textContent = "Load templates first. Then search by situation, phrase, or transfer.";
    return;
  }
  const shown = (state.templateFilter || state.templatePinnedOnly)
    ? `${visibleTemplateCount} of ${templateCount} matches.`
    : `${templateCount} loaded. Search before scrolling.`;
  const filter = state.templateFilter ? " Clear search when done." : "";
  const pinned = state.templatePinnedOnly ? " Pinned only active." : " Pinned stay first.";
  els.templateResultState.textContent = `${shown}${filter}${pinned}`;
}

function renderSectionSummaries() {
  const templateCount = state.templates.length;
  const pinnedCount = state.templates.filter(template => template.pinned).length;
  const visibleTemplateCount = visibleTemplates().length;
  const quickFormCount = state.quickForms.length;
  const filterBits = [];
  if (state.templateFilter) filterBits.push("Filter active");
  if (state.templatePinnedOnly) filterBits.push("Pinned only");

  if (els.setupSummary) {
    els.setupSummary.textContent = templateCount
      ? `Board: ${templateCount} template${templateCount === 1 ? "" : "s"}.`
      : "Load a saved board or template deck.";
  }
  if (els.templateSummary) {
    if (!templateCount) {
      els.templateSummary.textContent = "Load the deck, then search.";
    } else {
      const pinned = pinnedCount ? `, ${pinnedCount} pinned` : "";
      const visible = (state.templateFilter || state.templatePinnedOnly)
        ? `. ${visibleTemplateCount}/${templateCount} shown`
        : "";
      els.templateSummary.textContent = `${templateCount} template${templateCount === 1 ? "" : "s"}${pinned}${visible}${filterBits.length ? `. ${filterBits.join(". ")}.` : "."}`;
    }
  }
  if (els.quickFormsSummary) {
    if (!quickFormCount) {
      els.quickFormsSummary.textContent = "Separate form text.";
    } else if (state.activeQuickFormKey) {
      els.quickFormsSummary.textContent = `Quick Forms: ${quickFormCount} saved. Active: ${state.activeQuickFormTitle}.`;
    } else {
      els.quickFormsSummary.textContent = `Quick Forms: ${quickFormCount} saved. None active.`;
    }
  }
  if (els.buildSummary) {
    els.buildSummary.textContent = "Type a piece or paste a full note.";
  }
  if (els.finishSummary) {
    if (!state.pieces.length) {
      els.finishSummary.textContent = "Needs note pieces. Live note stays in the dock.";
    } else if (state.ending === "transfer" && !clean(els.transferTarget.value)) {
      els.finishSummary.textContent = "Needs transfer destination. Live note stays in the dock.";
    } else if (state.ending === "transfer") {
      els.finishSummary.textContent = `Ending: ${state.rules.transferPrefix}. Live note stays in the dock.`;
    } else {
      els.finishSummary.textContent = `Ending: ${state.rules.callEnded}. Live note stays in the dock.`;
    }
  }
}

// ── Render: templates ─────────────────────────────────────────────────────────

function renderTemplates() {
  els.templateList.replaceChildren();
  const templates = visibleTemplates();
  renderCounts();
  if (!state.templates.length) {
    els.templateList.append(emptyMessage("Load Board Setup first. Full Template buttons will appear here."));
    return;
  }
  if (!templates.length) {
    const hasPinned = state.templates.some(template => template.pinned);
    const message = state.templatePinnedOnly && !hasPinned
      ? "No pinned Full templates yet."
      : state.templatePinnedOnly
        ? "No pinned Full templates match this filter."
        : "No Full templates match this filter.";
    els.templateList.append(emptyMessage(message));
    return;
  }
  templates.forEach((template, index) => {
    const item    = document.createElement("article");
    const text    = document.createElement("div");
    const name    = document.createElement("div");
    const summary = document.createElement("div");
    const cue = document.createElement("span");
    const titleRow = document.createElement("div");
    const order   = document.createElement("div");
    const actions = document.createElement("div");
    const pin     = makeButton("📌", () => toggleTemplatePin(template), "template-pin");
    const edit    = makeButton("✎", () => beginTemplateTitleEdit(template), "template-title-button");
    const up      = makeButton("↑", () => moveTemplate(template, -1), "template-order-button");
    const down    = makeButton("↓", () => moveTemplate(template, 1), "template-order-button");
    const remove  = makeButton("×", () => removeTemplate(template), "template-remove");
    item.className    = "template-item";
    item.classList.toggle("is-pinned", Boolean(template.pinned));
    item.classList.toggle("is-moved", templateKey(template) === state.highlightedTemplateKey);
    order.className   = "template-order";
    actions.className = "template-actions-cell";
    text.className    = "template-text";
    titleRow.className = "template-title-row";
    name.className    = "template-name";
    summary.className = "template-summary";
    cue.className = "template-cue";
    name.textContent    = templateDisplayName(template);
    summary.textContent = template.source;
    cue.textContent = "Transfer";
    cue.hidden = !templateIsTransfer(template);
    pin.setAttribute("aria-pressed", String(Boolean(template.pinned)));
    pin.setAttribute("aria-label", `${template.pinned ? "Unpin" : "Pin"} template`);
    pin.title = template.pinned ? "Unpin template" : "Pin template";
    edit.setAttribute("aria-label", "Edit template title");
    edit.title = "Edit template title";
    const previous = templates[index - 1];
    const next = templates[index + 1];
    up.setAttribute("aria-label", `Move full template up: ${templateDisplayName(template)}`);
    up.title = "Move up";
    up.disabled = !previous || Boolean(previous.pinned) !== Boolean(template.pinned);
    down.setAttribute("aria-label", `Move full template down: ${templateDisplayName(template)}`);
    down.title = "Move down";
    down.disabled = !next || Boolean(next.pinned) !== Boolean(template.pinned);
    remove.setAttribute("aria-label", `Remove full template from this session: ${templateDisplayName(template)}`);
    remove.title = "Remove full template";
    order.append(up, down);
    actions.append(
      makeButton("Copy as is", () => copyTemplateAsIs(template), "template-copy-as-is"),
      makeButton("Edit in dock", () => useTemplate(template, { editInDock: true }), "template-edit-in-dock")
    );

    if (state.editingTemplateKey === templateKey(template)) {
      const titleEdit = document.createElement("div");
      const input = document.createElement("input");
      const save = makeButton("Save", () => saveTemplateTitle(template, input.value), "template-title-save");
      const clear = makeButton("Clear", () => saveTemplateTitle(template, ""), "template-title-clear");
      titleEdit.className = "template-title-edit";
      input.className = "template-title-input";
      input.type = "text";
      input.maxLength = 80;
      input.autocomplete = "off";
      input.spellcheck = false;
      input.value = template.customName || "";
      input.placeholder = template.name;
      input.setAttribute("aria-label", `Display title for ${templateDisplayName(template)}`);
      input.addEventListener("keydown", event => {
        if (event.key === "Enter") {
          event.preventDefault();
          saveTemplateTitle(template, input.value);
        } else if (event.key === "Escape") {
          event.preventDefault();
          state.editingTemplateKey = "";
          renderTemplates();
        }
      });
      titleEdit.append(input, save, clear);
      text.append(titleEdit);
      window.setTimeout(() => {
        input.focus();
        input.select();
      }, 0);
    } else {
      titleRow.append(name, cue, edit);
      text.append(titleRow);
    }
    text.append(summary);
    item.append(order, pin, remove, text, actions);
    els.templateList.append(item);
  });
}

function renderTemplateSort() {
  els.templateSortLoaded.setAttribute("aria-pressed", String(state.templateSort === "workflow"));
  els.templateSortAZ.setAttribute("aria-pressed",     String(state.templateSort === "az"));
  els.templateSortCustom.setAttribute("aria-pressed", String(state.templateSort === "custom"));
  els.templatePinnedOnly.setAttribute("aria-pressed", String(state.templatePinnedOnly));
}

// ── Render: quick pieces ──────────────────────────────────────────────────────

function renderQuickPieces() {
  els.pieceList.replaceChildren();
  els.pieceList.classList.toggle("is-filtered", Boolean(state.quickFilter));
  els.pieceList.classList.toggle("is-custom-order", state.quickSort === "custom");
  const pieces = visibleQuickPieces();
  renderCounts();
  const hasNoteBlocks = uniquePieces({ includeHidden: true }).length > 0;
  if (els.toggleNoteBlockSetup) els.toggleNoteBlockSetup.hidden = !hasNoteBlocks;
  if (!hasNoteBlocks) setNoteBlockSetupCollapsed(false);
  if (!pieces.length) {
    let message = "Load templates or save a reusable phrase. Optional phrase buttons will appear here.";
    if (state.quickFilter) {
      message = "No reusable phrases match this filter.";
    } else if (sourceQuickPieces().length) {
      message = "All reusable phrases are hidden for this session. Add the same phrase to restore one.";
    }
    els.pieceList.append(emptyMessage(message));
    return;
  }
  pieces.forEach(piece => {
    const item = document.createElement("div");
    const actions = document.createElement("div");
    item.className = "piece-control";
    item.classList.toggle("is-custom", state.quickSort === "custom");
    item.classList.toggle("is-editing", state.editingQuickPieceKey === pieceKey(piece));
    item.classList.toggle("is-moved", pieceKey(piece) === state.highlightedQuickPieceKey);

    const add = makeButton(piece, () => {
      if (state.pieces.length >= limits.currentPieces) {
        setStatus(`Current note is limited to ${limits.currentPieces} pieces`, "bad");
        return;
      }
      state.pieces.push(piece);
      renderCurrentPieces();
      renderNote();
    }, "piece-button");

    const edit = makeButton("✎", () => editQuickPiece(piece), "piece-edit");
    const remove = makeButton("×", () => hideQuickPiece(piece), "piece-remove");
    edit.setAttribute("aria-label", `Edit reusable phrase: ${piece}`);
    edit.title = "Edit reusable phrase";
    remove.setAttribute("aria-label", `Hide reusable phrase for this session: ${piece}`);
    remove.title = "Hide reusable phrase";
    actions.className = "piece-actions";
    actions.append(edit, remove);
    if (state.quickSort === "custom") {
      const order = document.createElement("div");
      const up = makeButton("↑", () => moveQuickPiece(piece, -1), "piece-order-button");
      const down = makeButton("↓", () => moveQuickPiece(piece, 1), "piece-order-button");
      const visibleIndex = pieces.findIndex(candidate => pieceKey(candidate) === pieceKey(piece));
      order.className = "piece-order";
      up.setAttribute("aria-label", `Move reusable phrase up: ${piece}`);
      up.title = "Move up";
      up.disabled = visibleIndex === 0;
      down.setAttribute("aria-label", `Move reusable phrase down: ${piece}`);
      down.title = "Move down";
      down.disabled = visibleIndex === pieces.length - 1;
      order.append(up, down);
      actions.prepend(order);
    }
    if (state.editingQuickPieceKey === pieceKey(piece)) {
      const editWrap = document.createElement("div");
      const field = document.createElement("textarea");
      const editActions = document.createElement("div");
      const save = makeButton("Save", () => saveQuickPieceEdit(piece, field.value), "piece-edit-save primary");
      const cancel = makeButton("Cancel", () => cancelQuickPieceEdit(piece), "piece-edit-cancel");

      editWrap.className = "piece-edit-wrap";
      field.className = "piece-edit-field";
      field.value = piece;
      field.maxLength = 300;
      field.rows = 2;
      field.autocomplete = "off";
      field.spellcheck = false;
      field.setAttribute("aria-label", "Edit reusable phrase");
      field.addEventListener("keydown", event => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          saveQuickPieceEdit(piece, field.value);
        } else if (event.key === "Escape") {
          event.preventDefault();
          cancelQuickPieceEdit(piece);
        }
      });
      editActions.className = "piece-edit-actions";
      editActions.append(save, cancel);
      editWrap.append(field, editActions);
      item.append(actions, editWrap);
      queueMicrotask(() => {
        field.focus();
        field.select();
      });
    } else {
      item.append(actions, add);
    }
    els.pieceList.append(item);
  });
}

function renderQuickSort() {
  if (els.quickSortSelect) els.quickSortSelect.value = state.quickSort;
}

// ── Render: current pieces ────────────────────────────────────────────────────

function renderCurrentPieces() {
  els.currentList.replaceChildren();
  renderCounts();
  if (!state.pieces.length) {
    els.currentList.append(emptyMessage("Your note is empty. Type a note piece, use a Full Template, or open reusable phrases."));
    return;
  }
  state.pieces.forEach((piece, index) => {
    const item = document.createElement("div");
    const order = document.createElement("div");
    const card = document.createElement("div");
    const drag = makeButton("⋮⋮", event => {
      event.preventDefault();
      setStatus("Drag this handle to reorder, or use the arrow buttons.");
    }, "current-drag-handle");
    const up = makeButton("↑", () => moveCurrentPiece(index, -1), "current-move");
    const down = makeButton("↓", () => moveCurrentPiece(index, 1), "current-move");
    const edit = makeButton("✎", () => editCurrentPiece(index), "current-edit");
    const remove = makeButton("×", () => removeCurrentPiece(index), "current-remove");
    const moved = state.movedPieceIndex === index;
    const directionClass = state.movedPieceDirection < 0 ? "is-moved-up" : "is-moved-down";

    item.className = "current-control";
    item.dataset.currentIndex = String(index);
    item.setAttribute("role", "listitem");
    item.classList.toggle("is-current-moved", moved);
    if (moved) item.classList.add(directionClass);
    order.className = "current-order";
    card.className = "current-card";
    drag.setAttribute(
      "aria-label",
      `Drag current piece to reorder: ${piece}. Keyboard users can use Move up and Move down.`
    );
    drag.title = "Drag to reorder";
    drag.disabled = state.pieces.length < 2 || state.editingPieceIndex !== -1;
    drag.addEventListener("pointerdown", event => beginCurrentPieceDrag(event, index));

    up.setAttribute("aria-label", `Move current piece up: ${piece}`);
    up.title = "Move up";
    up.disabled = index === 0;
    down.setAttribute("aria-label", `Move current piece down: ${piece}`);
    down.title = "Move down";
    down.disabled = index === state.pieces.length - 1;
    edit.setAttribute("aria-label", `Edit current piece: ${piece}`);
    edit.title = "Edit piece";
    remove.setAttribute("aria-label", `Remove from current note: ${piece}`);
    remove.title = "Remove from current note";
    if (moved && state.movedPieceDirection < 0) up.classList.add("is-move-trigger", directionClass);
    if (moved && state.movedPieceDirection > 0) down.classList.add("is-move-trigger", directionClass);

    order.append(up, down);
    if (state.editingPieceIndex === index) {
      const editWrap = document.createElement("div");
      const field = document.createElement("textarea");
      const editActions = document.createElement("div");
      const save = makeButton("Save", () => saveCurrentPieceEdit(index, field.value), "current-edit-save primary");
      const cancel = makeButton("Cancel", () => cancelCurrentPieceEdit(), "current-edit-cancel");

      item.classList.add("is-editing");
      editWrap.className = "current-piece-edit";
      field.className = "current-piece-editor";
      field.value = piece;
      field.maxLength = 1000;
      field.rows = 3;
      field.autocomplete = "off";
      field.spellcheck = false;
      field.setAttribute("aria-label", "Edit this note piece");
      field.addEventListener("keydown", event => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          saveCurrentPieceEdit(index, field.value);
        } else if (event.key === "Escape") {
          event.preventDefault();
          cancelCurrentPieceEdit();
        }
      });
      editActions.className = "current-edit-actions";
      editActions.append(save, cancel);
      editWrap.append(field, editActions);
      card.append(drag, editWrap);
      item.append(order, card, remove);
      queueMicrotask(() => {
        field.focus();
        field.select();
      });
    } else {
      const text = document.createElement("div");
      text.className = "current-piece";
      text.textContent = piece;
      card.append(drag, text, edit);
      item.append(order, card, remove);
    }
    els.currentList.append(item);
  });
}

// ── Render: note (normal mode) ────────────────────────────────────────────────

function renderNoteNormal() {
  const valid = noteIsValid();
  els.editNote.disabled     = !valid;
  if (els.dockEditNote) els.dockEditNote.disabled = !valid;
  els.copyNote.disabled     = !valid;
  els.copyNoteLabel.textContent = "Copy Valid Note";
  els.editModeCue.hidden = true;
  els.editNote.textContent  = "Edit Final Note";
  if (els.dockEditNote) els.dockEditNote.textContent = "Edit note";
  els.noteOutput.classList.add("is-hidden");
  els.noteEditor.classList.remove("is-open");
  if (els.dockNoteEditor) els.dockNoteEditor.classList.remove("is-open");
  els.editNotice.classList.remove("is-open");

  if (!state.pieces.length) {
    setStatus("No note yet.");
  } else if (state.ending === "transfer" && !clean(els.transferTarget.value)) {
    setStatus("Add transfer destination.", "bad");
  } else {
    setStatus("Ready to copy.", "good");
  }
}

// ── Render: note (edit mode) ──────────────────────────────────────────────────

function renderNoteEdit() {
  const editedValid = editedNoteIsCopyable();
  els.editNote.disabled     = false;
  if (els.dockEditNote) els.dockEditNote.disabled = false;
  els.copyNote.disabled     = !editedValid;
  els.copyNoteLabel.textContent = "Copy Valid Note";
  els.editModeCue.hidden = false;
  els.editNote.textContent  = "Close Edit + Restore Generated";
  if (els.dockEditNote) els.dockEditNote.textContent = "Close edit";
  els.noteOutput.classList.add("is-hidden");
  els.noteEditor.classList.add("is-open");
  if (els.dockNoteEditor) els.dockNoteEditor.classList.add("is-open");
  els.editNotice.classList.add("is-open");
  setStatus(
    editedValid
      ? "Edited note active."
      : "Edited note needs start/ending.",
    editedValid ? "warn" : "bad"
  );
}

// ── Render: note (dispatcher) ─────────────────────────────────────────────────

function renderNote() {
  const generatedNote = composeNote();
  els.noteOutput.textContent = generatedNote;

  if (state.editingNote) {
    // Sync the editor if the user hasn't manually changed it
    if (cleanCopiedNote(els.noteEditor.value) === cleanCopiedNote(state.editBaseNote)) {
      els.noteEditor.value = generatedNote;
      if (els.dockNoteEditor && document.activeElement !== els.dockNoteEditor) {
        els.dockNoteEditor.value = generatedNote;
      }
      state.editBaseNote   = generatedNote;
    }
    renderNoteEdit();
    renderSectionSummaries();
    updateDockPreview();
    return;
  }

  renderNoteNormal();
  renderSectionSummaries();
  updateDockPreview();
}

// ── Render: ending controls ───────────────────────────────────────────────────

function renderEnding() {
  const transfer = state.ending === "transfer";
  els.endCall.setAttribute("aria-pressed",     String(!transfer));
  els.endTransfer.setAttribute("aria-pressed", String(transfer));
  els.endCall.textContent     = state.rules.callEnded;
  els.endTransfer.textContent = state.rules.transferPrefix;
  els.transferTarget.disabled = !transfer;
  if (!transfer) els.transferTarget.value = "";
  renderNote();
  if (transfer) els.transferTarget.focus();
}

// ── Render: rule inputs ───────────────────────────────────────────────────────

function renderRuleInputs() {
  els.ruleStart.value          = state.rules.start;
  els.ruleCallEnded.value      = state.rules.callEnded;
  els.ruleTransferPrefix.value = state.rules.transferPrefix;
}

// ── Render: theme ─────────────────────────────────────────────────────────────

function setTheme(theme) {
  const safe = safeTheme(theme);
  state.theme = safe;
  document.body.dataset.theme = safe;
  els.themeLight.setAttribute("aria-pressed", String(safe === "light"));
  els.themeBlackout.setAttribute("aria-pressed",  String(safe === "blackout"));
  queueDockClearanceSync();
}

function clampZoom(value) {
  return Math.min(limits.zoomMax, Math.max(limits.zoomMin, value));
}

function nextZoom(direction) {
  const target = clampZoom(state.zoom + (limits.zoomStep * direction));

  if (
    (direction > 0 && state.zoom < limits.zoomDefault && target > limits.zoomDefault) ||
    (direction < 0 && state.zoom > limits.zoomDefault && target < limits.zoomDefault)
  ) {
    return limits.zoomDefault;
  }

  return target;
}

function setZoom(value) {
  state.zoom = clampZoom(value);
  document.documentElement.style.setProperty("--app-zoom", state.zoom.toFixed(2));
  els.zoomLevel.textContent = `${Math.round(state.zoom * 100)}%`;
  els.zoomOut.disabled = state.zoom <= limits.zoomMin;
  els.zoomIn.disabled = state.zoom >= limits.zoomMax;
  queueDockClearanceSync();
}

function clampTemplateListHeight(value) {
  return Math.min(
    limits.templateListHeightMax,
    Math.max(limits.templateListHeightMin, value)
  );
}

function setTemplateListHeight(value) {
  state.templateListHeight = clampTemplateListHeight(value);
  els.templateList.style.setProperty("--template-list-height", `${state.templateListHeight}px`);
}

function clampNoteBlocksListHeight(value) {
  return Math.min(
    limits.noteBlocksListHeightMax,
    Math.max(limits.noteBlocksListHeightMin, value)
  );
}

function setNoteBlocksListHeight(value) {
  state.noteBlocksListHeight = clampNoteBlocksListHeight(value);
  els.pieceList.style.setProperty("--note-blocks-list-height", `${state.noteBlocksListHeight}px`);
}

function clampScratchpadHeight(value) {
  return Math.min(
    limits.scratchpadHeightMax,
    Math.max(limits.scratchpadHeightMin, value)
  );
}

function setScratchpadHeight(value) {
  state.scratchpadHeight = clampScratchpadHeight(value);
  if (els.scratchpad) {
    els.scratchpad.style.setProperty("--scratchpad-height", `${state.scratchpadHeight}px`);
  }
}

function clampDockPreviewHeight(value) {
  return Math.min(
    limits.dockPreviewHeightMax,
    Math.max(limits.dockPreviewHeightMin, value)
  );
}

function setDockPreviewHeight(value) {
  state.dockPreviewHeight = clampDockPreviewHeight(value);
  if (els.dockPreview) {
    els.dockPreview.style.setProperty("--dock-preview-height", `${state.dockPreviewHeight}px`);
  }
  if (els.dockNoteEditor) {
    els.dockNoteEditor.style.setProperty("--dock-preview-height", `${state.dockPreviewHeight}px`);
  }
  queueDockClearanceSync();
}

function attachVerticalResize(handle, options) {
  if (!handle) return;
  handle.addEventListener("pointerdown", event => {
    event.preventDefault();
    state[options.flag] = true;
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener("pointermove", event => {
    if (!state[options.flag]) return;
    const rect = options.target().getBoundingClientRect();
    options.set(event.clientY - rect.top);
  });
  handle.addEventListener("pointerup", event => {
    state[options.flag] = false;
    handle.releasePointerCapture(event.pointerId);
    setStatus(options.adjusted);
  });
  handle.addEventListener("pointercancel", event => {
    state[options.flag] = false;
    if (handle.hasPointerCapture(event.pointerId)) {
      handle.releasePointerCapture(event.pointerId);
    }
  });
  handle.addEventListener("keydown", event => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      options.set(options.get() + options.step);
      setStatus(options.adjusted);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      options.set(options.get() - options.step);
      setStatus(options.adjusted);
    } else if (event.key === "Home") {
      event.preventDefault();
      options.set(options.min);
      setStatus(options.minimized);
    } else if (event.key === "End") {
      event.preventDefault();
      options.set(options.max);
      setStatus(options.expanded);
    }
  });
}

// ── Render: full page ─────────────────────────────────────────────────────────

function renderAll() {
  setTheme(state.theme);
  setZoom(state.zoom);
  setTemplateListHeight(state.templateListHeight);
  setNoteBlocksListHeight(state.noteBlocksListHeight);
  setScratchpadHeight(state.scratchpadHeight);
  setDockPreviewHeight(state.dockPreviewHeight);
  renderRuleInputs();
  renderTemplateSort();
  renderTemplates();
  renderQuickForms();
  renderSavedReference();
  renderQuickSort();
  renderQuickPieces();
  renderCurrentPieces();
  renderEnding();
  setSetupCollapsed(true);
  setRulesCollapsed(true);
  setTemplatesCollapsed(false);
  setQuickFormsCollapsed(false);
  setQuickFormSetupCollapsed(true);
  setTemplateToolsCollapsed(true);
  setNoteBlockSetupCollapsed(true);
  setBuildCollapsed(false);
  setFinishCollapsed(false);
  setScratchpadCollapsed(true);
  updateTemplateFilterClear();
  queueDockClearanceSync();
}

// ── Note editor ───────────────────────────────────────────────────────────────

function openNoteEditor(source = "finish", options = {}) {
  state.editingNote  = true;
  state.editBaseNote = composeNote();
  const cursor = options.caretBeforeEnding
    ? noteCursorBeforeEnding(state.editBaseNote)
    : state.editBaseNote.length;
  els.noteEditor.value = state.editBaseNote;
  if (els.dockNoteEditor) els.dockNoteEditor.value = state.editBaseNote;
  if (source === "dock") setDockPreviewHeight(limits.dockPreviewHeightMax);
  renderNote();
  const target = source === "dock" && els.dockNoteEditor ? els.dockNoteEditor : els.noteEditor;
  target.focus();
  target.setSelectionRange(cursor, cursor);
}

function closeNoteEditor(focusTarget = els.editNote) {
  state.editingNote  = false;
  state.editBaseNote = "";
  els.noteEditor.value = "";
  if (els.dockNoteEditor) els.dockNoteEditor.value = "";
  renderNote();
  if (focusTarget && typeof focusTarget.focus === "function") focusTarget.focus();
}

function toggleNoteEditor(source = "finish") {
  if (state.editingNote) closeNoteEditor(source === "dock" ? els.dockEditNote : els.editNote);
  else openNoteEditor(source);
}

// ── Rules ────────────────────────────────────────────────────────────────────

function reparseLoadedTemplates(previousCount) {
  const metadata = new Map(state.templates.map(template => [
    clean(template.source).toLowerCase(),
    {
      pinned: Boolean(template.pinned),
      customName: template.customName || ""
    }
  ]));
  const reparsed = state.templates
    .map(t => {
      const parsed = parseTemplate(t.source);
      if (!parsed) return null;
      const saved = metadata.get(clean(parsed.source).toLowerCase());
      parsed.pinned = Boolean(saved && saved.pinned);
      parsed.customName = saved ? saved.customName : "";
      return parsed;
    })
    .filter(Boolean);
  state.templates = reparsed.slice(0, limits.templates);
  return Math.max(0, previousCount - state.templates.length);
}

function applyRules() {
  const next = {
    start:          cleanRule(els.ruleStart.value),
    callEnded:      cleanRule(els.ruleCallEnded.value),
    transferPrefix: cleanRule(els.ruleTransferPrefix.value)
  };

  if (!next.start || !next.callEnded || !next.transferPrefix) {
    renderRuleInputs();
    setStatus("Start, ended, and transfer phrases are required", "bad");
    return;
  }

  state.rules = next;
  const dropped = reparseLoadedTemplates(state.templates.length);
  if (state.editingNote) closeNoteEditor();
  renderRuleInputs();
  renderTemplates();
  renderQuickPieces();
  renderEnding();
  setStatus(
    dropped
      ? `Rules applied. ${dropped} loaded template(s) no longer matched.`
      : "Session rules applied",
    dropped ? "warn" : "good"
  );
}

function resetRules() {
  state.rules = { ...defaultRules };
  renderRuleInputs();
  applyRules();
}

// ── Load templates ────────────────────────────────────────────────────────────

function loadTemplatesFromInput() {
  if (isSetupString(els.templateInput.value)) {
    loadSetupString(els.templateInput.value);
    return;
  }

  const rawLines = els.templateInput.value.split(/\r?\n/);
  const available = Math.max(0, limits.templates - state.templates.length);
  const validTemplates = rawLines.map(parseTemplate).filter(Boolean);
  const parsed = validTemplates.slice(0, available);

  if (!parsed.length) {
    setStatus(
      available ? "Paste a setup string or at least one valid full template." : `Template limit reached (${limits.templates})`,
      "bad"
    );
    return;
  }

  const existing = new Set(state.templates.map(t => t.source.toLowerCase()));
  const additions = parsed.filter(t => {
    const key = t.source.toLowerCase();
    if (existing.has(key)) return false;
    existing.add(key);
    return true;
  });

  additions.forEach(template => {
    template.pinned = false;
    template.customName = "";
  });
  state.templates.unshift(...additions);
  const addedKeys = additions.map(templateKey);
  state.recentTemplateKeys = [
    ...addedKeys,
    ...state.recentTemplateKeys.filter(key => !addedKeys.includes(key))
  ];
  if (state.templateSort === "custom") {
    state.customTemplateOrder = [
      ...addedKeys,
      ...state.customTemplateOrder.filter(key => !addedKeys.includes(key))
    ];
    syncCustomTemplateOrder();
  }
  els.templateInput.value = "";
  renderTemplates();
  renderQuickPieces();
  setTemplatesCollapsed(false);
  if (additions.length) setSetupCollapsed(true);

  const skipped = Math.max(0, validTemplates.length - available);
  setStatus(
    skipped
      ? `${additions.length} Full Template${additions.length === 1 ? "" : "s"} loaded; ${skipped} over the session limit skipped`
      : `${additions.length} Full Template${additions.length === 1 ? "" : "s"} loaded`,
    additions.length ? "good" : "warn"
  );
}

// ── Template actions ──────────────────────────────────────────────────────────

function useTemplate(template, options = {}) {
  if (state.editingNote && !options.editInDock) closeNoteEditor(null);
  clearMovedCurrentPiece();
  state.editingPieceIndex = -1;
  state.pieces = template.body.slice(0, limits.currentPieces);
  state.ending = template.ending.type;
  els.transferTarget.value = template.ending.target;
  renderCurrentPieces();
  renderEnding();
  if (options.editInDock) {
    openNoteEditor("dock", { caretBeforeEnding: true });
  }
}

function templateCopyText(template) {
  const parts = [state.rules.start, ...template.body];
  if (template.ending.type === "transfer") {
    parts.push(`${state.rules.transferPrefix} ${clean(template.ending.target)}`);
  } else {
    parts.push(state.rules.callEnded);
  }
  return cleanCopiedNote(parts.join("// "));
}

async function copyTemplateAsIs(template) {
  if (template.ending.type === "transfer" && !clean(template.ending.target)) {
    useTemplate(template);
    if (els.transferTarget && typeof els.transferTarget.focus === "function") {
      els.transferTarget.focus();
    }
    setStatus("Add transfer destination.", "bad");
    return;
  }

  try {
    await writeClipboard(templateCopyText(template));
    setStatus("Copied as is.", "warn");
  } catch (error) {
    setStatus(error.message || "Clipboard copy was blocked", "bad");
  }
}

function toggleTemplatePin(template) {
  template.pinned = !template.pinned;
  renderTemplates();
  setStatus(template.pinned ? "Full template pinned." : "Full template unpinned.");
  focusFirst(".template-pin[aria-pressed='true'], .template-pin", els.templateFilter);
}

function beginTemplateTitleEdit(template) {
  state.editingTemplateKey = templateKey(template);
  renderTemplates();
  setStatus("Editing Full template display title.");
}

function saveTemplateTitle(template, value) {
  const title = clean(value).slice(0, 80);
  template.customName = title;
  state.editingTemplateKey = "";
  renderTemplates();
  setStatus(title ? "Full template title updated." : "Full template title reset.");
  focusFirst(".template-title-button", els.templateFilter);
}

function removeTemplate(template) {
  const index = state.templates.indexOf(template);
  if (index < 0) return;
  state.templates.splice(index, 1);
  state.recentTemplateKeys = state.recentTemplateKeys.filter(key => key !== templateKey(template));
  state.customTemplateOrder = state.customTemplateOrder.filter(key => key !== templateKey(template));
  if (state.editingTemplateKey === templateKey(template)) state.editingTemplateKey = "";
  renderTemplates();
  renderQuickPieces();
  setStatus("Full template removed for this session.", "warn");
  focusFirst(".template-remove, .template-item button", els.templateInput);
}

function moveTemplate(template, direction) {
  const visible = visibleTemplates();
  const index = visible.indexOf(template);
  const nextIndex = index + direction;
  const next = visible[nextIndex];
  if (index < 0 || !next) return;
  if (Boolean(template.pinned) !== Boolean(next.pinned)) {
    setStatus("Pinned templates stay above unpinned templates.", "warn");
    return;
  }
  if (state.templateSort !== "custom") {
    syncCustomTemplateOrder(sortedTemplates({ includeFilter: false }));
    state.templateSort = "custom";
  } else {
    syncCustomTemplateOrder();
  }
  const key = templateKey(template);
  const nextKey = templateKey(next);
  const orderIndex = state.customTemplateOrder.indexOf(key);
  const orderNextIndex = state.customTemplateOrder.indexOf(nextKey);
  if (orderIndex < 0 || orderNextIndex < 0) return;
  const [movedKey] = state.customTemplateOrder.splice(orderIndex, 1);
  state.customTemplateOrder.splice(orderNextIndex, 0, movedKey);
  state.highlightedTemplateKey = key;
  renderTemplateSort();
  renderTemplates();
  markMovedItem("template", key);
  setStatus("Full template moved.");

  const movedItem = [...document.querySelectorAll(".template-item")]
    .find(item => item.classList.contains("is-moved"));
  if (movedItem && typeof movedItem.scrollIntoView === "function") {
    movedItem.scrollIntoView({ block: "nearest" });
  }
  const target = movedItem && movedItem.querySelector(
    direction < 0 ? ".template-order-button" : ".template-order-button + .template-order-button"
  );
  if (target && typeof target.focus === "function") target.focus();
}

async function copyFullSetup() {
  const text = sortedTemplates({ includeFilter: false }).map(template => template.source).join("\n");
  if (!text) {
    setStatus("Load Full templates before copying them.", "bad");
    return;
  }
  try {
    await writeClipboard(text);
    setStatus("Full templates copied.", "warn");
  } catch (error) {
    setStatus(error.message || "Clipboard copy was blocked", "bad");
  }
}

function saveBuiltTemplate() {
  if (state.editingNote) {
    if (!editedNoteIsCopyable()) {
      setStatus("Edited note needs start/ending before saving as a template.", "bad");
      focusFirst("#dockNoteEditor, #noteEditor", els.customDetail);
      return;
    }
  } else if (!state.pieces.length) {
    setStatus("Add call details before saving a template.", "bad");
    els.customDetail.focus();
    return;
  } else if (state.ending === "transfer" && !clean(els.transferTarget.value)) {
    setStatus("Add transfer destination before saving a template.", "bad");
    els.transferTarget.focus();
    return;
  }
  if (state.templates.length >= limits.templates) {
    setStatus(`Full Template limit reached (${limits.templates}).`, "bad");
    return;
  }

  const source = state.editingNote ? cleanCopiedNote(els.noteEditor.value) : cleanCopiedNote(composeNote());
  if (source.length > limits.templateLine) {
    setStatus(`Template limit is ${limits.templateLine} characters.`, "bad");
    return;
  }

  const template = parseTemplate(source);
  if (!template) {
    setStatus("Current note could not be saved as a template.", "bad");
    return;
  }

  const key = templateKey(template);
  if (state.templates.some(existing => templateKey(existing) === key)) {
    setTemplatesCollapsed(false);
    state.templateFilter = "";
    els.templateFilter.value = "";
    updateTemplateFilterClear();
    renderTemplateSort();
    renderTemplates();
    setStatus("That built note is already a Full Template.", "warn");
    focusFirst(".template-copy-as-is, .template-title-button", els.templateFilter);
    return;
  }

  template.pinned = false;
  template.customName = "";
  state.templates.unshift(template);
  state.recentTemplateKeys = [
    key,
    ...state.recentTemplateKeys.filter(candidate => candidate !== key)
  ];
  if (state.templateSort === "custom") {
    state.customTemplateOrder = [
      key,
      ...state.customTemplateOrder.filter(candidate => candidate !== key)
    ];
    syncCustomTemplateOrder();
  }

  state.templateFilter = "";
  state.templatePinnedOnly = false;
  els.templateFilter.value = "";
  state.highlightedTemplateKey = key;
  updateTemplateFilterClear();
  renderTemplateSort();
  renderTemplates();
  renderQuickPieces();
  setTemplatesCollapsed(false);
  markMovedItem("template", key);
  setStatus(state.editingNote ? "Saved edited note as a Full Template." : "Saved built note as a Full Template.", "good");
  focusFirst(".template-item.is-moved .template-copy-as-is, .template-copy-as-is", els.saveBuiltTemplate);
}

// ── Custom detail ─────────────────────────────────────────────────────────────

function addCustomDetail() {
  const rawDetail = els.customDetail.value;
  const pastedTemplate = rawDetail.includes("//") ? parseTemplate(rawDetail) : null;
  if (pastedTemplate) {
    useTemplate(pastedTemplate);
    els.customDetail.value = "";
    setStatus("Full template loaded into current note.", "good");
    focusFirst(".current-control .current-piece, #customDetail", els.customDetail);
    return;
  }

  const detail = cleanPiece(rawDetail);
  if (!detail) return;
  if (state.pieces.length >= limits.currentPieces) {
    setStatus(`Current note is limited to ${limits.currentPieces} pieces`, "bad");
    return;
  }
  clearMovedCurrentPiece();
  state.editingPieceIndex = -1;
  state.pieces.push(detail);
  els.customDetail.value = "";
  renderCurrentPieces();
  renderNote();
  els.customDetail.focus();
}

function removeCurrentPiece(index) {
  clearMovedCurrentPiece();
  if (state.editingPieceIndex === index) state.editingPieceIndex = -1;
  else if (state.editingPieceIndex > index) state.editingPieceIndex -= 1;
  state.pieces.splice(index, 1);
  renderCurrentPieces();
  renderNote();
  setStatus("Removed from current note.");
  focusFirst(".current-remove, .current-edit, .current-move:not(:disabled)", els.customDetail);
}

function moveCurrentPiece(index, direction) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= state.pieces.length) return;
  if (!reorderCurrentPiece(index, nextIndex)) return;
  renderCurrentPieces();
  renderNote();
  setStatus("Current piece moved.");

  const moved = document.querySelectorAll(".current-control")[nextIndex];
  const target = moved && moved.querySelector(
    direction < 0 ? ".current-move" : ".current-move + .current-move"
  );
  if (target && typeof target.focus === "function") target.focus();
}

function editCurrentPiece(index) {
  if (index < 0 || index >= state.pieces.length) return;
  state.editingPieceIndex = index;
  renderCurrentPieces();
  setStatus("Editing one note piece.");
}

function saveCurrentPieceEdit(index, value) {
  if (index < 0 || index >= state.pieces.length) return;
  const next = cleanPiece(value);
  if (!next) {
    setStatus("A note piece cannot be blank.", "bad");
    return;
  }
  state.pieces[index] = next;
  state.editingPieceIndex = -1;
  renderCurrentPieces();
  renderNote();
  setStatus("Note piece updated.");
  const item = document.querySelectorAll(".current-control")[index];
  const target = item && item.querySelector(".current-edit");
  if (target && typeof target.focus === "function") target.focus();
}

function cancelCurrentPieceEdit() {
  const index = state.editingPieceIndex;
  state.editingPieceIndex = -1;
  renderCurrentPieces();
  setStatus("Piece edit canceled.");
  const item = document.querySelectorAll(".current-control")[index];
  const target = item && item.querySelector(".current-edit");
  if (target && typeof target.focus === "function") target.focus();
}

function moveQuickPiece(piece, direction) {
  state.quickSort = "custom";
  syncCustomQuickOrder();
  const key = pieceKey(piece);
  const index = state.customQuickPieceOrder.indexOf(key);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= state.customQuickPieceOrder.length) return;
  const [moved] = state.customQuickPieceOrder.splice(index, 1);
  state.customQuickPieceOrder.splice(nextIndex, 0, moved);
  state.highlightedQuickPieceKey = key;
  renderQuickSort();
  renderQuickPieces();
  markMovedItem("quick", key);
  setStatus("Reusable phrase order adjusted.");
  const movedControl = [...document.querySelectorAll(".piece-control")]
    .find(control => pieceKey(control.querySelector(".piece-button")?.textContent || "") === key);
  if (movedControl && typeof movedControl.scrollIntoView === "function") {
    movedControl.scrollIntoView({ block: "nearest" });
  }
  const target = movedControl && movedControl.querySelector(
    direction < 0 ? ".piece-order-button" : ".piece-order-button + .piece-order-button"
  );
  if (target && typeof target.focus === "function") target.focus();
}

async function copyQuickSetup() {
  const pieces = sortedQuickPieces();
  if (!pieces.length) {
    setStatus("Add reusable phrases before copying them.", "bad");
    return;
  }
  try {
    await writeClipboard(pieces.join("// "));
    setStatus("Reusable phrases copied.", "warn");
  } catch (error) {
    setStatus(error.message || "Clipboard copy was blocked", "bad");
  }
}

// ── Quick piece management ────────────────────────────────────────────────────

function addQuickPiece() {
  const piece = cleanPiece(els.newQuickPiece.value);
  const key   = pieceKey(piece);
  if (!key) return;

  // Restore if it's a hidden piece
  const allPieces = uniquePieces({ includeHidden: true });
  const existingHidden = allPieces.find(c => pieceKey(c) === key);
  if (existingHidden && hiddenQuickPieceSet().has(key)) {
    state.hiddenQuickPieceKeys = state.hiddenQuickPieceKeys.filter(k => k !== key);
    promoteRecentQuickPiece(key);
    els.newQuickPiece.value = "";
    renderQuickPieces();
    queueReusablePhrasesReveal();
    setStatus(`Reusable phrase restored: ${existingHidden}`, "good");
    els.newQuickPiece.focus();
    return;
  }

  // Reject if already visible
  const existing = uniquePieces().find(c => pieceKey(c) === key);
  if (existing) {
    els.newQuickPiece.value = "";
    setStatus(`Reusable phrase already exists: ${existing}`, "warn");
    els.newQuickPiece.focus();
    return;
  }

  if (uniquePieces().length >= limits.quickPieces) {
    setStatus(`Reusable phrase limit reached (${limits.quickPieces})`, "bad");
    return;
  }

  state.customQuickPieces.push(piece);
  promoteRecentQuickPiece(key);
  els.newQuickPiece.value = "";
  renderQuickPieces();
  queueReusablePhrasesReveal();
  setStatus(`Reusable phrase added: ${piece}`, "good");
  els.newQuickPiece.focus();
}

function hideQuickPiece(piece) {
  const key = pieceKey(piece);
  if (!key) return;
  if (!hiddenQuickPieceSet().has(key)) state.hiddenQuickPieceKeys.push(key);
  if (state.editingQuickPieceKey === key) state.editingQuickPieceKey = "";
  renderQuickPieces();
  queueReusablePhrasesReveal();
  setStatus("Reusable phrase hidden for this session.", "warn");
  focusFirst(".piece-remove, .piece-button", els.newQuickPiece);
}

function editQuickPiece(piece) {
  const key = pieceKey(piece);
  if (!key) return;
  state.editingQuickPieceKey = key;
  renderQuickPieces();
  queueReusablePhrasesReveal();
  setStatus("Editing reusable phrase.");
}

function cancelQuickPieceEdit(piece) {
  const key = pieceKey(piece);
  state.editingQuickPieceKey = "";
  renderQuickPieces();
  queueReusablePhrasesReveal();
  setStatus("Reusable phrase edit canceled.");
  const item = [...document.querySelectorAll(".piece-control")]
    .find(control => pieceKey(control.querySelector(".piece-button")?.textContent || piece) === key);
  const target = item && item.querySelector(".piece-edit");
  if (target && typeof target.focus === "function") target.focus();
}

function saveQuickPieceEdit(oldPiece, value) {
  const oldKey = pieceKey(oldPiece);
  const nextPiece = cleanPiece(value);
  const nextKey = pieceKey(nextPiece);
  if (!nextKey) {
    setStatus("Reusable phrase needs text.", "bad");
    return;
  }
  if (nextKey !== oldKey && uniquePieces().some(piece => pieceKey(piece) === nextKey)) {
    setStatus("Reusable phrase already exists.", "warn");
    return;
  }

  if (oldKey && !hiddenQuickPieceSet().has(oldKey)) {
    state.hiddenQuickPieceKeys.push(oldKey);
  }
  state.customQuickPieces = state.customQuickPieces.filter(piece => pieceKey(piece) !== oldKey && pieceKey(piece) !== nextKey);
  state.customQuickPieces.push(nextPiece);
  state.recentQuickPieceKeys = state.recentQuickPieceKeys.filter(key => key !== oldKey && key !== nextKey);
  state.customQuickPieceOrder = state.customQuickPieceOrder.filter(key => key !== oldKey && key !== nextKey);
  promoteRecentQuickPiece(nextKey);
  state.editingQuickPieceKey = "";
  renderQuickSort();
  renderQuickPieces();
  queueReusablePhrasesReveal();
  setStatus("Reusable phrase edited.", "good");
  const item = [...document.querySelectorAll(".piece-control")]
    .find(control => pieceKey(control.querySelector(".piece-button")?.textContent || "") === nextKey);
  const target = item && item.querySelector(".piece-button");
  if (target && typeof target.focus === "function") target.focus();
}

// ── Call / session management ─────────────────────────────────────────────────

function resetCall() {
  clearMovedCurrentPiece();
  state.editingNote  = false;
  state.editBaseNote = "";
  state.pieces       = [];
  state.editingPieceIndex = -1;
  state.ending       = "call-ended";
  clearActiveQuickForm({ render: false, status: false });
  els.noteEditor.value   = "";
  els.customDetail.value = "";
  els.transferTarget.value = "";
  if (els.quickFormEditor) els.quickFormEditor.value = "";
  renderCurrentPieces();
  renderQuickFormDock();
  renderQuickForms();
  renderEnding();
}

function setSetupCollapsed(collapsed) {
  els.setupPanel.classList.toggle("is-collapsed", collapsed);
  els.toggleSetup.setAttribute("aria-expanded", String(!collapsed));
  els.toggleSetup.textContent = collapsed ? "Open Setup" : "Minimize";
  renderSectionSummaries();
}

function setTemplatesCollapsed(collapsed) {
  els.fullTemplatePanel.classList.toggle("is-collapsed", collapsed);
  els.toggleTemplates.setAttribute("aria-expanded", String(!collapsed));
  els.toggleTemplates.textContent = collapsed ? "Open" : "Minimize";
  renderSectionSummaries();
}

function setQuickFormsCollapsed(collapsed) {
  els.quickFormsPanel.classList.toggle("is-collapsed", collapsed);
  els.toggleQuickForms.setAttribute("aria-expanded", String(!collapsed));
  els.toggleQuickForms.textContent = collapsed ? "Open" : "Minimize";
  renderSectionSummaries();
}

function setBuildCollapsed(collapsed) {
  els.buildPanel.classList.toggle("is-collapsed", collapsed);
  els.toggleBuild.setAttribute("aria-expanded", String(!collapsed));
  els.toggleBuild.textContent = collapsed ? "Open" : "Minimize";
  renderSectionSummaries();
}

function setFinishCollapsed(collapsed) {
  if (!els.finishPanel || !els.toggleFinish) return;
  els.finishPanel.classList.toggle("is-collapsed", collapsed);
  els.toggleFinish.setAttribute("aria-expanded", String(!collapsed));
  els.toggleFinish.textContent = collapsed ? "Open" : "Minimize";
  renderSectionSummaries();
}

function setRulesCollapsed(collapsed) {
  els.rulesPanel.classList.toggle("is-collapsed", collapsed);
  els.toggleRules.setAttribute("aria-expanded", String(!collapsed));
  els.toggleRules.textContent = collapsed ? "Open" : "Minimize";
}

function setQuickFormSetupCollapsed(collapsed) {
  if (!els.quickFormSetup || !els.toggleQuickFormSetup) return;
  els.quickFormSetup.classList.toggle("is-collapsed", collapsed);
  els.toggleQuickFormSetup.setAttribute("aria-expanded", String(!collapsed));
  els.toggleQuickFormSetup.textContent = collapsed ? "Add form" : "Hide";
}

function setNoteBlockSetupCollapsed(collapsed) {
  if (!els.noteBlockSetup || !els.toggleNoteBlockSetup) return;
  els.noteBlockSetup.classList.toggle("is-collapsed", collapsed);
  els.toggleNoteBlockSetup.setAttribute("aria-expanded", String(!collapsed));
  els.toggleNoteBlockSetup.textContent = collapsed ? "Add phrase" : "Hide";
}

function setTemplateToolsCollapsed(collapsed) {
  if (!els.templateTools || !els.toggleTemplateTools) return;
  els.templateTools.classList.toggle("is-collapsed", collapsed);
  els.toggleTemplateTools.setAttribute("aria-expanded", String(!collapsed));
  els.toggleTemplateTools.textContent = collapsed ? "Tools" : "Hide";
}

function setNoteBlockLibraryCollapsed(collapsed) {
  if (!els.noteBlockLibrary || !els.toggleNoteBlockLibrary) return;
  els.noteBlockLibrary.classList.toggle("is-collapsed", collapsed);
  els.toggleNoteBlockLibrary.setAttribute("aria-expanded", String(!collapsed));
  els.toggleNoteBlockLibrary.textContent = collapsed ? "Show phrases" : "Hide phrases";
  if (!collapsed) queueReusablePhrasesReveal();
}

function updateTemplateFilterClear() {
  if (!els.templateFilterClear) return;
  els.templateFilterClear.hidden = !els.templateFilter.value;
}

function clearTemplateFilter() {
  els.templateFilter.value = "";
  state.templateFilter = "";
  updateTemplateFilterClear();
  renderTemplates();
  els.templateFilter.focus();
}

function hasSessionData() {
  return Boolean(
    state.templates.length
    || state.customQuickPieces.length
    || state.hiddenQuickPieceKeys.length
    || state.customQuickPieceOrder.length
    || state.recentQuickPieceKeys.length
    || state.quickForms.length
    || state.activeQuickFormKey
    || state.activeQuickFormContent
    || state.savedReferenceText
    || state.editingSavedReference
    || state.customTemplateOrder.length
    || state.recentTemplateKeys.length
    || state.quickSort !== "workflow"
    || state.templateSort !== "workflow"
    || state.noteBlocksListHeight !== limits.noteBlocksListHeightDefault
    || state.scratchpadHeight !== limits.scratchpadHeightDefault
    || state.templateFilter
    || state.templatePinnedOnly
    || state.pieces.length
    || state.editingNote
    || !phraseEquals(state.rules.start,          defaultRules.start)
    || !phraseEquals(state.rules.callEnded,       defaultRules.callEnded)
    || !phraseEquals(state.rules.transferPrefix,  defaultRules.transferPrefix)
    || !phraseEquals(els.ruleStart.value,         state.rules.start)
    || !phraseEquals(els.ruleCallEnded.value,     state.rules.callEnded)
    || !phraseEquals(els.ruleTransferPrefix.value, state.rules.transferPrefix)
    || els.templateInput.value
    || els.templateFilter.value
    || els.quickFilter.value
    || els.newQuickPiece.value
    || els.quickFormTitle.value
    || els.quickFormBody.value
    || (els.savedReferenceEditor && els.savedReferenceEditor.value)
    || (els.quickFormEditor && els.quickFormEditor.value)
    || els.customDetail.value
    || els.transferTarget.value
    || (els.scratchpad && els.scratchpad.value)
  );
}

async function clearEntireSession() {
  if (!state.clearSessionArmed) {
    state.clearSessionArmed = true;
    els.clearSession.querySelector(".wide-label").textContent    = "Click Again to Clear";
    els.clearSession.querySelector(".compact-label").textContent = "Confirm";
    setStatus("Clear is armed for 3 seconds", "bad");
    window.setTimeout(() => {
      state.clearSessionArmed = false;
      els.clearSession.querySelector(".wide-label").textContent    = "Clear Entire Session";
      els.clearSession.querySelector(".compact-label").textContent = "Clear";
    }, 3000);
    return;
  }

  state.clearSessionArmed = false;
  els.clearSession.querySelector(".wide-label").textContent    = "Clear Entire Session";
  els.clearSession.querySelector(".compact-label").textContent = "Clear";

  state.templates            = [];
  state.customQuickPieces    = [];
  state.hiddenQuickPieceKeys = [];
  state.customQuickPieceOrder = [];
  state.recentQuickPieceKeys = [];
  state.quickForms = [];
  state.savedReferenceText = "";
  state.editingSavedReference = false;
  clearActiveQuickForm({ render: false, status: false });
  state.customTemplateOrder = [];
  state.recentTemplateKeys = [];
  state.highlightedQuickPieceKey = "";
  state.highlightedTemplateKey = "";
  state.editingQuickPieceKey = "";
  state.quickSort            = "workflow";
  state.templateSort         = "workflow";
  state.templatePinnedOnly   = false;
  state.editingTemplateKey   = "";
  state.rules                = { ...defaultRules };
  resetCall();
  els.templateInput.value  = "";
  els.newQuickPiece.value  = "";
  els.quickFormTitle.value = "";
  els.quickFormBody.value = "";
  if (els.savedReferenceEditor) els.savedReferenceEditor.value = "";
  state.quickFilter = "";
  state.templateFilter = "";
  state.templatePinnedOnly = false;
  els.quickFilter.value = "";
  els.templateFilter.value = "";
  setTemplateListHeight(limits.templateListHeightDefault);
  setNoteBlocksListHeight(limits.noteBlocksListHeightDefault);
  setScratchpadHeight(limits.scratchpadHeightDefault);
  setDockPreviewHeight(limits.dockPreviewHeightDefault);
  setScratchpadSnapped(false);
  if (els.scratchpad) els.scratchpad.value = "";
  renderRuleInputs();
  renderTemplateSort();
  renderTemplates();
  renderQuickForms();
  renderSavedReference();
  renderQuickFormDock();
  renderQuickSort();
  renderQuickPieces();
  setSetupCollapsed(true);
  setRulesCollapsed(true);
  setTemplatesCollapsed(false);
  setQuickFormsCollapsed(false);
  setQuickFormSetupCollapsed(true);
  setBuildCollapsed(false);
  setFinishCollapsed(false);
  setTemplateToolsCollapsed(true);
  setNoteBlockLibraryCollapsed(true);
  setNoteBlockSetupCollapsed(true);
  updateTemplateFilterClear();

  try {
    await writeClipboard("");
    setStatus("Entire session and clipboard cleared.");
  } catch {
    setStatus("Session cleared. Browser blocked clipboard clear.", "warn");
  }
}

// ── Scratchpad ────────────────────────────────────────────────────────────────

function setScratchpadCollapsed(collapsed) {
  if (!els.scratchpadPanel) return;
  if (!collapsed) setScratchpadSnapped(false, { focus: false });
  els.scratchpadPanel.classList.toggle("is-collapsed", collapsed);
  els.toggleScratchpad.setAttribute("aria-expanded", String(!collapsed));
  els.toggleScratchpad.textContent = collapsed ? "Open" : "Minimize";
  updateScratchpadSummary();
  renderSectionSummaries();
}

function setScratchpadSnapped(snapped, options = {}) {
  if (!els.scratchpadWorkSurface || !els.scratchpadHome || !els.scratchpadSnap || !els.scratchpadSnapMount) return;
  state.scratchpadSnapped = Boolean(snapped);

  if (state.scratchpadSnapped) {
    els.scratchpadSnap.hidden = false;
    els.scratchpadSnapMount.append(els.scratchpadWorkSurface);
    els.scratchpadPanel.classList.add("is-collapsed");
    els.toggleScratchpad.setAttribute("aria-expanded", "false");
    els.toggleScratchpad.textContent = "Open";
  } else {
    els.scratchpadHome.after(els.scratchpadWorkSurface);
    els.scratchpadSnap.hidden = true;
  }

  if (els.snapScratchpad) {
    els.snapScratchpad.setAttribute("aria-pressed", String(state.scratchpadSnapped));
    els.snapScratchpad.textContent = state.scratchpadSnapped ? "Scratchpad open" : "Scratchpad";
  }
  updateScratchpadSummary();
  if (options.focus && els.scratchpad && typeof els.scratchpad.focus === "function") {
    els.scratchpad.focus();
  }
}

function updateScratchpadSummary() {
  if (!els.scratchpadSummary || !els.scratchpad) return;
  const hasText = Boolean(clean(els.scratchpad.value));
  const collapsed = els.scratchpadPanel.classList.contains("is-collapsed");
  els.scratchpadPanel.classList.toggle("has-scratchpad-text", hasText);
  els.scratchpadSummary.textContent = state.scratchpadSnapped
    ? "Scratchpad is snapped to Build As You Go. Not copied."
    : hasText && collapsed
      ? "Scratchpad has text. Not copied."
      : "Temporary notes. Not copied.";
}

function renderSavedReference() {
  if (!els.savedReferenceView || !els.savedReferenceEditorWrap || !els.savedReferenceEditor) return;
  const text = state.savedReferenceText;
  els.savedReferenceView.textContent = text || "No saved reference text.";
  els.savedReferenceView.classList.toggle("is-empty", !text);
  els.savedReferenceEditor.value = state.editingSavedReference ? text : "";
  els.savedReferenceEditorWrap.hidden = !state.editingSavedReference;
  els.savedReferenceView.hidden = state.editingSavedReference;
  if (els.copySavedReference) els.copySavedReference.disabled = !text || state.editingSavedReference;
  if (els.editSavedReference) {
    els.editSavedReference.disabled = state.editingSavedReference;
    els.editSavedReference.textContent = text ? "Edit" : "Add";
  }
}

function openSavedReferenceEditor() {
  state.editingSavedReference = true;
  renderSavedReference();
  if (els.savedReferenceEditor) {
    els.savedReferenceEditor.focus();
    els.savedReferenceEditor.setSelectionRange(els.savedReferenceEditor.value.length, els.savedReferenceEditor.value.length);
  }
}

function closeSavedReferenceEditor() {
  state.editingSavedReference = false;
  renderSavedReference();
  if (els.editSavedReference) els.editSavedReference.focus();
}

function saveSavedReference() {
  state.savedReferenceText = cleanSavedReference(els.savedReferenceEditor.value);
  state.editingSavedReference = false;
  renderSavedReference();
  setStatus(state.savedReferenceText ? "Saved reference text for setup." : "Saved reference cleared.", state.savedReferenceText ? "good" : "warn");
}

async function copySavedReference() {
  if (!state.savedReferenceText) {
    setStatus("Add saved reference text before copying.", "bad");
    return;
  }

  try {
    await writeClipboard(state.savedReferenceText);
    setStatus("Saved reference copied.", "warn");
  } catch (error) {
    setStatus(error.message || "Clipboard copy was blocked", "bad");
  }
}

// ── Clipboard ────────────────────────────────────────────────────────────────

async function writeClipboard(text) {
  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    throw new Error("Clipboard permission is unavailable in this browser.");
  }
  await navigator.clipboard.writeText(text);
}

function flashCopied() {
  window.clearTimeout(state.copyFlashTimer);
  els.copyNote.classList.add("is-copied");
  state.copyFlashTimer = window.setTimeout(() => {
    els.copyNote.classList.remove("is-copied");
  }, 1200);
}

async function copyNote() {
  const text = currentCopyText();
  if (state.editingNote ? !editedNoteIsCopyable() : !noteIsValid()) return;
  try {
    await writeClipboard(text);
    flashCopied();
    setStatus("Copied.", "warn");
  } catch (error) {
    setStatus(error.message || "Clipboard copy was blocked", "bad");
  }
}

async function newCallAndClearClipboard() {
  const hadTemplateFilter = Boolean(state.templateFilter || els.templateFilter.value || state.templatePinnedOnly);
  const hadQuickFilter = Boolean(state.quickFilter || els.quickFilter.value);
  const templateScrollTop = els.templateList.scrollTop;
  const quickScrollTop = els.pieceList.scrollTop;
  setDockPreviewHeight(limits.dockPreviewHeightDefault);
  resetCall();
  state.quickFilter = "";
  state.templateFilter = "";
  state.templatePinnedOnly = false;
  els.quickFilter.value = "";
  els.templateFilter.value = "";
  renderTemplateSort();
  renderTemplates();
  renderQuickPieces();
  if (hadTemplateFilter) els.templateList.scrollTop = 0;
  else els.templateList.scrollTop = templateScrollTop;
  if (hadQuickFilter) els.pieceList.scrollTop = 0;
  else els.pieceList.scrollTop = quickScrollTop;
  if (hadTemplateFilter || hadQuickFilter) setStatus("New call ready.", "good");
  try {
    await writeClipboard("");
    setStatus("New call ready.", "good");
  } catch {
    setStatus(
      (hadTemplateFilter || hadQuickFilter) ? "New call ready; clipboard blocked." : "New call ready. Browser blocked clipboard clear.",
      "warn"
    );
  }
}

// ── Event listeners: setup ────────────────────────────────────────────────────

document.querySelector("#loadTemplates").addEventListener("click", loadTemplatesFromInput);
els.copySetupString.addEventListener("click", copySetupString);
els.toggleSetup.addEventListener("click", () => {
  setSetupCollapsed(els.toggleSetup.getAttribute("aria-expanded") === "true");
});
els.toggleTemplates.addEventListener("click", () => {
  setTemplatesCollapsed(els.toggleTemplates.getAttribute("aria-expanded") === "true");
});
if (els.toggleTemplateTools) {
  els.toggleTemplateTools.addEventListener("click", () => {
    setTemplateToolsCollapsed(els.toggleTemplateTools.getAttribute("aria-expanded") === "true");
  });
}
els.toggleQuickForms.addEventListener("click", () => {
  setQuickFormsCollapsed(els.toggleQuickForms.getAttribute("aria-expanded") === "true");
});
if (els.toggleQuickFormSetup) {
  els.toggleQuickFormSetup.addEventListener("click", () => {
    setQuickFormSetupCollapsed(els.toggleQuickFormSetup.getAttribute("aria-expanded") === "true");
  });
}
if (els.toggleNoteBlockSetup) {
  els.toggleNoteBlockSetup.addEventListener("click", () => {
    setNoteBlockSetupCollapsed(els.toggleNoteBlockSetup.getAttribute("aria-expanded") === "true");
  });
}
if (els.toggleNoteBlockLibrary) {
  els.toggleNoteBlockLibrary.addEventListener("click", () => {
    setNoteBlockLibraryCollapsed(els.toggleNoteBlockLibrary.getAttribute("aria-expanded") === "true");
  });
}
els.toggleBuild.addEventListener("click", () => {
  setBuildCollapsed(els.toggleBuild.getAttribute("aria-expanded") === "true");
});
if (els.toggleFinish) {
  els.toggleFinish.addEventListener("click", () => {
    setFinishCollapsed(els.toggleFinish.getAttribute("aria-expanded") === "true");
  });
}
els.templateFilter.addEventListener("input", () => {
  state.templateFilter = els.templateFilter.value;
  updateTemplateFilterClear();
  renderTemplates();
});
els.templateFilter.addEventListener("keydown", event => {
  if (event.key === "Escape" && els.templateFilter.value) {
    event.preventDefault();
    clearTemplateFilter();
  }
});
if (els.templateFilterClear) {
  els.templateFilterClear.addEventListener("click", clearTemplateFilter);
}
els.templatePinnedOnly.addEventListener("click", () => {
  state.templatePinnedOnly = !state.templatePinnedOnly;
  renderTemplateSort();
  renderTemplates();
  setStatus(state.templatePinnedOnly ? "Showing pinned Full templates only." : "Showing all Full templates.");
});
els.templateSortLoaded.addEventListener("click", () => {
  state.templateSort = "workflow";
  renderTemplateSort();
  renderTemplates();
});
els.templateSortAZ.addEventListener("click", () => {
  state.templateSort = "az";
  renderTemplateSort();
  renderTemplates();
});
els.templateSortCustom.addEventListener("click", () => {
  state.templateSort = "custom";
  syncCustomTemplateOrder(sortedTemplates({ includeFilter: false }));
  renderTemplateSort();
  renderTemplates();
  setStatus("Custom Full template order active.");
});
els.copyFullSetup.addEventListener("click", copyFullSetup);
els.resizeTemplates.addEventListener("pointerdown", event => {
  event.preventDefault();
  state.resizingTemplates = true;
  els.resizeTemplates.setPointerCapture(event.pointerId);
});
els.resizeTemplates.addEventListener("pointermove", event => {
  if (!state.resizingTemplates) return;
  const rect = els.templateList.getBoundingClientRect();
  setTemplateListHeight(event.clientY - rect.top);
});
els.resizeTemplates.addEventListener("pointerup", event => {
  state.resizingTemplates = false;
  els.resizeTemplates.releasePointerCapture(event.pointerId);
  setStatus("Full templates height adjusted.");
});
els.resizeTemplates.addEventListener("keydown", event => {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    setTemplateListHeight(state.templateListHeight + limits.templateListHeightStep);
    setStatus("Full templates height adjusted.");
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    setTemplateListHeight(state.templateListHeight - limits.templateListHeightStep);
    setStatus("Full templates height adjusted.");
  } else if (event.key === "Home") {
    event.preventDefault();
    setTemplateListHeight(limits.templateListHeightMin);
    setStatus("Full templates height minimized.");
  } else if (event.key === "End") {
    event.preventDefault();
    setTemplateListHeight(limits.templateListHeightMax);
    setStatus("Full templates height expanded.");
  }
});
attachVerticalResize(els.resizeNoteBlocks, {
  flag: "resizingNoteBlocks",
  target: () => els.pieceList,
  get: () => state.noteBlocksListHeight,
  set: setNoteBlocksListHeight,
  min: limits.noteBlocksListHeightMin,
  max: limits.noteBlocksListHeightMax,
  step: limits.noteBlocksListHeightStep,
  adjusted: "Reusable phrases height adjusted.",
  minimized: "Reusable phrases height minimized.",
  expanded: "Reusable phrases height expanded."
});
els.toggleRules.addEventListener("click", () => {
  setRulesCollapsed(els.toggleRules.getAttribute("aria-expanded") === "true");
});

// ── Event listeners: quick forms ─────────────────────────────────────────────

els.addQuickForm.addEventListener("click", addQuickForm);
els.quickFormTitle.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    els.quickFormBody.focus();
  }
});
els.quickFormBody.addEventListener("keydown", event => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    addQuickForm();
  }
});
els.quickFormEditor.addEventListener("input", () => {
  state.activeQuickFormContent = els.quickFormEditor.value;
  renderQuickFormDock();
});
els.copyQuickForm.addEventListener("click", copyActiveQuickForm);
els.resetQuickForm.addEventListener("click", resetActiveQuickForm);
els.clearQuickForm.addEventListener("click", () => clearActiveQuickForm({ focus: els.quickFormTitle }));

// ── Event listeners: rules ────────────────────────────────────────────────────

document.querySelector("#applyRules").addEventListener("click", applyRules);
document.querySelector("#resetRules").addEventListener("click", resetRules);
[els.ruleStart, els.ruleCallEnded, els.ruleTransferPrefix].forEach(input => {
  input.addEventListener("keydown", event => {
    if (event.key === "Enter") { event.preventDefault(); applyRules(); }
  });
});

// ── Event listeners: quick pieces ─────────────────────────────────────────────

document.querySelector("#addQuickPiece").addEventListener("click", addQuickPiece);
els.quickFilter.addEventListener("input", () => {
  state.quickFilter = els.quickFilter.value;
  renderQuickPieces();
});
els.newQuickPiece.addEventListener("keydown", event => {
  if (event.key === "Enter") { event.preventDefault(); addQuickPiece(); }
});

if (els.quickSortSelect) {
  els.quickSortSelect.addEventListener("change", () => {
    state.quickSort = safeSort(els.quickSortSelect.value);
    state.editingQuickPieceKey = "";
    if (state.quickSort === "custom") {
      syncCustomQuickOrder();
      setStatus("Custom reusable phrase order active.");
    }
    renderQuickSort();
    renderQuickPieces();
    queueReusablePhrasesReveal();
  });
}
els.copyQuickSetup.addEventListener("click", copyQuickSetup);

// ── Event listeners: build note ───────────────────────────────────────────────

document.querySelector("#addDetail").addEventListener("click", addCustomDetail);
if (els.saveBuiltTemplate) {
  els.saveBuiltTemplate.addEventListener("click", saveBuiltTemplate);
}
els.customDetail.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    addCustomDetail();
  }
});

document.querySelector("#undoLast").addEventListener("click", () => {
  state.pieces.pop();
  renderCurrentPieces();
  renderNote();
  focusFirst(".current-remove, .current-move:not(:disabled)", els.customDetail);
});
document.querySelector("#clearCall").addEventListener("click", () => {
  resetCall();
  setStatus("Call cleared. Templates remain loaded.");
  els.customDetail.focus();
});

// ── Event listeners: finish ───────────────────────────────────────────────────

els.endCall.addEventListener("click", () => {
  state.ending = "call-ended";
  renderEnding();
});
els.endTransfer.addEventListener("click", () => {
  state.ending = "transfer";
  renderEnding();
});
els.transferTarget.addEventListener("input", renderNote);
els.transferTarget.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    if (noteIsValid()) els.copyNote.focus();
  }
});
els.editNote.addEventListener("click", toggleNoteEditor);
els.noteEditor.addEventListener("input", () => {
  if (els.dockNoteEditor && document.activeElement !== els.dockNoteEditor) {
    els.dockNoteEditor.value = els.noteEditor.value;
  }
  renderNote();
});
if (els.dockEditNote) {
  els.dockEditNote.addEventListener("click", () => toggleNoteEditor("dock"));
}
if (els.dockNoteEditor) {
  els.dockNoteEditor.addEventListener("input", () => {
    els.noteEditor.value = els.dockNoteEditor.value;
    renderNote();
  });
  els.dockNoteEditor.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeNoteEditor(els.dockEditNote);
    }
  });
}

// ── Event listeners: scratchpad ───────────────────────────────────────────────

if (els.toggleScratchpad) {
  els.toggleScratchpad.addEventListener("click", () => {
    setScratchpadCollapsed(els.toggleScratchpad.getAttribute("aria-expanded") === "true");
  });
}
if (els.snapScratchpad) {
  els.snapScratchpad.addEventListener("click", () => {
    setScratchpadSnapped(!state.scratchpadSnapped, { focus: true });
  });
}
if (els.sendScratchpadAway) {
  els.sendScratchpadAway.addEventListener("click", () => {
    setScratchpadSnapped(false);
    setStatus("Scratchpad sent away.");
    els.snapScratchpad && els.snapScratchpad.focus();
  });
}
if (els.clearScratchpad) {
  els.clearScratchpad.addEventListener("click", () => {
    if (els.scratchpad) els.scratchpad.value = "";
    updateScratchpadSummary();
    setStatus("Scratchpad text is not included.");
    els.scratchpad && els.scratchpad.focus();
  });
}
if (els.scratchpad) {
  els.scratchpad.addEventListener("input", updateScratchpadSummary);
}
if (els.copySavedReference) {
  els.copySavedReference.addEventListener("click", copySavedReference);
}
if (els.editSavedReference) {
  els.editSavedReference.addEventListener("click", openSavedReferenceEditor);
}
if (els.saveSavedReference) {
  els.saveSavedReference.addEventListener("click", saveSavedReference);
}
if (els.cancelSavedReference) {
  els.cancelSavedReference.addEventListener("click", closeSavedReferenceEditor);
}
if (els.savedReferenceEditor) {
  els.savedReferenceEditor.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSavedReferenceEditor();
    }
  });
}
attachVerticalResize(els.resizeScratchpad, {
  flag: "resizingScratchpad",
  target: () => els.scratchpad,
  get: () => state.scratchpadHeight,
  set: setScratchpadHeight,
  min: limits.scratchpadHeightMin,
  max: limits.scratchpadHeightMax,
  step: limits.scratchpadHeightStep,
  adjusted: "Scratchpad height adjusted.",
  minimized: "Scratchpad height minimized.",
  expanded: "Scratchpad height expanded."
});

// ── Event listeners: dock ─────────────────────────────────────────────────────

els.copyNote.addEventListener("click", copyNote);
attachVerticalResize(els.resizeDockPreview, {
  flag: "resizingDockPreview",
  target: () => state.editingNote && els.dockNoteEditor ? els.dockNoteEditor : els.dockPreview,
  get: () => state.dockPreviewHeight,
  set: setDockPreviewHeight,
  min: limits.dockPreviewHeightMin,
  max: limits.dockPreviewHeightMax,
  step: limits.dockPreviewHeightStep,
  adjusted: "Dock preview height adjusted.",
  minimized: "Dock preview minimized.",
  expanded: "Dock preview expanded."
});
document.querySelector("#newCall").addEventListener("click", newCallAndClearClipboard);

// ── Event listeners: session ──────────────────────────────────────────────────

els.clearSession.addEventListener("click", clearEntireSession);

// ── Event listeners: themes ───────────────────────────────────────────────────

els.themeLight.addEventListener("click", () => setTheme("light"));
els.themeBlackout.addEventListener("click",  () => setTheme("blackout"));
els.zoomOut.addEventListener("click", () => setZoom(nextZoom(-1)));
els.zoomLevel.addEventListener("click", () => setZoom(limits.zoomDefault));
els.zoomIn.addEventListener("click", () => setZoom(nextZoom(1)));

// ── Event listeners: info tips ───────────────────────────────────────────────

els.infoTips.forEach(button => {
  button.addEventListener("mouseenter", () => showInfoTip(button));
  button.addEventListener("mouseleave", () => hideInfoTip(button));
  button.addEventListener("focus", () => showInfoTip(button));
  button.addEventListener("blur", () => hideInfoTip(button));
  button.addEventListener("click", event => {
    event.stopPropagation();
    const shouldOpen = button.getAttribute("aria-expanded") !== "true";
    closeInfoTips();
    if (shouldOpen) showInfoTip(button, { expanded: true });
  });
});

// ── Event listeners: global ───────────────────────────────────────────────────

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && activeInfoTip) {
    closeInfoTips();
    return;
  }
  if (event.key === "Escape" && state.editingNote) {
    closeNoteEditor();
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    copyNote();
  }
});
document.addEventListener("click", closeInfoTips);
window.addEventListener("scroll", () => {
  if (activeInfoTip) positionInfoTip(activeInfoTip);
}, true);
window.addEventListener("beforeunload", event => {
  if (!hasSessionData()) return;
  event.preventDefault();
  event.returnValue = "";
});
window.addEventListener("resize", () => {
  queueDockClearanceSync();
  if (activeInfoTip) positionInfoTip(activeInfoTip);
});
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", () => {
    queueDockClearanceSync();
    if (activeInfoTip) positionInfoTip(activeInfoTip);
  });
}
if (window.ResizeObserver && els.callDock) {
  const dockClearanceObserver = new ResizeObserver(queueDockClearanceSync);
  dockClearanceObserver.observe(els.callDock);
}

// ── Init ──────────────────────────────────────────────────────────────────────

renderAll();
