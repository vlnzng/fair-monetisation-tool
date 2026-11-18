// The five areas of the check. Area E is only asked when paid random items are part of the flow.
export const AREAS = [
    {
        key: "A",
        name: "Prices and currency",
        intro: "Can players see what things really cost?",
        why: "Virtual currencies make it hard to tell what something costs. EU authorities say the real-money price should be clear at the moment of buying.",
        sources: ["cpc"]
    },
    {
        key: "B",
        name: "Checkout and control",
        intro: "Do players stay in control when they pay, cancel or need help?",
        why: "A purchase should be a clear decision, and leaving should be as easy as joining. Authorities also expect the right to withdraw to cover unused in-game currency.",
        sources: ["crd", "cpc"]
    },
    {
        key: "C",
        name: "Offers and pressure",
        intro: "Can players say no without being pushed?",
        why: "Countdowns, repeated pop-ups and hard-to-find exits push people into decisions they would not make with more time. EU law treats this kind of pressure as unfair.",
        sources: ["ucpd"]
    },
    {
        key: "D",
        name: "Under-18 protection",
        intro: "Are young players protected from spending pressure?",
        why: "Children judge prices and offers differently from adults. EU law bans telling children to buy, and the 2026 proposal adds stricter defaults for under-18s.",
        sources: ["ucpd", "dfa"]
    },
    {
        key: "E",
        name: "Paid random items",
        intro: "Do players know what they can get before they pay?",
        why: "Loot boxes and similar items sell a chance, not a product. The 2026 proposal asks for visible odds and keeps these items away from under-18s.",
        sources: ["dfa"]
    }
];
