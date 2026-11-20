// Preset runs for "See an example result", one per level. All answers not listed are Yes.
export const EXAMPLES = [
    {
        key: "direct",
        title: "Clear direct purchase",
        k1: "n",
        k2: [],
        no: [],
        unsure: ["B3"]
    },
    {
        key: "pass",
        title: "High-pressure battle pass",
        k1: "y",
        k2: ["vc", "sub"],
        no: ["B2", "B3", "C1", "C2"],
        unsure: ["D2"]
    },
    {
        key: "currency",
        title: "Opaque currency shop",
        k1: "n",
        k2: ["vc"],
        no: ["A1", "A2", "A3"],
        unsure: []
    }
];
