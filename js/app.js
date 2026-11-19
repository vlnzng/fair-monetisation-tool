// Step flow of the check (spec sections 6.2 to 6.7). One state object, every view renders from it.
import { AREAS } from "./data/areas.js";
import { K1, K2_OPTIONS } from "./data/questions.js";
import { SOURCES } from "./data/sources.js";
import { getQuestions, runAssessment } from "./scoring.js";
import { el } from "./utils.js";

const ANSWERS = [["y", "Yes"], ["n", "No"], ["u", "Unsure"]];
const LEVEL_WORDS = { minimal: "Minimal", moderate: "Moderate", elevated: "Elevated" };
const NAME_MAX = 40;

const state = freshState();
let root;

function freshState() {
    return { step: "about", name: "", k1: null, k2: [], answers: {}, example: null, returnToResult: false };
}

const asked = () => getQuestions(state);
const areaOf = key => AREAS.find(a => a.key === key);

// "about", then one step per area with questions in this run, then "result".
function stepKeys() {
    const areas = [...new Set(asked().map(q => q.area))];
    return ["about", ...areas, "result"];
}

// ---- Flow ---------------------------------------------------------------------

function goTo(step) {
    state.step = step;
    render();
    root.scrollIntoView({ block: "start" });
    root.querySelector("[data-step-title]")?.focus({ preventScroll: true });
}

function next() {
    const missing = openQuestions();
    if (missing.length) return showMissing(missing);

    const keys = stepKeys();
    goTo(keys[keys.indexOf(state.step) + 1]);
}

function back() {
    const keys = stepKeys();
    goTo(keys[keys.indexOf(state.step) - 1]);
}

function restart() {
    Object.assign(state, freshState());
    goTo("about");
}

// Questions of the current step without an answer. On the about step that is K1.
function openQuestions() {
    if (state.step === "about") return state.k1 ? [] : ["k1"];
    return asked().filter(q => q.area === state.step && !state.answers[q.id]).map(q => q.id);
}

// Keeps answers of questions that are still asked and drops the others.
function setContext(k1, k2) {
    state.k1 = k1;
    state.k2 = k2;
    const ids = new Set(asked().map(q => q.id));
    for (const id of Object.keys(state.answers)) if (!ids.has(id)) delete state.answers[id];
}

// ---- Rendering ----------------------------------------------------------------

function render() {
    const views = { about: renderAbout, result: renderResult };
    const view = (views[state.step] ?? renderArea)(state.step);
    root.replaceChildren(...(state.step === "result" ? [view] : [renderProgress(), view]));
}

function stepTitle(text) {
    return el("h3", { class: "step-title text-tool", tabindex: "-1", "data-step-title": "" }, [text]);
}

// Progress: one group per step before the result, one segment per question.
function renderProgress() {
    const questions = asked();
    const groups = [{ key: "about", name: "About this flow", done: [Boolean(state.k1)] }];
    for (const key of stepKeys().slice(1, -1)) {
        groups.push({
            key,
            name: areaOf(key).name,
            done: questions.filter(q => q.area === key).map(q => Boolean(state.answers[q.id]))
        });
    }

    const current = groups.find(g => g.key === state.step);
    let position = "Before the questions";
    let short = position;
    if (state.step !== "about") {
        const first = questions.findIndex(q => q.area === state.step) + 1;
        const last = first + current.done.length - 1;
        const range = first === last ? `${first}` : `${first} to ${last}`;
        position = `${first === last ? "Question" : "Questions"} ${range} of ${questions.length}`;
        short = `${range} of ${questions.length}`;
    }

    const segments = done => el("span", { class: "progress-segments", "aria-hidden": "true" },
        done.map(d => el("i", { class: d ? "is-done" : null })));

    return el("nav", { class: "progress", "aria-label": "Progress" }, [
        el("div", { class: "progress-row" }, [
            el("span", { class: "progress-name" }, state.name ? ["Checking: ", el("strong", {}, [state.name])] : []),
            el("span", { class: "progress-position" }, [position])
        ]),
        el("ol", { class: "progress-groups", style: `--groups: ${groups.length}` }, groups.map(g =>
            el("li", { class: "progress-group", "aria-current": g === current ? "step" : null }, [segments(g.done), g.name])
        )),
        el("div", { class: "progress-compact" }, [
            el("div", { class: "progress-compact-row" }, [el("strong", {}, [current.name]), el("span", {}, [short])]),
            segments(groups.flatMap(g => g.done))
        ])
    ]);
}

