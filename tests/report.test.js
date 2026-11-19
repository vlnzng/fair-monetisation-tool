// Pins the reason sentence of the result (spec 7.3, one test per row of its table)
// and the plain-text report (spec 7.8).
// Run with: npm test

import { test } from "node:test";
import assert from "node:assert/strict";

import { getQuestions, runAssessment } from "../js/scoring.js";
import { reasonLines, buildReport, buildEntry } from "../js/report.js";

function reason({ k1, k2 = [], no = [], unsure = [] }) {
    const answers = {};
    for (const q of getQuestions({ k1, k2 })) answers[q.id] = no.includes(q.id) ? "n" : unsure.includes(q.id) ? "u" : "y";
    return reasonLines(runAssessment({ k1, k2, answers }));
}

test("reason: hard trigger", () => {
    assert.deepEqual(reason({ k1: "y", no: ["C1", "D1", "D3"] }), [
        "One answer sets this result.",
        "Your answer to \"Do offers stay neutral towards children?\" was No. EU law bans telling children to buy."
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

test("report: plain text in the form of spec 7.8", () => {
    const state = {
        k1: "y",
        k2: ["vc"],
        answers: { A1: "n", A2: "n", A3: "n", B1: "y", B3: "y", C1: "y", C2: "n", D1: "y", D2: "u", D3: "y", D4: "y" },
        name: "Gem Shop"
    };
    const text = buildReport(state, runAssessment(state), { date: "17 November 2026", link: "https://example.test/#k1=y" });
    assert.equal(text, [
        "Fair Monetisation Risk Assessment Tool",
        "Result for: Gem Shop",
        "Date: 17 November 2026",
        "",
        "Overall concern: Elevated",
        "One area reached Elevated: Prices and currency.",
        "",
        "Level by area",
        "Prices and currency: Elevated",
        "Checkout and control: Minimal",
        "Offers and pressure: Minimal",
        "Under-18 protection: Minimal",
        "Paid random items: not in this flow",
        "",
        "Worth a closer look (5)",
        "1. Is the real-money price shown next to the buy button?",
        "   Your answer: No",
        "   Prices only in Gems hide what an item costs in euros. Guidance expects the euro price next to every currency price.",
        "   Based on: Key principles on in-game virtual currencies (EU guidance), Digital Fairness Act (2026 proposal)",
        "2. Do players need at most one virtual currency to buy an item?",
        "   Your answer: No",
        "   Each extra currency adds a conversion step between the item and its price. Guidance expects items to be bought without conversion chains.",
        "   Based on: Key principles on in-game virtual currencies (EU guidance)",
        "3. Can players buy the amount of currency they actually need?",
        "   Your answer: No",
        "   Fixed packs leave leftover currency that pulls players back. Guidance expects pack sizes that match item prices.",
        "   Based on: Key principles on in-game virtual currencies (EU guidance)",
        "4. After a player declines an offer, does it stay away for the rest of the session?",
        "   Your answer: No",
        "   An offer that keeps coming back wears down a decision already made. The proposal names repeated prompts as unfair pressure.",
        "   Based on: Digital Fairness Act (2026 proposal)",
        "5. Are purchases switched off or locked for under-18s by default?",
        "   Your answer: Unsure",
        "   If parents have to find the setting, children can spend from the start. The proposal expects purchases to be off for minors by default.",
        "   Based on: Digital Fairness Act (2026 proposal)",
        "",
        "All answers",
        "About this flow: under-18s Yes; includes virtual currency",
        "Real-money price next to the buy button: No",
        "At most one virtual currency: No",
        "Buying the amount needed: No",
        "Confirmation before paying: Yes",
        "Help, refunds and withdrawal easy to find: Yes",
        "Buying and declining equally clear: Yes",
        "Declined offers stay away: No",
        "Offers neutral towards children: Yes",
        "Purchases off by default for under-18s: Unsure",
        "Understandable for the youngest players: Yes",
        "Progress without being told to pay: Yes",
        "",
        "This result reflects what is visible in the interface and EU rules as of November 2026.",
        "It is an assessment, not a legal verdict.",
        "https://example.test/#k1=y"
    ].join("\n"));
});

test("report: without a name, without entries, and with the hard trigger", () => {
    const empty = { k1: "n", k2: [], answers: { A1: "y", B1: "y", B3: "y", C1: "y", C2: "y", D1: "y" }, name: "" };
    const text = buildReport(empty, runAssessment(empty), { date: "1 January 2027", link: "L" });
    assert.ok(!text.includes("Result for:"));
    assert.ok(text.includes("Worth a closer look (0)\nEvery answer was Yes, so there is nothing to flag in this flow."));
    assert.ok(text.includes("About this flow: under-18s No; includes none of these"));

    const child = { k1: "y", k2: [], answers: { A1: "y", B1: "y", B3: "y", C1: "n", C2: "y", D1: "n", D2: "y", D3: "n", D4: "y" }, name: "" };
    assert.ok(buildReport(child, runAssessment(child), { date: "d", link: "L" }).includes("   Your answer: No. This answer sets the result."));
});

test("copy entry: one entry in the report form, then the link", () => {
    const state = { k1: "n", k2: ["vc"], answers: { A1: "n", A2: "y", A3: "y", B1: "y", B3: "y", C1: "y", C2: "y", D1: "y" }, name: "" };
    const result = runAssessment(state);
    assert.equal(buildEntry(result.entries[0], result, "https://example.test/#k1=n"), [
        "Is the real-money price shown next to the buy button?",
        "Your answer: No",
        "Prices only in Gems hide what an item costs in euros. Guidance expects the euro price next to every currency price.",
        "Based on: Key principles on in-game virtual currencies (EU guidance), Digital Fairness Act (2026 proposal)",
        "https://example.test/#k1=n"
    ].join("\n"));

    const child = { k1: "y", k2: [], answers: { A1: "y", B1: "y", B3: "y", C1: "y", C2: "y", D1: "n", D2: "y", D3: "y", D4: "y" }, name: "" };
    const childResult = runAssessment(child);
    assert.equal(buildEntry(childResult.entries[0], childResult, "L").split("\n")[1], "Your answer: No. This answer sets the result.");
});
