// Pins question selection, the v2 content data and the scoring rules (spec section 9).
// Run with: npm test

import { test } from "node:test";
import assert from "node:assert/strict";

import { getQuestions, runAssessment } from "../js/scoring.js";
import { AREAS } from "../js/data/areas.js";
import { QUESTIONS, K2_OPTIONS } from "../js/data/questions.js";
import { SOURCES } from "../js/data/sources.js";
import { EXAMPLES } from "../js/data/examples.js";
import { HARD_TRIGGER } from "../js/data/rules.js";
import { VECTORS } from "./vectors.js";

const ALL_K2 = K2_OPTIONS.map(o => o.key);
const ids = context => getQuestions(context).map(q => q.id);

// Every asked question is answered Yes unless listed in no or unsure.
function assess({ k1, k2 = [], no = [], unsure = [] }) {
    const answers = {};
    for (const id of ids({ k1, k2 })) answers[id] = no.includes(id) ? "n" : unsure.includes(id) ? "u" : "y";
    return runAssessment({ k1, k2, answers });
}

test("data: question ids are unique and every reference resolves", () => {
    const areaKeys = AREAS.map(a => a.key);
    const sourceKeys = SOURCES.map(s => s.key);
    const requirementKeys = [...ALL_K2, "minors"];

    assert.equal(new Set(QUESTIONS.map(q => q.id)).size, QUESTIONS.length);
    for (const q of QUESTIONS) {
        assert.ok(areaKeys.includes(q.area), q.id);
        assert.ok(q.sources.every(s => sourceKeys.includes(s)), q.id);
        assert.ok(q.requires.every(r => requirementKeys.includes(r)), q.id);
        assert.ok(q.points.n > q.points.u && q.points.u > 0, q.id);
    }
    for (const a of AREAS) assert.ok(a.sources.every(s => sourceKeys.includes(s)), a.key);
});

test("selection: shortest run has 6 questions, longest 15", () => {
    assert.deepEqual(ids({ k1: "n", k2: [] }), ["A1", "B1", "B3", "C1", "C2", "D1"]);
    assert.deepEqual(ids({ k1: "y", k2: ALL_K2 }), QUESTIONS.map(q => q.id));
});

test("selection: K1 Yes and Unsure add D2 to D4, K1 No does not", () => {
    for (const k1 of ["y", "u"]) {
        assert.deepEqual(ids({ k1, k2: [] }), ["A1", "B1", "B3", "C1", "C2", "D1", "D2", "D3", "D4"]);
    }
    assert.ok(!ids({ k1: "n", k2: [] }).includes("D2"));
});

test("selection: each K2 option adds its questions", () => {
    const added = key => ids({ k1: "n", k2: [key] }).filter(id => !ids({ k1: "n", k2: [] }).includes(id));
    assert.deepEqual(added("vc"), ["A2", "A3"]);
    assert.deepEqual(added("sub"), ["B2"]);
    assert.deepEqual(added("limited"), ["C3"]);
    assert.deepEqual(added("random"), ["E1"]);
});

test("selection: E2 needs paid random items and under-18s", () => {
    assert.ok(ids({ k1: "y", k2: ["random"] }).includes("E2"));
    assert.ok(ids({ k1: "u", k2: ["random"] }).includes("E2"));
    assert.ok(!ids({ k1: "n", k2: ["random"] }).includes("E2"));
    assert.ok(!ids({ k1: "y", k2: [] }).some(id => id.startsWith("E")));
});

test("selection: every run has between 6 and 15 questions and covers areas A to D", () => {
    const subsets = Array.from({ length: 2 ** ALL_K2.length }, (_, mask) => ALL_K2.filter((_, i) => mask & (1 << i)));
    for (const k1 of ["y", "n", "u"]) {
        for (const k2 of subsets) {
            const asked = getQuestions({ k1, k2 });
            assert.ok(asked.length >= 6 && asked.length <= 15);
            for (const area of ["A", "B", "C", "D"]) assert.ok(asked.some(q => q.area === area));
        }
    }
});

test("selection: before K1 is answered, only the context-free questions count", () => {
    assert.deepEqual(ids({}), ids({ k1: "n", k2: [] }));
    assert.deepEqual(ids({ k1: null, k2: ["vc"] }), ids({ k1: "n", k2: ["vc"] }));
});

test("examples: 8, 12 and 9 questions, and every listed answer is asked", () => {
    const expected = { currency: 8, pass: 12, children: 9 };
    for (const e of EXAMPLES) {
        const asked = ids(e);
        assert.equal(asked.length, expected[e.key], e.key);
        assert.ok([...e.no, ...e.unsure].every(id => asked.includes(id)), e.key);
    }
});

// --- Scoring ------------------------------------------------------------------

for (const v of VECTORS) {
    test(`vector: ${v.name}`, () => {
        const r = assess(v);
        assert.equal(r.asked.length, v.asked);
        assert.deepEqual(r.areaPoints, v.areaPoints);
        assert.deepEqual(r.areaLevels, v.areaLevels);
        assert.equal(r.total, v.total);
        assert.equal(r.base, v.base);
        assert.deepEqual(r.thresholds, v.thresholds);
        assert.equal(r.overall, v.overall);
        assert.equal(r.rule, v.rule);
    });
}

