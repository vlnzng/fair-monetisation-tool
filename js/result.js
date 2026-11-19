// Result view (spec 7.2 to 7.7). Renders from the state, actions come from app.js.
import { AREAS } from "./data/areas.js";
import { K2_OPTIONS } from "./data/questions.js";
import { SOURCES } from "./data/sources.js";
import { runAssessment } from "./scoring.js";
import { LEVEL_WORDS, reasonLines } from "./report.js";
import { sketch } from "./sketches.js";
import { el } from "./utils.js";

const ANSWER_WORDS = { y: "Yes", n: "No", u: "Unsure" };

const bars = size => el("span", { class: size === "large" ? "bars bars--large" : "bars", "aria-hidden": "true" },
    [el("i"), el("i"), el("i")]);

const answerWord = code => el("strong", { class: code === "u" ? "answer is-unsure" : "answer" }, [ANSWER_WORDS[code]]);

// "Virtual currency, a subscription or a pass that renews"
export function includesText(k2) {
    const titles = K2_OPTIONS.filter(o => k2.includes(o.key)).map(o => o.title);
    if (!titles.length) return "None of these";
    return titles.map((t, i) => (i === 0 ? t : t.charAt(0).toLowerCase() + t.slice(1))).join(", ");
}

/**
 * @param state      the app state
 * @param title      the step title element ("Your assessment")
 * @param onChange   called with "k1", "k2" or a question id
 * @param onRestart  clears everything and opens the about step
 */
export function renderResult(state, { title, onChange, onRestart }) {
    const result = runAssessment(state);
    const name = state.name.trim();
    const [reason, detail] = reasonLines(result);

    const head = el("div", { class: "result-head" }, [
        el("p", { class: "text-small text-muted" }, name
            ? ["Result for ", el("strong", { class: "result-name" }, [name]), `, ${result.asked.length} questions`]
            : [`Result, ${result.asked.length} questions`]),
        title
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
                el("span", { class: "area-level-value" }, ["Skipped in step 1"])
            ]);
        }
        return el("li", { class: "area-level", "data-level": level }, [
            el("span", { class: "area-level-name" }, [a.name]),
            el("span", { class: "area-level-value" }, [bars(), LEVEL_WORDS[level]])
        ]);
    }));

    return el("div", { class: "result" }, [
        head,
        overall,
        areas,
        renderEntries(result),
        renderAllAnswers(state, result, onChange),
        el("div", { class: "result-foot" }, [
            el("p", { class: "text-small text-muted" }, ["This result reflects what is visible in the interface and EU rules as of November 2026. It is an assessment, not a legal verdict."]),
            el("button", { class: "btn btn--primary", type: "button", onclick: onRestart }, ["Check another flow"])
        ])
    ]);
}

function basedOn(keys) {
    const parts = [];
    keys.forEach((key, i) => {
        const s = SOURCES.find(x => x.key === key);
        if (i > 0) parts.push(" and ");
        parts.push(el("a", { href: "#sources" }, [s.title]), ` (${s.status})`);
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
