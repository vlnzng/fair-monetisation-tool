// Question selection and scoring. No DOM access, so this module can be tested in Node.
import { QUESTIONS } from "./data/questions.js";
import { AREA_THRESHOLDS, OVERALL_SHARE, HARD_TRIGGER, FACTORS } from "./data/rules.js";

// "minors" stands for K1 = Yes or Unsure, every other requirement is a K2 key.
function meets(requirement, k1, k2) {
    if (requirement === "minors") return k1 === "y" || k1 === "u";
    return k2.includes(requirement);
}

// The questions asked for this context, in the order A1 to E2.
export function getQuestions({ k1 = null, k2 = [] } = {}) {
    return QUESTIONS.filter(q => q.requires.every(r => meets(r, k1, k2)));
}

// Two decimals, to keep floating point noise out of threshold comparisons.
const round2 = n => Math.round(n * 100) / 100;

function factor(q, k1) {
    return (FACTORS[q.id] ?? FACTORS[q.area])?.[k1] ?? 1;
}

function level(points, { moderateAbove, elevatedAbove }) {
    if (points > elevatedAbove) return "elevated";
    if (points > moderateAbove) return "moderate";
    return "minimal";
}

// Scores one run. Unanswered questions count like Yes.
// rule names what decided the overall level: "hard-trigger", "area-elevated" or "two-moderate"
// when that rule raised it, otherwise "points".
export function runAssessment({ k1 = null, k2 = [], answers = {} } = {}) {
    const asked = getQuestions({ k1, k2 });

    const areaPoints = {};
    for (const q of asked) {
        const raw = q.points[answers[q.id]] ?? 0;
        areaPoints[q.area] = (areaPoints[q.area] ?? 0) + raw * factor(q, k1);
    }

    const areaLevels = {};
    for (const area of Object.keys(areaPoints)) {
        areaPoints[area] = round2(areaPoints[area]);
        areaLevels[area] = level(areaPoints[area], AREA_THRESHOLDS);
    }

    const hardTrigger = answers[HARD_TRIGGER] === "n";
    if (hardTrigger) areaLevels.D = "elevated";

    const total = round2(Object.values(areaPoints).reduce((sum, p) => sum + p, 0));
    const base = asked.filter(q => q.id !== HARD_TRIGGER).reduce((sum, q) => sum + q.points.n, 0);
    const thresholds = {
        moderateAbove: round2(base * OVERALL_SHARE.moderateAbove),
        elevatedAbove: round2(base * OVERALL_SHARE.elevatedAbove)
    };

    let overall = level(total, thresholds);
    let rule = "points";
    const levels = Object.values(areaLevels);

    if (hardTrigger) {
        overall = "elevated";
        rule = "hard-trigger";
    } else if (overall !== "elevated" && levels.includes("elevated")) {
        overall = "elevated";
        rule = "area-elevated";
    } else if (overall === "minimal" && levels.filter(l => l === "moderate").length >= 2) {
        overall = "moderate";
        rule = "two-moderate";
    }

    const entries = asked
        .filter(q => answers[q.id] === "n" || answers[q.id] === "u")
        .map(q => ({ question: q, answer: answers[q.id] }));

    return { asked, areaPoints, areaLevels, total, base, thresholds, overall, rule, hardTrigger, entries };
}
