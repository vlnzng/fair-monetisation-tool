// Result view (spec 7.1 to 7.7). Renders from the state, actions come from app.js.
import { AREAS } from "./data/areas.js";
import { SOURCES } from "./data/sources.js";
import { EXAMPLES } from "./data/examples.js";
import { runAssessment } from "./scoring.js";
import { LEVEL_WORDS, ANSWER_WORDS, AS_OF, TRIGGER_QUESTION, includesText, reasonLines } from "./report.js";
import { sketch } from "./sketches.js";
import { el, externalLink } from "./utils.js";

const bars = size => el("span", { class: size === "large" ? "bars bars--large" : "bars", "aria-hidden": "true" },
    [el("i"), el("i"), el("i")]);

// Answers never take a level colour: Unsure is ink, like Yes and No.
const answerWord = code => el("strong", { class: "answer" }, [ANSWER_WORDS[code]]);

/**
 * @param state    the app state
 * @param title    the step title element ("Your assessment" or "Example assessment")
 * @param link     the link to this result, printed at the bottom
 * @param actions  { change(target), restart(), example(key), copyReport(button), copyLink(button),
 *                   copyEntry(button, entry), print() }
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
            el("p", { class: "text-small" }, reasonDetail(detail, result.hardTrigger))
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
        renderEntries(result, actions),
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

// With the hard trigger, the quoted question links to its entry (spec 7.3). The link scrolls and
// moves focus without changing the URL, so the result fragment stays.
function reasonDetail(detail, hardTrigger) {
    if (!hardTrigger) return [detail];
    const [before, after] = detail.split(TRIGGER_QUESTION);
    return [before, el("a", {
        href: "#entry-D1",
        onclick: e => {
            e.preventDefault();
            const entry = document.getElementById("entry-D1");
            entry.scrollIntoView({ block: "start" });
            entry.focus({ preventScroll: true });
        }
    }, [TRIGGER_QUESTION]), after];
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

function basedOn(keys, after = null) {
    const parts = [];
    keys.forEach((key, i) => {
        const s = SOURCES.find(x => x.key === key);
        if (i > 0) parts.push(" and ");
        // The status stays on one line: "(2026 proposal)", never "(2026" / "proposal)".
        parts.push(externalLink(s.url, s.title), ` (${s.status.replaceAll(" ", " ")})`);
    });
    // A wide space before the button, not a margin, so it leaves no indent when the button wraps.
    const gap = after ? el("span", { class: "entry-copy-gap" }, [" "]) : null;
    return el("p", { class: "text-meta text-muted" }, ["Based on ", ...parts, gap, after]);
}

function renderEntries(result, actions) {
    const n = result.entries.length;
    const head = el("div", { class: "entries-head" }, n
        ? [el("h4", { class: "entries-title" }, ["Worth a closer look ", el("span", { class: "text-muted" }, [`(${n})`])]),
            el("p", { class: "text-meta text-muted" }, ["Every No and Unsure, in the order asked"])]
        : [el("h4", { class: "entries-title" }, ["Worth a closer look"])]);

    if (!n) {
        return el("section", { class: "entries" }, [head,
            el("p", { class: "entries-empty" }, ["Every answer was Yes, so there is nothing to flag in this flow."])]);
    }

    // Grouped by area, with a small heading only for areas that have entries.
    const groups = AREAS
        .map(area => ({ area, entries: result.entries.filter(e => e.question.area === area.key) }))
        .filter(g => g.entries.length);

    return el("section", { class: "entries" }, [head, ...groups.map(({ area, entries }) =>
        el("div", { class: "entry-group" }, [
            el("h5", { class: "entry-group-title" }, [area.name]),
            ...entries.map(entry => renderEntry(entry, result, actions))
        ])
    )]);
}

function renderEntry(entry, result, actions) {
    const { question: q, answer } = entry;
    const decides = result.hardTrigger && q.id === "D1" && answer === "n";
    // The answer that sets the result is marked and is the target of the link in the reason.
    return el("article", decides ? { class: "entry is-decisive", id: "entry-D1", tabindex: "-1" } : { class: "entry" }, [
        el("div", { class: "entry-question" }, [
            el("p", { class: "text-meta text-muted" }, [
                "Your answer: ", answerWord(answer),
                decides ? el("span", { class: "entry-decides" }, [". This answer sets the result."]) : null
            ]),
            el("h6", { class: "text-h4" }, [q.text]),
            el("div", { class: "entry-sketch" }, [sketch(q.id)]),
            // Without the caption the sketch would read as a picture of the problem.
            el("p", { class: "text-meta text-muted" }, ["How a Yes can look: ", q.example])
        ]),
        el("div", { class: "entry-text" }, [
            el("p", {}, [`${q.whyItMatters} ${q.expected}`]),
            basedOn(q.sources, el("button", {
                class: "link-button text-meta entry-copy",
                type: "button",
                "aria-label": `Copy entry: ${q.text}`,
                onclick: e => actions.copyEntry(e.currentTarget, entry)
            }, ["Copy entry"]))
        ])
    ]);
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
    const groups = [
        el("div", { class: "answer-group" }, [
            el("p", { class: "answer-group-title" }, ["About this flow"]),
            el("ul", {}, [
                answerRow("Aimed at under-18s, or known to play", answerWord(state.k1), "k1", onChange),
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
