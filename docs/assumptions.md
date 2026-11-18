# Assumptions table

Every default in the planner, with its range and source. All values can be changed in the app under **All assumptions**. Prices are in rupees; dollar figures were converted at ₹84/USD.

## Respirator demand

| Parameter | Low | Default | High | Source and notes |
|---|---|---|---|---|
| N95s per hospital health worker per day, Nipah-like | 2 | 4 | 6 | Isolation wards with frequent doffing. OSHA 2007 pandemic flu guidance uses 4 per shift for an outpatient nurse; Johns Hopkins CHS (2020) uses 6 per ICU patient-day. |
| N95s per hospital health worker per day, H5N1-like | 1 | 2 | 4 | Mixed wards; CHS (2020) uses 2.6 per non-ICU patient-day. |
| N95s per hospital health worker per day, worst case | 1 | 3 | 6 | Blueprint Biosecurity (2024) planning case. |
| Extended use (toggle) | 1 | 1 | 2 | NASEM 2019: about 5 donnings or 2.5 h per mask. Cuts health-worker demand several-fold. |
| N95s per critical (non-health) worker per day | 0.5 | 1–1.5 | 2 | FAS (1 per day); OSHA 2007 (2 per shift for retail). |
| Share of state health workforce exposed, Nipah-like | 20% | 35% | 60% | Assumption: hospital-centred clusters touch a minority of facilities. |
| Support staff per doctor or nurse | 0.3 | 0.6 | 1.0 | Assumption: ward attendants, sanitation, lab, drivers, mortuary. MoHFW's rational-use guideline puts sanitation, CSSD, laundry and ambulance staff in the N95 tier. |
| Indoor critical workers, % of population | 1.5% | 3% | 9% | 3% ≈ 4.4 crore nationally. The 20 million to 130 million range for India depends on the definition (vital vs essential). ALLFED (2025) finds US vital workers are 25–82% of essential workers. |
| Spare stock factor | 5% | 10% | 20% | Sizes, loss, damage. ALLFED uses 1–2 reusables per worker. |
| Response length (days) | 60 | 60 / 150 | 365 | OSHA uses 120 work days; Blueprint and Gryphon use 150 days, the time industry needs to ramp up. |

## Prices, shelf life and storage

| Parameter | Low | Default | High | Source and notes |
|---|---|---|---|---|
| N95 price, ₹ | 12 | 25 | 60 | Indian government purchase price ₹12.25 (Sep 2019) and ₹17.33 (Jan 2020), Business Today. Retail is higher. |
| Crisis price multiple | 3× | 5× | 15× | India: ₹12.25 to ₹63 by May 2020 (about 5×). Africa: over $20 vs $2 after pooled buying (10×). About 15× is often cited for the US in April 2020 (Blueprint). |
| Elastomeric half-mask, ₹ | 250 | 1,500 | 4,200 | NASEM ($25–50), FAS ($20–40), Chalikonda 2020 ($20). At-scale prices of $3–15 are a target, not a quote. |
| Filter pair, ₹ | 170 | 400 | 2,100 | NASEM Box 3-2 ($5) up to Baracco ($25). |
| Days of use per filter pair | 7 | 30 | 90 | Chalikonda 2020 replaced filters monthly in COVID wards. |
| N95 shelf life, years | 3 | 5 | 5 | MoHFW, NASEM and Blueprint give 5. Use 3 to test hot, humid storage without climate control. |
| Elastomeric life, years | 5 | 10 | 15 | Blueprint and FAS: 10 years or more. |
| Filter shelf life, years | 3 | 5 | 5 | FAS. |
| Fit test and training, ₹ per worker | 100 | 200 | 500 | Assumption: qualitative fit test kits and 15 minutes of staff time. Chalikonda 2020 had a 94% first-time fit pass rate on elastomerics. |
| Storage, ₹ per N95 per year | 0.5 | 1 | 3 | NASEM US figure: about $0.034 per N95-year (≈₹3). Indian warehousing assumed cheaper. |
| Elastomeric storage vs one N95 | 10× | 15× | 20× | NASEM: about $0.47 vs $0.034 per unit-year. |
| Elastomeric share in the "mix" strategy | 70% | 90% | 100% | Blueprint: about 90% elastomerics, 10% PAPRs. Here the 10% are disposables. |
| India's N95 output at peak, per day | 2.5 lakh | 32 lakh | — | 2.5 lakh per day in May 2020; 32 lakh per day from about 200 makers by Oct 2020 (Deccan Herald / PIB). |
| ₹ per US dollar | 83 | 84 | 88 | Check against today's rate. |

## What is not modelled yet

