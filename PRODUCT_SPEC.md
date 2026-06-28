# WrapDeck Product Spec

## Problem

Call center workers may have little or no after-call time. Notes must be
assembled during the call, then pasted immediately into the official work
system. WrapDeck is a temporary sidecar for assembling plain-text notes, not a
system of record.

## Core Flow

1. Open the WrapDeck site. The session is empty.
2. Paste one or more operator-provided templates intended for approved phrases,
   or paste a manual WrapDeck setup string beginning with `WDSTRING_V1:`.
3. Load reusable workbench state into the current tab session.
4. Use a Full Template as the primary fast path:
   - `Copy as is` copies a valid parsed Full Template after explicit user
     action.
   - `Edit in dock` loads the template into the fixed dock editor for temporary
     editing.
5. Use Build As You Go for weird calls or partial notes: type note pieces, paste
   a complete Full Template/full note to replace the current note, press Enter,
   scan/move/remove/edit the current pieces, and optionally save a useful
   generated note as a reusable Full Template for the current session. Optional
   reusable phrases, historically called Note Blocks, remain a collapsed
   fallback for phrase browsing.
6. Use Quick Forms as a separate lane from the primary call-note pipeline.
   `Copy Quick Form` copies only the active Quick Form text.
7. Use Scratchpad as a temporary call-time reference surface, optionally snapped
   into Build As You Go.
8. Use saved non-call reference text only for reusable setup/reference material.
9. Choose `Call Ended` or `Transferred To` and provide a transfer destination.
10. Use the fixed bottom dock as the unified finish surface for the current call
   note. It owns preview/editing, ending controls, transfer destination, New
   Call, and `Copy Valid Note`.
11. Copy the valid generated or edited call note as plain text.
12. Start a new call, which clears current call state and active Quick Form
    content while preserving reusable workbench templates.

## Required Rules

- Every note starts with the configured session start phrase. The default is
  `CALL START//`.
- Every note ends with exactly one valid ending:
  - the configured ended phrase; default `// CALL END`
  - the configured transfer phrase plus a destination; default `// TRANSFER TO <destination>`
- A transfer destination is required before copying.
- The start phrase, ended phrase, and transfer phrase are changeable for the
  current browser session.
- Templates, Quick Forms, Note Blocks, Scratchpad text, and notes never persist
  between browser-tab sessions.
- `WDSTRING_V1` restores reusable workbench state only. It may restore saved
  non-call reference text and Full Templates that the user explicitly saved from
  Build As You Go. It must not automatically restore current-call note content,
  scratchpad text, transfer destinations, active Quick Form content, clipboard
  contents, history, storage, backend data, or network state.
- Reusable phrase buttons deduplicate harmless case, punctuation, spacing, and separator differences.
- Reusable phrase buttons can be hidden for the current session without mutating
  loaded template text.
- Current note pieces can be edited inline without mutating Full Templates,
  Quick Forms, reusable phrases, or setup strings. The edited current note still
  disappears on New Call, refresh, or tab close unless the user explicitly saves
  the whole built note as a Full Template.
- Pasting a complete Full Template into Build As You Go replaces the current
  note pieces and ending state only. It does not mutate the loaded Full Template
  deck or setup-string schema.
- Similar but potentially compliance-distinct wording is never fuzzy-merged.
- Temporary dock edits must preserve the required start and ending.
- Copied edited notes are normalized to one plain-text line for the official system.
- A session supports up to 100 templates, 300 reusable phrases, and 300 current-note pieces to prevent accidental browser lockups.
- Leaving or refreshing with session data present triggers the browser's unsaved-work warning.
- Clearing the entire session requires a second click.
- The working UI must reflow without horizontal scrolling at a 240 CSS-pixel viewport.
- Compact side-window mode keeps optional reusable phrases two-up when space allows, shortens secondary labels, hides explanatory copy, and keeps New Call/Copy reachable.
- Compact `?` tips keep Board Setup, Build As You Go, Scratchpad, Saved
  Reference, Full Templates, Board tools, and Quick Forms details available
  without forcing long helper paragraphs into the default rail.
- Very skinny sidecar mode below 340 CSS pixels switches reusable phrases to one
  column and tightens chrome so the app can sit beside other work windows.
- Every stacked layout through 900 CSS pixels uses compact companion mode; the full layout is capped at 1120 CSS pixels.

## Privacy Rules

- The loaded page makes no network requests after the initial HTML download.
- Content Security Policy blocks script-initiated network connections.
- No saving, export, autosave, analytics, crash reporting, or history.
- No reading from the clipboard.
- Clipboard writes happen only after explicit user actions. Bounded targets
  include the current call note, an active Quick Form, a setup string, Full
  Templates, Note Blocks, saved non-call reference text, and Copy as is.
- Setup strings export reusable workbench state as plain text after an explicit
  user action. They do not save to the browser, disk, backend, or network.
- Saving a Build As You Go note as a template is explicit and session-local. It
  creates a reusable Full Template, not automatic call history. Users must not
  save live customer/account details as templates.
- New Call + Clear Clipboard explicitly overwrites the clipboard.
- Deployment response headers prevent framing, referrer leakage, caching, and indexing.
- Runtime HTML, CSS, and JavaScript are first-party files protected by a CSP that does not permit inline code.
- WrapDeck must not be described as employer-approved, compliant, certified,
  secure for protected information, or suitable for protected data.

## V1 Boundaries

- Static single-page website.
- Templates are pasted as text, one per line.
- Template pieces are split on `//`.
- No AI, transcription, integrations, or automatic customer-data handling.
- No visible Section 4 or separate Review + finish surface; the fixed dock is
  the finish surface.

## Built Session Feature

### Custom Start And Ending Phrases

Status: built and deployed.

Allow the user to customize the required beginning phrase and valid ending
phrases for the current browser session.

Potential use cases:

- Different official systems may require a different note prefix than `CALL START//`.
- Different teams may use endings other than `CALL END`.
- Transfer wording may vary by queue, team, or approved script.

Important guardrails:

- Keep the feature session-only unless a separate high-reasoning privacy review
  approves persistence.
- Do not add accounts, storage, sync, or backend behavior just to remember custom
  phrases.
- Require at least one configured start phrase.
- Require at least one valid final ending before Copy is available.
- Keep transfer-style endings explicit about whether a destination is required.
- Keep manual final-note validation aligned with the configured start and ending
  rules.
- Make the default rules remain `CALL START//`, `// CALL END`, and
  `// TRANSFER TO <destination>` unless the user changes them for that session.
- Update `README.md`, `docs/WHAT_IS_WRAPDECK.md`, `privacy.html`, and
  `docs/EMPLOYER_REVIEW_PACKET.md` before deploying this feature.

Reasoning level: high. This touches validation, user workflow, documentation,
privacy promises, and employer-review wording.
