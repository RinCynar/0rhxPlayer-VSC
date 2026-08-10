import type { NeteaseTypings } from "api";
import { parseFile } from "music-metadata";

export const logError = (err: unknown): void => {
  if (err) {
    console.error(
      new Date().toISOString(),
      typeof err === "object" ? (<Partial<Error>>err)?.stack || (<Partial<Error>>err)?.message || err : err,
    );
  }
};

export const defaultLyric: NeteaseTypings.LyricData = { time: [0], text: [["~", "~", "~"]], user: [] };

/**
 * Read synchronized lyrics embedded in the audio file (ID3 USLT / FLAC "LYRICS" / Vorbis, in LRC format).
 * Returns `undefined` when no embedded synchronized lyrics are found (non-scrollable lyrics are skipped).
 * Bilingual LRC (`LYRIC` / `tlyric` pairs at the same timestamp) is merged into the
 * `[original, translation, ""]` tuple, and the translation is rendered separately by the Lyric view.
 * Results are cached per path to avoid re-parsing on every load.
 */
const lyricCache = new Map<string, NeteaseTypings.LyricData | undefined>();

export async function getEmbeddedLyric(path: string): Promise<NeteaseTypings.LyricData | undefined> {
  const cached = lyricCache.get(path);
  if (cached !== undefined) return cached;
  try {
    const { common } = await parseFile(path, { skipCovers: true });
    const lyrics = common.lyrics;
    if (!lyrics?.length) {
      lyricCache.set(path, undefined);
      return;
    }

    const time: number[] = [0];
    const texts: [string, string, string][] = [["~", "~", "~"]];
    const lines: { t: number; text: string }[] = [];

    for (const line of lyrics.join("\n").split(/\r?\n/)) {
      const matches = [...line.matchAll(/\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g)];
      if (!matches.length) continue;
      const lyric = line.replace(/\[[^\]]*\]/g, "").trim();
      if (!lyric) continue;
      for (const m of matches) {
        const fraction = m[3] ?? "0";
        const t =
          parseInt(m[1], 10) * 60 +
          parseInt(m[2], 10) +
          (fraction.length === 3 ? parseInt(fraction, 10) / 1000 : parseInt(fraction, 10) / 100);
        lines.push({ t, text: lyric });
      }
    }
    if (!lines.length) {
      lyricCache.set(path, undefined);
      return; // non-scrollable lyrics
    }

    lines.sort((a, b) => a.t - b.t);
    for (let i = 0; i < lines.length; i++) {
      const cur = lines[i];
      const next = lines[i + 1];
      let tra = "";
      if (next && Math.abs(next.t - cur.t) < 0.06) {
        tra = next.text;
        i++; // consume the translation line
      }
      time.push(cur.t);
      texts.push([cur.text, tra, ""]);
    }
    if (time.length <= 1) {
      lyricCache.set(path, undefined);
      return;
    }
    const result: NeteaseTypings.LyricData = { time, text: texts, user: [] };
    lyricCache.set(path, result);
    return result;
  } catch {
    lyricCache.set(path, undefined);
    return;
  }
}