test("rule: area levels, up to 3 minimal, above 3 moderate, above 6 elevated", () => {
    const a = no => assess({ k1: "n", k2: ["vc"], ...no }).areaLevels.A;
    assert.equal(a({ no: ["A1"] }), "minimal"); // 3
    assert.equal(a({ no: ["A1"], unsure: ["A2"] }), "moderate"); // 4
    assert.equal(a({ no: ["A1", "A2"], unsure: ["A3"] }), "moderate"); // 6
    assert.equal(a({ no: ["A1", "A2", "A3"] }), "elevated"); // 7
});

test("rule: weighted points are not rounded per question (correction 1)", () => {
    const r = assess({ k1: "y", no: ["C1"] });
    assert.equal(r.areaPoints.C, 3.3);
    assert.equal(r.areaLevels.C, "moderate");
    assert.equal(assess({ k1: "u", unsure: ["D2"] }).areaPoints.D, 1.1);
});

test("rule: D1 = No is a hard trigger in every context and sets area D to elevated (correction 2)", () => {
    for (const k1 of ["y", "n", "u"]) {
        const r = assess({ k1, no: ["D1"] });
        assert.equal(r.hardTrigger, true);
        assert.equal(r.areaLevels.D, "elevated");
        assert.equal(r.overall, "elevated");
        assert.equal(r.rule, "hard-trigger");
    }
    assert.equal(assess({ k1: "y", unsure: ["D1"] }).hardTrigger, false);
});

test("rule: overall thresholds are 40% and 70% of the base without D1 (correction 3)", () => {
    const r = assess({ k1: "n" });
    assert.equal(r.base, 13); // A1 3, B1 3, B3 2, C1 3, C2 2
    assert.deepEqual(r.thresholds, { moderateAbove: 5.2, elevatedAbove: 9.1 });
    // 0.7 * 20 is 13.999... in floating point; thresholds are rounded like the points.
    assert.equal(assess({ k1: "y" }).thresholds.elevatedAbove, 14);
});

test("rule: every No and Unsure is an entry, in question order (correction 4)", () => {
    const r = assess({ k1: "y", k2: ALL_K2, no: ["E2", "A1"], unsure: ["C3", "B1"] });
    assert.deepEqual(r.entries.map(e => [e.question.id, e.answer]), [["A1", "n"], ["B1", "u"], ["C3", "u"], ["E2", "n"]]);
});

test("rule: one elevated area makes the result elevated", () => {
    const r = assess({ k1: "n", k2: ["vc"], no: ["A1", "A2", "A3"] });
    assert.equal(r.overall, "elevated");
    assert.equal(r.rule, "area-elevated");
});

test("rule: two moderate areas make the result at least moderate", () => {
    const r = assess({ k1: "y", k2: ALL_K2, no: ["A2", "A3", "B2", "B3"] });
    assert.equal(r.overall, "moderate");
    assert.equal(r.rule, "two-moderate");
});

test("rule: an area rule is only named when it raised the level", () => {
    // Total 12 is above 11.9 on its own, area A is elevated as well.
    const r = assess({ k1: "n", k2: ["vc"], no: ["A1", "A2", "A3", "B1", "B3"] });
    assert.equal(r.total, 12);
    assert.equal(r.areaLevels.A, "elevated");
    assert.equal(r.overall, "elevated");
    assert.equal(r.rule, "points");
});

test("rule: unanswered questions count like Yes and a missing state does not throw", () => {
    const r = runAssessment();
    assert.equal(r.overall, "minimal");
    assert.equal(r.total, 0);
    assert.deepEqual(r.entries, []);
    assert.deepEqual(runAssessment({ k1: "y", k2: ["vc"] }).areaPoints, { A: 0, B: 0, C: 0, D: 0 });
});

// --- Invariants over every answer combination of a few contexts --------------

const RANK = { minimal: 0, moderate: 1, elevated: 2 };
const ANSWERS = ["y", "u", "n"];

function checkInvariants(k1, k2) {
    const asked = ids({ k1, k2 });
    const n = asked.length;
    const count = 3 ** n;
    const results = new Array(count);

    for (let index = 0; index < count; index++) {
        const answers = {};
        let rest = index;
        for (let i = n - 1; i >= 0; i--) {
            answers[asked[i]] = ANSWERS[rest % 3];
            rest = Math.floor(rest / 3);
        }
        const r = runAssessment({ k1, k2, answers });
        const flagged = Object.values(answers).filter(a => a !== "y").length;
        assert.equal(r.entries.length, flagged);
        if (answers[HARD_TRIGGER] === "n") assert.equal(r.overall, "elevated");
        results[index] = [RANK[r.overall], ...Object.values(r.areaLevels).map(l => RANK[l])];
    }

    // Raising one answer (Yes to Unsure, Unsure to No) never lowers any level.
    for (let index = 0; index < count; index++) {
        for (let i = 0, step = 1; i < n; i++, step *= 3) {
            if (Math.floor(index / step) % 3 === 2) continue;
            const lower = results[index];
            const higher = results[index + step];
            assert.ok(lower.every((l, j) => higher[j] >= l), `${k1} ${k2} ${index}`);
        }
    }
}

for (const [k1, k2] of [["n", []], ["y", []], ["u", ["vc"]], ["y", ["random"]]]) {
    test(`invariants: K1 ${k1}, K2 [${k2}]`, () => checkInvariants(k1, k2));
}
