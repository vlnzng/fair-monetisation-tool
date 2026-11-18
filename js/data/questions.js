// Questions of the check. Every question is phrased so that Yes is the unproblematic answer.
// Answers are "y", "n" or "u" (Unsure). points gives the raw points for No and Unsure, Yes counts 0.
// requires lists the context a question needs: K2 keys, and "minors" for K1 = Yes or Unsure.

export const K1 = {
    question: "Is the game aimed at players under 18, or do you know that they play it?",
    hint: "Signs: an age rating below 18, a look or marketing that appeals to children and teenagers, or account data."
};

export const K2_OPTIONS = [
    { key: "vc", title: "Virtual currency", hint: "Gems, coins, diamonds" },
    { key: "sub", title: "A subscription or a pass that renews", hint: "Season pass, monthly membership" },
    { key: "limited", title: "Offers limited by time or stock", hint: "Countdowns, \"only 3 left\"" },
    { key: "random", title: "Paid random items", hint: "Loot boxes, card packs, prize wheels" }
];

export const QUESTIONS = [
    {
        id: "A1",
        area: "A",
        text: "Is the real-money price shown next to the buy button?",
        shortLabel: "Real-money price next to the buy button",
        example: "The euro price sits on the item card, so nobody has to calculate.",
        whyItMatters: "Prices only in Gems hide what an item costs in euros.",
        expected: "Guidance expects the euro price next to every currency price.",
        sources: ["cpc", "dfa"],
        points: { n: 3, u: 1 },
        requires: []
    },
    {
        id: "A2",
        area: "A",
        text: "Do players need at most one virtual currency to buy an item?",
        shortLabel: "At most one virtual currency",
        example: "Gems buy the item directly, with no second currency in between.",
        whyItMatters: "Each extra currency adds a conversion step between the item and its price.",
        expected: "Guidance expects items to be bought without conversion chains.",
        sources: ["cpc"],
        points: { n: 2, u: 1 },
        requires: ["vc"]
    },
    {
        id: "A3",
        area: "A",
        text: "Can players buy the amount of currency they actually need?",
        shortLabel: "Buying the amount needed",
        example: "The pass costs 950 coins, and a 950-coin pack exists.",
        whyItMatters: "Fixed packs leave leftover currency that pulls players back.",
        expected: "Guidance expects pack sizes that match item prices.",
        sources: ["cpc"],
        points: { n: 2, u: 1 },
        requires: ["vc"]
    },
    {
        id: "B1",
        area: "B",
        text: "Is there a confirmation step before real money or paid currency is spent?",
        shortLabel: "Confirmation before paying",
        example: "Buy opens a summary with the price before anything is charged.",
        whyItMatters: "Without a confirmation step, one tap can spend money or paid currency by accident.",
        expected: "EU law expects an explicit confirmation before a paid order.",
        sources: ["crd"],
        points: { n: 3, u: 1 },
        requires: []
    },
    {
        id: "B2",
        area: "B",
        text: "Is cancelling a subscription or pass as easy as signing up?",
        shortLabel: "Cancelling as easy as signing up",
        example: "Cancel sits in the same menu as the pass.",
        whyItMatters: "When leaving is harder than joining, people stay subscribed by default.",
        expected: "EU rules expect cancelling to take no more effort than signing up.",
        sources: ["crd", "dfa"],
        points: { n: 2, u: 1 },
        requires: ["sub"]
    },
    {
        id: "B3",
        area: "B",
        text: "Are help, refunds and the 14-day withdrawal right easy to find?",
        shortLabel: "Help, refunds and withdrawal easy to find",
        example: "The purchase confirmation links help, refunds and withdrawal.",
        whyItMatters: "Players cannot use rights they cannot find.",
        expected: "Guidance expects help, refunds and withdrawal to be linked in the shop.",
        sources: ["cpc"],
        points: { n: 2, u: 1 },
        requires: []
    },
    {
        id: "C1",
        area: "C",
        text: "Are buying and declining shown equally clearly?",
        shortLabel: "Buying and declining equally clear",
        example: "A plain \"No thanks\" sits next to \"Buy\", at the same size.",
        whyItMatters: "A small or guilt-tripping \"no\" steers players toward buying.",
        expected: "EU law expects both choices to be equally clear.",
        sources: ["ucpd", "dfa"],
        points: { n: 3, u: 1 },
        requires: []
    },
    {
        id: "C2",
        area: "C",
        text: "After a player declines an offer, does it stay away for the rest of the session?",
        shortLabel: "Declined offers stay away",
        example: "Closed once, the offer stays closed for the session.",
        whyItMatters: "An offer that keeps coming back wears down a decision already made.",
        expected: "The proposal names repeated prompts as unfair pressure.",
        sources: ["dfa"],
        points: { n: 2, u: 1 },
        requires: []
    },
    {
        id: "C3",
        area: "C",
        text: "Do limited offers show when they end, and do they really end?",
        shortLabel: "Limited offers really end",
        example: "The offer names a fixed end and then leaves the shop.",
        whyItMatters: "A timer that restarts, or an offer that returns, creates pressure that is not real.",
        expected: "EU law lists false time limits as unfair, and the proposal asks offers to state how long they run.",
        sources: ["ucpd", "dfa"],
        points: { n: 2, u: 1 },
        requires: ["limited"]
    },
    {
        id: "D1",
        area: "D",
        text: "Do offers stay neutral towards children, without telling them to buy or to ask an adult?",
        shortLabel: "Offers neutral towards children",
        example: "Name and price, with no call to buy.",
        whyItMatters: "Children are easier to persuade than adults, so offers must not call on them directly.",
        expected: "EU law bans telling children to buy or to ask an adult to buy.",
        sources: ["ucpd"],
        points: { n: 5, u: 2 },
        requires: []
    },
    {
        id: "D2",
        area: "D",
        text: "Are purchases switched off or locked for under-18s by default?",
        shortLabel: "Purchases off by default for under-18s",
        example: "Purchases start switched off until a parent turns them on.",
        whyItMatters: "If parents have to find the setting, children can spend from the start.",
        expected: "The proposal expects purchases to be off for minors by default.",
        sources: ["dfa"],
        points: { n: 3, u: 1 },
        requires: ["minors"]
    },
    {
        id: "D3",
        area: "D",
        text: "Is purchase information understandable for the youngest players?",
        shortLabel: "Understandable for the youngest players",
        example: "A plain amount with a real price.",
        whyItMatters: "Bonus percentages and invented values are hard for children to judge.",
        expected: "Guidance expects plain words and real prices.",
        sources: ["cpc"],
        points: { n: 2, u: 1 },
        requires: ["minors"]
    },
    {
        id: "D4",
        area: "D",
        text: "Can players progress and compete without being told they need to pay?",
        shortLabel: "Progress without being told to pay",
        example: "After a loss, the game offers another try, not a purchase.",
        whyItMatters: "Telling players they must pay to progress puts pressure on those least able to judge it.",
        expected: "The proposal rules this out for under-18s.",
        sources: ["dfa"],
        points: { n: 2, u: 1 },
        requires: ["minors"]
    },
    {
        id: "E1",
        area: "E",
        text: "Can players see the possible rewards and their odds before paying?",
        shortLabel: "Rewards and odds visible before paying",
        example: "The pack screen lists every reward tier with its chance.",
        whyItMatters: "Without odds, players cannot judge what a random item is worth.",
        expected: "The proposal expects contents and chances to be shown before paying.",
        sources: ["dfa"],
        points: { n: 3, u: 1 },
        requires: ["random"]
    },
    {
        id: "E2",
        area: "E",
        text: "Are paid random items unavailable to under-18s?",
        shortLabel: "Random items unavailable to under-18s",
        example: "Accounts under 18 cannot buy random items.",
        whyItMatters: "Paid random items work like a game of chance.",
        expected: "The proposal does not allow them for under-18s.",
        sources: ["dfa"],
        points: { n: 3, u: 1 },
        requires: ["random", "minors"]
    }
];
