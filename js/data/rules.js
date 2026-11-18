// Scoring rules of v2 (spec section 9). Levels are "minimal", "moderate" or "elevated".

// Same thresholds for every area: up to 3 minimal, above 3 moderate, above 6 elevated.
export const AREA_THRESHOLDS = { moderateAbove: 3, elevatedAbove: 6 };

// Overall thresholds as a share of the base, the unweighted No points of the asked questions.
export const OVERALL_SHARE = { moderateAbove: 0.4, elevatedAbove: 0.7 };

// D1 answered No sets area D and the overall result to Elevated in every context.
// Because it decides on its own, D1 is left out of the base.
export const HARD_TRIGGER = "D1";

// Factors by K1 answer, for an area or a single question (a question entry wins).
// K1 values without an entry count 1.
export const FACTORS = {
    C: { y: 1.1 },
    D: { y: 1.25, u: 1.1 },
    E2: { y: 1.25, u: 1.1 }
};
