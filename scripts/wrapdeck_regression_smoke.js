#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (error) {
  console.error("WrapDeck regression smoke needs Playwright on NODE_PATH.");
  console.error("Install Playwright or set NODE_PATH to a Playwright install before running this script.");
  process.exit(1);
}

const root = path.resolve(__dirname, "..");
const chromePath = process.env.CHROME_EXECUTABLE_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const runtimeFiles = new Set([
  "/",
  "/index.html",
  "/app.js",
  "/styles.css",
  "/privacy.html",
  "/privacy.css",
  "/guide.html",
  "/security.html",
  "/.well-known/security.txt",
  "/404.html",
  "/robots.txt"
]);
const sidecarWidths = [390, 378, 340, 300, 280, 260, 240];
const themes = [
  { button: "#themeLight", name: "Light" },
  { button: "#themeBlackout", name: "Operator Blackout" }
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".txt")) return "text/plain; charset=utf-8";
  return "application/octet-stream";
}

function createServer() {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    if (!runtimeFiles.has(url.pathname) && !runtimeFiles.has(pathname)) {
      response.writeHead(404, {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8"
      });
      response.end("Not found");
      return;
    }

    const filePath = path.join(root, pathname.slice(1));
    fs.readFile(filePath, (error, body) => {
      if (error) {
        response.writeHead(404, {
          "Cache-Control": "no-store",
          "Content-Type": "text/plain; charset=utf-8"
        });
        response.end("Not found");
        return;
      }
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": contentType(filePath)
      });
      response.end(body);
    });
  });

  return new Promise(resolve => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function decodeSetupString(value) {
  const prefix = "WDSTRING_V1:";
  assert(value.startsWith(prefix), "Setup string did not use WDSTRING_V1 prefix.");
  const encoded = value.slice(prefix.length).trim();
  const json = decodeURIComponent([...Buffer.from(encoded, "base64").toString("binary")]
    .map(char => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
    .join(""));
  return JSON.parse(json);
}

function encodeSetupString(payload) {
  const json = JSON.stringify(payload);
  const encoded = Buffer.from(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_match, hex) => {
    return String.fromCharCode(Number.parseInt(hex, 16));
  }), "binary").toString("base64");
  return `WDSTRING_V1:${encoded}`;
}

async function installClipboardStub(page) {
  await page.addInitScript(() => {
    window.__wrapdeckClipboardWrites = [];
    window.__wrapdeckClipboardReadAttempted = false;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async text => {
          window.__wrapdeckClipboardWrites.push(String(text));
        },
        readText: async () => {
          window.__wrapdeckClipboardReadAttempted = true;
          throw new Error("WrapDeck must not read the clipboard.");
        }
      }
    });
  });
}

async function lastClipboardWrite(page) {
  return page.evaluate(() => window.__wrapdeckClipboardWrites.at(-1) || "");
}

async function assertNoClipboardRead(page) {
  const attempted = await page.evaluate(() => Boolean(window.__wrapdeckClipboardReadAttempted));
  assert(!attempted, "App attempted to read from the clipboard.");
}

async function assertNoStorageResidue(page) {
  const storage = await page.evaluate(async () => {
    const indexedDbNames = indexedDB.databases ? await indexedDB.databases() : [];
    const cacheNames = typeof caches !== "undefined" ? await caches.keys() : [];
    const serviceWorkers = navigator.serviceWorker
      ? await navigator.serviceWorker.getRegistrations()
      : [];
    return {
      cookie: document.cookie,
      localStorage: localStorage.length,
      sessionStorage: sessionStorage.length,
      indexedDbCount: indexedDbNames.length,
      cacheCount: cacheNames.length,
      serviceWorkerCount: serviceWorkers.length
    };
  });
  assert(storage.cookie === "", "Document cookie should stay empty.");
  assert(storage.localStorage === 0, "localStorage should stay empty.");
  assert(storage.sessionStorage === 0, "sessionStorage should stay empty.");
  assert(storage.indexedDbCount === 0, "IndexedDB should not contain WrapDeck data.");
  assert(storage.cacheCount === 0, "Cache API should not contain WrapDeck data.");
  assert(storage.serviceWorkerCount === 0, "No service worker should be registered.");
  return storage;
}

async function assertNoOverflow(page) {
  const metrics = await page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    copyDisabled: document.querySelector("#copyNote")?.disabled,
    dockVisible: getComputedStyle(document.querySelector("#callDock")).display !== "none"
  }));
  assert(metrics.scrollWidth <= metrics.width, `Horizontal overflow at ${metrics.width}px: scrollWidth=${metrics.scrollWidth}.`);
  assert(metrics.dockVisible, `Dock was not visible at ${metrics.width}px.`);
  return metrics;
}

