// Pins the result link in the URL fragment (spec section 10).
// Run with: npm test

import { test } from "node:test";
import assert from "node:assert/strict";

import { encodeFragment, decodeFragment, stateFromExample } from "../js/link.js";
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
