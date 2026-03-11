# D&D 2024 Character Sheet

A browser-based character sheet for **Dungeons & Dragons 2024** (One D&D), built with vanilla HTML, CSS, and JavaScript — no frameworks, no backend, no installation required.

## Features

- **Character Creation Wizard** — guided step-by-step setup for race, class, background, ability scores, and starting equipment
- **Live Character Sheet** — all stats, saves, skills, and modifiers calculated automatically from your character data
- **Combat Tracker** — HP management, AC, initiative, attacks, and conditions
- **Spellcasting** — spell slots, cantrips, prepared spells, and spell save DC / attack bonus
- **Inventory & Equipment** — item management with weight tracking and a Bag of Holding
- **Level Up System** — ASI (Ability Score Improvements), hit point rolls, and new class features
- **Dice Roller** — inline dice rolling with result toasts showing dice result and modifier
- **Limited Resources** — tracking for class features like Rage, Ki, Bardic Inspiration, etc.
- **Edition Toggle** — switch between 2024, 2014, and Unearthed Arcana (UA) content
- **Themes** — multiple light and dark visual themes with font selection
- **Local Storage** — all character data is saved in the browser; nothing is sent to a server

## Getting Started

1. Clone or download this repository
2. Open `index.html` in any modern browser
3. Click **New Character** and follow the creation wizard

No build step, no dependencies, no account required.

## Project Structure

```
index.html          — main entry point and app shell
style.css           — all styles and themes
app.js              — top-level entry, loading screen
js/
  router.js         — hash-based SPA router
  store.js          — central state management (localStorage)
  wizard.js         — character creation wizard
  sheet.js          — main character sheet view
  combat.js         — combat tab logic
  home.js           — character select / home screen
  levelup.js        — level up flow
  dice.js           — dice rolling engine and result toasts
  app.js            — shared utilities
  data.js           — static game data helpers
  ua-data.js        — Unearthed Arcana content
data/
  ua-2024.json      — UA rules data
data.js             — root-level game data (classes, races, spells, etc.)
```

## Browser Support

Works in any modern browser (Chrome, Firefox, Edge, Safari). Uses `localStorage` for persistence — private/incognito mode will not save data between sessions.

## Contributing

This is a personal project. See [TODO.md](TODO.md) for the current roadmap and known issues.

## License

Personal use. D&D and related content are trademarks of Wizards of the Coast.
