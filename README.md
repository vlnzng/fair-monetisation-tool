# Fair Monetisation Risk Assessment Tool

A browser self-check that lets a game team test one purchase flow against EU consumer protection. A short context step decides which of fifteen questions apply. The answers lead to a level per area and overall (Minimal, Moderate or Elevated), and every No and Unsure comes back with a plain explanation and its sources.

The tool shows where a closer look is worth it. It does not give a legal verdict and does not certify compliance or fairness.

**Live:** https://fair-monetisation.valentinlenzing.com

It started as the practical part of the master's thesis *Fair Monetisation in Video Games: Navigating UX Design Between Dark Patterns and EU Regulations* (Valentin Lenzing, Brandenburg University of Applied Sciences, January 2026). Version 2.0 is the revision one year on: the same concept, reviewed with more time. Section and appendix numbers in this README refer to the thesis.

## How it works

1. **About this flow.** Is the game aimed at players under 18, or do they play it (Yes, No, Unsure)? Which of four things does the flow include: virtual currency, a renewing subscription or pass, offers limited by time or stock, paid random items? These two answers decide which questions follow, so nobody reads a question that does not apply. A run has between 6 and 15 questions.
2. **Questions.** One step per area, each question answered with Yes, No or Unsure, based on what a player can see. Every question is phrased so that Yes is the unproblematic answer, and each has an example of how Yes can look.
3. **Result.** An overall level with the reason in one sentence, a level per area, every No and Unsure with what it means and which source it rests on, and all answers with a way to change them. The result can be copied as a report, shared as a link or printed.

Three example results are built in: an opaque currency shop (Elevated), a high-pressure battle pass (Moderate) and an offer aimed at children (Elevated through the hard trigger).

### Areas and questions

| Area | Questions | Asked when | Main sources |
| --- | --- | --- | --- |
| A Prices and currency | A1 real-money price next to the buy button, A2 at most one virtual currency, A3 buying the amount of currency needed | A1 always, A2 and A3 with virtual currency | CPC key principles |
| B Checkout and control | B1 confirmation before paying, B2 cancelling as easy as signing up, B3 help, refunds and withdrawal easy to find | B2 with a subscription or pass | Consumer Rights Directive, CPC key principles |
| C Offers and pressure | C1 buying and declining equally clear, C2 declined offers stay away, C3 limited offers state and keep their end | C3 with limited offers | Unfair Commercial Practices Directive |
| D Under-18 protection | D1 offers neutral towards children, D2 purchases off by default, D3 understandable for the youngest players, D4 progress without being told to pay | D1 always, D2 to D4 when under-18s play or it is unsure | Unfair Commercial Practices Directive, Digital Fairness Act proposal |
| E Paid random items | E1 rewards and odds visible before paying, E2 unavailable to under-18s | with paid random items, E2 only when under-18s play or it is unsure | Digital Fairness Act proposal |

The full wording, examples and result texts are in `js/data/questions.js`. Which rule backs which question follows the thesis and research from November 2026. It has not been checked line by line against the legal texts, so the site shows no article numbers.

Everything runs in the browser. There is no tracking, no cookie and no external request, and the answers never leave the page.

## How the result is calculated

The model is the one specified in Appendix A of the thesis (A.1 questions and severities, A.2 context factors, A.3 scoring rules), with four corrections described below. Section 6.3 explains the reasoning behind the decision model. In the code, points live in `js/data/questions.js`, thresholds, factors and the hard trigger in `js/data/rules.js`, and the logic in `js/scoring.js`.

1. **Points per answer.** Yes counts 0. Unsure counts 1. No counts 2 or 3, depending on the question. D1, offers that tell children to buy, counts 2 for Unsure and 5 for No.
2. **Context factor.** If young players are in the audience, answers about offers and protection count more.

   | Under-18s in the audience | Area C | Area D and question E2 | Everything else |
   | --- | --- | --- | --- |
   | Yes | × 1.10 | × 1.25 | × 1 |
   | Unsure | × 1 | × 1.10 | × 1 |
   | No | × 1 | × 1 | × 1 |

