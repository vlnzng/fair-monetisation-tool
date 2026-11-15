# Fair Monetisation Risk Assessment Tool

A dependency-free web prototype built for academic research to provide a traffic-light style orientation on monetisation UX risks in video games. The guided flow gathers context, asks structured questions, and surfaces domain-level signals.

## Stack
- HTML, CSS, and ES-module JavaScript (no frameworks)
- Structured question set and rules in `js/data`
- Favicon: own design (`assets/favicon.ico`)
- Typography: Inter from Google Fonts

## Running locally
- Use a local static server so ES modules load correctly (for example: `python -m http.server 8080` and open `http://localhost:8080/`).
- Opening `index.html` directly via `file://` may block module loading in some browsers; prefer a local server to avoid that.
- Tested in current Chromium- and Firefox-based browsers.

## Online deployment
The current deployment is available at: https://informatik.th-brandenburg.de/~lenzing/
