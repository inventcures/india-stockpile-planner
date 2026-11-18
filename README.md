# India Stockpile Planner

**Live app: https://inventcures.github.io/india-stockpile-planner/**

An open, in-browser planner for respirator stockpiles in India. Pick a state and an outbreak scenario, and it shows:

- how many health workers, ASHAs and ANMs, and other critical workers need respiratory protection;
- how many disposable N95s, or how many reusable elastomeric half-masks and filters, that takes;
- the cost of holding each option for five years, including replacing expired stock and storage;
- the funding gap against any budget already committed;
- what the same need would cost if bought in a crisis at surge prices, and how many days of India's peak 2020 N95 output it would take to make.

Every assumption can be changed in the app, and the current plan can be shared as a link.

## Why

India has no national medical stockpile, and public health is a state subject. In 2020 N95 prices paid by the government rose about fivefold in four months while domestic production ramped up from almost zero. Blueprint Biosecurity's 2024 report finds that a central stockpile of reusable elastomeric respirators costs about 75% less than disposables over 20 years. This tool turns that argument into numbers a state health department or a funder can test.

## Run it

It is a static site with no build step.

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

Tests for the model:

```sh
node --test tests/
```

## Files

- `js/model.js`: the model, as pure functions. Read this to check any number.
- `js/app.js`: the interface.
- `data/states.js`: state and UT population and health workforce figures, with sources.
- `docs/assumptions.md`: every default with its range and source.
- `docs/design.md`: the design spec.

## Caveats

This is a planning prototype. Workforce counts are registered counts and estimates, which overstate the active workforce in some states. The tool holds no stockpile locations and should not be extended to hold them in public.

## Licence

MIT. Chart.js (MIT) is vendored in `vendor/`.
