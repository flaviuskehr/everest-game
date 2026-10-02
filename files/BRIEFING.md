# Briefing: "Everest, Together" – live voting game for an online team summit

## 1. Goal and context

Build a small web app for a **15-minute warm-up game** in an online team summit (about **50 participants**, one new manager in the room). The team "climbs Mount Everest" through a **branching story**. At each decision point everyone votes on their own device (A or B). The host closes the vote, the winning option decides which story node comes next. Underneath the fiction, the questions reveal work styles (planning vs improvising, feedback timing, check-ins, collaboration formats, continuity vs change).

Deliverables:

1. A static front end deployed on **GitHub Pages**.
2. **Realtime voting** for all participants on the page itself, plus a **host view** to close voting and advance.
3. The whole story lives in one **`story.md`** that I edit by hand. The app reads it **at runtime**. No rebuild is needed for story changes.
4. An Everest-themed design with **one picture per story step**.

A ready-to-use first version of `story.md` is included alongside this briefing. Use it as is, only filling in image paths and credits.

## 2. Decisions you must respect (and why)

| Topic | Decision | Reason |
|---|---|---|
| Hosting | GitHub Pages, **no build step**: plain HTML, CSS and ES-module JavaScript. | Pages is static, and no build makes `story.md` edits trivial. |
| Realtime backend | **Firebase Realtime Database** with the modular Firebase JS SDK loaded from the official CDN. | GitHub Pages cannot store votes. A static site needs an external realtime service. Firebase has a free tier and needs no server code. Supabase Realtime is an acceptable alternative if you have a strong reason, but say so before switching. |
| Participant identity | **Firebase Anonymous Auth.** No names, no login for participants. | Keeps votes anonymous and one vote per device/browser. |
| Host identity | **Firebase Email/Password Auth** with one host account. Security rules only allow that account (identified by email or UID in the rules) to change session state. | A client-side PIN can be read from the source code. Do not use a PIN as the only protection. |
| Votes are anonymous | Nobody, including the host, can see who voted what. Store only aggregate-friendly data. | The new manager is in the room. Sensitive questions (feedback, disagreement, change) must be safe to answer honestly. |
| Story source | `story.md`, fetched with `fetch('story.md?t=' + Date.now())`. | Avoids stale browser caches after edits. |
| Images | **Download into the repo** (`/images`), never hotlink. Credits are shown in the UI. | Hotlinking breaks, can be blocked, and ignores licenses. |
| Tie handling | Majority wins automatically. If the split is within **5 percentage points** or exactly equal, the host must pick the branch. The host can always override. | Prevents a stalled game and keeps the host in control. |
| Language | UI and story in **English**. UI strings in one `strings.js` object so they can be translated. | |

## 3. Features

### 3.1 Participant view (`index.html`, default)

- Join by opening the URL. A session code in the URL (`?s=summit`) selects the session. Default is `summit`.
- Shows: current node **image**, **title**, **story text**, and when a question is open, two large **A / B buttons**.
- Voting: one vote per participant per question. They can **change their vote while voting is open**. After the host closes voting, buttons are disabled and the **result bars** (percent and count) are shown with the winning option highlighted.
- Waiting states: "Waiting for the host…" before the first node and between nodes.
- Mobile first. Large tap targets, readable on a phone, works on desktop.
- Shows a small footer with the participant count ("34 online") using Firebase presence.

### 3.2 Host view (`host.html`)

- Login with the host email/password (Firebase Auth). Keep the login form minimal.
- Shows the same story content as participants, plus controls:
  - **Start / Next** for story-only nodes (`next:`).
  - **Close voting** for question nodes, with a **live vote count** (A, B, total votes vs participants online) while open.
  - After closing: shows the result and the **proposed winner**. One button "Continue to: *<target node title>*". If it is a tie (see section 2), show both options as buttons "Go with A" / "Go with B".
  - **Reopen voting** (undo a premature close) and **Back** (step to the previous node) for mistakes.
  - **Reset session**: clears votes and history for a clean rehearsal.
  - **Reload story**: refetches and re-parses `story.md` without ending the session. The current node id is kept if it still exists, otherwise show a clear warning.
- Shows the **path so far** (breadcrumb) and a **QR code** plus the join URL for participants (generate the QR code client side, with a small library from a CDN or a minimal inline implementation).
- **Presenter mode toggle**: hides controls and enlarges text, image and result bars so the host can screen-share the page as the main slide.

### 3.3 Final summary (at an `end: true` node)

Shown on both views, generated automatically from stored results:

- The ending title and text.
- A compact list of all questions played with their A/B percentages.
- The **"storm line"**: highlight the question with the **closest split** ("Closest call: *<question>*, 52% vs 48%"). It is the most useful discussion starter for the first agenda item.
- Do not show individual-level data. There is none.

### 3.4 Story check page (`check.html`)

A small page that loads `story.md` and reports, so last-minute edits don't break the game live:

