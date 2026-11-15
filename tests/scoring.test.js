// Pins the scoring behaviour of the thesis version (tag v1.0-thesis).
// Run with: npm test
//
// Levels in code: green = minimal, yellow = moderate, red = elevated concern.
// If a test fails after an intended change to the rules, update the expected
// values in the same commit and say so in the commit message.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { getUiQuestions, runAssessment } from "../js/scoring.js";
import { QUESTIONS } from "../js/data/questions.js";
import { AREAS_TO_REVIEW } from "../js/data/rules.js";

const BLOCK_IDS = ["A", "B", "C", "D"];

// Every asked question is answered "yes" (no concern) unless overridden.
function assess(minors, overrides = {}) {
    const context = { minors };
    const answers = {};
    for (const q of getUiQuestions({ context })) answers[q.id] = "yes";
    return runAssessment({ context, answers: { ...answers, ...overrides } });
}

test("minors = no drops D2 and D3, the other contexts ask all twelve questions", () => {
    const ids = minors => getUiQuestions({ context: { minors } }).map(q => q.id);
    const all = QUESTIONS.map(q => q.id);

    assert.equal(all.length, 12);
    assert.deepEqual(ids("yes"), all);
    assert.deepEqual(ids("unsure"), all);
    assert.deepEqual(ids("no"), all.filter(id => id !== "D2" && id !== "D3"));
});

test("all answers yes: minimal everywhere, one generic review prompt", () => {
    for (const minors of ["yes", "unsure", "no"]) {
        const r = assess(minors);
        assert.equal(r.overallLevel, "green");
        assert.equal(r.overallTotal, 0);
        assert.deepEqual(r.blockLevels, { A: "green", B: "green", C: "green", D: "green" });
        assert.deepEqual(r.triggers, []);
        assert.equal(r.recommendations.length, 1);
        assert.ok(!Object.values(AREAS_TO_REVIEW).flat().includes(r.recommendations[0]));
    }
});

test("block level: up to 3 minimal, up to 6 moderate, above 6 elevated", () => {
    const cases = [
        [{ A1: "no" }, 3, "green"],
        [{ A1: "no", A3: "unsure" }, 4, "yellow"],
        [{ A1: "no", A2: "no", A3: "unsure" }, 6, "yellow"],
        [{ A1: "no", A2: "no", A3: "no" }, 7, "red"]
    ];
    for (const [answers, total, level] of cases) {
        const r = assess("no", answers);
        assert.equal(r.blockTotals.A, total);
        assert.equal(r.blockLevels.A, level);
    }
});

test("overall: one elevated block is enough for elevated", () => {
    const r = assess("no", { A1: "no", A2: "no", A3: "no" });
    assert.equal(r.overallTotal, 7);
    assert.equal(r.overallLevel, "red");
    assert.deepEqual(r.triggers, []);
});

test("overall: one moderate block alone stays minimal", () => {
    const r = assess("no", { A1: "no", A2: "no", A3: "unsure" });
    assert.equal(r.blockLevels.A, "yellow");
    assert.equal(r.overallTotal, 6);
    assert.equal(r.overallLevel, "green");
});

test("overall: two moderate blocks give at least moderate", () => {
    const r = assess("no", { A1: "no", A3: "unsure", B1: "no", B3: "unsure" });
    assert.deepEqual(r.blockLevels, { A: "yellow", B: "yellow", C: "green", D: "green" });
    assert.equal(r.overallTotal, 8);
    assert.equal(r.overallLevel, "yellow");
});

test("overall: a total above 10 is moderate even with a single moderate block", () => {
    const r = assess("no", { A1: "no", A2: "no", A3: "unsure", B1: "no", C2: "no" });
    assert.deepEqual(r.blockLevels, { A: "yellow", B: "green", C: "green", D: "green" });
    assert.equal(r.overallTotal, 11);
    assert.equal(r.overallLevel, "yellow");
});