// A fieldset with Yes, No and Unsure as native radios.
function answerOptions(name, value, onChange) {
    return el("div", { class: "options" }, ANSWERS.map(([code, label]) =>
        el("label", { class: "option" }, [
            el("input", { type: "radio", name, value: code, checked: value === code, onchange: () => onChange(code) }),
            el("span", { class: "option-dot", "aria-hidden": "true" }),
            label
        ])
    ));
}

function countText() {
    if (!state.k1) return ["6 to 15 questions, depending on your answers"];
    const n = asked().length;
    return [el("strong", {}, [`${n} questions`]), " for this flow, about two minutes"];
}

function renderAbout() {
    const count = el("p", { class: "step-count text-small", "aria-live": "polite" }, countText());
    const refresh = () => {
        count.replaceChildren(...countText());
        root.querySelector(".progress")?.replaceWith(renderProgress());
    };

    const k1Field = el("fieldset", { class: "question", "data-question": "k1", "aria-describedby": "k1-hint" }, [
        el("legend", { class: "text-h3" }, [K1.question]),
        el("p", { class: "field-hint text-small text-muted", id: "k1-hint" }, [K1.hint]),
        answerOptions("k1", state.k1, code => {
            setContext(code, state.k2);
            clearMissing("k1");
            refresh();
        })
    ]);

    const k2Field = el("fieldset", { class: "question", "aria-describedby": "k2-hint" }, [
        el("legend", { class: "text-h3" }, ["This flow includes"]),
        el("p", { class: "field-hint text-small text-muted", id: "k2-hint" }, ["Tick everything a player meets in this flow."]),
        el("div", { class: "checks" }, K2_OPTIONS.map(o =>
            el("label", { class: "check" }, [
                el("input", {
                    type: "checkbox",
                    name: "k2",
                    value: o.key,
                    checked: state.k2.includes(o.key),
                    onchange: e => {
                        const k2 = K2_OPTIONS.map(x => x.key)
                            .filter(k => (k === o.key ? e.target.checked : state.k2.includes(k)));
                        setContext(state.k1, k2);
                        refresh();
                    }
                }),
                el("span", { class: "check-box", "aria-hidden": "true" }),
                el("span", { class: "check-text" }, [
                    el("span", { class: "check-title" }, [o.title]),
                    el("span", { class: "check-hint" }, [o.hint])
                ])
            ])
        ))
    ]);

    return el("div", { class: "step-card" }, [
        el("div", { class: "step-head" }, [
            stepTitle("About this flow"),
            el("p", { class: "text-small text-muted" }, ["Two answers decide which questions follow. Nobody reads a question that does not apply."])
        ]),
        el("div", { class: "field" }, [
            el("label", { class: "field-label", for: "flow-name" }, ["Name of the flow ", el("span", { class: "field-optional" }, ["(optional)"])]),
            el("input", {
                class: "text-input",
                id: "flow-name",
                type: "text",
                autocomplete: "off",
                maxlength: NAME_MAX,
                value: state.name,
                "aria-describedby": "flow-name-hint",
                oninput: e => { state.name = e.target.value.slice(0, NAME_MAX); }
            }),
            el("p", { class: "field-hint text-meta text-muted", id: "flow-name-hint" }, ["Shown at the top of your result and report."])
        ]),
        k1Field,
        k2Field,
        renderFooter({ start: count, primary: "Continue" })
    ]);
}

function sourcesLine(keys) {
    const parts = [];
    keys.forEach((key, i) => {
        const s = SOURCES.find(x => x.key === key);
        if (i > 0) parts.push(" and ");
        parts.push(el("a", { href: "#sources" }, [s.title]), ` (${s.detail})`);
    });
    return el("p", { class: "text-meta text-muted" }, ["Based on ", ...parts]);
}

