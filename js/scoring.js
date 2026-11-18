// Question selection and scoring. No DOM access, so this module can be tested in Node.
import { QUESTIONS } from "./data/questions.js";

// "minors" stands for K1 = Yes or Unsure, every other requirement is a K2 key.
function meets(requirement, k1, k2) {
    if (requirement === "minors") return k1 === "y" || k1 === "u";
    return k2.includes(requirement);
}

// The questions asked for this context, in the order A1 to E2.
export function getQuestions({ k1 = null, k2 = [] } = {}) {
    return QUESTIONS.filter(q => q.requires.every(r => meets(r, k1, k2)));
}