test("overall: a total above 18 is elevated without an elevated block or hard trigger", () => {
    const sixEach = {
        A1: "no", A2: "no", A3: "unsure",
        B1: "no", B2: "no", B3: "unsure",
        C1: "no", C2: "no", C3: "unsure"
    };

    const at18 = assess("unsure", sixEach);
    assert.equal(at18.overallTotal, 18);
    assert.equal(at18.overallLevel, "yellow");

    const at19 = assess("unsure", { ...sixEach, D2: "unsure" });
    assert.deepEqual(at19.blockLevels, { A: "yellow", B: "yellow", C: "yellow", D: "green" });
    assert.deepEqual(at19.triggers, []);
    assert.equal(at19.overallTotal, 19);
    assert.equal(at19.overallLevel, "red");
});

test("hard trigger: D1 = no is elevated when minors are yes or unsure", () => {
    for (const minors of ["yes", "unsure"]) {
        const r = assess(minors, { D1: "no" });
        assert.equal(r.triggers.length, 1);
        assert.equal(r.overallLevel, "red");
        // The block itself only reaches moderate.
        assert.equal(r.blockTotals.D, 6);
        assert.equal(r.blockLevels.D, "yellow");
    }
});

test("hard trigger: D1 = no does not fire when minors = no", () => {
    const r = assess("no", { D1: "no" });
    assert.deepEqual(r.triggers, []);
    assert.equal(r.blockTotals.D, 5);
    assert.equal(r.blockLevels.D, "yellow");
    assert.equal(r.overallLevel, "green");
});

test("context multipliers are rounded per question", () => {
    // [minors, answers, block, expected block total]
    const cases = [
        // minors = yes: block D x 1.25, block C x 1.10
        ["yes", { D1: "unsure" }, "D", 3], // 2.5
        ["yes", { D2: "no" }, "D", 4], // 3.75
        ["yes", { D3: "no" }, "D", 3], // 2.5
        ["yes", { D2: "unsure" }, "D", 1], // 1.25
        ["yes", { D3: "unsure" }, "D", 1], // 1.25
        ["yes", { C1: "no" }, "C", 3], // 3.3
        ["yes", { C2: "no" }, "C", 2], // 2.2
        ["yes", { C1: "unsure" }, "C", 1], // 1.1
        // minors = unsure: block D x 1.10
        ["unsure", { D1: "no" }, "D", 6], // 5.5
        ["unsure", { D1: "unsure" }, "D", 2], // 2.2
        ["unsure", { D2: "no" }, "D", 3], // 3.3
        ["unsure", { D3: "no" }, "D", 2], // 2.2
        ["unsure", { C1: "no" }, "C", 3], // no factor
        // minors = no: no factors
        ["no", { D1: "no" }, "D", 5],
        ["no", { C1: "no" }, "C", 3]
    ];
    for (const [minors, answers, block, total] of cases) {
        const r = assess(minors, answers);
        assert.equal(r.blockTotals[block], total, `${minors} ${JSON.stringify(answers)}`);
    }
});

test("minors = no ignores leftover answers to D2 and D3", () => {
    const r = assess("no", { D2: "no", D3: "no" });
    assert.equal(r.blockTotals.D, 0);
    assert.equal(r.overallLevel, "green");
});

test("a missing context is scored like unsure", () => {
    const r = runAssessment({ context: { minors: null }, answers: { D1: "no" } });
    assert.equal(r.blockTotals.D, 6);
    assert.equal(r.triggers.length, 1);
});

test("review list: two prompts per flagged block, in block order", () => {
    const onlyA = assess("no", { A1: "no", A3: "unsure" });
    assert.deepEqual(onlyA.recommendations, AREAS_TO_REVIEW.A);

    const aAndD = assess("no", { A1: "no", A3: "unsure", D1: "no" });
    assert.deepEqual(aAndD.recommendations, [...AREAS_TO_REVIEW.A, ...AREAS_TO_REVIEW.D]);
});

