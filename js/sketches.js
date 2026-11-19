// The fifteen example sketches (spec 8.4): small interface fragments in HTML and CSS,
// each showing how it can look when the answer is Yes. Hidden from assistive technology,
// the caption next to them carries the meaning. Nothing inside is focusable.
import { el } from "./utils.js";

const box = (...children) => el("div", { class: "sketch sketch-box", "aria-hidden": "true" }, children);
const title = text => el("span", { class: "sk-title" }, [text]);
const line = text => el("span", {}, [text]);
const muted = text => el("span", { class: "sk-muted" }, [text]);
const row = (left, right) => el("span", { class: "sk-row" }, [left, right]);
const buttons = (...items) => el("span", { class: "sk-buttons" }, items.map(([label, filled]) =>
    el("span", { class: filled ? "sk-button is-filled" : "sk-button" }, [label])));
const arrow = () => el("span", { class: "sk-arrow" });

const SKETCHES = {
    A1: () => el("span", { class: "sketch sk-item", "aria-hidden": "true" }, [
        el("span", { class: "sk-thumb" }),
        el("span", { class: "sk-stack" }, [title("Winter skin"), el("span", {}, ["500 Gems ", el("strong", {}, ["(€4.99)"])])]),
        el("span", { class: "sk-button" }, ["Buy"])
    ]),
    A2: () => el("span", { class: "sketch sk-chain", "aria-hidden": "true" }, [
        el("span", { class: "sk-chip" }, ["€4.99"]), arrow(),
        el("span", { class: "sk-chip" }, ["500 Gems"]), arrow(),
        el("span", { class: "sk-chip sk-title" }, ["Skin"])
    ]),
    A3: () => el("span", { class: "sketch sk-packs", "aria-hidden": "true" }, [
        el("span", { class: "sk-packs-head" }, [el("strong", {}, ["Season pass"]), " costs 950 coins"]),
        el("span", { class: "sk-packs-row" }, [
            el("span", { class: "sk-muted" }, ["Coin packs"]),
            ...[["500", "€4.99"], ["950", "€9.49", true], ["2,000", "€19.99"]].map(([coins, price, match]) =>
                el("span", { class: match ? "sk-pack is-match" : "sk-pack" }, [el("strong", {}, [coins]), el("span", {}, [price])]))
        ])
    ]),
    B1: () => box(title("Confirm purchase"), line("Winter skin, 500 Gems (€4.99)"), buttons(["Cancel"], ["Confirm", true])),
    B2: () => box(row(title("Season pass"), muted("Renews 1 Dec")), buttons(["Manage"], ["Cancel"])),
    B3: () => box(title("Purchase complete"), el("span", { class: "sk-links" }, [line("Help"), line("Refunds"), line("14-day withdrawal")])),
    C1: () => box(row(title("Starter pack"), line("€4.99")), buttons(["No thanks"], ["Buy", true])),
    C2: () => box(title("Starter pack"), muted("Declined. Not shown again this session.")),
    C3: () => box(title("Frost bundle"), line("Available until 20 Nov, 18:00")),
    D1: () => box(row(title("Winter pack"), line("€4.99")), muted("Skin and 200 coins")),
    D2: () => box(row(title("Purchases"), el("span", { class: "sk-tag" }, ["Off"])), muted("A parent turns them on with a PIN")),
    D3: () => box(row(title("100 coins"), line("€0.99")), muted("Enough for one sticker pack")),
    D4: () => box(title("Level failed"), buttons(["Try again", true], ["Practice"])),
    E1: () => box(title("Card pack, chances"), row(line("Legendary"), line("1.5%")), row(line("Epic"), line("8.5%")), row(line("Common"), line("90%"))),
    E2: () => box(title("Card packs"), muted("Not available for accounts under 18"))
};

export function sketch(id) {
    return SKETCHES[id]?.() ?? null;
}
