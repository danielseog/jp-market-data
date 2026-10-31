# J-REIT pipeline (pipeline 1): residential J-REIT operating data

Purpose: an empirical base to test underwriting assumptions (rent growth, occupancy, exit yields) against what listed residential REITs disclose. Definitions below are the REITs' own, as printed in their filings. Nothing is estimated or interpolated; a figure that could not be confirmed is left out and listed under Known gaps.

Version 1, built 2026-10-31. Free public sources only. Long format, one row per series per period, with source URL and retrieval date.

## Files

| File | Content | Rows |
|---|---|---|
| `reits.csv` | One row per REIT: ticker, names, sponsor, fiscal period end months, IR links | 4 |
| `operations.csv` | Long-format operating metrics by fiscal period | 99 |
| `acquisitions.csv` | One row per property acquired (announced 2025-2026) | 50 |
| `dispositions.csv` | One row per property sold (announced 2025-2026) | 34 |

### operations.csv columns
`reit_ticker, period, period_type, metric_id, value, unit, basis, quality, source, source_url, retrieved_at, note`

- `period`: YYYY-MM. For `period_type = fiscal` it is the fiscal period end month. `period_type = monthly` is reserved for monthly rows (none in v1, see gaps).
- `basis`: what the number covers (portfolio, Tokyo 23 wards, rental housing only, and so on) plus the REIT's own label.
- `quality`: `stated` = printed in running text or a table; `chart_mapped` = number read from a chart or label list where the mapping to period or label was inferred, verify before relying on it; `transcript` = spoken figure in the issuer-provided results briefing transcript.
- Unique key: `reit_ticker, period, period_type, metric_id, basis`.

### acquisitions.csv columns
`reit_ticker, announce_date, property_name, ward_city, prefecture, completion_year, units, leasable_area_sqm, acquisition_price_jpy, appraisal_value_jpy, appraisal_direct_cap_rate, appraisal_noi_jpy, appraisal_noi_yield_on_price, seller, tenure, settlement_date, source, source_url, retrieved_at, note`

- Rates are percent numbers (3.5 means 3.5%). Money is in JPY. Blank means not captured or not disclosed; the `note` says which where known.
- `appraisal_noi_yield_on_price` is filled only where the REIT prints it (鑑定NOI利回り in ADR notices; NOI yield in the MFAF deck). Comforia and Daiwa notices do not print it, so only `appraisal_noi_jpy` is stored; compute yield on price as `appraisal_noi_jpy / acquisition_price_jpy` if wanted. Computed yields are not stored.
- Rows with no `announce_date` are taken from a results document (deck or tanshin) because the notice itself was not retrieved. Rows whose property_name says "Japanese name not captured" come from an English rendering.
- `tenure`: freehold means 所有権 for land and building. Whether the REIT holds it as real estate or as a trust beneficiary interest is in `note` where seen.

### dispositions.csv
Same style; extra columns `book_value_jpy` (explicit 帳簿価額), `cost_of_sale_jpy` (不動産売却原価 from a tanshin P&L note, used where no book value is printed), `gain_jpy` and `gain_basis` (realized, estimated or reference figure, as the source labels it).

## Sources (all reached via WebFetch / WebSearch only)

Primary: TDnet filings. Copies were read from the JPX archive (`www2.jpx.co.jp/disc/{code}0/{id}.pdf`), from `japanir.jp` (`wp-content/uploads/YYYY/MM/{code}-{date}-NN.pdf`, an index of TDnet copies with AI summaries; only the PDFs were used for figures except where a row says "summary") and from `www2.infomart.co.jp` mirrors. The REITs' own IR sites (adr-reit.com, comforia-reit.co.jp and similar) were refused by the fetch allowlist, so monthly pages and IR libraries were not reached.

Secondary (flagged `transcript`): Comforia results briefing transcripts on logmi Finance, labelled "提供:コンフォリア・レジデンシャル投資法人" (provided by the issuer). Used because the Comforia decks were not found.

Method caveat: figures were read through WebFetch's text extraction of the PDFs. Tables and running text are reliable; chart labels often come out unordered. Chart-derived values are flagged `chart_mapped` or left out. Spot-check before using in a paper. Highest-priority checks: ADR deck p.20 (turnover series for 25.1, 25.7, 26.1), ADR p.39 (NOI yield 5.9% / after-depreciation 4.4%), MFAF deck p.18, p.21, p.33 (38th and 40th period values, unrealized gain ratios).

## Definitions as the REITs print them

