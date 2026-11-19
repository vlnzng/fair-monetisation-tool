// Result view (spec 7.1 to 7.7). Renders from the state, actions come from app.js.
import { AREAS } from "./data/areas.js";
import { SOURCES } from "./data/sources.js";
import { EXAMPLES } from "./data/examples.js";
import { runAssessment } from "./scoring.js";
import { LEVEL_WORDS, ANSWER_WORDS, AS_OF, includesText, reasonLines } from "./report.js";
import { sketch } from "./sketches.js";
import { el, externalLink } from "./utils.js";

const bars = size => el("span", { class: size === "large" ? "bars bars--large" : "bars", "aria-hidden": "true" },
    [el("i"), el("i"), el("i")]);

const answerWord = code => el("strong", { class: code === "u" ? "answer is-unsure" : "answer" }, [ANSWER_WORDS[code]]);

/**
 * @param state    the app state
 * @param title    the step title element ("Your assessment" or "Example assessment")
 * @param link     the link to this result, printed at the bottom
 * @param actions  { change(target), restart(), example(key), copyReport(button), copyLink(button), print() }
 */
export function renderResult(state, { title, link, actions }) {
    const result = runAssessment(state);
    const name = state.name.trim();
    const [reason, detail] = reasonLines(result);

    const action = (label, handler) =>
        el("button", { class: "btn btn--secondary btn--small", type: "button", onclick: e => handler(e.currentTarget) }, [label]);

    const head = el("div", { class: "result-head" }, [
        el("div", { class: "result-heading" }, [
            el("p", { class: "text-small text-muted" }, name
                ? ["Result for ", el("strong", { class: "result-name" }, [name]), `, ${result.asked.length} questions`]
                : [`Result, ${result.asked.length} questions`]),
            title
        ]),
        el("div", { class: "result-actions" }, [
            action("Copy report", actions.copyReport),
            action("Copy link", actions.copyLink),
            action("Print", actions.print)
        ])
    ]);

    const overall = el("div", { class: "overall", "data-level": result.overall }, [
        el("div", { class: "overall-level" }, [
            bars("large"),
            el("p", { class: "overall-words" }, [
                el("span", { class: "overall-label" }, ["Overall concern"]),
                el("span", { class: "overall-word" }, [LEVEL_WORDS[result.overall]])
            ])
        ]),
        el("div", { class: "overall-reason" }, [
            el("p", { class: "text-h4" }, [reason]),
            el("p", { class: "text-small" }, [detail])
        ])
    ]);

    const areas = el("ul", { class: "area-levels", "aria-label": "Level by area" }, AREAS.map(a => {
        const level = result.areaLevels[a.key];
        if (!level) {
            return el("li", { class: "area-level is-skipped" }, [
                el("span", { class: "area-level-name" }, [a.name]),
                el("span", { class: "area-level-value" }, ["Not in this flow"])
            ]);
        }
        return el("li", { class: "area-level", "data-level": level }, [
            el("span", { class: "area-level-name" }, [a.name]),
            el("span", { class: "area-level-value" }, [bars(), LEVEL_WORDS[level]])
        ]);
    }));

    return el("div", { class: "result" }, [
        state.example ? renderExampleBar(state.example, actions) : null,
        el("p", { class: "print-only print-title" }, ["Fair Monetisation Risk Assessment Tool"]),
        head,
        overall,
        areas,
        renderEntries(result),
        renderAllAnswers(state, result, actions.change),
        el("div", { class: "result-foot" }, [
            el("p", { class: "text-small text-muted" }, [`This result reflects what is visible in the interface and EU rules as of ${AS_OF}. It is an assessment, not a legal verdict.`]),
            // On an example, the same name as the button in the example bar: one action, one name.
            el("button", { class: "btn btn--primary", type: "button", onclick: actions.restart }, [state.example ? "Check your own flow" : "Check another flow"])
        ]),
        // Set as textContent, so the printed link has no word joiners and copies cleanly.
        el("p", { class: "print-only print-link", textContent: link })
    ]);
}

