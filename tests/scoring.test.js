// Pins question selection and the integrity of the v2 content data.
// Run with: npm test

import { test } from "node:test";
import assert from "node:assert/strict";

import { getQuestions } from "../js/scoring.js";
import { AREAS } from "../js/data/areas.js";
import { QUESTIONS, K2_OPTIONS } from "../js/data/questions.js";
import { SOURCES } from "../js/data/sources.js";
import { EXAMPLES } from "../js/data/examples.js";

const ALL_K2 = K2_OPTIONS.map(o => o.key);
const ids = context => getQuestions(context).map(q => q.id);

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