function renderArea(key) {
    const area = areaOf(key);
    const questions = asked().filter(q => q.area === key);

    return el("div", { class: "step-card" }, [
        el("div", { class: "step-head" }, [
            stepTitle(area.name),
            el("p", { class: "text-small text-muted" }, [area.intro])
        ]),
        el("details", { class: "disclosure" }, [
            el("summary", {}, ["Why we ask this"]),
            el("div", { class: "info-box" }, [el("p", { class: "text-small" }, [area.why]), sourcesLine(area.sources)])
        ]),
        ...questions.map(q => el("fieldset", { class: "question", "data-question": q.id }, [
            el("legend", { class: "text-h3" }, [q.text]),
            answerOptions(q.id, state.answers[q.id], code => {
                state.answers[q.id] = code;
                clearMissing(q.id);
                root.querySelector(".progress")?.replaceWith(renderProgress());
            }),
            el("details", { class: "disclosure" }, [
                el("summary", {}, ["Show an example"]),
                el("div", { class: "example-box" }, [
                    el("span", { class: "sketch-slot", "data-sketch": q.id, "aria-hidden": "true" }),
                    el("p", { class: "text-small text-muted" }, [q.example])
                ])
            ])
        ])),
        renderFooter({ showBack: true, primary: isLastArea(key) ? "See the result" : "Next" })
    ]);
}

function isLastArea(key) {
    const keys = stepKeys();
    return keys.indexOf(key) === keys.length - 2;
}

function renderFooter({ start = null, showBack = false, primary }) {
    return el("div", { class: "step-footer" }, [
        showBack ? el("button", { class: "btn btn--secondary step-back", type: "button", onclick: back }, ["Back"]) : start,
        el("div", { class: "step-footer-main" }, [
            el("p", { class: "step-status text-small", "aria-live": "polite", "data-status": "" }),
            el("button", { class: "btn btn--primary step-next", type: "button", onclick: next }, [primary])
        ])
    ]);
}

// Placeholder until the result view of step 6.
function renderResult() {
    const result = runAssessment(state);
    return el("div", { class: "step-card" }, [
        el("div", { class: "step-head" }, [
            stepTitle("Your assessment"),
            el("p", { class: "text-small text-muted" }, [`Overall concern: ${LEVEL_WORDS[result.overall]}`])
        ]),
        el("div", { class: "step-footer" }, [
            el("span"),
            el("button", { class: "btn btn--primary", type: "button", onclick: restart }, ["Check another flow"])
        ])
    ]);
}

// ---- Validation ---------------------------------------------------------------

function showMissing(ids) {
    for (const id of ids) {
        const fieldset = root.querySelector(`[data-question="${id}"]`);
        if (!fieldset || fieldset.classList.contains("is-missing")) continue;
        const errorId = `${id}-error`;
        fieldset.classList.add("is-missing");
        fieldset.setAttribute("aria-invalid", "true");
        fieldset.setAttribute("aria-describedby", [errorId, fieldset.getAttribute("aria-describedby")].filter(Boolean).join(" "));
        fieldset.querySelector("legend").after(
            el("p", { class: "question-error", id: errorId }, [
                el("span", { class: "question-error-icon", "aria-hidden": "true" }, ["!"]),
                "Choose an answer to continue. Unsure is fine."
            ])
        );
    }
    updateStatus();

    const first = root.querySelector(`[data-question="${ids[0]}"]`);
    first.scrollIntoView({ block: "start" });
    first.querySelector("input").focus({ preventScroll: true });
}

function clearMissing(id) {
    const fieldset = root.querySelector(`[data-question="${id}"].is-missing`);
    if (!fieldset) return;
    fieldset.classList.remove("is-missing");
    fieldset.removeAttribute("aria-invalid");
    fieldset.querySelector(".question-error")?.remove();
    const rest = fieldset.getAttribute("aria-describedby").split(" ").filter(x => x !== `${id}-error`);
    if (rest.length) fieldset.setAttribute("aria-describedby", rest.join(" "));
    else fieldset.removeAttribute("aria-describedby");
    updateStatus();
}

function updateStatus() {
    const n = root.querySelectorAll(".question.is-missing").length;
    const status = root.querySelector("[data-status]");
    if (status) status.textContent = n ? `${n} ${n === 1 ? "question" : "questions"} still open` : "";
}

// ---- Start ----------------------------------------------------------------------

function init() {
    root = document.querySelector("[data-tool]");
    if (!root) return;
    render();

    // "Start the check" scrolls to the tool and moves focus to the step title.
    document.querySelector("[data-start]")?.addEventListener("click", e => {
        e.preventDefault();
        root.scrollIntoView({ block: "start" });
        root.querySelector("[data-step-title]")?.focus({ preventScroll: true });
    });
}

init();
