# Art drop-in folder

Final art goes here. Nothing in this folder is required for the game to run:
when a file is missing, the game falls back to the SVG placeholder portraits,
which are driven by the same outfit and expression ids.

```
public/art/characters/<characterId>/
  base.png              768 x 1152   body, hair, neutral face, clothed
  outfit_<outfitId>.png 768 x 1152   transparent overlay
  expr_<expression>.png 768 x 1152   transparent overlay, face only
  icon.png              256 x 256
  cg_<milestoneId>.png  1920 x 1080
public/art/venues/<venueId>.jpg      1440 x 960
```

Character ids: `sable`, `wren`, `nadia`.
Expressions: `neutral`, `amused`, `interested`, `bored`, `uncomfortable`,
`annoyed`, `blushing`, `laughing`.
Sable's outfit ids: `bar_shift`, `off_shift`, `date_green`, `after_hours`.

The game probes `base.png` for a character; if it loads, the layered art path is
used, otherwise the placeholder is drawn. Full spec: `docs/ART_GUIDE.md`.
