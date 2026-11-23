# velvet-circuit-cards

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/muellbiel-alt/velvet-circuit-cards/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/muellbiel-alt/velvet-circuit-cards/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

**Velvet Circuit** is an original offline cyber-noir casino deckbuilder written in plain ES modules on HTML5 Canvas with WebAudio synthesis and zero external runtime requests.

## How to Play

Play cards from your fanned hand onto the 3-slot **Circuit Rail** before ending your turn. Read the opponent's face-up intent card at the top of the table and counter it with shields, attack-jamming cards, or piercing combos across three escalating dealers:

1. **The Croupier** (Table I, 42 HP)
2. **Viper Broker** (Table II, 62 HP)
3. **Chrome Queen** (Table III, 84 HP)

### Four Suits (Distinct Color & Shape)

- **Blade** (Crimson dagger): direct strikes, armor-pierce, and target marking (`+2` damage taken).
- **Circuit** (Cyan hex-diamond): Shield, Counter reflection, and Signal Jam (lowers enemy attack damage).
- **Overclock** (Amber bolt): Energy generation, extra draw, and next-card amplification (`AMP`).
- **Siphon** (Jade clover): lifesteal damage, HP recovery, and chip heist bonuses.

### Circuit Rail Combos

- **Suit Flush (2 same-suit cards in one turn):** triggers a suit surge (`Razor Surge`, `Aegis Lock`, `Jackpot Surge`, or `Velvet Drain`).
- **Triple Flush (3 same-suit cards):** triggers `Syndicate Jackpot` (`+12` piercing damage, `+6` shield, `+420` score).
- **Prism Breach (3 different suits in one turn):** deals `+8` piercing damage and grants `+6` shield.

Between Table I and Table II, and again before Table III, you draft 1 of 3 rare Vault cards into your deck and recover `12` HP.

## Controls

- **Mouse:** Hover cards to inspect damage arcs and combo triggers; click a card to play it; click `END TURN`, `SFX/MUTE`, or `RESET`.
- **Keyboard:** `1`–`7` play cards directly, `ArrowLeft` / `ArrowRight` (or `A` / `D`) select a card, `Enter` plays the selected card or starts the run, `Space` or `E` ends the turn, `R` restarts the run, `M` toggles audio.

## Project Structure

- `game/index.html`, `game/styles.css` — Static offline entry and viewport shell.
- `game/src/prng.js` — Deterministic Mulberry32 PRNG and shuffle helpers.
- `game/src/cards.js` — 18-card catalog, suit palettes/shapes, and Circuit Rail synergy evaluation.
- `game/src/opponents.js` — 3 dealers, visible opponent hands, and turn intent logic.
- `game/src/engine.js` — Headless deterministic match engine (no DOM dependency).
- `game/src/animation.js` — Card flights, floating combat text, chip bursts, and screen shake.
- `game/src/cardArt.js` — Vector suit emblems, card frames, motifs, and card backs.
- `game/src/tableRenderer.js` — Procedural felt table, HUD, Circuit Rail, hand fan, and phase overlays.
- `game/src/audio.js` — Procedural WebAudio foley and harmonic stingers.
- `game/src/input.js` — Mouse and keyboard input bindings.
- `game/src/shots.js` — Deterministic `?shot=cover|play|win|loss` preset driver.
- `game/src/main.js` — Fixed-timestep `1/60`s loop with clamped delta time and visibility auto-pause.
- `tests/engine.test.mjs` — Headless `node --test` verification suite.
- `main.ts` — Copies `game/` and `screenshots/` to output and generates `dossier.json`.

## Run It

```sh
# Play locally at http://localhost:8080
node serve.ts

# Run headless logic tests
node --test tests/engine.test.mjs

# Build submission output & dossier
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
