// Pins the reason sentence of the result (spec 7.3), one test per row of its table.
// Run with: npm test

import { test } from "node:test";
import assert from "node:assert/strict";

import { getQuestions, runAssessment } from "../js/scoring.js";
import { reasonLines } from "../js/report.js";

function reason({ k1, k2 = [], no = [], unsure = [] }) {
    const answers = {};
    for (const q of getQuestions({ k1, k2 })) answers[q.id] = no.includes(q.id) ? "n" : unsure.includes(q.id) ? "u" : "y";
    return reasonLines(runAssessment({ k1, k2, answers }));
}

test("reason: hard trigger", () => {
    assert.deepEqual(reason({ k1: "y", no: ["C1", "D1", "D3"] }), [
        "One answer sets this result.",
        "The offer tells children to buy or to ask an adult. EU law bans this outright."
    ]);
});

test("reason: one and two elevated areas", () => {
    assert.deepEqual(reason({ k1: "n", k2: ["vc"], no: ["A1", "A2", "A3"] }), [
        "One area reached Elevated: Prices and currency.",
        "One Elevated area is enough to make the overall result Elevated."
    ]);
    assert.equal(reason({ k1: "n", k2: ["vc", "sub"], no: ["A1", "A2", "A3", "B1", "B2", "B3"] })[0],
        "Two areas reached Elevated: Prices and currency, Checkout and control.");
});

test("reason: elevated by total only", () => {
    assert.deepEqual(reason({ k1: "n", k2: ["vc", "sub", "limited"], no: ["A1", "A2", "B1", "B2", "C1", "C2"], unsure: ["A3", "B3", "C3"] }), [
        "Several areas add up to Elevated.",
        "No single area reached Elevated, but together the answers pass the overall threshold."
    ]);
});

test("reason: moderate with two, one and no moderate areas", () => {
    assert.deepEqual(reason({ k1: "y", k2: ["vc", "sub"], no: ["B2", "B3", "C1", "C2"], unsure: ["D2"] }), [
        "Two areas reached Moderate: Checkout and control, Offers and pressure.",
        "Nothing reached Elevated. Two Moderate areas make the overall result at least Moderate."
    ]);
    assert.deepEqual(reason({ k1: "n", no: ["A1", "B1"], unsure: ["B3", "C1"] }), [
        "One area reached Moderate: Checkout and control.",
        "Together with the other answers, this passes the overall threshold for Moderate."
    ]);
    assert.deepEqual(reason({ k1: "n", no: ["A1", "B1"], unsure: ["C1"] }), [
        "Several smaller points add up to Moderate.",
        "No single area stands out, but together the answers pass the overall threshold."
    ]);
});

test("reason: minimal with one moderate area, with entries, without entries", () => {
    assert.deepEqual(reason({ k1: "y", no: ["C1"] }), [
        "One area reached Moderate: Offers and pressure.",
        "On its own, this does not raise the overall result."
    ]);
    assert.deepEqual(reason({ k1: "n", unsure: ["B3"] }), ["Nothing stands out.", "One answer is still worth a look."]);
    assert.deepEqual(reason({ k1: "n", unsure: ["B3", "C2", "A1"] }), ["Nothing stands out.", "3 answers are still worth a look."]);
    assert.deepEqual(reason({ k1: "n" }), ["Nothing stands out.", "Every answer was Yes."]);
});