- PAPRs (powered respirators) for people a tight seal will not fit, including many bearded and turbaned workers. Blueprint suggests about 10%.
- Absenteeism (FAS uses up to 40% in extreme pandemics), which would reduce demand.
- Fit test failures falling back to N95s.
- Pooled procurement discounts (Africa Medical Supplies Platform-style), which lower unit prices rather than raising budgets.
- Distribution, cleaning and disinfection logistics for elastomerics.
- Any stockpile locations. These should stay out of a public tool.

## Comparable tools this design borrows from

- **CDC/NIOSH PPE Burn Rate Calculator**: tracks days of supply from stock on hand and daily use. It is an inventory tool, not a demand model.
- **WHO COVID-19 Essential Supplies Forecasting Tool (ESFT)**: PPE per health worker per day, by setting and severity.
- **Johns Hopkins CHS, "Assumptions of US PPE needs for COVID-19" (2020)**: patient-day driven, ICU 6 and ward 2.6 N95s per patient-day.
- **OSHA pandemic influenza stockpiling guidance (2007)**: items per shift × 120 work days.
- **NASEM, *Reusable Elastomeric Respirators in Health Care* (2019)**: annual stockpile cost per million people by strategy.
- **Blueprint Biosecurity, *Blueprint for Pandemic-Proof PPE* (2024)**: a 150-day, about 90% elastomeric central stockpile, 75% cheaper than disposables over 20 years. Its India figures (about 120 million respirators per day for indoor vital workers, about 15 billion over 5 months) come from the report as summarised in our research notes, and have not been checked again for this app.
- **FAS, resilience caches of reusable respirators**, and **ALLFED (2025)** on vital-sector workers.

## State data (`data/states.csv`)

| Column | What it is | Source |
|---|---|---|
| Population | 2025 projection | Technical Group on Population Projections (Census 2011 base, July 2020 report), via statisticstimes.com |
| Doctors | Allopathic doctors registered with each state medical council, Nov 2024 | National Medical Commission, Parliament reply (tabulated by DeshGujarat, 2 Dec 2024) |
| Nurses | Registered nurses and midwives plus lady health visitors, 31 Dec 2021 | Lok Sabha Starred Question 25, 3 Feb 2023, Annexure II |
| ANMs | Registered auxiliary nurse-midwives, 31 Dec 2021 | Same as nurses |
| ASHAs | ASHAs in position, rural and urban, Sep 2023 | Lok Sabha Starred Question 12, 2 Feb 2024 |
| Public beds | Government beds, 31 Mar 2023 (not yet used by the model) | Health Dynamics of India 2022-23, Lok Sabha Unstarred Question 2228, 1 Aug 2025 |

Caveats:

- **Registers are cumulative.** They keep retired, emigrated and dead practitioners, and people registered in two states. The model counts 80% of registered doctors (the government's own assumption) and 60% of registered nurses and ANMs. Kerala, Andhra Pradesh, Tamil Nadu and Karnataka nurse registers are inflated by emigration; Bihar, Jharkhand and Jammu & Kashmir look understated.
- **Council boundaries are not state boundaries.** Many Telangana doctors are still on the Andhra Pradesh register.
- **Estimated cells** (marked `est` in the CSV and * in the app) use the national per-1,000 ratio: doctors 0.978, nurses 1.786, ANMs 0.693. These cover doctors in Manipur, Meghalaya, Mizoram and Nagaland (the last two council figures, 156 and 166, are implausibly low), and all three cadres in Andaman & Nicobar, Chandigarh, Dadra & Nagar Haveli and Daman & Diu, Ladakh, Lakshadweep and Puducherry. Chandigarh and Puducherry are understated because they host large central hospitals (PGIMER, JIPMER).
- **Tamil Nadu has few ASHAs by design**; village health nurses do that work. Goa and Chandigarh have no ASHA programme.
- **Different dates**: population 2025, doctors 2024, nurses 2021, ASHAs 2023.

National critical-worker counts (PLFS 2022-23 shares applied to about 60 crore workers):

| Category | Share of workers | About |
|---|---|---|
| Human health and social work | 1.24% | 74 lakh |
| Public administration, police and defence | 1.40% | 84 lakh |
| Electricity and gas | 0.27% | 16 lakh |
| Water, sewerage and waste | 0.27% | 16 lakh |
| Transport and storage | 4.13% | 2.5 crore |
| Wholesale and retail trade | 10.2% | 6.1 crore (food retail perhaps 2–2.7 crore, estimated) |

Health, police and utilities alone are about 2 crore (1.4% of population). A core list adding sanitation, transport and food retail is about 6.5–7 crore (about 4.7%). A broad essential list is 13 crore or more. The default of 3% indoor critical workers (about 4.3 crore) sits between these, because many transport and retail workers work outdoors. No published India estimate of Blueprint-style "vital workers" was found.

**Sanity check.** All India, worst-case scenario, 150 days: the planner gives about 4.8 crore workers and about 1,300 crore (13 billion) N95s if disposable. Blueprint Biosecurity's India figure, from our earlier notes, is about 15 billion over five months.