// Shown only while an example is loaded (spec 7.1).
function renderExampleBar(current, actions) {
    return el("div", { class: "example-bar night" }, [
        el("div", { class: "example-bar-text" }, [
            el("p", {}, [el("strong", {}, ["Example result."]), " The answers are preset for a typical flow."]),
            el("nav", { class: "example-links", "aria-label": "Examples" }, EXAMPLES.map(e =>
                el("a", {
                    class: "example-link",
                    href: `#example=${e.key}`,
                    "aria-current": e.key === current ? "true" : null,
                    onclick: ev => { ev.preventDefault(); actions.example(e.key); }
                }, [e.title])
            ))
        ]),
        el("button", { class: "btn btn--on-night btn--small", type: "button", onclick: actions.restart }, ["Check your own flow"])
    ]);
}

function basedOn(keys) {
    const parts = [];
    keys.forEach((key, i) => {
        const s = SOURCES.find(x => x.key === key);
        if (i > 0) parts.push(" and ");
        parts.push(externalLink(s.url, s.title), ` (${s.status})`);
    });
    return el("p", { class: "text-meta text-muted" }, ["Based on ", ...parts]);
}

function renderEntries(result) {
    const n = result.entries.length;
    const head = el("div", { class: "entries-head" }, n
        ? [el("h4", { class: "entries-title" }, ["Worth a closer look ", el("span", { class: "text-muted" }, [`(${n})`])]),
            el("p", { class: "text-meta text-muted" }, ["Every No and Unsure, in the order asked"])]
        : [el("h4", { class: "entries-title" }, ["Worth a closer look"])]);

    if (!n) {
        return el("section", { class: "entries" }, [head,
            el("p", { class: "entries-empty" }, ["Every answer was Yes, so there is nothing to flag in this flow."])]);
    }

    return el("section", { class: "entries" }, [head, ...result.entries.map(({ question: q, answer }) => {
        const area = AREAS.find(a => a.key === q.area);
        const decides = result.hardTrigger && q.id === "D1" && answer === "n";
        return el("article", { class: "entry" }, [
            el("div", { class: "entry-question" }, [
                el("p", { class: "text-meta text-muted" }, [
                    `${area.name}, your answer: `, answerWord(answer),
                    decides ? el("span", { class: "entry-decides" }, [". This answer sets the result."]) : null
                ]),
                el("h5", { class: "text-h4" }, [q.text]),
                el("div", { class: "entry-sketch" }, [sketch(q.id)])
            ]),
            el("div", { class: "entry-text" }, [
                el("p", {}, [`${q.whyItMatters} ${q.expected}`]),
                basedOn(q.sources)
            ])
        ]);
    })]);
}

function answerRow(label, value, target, onChange) {
    return el("li", { class: "answer-row" }, [
        el("span", {}, [label]),
        value,
        el("button", {
            class: "link-button text-meta",
            type: "button",
            "aria-label": `Change: ${label}`,
            onclick: () => onChange(target)
        }, ["Change"])
    ]);
}

function renderAllAnswers(state, result, onChange) {
    const k1Word = el("strong", { class: state.k1 === "u" ? "answer is-unsure" : "answer" }, [ANSWER_WORDS[state.k1]]);
    const groups = [
        el("div", { class: "answer-group" }, [
            el("p", { class: "answer-group-title" }, ["About this flow"]),
            el("ul", {}, [
                answerRow("Aimed at under-18s, or known to play", k1Word, "k1", onChange),
                answerRow("This flow includes", el("strong", { class: "answer" }, [includesText(state.k2)]), "k2", onChange)
            ])
        ])
    ];

    for (const area of AREAS) {
        const questions = result.asked.filter(q => q.area === area.key);
        if (!questions.length) continue;
        groups.push(el("div", { class: "answer-group" }, [
            el("p", { class: "answer-group-title" }, [area.name]),
            el("ul", {}, questions.map(q => answerRow(q.shortLabel, answerWord(state.answers[q.id]), q.id, onChange)))
        ]));
    }

    return el("details", { class: "disclosure disclosure--strong all-answers" }, [
        el("summary", {}, [`All answers (${result.asked.length})`]),
        el("div", { class: "answer-groups" }, groups)
    ]);
}
