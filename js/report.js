// Text for the result: reason sentence (spec 7.3). No DOM access, so this module can be tested in Node.
import { AREAS } from "./data/areas.js";

export const LEVEL_WORDS = { minimal: "Minimal", moderate: "Moderate", elevated: "Elevated" };

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
