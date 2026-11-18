# India Stockpile Planner: design spec

## Who it is for

1. **Funders** (Blueprint Biosecurity, Coefficient Giving, CEPI and BioPREVAIL reviewers), who want to see where the money would go and how big the gap is.
2. **State health departments**, starting with Kerala, which has had four Nipah outbreaks since 2018. Public health is a state subject in India and there is no national medical stockpile, so the state is the right unit.
3. **Researchers and journalists**, who want to check and change the assumptions.

## The question it answers

"If we want health workers and critical workers in state X to keep working through outbreak Y, how many respirators do we need to hold, what does it cost over five years, and how much is unfunded?"

## Inputs

- **State or UT**, or all India.
- **Scenario**, which sets the defaults below:

| Scenario | Who is covered | Exposed share of health workers | Response | N95s per health worker per day |
|---|---|---|---|---|
| Nipah-like cluster | Health workers, ASHAs and ANMs | 35% | 60 days | 4 |
| H5N1-like pandemic | All of the above, plus critical workers | 100% | 150 days | 2 |
| Novel virus, worst case (Blueprint) | All of the above, plus critical workers | 100% | 150 days | 3 |

- **Response length** (14–365 days) and **critical workers as % of population** (sliders).
- **N95 use policy**: single use per scenario, or extended use (one per shift).
- **Prices**: N95, elastomeric, filter pair, crisis price multiple.
- **All other assumptions**, in a folded panel (see `assumptions.md`).

## Model

Workers:

- Hospital health workers = (doctors + nurses) × (1 + support staff ratio) × exposed share
- Community health workers = (ANMs + ASHAs) × exposed share
- Critical workers = population × critical-worker % (pandemic scenarios only)

Three strategies are always computed side by side: **all disposable**, **90% elastomeric** (Blueprint's mix, with the rest on disposables) and **all elastomeric**.

- N95 stock = workers on N95s × N95s per day × days × (1 + spare factor)
- Elastomerics = workers on elastomerics × (1 + spare factor)
- Filter pairs = workers on elastomerics × ceil(days ÷ days of use per filter pair)
- Five-year spend: buy everything in year 1, then buy again each time an item reaches its shelf life. Existing N95 stock offsets the first purchase. Add one-time fit testing for elastomeric users, and storage every year.
- Funding gap = five-year total − budget already committed
- Crisis cost = the same N95 need × N95 price × crisis multiple
- Production time = the same N95 need ÷ India's peak 2020 N95 output per day

## Outputs

- Headline figures: workers to protect, N95 stock, elastomeric count, five-year cost, saving against disposables, funding gap, crisis cost, and production days.
- Cumulative five-year cost chart for the three strategies.
- Spend by year and item, plus a bill of quantities, for the chosen strategy.
- Workforce breakdown.
- A sortable table of every state, with CSV download.
- A plain-language explanation of the method that updates with the inputs.
- A shareable link that encodes every input.

## Design choices

- **A static site** (HTML, CSS, ES modules, vendored Chart.js). There is no server and no build step, it hosts free on GitHub Pages, and it works offline once loaded.
- **The model is pure functions** in one file, with unit tests, so a reviewer can check any figure.
- **Every default has a source and a range** in `assumptions.md`. Rows built from estimates are marked.
- **No locations.** Stockpile locations are sensitive and are left out on purpose.

## Next steps (after the prototype)

1. Replace registered counts with active-workforce estimates (for example, PLFS or NHWA data).
2. Add PAPRs for workers a tight-fitting mask will not seal on (beards, turbans), and fit-test failure rates from the Indian fit study.
3. Add district-level views for Kerala, behind access control if it ever holds real stock data.
4. Add a surge-manufacturing module: how an advance market commitment shortens the ramp-up.
5. Add a Hindi and a Malayalam interface.
