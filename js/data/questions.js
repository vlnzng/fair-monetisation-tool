export const BLOCKS = [
    { id: "A", name: "Price transparency and virtual currency clarity" },
    { id: "B", name: "Consent and transaction control" },
    { id: "C", name: "Choice architecture and decision pressure" },
    { id: "D", name: "Minors and safeguards" }
];

export const QUESTIONS = [
    // A) Price transparency and virtual currency clarity (3)
    {
        id: "A1",
        block: "A",
        text: "At the point of decision, can players see a real-money price or a clear real-money equivalent?",
        help:
            "This includes shops using virtual currency. Equivalence should be visible without extra steps or manual conversion.",
        severity: { yes: 0, no: 3, unsure: 1 },
        tags: ["pricing", "virtualCurrency"]
    },
    {
        id: "A2",
        block: "A",
        text: "Does the flow avoid layered conversions (e.g., money → currency → token → item)?",
        help:
            "Layered conversions increase complexity and make it harder to compare real-money costs.",
        severity: { yes: 0, no: 2, unsure: 1 },
        tags: ["virtualCurrency", "complexity"]
    },
    {
        id: "A3",
        block: "A",
        text: "Are currency packs and item prices structured to minimise systematic leftover value?",
        help:
            "Consider whether common purchases typically require buying more currency than needed.",
        severity: { yes: 0, no: 2, unsure: 1 },
        tags: ["virtualCurrency", "bundles"]
    },

    // B) Consent and transaction control (3)
    {
        id: "B1",
        block: "B",
        text: "Before money is charged, is there an explicit confirmation step (especially where payment details are stored)?",
        help:
            "This checks whether users must actively confirm the final purchase step, reducing accidental purchases.",
        severity: { yes: 0, no: 3, unsure: 1 },
        tags: ["consent", "confirmation"]
    },
    {
        id: "B2",
        block: "B",
        text: "Is it no harder to decline, cancel, or exit a monetisation commitment than to accept or start it?",
        help:
            "Consider symmetry of friction in purchase, subscription, and cancellation pathways.",
        severity: { yes: 0, no: 2, unsure: 1 },
        tags: ["symmetry", "friction"]
    },
    {
        id: "B3",
        block: "B",
        text: "Are support, refund, or complaint pathways easy to find and use?",
        help:
            "This refers to practical discoverability in-app or via clearly linked pages, not hidden policies.",
        severity: { yes: 0, no: 2, unsure: 1 },
        tags: ["redress", "refunds"]
    },

    // C) Choice architecture and decision pressure (3)
    {
        id: "C1",
        block: "C",
        text: "Are purchase-related choices presented clearly and neutrally (including a visible refusal option where relevant)?",
        help:
            "Check for confusing labels, hidden refusal options, or design emphasis that distorts the choice.",
        severity: { yes: 0, no: 3, unsure: 1 },
        tags: ["choiceArchitecture", "neutrality"]
    },
    {
        id: "C2",
        block: "C",
        text: "After a user declines or dismisses an offer, does the interface avoid repeated prompting in the same session or short time span?",
        help:
            "Repeated prompting can increase decision pressure and reduce decision quality over time.",
        severity: { yes: 0, no: 2, unsure: 1 },
        tags: ["nagging", "persistence"]
    },
    {
        id: "C3",
        block: "C",
        text: "If urgency cues are used (countdowns, scarcity claims), are they used sparingly and in a way that is verifiable?",
        help:
            "Treat “Unsure” as a signal when the basis for a time-limit or scarcity claim cannot be checked.",
        severity: { yes: 0, no: 2, unsure: 1 },
        tags: ["urgency", "verifiability"]
    },

    // D) Minors and safeguards (3)
    {
        id: "D1",
        block: "D",
        text: "Does the design avoid direct urging of minors to purchase or to persuade adults to purchase for them?",
        help:
            "Includes explicit child-directed purchase prompts or messages encouraging pressure on parents or guardians.",
        severity: { yes: 0, no: 5, unsure: 2 },
        tags: ["minors", "highSeverity"]
    },
    {
        id: "D2",
        block: "D",
        text: "Where minors are a relevant audience segment, are meaningful safeguards present and usable (e.g., spend limits, PIN, parental controls)?",
        help:
            "Safeguards should be discoverable and effective in practice, not merely nominal settings.",
        severity: { yes: 0, no: 3, unsure: 1 },
        tags: ["minors", "safeguards"]
    },
    {
        id: "D3",
        block: "D",
        text: "Where minors are a relevant audience segment, is purchase-related information presented in an age-appropriate and comprehensible way?",
        help:
            "Consider clarity of pricing, consequences, and prompts for younger users. Choose “Unsure” if not assessable from available artefacts.",
        severity: { yes: 0, no: 2, unsure: 1 },
        tags: ["minors", "clarity"]
    }
];