### Advance Residence (3269), FY ended Jul 2026 deck and Jul 2024 tanshin
- Occupancy: reported as period average (期中平均稼働率); tanshin forecasts are "average of month-end rates"; deck p.19 charts month-end occupancy (月末稼働率) by area. No footnote defines area versus unit basis in the pages read.
- Rent change on tenant turnover (入替賃料変動率): units with new contracts signed in the period, pass-through contracts only (p.20 *1). Renovated units: increase in monthly rent from the first post-renovation lease divided by pre-renovation monthly rent (p.18 *2).
- Rent change on renewal (更新賃料変動率): units renewed in the period, pass-through contracts only (p.23 *1).
- 打診率 = units offered a rent increase / renewal units; 応諾率 = units agreeing an increase / units offered (p.23).
- Renewal rate (更新率) is not published; the deck reports churn (解約率) = cancelled area / sum of month-end leasable area over six months (p.19 *1).
- NOI yield: annualised actual NOI of properties held in the period / total acquisition price; 償却後利回り is after depreciation (p.39 *2).
- Unrealized gain (含み益): appraisal or survey value minus book value (p.13 *1). The ratio denominator is not printed.
- 鑑定NOI利回り in acquisition notices: appraisal direct-cap NOI / planned acquisition price, excluding depreciation.

### Mitsui Fudosan Accommodations Fund (3226), 41st period presentation
- Occupancy: month-end occupancy and its period average, whole portfolio including hospitality facilities (p.17).
- Rent change at turnover and at renewal: based on tenant turnover or renewal; fixed-term contracts that expire and are re-signed as new contracts count as renewals (p.18, p.21).
- 打診率 = rent-increase offers / renewal-eligible units; 応諾率 = increase agreements / offers (p.20).
- NOI yield: appraisal-report NOI / acquisition price (p.23, p.25). Direct cap rate and unrealized gain ratio are charted (p.33) but not defined.

### Comforia Residential REIT (3282)
No formal definitions were retrieved. The briefings use 入替時賃料変動率, 更新時賃料変動率 and 期中継続保有物件の賃料単価変動率 (rent unit price change of properties held throughout the period) and 平均稼働率. Treat them as comparable to peers only with that caveat.

### Daiwa Securities Living (8986), 40th period tanshin
- Occupancy: 期中平均稼働率 for rental housing (p.5) and, separately, healthcare facilities (p.6). Averaging method not printed.
- Rent change at turnover (入替え時賃料): rent-based (賃料ベース) change and the count-based share of cases with an increase. Footnote: units whose previous rent is unknown (new acquisitions, sublease terminations) and non-residential rooms are excluded (p.5).
- Renewal metrics are not in the tanshin; renewal rent increases appear only as a future target (p.8).

### Comparability
Samples differ (ADR pass-through units only; MFAF counts re-signed fixed-term leases as renewals; DSL excludes units with unknown prior rent), and renovation programmes lift turnover figures unevenly. Fiscal windows contain the Feb-Apr peak leasing season differently (ADR and Comforia Feb-Jul periods, MFAF Mar-Aug, DSL Oct-Mar), so compare the same season year on year, not adjacent periods.

Share of renewals with a rent increase = offer rate x acceptance rate. ADR 26.7: 3,635 renewals, 2,931 offered, 2,179 agreed, which gives 59.9% by counts; this is a computation and is not stored.

## metric_id dictionary
`occ_avg_pct`, `turnover_rent_chg_pct` (入替時), `renewal_rent_chg_pct` (更新時), `renewal_increase_offer_rate_pct` (打診率), `renewal_increase_accept_rate_pct` (応諾率), `renewal_units`, `renewal_increase_offered_units`, `renewal_increase_agreed_units`, `renewals_with_increase_share_pct`, `turnover_cases`, `turnover_cases_with_increase`, `turnover_cases_with_increase_share_pct`, `same_store_rent_per_unit_chg_pct`, `rent_gap_pct`, `noi_yield_pct`, `after_depreciation_yield_pct`, `unrealized_gain_ratio_pct`, `unrealized_gain` (JPY 100m), `rental_properties_book_value` and `rental_properties_fair_value` (from the 賃貸等不動産 note; unit in the row), `portfolio_properties_n`, `portfolio_acquisition_price`, `portfolio_leasable_area_sqm`.

## Coverage

Fiscal period ends: ADR and Comforia Jan / Jul; MFAF end-Feb / Aug; Daiwa Securities Living Mar / Sep (not Jan / Jul as first assumed).

| REIT | operations.csv periods | Metrics present | acquisitions / dispositions rows |
|---|---|---|---|
| 3269 ADR | Jan 2022 to Jul 2026 occupancy (10 periods); Jul 2024 to Jul 2026 rent changes (5); 打診率/応諾率 Jan 2025 to Jul 2026 | occupancy, turnover, renewal, offer and acceptance rates, unrealized gain (Jan and Jul 2026), NOI yield (Jul 2026, chart_mapped) | 9 / 5 |
| 3282 Comforia | Jan 2025, Jul 2025, Jan 2026 (29th to 31st) | occupancy, turnover (portfolio, Tokyo 23, Kansai, single), renewal, same-store rent change, rent gap, book and fair value | 9 / 7 |
| 3226 MFAF | Feb 2025, Aug 2025, Feb 2026, Aug 2026 (38th to 41st) | occupancy (39th to 41st), turnover, renewal, offer, acceptance, unrealized gain ratio (chart_mapped) | 12 / 2 |
| 8986 Daiwa Securities Living | Sep 2025, Mar 2026 (39th, 40th) | occupancy (rental housing, healthcare), turnover rent change and share with increase | 20 / 20 |

