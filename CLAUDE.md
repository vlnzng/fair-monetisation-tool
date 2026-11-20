# Fair Monetisation Risk Assessment Tool

## Project

Static web tool from Valentin Lenzing's master's thesis (TH Brandenburg, January 2026).
A team answers questions about one purchase flow in their game and gets a level per area
and overall (Minimal, Moderate, Elevated), plus the answers worth a closer look.
It flags areas to review. It never gives a legal verdict.

- Live: https://fair-monetisation.valentinlenzing.com (Vercel, deploys `main`,
  also reachable at https://fair-monetisation-tool.vercel.app)
- Repository: https://github.com/vlnzng/fair-monetisation-tool
- Case study: https://valentinlenzing.com/work/fair-monetisation/
- Tag `v1.0-thesis` is the version submitted with the thesis. Never move or delete it,
  never link it on the site. Appendix A of the thesis specifies the scoring of that version.

### What the project is for

A showcase of how Valentin works as a product designer, built on his thesis research.
It looks and works like a product for small game teams, but it is not run as a
production tool. In this order:

1. The first one to two minutes convince: professional, considered design, nothing that
   looks generic or generated, clear rules, enough text to understand, never too much.
2. The core of the thesis stays recognisable. Extensions and corrections are welcome.
3. Details deep in the logic may stay open. Document them instead of perfecting them.

## Current work: v2.0 release

- Status (20 November 2026): v2 is built, reviewed (including an external review) and
  live on `main`. Next: Valentin tags `v2.0` on the release commit. After that, only
  small fixes.
- Fixes: one topic per commit (`fix`, `style`, `content`), checked before committing
  (tests, browser at all widths).
- Spec: `docs/v2/v2-spec.md`. Source of truth for design, copy, questions and scoring.
  Decisions taken during the build are recorded there. Content data:
  `docs/v2/v2-content.json`. Mockups: `docs/v2/design-reference/*.html`
  (open them in a browser to compare).
- If a decision deviates from the spec, update the spec in the same change.
- `docs/` is local only (listed in `.gitignore`) and is never committed:
  - `docs/v2/`: build spec, content file, mockups
  - `docs/thesis/Lenzing_Masterthesis.pdf`: the submitted thesis. Reference for
    anything about thesis sections (scoring spec in appendix A, pp. 110–113)
  - `docs/thesis/Abschlussposter_A2_MA_DM_Valentin_Lenzing.pdf`: the thesis poster

## Stack

HTML, CSS and vanilla JavaScript (ES modules). The shipped site has no framework,
no build step, no runtime dependencies and no CSS framework. No external requests:
fonts are self-hosted, no analytics, no cookies. Development tooling (tests, CI, config)
may be added when it clearly improves the project. Nothing unnecessary.

| File                    | Purpose                                                  |
| ----------------------- | -------------------------------------------------------- |
| `index.html`            | Page structure and static copy                           |
| `css/styles.css`        | All styles, tokens in `:root`                            |
| `js/app.js`             | State, step flow, rendering of the steps                 |
| `js/result.js`          | Result view                                              |
| `js/sketches.js`        | The example sketches                                     |
| `js/hero.js`            | Hero figure motion                                       |
| `js/link.js`            | Result link in the URL fragment, no DOM                  |
| `js/report.js`          | Plain-text report, no DOM                                |
| `js/scoring.js`         | Question selection and scoring, no DOM                   |
| `js/data/`              | Areas, questions, sources, examples, scoring rules       |
| `js/utils.js`           | Small helpers                                            |
| `tests/`                | Tests for scoring, link and report                       |
| `assets/`               | Favicon and fonts                                        |
| `docs/`                 | Local only, not in git: v2 spec, mockups, thesis         |
| `package.json`          | Test script only, no dependencies                        |
| `.vercelignore`         | Keeps dev files out of the deployment                    |
| `.github/workflows/`    | Runs the tests on push to `main` or `dev` and on PRs     |

