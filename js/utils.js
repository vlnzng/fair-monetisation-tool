// Creates an element. Text children become text nodes, so user and URL input is never parsed as HTML.
export function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === "class") node.className = v;
        else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
        else if (k in node && !k.startsWith("aria") && !k.startsWith("data")) node[k] = v;
        else node.setAttribute(k, v === true ? "" : v);
    }
    for (const c of [].concat(children)) {
        if (c == null || c === false) continue;
        node.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
    }
    return node;
}

// A link to another site. Opens in a new tab, announced by the hidden note in index.html.
export function externalLink(href, text) {
    return el("a", { href, target: "_blank", rel: "noopener", "aria-describedby": "new-tab-note" }, [text]);
}
