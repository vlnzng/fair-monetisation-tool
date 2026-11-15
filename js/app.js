import { BLOCKS } from "./data/questions.js";
import { CONTEXT_DEFAULTS, CONTEXT_OPTIONS, LEVELS } from "./data/rules.js";
import { getUiQuestions, runAssessment } from "./scoring.js";
import { el, clamp, safeJsonClone } from "./utils.js";

// Always start at the top on first load and reload.
// - Prevent scroll restoration to an anchored section after reload.
// - Remove any persisted hash before the browser can re-apply it.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (location.hash) history.replaceState(null, "", location.pathname + location.search);
window.addEventListener("load", () => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
});

document.addEventListener("DOMContentLoaded", () => {
    initAssessment();
});

function initAssessment() {
    const host = document.querySelector("[data-assessment-host]");
    if (!host) return;

    const btnPrev = host.querySelector("[data-prev]");
    const btnNext = host.querySelector("[data-next]");
    const btnReset = host.querySelector("[data-reset]");

    const stepWrap = host.querySelector("[data-step]");
    const stepTitle = host.querySelector("[data-step-title]");
    const stepMeta = host.querySelector("[data-step-meta]");
    const progressBar = host.querySelector("[data-progress]");

    const state = {
        step: 0,
        context: { minors: null },
        answers: {},
        questionsComplete: false,
        helpOpen: {}
    };

    // Step order: context -> questions -> summary.
    const steps = [renderContextStep, renderQuestionsStep, renderResultsStep];

    const setStep = (i) => {
        state.step = clamp(i, 0, steps.length - 1);
        render();
    };

    const render = () => {
        // Title + meta
        const titles = ["Context", "Questions", "Results"];
        if (stepTitle) stepTitle.textContent = titles[state.step] ?? "Assessment";

        if (stepMeta) {
            stepMeta.textContent = `Step ${state.step + 1} of ${steps.length}`;
        }

        if (progressBar) {
            const pct = Math.round(((state.step + 1) / steps.length) * 100);
            progressBar.style.width = `${pct}%`;
        }

        // Body
        if (stepWrap) {
            const node = steps[state.step](state, {
                onQuestionsCompletenessChanged: (complete) => {
                    state.questionsComplete = complete;
                    updateNav();
                },
                onContextChanged: () => updateNav()
            });
            stepWrap.replaceChildren(node);
        }

        updateNav();
    };

    const updateNav = () => {
        const hasContextSelection = state.context.minors != null;
        if (btnPrev) btnPrev.disabled = state.step === 0;

        if (!btnNext) return;

        if (state.step === 0) {
            btnNext.textContent = "Start assessment";
            const ready = hasContextSelection;
            btnNext.disabled = !ready;
            btnNext.classList.toggle("is-ready", ready);
            btnNext.dataset.ready = ready ? "true" : "false";
            return;
        }

        if (state.step === steps.length - 1) {
            btnNext.textContent = "Restart";
            btnNext.disabled = false;
            btnNext.classList.remove("is-ready");
            btnNext.removeAttribute("data-ready");
            return;
        }

        if (state.step === steps.length - 2) {
            btnNext.textContent = "View results";

            const ready = !!state.questionsComplete;
            btnNext.disabled = !ready;
            btnNext.classList.toggle("is-ready", ready);
            btnNext.dataset.ready = ready ? "true" : "false";
            return;
        }

        btnNext.textContent = "Next";
        btnNext.disabled = false;
        btnNext.classList.remove("is-ready");
        btnNext.removeAttribute("data-ready");
    };

    btnPrev?.addEventListener("click", () => setStep(state.step - 1));

    btnNext?.addEventListener("click", () => {
        if (state.step === 0 && state.context.minors == null) return;
        if (state.step === 1) {
            const ui = getUiQuestions(state);
            const missing = ui.map(q => q.id).filter(id => !(id in state.answers));
            if (missing.length) return; // button should be disabled anyway
        }

        if (state.step === steps.length - 1) {
            resetState(state);
            setStep(0);
            host.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
        }

        setStep(state.step + 1);
        if (state.step === steps.length - 1) {
            host.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    });

    btnReset?.addEventListener("click", () => {
        resetState(state);
        setStep(0);
        if (location.hash) history.replaceState(null, "", location.pathname + location.search);
        host.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    setStep(0);
}

function resetState(state) {
    state.step = 0;
    state.answers = {};
    state.questionsComplete = false;
    state.context = { minors: null };
    state.helpOpen = {};
}

function renderContextStep(state, { onContextChanged } = {}) {
    const current = state.context.minors;

    const items = CONTEXT_OPTIONS.minors.map(opt => {
        const id = `ctx_minors_${opt.value}`;
        const input = el("input", {
            type: "radio",
            name: "ctx_minors",
            id,
            value: opt.value,
            checked: current === opt.value,
            onchange: e => {
                state.context.minors = e.target.value;
                // Drop answers to questions that are no longer asked in this context.
                const asked = new Set(getUiQuestions(state).map(q => q.id));
                Object.keys(state.answers)
                    .filter(id => !asked.has(id))
                    .forEach(id => delete state.answers[id]);
                onContextChanged?.();
            }
        });

        const shortLabel =
            opt.value === "yes" ? "Yes" :
                opt.value === "no" ? "No" :
                    "Unsure";

        const label = el("label", { htmlFor: id }, [shortLabel]);

        return el(
            "div",
            {
                class: "choice",
                role: "button",
                tabIndex: 0,
                onclick: () => {
                    input.checked = true;
                    input.dispatchEvent(new Event("change", { bubbles: true }));
                },
                onkeydown: e => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        input.checked = true;
                        input.dispatchEvent(new Event("change", { bubbles: true }));
                    }
                }
            },
            [input, label]
        );
    });

    const help = renderHelp(
        state,
        "context",
        "If minors are a relevant audience segment, the assessment increases sensitivity for child-directed prompting, safeguards, and clarity of purchase information."
    );

    return el("div", { class: "assessment-grid" }, [
        el("div", { class: "card" }, [
            el("h3", {}, ["Context flag"]),
            el("p", { class: "section-intro" }, [
                "The context flag is set to adjust the sensitivity of indicators related to minors."
            ]),
            el("div", { class: "q-card" }, [
                el("div", { class: "q-title-row" }, [
                    el("div", { class: "q-title" }, [
                        "Are minors an intended or relevant audience segment for the product (e.g., by design, marketing, or distribution)?"
                    ]),
                    help.button
                ]),
                help.text,
                el("div", { class: "choice-row" }, items)
            ])
        ]),
        el("div", { class: "helper-card" }, [
            el("h4", {}, ["How to use this"]),
            el("ul", { class: "bullets" }, [
                el("li", {}, ["Use the tool for one specific monetisation flow at a time."]),
                el("li", {}, ["Answer based on interface inspection and basic documentation."]),
                el("li", {}, ["If information is not visible at the decision point, choose Unsure."]),
                el("li", {}, ["View results for an overall orientation and domain-level signals."]),
                el("li", {}, ["Export the short report to document decisions and iteration rationale."])
            ])
        ])
    ]);
}

function renderQuestionsStep(state, { onQuestionsCompletenessChanged } = {}) {
    const root = el("div", { class: "stack" }, []);

    root.appendChild(
        el("div", { class: "card" }, [
            el("h3", {}, ["Guided questions"]),
            el("p", { class: "section-intro" }, [
                "Answer only what can be observed in the UI or confirmed in product-facing documentation."
            ]),
            el("p", { class: "section-intro" }, [
                "Press the info icon when you need extra context."
            ])
        ])
    );

    const blocksWrap = el("div", { class: "stack", "data-blocks-wrap": "true" }, []);
    const lockNote = el("div", { class: "card", "data-lock-note": "true" }, [
        el("p", { class: "micro-note" }, ["Complete the current block to unlock the next block."])
    ]);

    root.appendChild(blocksWrap);
    root.appendChild(lockNote);

    // Keep the viewport anchored to the same question when blocks re-render.
    const preserveViewportAround = (qid, fn) => {
        const beforeEl = qid ? document.querySelector(`[data-qid="${qid}"]`) : null;
        const beforeTop = beforeEl ? beforeEl.getBoundingClientRect().top : null;
        fn();
        if (!qid || beforeTop == null) return;
        const afterEl = document.querySelector(`[data-qid="${qid}"]`);
        if (!afterEl) return;
        const afterTop = afterEl.getBoundingClientRect().top;
        const delta = afterTop - beforeTop;
        window.scrollBy({ top: delta, left: 0, behavior: "auto" });
    };

    // Progressive reveal: show one block at a time until it is fully answered.
    const updateBlocks = (anchorQid = null) => {
        preserveViewportAround(anchorQid, () => {
            const uiQuestions = getUiQuestions(state);
            const groups = groupByBlock(uiQuestions);
            const orderedBlockIds = BLOCKS.map(b => b.id);
            const visibleBlocks = [];

            const isBlockComplete = (blockId) => {
                const qs = groups[blockId] ?? [];
                if (!qs.length) return true;
                return qs.every(q => q.id in state.answers);
            };

            let locked = false;
            for (const blockId of orderedBlockIds) {
                const qs = groups[blockId] ?? [];
                if (!qs.length) continue;
                if (locked) break;

                visibleBlocks.push(
                    renderBlock(blockId, qs, state, (qidJustAnswered) => updateBlocks(qidJustAnswered))
                );

                if (!isBlockComplete(blockId)) locked = true;
            }

            blocksWrap.replaceChildren(...visibleBlocks);

            const hasHidden = orderedBlockIds.some(b => (groups[b]?.length ?? 0) > 0) && locked;
            lockNote.style.display = hasHidden ? "" : "none";

            const missing = uiQuestions.map(q => q.id).filter(id => !(id in state.answers));
            const complete = uiQuestions.length > 0 && missing.length === 0;
            onQuestionsCompletenessChanged?.(complete);
        });
    };

    updateBlocks();
    return root;
}

function renderResultsStep(state) {
    const assessment = runAssessment(state);
    const overall = LEVELS[assessment.overallLevel];
    const summaryText = buildSummaryText(state, assessment);

    const blockItems = Object.entries(assessment.blockLevels).map(([blockId, level]) => {
        const name = BLOCKS.find(b => b.id === blockId)?.name ?? blockId;
        return el("li", {}, [
            el("span", { class: "badge", "data-level": level }, [LEVELS[level].label]),
            ` ${name}`
        ]);
    });

    const recoItems = el(
        "ul",
        { class: "reco-list" },
        assessment.recommendations.map(r => el("li", {}, [r]))
    );

    const status = el("div", { class: "action-status", role: "status", "aria-live": "polite" }, []);

    const overallCard = el("div", { class: "card" }, [
        el("h3", {}, ["Overall risk orientation"]),
        el("div", { class: "result-heading" }, [
            el("span", { class: "badge badge-large", "data-level": assessment.overallLevel }, [
                overall.label
            ]),
            el("span", { class: "result-summary" }, [overall.summary])
        ]),
        assessment.triggers.length
            ? el("p", { class: "micro-note" }, [
                "One or more hard triggers matched. The overall orientation is elevated accordingly."
            ])
            : el("p", { class: "micro-note" }, [
                "Results reflect constellations of signals. They are not a legal determination."
            ]),
        el("div", { class: "stack" }, [
            el("h4", {}, ["Block-level orientation"]),
            el("ul", { class: "block-list" }, blockItems)
        ])
    ]);

    const areasCard = el("div", { class: "card" }, [
        el("h3", {}, ["Areas to review"]),
        el("p", { class: "micro-note" }, [
            "Targeted review areas derived from the triggered risk domains."
        ]),
        recoItems
    ]);

    const triggersCard = el("div", { class: "card" }, [
        el("h3", {}, ["Hard triggers (if any)"]),
        assessment.triggers.length
            ? el("ul", { class: "bullets" }, assessment.triggers.map(t => el("li", {}, [t])))
            : el("p", { class: "micro-note" }, ["No hard triggers matched."])
    ]);

    const reportCard = el("div", { class: "card" }, [
        el("h3", {}, ["Short report"]),
        el("p", { class: "micro-note" }, ["Copy or export the results for documentation."]),
        el("textarea", { class: "report-text", rows: 10, readOnly: true, value: summaryText }, []),
        status,
        el("div", { class: "choice-row" }, [
            el(
                "button",
                {
                    class: "btn btn-secondary",
                    type: "button",
                    onclick: async () => {
                        const ok = await copyToClipboard(summaryText);
                        flashStatus(
                            status,
                            ok ? "Copied to clipboard." : "Copy failed. You can manually select and copy.",
                            ok
                        );
                    }
                },
                ["Copy to clipboard"]
            ),
            el(
                "button",
                {
                    class: "btn btn-secondary",
                    type: "button",
                    onclick: () => {
                        printText(summaryText);
                    }
                },
                ["Print"]
            )
        ])
    ]);

    return el("div", { class: "stack" }, [
        el("div", { class: "result-grid" }, [overallCard, areasCard]),
        triggersCard,
        reportCard
    ]);
}

function renderBlock(blockId, questions, state, onAnswer) {
    const name = BLOCKS.find(b => b.id === blockId)?.name ?? blockId;

    const items = questions.map(q => {
        const current = state.answers[q.id] ?? null;

        const help = renderHelp(state, q.id, q.help);

        const radios = ["yes", "no", "unsure"].map(v => {
            const id = `${q.id}_${v}`;
            const input = el("input", {
                type: "radio",
                name: q.id,
                id,
                value: v,
                checked: current === v,
                onchange: e => {
                    state.answers[q.id] = e.target.value;
                    onAnswer?.(q.id);
                }
            });

            const labelText = v === "yes" ? "Yes" : v === "no" ? "No" : "Unsure";
            const label = el("label", { htmlFor: id }, [labelText]);

            return el(
                "div",
                {
                    class: "choice",
                    role: "button",
                    tabIndex: 0,
                    onclick: () => {
                        input.checked = true;
                        input.dispatchEvent(new Event("change", { bubbles: true }));
                    },
                    onkeydown: e => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            input.checked = true;
                            input.dispatchEvent(new Event("change", { bubbles: true }));
                        }
                    }
                },
                [input, label]
            );
        });

        return el("div", { class: "q-card", "data-qid": q.id }, [
            el("div", { class: "q-title-row" }, [
                el("div", { class: "q-title" }, [q.text]),
                help.button
            ]),
            help.text,
            el("div", { class: "choice-row" }, radios)
        ]);
    });

    return el("div", { class: "card block-card" }, [
        el("h3", {}, [name]),
        ...items
    ]);
}