3. **Level per area.** The weighted points of an area add up, rounded to two decimals: up to 3 is Minimal, above 3 up to 6 Moderate, above 6 Elevated. The same thresholds apply to all five areas.
4. **Overall level by total.** The total of all areas is compared with the *base*, the unweighted No points of every question asked in this run, without D1. Up to 40% of the base is Minimal, above 40% up to 70% Moderate, above 70% Elevated. For the twelve questions of the thesis the base is 26, which puts the thresholds at 10.4 and 18.2, close to the fixed 10 and 18 of A.3.3.
5. **Overall level by areas.** After the total: one Elevated area makes the result Elevated, two or more Moderate areas make it at least Moderate.
6. **Hard trigger.** D1 answered No sets area D and the overall result to Elevated in every context. EU law bans telling children to buy or to ask an adult to buy (UCPD Annex I, no. 28, thesis section 6.2).
7. **What to look at.** Every No and Unsure is listed with why it matters, what is expected and its sources, in the order asked.

The result also names the rule that decided the level (`points`, `two-moderate`, `area-elevated` or `hard-trigger`). An area rule is only named when it raised the level.

### The four corrections in v2

| | v1.2 and `v1.0-thesis` | v2.0 |
| --- | --- | --- |
| 1. Rounding | Each weighted answer was rounded to a whole number, so the 1.10 factors never changed a result and 1.25 acted unevenly. A.3.1 has no rounding. | No rounding per question, as in A.3.1. Only the area sums are rounded to two decimals, to keep floating point noise out of the comparison. |
| 2. Hard trigger | Fired only when under-18s were in the audience or it was unsure. D1 = No on its own left area D at Moderate. | Fires for D1 = No in every context and sets area D to Elevated. |
| 3. Overall thresholds | Fixed at 10 and 18 points (A.3.3). | 40% and 70% of the base, so they scale with the 6 to 15 questions of a run. |
| 4. Results | Two fixed review prompts per flagged area (A.4). | One explanation per No and Unsure, tied to its question, with no cap on their number. |

### Where the tool differs from the thesis text

- **Question set.** The thesis has twelve questions in four blocks, all asked every time. v2 has fifteen questions in five areas. The wording is plainer, D4 (pay to progress) and area E (paid random items) are new, and the context step leaves out what a flow does not have.
- **Area rules for the overall level.** A.3.3 lists only the thresholds for the total. The rules "one area is Elevated" and "two areas are Moderate" have been in every version of the implementation. They put the co-occurrence logic of section 6.3 into practice.
- **One hard trigger.** Section 8.2 names misleading limited-time claims as a second hard trigger, while A.3.4, the specification, names only child-directed urging. v2 keeps the single trigger of A.3.4. Time pressure is scored through C3, which also covers offers that simply do not show an end, so a No there is not always a misleading claim.
- **Anchors of area B.** The thesis anchors consent and control in the Digital Services Act, Art. 25, and the OECD report (section 6.2). v2 bases the questions of area B on the Consumer Rights Directive and the CPC key principles. The OECD report stays in the source list, the DSA is no longer cited.
- **New sources.** The Commission's proposal for a Digital Fairness Act (November 2026) and the new PEGI criteria (June 2026) came after the thesis. Results mark points that rest on the proposal as a proposal.

## Link to a result

The result lives in the URL fragment, which browsers never send to the server.

- Example: `#example=currency`, `#example=pass` or `#example=children`
- Own run: `#k1=y&k2=vc,sub&a=A1n,A2y,A3n,B1y,B2y,B3y,C1y,C2n,D1y,D2u,D3y,D4y&name=Gem%20Shop`

`k1` is the under-18 answer (`y`, `n`, `u`), `k2` the ticked items (`vc`, `sub`, `limited`, `random`, may be empty), `a` every asked question with its answer, and `name` the optional flow name, cut to 40 characters. A fragment that does not list exactly the questions asked for its `k1` and `k2` is ignored. Section anchors such as `#method` are left alone.

