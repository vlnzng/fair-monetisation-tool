# Fair Monetisation Risk Assessment Tool

A guided self-check for monetisation UX in video games. Twelve questions in four risk domains lead to a concern level (minimal, moderate or elevated) and a short list of areas to review.

The tool flags things that deserve a second look. It does not give a legal verdict and does not certify compliance or fairness.

**Live:** https://fair-monetisation.valentinlenzing.com

It started as the practical part of the master's thesis *Fair Monetisation in Video Games: Navigating UX Design Between Dark Patterns and EU Regulations* (Valentin Lenzing, Brandenburg University of Applied Sciences, 2026) and is now maintained as a standalone project. Section and appendix numbers in this README refer to that thesis.

## How it works

1. **Context.** Are minors an intended or relevant audience for the product?
2. **Questions.** Twelve questions, answered with Yes, No or Unsure, based on what can be observed in the interface.
3. **Results.** An overall concern level, a level per domain, areas to review, and a short report to copy or print.

The four domains and the sources they are anchored in (thesis section 6.2):

| Block | Domain                                          | Anchored in                                            |
| ----- | ----------------------------------------------- | ------------------------------------------------------ |
| A     | Price transparency and virtual currency clarity | CPC key principles on in-game virtual currencies       |
| B     | Consent and transaction control                 | Digital Services Act, Art. 25; OECD (2022)             |
| C     | Choice architecture and decision pressure       | UCPD Annex I, no. 7 (limited-time claims); OECD (2022) |
| D     | Minors and safeguards                           | UCPD Annex I, no. 28 (direct exhortation to children)  |

Everything runs in the browser. There is no tracking, no cookie and no external request, and the answers never leave the page.

## How the result is calculated

The scoring implements the specification in Appendix A of the thesis: A.1 lists the questions and severities, A.2 the context factors, A.3 the scoring rules and A.4 the areas to review. Section 6.3 explains the reasoning behind the decision model.

In the code, severities live in `js/data/questions.js`, thresholds and factors in `js/data/rules.js`, the logic in `js/scoring.js`.

1. **Points per answer** (A.1). Yes counts 0, Unsure 1, No 2 or 3. The question on direct urging of minors (D1) counts 2 for Unsure and 5 for No.
2. **Context factor** (A.2). Each weighted answer is rounded to a whole number.

   | Minors in the audience | Block C | Block D |
   | ---------------------- | ------- | ------- |
   | Yes                    | × 1.10  | × 1.25  |
   | Unsure                 | × 1.00  | × 1.10  |
   | No                     | × 1.00  | × 1.00  |

   If the answer is No, the two block D questions that only apply to minors are skipped.
3. **Level per block** (A.3.2). The points of a block add up: 0 to 3 is minimal, 4 to 6 moderate, 7 or more elevated.
4. **Overall level** (A.3.3, A.3.4). The total of all blocks sets the starting point: 0 to 10 is minimal, 11 to 18 moderate, 19 or more elevated. Then the first rule that applies raises it:
   - Hard trigger: D1 is answered No while minors are in the audience or cannot be ruled out. The result is elevated.
   - One block is elevated. The result is elevated.
   - Two or more blocks are moderate. The result is at least moderate.
5. **Areas to review** (A.4). Every block rated moderate or elevated adds its two review prompts. If no block is flagged, the report shows one general prompt.

### Where the tool differs from the thesis text

- **Rounding.** The formula in A.3.1 multiplies each answer by its context factor and adds the results up. The implementation, including `v1.0-thesis`, also rounds each weighted answer to a whole number. Because of this the 1.10 factors never change the overall result, and the 1.25 factor acts unevenly: 2 becomes 3, 3 becomes 4, 5 becomes 6, 1 stays 1. This has not been changed yet and will be revisited together with the thresholds.
- **Block rules for the overall level.** A.3.3 lists only the thresholds for the total. The two rules "one block is elevated" and "two or more blocks are moderate" exist in the implementation and put the co-occurrence logic of section 6.3 into practice.
- **Hard triggers.** Section 8.2 also names misleading limited-time claims as a hard trigger. The implementation has the one hard trigger listed in A.3.4, child-directed urging. Urgency cues are scored through question C3.
- **Areas to review.** `v1.0-thesis` stopped the list at six prompts and so left out block D when all four blocks were flagged. The current version follows A.4.

## Scope and limits

- Only what can be inspected in the interface. No personalised pricing, targeting or other backend logic (section 6.1).
- EU consumer protection is the reference. Other jurisdictions are not covered.
- The scoring has not been validated against player behaviour or enforcement decisions (sections 8.1 and 9.2).

## Versions

- [`v1.0-thesis`](https://github.com/vlnzng/fair-monetisation-tool/tree/v1.0-thesis) is the version submitted with the thesis in January 2026.
- Changes since then:
  - The font is served from this site, so the page makes no external requests.
  - The navigation is available on small screens and keyboard focus is visible.
  - The footer links to the legal notice and the privacy policy.
  - The areas to review list two prompts for every flagged block.
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

## References

- Lenzing, V. (2026). *Fair Monetisation in Video Games: Navigating UX Design Between Dark Patterns and EU Regulations.* Master's thesis, Brandenburg University of Applied Sciences.
- CPC Network (2025). [Key principles on in-game virtual currencies](https://commission.europa.eu/document/download/8af13e88-6540-436c-b137-9853e7fe866a_en?filename=Key+principles+on+in-game+virtual+currencies.pdf). European Commission, Consumer Protection Cooperation Network.
- European Union (2005). [Unfair Commercial Practices Directive](https://eur-lex.europa.eu/eli/dir/2005/29/oj), Directive 2005/29/EC.
- European Union (2022). [Digital Services Act](https://eur-lex.europa.eu/eli/reg/2022/2065/oj), Regulation (EU) 2022/2065.
- OECD (2022). [Dark commercial patterns](https://doi.org/10.1787/44f5e846-en). OECD Digital Economy Papers, No. 336.

## Credits

- Typeface: [Inter](https://rsms.me/inter/) by The Inter Project Authors, SIL Open Font License 1.1 (`assets/fonts/OFL.txt`)
- Concept, design and code: [Valentin Lenzing](https://valentinlenzing.com)
