/**
 * Everyone, full length, cut out.
 *
 * One anime-style cutout per person, generated with the same style
 * references as the leads' portraits so the whole cast comes from one hand,
 * on a transparent background so they can stand inside a rendered scene.
 * Keyed by stranger id for the cast, character id for the leads, and
 * `player_man` / `player_woman` for you.
 */
const HOST = 'https://d8j0ntlcm91z4.cloudfront.net/user_37NVjOty0iqni6aBd5Kpn88QUhU/';

export const CUTOUTS: Readonly<Record<string, string>> = {
  sable: `${HOST}hf_20260923_183031_4cba8496-0f06-4323-9331-039a68f3ca03.png`,
  wren: `${HOST}hf_20260923_183030_9467da64-2709-4ffa-a2f6-18dfced590b0.png`,
  nadia: `${HOST}hf_20260923_183147_4b0be7b0-0bdd-47a9-bfa4-aa43cdb89e10.png`,
  player_man: `${HOST}hf_20260923_183030_1f0c93c5-2c43-47f4-a959-d35b6df81a82.png`,
  player_woman: `${HOST}hf_20260923_183030_118ee604-33e1-4653-a51e-a7e23c30d4b1.png`,
  barback: `${HOST}hf_20260923_183146_1414a709-c4b9-4ebd-a1cf-0608da959921.png`,
  owner_books: `${HOST}hf_20260923_183030_7da9655d-cd14-4781-b9b1-d3858d313608.png`,
  gym_desk: `${HOST}hf_20260923_183030_4d19c338-3713-4f7d-9106-519d0a996f07.png`,
  barista: `${HOST}hf_20260923_183110_f4303838-7a00-43d3-807c-c63cc11a7c05.png`,
  record_clerk: `${HOST}hf_20260923_183110_78e72777-084d-48a4-8a54-ffd049ad8676.png`,
  arcade_attendant: `${HOST}hf_20260923_183110_390b455f-642e-402e-9e4c-9fcbabdfa877.png`,
  comics_clerk: `${HOST}hf_20260923_183110_c2555f7b-a552-4c85-addc-1b8ba5370386.png`,
  mixologist: `${HOST}hf_20260923_183147_b7ce7be6-741b-4096-bc74-9b718c47190d.png`,
  waiter: `${HOST}hf_20260923_183147_db5f5f4c-7cc1-443f-b642-c16c8e1d5ce3.png`,
  cook: `${HOST}hf_20260923_183147_944af746-190d-45c4-b618-3bf0b15918f7.png`,
  gallery_guide: `${HOST}hf_20260923_183234_7f1f43ca-1d62-4c90-ab80-3a5436126a9f.png`,
  checkout: `${HOST}hf_20260923_183234_1409a695-3b78-4c3c-b6ed-9639a85ab2a0.png`,
  reader: `${HOST}hf_20260923_183234_0ac9ab7b-19b9-438a-8062-96e8c77b2330.png`,
  lifter: `${HOST}hf_20260923_183234_e759a5a9-8e9e-4711-9cc1-b563bd8c782c.png`,
  laptop: `${HOST}hf_20260923_183236_eb7100c0-083f-40cb-a157-147ca37ab371.png`,
  digger: `${HOST}hf_20260923_183234_658713d3-6590-4e62-886f-c7c7986ae454.png`,
  gamer: `${HOST}hf_20260923_183234_8838b981-ae3b-4a89-921c-ad24d811021f.png`,
  date_night: `${HOST}hf_20260923_183305_ed32de31-a977-4575-8300-d801b04143f9.png`,
  darts_regular: `${HOST}hf_20260923_183305_31c862fe-0e7c-4fcb-9d4e-f429be365588.png`,
  birthday: `${HOST}hf_20260923_183305_84b870ab-297c-43e4-aa00-4007d32d7e02.png`,
  collector: `${HOST}hf_20260923_183305_2f43d70f-aedc-4e83-9161-675aaf1105c4.png`,
  night_owl: `${HOST}hf_20260923_183305_eee1aa50-a937-4a24-8097-78d27984b743.png`,
  shopper: `${HOST}hf_20260923_183304_ff38b022-18f8-4709-8fe4-5cf6e5032bee.png`,
  critic: `${HOST}hf_20260923_183454_3d9f77c9-8f75-4a66-bb98-19cff82fa9ba.png`,
};

export function cutoutFor(id: string): string | null {
  return CUTOUTS[id] ?? null;
}

export function playerCutout(gender: 'man' | 'woman'): string {
  return CUTOUTS[gender === 'woman' ? 'player_woman' : 'player_man']!;
}