async function assertNoInvalidButtonAria(page) {
  const offenders = await page.evaluate(() => {
    return [...document.querySelectorAll("button[aria-valuetext]")]
      .map(button => button.id || button.className || button.textContent.trim());
  });
  assert(
    offenders.length === 0,
    `Button controls should not use aria-valuetext: ${offenders.join(", ")}.`
  );
}

async function currentPieceTexts(page) {
  return page.locator(".current-piece").allTextContents();
}

async function assertCurrentPieceOrder(page, expected, label) {
  const actual = await currentPieceTexts(page);
  assert(
    actual.join("|") === expected.join("|"),
    `${label} current piece order mismatch. Expected ${expected.join(" > ")} but saw ${actual.join(" > ")}.`
  );
  const dockText = await page.locator("#dockPreview").innerText();
  const positions = expected.map(piece => dockText.indexOf(piece));
  assert(
    positions.every(position => position >= 0),
    `${label} dock preview was missing a dragged piece: ${dockText}`
  );
  assert(
    positions.every((position, index) => index === 0 || position > positions[index - 1]),
    `${label} dock preview order did not match current pieces: ${dockText}`
  );
}

async function addCurrentPiece(page, value) {
  await page.fill("#customDetail", value);
  await page.click("#addDetail");
}

async function currentNoteState(page) {
  return page.evaluate(() => ({
    pieces: [...document.querySelectorAll(".current-piece")].map(piece => piece.textContent.trim()),
    ending: document.querySelector("#endTransfer")?.getAttribute("aria-pressed") === "true" ? "transfer" : "call-ended",
    transferTarget: document.querySelector("#transferTarget")?.value || "",
    editing: document.querySelector("#dockNoteEditor")?.classList.contains("is-open") || false,
    inputValue: document.querySelector("#customDetail")?.value || "",
    copyDisabled: document.querySelector("#copyNote")?.disabled
  }));
}

async function assertBuilderTemplateLoaded(page, expected, label) {
  const actual = await currentNoteState(page);
  assert(
    actual.pieces.join("|") === expected.pieces.join("|"),
    `${label} pieces mismatch. Expected ${expected.pieces.join(" > ")} but saw ${actual.pieces.join(" > ")}.`
  );
  assert(actual.ending === expected.ending, `${label} ending mismatch: expected ${expected.ending}, saw ${actual.ending}.`);
  assert(actual.transferTarget === (expected.transferTarget || ""), `${label} transfer target mismatch: ${actual.transferTarget}.`);
  assert(!actual.editing, `${label} should not open dock edit mode.`);
  assert(actual.inputValue === "", `${label} should clear the builder input.`);
  assert(actual.copyDisabled === Boolean(expected.copyDisabled), `${label} copy disabled mismatch.`);
}

async function dragCurrentPiece(page, fromIndex, targetIndex, afterTarget) {
  const handle = page.locator(".current-drag-handle").nth(fromIndex);
  const target = page.locator(".current-control").nth(targetIndex);
  await handle.evaluate(node => node.scrollIntoView({ block: "center", inline: "nearest" }));
  await page.waitForTimeout(25);
  const handleBox = await handle.boundingBox();
  assert(handleBox, `Could not locate drag handle ${fromIndex}.`);

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();

  const targetBox = await target.boundingBox();
  assert(targetBox, `Could not locate drag target ${targetIndex}.`);

  await page.mouse.move(
    targetBox.x + Math.min(18, targetBox.width / 2),
    targetBox.y + (afterTarget ? targetBox.height - 4 : 4),
    { steps: 8 }
  );
  await page.mouse.up();
  await page.waitForTimeout(25);
}

