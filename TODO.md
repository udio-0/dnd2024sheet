# TODO & Roadmap

Ongoing list of features to build, bugs to fix, and improvements to make.

---

## Bugs

| # | Description | Notes |
|---|-------------|-------|
| B1 | Double cantrip showing up after character creation | Cantrip list appears duplicated post-wizard |
| B2 | Features tab not showing background details | Background features missing from the Features view |
| B3 | Dice roller number color same as background | Result number is hard to read — needs contrast fix |
| B4 | Bag of Holding should not increase total carry weight | Its contents should be excluded from encumbrance calculation |
| B5 | Subclass selectable before level 3 | Should be locked until the character reaches the appropriate level |
| B6 | Level 8 ASI "+" buttons broken | Ability score increase flow fails at level 8 |
| B7 | Character name showing in the top-center bar | Name should be removed from that position |

---

## Features — In Progress / Planned

### Magic Items
- [ ] Magic item support during character creation
- [ ] Dynamic modifiers from magic items (e.g. +1 weapon/armor affecting attack bonus and AC automatically)
- [ ] Limit attunement slots to 3 items max (RAW)

### Combat & AC
- [ ] Armor and shield selection auto-calculates AC
- [ ] Attacks dropdown (choose weapon/spell from a list rather than free text)
- [ ] Fighting style options exposed per class
- [ ] Button to roll initiative (using DEX modifier + any bonuses)
- [ ] Dice rolls display both the dice face result and the final modified total
- [ ] Edit initiative field manually
- [ ] Limit Armor Class input (enforce reasonable min/max bounds)

### Ability Scores & Stats
- [ ] Adding ASI manually via popup dialog
- [ ] Feats already picked should be removed from the selection list on future level-ups
- [ ] Edit skills and saving throw proficiencies manually
- [ ] Limit speed: minimum 0, maximum 500
- [ ] Limit max HP and minimum HP (can't go below 0 or above max)

### Limited Resources
- [ ] Limit the maximum count of a limited resource to a sensible cap
- [ ] Limit the text length of resource names/labels
- [ ] Replace manual "1 use" entry with a dropdown option for single-use resources

### Inventory
- [ ] Backpack / container deletion with confirmation prompt
- [ ] Limit total number of items in inventory
- [ ] Limit item name and description text length

### UI / UX
- [ ] Remove character name from the top-center topbar area

---

## Notes & Clarifications

- **Magic item dynamic modifiers**: when a magic item grants a bonus (e.g. +1 sword), the attack roll and damage should update automatically without the player manually editing those fields.
- **Attunement limit**: per the 2024 rules a character can be attuned to a maximum of 3 magic items at a time.
- **Bag of Holding**: its contents exist in an extradimensional space — they should not count toward the character's encumbrance.
- **Subclass lock**: most classes choose their subclass at level 3 (some at 1 or 2). The UI should enforce the correct level gate per class.
- **ASI at level 8**: the level-up flow needs to handle the second ASI correctly; the "+" buttons become unresponsive.
