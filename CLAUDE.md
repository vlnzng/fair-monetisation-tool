# Fair Monetisation Risk Assessment Tool

## Project

Static web tool from Valentin Lenzing's master's thesis (TH Brandenburg, 2026).
Twelve guided questions in four risk domains lead to a concern level
(minimal, moderate, elevated). It flags areas to review. It never gives a legal verdict.

- Live: https://fair-monetisation.valentinlenzing.com (hosted on Vercel,
  also reachable at https://fair-monetisation-tool.vercel.app)
- Tag `v1.0-thesis` is the version submitted with the thesis. Never move or delete it.
  Appendix A of the thesis specifies the scoring of that version.
- Goal now: a standalone, maintained project that also shows how Valentin works
  (portfolio, GitHub), no longer only a thesis artefact.

## Stack

HTML, CSS and vanilla JavaScript (ES modules). The shipped site has no framework,
no build step and no runtime dependencies. Development tooling (tests, CI, config)
may be added when it clearly improves the project. Nothing unnecessary.

| File                   | Purpose                                                |
| ---------------------- | ------------------------------------------------------ |
| `index.html`           | Page structure and static copy                         |
| `css/styles.css`       | All styles, tokens in `:root`                          |
| `js/app.js`            | Flow, rendering                                        |
| `js/scoring.js`        | Question selection, scoring (`runAssessment`), no DOM  |
| `js/data/questions.js` | Questions, help texts, severities                      |
| `js/data/rules.js`     | Thresholds, multipliers, hard triggers, review prompts |
| `js/utils.js`          | Small helpers                                          |
| `tests/scoring.test.js`| Tests that pin the scoring behaviour                   |
| `package.json`         | Test script only, no dependencies                      |
| `.vercelignore`        | Keeps dev files out of the deployment                  |
| `.github/workflows/`   | Runs the tests on push to `main` and on pull requests  |

Run locally: `python3 -m http.server 8080`, then open http://localhost:8080

Run tests: `npm test` (Node 24 or newer, no dependencies). Run them after
every change to `js/scoring.js` or `js/data/`.

## How we work

- Valentin makes the decisions. Propose, do not decide.
- Before changing question wording, severities, thresholds or scoring rules:
  explain the change and its effect on results, then wait for his OK.
- One topic per change. Keep diffs small. Do not touch files outside the task.
- If code and documentation disagree, say so instead of silently fixing one of them.
- Code comments: short, and only where the code does not explain itself.
- This is a showcase project on its way to 2.0. Clear and clean beats perfect.
  Small problems can wait for the next clean-up.
- The README may name logic, sections and sources from the thesis.
  Clarity and references come first.

## Git

- Claude prepares the changes, splits them into commits and commits them on `main`.
  A separate `dev` branch only if Valentin asks for one.
- Push only after Valentin has approved the commits.
- Never run `git tag` or anything that rewrites history. Valentin tags.
- After committing, summarise each commit in one to three lines.
- No attribution lines of any kind (no Co-Authored-By, no "Generated with").

Commit format: `type: summary`

- English, imperative, lowercase, no full stop, 60 characters at most
- No body unless the reason is not obvious from the summary
- One logical change per commit

| Type      | Use for                                       |
| --------- | --------------------------------------------- |
| `feat`    | New behaviour or a new section                |
| `fix`     | Something worked wrongly and now works        |
| `style`   | Visual changes only (CSS, layout, typography) |
| `content` | Wording of questions, help texts, page copy   |
| `docs`    | README and other documentation                |
| `refactor`| Restructuring code without changing behaviour |
| `test`    | Adding or changing tests                      |
| `chore`   | Setup, config, housekeeping                   |

Examples:

- `fix: apply context multipliers before rounding`
- `style: replace violet accent with neutral palette`
- `content: simplify wording of block A questions`
- `docs: document overall scoring rules`

## Quality bar

- Accessible: keyboard usable, visible focus, proper labels, contrast AA,
  never colour as the only signal.
- Works on mobile and desktop. Check in a Chromium browser and in Firefox.
- No tracking. Aim for no external requests at all.
- The tool must not use the pressure patterns it assesses
  (no urgency, no manipulative button hierarchy).

## Open points (not decided yet)

- Multipliers are rounded per question, so the 1.10 factors never change the overall
  result. The formula in thesis appendix A.3 has no rounding. Decide together with the thresholds.
- Thesis section 8.2 names misleading limited-time claims as a hard trigger.
  The code has only one hard trigger (child-directed urging, D1).
- Review prompts are tied to the domain, not to the question that triggered them.
- With minors = no, D1 = no does not fire the hard trigger. Block D then reaches
  moderate at most, and the overall result can stay minimal.
- The URL hash is removed on load, so links to a section do not work from outside.
- No Content-Security-Policy yet.
- Answers are lost on reload. Keeping them in `sessionStorage` would be a new feature.
- The repository has no licence file.
