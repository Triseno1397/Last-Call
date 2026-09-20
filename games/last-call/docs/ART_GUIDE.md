# Art Guide

Art direction: polished Japanese anime / visual-novel style. Large expressive
eyes, vibrant hair colours, glamorous adult women, clean cel shading with a
neon-nightlife palette.

**Non-negotiable:** every character reads as an adult in their mid-twenties or
older. Adult proportions, mature faces, adult fashion, adult settings. No school
uniforms, no childlike designs. Ages are stored in character data and a unit test
enforces 21+.

> Status: this document is the contract for the art pipeline. The layered
> portrait component, the placeholder assets and the gallery screen ship in
> Phase 2 against exactly these names and sizes, so art commissioned now will
> drop straight in.

## Canvas sizes

| Asset | Size (px) | Format | Notes |
| --- | --- | --- | --- |
| Portrait layer (base, outfit, expression) | 768 × 1152 | PNG, transparent | 2:3 half-body bust, same canvas for every layer of a character so they stack pixel-for-pixel |
| Portrait @2x (optional) | 1536 × 2304 | PNG | same filename with `@2x` before the extension |
| Milestone illustration (CG) | 1920 × 1080 | JPG or PNG | full scene, 16:9 |
| CG thumbnail | 480 × 270 | JPG | gallery grid |
| Contact icon | 256 × 256 | PNG, transparent | phone contacts list, head and shoulders |
| Venue backdrop | 1440 × 960 | JPG | behind the portrait during encounters |

Keep the **head in the same place across every layer of a character**. The
portrait component does not warp or offset layers; it stacks them.

Safe area: the bottom 180 px of a portrait may be cropped on short phone
screens. Nothing important below that line.

## Folder and naming convention

```
public/art/
  characters/
    sable/
      base.png                  body + hair + neutral face, fully clothed
      outfit_bartender.png      outfit layers, transparent
      outfit_offshift.png
      outfit_date.png
      outfit_gala.png           unlockable
      expr_neutral.png          face-only overlays, transparent
      expr_amused.png
      expr_interested.png
      expr_bored.png
      expr_uncomfortable.png
      expr_annoyed.png
      expr_blushing.png
      expr_laughing.png
      icon.png
      cg_first_date.png         milestone illustrations
      cg_first_date.thumb.jpg
    wren/
    nadia/
  venues/
    neon_last_call.jpg
    margin_notes.jpg
    ironhaus.jpg
```

Rules:

- Folder name is the **character id** exactly as declared in
  `src/content/ids.ts` (`sable`, `wren`, `nadia`).
- Expression files are `expr_<expression>.png`. The eight expressions are
  `neutral`, `amused`, `interested`, `bored`, `uncomfortable`, `annoyed`,
  `blushing`, `laughing`. All eight are required per character.
- Outfit files are `outfit_<outfitId>.png` where the outfit id is declared in
  the character's data file. Three to four per character: at least one
  venue-appropriate, one date outfit, one unlockable.
- CGs are `cg_<milestoneId>.png` plus a `.thumb.jpg` at 480 × 270.
- Lowercase, snake_case, no spaces.

## Layer order

Back to front:

1. venue backdrop (not part of the character folder)
2. `base.png`
3. `outfit_<id>.png`
4. `expr_<expression>.png`

The base layer must be presentable on its own (clothed, neutral face) so a
character is never broken by a missing outfit file.

## Dropping in real art

Files go into `public/art/characters/<id>/` with the names above, and they are
picked up with no code change. Placeholders that ship with the prototype use the
same paths and sizes; overwrite them.

If a file is missing, the portrait component falls back in this order: requested
expression → `expr_neutral.png` → `base.png` → the CSS placeholder portrait. A
missing outfit falls back to the character's default outfit. The game never
shows a broken image.

## Gallery

The gallery screen lists unlocked outfits and milestone CGs per character. An
asset appears there only once the player has unlocked it in play; locked entries
show as silhouettes with the unlock hint. Unlocks are recorded in the save file,
so the gallery survives a reload.

## Placeholder art in the prototype

Until final art lands, characters render as layered SVG/CSS portraits driven by
the same expression and outfit ids. They are deliberately simple — the point is
that the swap is a file drop, not a refactor.