Acquisitions: 50 rows. Notice-level with full terms: ADR 7, Comforia 6, Daiwa 8 (4 from the 2025-03-19 notice, 3 from 2026-05-22, plus グランカーサ葛西), MFAF 2 (八王子, 大森山王). Partial: MFAF キャンパステラス九大学研都市 (completion notice plus deck) and 中野North (japanir page summary). The rest are results-document level (deck or tanshin) or name-only placeholders (6 MFAF properties acquired in the 38th to 40th periods).

## Known gaps

1. No monthly series. ADR and Comforia publish monthly data and the decks chart month-end occupancy (ADR p.19, MFAF p.17), but the REIT IR sites were blocked and the chart values were not legible in text extraction. v1 is fiscal-period only. To close: open the monthly pages or deck charts in a browser and key the last 12 months with `period_type = monthly`.
2. Comforia 32nd period (Jul 2026, results Sept 2026) not found; latest Comforia period is the 31st (Jan 2026). Comforia has no appraisal cap rate, NOI yield or unrealized gain ratio in v1 (only book and fair value from the tanshin note).
3. Daiwa Securities Living: tanshin only; the earnings presentation (likely carries renewal data, cap rates, unrealized gain) was not found. 38th period and earlier not retrieved. Its fair-value note in the tanshin was truncated.
4. Portfolio appraisal cap rate: not stored for any REIT. MFAF's chart shows about 3.4 to 3.5% but values are approximate and omitted; ADR's deck did not publish one in the pages read. MFAF unrealized gain amounts omitted (unit not confirmable); ratios stored as chart_mapped.
5. ADR NOI yield is stored for Jul 2026 only and flagged: 5.9% (NOI) and 4.4% (after depreciation) were extracted without explicit pairing; the pairing follows NOI yield being at least the after-depreciation yield.
6. Acquisition coverage is incomplete:
   - ADR: 松陰神社前, ときわ台 and 徳川 are deck-level; 2025 acquisitions beyond 南砂町 and 西船橋 are not itemised (deck gives only totals: JPY10.02bn in 26.1 period).
   - Comforia: the 30th period transcript cites 5 properties for about JPY12.5bn, while the notice found covers 4 at JPY11.34bn in that period, so at least one acquisition is missing (コンフォリア粕谷 was named as planned). コンフォリア大森山王 (swap with 銀座EAST弐番館) and the Aug 2024 offering properties are not captured. The Jan 2026 tanshin names the two acquired properties inconsistently (p.2 versus p.26) and they are not stored. 学芸大学イースト, 西新井 and 板橋区役所前 are tanshin-level with provisional prices. The CR1 GK silent partnership interest (JPY300m) is not a property and is not stored.
   - MFAF: Apr 2026 swap properties are deck-level; 2025 acquisitions are name-only.
   - Daiwa: Apr to Sep 2025 (39th period) acquisitions not captured; 40th period acquisitions are price-level only.
7. Other residential REITs (Samty Residential, Kenedix residential successor, Sekisui House Reit residential sleeve and others) were not examined; the call budget went to the four core REITs.
8. IR page and monthly disclosure URLs in `reits.csv` are blank for three REITs because the sites could not be opened; `aggregator_ir_index_url` points to the japanir.jp index of TDnet copies instead.
9. 3226 was called Nippon Accommodations Fund in the brief. 2026 filings use Mitsui Fudosan Accommodations Fund Investment Corporation (the macro series list already uses this name). The date of the rename was not retrieved.

## How to refresh

1. After each results date, pull the tanshin and the earnings presentation (決算説明資料). Typical timing: ADR and Comforia mid-March (Jan period) and mid-September (Jul period); MFAF around mid-October for the Aug period (20 Oct 2026 observed) and presumably April for the Feb period (not observed in this run); Daiwa Securities Living around 20 May and 20 November (21 May 2026 and 20 Nov 2025 observed; 41st period results due Nov 2026).
2. Find filings through the `aggregator_ir_index_url` (shows only the latest five), a WebSearch on the Japanese title plus ticker, or the JPX archive path. The REIT's IR site is the primary home; the monthly page belongs there.
3. Append new periods to `operations.csv` using the metric_ids above and the same `basis` strings so the key stays unique. Record the footnote definition in this README if the REIT changes it.
4. For each acquisition or disposition notice (国内不動産の取得に関するお知らせ / 取得及び譲渡), append one row. Upgrade deck-level and placeholder rows when the notice is found; replacing a row needs a line in `CHANGELOG.md`.
5. Validate: CSV is UTF-8, all rows have the header's column count, keys are unique, and where a notice prints appraisal NOI and price the stated NOI yield agrees (v1 check: ADR rows agree within rounding).