async function runCurrentPieceDragSmoke(page) {
  await page.click("#newCall");
  await addCurrentPiece(page, "alpha drag piece");
  await addCurrentPiece(page, "bravo drag piece");
  await addCurrentPiece(page, "charlie drag piece");
  await assertCurrentPieceOrder(
    page,
    ["alpha drag piece", "bravo drag piece", "charlie drag piece"],
    "initial drag smoke"
  );

  await dragCurrentPiece(page, 0, 2, true);
  await assertCurrentPieceOrder(
    page,
    ["bravo drag piece", "charlie drag piece", "alpha drag piece"],
    "first-to-last drag"
  );

  await dragCurrentPiece(page, 2, 0, false);
  await assertCurrentPieceOrder(
    page,
    ["alpha drag piece", "bravo drag piece", "charlie drag piece"],
    "last-to-first drag"
  );

  await dragCurrentPiece(page, 2, 1, false);
  await assertCurrentPieceOrder(
    page,
    ["alpha drag piece", "charlie drag piece", "bravo drag piece"],
    "middle insertion drag"
  );

  await page.locator(".current-control").first().locator(".current-move").nth(1).click();
  await assertCurrentPieceOrder(
    page,
    ["charlie drag piece", "alpha drag piece", "bravo drag piece"],
    "arrow fallback after drag"
  );
  assert(
    await page.evaluate(() => document.activeElement?.classList.contains("current-move")),
    "Arrow fallback did not preserve focus on a move button."
  );
}

async function assertCurrentPieceLayout(page, width) {
  await page.click("#newCall");
  for (const piece of [
    "ok",
    "yes",
    "done",
    "longer field note to make sure wrapping still works at the sidecar floor",
    "last"
  ]) {
    await addCurrentPiece(page, piece);
  }
  await page.locator(".current-control").last().evaluate(node => {
    node.scrollIntoView({ block: "end", inline: "nearest" });
  });
  await page.waitForTimeout(80);

  const result = await page.evaluate(() => {
    const dock = document.querySelector(".call-dock").getBoundingClientRect();
    const rows = [...document.querySelectorAll(".current-control")];
    const read = row => {
      const rowRect = row.getBoundingClientRect();
      const cardRect = row.querySelector(".current-card").getBoundingClientRect();
      const pieceRect = row.querySelector(".current-piece").getBoundingClientRect();
      return {
        text: row.querySelector(".current-piece").textContent,
        rowWidth: rowRect.width,
        cardWidth: cardRect.width,
        pieceWidth: pieceRect.width,
        bottom: rowRect.bottom
      };
    };
    return {
      dockTop: dock.top,
      dockHeight: dock.height,
      clearance: Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dock-clearance")),
      first: read(rows[0]),
      second: read(rows[1]),
      longRow: read(rows[3]),
      last: read(rows[rows.length - 1])
    };
  });

  assert(
    result.first.cardWidth < result.first.rowWidth * 0.68,
    `Short current piece card was too wide at ${width}px: ${Math.round(result.first.cardWidth)}px of ${Math.round(result.first.rowWidth)}px.`
  );
  assert(
    result.second.cardWidth < result.second.rowWidth * 0.68,
    `Second short current piece card was too wide at ${width}px: ${Math.round(result.second.cardWidth)}px of ${Math.round(result.second.rowWidth)}px.`
  );
  assert(
    result.longRow.cardWidth <= result.longRow.rowWidth,
    `Long current piece card overflowed its row at ${width}px.`
  );
  assert(
    result.last.bottom <= result.dockTop - 12,
    `Last current piece did not clear the dock at ${width}px: bottom ${Math.round(result.last.bottom)}px, dock top ${Math.round(result.dockTop)}px.`
  );
  assert(
    result.clearance >= result.dockHeight + 20,
    `Dock clearance did not track dock height at ${width}px: clearance ${Math.round(result.clearance)}px, dock ${Math.round(result.dockHeight)}px.`
  );
}

