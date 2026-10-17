# Macro series: Japan housing scorecard

Monthly unless marked. One row per series per period in `housing_scorecard.csv` (long format).
Columns: `series_id, period, value, unit, source, source_url, retrieved_at, note`.
`period` is the month the data describes (YYYY-MM; quarterly as YYYY-Qn, semiannual as YYYY-04 / YYYY-10).

| series_id | What | Source | Released |
|---|---|---|---|
| reins_cap_resale_contract_n | Shutoken resale condo contracts (count) | 東日本レインズ Market Watch | ~10th-14th |
| reins_cap_resale_contract_psm | Shutoken resale condo contracted price per sqm (JPY 10k) | 東日本レインズ | ~10th-14th |
| reins_cap_resale_contract_price | Shutoken resale condo average contracted price (JPY 10k) | 東日本レインズ | ~10th-14th |
| reins_cap_resale_new_listings | Shutoken resale condo new listings (count) | 東日本レインズ | ~10th-14th |
| reins_cap_resale_inventory | Shutoken resale condo inventory (count) | 東日本レインズ | ~10th-14th |
| reins_23k_resale_contract_n | Tokyo 23 wards resale condo contracts (count) | 東日本レインズ | ~10th-14th |
| reins_23k_resale_contract_psm | Tokyo 23 wards resale condo contracted price per sqm (JPY 10k) | 東日本レインズ | ~10th-14th |
| fkk_cap_new_supply | Shutoken new-build condo units launched | 不動産経済研究所 | ~17th-21st |
| fkk_cap_new_price | Shutoken new-build condo average price (JPY 10k) | 不動産経済研究所 | ~17th-21st |
| fkk_cap_new_psm | Shutoken new-build condo price per sqm (JPY 10k) | 不動産経済研究所 | ~17th-21st |
| fkk_cap_first_month_rate | Shutoken new-build 初月契約率 (%, 70% = healthy line) | 不動産経済研究所 | ~17th-21st |
| fkk_23k_new_price | Tokyo 23 wards new-build average price (JPY 10k) | 不動産経済研究所 | ~17th-21st |
| kantei_23k_ask_70 | Tokyo 23 wards resale condo asking price, 70 sqm basis (JPY 10k) | 東京カンテイ | ~19th-23rd |
| kantei_cap_ask_70 | Shutoken resale condo asking price, 70 sqm basis (JPY 10k) | 東京カンテイ | ~19th-23rd |
| athome_23k_ask | Tokyo 23 wards resale condo average listed price (JPY 10k) | アットホーム 価格動向 | ~end of month, prior month |
| flat35_min_rate | Flat 35 lowest rate (%) | 住宅金融支援機構 | ~1st-2nd |
| jgb10y_eom | 10-year JGB yield, month end (%) | MOF / market data | month end |
| boj_policy_rate | BOJ policy rate (%) | 日本銀行 | meeting days |
| jreit_adr_px | Advance Residence (3269) month-end price (JPY) | TSE | month end |
| jreit_comforia_px | Comforia Residential (3282) month-end price (JPY) | TSE | month end |
| jreit_mfaf_px | Mitsui Fudosan Accommodation Fund (3226) month-end price (JPY) | TSE | month end |
| tse_reit_index | TSE REIT Index month-end close | JPX | month end |
| rent_index_23k (Q) | マンション賃料インデックス, Tokyo 23 wards (2009 Q1 = 100) | アットホーム x 三井住友トラスト基礎研究所 | quarterly |
| jrei_jonan_1r_cap (S) | 不動産投資家調査, Tokyo Jonan one-room rental expected cap rate (%) | 日本不動産研究所 | late May / late Nov |
| jrei_jonan_family_cap (S) | 不動産投資家調査, Tokyo Jonan family rental expected cap rate (%) | 日本不動産研究所 | late May / late Nov |

## Derived (computed, not stored)
- Asking vs closing gap, 23 wards: `kantei_23k_ask_70 / (reins_23k_resale_contract_psm * 70) - 1`. Approximate: different samples and methods.
- Residential J-REIT relative: average month-end return of the three residential names minus TSE REIT Index return.