## Scope and limits

- Only what can be inspected in the interface. No personalised pricing, targeting, data use or other backend logic (section 6.1).
- One purchase flow per run, judged by what a player sees.
- EU consumer protection is the reference. Other jurisdictions are not covered.
- The scoring has not been validated against player behaviour or enforcement decisions (sections 8.1 and 9.2).
- The questions reflect EU rules as of November 2026 and are not updated continuously. The Digital Fairness Act is still a proposal.

## Accessibility

The page aims at WCAG 2.2 AA: every step works with the keyboard alone, focus moves to the step title on each step change, all text reaches a contrast of 4.5:1, a level is never shown by colour alone, and motion follows the system setting for reduced motion. The tool avoids the patterns it checks: no pre-selected answers, no urgency, Unsure always on offer.

## Project structure

```
index.html              page structure and static copy
css/styles.css          all styles, design tokens in :root
js/app.js               state, step flow, examples, copy and print
js/result.js            result view
js/sketches.js          the fifteen example sketches, HTML and CSS only
js/hero.js              countdown of the hero figure
js/scoring.js           question selection and scoring, no DOM access
js/link.js              result link in the URL fragment, no DOM access
js/report.js            reason sentence and plain-text report, no DOM access
js/data/                areas, questions, sources, examples, scoring rules
tests/                  tests for scoring, link and report
assets/                 favicon and font
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

The tests cover:

- seventeen reference cases with points, levels and the deciding rule for each area and overall
- one test per scoring rule and per correction
- three invariants over every answer combination of four contexts: changing an answer from Yes to Unsure or No never lowers a level, every No and Unsure becomes exactly one entry, and D1 = No always gives Elevated
- question selection for all 48 contexts and the integrity of the content data
- the reason sentence for every case, the plain-text report, and the link format with its invalid inputs

The site is deployed on Vercel as static files from the repository root.

## Versions

- [`v1.0-thesis`](https://github.com/vlnzng/fair-monetisation-tool/tree/v1.0-thesis): the version submitted with the thesis in January 2026.
- v1.2: accessibility and print fixes, a self-hosted font, the scoring in its own module with tests.
- v2.0: the revision one year on. New design, context step, fifteen questions with examples, the four scoring corrections, one explanation per answer, example results, result links and a plain-text report.

## References

- Lenzing, V. (2026). *Fair Monetisation in Video Games: Navigating UX Design Between Dark Patterns and EU Regulations.* Master's thesis, Brandenburg University of Applied Sciences.
- CPC Network (2025). [Key principles on in-game virtual currencies](https://commission.europa.eu/document/download/8af13e88-6540-436c-b137-9853e7fe866a_en?filename=Key+principles+on+in-game+virtual+currencies.pdf). European Commission, Consumer Protection Cooperation Network.
- European Union (2005). [Unfair Commercial Practices Directive](https://eur-lex.europa.eu/eli/dir/2005/29/oj), Directive 2005/29/EC.
- European Union (2011). [Consumer Rights Directive](https://eur-lex.europa.eu/eli/dir/2011/83/oj), Directive 2011/83/EU.
- European Commission (2026). [Digital Fairness Act](https://ec.europa.eu/commission/presscorner/detail/en/ip_26_2407), Commission proposal.
- PEGI (2026). [Age rating criteria](https://better-internet-for-kids.europa.eu/sites/default/files/2026-06/PEGI%20briefing%2025-06.pdf).
- OECD (2022). [Dark commercial patterns](https://doi.org/10.1787/44f5e846-en). OECD Digital Economy Papers, No. 336.

## Credits

- Typeface: [Instrument Sans](https://github.com/Instrument/instrument-sans) by The Instrument Sans Project Authors, SIL Open Font License 1.1 (`assets/fonts/OFL.txt`)
- Concept, design and code: [Valentin Lenzing](https://valentinlenzing.com)
