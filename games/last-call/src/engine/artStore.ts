import type { CharacterId, Expression } from '@/content/ids';

/**
 * Imported art.
 *
 * Final art can reach the game two ways. In a checkout it is files under
 * `public/art/characters/<id>/`. In a published build there is no filesystem to
 * drop files into, so the player imports images through the page itself: the
 * bytes go to the artifact's own asset store and the id-per-slot map lives in
 * the artifact's document store, which means the art is there for everyone who
 * opens it, not just the person who imported it.
 *
 * Everything here degrades to nothing: with no runtime, no grant, or a reader's
 * view, the calls resolve empty and the game draws its placeholder portraits.
 */
export type ArtSlot = `${CharacterId}:${Expression}`;
export type ArtMap = Readonly<Partial<Record<ArtSlot, string>>>;

const DOC_PATH = 'art/portraits';
const MIRROR_KEY = 'last-call:art-map';

export function slotFor(character: CharacterId, expression: Expression): ArtSlot {
  return `${character}:${expression}`;
}

/** Root-relative path an asset id serves at, in every view and version. */
export function assetUrl(assetId: string): string {
  return `/_blob/${assetId}`;
}

interface ClaudeRuntime {
  use(name: string): Promise<unknown>;
}

interface AssetsNamespace {
  upload(blob: Blob, options?: { type?: string }): Promise<{ id: string; url: string }>;
}

interface DbSnapshot {
  exists: boolean;
  data(): Record<string, unknown> | undefined;
}

interface DbNamespace {
  doc(path: string): {
    get(): Promise<DbSnapshot>;
    set(data: Record<string, unknown>): Promise<void>;
  };
}

function runtime(): ClaudeRuntime | null {
  const candidate = (globalThis as { claude?: ClaudeRuntime }).claude;
  return candidate && typeof candidate.use === 'function' ? candidate : null;
}

async function namespace<T>(name: string): Promise<T | null> {
  const claude = runtime();
  if (!claude) return null;
  try {
    return ((await claude.use(name)) as T | null) ?? null;
  } catch {
    return null;
  }
}

/** A local mirror so imported art paints on the first frame after a reload. */
function readMirror(): ArtMap {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(MIRROR_KEY);
    return raw ? (JSON.parse(raw) as ArtMap) : {};
  } catch {
    return {};
  }
}

function writeMirror(map: ArtMap): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(MIRROR_KEY, JSON.stringify(map));
  } catch {
    // Storage off: the document store is still the real record.
  }
}

/** True when this view can import art at all (a writer in a published build). */
export async function canImportArt(): Promise<boolean> {
  return (await namespace<AssetsNamespace>('assets')) !== null;
}

export async function loadArtMap(): Promise<ArtMap> {
  const mirror = readMirror();
  const db = await namespace<DbNamespace>('db');
  if (!db) return mirror;

  try {
    const snapshot = await db.doc(DOC_PATH).get();
    if (!snapshot.exists) return mirror;
    const data = snapshot.data() ?? {};
    const map: Record<string, string> = {};
    for (const [slot, value] of Object.entries(data)) {
      if (typeof value === 'string' && value.length > 0) map[slot] = value;
    }
    writeMirror(map);
    return map;
  } catch {
    return mirror;
  }
}

export interface ImportResult {
  map: ArtMap;
  assetId: string;
}

/**
 * Store one image and point a slot at it. The asset upload and the map write
 * are separate calls, so the map is written immediately after the upload
 * resolves and a slot whose asset has gone missing simply renders the
 * placeholder again.
 */
export async function importPortrait(
  slot: ArtSlot,
  file: Blob,
  current: ArtMap,
): Promise<ImportResult> {
  const assets = await namespace<AssetsNamespace>('assets');
  if (!assets) throw new Error('This view cannot store art.');

  const type = file.type && file.type.startsWith('image/') ? file.type : 'image/png';
  const uploaded = await assets.upload(file, { type });

  const map: Record<string, string> = { ...current, [slot]: uploaded.id };
  writeMirror(map);

  const db = await namespace<DbNamespace>('db');
  if (db) {
    try {
      await db.doc(DOC_PATH).set(map);
    } catch {
      // The mirror still holds it for this viewer; the next import retries.
    }
  }

  return { map, assetId: uploaded.id };
}

/**
 * Where to draw her from, in order: the exact expression, her neutral portrait,
 * then nothing — which is the placeholder's cue.
 */
export function portraitSource(
  map: ArtMap,
  character: CharacterId,
  expression: Expression,
): string | null {
  const exact = map[slotFor(character, expression)];
  if (exact) return assetUrl(exact);
  const neutral = map[slotFor(character, 'neutral')];
  return neutral ? assetUrl(neutral) : null;
}
