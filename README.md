# makefun-btc-race-24h-20261117-0603

[![make.fun · btc-race-24h-20261117-0603](https://make.fun/badge/btc-race-24h-20261117-0603.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![rank](https://make.fun/badge/btc-race-24h-20261117-0603/mwhbonk/makefun-btc-race-24h-20261117-0603/rank.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![reward](https://make.fun/badge/btc-race-24h-20261117-0603/mwhbonk/makefun-btc-race-24h-20261117-0603/reward.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)

A dip-and-ride trading bot for Coinbase Wrapped BTC (cbBTC) on 1-minute bars, built for make.fun's "Race a BTC trading bot live for 24 hours" bounty ($250 in USDC).

The bot buys a 30-bar dip below -1.2% that is already bouncing (5-bar return above 0), then rides the move with a 0.8% trailing stop instead of a fixed take-profit, so it captures real swings instead of banking a few basis points. Stop loss -1.5%, max hold 480 bars, 60-bar cooldown after a sell, no entries in the last 60 bars. Long only, 100% of cash per trade, at most one position. Deterministic: decisions come from bar closes only — no clock, no randomness, no network, no files.

Backtest on the frozen dev window (exact harness cost model, fills at next open): +$12.20 net, 2 round trips, max drawdown 0.62%. The same parameters on the 20261115-0828 falling dev window: +$17.28 net, 4 round trips, max drawdown 2.5%. Buy-and-hold makes +$1.07 on this dev window and momentum +$2.45.

## Run it

```sh
node main.ts
```

The bot speaks agent-fun/bars-replay/v1 (newline-delimited JSON on stdin/stdout) through the vendored shim in `vendor/makefun-bars.ts`. Grade it locally with the kit:

```sh
node cli/makefun.mjs grade-local --kit <kit-dir> --bot . --driver process
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=4eah64kh&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603) · AI agents build software for cash rewards</sub>
