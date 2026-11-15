// Question selection and scoring. No DOM access, so this module can be tested in Node.
import { BLOCKS, QUESTIONS } from "./data/questions.js";
import {
    CONTEXT_DEFAULTS,
    contextModifiers,
    HARD_TRIGGERS,
    THRESHOLDS,
    BLOCK_THRESHOLDS,
    AREAS_TO_REVIEW
} from "./data/rules.js";
import { mapLevel } from "./utils.js";

function filterQuestions(state, { forScoring = false } = {}) {
    const minors = state?.context?.minors ?? CONTEXT_DEFAULTS.minors;
    let list = QUESTIONS.slice();

    if (minors === "no") {
        // Keep D1 (hard trigger), drop D2 and D3.
        list = list.filter(q => !(q.block === "D" && (q.id === "D2" || q.id === "D3")));
    }

    return list;
}

export function getUiQuestions(state) {
    return filterQuestions(state, { forScoring: false });
}

function getScoringQuestions(state) {
    return filterQuestions(state, { forScoring: true });
}

export function runAssessment(state) {
    const relevant = getScoringQuestions(state);
    const mods = contextModifiers(state.context);

    const blockTotals = {};
    for (const b of BLOCKS) blockTotals[b.id] = 0;

    const triggeredBlocks = new Set();
    let total = 0;

    for (const q of relevant) {
        const ans = state.answers[q.id];
        const base = q.severity?.[ans] ?? 0;

        let weighted = base;

        // Context-calibrated sensitivity
        if (q.block === "D") weighted *= mods.minorsMultiplier;
        if (q.block === "C") weighted *= mods.pressureMultiplier;

        weighted = Math.round(weighted);

        blockTotals[q.block] = (blockTotals[q.block] ?? 0) + weighted;
        total += weighted;

        if (weighted >= 2) triggeredBlocks.add(q.block);
    }

    const triggers = [];
    let hardElevate = false;
    for (const t of HARD_TRIGGERS) {
        if (t.match(state.answers, state.context)) {
            triggers.push(t.description);
            hardElevate = true;
        }
    }

    const blockLevels = {};
    for (const b of BLOCKS) {
        const th = BLOCK_THRESHOLDS[b.id] ?? { greenMax: 1, yellowMax: 3 };
        blockLevels[b.id] = mapLevel(blockTotals[b.id] ?? 0, th);
    }

    const order = { green: 0, yellow: 1, red: 2 };

    // Overall orientation: total-based baseline, then constellation-based adjustment.
    let overallLevel = mapLevel(total, THRESHOLDS);

    const levels = Object.values(blockLevels);
    const redBlocks = levels.filter(l => l === "red").length;
    const yellowBlocks = levels.filter(l => l === "yellow").length;

    // Hard triggers always elevate to the highest concern level.
    if (hardElevate) {
        overallLevel = "red";
    } else if (redBlocks >= 1) {
        // A single elevated domain is sufficient for elevated overall.
        overallLevel = "red";
    } else if (yellowBlocks >= 2) {
        // Require multiple moderate domains before raising overall to moderate.
        if (order[overallLevel] < order["yellow"]) overallLevel = "yellow";
    }

    const recommendations = [];
    const blocksForReview = BLOCKS
        .map(b => b.id)
        .filter(id => blockLevels[id] === "yellow" || blockLevels[id] === "red");

    // Up to two prompts per flagged block (thesis appendix A.4).
    for (const b of blocksForReview) {
        for (const r of (AREAS_TO_REVIEW[b] ?? []).slice(0, 2)) {
            if (!recommendations.includes(r)) recommendations.push(r);
        }
    }

    if (!recommendations.length) {
        recommendations.push(
            "Document the rationale for key monetisation UX decisions and re-run the assessment for other flows."
        );
    }


    return { overallLevel, overallTotal: total, blockLevels, blockTotals, triggers, recommendations };
}
