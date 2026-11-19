// Result link in the URL fragment (spec section 10). The fragment never reaches the server.
// No DOM access, so this module can be tested in Node.
import { K2_OPTIONS } from "./data/questions.js";
import { EXAMPLES } from "./data/examples.js";
import { getQuestions } from "./scoring.js";

export const NAME_MAX = 40;
const K2_KEYS = K2_OPTIONS.map(o => o.key);

// "example=currency" for an example, otherwise "k1=y&k2=vc,sub&a=A1n,A2y&name=Gem%20Shop".
export function encodeFragment(state) {
    if (state.example) return `example=${state.example}`;
    const asked = getQuestions(state);
    const parts = [
        `k1=${state.k1}`,
        `k2=${K2_KEYS.filter(k => state.k2.includes(k)).join(",")}`,
        `a=${asked.map(q => q.id + state.answers[q.id]).join(",")}`
    ];
    const name = state.name.trim().slice(0, NAME_MAX);
    if (name) parts.push(`name=${encodeURIComponent(name)}`);
    return parts.join("&");
}

export function stateFromExample(key) {
    const e = EXAMPLES.find(x => x.key === key);
    if (!e) return null;
    const answers = {};
    for (const q of getQuestions(e)) answers[q.id] = e.no.includes(q.id) ? "n" : e.unsure.includes(q.id) ? "u" : "y";
    return { k1: e.k1, k2: [...e.k2], answers, name: e.title, example: e.key };
}

// Returns the run described by the fragment, or null when the fragment is a section anchor
// or does not describe a complete run for its K1 and K2.
export function decodeFragment(hash) {
    const raw = hash.replace(/^#/, "");
    if (!raw.includes("=")) return null;
    const params = new URLSearchParams(raw);

    if (params.has("example")) return stateFromExample(params.get("example"));

    const k1 = params.get("k1");
    if (!["y", "n", "u"].includes(k1)) return null;

    const k2 = (params.get("k2") ?? "").split(",").filter(Boolean);
    if (!k2.every(k => K2_KEYS.includes(k)) || new Set(k2).size !== k2.length) return null;

    const answers = {};
    for (const token of (params.get("a") ?? "").split(",").filter(Boolean)) {
        const m = /^([A-E][1-4])([ynu])$/.exec(token);
        if (!m || answers[m[1]]) return null;
        answers[m[1]] = m[2];
    }

    const asked = getQuestions({ k1, k2 }).map(q => q.id);
    const given = Object.keys(answers);
    if (given.length !== asked.length || !asked.every(id => answers[id])) return null;

    const name = (params.get("name") ?? "").trim().slice(0, NAME_MAX);
    return { k1, k2: K2_KEYS.filter(k => k2.includes(k)), answers, name, example: null };
}