- Parse errors with line numbers.
- Nodes referenced as targets but not defined.
- Nodes that are defined but not reachable from `start`.
- Question nodes without exactly two options, non-end nodes without a way forward.
- Missing image files (try loading each `image:` path).
- A visual map of the graph (a simple indented tree is fine) and a "walk through" mode to click through every path without Firebase.

## 4. `story.md` format and parser rules

Plain Markdown that is easy to edit by hand. Parse it with a **small custom parser** (no heavy dependency). For **bold/italic** in text, use a tiny markdown renderer or a small CDN library such as `marked`, with output **sanitized** (for example DOMPurify) before inserting it into the page.

```
---
title: Everest, Together
subtitle: A team expedition.
start: intro
---

## node-id | Short title
image: images/xyz.jpg
credit: Photo by Name, License, source URL
hint: free-text search hint (ignored by the app)

Story text, one or more paragraphs. **Bold** and *italic* allowed.

? Question text shown above the buttons
A: Label of option A => target-node-id
B: Label of option B => target-node-id
```

Rules:

- A node starts with `## id | title`. The id is lowercase letters, digits and hyphens.
- Lines directly after the heading, up to the first blank line, are `key: value` metadata. Known keys: `image`, `credit`, `hint`. Unknown keys are kept and ignored.
- The text runs until the first line that starts with `? `, `next:` or `end:`.
- A node has **exactly one** of: a question (`?` plus exactly two options `A:` and `B:` with `=> target`), `next: target-id`, or `end: true`.
- Front matter keys: `title`, `subtitle`, `start`.
- HTML comments `<!-- ... -->` are ignored anywhere.
- The parser must be **forgiving about whitespace** and **strict about structure**: report precise errors with line numbers in the check page, and show a readable error screen (not a blank page) if the file is invalid.
- No conditional logic or state variables. The story is a pure graph. Where the same situation needs different text depending on the earlier path, the story duplicates the node (as `d4p` / `d4i` in the sample).

## 5. Data model (Realtime Database)

```
/sessions/{sessionId}
    currentNode: "d2a"
    status: "open" | "closed" | "story"     // story = node without question
    winner: "A" | "B" | null                // set when closed
    path: [ {node: "d1", winner: "A", countA: 31, countB: 17}, ... ]   // history
    round: 3                                // increments when a node is entered or reopened
/votes/{sessionId}/{nodeId}/{round}/{uid}: "A" | "B"
/presence/{sessionId}/{uid}: true           // removed with onDisconnect
```

Notes:

- Include `round` in the vote path so that **reopening** or **Back** never mixes old and new votes.
- Participants count votes via a listener on `/votes/{sessionId}/{nodeId}/{round}`. With 50 people this is fine. The host writes the final counts into `path` when closing, so that the summary does not depend on re-reading votes.
- Participants only see **aggregate counts after close**. While open, they see nothing about others' votes (avoids anchoring). The host may see live counts.

### Security rules (starting point, review before use)

- `sessions/*`: **read** for any authenticated user. **Write** only if `auth.token.email === '<HOST_EMAIL>'` (or the host UID).
- `votes/{sid}/{node}/{round}/{uid}`: **write** only if `auth.uid === $uid`, value is `'A'` or `'B'`, and `sessions/{sid}/status === 'open'`, `currentNode === node`, `round === round`. **Read** for authenticated users, but participants should only rely on aggregates after close. (Realtime Database cannot return aggregates only. Votes carry no identity beyond an anonymous UID, which is acceptable here.)
- `presence/{sid}/{uid}`: write only if `auth.uid === $uid`.
- Provide the final rules as `database.rules.json` in the repo, plus a short README section on how to deploy them (Firebase console is fine, no CLI required).

## 6. Design: Mount Everest theme

- **Mood:** alpine and cinematic. A full-bleed photo per step, with a dark gradient overlay so text is readable, in a calm, expedition-journal style.
- **Palette (CSS variables):** snow white `#F4F7FA`, glacier blue `#7FB3D5`, deep night blue `#0B1F33`, rock grey `#4A5560`, sunrise orange `#E8743B` (accent for the primary action), prayer-flag colors (blue, white, red, green, yellow) used sparingly for small decorations such as a flag-line divider.
- **Typography:** a strong serif or slab for titles (for example *Fraunces* or *Playfair Display*), a clean sans for body text (for example *Inter*). Load from Google Fonts with sensible fallbacks.
- **Components:**
  - Hero image with title overlay and a subtle slow zoom (respect `prefers-reduced-motion`).
  - **Progress indicator as a mountain profile:** an inline SVG ridge line with a small marker (a flag or climber) that moves along it as steps progress. Position it by the length of the **path so far** (e.g. step N of ~5), not by node ids.
  - A/B buttons as two big cards ("Route A" / "Route B") with clear hover/focus and pressed states.
  - Result bars as horizontal "altitude bars" with percent and count.
- **Accessibility:** WCAG AA contrast on all text over images, keyboard operable, buttons with real `<button>` elements, visible focus states, `aria-live` for status changes ("Voting closed").
- **Performance:** each image max about 1600 px wide, JPEG or WebP, under about 300 KB. Lazy-load, but **preload the images of the next possible nodes** (both options) so transitions are instant on slow networks.
- **Fallback:** if an image is missing, show a CSS gradient mountain silhouette instead of a broken image.

