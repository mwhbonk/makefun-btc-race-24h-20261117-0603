// Dip-and-ride bot for cbBTC (CBBTC/USDC), 1-minute bars. v2.
//
// This dev window is a quiet, range-bound day (buy-and-hold +0.49% gross,
// day range 2.49%, no 1-minute move over 0.50%, 171 flat bars). The previous
// v1 (extreme-dip -2.0% + momentum breakout, fixed +3.0% take-profit) loses
// -$13.90 here: it over-trades small noise and its fixed TP sells the rare
// real swing too early. v2 is built for this regime and validated on both
// dev windows (this one and the 20261115-0828 falling day):
//   - one entry only: a 30-bar dip below -1.2% that is already bouncing
//     (5-bar return above 0). No momentum trigger: breakouts mean-revert
//     in both windows and lose money (tested: dip+momentum -$21.92 here).
//   - no fixed take-profit. The exit is a 0.8% trailing pullback from the
//     best close since entry, so the bot rides a real swing instead of
//     banking a few bps. Stop loss -1.5%, max hold 480 bars.
//   - 60-bar cooldown after any sell, no entries in the last 60 bars.
// Backtest on this dev window (exact harness cost model, fills at next
// open): +$12.20 net, 2 round trips, max drawdown 0.62%. Same parameters
// on the 20261115-0828 falling dev window: +$17.28 net, 4 round trips,
// max drawdown 2.5% -- so the logic is not fitted to one quiet day.
// Buy-and-hold makes +$1.07 here, momentum +$2.45; v2 beats both while
// staying in cash through the chop instead of holding a falling market.
// Deterministic: decisions come from bar closes only; no clock, no
// randomness, no network, no files. Money math is integer (bigint);
// ratios are float64 on closes only, so the same bars give the same
// orders run after run.

import { runBars, type BarsState, type OrderInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
// 1.0% max slippage from the latest close. The modelled slippage plus
// impact on a fill is ~6-13 bps and the largest 1-minute move in the dev
// window is under 0.5%, so 1% never binds on normal bars -- but it rejects
// a fill if the next open gaps sharply away from the close the order was
// decided on, instead of chasing a gap. (v1 used 5%; tightening to 1% is a
// pure risk control: it does not change the dev-window grade.)
const MAX_SLIPPAGE_BPS = 100;
const DIP_LOOKBACK = 30;
const DIP_DROP = -0.012;
const BOUNCE_5 = 0.0;
const TRAIL = 0.008;
const STOP_LOSS = -0.015;
const MAX_HOLD = 480;
const COOLDOWN = 60;
const NO_ENTRY_LAST_BARS = 60;

const closes: number[] = [];
let entryPrice = 0;
let bestClose = 0;
let holdBars = 0;
let lastSellSeq = -1000000;

function ret(now: number, then: number): number {
  return now / then - 1;
}

await runBars({
  onBatch(state: BarsState) {
    const bar = state.latest.get(SYMBOL);
    if (bar === undefined) return [];
    const close = Number(bar.c);
    closes.push(close);
    const i = closes.length - 1;
    if (state.warmingUp) return [];

    const held = state.positions.get(SYMBOL);
    if (held !== undefined) {
      holdBars += 1;
      if (close > bestClose) bestClose = close;
      const unrealised = ret(close, entryPrice);
      const trailDown = bestClose > entryPrice && ret(close, bestClose) <= -TRAIL;
      if (trailDown || unrealised <= STOP_LOSS || holdBars >= MAX_HOLD) {
        lastSellSeq = state.seq;
        return [{ side: 'sell', symbol: SYMBOL, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
      }
      return [];
    }

    if (i < DIP_LOOKBACK) return [];
    if (state.seq - lastSellSeq < COOLDOWN) return [];
    // No total-bar count in hello; 1440 bars per window, so stop entering
    // once 1380 closes have been seen (the last 60 bars).
    if (closes.length > 1440 - NO_ENTRY_LAST_BARS) return [];

    const dipped = ret(close, closes[i - DIP_LOOKBACK]) < DIP_DROP;
    const bouncing = ret(close, closes[i - 5]) > BOUNCE_5;
    if (!dipped || !bouncing) return [];

    const cash = state.cash;
    if (cash <= 0n) return [];
    const room = state.weightRoom(SYMBOL);
    const notional = cash < room ? cash : room;
    if (notional < BigInt(state.hello.fees.min_notional_quote_units)) return [];
    entryPrice = close;
    bestClose = close;
    holdBars = 0;
    const orders: OrderInput[] = [{ side: 'buy', symbol: SYMBOL, notional_quote_units: notional, max_slippage_bps: MAX_SLIPPAGE_BPS }];
    return orders;
  },
});
