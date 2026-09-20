import type { DateIdeaId } from '@/content/ids';
import type { DateIdeaDef } from '@/types/phone';

/**
 * Date ideas. An idea is offered when the player can actually pull it off
 * (hobby or stat), and it earns a bonus when it matches one of her interests —
 * which is the reward for having paid attention in conversation.
 */
export const DATE_IDEAS: Readonly<Record<DateIdeaId, DateIdeaDef>> = {
  late_dinner: {
    id: 'late_dinner',
    name: 'Late dinner',
    where: 'the place that stays open past midnight',
    blurb: 'Small tables, loud kitchen, nowhere to hide from a conversation.',
    cost: 60,
    energy: 20,
    appealsTo: ['cooking'],
    matchBonus: 2,
  },
  record_shop: {
    id: 'record_shop',
    name: 'Record shop, then somewhere loud',
    where: 'the basement shop on Vale Street',
    blurb: 'Crates, arguments about pressings, and a bar two doors down.',
    cost: 45,
    energy: 18,
    appealsTo: ['guitar'],
    matchBonus: 3,
  },
  gallery_night: {
    id: 'gallery_night',
    name: 'Late opening at the gallery',
    where: 'the museum, on the night it stays open',
    blurb: 'Free wine in small glasses and a room you can talk sideways in.',
    cost: 35,
    energy: 16,
    requiresStat: { stat: 'culture', min: 45 },
    appealsTo: ['photography'],
    matchBonus: 3,
  },
  cook_at_yours: {
    id: 'cook_at_yours',
    name: 'Cook for her',
    where: 'your place',
    blurb: 'One pan, no audience, and absolutely nowhere to blame but yourself.',
    cost: 30,
    energy: 22,
    requiresHobby: 'cooking',
    appealsTo: ['cooking'],
    matchBonus: 4,
  },
  climbing_session: {
    id: 'climbing_session',
    name: 'Climb together',
    where: 'the upstairs wall at Ironhaus',
    blurb: 'Two hours of being bad at something in front of each other.',
    cost: 25,
    energy: 28,
    requiresHobby: 'climbing',
    appealsTo: ['climbing'],
    venue: 'ironhaus',
    matchBonus: 4,
  },
  salsa_night: {
    id: 'salsa_night',
    name: 'Salsa night',
    where: 'the hall above the cafe, Wednesdays',
    blurb: 'Counting out loud, standing on feet, laughing about it after.',
    cost: 30,
    energy: 26,
    requiresHobby: 'salsa',
    appealsTo: ['salsa'],
    matchBonus: 4,
  },
  film_walk: {
    id: 'film_walk',
    name: 'Walk the city with a camera',
    where: 'the hour before sunset, starting at the bridge',
    blurb: 'Thirty-six pictures and three weeks of not knowing how it went.',
    cost: 15,
    energy: 18,
    requiresHobby: 'photography',
    appealsTo: ['photography'],
    matchBonus: 4,
  },
  dive_bar_darts: {
    id: 'dive_bar_darts',
    name: 'Darts and bad wine',
    where: 'Last Call, on a quiet night',
    blurb: 'Her turf, your nerve. The jukebox is on her side.',
    cost: 40,
    energy: 20,
    venue: 'neon_last_call',
    appealsTo: [],
    matchBonus: 1,
  },
};

export const DATE_IDEA_LIST: readonly DateIdeaDef[] = Object.values(DATE_IDEAS);
