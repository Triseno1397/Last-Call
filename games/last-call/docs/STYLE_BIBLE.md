# Last Call — style bible

The look of the game, fixed in one place so that generated art, drawn art and
copy all pull in the same direction. Seventeen reference images were supplied
for this; they are not in the repository (they are other people's work) and are
described here instead.

## The one-line version

Bright modern anime people in a neon cyberpunk night city.

## People

- Clean, current anime: hard cel shading, thin dark line work, big glossy eyes
  with two highlights, hair drawn in ribbons with a sheen band across it.
- Two archetypes recur in the references and set the range: the gyaru (blonde
  curls, tan, green nails, bold and loud) and the composed brunette (long
  straight hair, blue eyes, quiet confidence). Everyone else sits between.
- Everyone is an adult. The references show students in uniforms; we keep the
  faces, hair and fashion sense and dress people for the lives they have here:
  bartender, invigilator, gym, office, night out. A cyber jumpsuit or a
  chrome-trimmed grow-suit is fine for someone who would wear one.
- We match the style, never a specific character from a specific show.

## The world

Always night, or the dusk before it. Rain has just stopped.

- **Street**: wet asphalt with the neon lying in it, stacked vertical sign
  boxes up every façade in clashing colours, LED strips along rooflines,
  holographic adverts floating off the tall blocks, puddles that reflect pink
  and blue. Signage in the stacked Japanese-alley manner, mixed scripts.
- **The square**: dark marble with gold veins, trees ringed by illuminated
  circular bars, teal light strips, glass-walled shops.
- **Last Call**: a purple neon lounge. Pink and blue LED tape on the beams, a
  big neon animal on the wall, cracked leather sofas, a karaoke room sign.
- **Nightjar**: the futurist club. Curved bar, mirrored ceiling, floor-to-ceiling
  windows onto the pink-and-blue city, blue velvet booths.
- **Akai (赤)**: red velvet under a ceiling of cherry blossom, lit shoji
  screens, paper lanterns with the character on them, one long black table.
- **Slurp**: the all-night diner. Long counter, red stools, checkerboard
  floor, warm yellow light, green walls, a hand-painted menu.
- **Copper Kettle**: a tea lounge. Wicker cocoon chairs, mirrored ceiling,
  yellow seats, low gold light.
- **Margin Notes** and **Panels**: the neon bookstore. Teal neon over towers of
  books, warm shelf lights, stacks on the floor.
- **Static**: the neon alley market. Crates, pink and blue strips, posters.
- **Meridian Gallery**: white on white. Marble floor, rings of light on a
  mirrored ceiling, curved white sofas, five paintings.
- **Fresh Market**: grown on the premises. Racks of greens under purple grow
  light, the good bread, flowers by the door, staff in a silver grow-suit.
- **Ironhaus** and **Pixel Palace**: LED strips, hard light, cabinets glowing.

## Palette

| token | hex | use |
| --- | --- | --- |
| night | `#0a0812` | the sky, the deepest shadow |
| asphalt | `#12111c` | wet road |
| pink | `#ff5fa8` | the bar, love, the default neon |
| blue | `#4fd6ff` | the club, water, cold light |
| violet | `#9a6bff` | records, holograms |
| teal | `#3ee6d6` | books |
| gold | `#ffd36b` | tea, the diner, warm light |
| red | `#ff3b4a` | Akai |
| grow-pink | `#ff7ad9` | the market's grow light |
| cream | `#e8e2d8` | checkerboard, paper |

## Generation rules

- Every environment still is generated with the same reference set and the
  same style line ("clean modern anime background art, cel shaded, neon
  night, wet reflections"), 16:9, no people in it, so the room reads as a
  place the player is about to walk into.
- Every portrait is generated with the character portraits already approved
  as references, so the three leads stay themselves across passes.
- Nothing is generated without the count and cost being shown first.