async function assertReusablePhraseLayout(page, width) {
  await page.locator("#quickSortSelect").selectOption("custom");
  const original = await page.locator(".piece-button").first().textContent();
  await page.locator(".piece-edit").first().click();
  await page.fill(".piece-edit-field", "edited reusable phrase");
  await page.click(".piece-edit-save");
  await page.waitForTimeout(100);

  const result = await page.evaluate(originalText => {
    const list = document.querySelector("#pieceList");
    const cards = [...document.querySelectorAll("#pieceList .piece-control")];
    const firstRow = cards.slice(0, 2).map(card => card.getBoundingClientRect());
    const buttons = [...document.querySelectorAll("#pieceList .piece-button")]
      .map(button => button.getBoundingClientRect());
    const editButtonElements = [...document.querySelectorAll("#pieceList .piece-edit")];
    const editButtons = editButtonElements.map(button => button.getBoundingClientRect());
    const removeButtons = [...document.querySelectorAll("#pieceList .piece-remove")]
      .map(button => button.getBoundingClientRect());
    const select = document.querySelector("#quickSortSelect").getBoundingClientRect();
    const dock = document.querySelector(".call-dock").getBoundingClientRect();
    const last = cards.at(-1).getBoundingClientRect();
    const texts = cards
      .map(card => card.querySelector(".piece-button")?.textContent.trim())
      .filter(Boolean);
    const visibleEdit = editButtons.find(rect => {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      return centerX >= 0 && centerX <= window.innerWidth && centerY >= 0 && centerY <= window.innerHeight;
    });
    const editHit = visibleEdit
      ? document.elementFromPoint(visibleEdit.left + visibleEdit.width / 2, visibleEdit.top + visibleEdit.height / 2)
      : null;
    return {
      columns: getComputedStyle(list).gridTemplateColumns.split(" ").filter(Boolean).length,
      firstRowTops: firstRow.map(rect => Math.round(rect.top)),
      minPhraseHeight: Math.min(...buttons.map(rect => rect.height)),
      minEditHeight: Math.min(...editButtons.map(rect => rect.height)),
      minRemoveHeight: Math.min(...removeButtons.map(rect => rect.height)),
      selectHeight: select.height,
      lastGap: dock.top - last.bottom,
      hasEdited: texts.includes("edited reusable phrase"),
      hasOriginal: texts.includes(originalText),
      visibleEditCount: editButtons.filter(rect => {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        return centerX >= 0 && centerX <= window.innerWidth && centerY >= 0 && centerY <= window.innerHeight;
      }).length,
      editHitClass: editHit ? String(editHit.className) : ""
    };
  }, original.trim());

  assert(result.columns === 2, `Reusable phrase cards were not two columns at ${width}px.`);
  assert(
    result.firstRowTops.length === 2 && Math.abs(result.firstRowTops[0] - result.firstRowTops[1]) <= 2,
    `Reusable phrase first row was misaligned at ${width}px: ${result.firstRowTops.join(", ")}.`
  );
  assert(result.minPhraseHeight >= 34, `Reusable phrase button target was too short at ${width}px.`);
  assert(result.minEditHeight >= 26, `Reusable phrase edit target was too short at ${width}px.`);
  assert(result.minRemoveHeight >= 26, `Reusable phrase delete target was too short at ${width}px.`);
  assert(result.selectHeight >= 32, `Reusable phrase sort dropdown was too short at ${width}px.`);
  assert(result.lastGap >= 12, `Reusable phrase list did not clear the dock at ${width}px.`);
  assert(result.hasEdited, `Edited reusable phrase was missing at ${width}px.`);
  assert(!result.hasOriginal, `Original reusable phrase stayed visible after edit at ${width}px.`);
  assert(result.visibleEditCount > 0, `No reusable phrase edit target was visible at ${width}px.`);
  assert(
    result.editHitClass.includes("piece-edit"),
    `Reusable phrase edit target was covered at ${width}px by ${result.editHitClass}.`
  );
}

async function assertBlackoutSidecarTargets(page, width) {
  if (width > 280) return;
  await page.click("#themeBlackout");
  const result = await page.evaluate(() => {
    const selectors = [
      ".current-drag-handle",
      ".current-move",
      ".current-edit",
      ".current-remove",
      ".dock-save-full-template",
      ".dock-ending-switch button",
      ".dock-actions button"
    ];
    const failures = [];
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (!element) {
        failures.push(`missing ${selector}`);
        continue;
      }
      const rect = element.getBoundingClientRect();
      if (rect.height < 43.5) {
        failures.push(`${selector} height ${Math.round(rect.height * 10) / 10}px`);
      }
    }
    for (const element of document.querySelectorAll(".piece-order-button")) {
      const rect = element.getBoundingClientRect();
      if (rect.height < 43.5) {
        failures.push(`.piece-order-button height ${Math.round(rect.height * 10) / 10}px`);
      }
    }

    const focusTarget = document.querySelector("#copyNote");
    focusTarget.focus();
    const focusStyle = getComputedStyle(focusTarget);
    const outlineWidth = Number.parseFloat(focusStyle.outlineWidth);
    if (!Number.isFinite(outlineWidth) || outlineWidth < 3) {
      failures.push(`blackout focus outline ${focusStyle.outlineWidth}`);
    }
    if (!focusStyle.boxShadow || focusStyle.boxShadow === "none") {
      failures.push("blackout focus isolation shadow missing");
    }

    const dock = document.querySelector(".call-dock");
    if (dock) {
      const dockHeight = dock.getBoundingClientRect().height;
      const maxDockHeight = window.innerHeight * 0.55;
      if (dockHeight > maxDockHeight) {
        failures.push(`call dock height ${Math.round(dockHeight)}px exceeds 55vh`);
      }
    }
    return failures;
  });
  assert(result.length === 0, `Operator Blackout skinny target failures at ${width}px: ${result.join("; ")}`);
}