test("review list: capped at six, so block D is dropped when all four blocks are flagged", () => {
    // Known gap of the thesis version, pinned on purpose.
    const r = assess("yes", {
        A1: "no", A3: "unsure",
        B1: "no", B3: "unsure",
        C1: "no", C3: "unsure",
        D1: "no"
    });
    assert.deepEqual(r.blockLevels, { A: "yellow", B: "yellow", C: "yellow", D: "yellow" });
    assert.deepEqual(r.recommendations, [
        ...AREAS_TO_REVIEW.A,
        ...AREAS_TO_REVIEW.B,
        ...AREAS_TO_REVIEW.C
    ]);
});

// --- Every possible answer combination -------------------------------------
//
// `counts` is the number of combinations per overall level.
// `levels` is a checksum over overall level, block levels, block totals,
// overall total and number of hard triggers for every combination.
// `prompts` is a checksum over which review prompts are listed, by position
// in AREAS_TO_REVIEW, so rewording a prompt does not change it.

const EXPECTED = {
    yes: {
        counts: { green: 50205, yellow: 170233, red: 311003 },
        levels: "1fe6c626ed82969c9a0e1e9eeac755f52c65f4d6754152874d6598dbf3fac8f5",
        prompts: "f561a8df424774a3133570371b318f4aeeddabd59f5dc2c15b3744b02942db2b"
    },
    unsure: {
        counts: { green: 69550, yellow: 219918, red: 241973 },
        levels: "e58cfca12c76e7f2904072cc4b8408fd0649543cf4bb801345118cbd37775b50",
        prompts: "441d48e2b9a98d9fdd19ecd576f035e76942a19993b7f2aa38577977f7a75f03"
    },
    no: {
        counts: { green: 16930, yellow: 34416, red: 7703 },
        levels: "982bd90e4361a5cfee39789b5ba2df2014a8151d2ccfbde4803ff8101e8a836b",
        prompts: "8cc3a68e5c17fb36a48bc92012f0ba73434e00585941594d132106ba236fcb53"
    }
};

const ANSWERS = ["yes", "no", "unsure"];

function* allAnswerSets(ids) {
    const idx = new Array(ids.length).fill(0);
    while (true) {
        const answers = {};
        ids.forEach((id, i) => { answers[id] = ANSWERS[idx[i]]; });
        yield answers;
        let i = ids.length - 1;
        while (i >= 0 && ++idx[i] === ANSWERS.length) idx[i--] = 0;
        if (i < 0) return;
    }
}

const promptCode = new Map();
for (const [block, prompts] of Object.entries(AREAS_TO_REVIEW)) {
    prompts.forEach((text, i) => promptCode.set(text, `${block}${i + 1}`));
}

function fingerprint(minors) {
    const context = { minors };
    const ids = getUiQuestions({ context }).map(q => q.id);
    const counts = { green: 0, yellow: 0, red: 0 };
    const levels = createHash("sha256");
    const prompts = createHash("sha256");

    for (const answers of allAnswerSets(ids)) {
        const r = runAssessment({ context, answers });
        counts[r.overallLevel]++;
        levels.update(
            [
                r.overallLevel,
                BLOCK_IDS.map(b => r.blockLevels[b]).join(","),
                BLOCK_IDS.map(b => r.blockTotals[b]).join(","),
                r.overallTotal,
                r.triggers.length
            ].join("|") + "\n"
        );
        prompts.update(r.recommendations.map(t => promptCode.get(t) ?? "fallback").join(",") + "\n");
    }

    return { counts, levels: levels.digest("hex"), prompts: prompts.digest("hex") };
}

for (const minors of ["yes", "unsure", "no"]) {
    test(`all answer combinations, minors = ${minors}`, () => {
        assert.deepEqual(fingerprint(minors), EXPECTED[minors]);
    });
}