// Info button and the help text it toggles. The open state is kept across re-renders.
function renderHelp(state, key, helpText) {
    if (!helpText) return { button: null, text: null };

    const helpId = `${key}_help`;
    const text = el("p", { class: `q-help${state.helpOpen[key] ? " is-visible" : ""}`, id: helpId }, [helpText]);
    const button = el(
        "button",
        {
            class: "info-btn",
            type: "button",
            "aria-label": "Toggle guidance",
            "aria-controls": helpId,
            "aria-expanded": state.helpOpen[key] ? "true" : "false",
            onclick: (e) => {
                const visible = !state.helpOpen[key];
                state.helpOpen[key] = visible;
                text.classList.toggle("is-visible", visible);
                e.currentTarget.setAttribute("aria-expanded", visible ? "true" : "false");
            }
        },
        ["i"]
    );

    return { button, text };
}

function groupByBlock(questions) {
    const groups = {};
    for (const q of questions) {
        groups[q.block] = groups[q.block] ?? [];
        groups[q.block].push(q);
    }
    return groups;
}

function buildSummaryText(state, assessment) {
    const minors = state.context.minors ?? CONTEXT_DEFAULTS.minors;
    const minorsLabel = minors === "yes" ? "Yes" : minors === "no" ? "No" : "Unsure";

    const lines = [];
    lines.push("Fair Monetisation Risk Assessment Tool");
    lines.push("");
    lines.push("Context");
    lines.push(`- Minors plausibly exposed: ${minorsLabel}`);
    lines.push("");
    lines.push(`Overall result: ${LEVELS[assessment.overallLevel].label}`);

    if (assessment.triggers.length) {
        lines.push("");
        lines.push("Hard triggers:");
        assessment.triggers.forEach(t => lines.push(`- ${t}`));
    }

    lines.push("");
    lines.push("Block-level orientation:");
    for (const [b, lvl] of Object.entries(assessment.blockLevels)) {
        const name = BLOCKS.find(x => x.id === b)?.name ?? b;
        lines.push(`- ${name}: ${LEVELS[lvl].label}`);
    }

    lines.push("");
    lines.push("Areas to review:");
    assessment.recommendations.forEach(r => lines.push(`- ${r}`));
    lines.push("");
    lines.push("Disclaimer: Informational only. Not legal advice. Does not certify compliance or fairness.");
    return lines.join("\n");
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (e) {
        return false;
    }
}

function flashStatus(node, msg, ok) {
    node.textContent = msg;
    node.dataset.state = ok ? "ok" : "err";
    node.classList.add("is-visible");
    clearTimeout(node._t);
    node._t = setTimeout(() => {
        node.classList.remove("is-visible");
    }, 1800);
}

function printText(text) {
    const esc = (s) =>
        String(s)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    const doc = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Assessment report</title>
  <style>
    @page { margin: 18mm; }
    html, body { background:#fff; color:#000; }
    body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
    pre { white-space: pre-wrap; font-size: 11pt; line-height: 1.45; margin: 0; }
  </style>
</head>
<body>
  <pre>${esc(text)}</pre>
  <script>
    window.addEventListener('load', () => {
      window.focus();
      window.print();
    });
  </script>
</body>
</html>`;

    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,width=900,height=700");
    // "noopener" returns no window handle, so release the URL once the new window had time to load it.
    setTimeout(() => URL.revokeObjectURL(url), 60000);
}