async function themeContrastResult(page, themeName) {
  return page.evaluate(name => {
    function parseColor(value) {
      const match = String(value).match(/rgba?\(([^)]+)\)/);
      if (!match) throw new Error(`Unsupported computed color: ${value}`);
      const parts = match[1].split(",").map(part => Number.parseFloat(part.trim()));
      return {
        r: parts[0],
        g: parts[1],
        b: parts[2],
        a: parts.length > 3 ? parts[3] : 1
      };
    }

    function srgbToLinear(value) {
      const channel = value / 255;
      return channel <= 0.03928
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    }

    function luminance(color) {
      return (0.2126 * srgbToLinear(color.r))
        + (0.7152 * srgbToLinear(color.g))
        + (0.0722 * srgbToLinear(color.b));
    }

    function contrastRatio(foreground, background) {
      const high = Math.max(luminance(foreground), luminance(background));
      const low = Math.min(luminance(foreground), luminance(background));
      return (high + 0.05) / (low + 0.05);
    }

    function blend(foreground, background) {
      const alpha = foreground.a + (background.a * (1 - foreground.a));
      if (alpha <= 0) return { r: 255, g: 255, b: 255, a: 1 };
      return {
        r: ((foreground.r * foreground.a) + (background.r * background.a * (1 - foreground.a))) / alpha,
        g: ((foreground.g * foreground.a) + (background.g * background.a * (1 - foreground.a))) / alpha,
        b: ((foreground.b * foreground.a) + (background.b * background.a * (1 - foreground.a))) / alpha,
        a: alpha
      };
    }

    function effectiveBackground(element) {
      const stack = [];
      let current = element;
      while (current) {
        stack.push(parseColor(getComputedStyle(current).backgroundColor));
        current = current.parentElement;
      }
      let background = { r: 255, g: 255, b: 255, a: 1 };
      while (stack.length) {
        background = blend(stack.pop(), background);
      }
      return background;
    }

    const samples = [
      ["body", "body"],
      ["panel", ".panel"],
      ["dock status", "#status"],
      ["dock preview", "#dockPreview"],
      ["copy note", "#copyNote"],
      ["new call", "#newCall"],
      ["template action", ".template-copy-as-is"],
      ["quick form copy", "#copyQuickForm"],
      ["optional phrases heading", "#noteBlockLibrary .count-head"],
      ["optional phrases toggle", "#toggleNoteBlockLibrary"]
    ];

    const failures = [];
    const ratios = samples.map(([label, selector]) => {
      const element = document.querySelector(selector);
      if (!element) {
        failures.push(`${name}: missing selector ${selector}`);
        return { label, selector, ratio: 0 };
      }
      const style = getComputedStyle(element);
      const ratio = contrastRatio(parseColor(style.color), effectiveBackground(element));
      const rounded = Math.round(ratio * 100) / 100;
      const ancestorOpacity = Number.parseFloat(getComputedStyle(element.closest(".note-block-library") || element).opacity);
      if (Number.isFinite(ancestorOpacity) && ancestorOpacity < 1) {
        failures.push(`${name} ${label} ancestor opacity ${ancestorOpacity}`);
      }
      if (rounded < 4.5) {
        failures.push(`${name} ${label} contrast ${rounded}:1`);
      }
      return { label, selector, ratio: rounded };
    });
    return { theme: name, ratios, failures };
  }, themeName);
}

async function openQuickFormSetup(page) {
  if (!await page.locator("#quickFormTitle").isVisible()) {
    await page.click("#toggleQuickFormSetup");
  }
}

async function openSetupPanel(page) {
  if (!await page.locator("#templateInput").isVisible()) {
    await page.click("#toggleSetup");
  }
}

async function assertInfoTips(page, width) {
  const tips = page.locator(".info-tip");
  assert(await tips.count() >= 7, `Expected section info tips at ${width}px.`);
  await tips.first().click();
  assert(
    await tips.first().getAttribute("aria-expanded") === "true",
    `Info tip did not toggle open at ${width}px.`
  );
  const bubble = page.locator("#infoTipBubble");
  assert(await bubble.isVisible(), `Info tip bubble was not visible at ${width}px.`);
  assert(
    (await bubble.textContent()).includes("WDSTRING"),
    `Board Setup info tip did not preserve setup-string detail at ${width}px.`
  );
  const box = await bubble.boundingBox();
  assert(box, `Info tip bubble had no box at ${width}px.`);
  assert(box.x >= -1 && box.x + box.width <= width + 1, `Info tip bubble overflowed horizontally at ${width}px.`);
  await page.keyboard.press("Escape");
  assert(
    await tips.first().getAttribute("aria-expanded") === "false",
    `Info tip did not close on Escape at ${width}px.`
  );
}

