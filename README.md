# jp-market-data

Japan residential market data, collected for objective, empirical checks on Japan deals and underwriting.

## Pipelines
1. J-REIT data (yields, rents, renewals, growth)
2. TMF comparables (listing sites)
3. LSFA comparables (competitors, listing sites)
4. LSFA supply in other markets
5. Macro: `data/macro/` (Japan housing scorecard; series list in `data/macro/SERIES.md`)

## Conventions
- Long-format CSV, one row per series per period, with source URL and retrieval date.
- New periods are appended; a revised figure replaces the old row only with a line in `CHANGELOG.md`.
- Free public sources only.
