// Text for the result: reason sentence (spec 7.3) and the plain-text report (spec 7.8).
// No DOM access, so this module can be tested in Node.
import { AREAS } from "./data/areas.js";
import { K2_OPTIONS } from "./data/questions.js";
import { SOURCES } from "./data/sources.js";

export const LEVEL_WORDS = { minimal: "Minimal", moderate: "Moderate", elevated: "Elevated" };
export const ANSWER_WORDS = { y: "Yes", n: "No", u: "Unsure" };
export const AS_OF = "November 2026";

// "Virtual currency, a subscription or a pass that renews"
export function includesText(k2) {
    const titles = K2_OPTIONS.filter(o => k2.includes(o.key)).map(o => o.title);
    if (!titles.length) return "None of these";
    return titles.map((t, i) => (i === 0 ? t : t.charAt(0).toLowerCase() + t.slice(1))).join(", ");
}

const lowerFirst = s => s.charAt(0).toLowerCase() + s.slice(1);

/**
 * The report for "Copy report".
 * @param state   the app state (name, k1, k2, answers)
 * @param result  runAssessment(state)
 * @param date    the date line, already formatted ("17 November 2026")
 * @param link    the link to this result
 */
export function buildReport(state, result, { date, link }) {
    const lines = ["Fair Monetisation Risk Assessment Tool"];
    const name = state.name.trim();
    if (name) lines.push(`Result for: ${name}`);
    lines.push(`Date: ${date}`, "");

    lines.push(`Overall concern: ${LEVEL_WORDS[result.overall]}`, reasonLines(result)[0], "");

    lines.push("Level by area");
    for (const a of AREAS) {
        const level = result.areaLevels[a.key];
        lines.push(`${a.name}: ${level ? LEVEL_WORDS[level] : "not in this flow"}`);
    }
    lines.push("");

    lines.push(`Worth a closer look (${result.entries.length})`);
    if (!result.entries.length) lines.push("Every answer was Yes, so there is nothing to flag in this flow.");
    result.entries.forEach((entry, i) => {
        const [first, ...rest] = entryLines(entry, result);
        lines.push(`${i + 1}. ${first}`, ...rest.map(line => `   ${line}`));
    });
    lines.push("");

    lines.push("All answers", `About this flow: under-18s ${ANSWER_WORDS[state.k1]}; includes ${lowerFirst(includesText(state.k2))}`);
    for (const q of result.asked) lines.push(`${q.shortLabel}: ${ANSWER_WORDS[state.answers[q.id]]}`);
    lines.push("");

    lines.push(
        `This result reflects what is visible in the interface and EU rules as of ${AS_OF}.`,
        "It is an assessment, not a legal verdict.",
        link
    );
    return lines.join("\n");
}

// Question, answer, text and sources of one entry. The report numbers and indents them.
function entryLines({ question: q, answer }, result) {
    const decides = result.hardTrigger && q.id === "D1" && answer === "n" ? ". This answer sets the result." : "";
    const sources = q.sources.map(key => {
        const s = SOURCES.find(x => x.key === key);
        return `${s.title} (${s.status})`;
    });
    return [
        q.text,
        `Your answer: ${ANSWER_WORDS[answer]}${decides}`,
        `${q.whyItMatters} ${q.expected}`,
        `Based on: ${sources.join(", ")}`
    ];
}

/**
 * The text for "Copy entry": one entry as in the report, followed by the link to the result.
 * @param entry   one of runAssessment(state).entries
 * @param result  runAssessment(state)
 * @param link    the link to this result
 */
export function buildEntry(entry, result, link) {
    return [...entryLines(entry, result), link].join("\n");
}

const COUNT_WORDS = ["None", "One", "Two", "Three", "Four", "Five"];

const areaNames = keys => keys.map(k => AREAS.find(a => a.key === k).name).join(", ");

function areasAt(result, level) {
    return AREAS.map(a => a.key).filter(k => result.areaLevels[k] === level);
}

// The two lines that explain the overall level. The first case that applies wins.
export function reasonLines(result) {
    const elevated = areasAt(result, "elevated");
    const moderate = areasAt(result, "moderate");
    const reached = (keys, level) =>
        `${COUNT_WORDS[keys.length]} ${keys.length === 1 ? "area" : "areas"} reached ${level}: ${areaNames(keys)}.`;

    if (result.hardTrigger) {
        return ["One answer sets this result.", "The offer tells children to buy or to ask an adult. EU law bans this outright."];
    }
    if (result.overall === "elevated") {
        return elevated.length
            ? [reached(elevated, "Elevated"), "One Elevated area is enough to make the overall result Elevated."]
            : ["Several areas add up to Elevated.", "No single area reached Elevated, but together the answers pass the overall threshold."];
    }
    if (result.overall === "moderate") {
        if (moderate.length >= 2) return [reached(moderate, "Moderate"), "Nothing reached Elevated. Two Moderate areas make the overall result at least Moderate."];
        if (moderate.length === 1) return [reached(moderate, "Moderate"), "Together with the other answers, this passes the overall threshold for Moderate."];
        return ["Several smaller points add up to Moderate.", "No single area stands out, but together the answers pass the overall threshold."];
    }
    if (moderate.length === 1) return [reached(moderate, "Moderate"), "On its own, this does not raise the overall result."];

    const n = result.entries.length;
    if (n === 0) return ["Nothing stands out.", "Every answer was Yes."];
    return ["Nothing stands out.", n === 1 ? "One answer is still worth a look." : `${n} answers are still worth a look.`];
}
