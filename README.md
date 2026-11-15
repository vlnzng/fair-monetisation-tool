# Fair Monetisation Risk Assessment Tool

A guided self-check for monetisation UX in video games. Twelve questions in four risk domains lead to a concern level (minimal, moderate or elevated) and a short list of areas to review.

The tool flags things that deserve a second look. It does not give a legal verdict and does not certify compliance or fairness.

**Live:** https://fair-monetisation.valentinlenzing.com

It started as the practical part of the master's thesis *Fair Monetisation in Video Games: Navigating UX Design Between Dark Patterns and EU Regulations* (Valentin Lenzing, Brandenburg University of Applied Sciences, 2026) and is now maintained as a standalone project.

## How it works

1. **Context.** Are minors an intended or relevant audience for the product?
2. **Questions.** Twelve questions, answered with Yes, No or Unsure, based on what can be observed in the interface.
3. **Results.** An overall concern level, a level per domain, areas to review, and a short report to copy or print.

| Block | Domain                                          |
| ----- | ----------------------------------------------- |
| A     | Price transparency and virtual currency clarity |
| B     | Consent and transaction control                 |
| C     | Choice architecture and decision pressure       |
| D     | Minors and safeguards                           |

Everything runs in the browser. There is no tracking, no cookie and no external request, and the answers never leave the page.

## How the result is calculated

Severities live in `js/data/questions.js`, thresholds and factors in `js/data/rules.js`, the logic in `js/scoring.js`.

1. **Points per answer.** Yes counts 0, Unsure 1, No 2 or 3. The question on direct urging of minors (D1) counts 2 for Unsure and 5 for No.
2. **Context factor.** Each weighted answer is rounded to a whole number.

   | Minors in the audience | Block C | Block D |
   | ---------------------- | ------- | ------- |
   | Yes                    | × 1.10  | × 1.25  |
   | Unsure                 | × 1.00  | × 1.10  |
   | No                     | × 1.00  | × 1.00  |

   If the answer is No, the two block D questions that only apply to minors are skipped.
3. **Level per block.** The points of a block add up: 0 to 3 is minimal, 4 to 6 moderate, 7 or more elevated.
4. **Overall level.** The total of all blocks sets the starting point: 0 to 10 is minimal, 11 to 18 moderate, 19 or more elevated. Then the first rule that applies raises it:
   - Hard trigger: D1 is answered No while minors are in the audience or cannot be ruled out. The result is elevated.
   - One block is elevated. The result is elevated.
   - Two or more blocks are moderate. The result is at least moderate.
5. **Areas to review.** Every block rated moderate or elevated adds its two review prompts. If no block is flagged, the report shows one general prompt.

Known limitation: because each answer is rounded, the 1.10 factors never change the overall result. This will be revisited together with the thresholds.

## Scope and limits

- Only what can be inspected in the interface. No personalised pricing, targeting or other backend logic.
- EU consumer protection is the reference: the CPC key principles on in-game virtual currencies, the Unfair Commercial Practices Directive and the Digital Services Act.
- The scoring has not been validated against player behaviour or enforcement decisions.

## Versions

- [`v1.0-thesis`](https://github.com/vlnzng/fair-monetisation-tool/tree/v1.0-thesis) is the version submitted with the thesis in January 2026. Appendix A of the thesis specifies its scoring.
- Changes since then:
  - The font is served from this site, so the page makes no external requests.
  - The navigation is available on small screens and keyboard focus is visible.
  - The footer links to the legal notice and the privacy policy.
  - The areas to review list two prompts for every flagged block. Before, the list stopped at six and left out block D when all four blocks were flagged.
  - The help text of the context question can be opened, and the answer to D1 survives a change of context.
  - The scoring has its own module and is covered by tests.

## Project structure

```
index.html             page structure and static copy
css/styles.css         all styles
js/app.js              flow and rendering
js/scoring.js          question selection and scoring, no DOM access
js/data/questions.js   questions, help texts, severities
js/data/rules.js       thresholds, factors, hard triggers, review prompts
js/utils.js            small helpers
tests/scoring.test.js  tests for the scoring
assets/                favicon and font
```

HTML, CSS and vanilla JavaScript as ES modules. The site has no framework, no build step and no runtime dependencies.

## Development

Run it with any static file server, for example:

```
python -m http.server 8080
```

Then open http://localhost:8080. Opening `index.html` from the file system does not work, because browsers block ES modules there.

Run the tests with Node 24 or newer. Nothing needs to be installed:

```
npm test
```

The tests hold one example per scoring rule and check all 1,121,931 possible answer combinations against recorded results. A change to the rules therefore shows up as a failing test.

The site is deployed on Vercel as static files from the repository root.

## Credits

- Typeface: [Inter](https://rsms.me/inter/) by The Inter Project Authors, SIL Open Font License 1.1 (`assets/fonts/OFL.txt`)
- Concept, design and code: [Valentin Lenzing](https://valentinlenzing.com)
