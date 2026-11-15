export function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (k === "class") node.className = v;
        else if (k.startsWith("data-")) node.setAttribute(k, v);
        else if (k in node) node[k] = v;
        else node.setAttribute(k, v);
    }
    for (const c of children) {
        if (c == null) continue;
        node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return node;
}

export function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

export function mapLevel(total, thresholds) {
    if (total <= thresholds.greenMax) return "green";
    if (total <= thresholds.yellowMax) return "yellow";
    return "red";
}
