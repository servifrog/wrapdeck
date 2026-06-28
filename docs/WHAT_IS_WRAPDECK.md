# What Is WrapDeck?

WrapDeck is a small browser tool for assembling call wrap-up notes from
operator-provided templates intended for approved phrases. It helps you use Full
Templates, Note Blocks, Quick Forms, and a fixed bottom dock to build plain text
and copy bounded outputs into the official work system.

WrapDeck is intentionally simple:

- no account
- no login
- no saved history
- no analytics
- no backend
- no note uploads
- no clipboard reading
- no setup-string restore of current-call content

Everything you paste or type exists only in the current browser tab. Refreshing
or closing the tab clears the session.

## What WrapDeck Is For

Use WrapDeck when you already have intended note wording and need to assemble it
quickly during or after a call.

It is good for:

- using Full Templates for complete notes
- loading a Full Template into Build As You Go when the note needs shaping
- keeping optional reusable phrases available as a fallback
- using separate Quick Forms for bounded handoff text
- typing current-call note pieces quickly
- scanning, moving, removing, and editing the current note pieces
- saving a useful built note as a reusable Full Template for this session
- choosing a valid ending before copying
- making sure copied notes stay one plain-text line

## What WrapDeck Is Not

WrapDeck is not:

- approval to use protected customer/account information
- a replacement for employer policy
- a CRM integration
- a storage system
- a compliance guarantee
- a secure vault
- a tool that hides activity from employer-managed devices, browsers, networks,
  screenshots, extensions, or work systems

Do not enter customer, account, or protected information into WrapDeck. Keep
that information in approved systems and approved workflows.

## How To Use WrapDeck

1. Open:

```text
https://wrapdeck.app
```

2. Paste templates into the template box.

Paste one template per line. The exact start and ending phrases are configurable
for the current browser tab. Public examples use generic phrases.

Harmless fake example:

```text
CALL START// verified greeting// explained options// CALL END
```

Example shape:

```text
Template name: CALL START// example phrase// example detail// CALL END
Transfer name: CALL START// example phrase// example detail// TRANSFER TO destination
```

The text before `: CALL START//` becomes the button name when using matching
session rules. If there is no name, WrapDeck uses the note text to create one.

Optional session rules:

WrapDeck defaults to:

- start phrase: `CALL START`
- ended phrase: `CALL END`
- transfer phrase: `TRANSFER TO`

You can change those phrases in Session setup and press `Apply Rules`. Custom
rules apply only to the current browser tab. Refreshing, closing the tab, or
clearing the entire session returns the defaults.

3. Load the templates.

Session setup also accepts a manual WrapDeck setup string beginning with
`WDSTRING_V1:`. Setup strings restore reusable workbench state only; they do not
restore the current call note, Scratchpad text, transfer destination, or active
Quick Form content. They may restore saved non-call reference text that the user
explicitly chose to keep with the setup.

After templates load, WrapDeck creates:

- Full Template cards
- reusable Note Blocks
- a blank current note

4. Build the current note.

Use Full Templates as the primary fast path. `Copy as is` copies a valid parsed
Full Template after an explicit user action. `Edit in dock` loads the template
into the fixed dock editor for temporary editing.

Use Build As You Go when a Full Template is not enough. Type a note piece or
paste a complete Full Template/full note, press Enter, then scan, move, remove,
or edit the pieces in the current note. Pasted Full Templates replace the
current note pieces and ending state for this call only. Optional reusable
phrases remain available when you want to browse saved phrase buttons. WrapDeck
supplies the
`//` separators when those buttons add phrases.

The visible rail keeps labels short. Use the compact `?` tips when you need the
specific setup, scratchpad, saved-reference, template, or Quick Form boundary
without expanding more instructional text.

Use `Save Full Template` in the dock only when the generated current note should
become reusable Full Template text. If you later copy a setup string, that saved
template can travel with the reusable board. Do not save live customer/account
details as templates.

Use the Scratchpad tab on Build As You Go when temporary call notes need to stay
beside the detail box. Scratchpad text remains temporary and excluded from setup
strings.

Use saved non-call reference text for reusable reference wording only. It is
copyable after an explicit click and restored by setup strings.

Use the `x` beside a Note Block to hide that button for the current session.
This does not edit the loaded template text.

5. Add a one-off detail if needed.

Use `Add Detail` for a phrase that belongs only to the current note. Keep it
short and use approved wording.

6. Choose the ending.

Pick one ending:

- a call-ended phrase, such as `CALL END`
- a transfer phrase, such as `TRANSFER TO ...`

For transfers, enter the destination before copying.

7. Review the current call note.

The fixed bottom dock is the finish surface for call notes. `Copy Valid Note`
stays unavailable until the note has:

- the configured start phrase
- at least one useful note piece
- one configured valid ending

Quick Forms are separate from call notes. `Copy Quick Form` copies only the
active Quick Form text.

8. Copy the note.

Use Copy only after reviewing the generated current call note. Paste it into the
official work system.

9. Start the next call.

Use `New Call` to clear the current note and active Quick Form content while
keeping reusable workbench templates available for the current browser session.

Use `New Call + Clear Clipboard` when you also want WrapDeck to attempt to clear
the clipboard.

## Temporary Final-Note Edit

Use `Edit note` in the fixed dock when the generated note needs a one-off
adjustment.

Temporary final-note edit:

- starts from the generated valid note
- does not change templates, Quick Forms, or reusable phrases
- still requires the configured start phrase
- still requires one configured valid ending
- copies as one plain-text line

Use `Close Edit + Restore Generated` to discard the manual edit and return to
the button-built note.

## Session Rules

WrapDeck is session-only.

- Refreshing clears templates, Quick Forms, Note Blocks, Scratchpad text, and
  current notes.
- Refreshing clears custom start and ending phrases.
- Refreshing clears hidden Note Block choices.
- Closing the tab clears templates, Quick Forms, Note Blocks, Scratchpad text,
  and current notes.
- Closing the tab clears custom start and ending phrases.
- Closing the tab clears hidden Note Block choices.
- WrapDeck does not recover lost sessions.
- WrapDeck does not save your templates for next time.
- The responsive layout is tested down to 240px wide for ultra-skinny
  side-window use.

If you need the same templates later, keep them in an approved place outside
WrapDeck and paste them again next session.

## Themes

WrapDeck themes are only visual. They do not change how notes are processed.

Theme choices are session-only and are not saved after refresh or tab close.

## Safety Reminders

- Test with fake or non-sensitive text.
- Use only approved wording for real workflows.
- Do not paste customer, account, or protected information into WrapDeck.
- Keep customer, account, and protected information in approved systems.
- Do not describe WrapDeck as approved, compliant, secure for protected
  information, or integrated with a work system unless those statements have
  been formally approved.

## Where To Get Help Or Send Feedback

- Privacy or security questions: `privacy [at] wrapdeck.app`
- General feedback: `feedback [at] wrapdeck.app`
