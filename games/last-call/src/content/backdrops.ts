/**
 * The establishing shots.
 *
 * One painted still per place, generated to match the character key art so
 * the world and the people in it come from the same hand. The game shows the
 * shot when you walk in and keeps it behind the conversation panel, so a room
 * is somewhere you have seen rather than a floor plan with furniture on it.
 *
 * They are loaded straight from the render host by the player's browser; if
 * one fails to load, the drawn room carries on without it.
 */
import type { InteriorId } from '@/content/city';

const HOST = 'https://d8j0ntlcm91z4.cloudfront.net/user_37NVjOty0iqni6aBd5Kpn88QUhU/';

export type BackdropId = InteriorId | 'street';

export const BACKDROPS: Readonly<Partial<Record<BackdropId, string>>> = {
  street: `${HOST}hf_20260923_172240_0833f6ef-df5f-4af3-a54b-a8e4cd6a9615.png`,
  neon_last_call: `${HOST}hf_20260923_172241_8765b0da-fa38-4797-942c-1cb7b41f52fe.png`,
  margin_notes: `${HOST}hf_20260923_172240_c4bcf983-7bdc-4b71-9c95-52188c145b4e.png`,
  ironhaus: `${HOST}hf_20260923_172350_d23fb019-2066-4cc3-b047-f73dce5b49d6.png`,
  copper_kettle: `${HOST}hf_20260923_172240_77d64f55-abd1-4ed8-bbc7-a04bf0ec9386.png`,
  static_records: `${HOST}hf_20260923_172240_7f033fb1-db22-423c-a31f-392a4f1a3c9e.png`,
  pixel_palace: `${HOST}hf_20260923_172240_29420ca3-be15-431b-8e07-28a1107c369d.png`,
  nightjar: `${HOST}hf_20260923_172241_26cb4bb4-dec5-4764-8dcf-fba5d0fb75f1.png`,
  basilico: `${HOST}hf_20260923_172350_7fdc40ac-d925-4db9-8a6c-5a544fa0bf0a.png`,
  meridian_gallery: `${HOST}hf_20260923_172240_d0159972-09ee-4108-8707-95dce7506644.png`,
  fresh_market: `${HOST}hf_20260923_172241_72b2a437-bd70-4992-b714-e21bcebcf4b0.png`,
  // Panels has no still yet: the render was refused by the image filter.
};

export function backdropFor(place: BackdropId): string | null {
  return BACKDROPS[place] ?? null;
}
