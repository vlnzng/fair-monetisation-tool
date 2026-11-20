// Pins the result link in the URL fragment (spec section 10).
// Run with: npm test

import { test } from "node:test";
import assert from "node:assert/strict";

import { encodeFragment, decodeFragment, stateFromExample, readRun } from "../js/link.js";
import { EXAMPLES } from "../js/data/examples.js";

const gemShop = {
    k1: "y",
    k2: ["vc"],
    answers: { A1: "n", A2: "n", A3: "n", B1: "y", B3: "y", C1: "y", C2: "n", D1: "y", D2: "u", D3: "y", D4: "y" },
    name: "Gem Shop",
    example: null
};

test("link: an own run encodes as in the spec", () => {
    assert.equal(encodeFragment(gemShop), "k1=y&k2=vc&a=A1n,A2n,A3n,B1y,B3y,C1y,C2n,D1y,D2u,D3y,D4y&name=Gem%20Shop");
    assert.equal(encodeFragment({ ...gemShop, name: "  " }), "k1=y&k2=vc&a=A1n,A2n,A3n,B1y,B3y,C1y,C2n,D1y,D2u,D3y,D4y");
});

test("link: round trip for an own run, with and without K2", () => {
    assert.deepEqual(decodeFragment("#" + encodeFragment(gemShop)), gemShop);
    const none = { k1: "n", k2: [], answers: { A1: "y", B1: "y", B3: "u", C1: "y", C2: "y", D1: "y" }, name: "", example: null };
    assert.equal(encodeFragment(none), "k1=n&k2=&a=A1y,B1y,B3u,C1y,C2y,D1y");
    assert.deepEqual(decodeFragment(encodeFragment(none)), none);
});

test("link: a name with special characters survives, and is cut to 40 characters", () => {
    const named = { ...gemShop, name: "Shop & Gems / Prüfung #2 = 100%" };
    assert.equal(decodeFragment(encodeFragment(named)).name, named.name);
    const long = decodeFragment(encodeFragment(gemShop).replace("Gem%20Shop", "x".repeat(60)));
    assert.equal(long.name.length, 40);
});

test("link: the three examples load from their fragment", () => {
    for (const e of EXAMPLES) {
        const state = decodeFragment(`#example=${e.key}`);
        assert.deepEqual(state, stateFromExample(e.key));
        assert.equal(state.name, e.title);
        assert.equal(encodeFragment(state), `example=${e.key}`);
    }
});

test("link: a removed or unknown example opens no result, also after a reload", () => {
    for (const key of ["children", "unknown", "", "Currency"]) {
        assert.equal(stateFromExample(key), null, key);
        assert.equal(decodeFragment(`#example=${key}`), null, key);
    }
    const stored = { ...stateFromExample("pass"), example: "children", step: "result", returnToResult: false };
    assert.equal(readRun(stored).example, null);
});

test("link: section anchors and incomplete or invalid runs are ignored", () => {
    const valid = encodeFragment(gemShop);
    const invalid = [
        "#why",
        "",
        "#example=unknown",
        valid.replace("k1=y", "k1=x"),
        valid.replace("k2=vc", "k2=vc,gold"),
        valid.replace("k2=vc", "k2=vc,vc"),
        valid.replace("A1n,", ""),                 // a question is missing
        valid.replace("D4y", "D4y,E1n"),           // a question that is not asked
        valid.replace("A1n", "A1x"),               // not an answer
        valid.replace("A2n", "A1n"),               // asked twice
        valid.replace("k1=y", "k1=n")              // D2 to D4 are not asked for K1 = No
    ];
    for (const hash of invalid) assert.equal(decodeFragment(hash), null, hash);
});

test("reload: a stored run comes back as it was", () => {
    const stored = JSON.parse(JSON.stringify({ ...gemShop, step: "C", returnToResult: true }));
    assert.deepEqual(readRun(stored), { ...gemShop, step: "C", returnToResult: true });
    assert.equal(readRun({ ...gemShop, step: "result" }).step, "result");

    const partial = { step: "B", name: "", k1: "n", k2: [], answers: { A1: "y" }, example: null, returnToResult: false };
    assert.deepEqual(readRun(partial), { ...partial, k2: [] });
    const example = { ...stateFromExample("pass"), step: "result", returnToResult: false };
    assert.equal(readRun(example).example, "pass");
});

test("reload: a step that does not fit falls back, an edited example becomes an own run", () => {
    assert.equal(readRun({ ...gemShop, answers: { A1: "n" }, step: "result" }).step, "about");
    assert.equal(readRun({ ...gemShop, step: "E" }).step, "about");
    assert.equal(readRun({ step: "A", k1: null, k2: [], answers: {} }).step, "about");
    assert.equal(readRun({ ...gemShop, step: "result", returnToResult: true }).returnToResult, false);

    const edited = stateFromExample("currency");
    edited.answers.A1 = "y";
    assert.equal(readRun({ ...edited, step: "result" }).example, null);
});

test("reload: stored values that do not describe a run are ignored", () => {
    for (const bad of [null, "text", 3, [], { ...gemShop, k1: "x" }, { ...gemShop, k2: ["vc", "vc"] },
        { ...gemShop, k2: ["gems"] }, { ...gemShop, answers: { Z9: "y" } }, { ...gemShop, answers: { A1: "maybe" } },
        { ...gemShop, answers: { E1: "y" } }, { ...gemShop, name: 5 }, { ...gemShop, answers: ["y"] }]) {
        assert.equal(readRun(bad), null, JSON.stringify(bad));
    }
    assert.equal(readRun({ ...gemShop, name: "x".repeat(60), step: "about" }).name.length, 40);
});