## 7. Images

Each node has an `image:` path and a `hint:` in `story.md`. Find suitable pictures yourself:

1. Use **Wikimedia Commons** (API search) or other sources with clear licenses (public domain, CC0, CC BY, CC BY-SA). **Avoid** images with unclear or non-commercial-only licenses.
2. **Download** each image into `/images`, name it as in `story.md`, resize and compress it.
3. Fill in the node's `credit:` line (author, license, source URL). The app shows the credit as a small caption over the image corner.
4. Generate `CREDITS.md` listing every image with author, license and link.
5. Several nodes may reuse one image (the sample reuses the summit image for all endings). Don't spend effort finding 20 unique photos.
6. If your sandbox has no network access to image sources, **don't fake it**. Leave the placeholder (`credit: TODO`) and the CSS fallback in place, and list in your final report exactly which images are missing, with the `hint:` text, so I can add them by hand.
7. Literal subject matches are not always possible (a bear on a ridge, a climber in a crevasse). Choose a clearly **atmospheric** alternative that fits the mood rather than a poor literal match.

## 8. Repository structure

```
/
├─ index.html          participant view
├─ host.html           host view
├─ check.html          story check page
├─ story.md            the story (user-edited)
├─ css/style.css
├─ js/
│   ├─ app-participant.js
│   ├─ app-host.js
│   ├─ story-parser.js   shared, pure functions, unit-testable
│   ├─ firebase.js       init + auth helpers (config from firebase-config.js)
│   ├─ firebase-config.js   public web config, filled in by me
│   └─ strings.js
├─ images/
├─ database.rules.json
├─ CREDITS.md
└─ README.md
```

- `story-parser.js` must work in both browser and Node, so it can be tested with a few unit tests (`node --test`) against `story.md` and some malformed samples.
- Firebase web config values are **public by design**. Safety comes from the security rules, not from hiding the config. Do not commit the host password anywhere.

## 9. Deployment

- Deploy from the `main` branch, root folder, using the GitHub Pages setting (no Actions needed). If you prefer a GitHub Action, keep it minimal.
- After a push, Pages needs **1 to 2 minutes** to update. Document this in the README under "Last-minute story changes": edit `story.md` on GitHub, commit, wait about 2 minutes, press **Reload story** in the host view.
- Also support `?story=other.md` so I can keep a backup or alternative story file (for example `story-short.md`) and switch without code changes.
- README must contain a **step-by-step manual setup** for the parts only I can do:
  1. Create a Firebase project (choose an **EU region** for the Realtime Database).
  2. Enable Realtime Database, Anonymous Auth and Email/Password Auth.
  3. Create the one host user. Paste the host email into the rules.
  4. Paste the web app config into `js/firebase-config.js`.
  5. Publish `database.rules.json`.
  6. Enable GitHub Pages.
  Include a **troubleshooting** section (blocked storage, Firebase quota, auth domain must include `<user>.github.io`).

## 10. Acceptance criteria

1. Opening `index.html` on two phones and one laptop shows the same node within about 1 second of the host advancing.
2. 50 simulated participants (a small Node script with the Firebase SDK, or a load test page using anonymous auth) can all vote, and the host sees the correct live count.
3. A participant can change their vote while open, and cannot vote after close (enforced by **rules**, not only by the UI).
4. A non-host user cannot change `currentNode`, `status` or `winner` (verify with a quick rules test).
5. Closing, reopening and Back never mix votes of different rounds.
6. The full graph in the sample `story.md` can be played from `intro` to every one of the 4 endings without errors. The check page confirms 0 errors, 0 unreachable nodes.
7. Editing `story.md` (change a text, add a node) shows up after a push plus **Reload story**, with no code change.
8. A broken `story.md` yields a clear error screen with a line number, and the host session is not corrupted.
9. Works on current Chrome, Safari (iOS) and Firefox, and is usable on a 360 px wide screen. Lighthouse accessibility score of 90 or higher.
10. The ending screen shows the path summary and the closest-split ("storm line") correctly for a manual test run.

## 11. Out of scope

- Participant names, profiles or any personal data. No analytics or tracking scripts.
- Multi-language switching in the UI (only keep strings in one file).
- Persisting results beyond the session (the host may copy the summary from the final screen, a "Copy summary as text" button is welcome).
- Fancy animations. Clarity and reliability on a shared screen count more than effects.

## 12. How to work

1. Start with the **parser plus check page**, then the **Firebase data flow** (host and participant), then **design and images**, and last **deployment and README**.
2. Before writing code, **confirm the architecture back to me in a short plan** (files, data flow, rules). Ask me only about things that block you.
3. Keep dependencies to a minimum (Firebase SDK, a small markdown renderer plus sanitizer, a QR library).
4. At the end, report: what works, what you tested, which images are missing or have uncertain licenses, and which manual setup steps remain on my side.