- Run locally: `python -m http.server 8080`, then open http://localhost:8080
- Tests: `npm test` (Node 24 or newer, nothing to install). Run them after every change
  to `js/scoring.js`, `js/link.js`, `js/report.js` or `js/data/`.

## How we work

- Valentin makes the decisions. Propose, do not decide.
- Changes to question wording, points, thresholds or scoring rules beyond the spec:
  explain the change and its effect on results, then wait for his OK.
- When a decision is needed, lay it out plainly: the current state, what the thesis says,
  what the spec says, where they differ and why, then a recommendation.
- If code, spec and README disagree, say so instead of silently fixing one of them.
- One topic per change. Keep diffs small. Do not touch files outside the task.
- Code comments: short, and only where the code does not explain itself.
- Clear and clean beats perfect. Small problems can wait for the next clean-up.
- The README may name logic, sections and sources from the thesis.
  Clarity and references come first.

## Git

- Branches: `main` is live (v2). Work happens on `dev`; `main` follows by fast-forward
  when Valentin agrees, so `dev` and `main` never diverge.
- Claude prepares the changes and splits them into commits by feature or task
  (not too fine-grained). Claude checks the result itself (tests, browser at all widths),
  commits when it passes and pushes to `dev`, so the Vercel preview shows it, then reports.
  Pushes to `main` and merges wait for Valentin's OK.
- Never run `git tag` or anything that rewrites history. Valentin tags.
- After committing, summarise each commit in one to three lines.
- No attribution lines of any kind (no Co-Authored-By, no "Generated with").

Commit format: `type: summary`

- English, imperative, lowercase, no full stop, 60 characters at most
- No body unless the reason is not obvious from the summary
- One logical change per commit

| Type       | Use for                                            |
| ---------- | -------------------------------------------------- |
| `feat`     | New behaviour or a new section                     |
| `fix`      | Something worked wrongly and now works             |
| `style`    | Visual changes only (CSS, layout, typography)      |
| `content`  | Wording of questions, help texts, page copy, data  |
| `docs`     | README and other documentation                     |
| `refactor` | Restructuring code without changing behaviour      |
| `test`     | Adding or changing tests                           |
| `chore`    | Setup, config, housekeeping                        |

Examples:

- `fix: apply context multipliers before rounding`
- `style: replace violet accent with neutral palette`
- `content: simplify wording of block A questions`
- `docs: document overall scoring rules`

## Quality bar

- WCAG 2.2 AA: keyboard usable, visible focus, proper labels, contrast,
  never colour as the only signal.
- Works from 320 px up to wide desktop. Check in a Chromium browser and in Firefox.
- No tracking and no external requests.
- The tool must not use the pressure patterns it assesses
  (no urgency, no manipulative button hierarchy, no pre-selected answers).
- Blue only for action, selection, focus, the word fair in the h1 and the first bar of the mark.
- Same kind of element, same form, across the whole page (spec section 13):
  - A fill (ink or white) means a button. A choice is never filled: 2 px accent border.
  - Hover never changes a fill. Choices hover in the text colour, so hover never looks like
    the choice.
  - Every underline marks something to act on and looks the same: accent line, on hover
    text in the accent and the line 2 px. Actions stand on their own, never inside a sentence.
  - Section heads: h2, and where there is one, a small muted line directly below.
  - Exceptions only with a reason, recorded in the spec.
- Copy: plain British English, no em dashes, no all-caps labels,
  nothing that tells the reader what to change in their game.

## Open points (not decided yet)

- No Content-Security-Policy yet.
- The repository has no licence file.
- From spec section 15: the mapping of questions to legal rules is not checked against
  the legal texts; the 2026 timeline entries come from research; the share image is
  not designed.
- Small things left from the build: between 640 and about 720 px the header links wrap
  below the tool name and its mark; the countdown's wrap from 00:00 to 09:59 was not
  watched live.
