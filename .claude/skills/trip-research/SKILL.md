---
name: trip-research
description: Research a trip decision the way Peter likes it — destinations, lodging, transport, boat/car/bike rental, activities, or any "buy vs rent / which option" travel call. Use when the user wants a researched recommendation for a trip, especially budget-conscious, off-the-beaten-path, DIY / license-free, or "compare the options" questions. Produces named local sources, real prices, and a clear recommendation — not a generic overview.
---

# Trip Research (Peter's way)

This is how Peter likes trip research done. Follow the steps in order; the scoping
step is not optional and the output must be concrete, not a tourist-brochure summary.

## 1 · Scope before searching — always

Trip questions arrive underspecified. Before any searching, ask **2–3 sharp clarifying
questions** with `AskUserQuestion`, using **concrete pickable options** (never open-ended).
The forks that change the whole answer:

- **Budget** — give real bands (e.g. "under €3,000", "€3–10k", "just exploring"), not "what's your budget?".
- **The core decision** — buy vs rent, this island vs that, skipper vs self-drive, hotel vs apartment. When it's genuinely a fork, always include a **"compare both"** option.
- **Hard constraints / must-haves** — license-free, no car, dates / season, group size, dog, mobility, etc.

Skip a question only if the user already answered it earlier. Then weave the answers
into the research brief verbatim so nothing drifts.

## 2 · Fan out parallel research

Decompose the question into **4–5 distinct angles** and research them **concurrently**
(parallel agents, or the `deep-research` harness if available). For a typical
"how do I get / do X on a trip" question the angles are usually:

1. **Rules & legal constraints** — licences, permits, age/insurance limits, what's allowed without paperwork.
2. **The buy / own path** — named marketplaces, real prices, registration & taxes for a foreigner.
3. **The rent / book path** — named operators **and** platforms, day/week rates, what's included (fuel, deposit, insurance).
4. **Logistics & practicalities** — mooring/parking, fuel, storage, transport between points, getting it there.
5. **Local & seasonal gotchas** — weather (e.g. the Aegean *meltemi*), peak-season booking pressure, tourist traps, the catch nobody mentions.

Re-shape the angles to fit the question — these are the default set, not a straitjacket.

## 3 · Source rules (this is what Peter cares about)

- **Prioritise in-country / local sources** — local classifieds, the actual national rules, the operator's own page — over generic English aggregators.
- **Name specifics.** Real website names **with URLs**, named operators/companies, concrete example prices and example listings. "Several sites exist" is a failure; list them with links.
- **Be honest about confidence.** Flag when a price is search-snippet-derived vs confirmed live, when a page wouldn't load, and where sources disagree. **Never invent** listings, prices, operators, or URLs.
- **Default lens: cheapest, lowest-hassle, least-touristy** option — unless the user says otherwise.

## 4 · Output shape

Lead with a **one-line direct answer**, then:

- A **comparison table** whenever it's option-vs-option / buy-vs-rent — columns like cost, hassle, paperwork, where, and *best-if*.
- A **shortlist of named sources / operators** — each with a link, what it's for, and an example price.
- **Legal limits, costs, and gotchas** as tight bullets (call out the thing tourist sites omit).
- A **clear recommendation** — "for X, do Y" — and the condition that would flip it.
- Close by offering **2–3 specific follow-up threads** (e.g. "email the operator for a firm quote", "pull a live filtered shortlist", "price the skippered alternative").

Keep it scannable. **Concrete over comprehensive.**

## 5 · Tone

Practical, budget-aware, a little skeptical. Surface the catch. Recommend, don't just
survey. Iterate happily when the user follows up.

---
*Seeded from the Greek-islands license-free-boat research (buy-vs-rent under €3,000).
Generalise the method to any trip decision; keep the rigor.*
