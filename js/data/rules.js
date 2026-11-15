// data/rules.js

export const CONTEXT_DEFAULTS = {
    // Keep "unsure" as the default to avoid assuming minors relevance.
    minors: "unsure"
};

export const CONTEXT_OPTIONS = {
    minors: [
        { value: "yes" },
        { value: "no" },
        { value: "unsure" }
    ]
};

/**
 * Context multipliers: mild calibration only.
 * - minorsMultiplier affects D block
 * - pressureMultiplier affects C block
 * scoring.js rounds every weighted answer to a whole number,
 * so the 1.10 factors never change the overall result.
 */
export function contextModifiers(context) {
    const minors = context?.minors ?? CONTEXT_DEFAULTS.minors;

    const minorsMultiplier =
        minors === "yes" ? 1.25 :
            minors === "unsure" ? 1.10 :
                1.0;

    const pressureMultiplier =
        minors === "yes" ? 1.10 : 1.0;

    return { minorsMultiplier, pressureMultiplier };
}

/**
 * Concern levels. mapLevel returns "green" | "yellow" | "red",
 * app.js shows LEVELS[level].label and LEVELS[level].summary.
 */
export const LEVELS = {
    green: {
        label: "Minimal concern",
        summary: "Few indicators are present or signals appear in low-impact forms."
    },
    yellow: {
        label: "Moderate concern",
        summary: "Indicators suggest avoidable ambiguity, elevated pressure, or reduced user control."
    },
    red: {
        label: "Elevated concern",
        summary: "Multiple indicators co-occur or higher-severity signals are present."
    }
};

/**
 * Overall thresholds for the total score, tuned so that one isolated “No”
 * stays green. runAssessment in scoring.js then raises the result:
 * - a hard trigger or one red block makes it red
 * - two yellow blocks make it at least yellow
 */
export const THRESHOLDS = {
    greenMax: 10,
    yellowMax: 18
};

export const BLOCK_THRESHOLDS = {
    // With 3 questions per block:
    // - one "No" (2–3) stays green
    // - two "No" often becomes yellow
    // - D1 "No" alone (5–6) is already yellow
    A: { greenMax: 3, yellowMax: 6 },
    B: { greenMax: 3, yellowMax: 6 },
    C: { greenMax: 3, yellowMax: 6 },
    D: { greenMax: 3, yellowMax: 6 }
};

/**
 * Hard triggers: used to elevate overall to red.
 * Kept narrow, enforcement-proximate, and context-sensitive.
 */
export const HARD_TRIGGERS = [
    {
        id: "HT_CHILD_EXHORTATION",
        description: "Child-directed urging to purchase (or to persuade adults to purchase).",
        match: (answers, context) => {
            const minors = context?.minors ?? CONTEXT_DEFAULTS.minors;
            // Elevate primarily when minors are relevant or cannot be ruled out.
            return answers?.D1 === "no" && (minors === "yes" || minors === "unsure");
        }
    }
];

/**
 * Areas to review: intentionally sparse. scoring.js lists at most two per flagged block.
 * These are prompts for review, not prescriptive fixes.
 */
export const AREAS_TO_REVIEW = {
    A: [
        "Ensure real-money cost is visible at the decision point, including clear equivalence for virtual currency.",
        "Reduce conversion complexity and minimise systematic leftover value patterns that impair price comparability."
    ],
    B: [
        "Add or strengthen an explicit confirmation step before charging money, especially where payment details are stored.",
        "Ensure declining, cancelling, and redress pathways are easy to find and not harder than opting in."
    ],
    C: [
        "Present purchase-related choices neutrally and keep refusal options clear and accessible.",
        "Limit repeated prompting after refusal and use urgency cues sparingly with verifiable bases."
    ],
    D: [
        "Avoid child-directed purchase prompting and avoid messages that encourage minors to pressure adults.",
        "Where minors are relevant, strengthen safeguards and ensure age-appropriate clarity of purchase information."
    ]
};
