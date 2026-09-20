import type { VenueId } from '@/content/ids';
import type { VenueDef } from '@/types/venues';
import { WEEKDAYS } from '@/types/core';

const ALL_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/**
 * Venues define where encounters happen, which stats matter there, and who is
 * around. `regulars` is the schedule the crowd is drawn from in Phase 2.
 */
export const VENUES: Readonly<Record<VenueId, VenueDef>> = {
  neon_last_call: {
    id: 'neon_last_call',
    name: 'Last Call',
    tagline: 'dive bar, sticky floors, unreasonably good jukebox',
    blurb:
      'Neon in the window, one dartboard, and a bartender who has heard every opening line ever written.',
    pace: 'fast',
    statWeights: { confidence: 1.35, humor: 1.25, style: 1.1, charm: 1, culture: 0.7, fitness: 0.9 },
    entryCost: 15,
    energyCost: 20,
    openDays: ['wed', 'thu', 'fri', 'sat', 'sun'],
    openSlots: ['evening'],
    regulars: [
      { character: 'sable', days: ['wed', 'thu', 'fri', 'sat'], slots: ['evening'] },
      { character: 'nadia', days: ['fri'], slots: ['evening'] },
    ],
    atmosphere: [
      'Someone has put on a nine-minute song and nobody has the authority to stop them.',
      'The dartboard has a fresh hole in the wall beside it. Two inches left of history.',
      'A man at the end of the bar is explaining crypto to a woman who is explaining leaving.',
    ],
    miniGame: 'darts',
  },
  margin_notes: {
    id: 'margin_notes',
    name: 'Margin Notes',
    tagline: 'bookshop and coffee counter, quiet enough to hear yourself blow it',
    blurb:
      'Second-hand shelves, a good espresso machine, and a regular who annotates library books in pencil like a criminal.',
    pace: 'slow',
    statWeights: { culture: 1.35, charm: 1.2, humor: 1, confidence: 0.9, style: 1, fitness: 0.7 },
    entryCost: 6,
    energyCost: 10,
    openDays: ALL_DAYS,
    openSlots: ['morning', 'afternoon'],
    regulars: [{ character: 'wren', days: ['tue', 'wed', 'sat'], slots: ['afternoon'] }],
    atmosphere: [
      'The espresso machine screams. Everyone pretends it did not.',
      'Someone has shelved poetry under travel and you can feel the building resenting it.',
      'Rain on the front window, and the good armchair is somehow free.',
    ],
  },
  ironhaus: {
    id: 'ironhaus',
    name: 'Ironhaus',
    tagline: 'chalk, iron, and one very competitive regular',
    blurb: 'Plates that have seen things, a rowing machine nobody touches, and a squat rack with a queue.',
    pace: 'medium',
    statWeights: { fitness: 1.35, confidence: 1.2, humor: 1, charm: 0.95, style: 0.8, culture: 0.7 },
    entryCost: 0,
    energyCost: 18,
    openDays: WEEKDAYS.concat(['sat']),
    openSlots: ['morning', 'evening'],
    regulars: [{ character: 'nadia', days: ['mon', 'wed', 'fri'], slots: ['morning', 'evening'] }],
    atmosphere: [
      'Someone is filming a set from three angles. Nobody will ever watch it.',
      'The gym playlist has lurched from techno to a power ballad and everybody adjusted.',
      'The squat rack is free. This never happens. Something is wrong.',
    ],
  },
};

export const VENUE_LIST: readonly VenueDef[] = Object.values(VENUES);