async function runCoreFlow(page, baseUrl, width = 390) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await assertNoInvalidButtonAria(page);
  await assertInfoTips(page, width);
  const workspaceOrder = await page.evaluate(() => {
    return [...document.querySelectorAll(".workspace > .panel")].map(panel => panel.id);
  });
  assert(
    workspaceOrder.join("|") === [
      "setupPanel",
      "scratchpadPanel",
      "savedReferencePanel",
      "buildPanel",
      "fullTemplatePanel",
      "quickFormsPanel"
    ].join("|"),
    `Workspace section order changed unexpectedly: ${workspaceOrder.join(" > ")}.`
  );
  assert(
    await page.locator("#setupPanel").evaluate(node => node.classList.contains("is-collapsed")),
    "Board Setup should start collapsed."
  );
  await openSetupPanel(page);
  await page.fill(
    "#templateInput",
    [
      "CALL START// verified greeting// explained options// CALL END",
      "Transfer: CALL START// verified caller// explained transfer// TRANSFER TO Support"
    ].join("\n")
  );
  await page.click("#loadTemplates");

  await addCurrentPiece(page, "plain partial note");
  await assertBuilderTemplateLoaded(page, {
    pieces: ["plain partial note"],
    ending: "call-ended",
    copyDisabled: false
  }, "plain builder piece");

  await addCurrentPiece(page, "CALL START// one// two// CALL END");
  await assertBuilderTemplateLoaded(page, {
    pieces: ["one", "two"],
    ending: "call-ended",
    copyDisabled: false
  }, "pasted call-ended full template");

  await addCurrentPiece(page, "CALL START// one// TRANSFER TO Support");
  await assertBuilderTemplateLoaded(page, {
    pieces: ["one"],
    ending: "transfer",
    transferTarget: "Support",
    copyDisabled: false
  }, "pasted transfer full template");

  assert(
    await page.locator(".template-build-note").count() === 0,
    "Full Template cards should not show a redundant Build action."
  );

  await page.locator(".template-copy-as-is").first().click();
  assert(
    await lastClipboardWrite(page) === "CALL START// verified greeting// explained options// CALL END",
    "Copy as is did not write the expected Full Template text."
  );

  await page.locator(".template-edit-in-dock").first().click();
  await page.fill("#customDetail", "service request opened");
  await page.click("#addDetail");
  await page.click("#copyNote");
  assert(
    (await lastClipboardWrite(page)).includes("service request opened"),
    "Copy Valid Note did not include the current call detail."
  );

  await openQuickFormSetup(page);
  await page.fill("#quickFormTitle", "General request");
  await page.fill("#quickFormBody", "Item:\nContext:\nReason:\nNext step:");
  await page.click("#addQuickForm");
  await page.fill("#quickFormEditor", "Changed active only 123");
  await page.click("#copyQuickForm");
  assert(
    await lastClipboardWrite(page) === "Changed active only 123",
    "Copy Quick Form did not write only the active Quick Form text."
  );

  await page.click("#endTransfer");
  await page.fill("#transferTarget", "LiveDesk777");
  await page.click("#toggleScratchpad");
  await page.fill("#scratchpad", "scratch-only-987");
  await page.click("#themeBlackout");
  await page.click("#copySetupString");
  const setup = await lastClipboardWrite(page);
  const payload = decodeSetupString(setup);
  const serialized = JSON.stringify(payload);
  assert(payload.app === "WrapDeck" && payload.version === 1, "Setup payload metadata changed.");
  assert(payload.theme === "blackout", "Setup payload did not preserve Operator Blackout theme.");
  assert(payload.templates.length === 2, "Setup payload should preserve reusable Full Templates.");
  assert(payload.quickForms.length === 1, "Setup payload should preserve saved Quick Forms.");
  assert(!serialized.includes("service request opened"), "Setup payload leaked current call note content.");
  assert(!serialized.includes("Changed active only 123"), "Setup payload leaked active Quick Form edits.");
  assert(!serialized.includes("LiveDesk777"), "Setup payload leaked current transfer destination.");
  assert(!serialized.includes("scratch-only-987"), "Setup payload leaked Scratchpad text.");

  await page.click("#newCall");
  await page.waitForTimeout(25);
  assert(await page.locator("#quickFormDock").isHidden(), "New Call did not clear the active Quick Form.");
  assert(await page.locator("#copyNote").isDisabled(), "New Call left Copy Valid Note enabled.");
  assert(await page.locator("#headerTemplateCount").textContent() === "2", "New Call should preserve loaded templates.");

  await openSetupPanel(page);
  await page.fill("#templateInput", setup);
  await page.click("#loadTemplates");
  await page.waitForTimeout(25);
  assert(await page.evaluate(() => document.body.dataset.theme) === "blackout", "Setup reload did not restore Operator Blackout theme.");
  assert(await page.locator("#headerTemplateCount").textContent() === "2", "Setup reload did not restore Full Templates.");
  await page.locator(".quick-form-use").first().click();
  assert(
    await page.locator("#quickFormEditor").inputValue() === "Item:\nContext:\nReason:\nNext step:",
    "Setup reload should restore saved Quick Form template, not active edits."
  );
  assert(await page.locator("#copyNote").isDisabled(), "Setup reload should not restore current-call note content.");

  await page.click("#themeLight");
  await page.click("#copySetupString");
  const lightSetup = await lastClipboardWrite(page);
  const lightPayload = decodeSetupString(lightSetup);
  assert(!Object.prototype.hasOwnProperty.call(lightPayload, "theme"), "Light setup payload should omit theme for legacy-safe fallback.");
  await page.click("#themeBlackout");
  await openSetupPanel(page);
  await page.fill("#templateInput", lightSetup);
  await page.click("#loadTemplates");
  await page.waitForTimeout(25);
  assert(await page.evaluate(() => document.body.dataset.theme) === "light", "Setup string without theme did not fall back to Light.");

  await openSetupPanel(page);
  await page.fill("#templateInput", encodeSetupString({ ...lightPayload, theme: "dark" }));
  await page.click("#loadTemplates");
  await page.waitForTimeout(25);
  assert(await page.evaluate(() => document.body.dataset.theme) === "blackout", "Legacy Dark setup theme did not map to Operator Blackout.");

  await openSetupPanel(page);
  await page.fill("#templateInput", encodeSetupString({ ...lightPayload, theme: "pink" }));
  await page.click("#loadTemplates");
  await page.waitForTimeout(25);
  assert(await page.evaluate(() => document.body.dataset.theme) === "blackout", "Legacy Dusk setup theme did not map to Operator Blackout.");

  await openSetupPanel(page);
  await page.fill("#templateInput", encodeSetupString({ ...lightPayload, theme: "frog" }));
  await page.click("#loadTemplates");
  await page.waitForTimeout(25);
  assert(await page.evaluate(() => document.body.dataset.theme) === "blackout", "Legacy Frog setup theme did not map to Operator Blackout.");

  await openSetupPanel(page);
  await page.fill("#templateInput", encodeSetupString({ ...lightPayload, theme: "unknown-theme" }));
  await page.click("#loadTemplates");
  await page.waitForTimeout(25);
  assert(await page.evaluate(() => document.body.dataset.theme) === "light", "Unknown setup theme did not fall back to Light.");

  await runCurrentPieceDragSmoke(page);
  await assertNoStorageResidue(page);
}

async function runWidthSmoke(browser, baseUrl, width, options = {}) {
  const context = await browser.newContext({ viewport: { width, height: 720 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await installClipboardStub(page);

  const consoleMessages = [];
  const requestedUrls = [];
  page.on("console", message => consoleMessages.push(`${message.type()}: ${message.text()}`));
  page.on("request", request => requestedUrls.push(request.url()));

  if (options.core) {
    await runCoreFlow(page, baseUrl, width);
  } else {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await assertInfoTips(page, width);
    await openSetupPanel(page);
    await page.fill(
      "#templateInput",
      "CALL START// verified greeting// explained options// status noted// callback promised// follow-up note// CALL END"
    );
    await page.click("#loadTemplates");
    assert(
      await page.locator("#noteBlockLibrary").evaluate(node => node.classList.contains("is-collapsed")),
      `Optional reusable phrases should start collapsed at ${width}px.`
    );
    assert(
      await page.locator("#toggleNoteBlockLibrary").textContent() === "Show phrases",
      `Reusable phrase toggle label was wrong at ${width}px.`
    );
    await page.click("#toggleNoteBlockLibrary");
    await assertReusablePhraseLayout(page, width);
    await page.locator(".piece-button").first().click();
    await page.fill("#customDetail", "width smoke detail");
    await page.click("#addDetail");
    await page.locator(".current-edit").last().click();
    await page.fill(".current-piece-editor", "width smoke detail edited");
    await page.press(".current-piece-editor", "Enter");
    const setupBeforeSave = await page.evaluate(() => setupPayload());
    assert(
      !JSON.stringify(setupBeforeSave).includes("width smoke detail edited"),
      `Current piece leaked into setup before Save Full Template at ${width}px.`
    );
    await page.click("#saveBuiltTemplate");
    assert(
      await page.locator("#templateCount").textContent() === "2",
      `Save Full Template did not add a reusable template at ${width}px.`
    );
    const setupAfterSave = await page.evaluate(() => setupPayload());
    assert(
      JSON.stringify(setupAfterSave).includes("width smoke detail edited"),
      `Explicitly saved built template was missing from setup at ${width}px.`
    );
    await page.click("#dockEditNote");
    await page.fill("#dockNoteEditor", "CALL START// saved while edit open// CALL END");
    await page.click("#saveBuiltTemplate");
    assert(
      await page.locator("#templateCount").textContent() === "3",
      `Save Full Template should save a valid open edit at ${width}px.`
    );
    assert(
      await page.locator("#dockNoteEditor").evaluate(node => node.classList.contains("is-open")),
      `Saving from open edit should not close edit mode at ${width}px.`
    );
    const setupAfterOpenEditSave = await page.evaluate(() => setupPayload());
    assert(
      JSON.stringify(setupAfterOpenEditSave).includes("saved while edit open"),
      `Open edited note was missing from setup after explicit save at ${width}px.`
    );
    await page.locator("#resizeDockPreview").press("End");
  }

  await assertCurrentPieceLayout(page, width);
  await assertBlackoutSidecarTargets(page, width);
  const metrics = await assertNoOverflow(page);
  await assertNoClipboardRead(page);
  const storage = await assertNoStorageResidue(page);

  const origin = new URL(baseUrl).origin;
  const external = requestedUrls.filter(url => !url.startsWith(`${origin}/`));
  assert(external.length === 0, `Unexpected external requests at ${width}px: ${external.join(", ")}`);
  assert(consoleMessages.length === 0, `Console messages at ${width}px: ${consoleMessages.join(" | ")}`);

  await context.close();
  return { ...metrics, storage };
}

async function runThemeSmoke(browser, baseUrl) {
  const context = await browser.newContext({ viewport: { width: 390, height: 720 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await installClipboardStub(page);
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await openSetupPanel(page);
  await page.fill("#templateInput", "CALL START// verified greeting// explained options// CALL END");
  await page.click("#loadTemplates");
  await page.locator(".template-edit-in-dock").first().click();
  await openQuickFormSetup(page);
  await page.fill("#quickFormTitle", "General request");
  await page.fill("#quickFormBody", "Item:\nContext:\nReason:\nNext step:");
  await page.click("#addQuickForm");

  const themeResults = [];
  for (const theme of themes) {
    await page.click(theme.button);
    await page.waitForTimeout(25);
    themeResults.push(await themeContrastResult(page, theme.name));
  }
  const failures = themeResults.flatMap(result => result.failures);
  assert(failures.length === 0, `Theme contrast failures: ${failures.join("; ")}`);
  await assertNoClipboardRead(page);
  await assertNoStorageResidue(page);
  await context.close();
  return themeResults;
}

(async () => {
  const server = await createServer();
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/`;
  const launchOptions = fs.existsSync(chromePath)
    ? { headless: true, executablePath: chromePath }
    : { headless: true };
  let browser;

  try {
    browser = await chromium.launch(launchOptions);
    const results = [];
    for (const width of sidecarWidths) {
      results.push(await runWidthSmoke(browser, baseUrl, width, { core: width === 390 }));
    }
    const themeResults = await runThemeSmoke(browser, baseUrl);
    console.log("WrapDeck regression smoke passed.");
    results.forEach(result => {
      console.log(`${result.width}px: scrollWidth=${result.scrollWidth} copyDisabled=${result.copyDisabled} storage=clean`);
    });
    themeResults.forEach(result => {
      const lowest = result.ratios.reduce((min, item) => Math.min(min, item.ratio), Number.POSITIVE_INFINITY);
      console.log(`${result.theme} theme: lowest sampled contrast ${lowest}:1`);
    });
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(`WrapDeck regression smoke failed: ${error.message}`);
  process.exit(1);
});
