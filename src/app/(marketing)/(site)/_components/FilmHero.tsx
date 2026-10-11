"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/* ── Frame Manifest ────────────────────────────────────────── */

const FIRST_FRAME = 1;
const LAST_FRAME = 600;

const FILE_PREFIX = "frame_";
const FILE_EXT = ".webp";
const PAD = 5;

const FRAME_COUNT = LAST_FRAME - FIRST_FRAME + 1;
const BATCH_SIZE = 12;

/* ── Scroll Timeline ───────────────────────────────────────── */

/* The film plays over the first 90% of the section; the rest holds
 * on the closing brand card so it has time to land. */
const FILM_END = 0.9;

/* Intro copy sits over the opening shot, then gets out of the way. */
const INTRO_FADE_START = 0.015;
const INTRO_FADE_END = 0.05;
const CAPTION_IN_START = 0.055;
const CAPTION_IN_END = 0.075;

/* First frame (0-based) of each scene — one caption per scene. The
 * last scene is the light brand card, where the copy flips to dark. */
const CHAPTER_STARTS = [0, 150, 290, 410, 490, 560];
const END_CHAPTER = CHAPTER_STARTS.length - 1;

/* The dark scrim lifts as the film cuts to the light brand card. */
const SCRIM_FADE_START = 548;
const SCRIM_FADE_FRAMES = 20;

/* ── Canvas ────────────────────────────────────────────────── */

/* Frames are 1280×720 — a bigger backing store only costs fill-rate. */
const MAX_CANVAS_W = 1920;

/* On tall screens a pure "cover" crop would show a sliver of the shot,
 * so the frame is capped at this zoom over "contain" and letterboxed
 * over a blurred copy of itself. */
const MAX_ZOOM_OVER_CONTAIN = 1.6;
const LETTERBOX_CENTER_Y = 0.36;

/* The source frames carry a few rows of black along the bottom edge. */
const SOURCE_TRIM_BOTTOM = 8;

/* ── Helpers ───────────────────────────────────────────────── */

function getFramePath(index: number) {
  return `/frames/${FILE_PREFIX}${String(index + FIRST_FRAME).padStart(
    PAD,
    "0"
  )}${FILE_EXT}`;
}

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

function chapterAt(frameIndex: number) {
  let chapter = 0;
  for (let i = 0; i < CHAPTER_STARTS.length; i++) {
    if (frameIndex >= CHAPTER_STARTS[i]) chapter = i;
  }
  return chapter;
}

/* ── Component ─────────────────────────────────────────────── */

export default function FilmHero({
  children,
  end,
  captions,
  skipLabel,
  skipHref = "#features",
  scrollHeightVh = 800,
}: {
  /** Intro copy shown over the opening shot. */
  children: ReactNode;
  /** Shown over the closing brand card. */
  end: ReactNode;
  /** One line per scene before the closing card (see CHAPTER_STARTS). */
  captions: string[];
  skipLabel: string;
  skipHref?: string;
  /** Total scroll length of the section in vh. Bigger = slower playback. */
  scrollHeightVh?: number;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);

  const targetProgressRef = useRef(0);
  const smoothProgressRef = useRef(0);
  const inViewRef = useRef(false);
  const reducedMotionRef = useRef(false);

  const imagesRef = useRef<(HTMLImageElement | null)[]>(
    new Array(FRAME_COUNT).fill(null)
  );
  const blurCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const paintedRef = useRef("");

  const [chapter, setChapter] = useState(0);
  const chapterRef = useRef(0);

  /* ── Paint ────────────────────────────────────────────────── */

  /* Reads refs only, so it is stable and safe to call from any effect. */
  const paint = useCallback((progress: number) => {
    const filmProgress = clamp01(progress / FILM_END);
    const frameIndex = Math.min(
      FRAME_COUNT - 1,
      Math.floor(filmProgress * (FRAME_COUNT - 1))
    );
    const scrim =
      1 - clamp01((frameIndex - SCRIM_FADE_START) / SCRIM_FADE_FRAMES);

    /* Overlays — written straight to the DOM, no re-render per frame. */
    const introOpacity =
      1 -
      clamp01(
        (progress - INTRO_FADE_START) / (INTRO_FADE_END - INTRO_FADE_START)
      );
    const captionOpacity = clamp01(
      (progress - CAPTION_IN_START) / (CAPTION_IN_END - CAPTION_IN_START)
    );

    if (scrimRef.current) scrimRef.current.style.opacity = String(scrim);
    if (introRef.current) {
      introRef.current.style.opacity = String(introOpacity);
      introRef.current.style.visibility = introOpacity > 0 ? "visible" : "hidden";
    }
    if (captionRef.current) {
      captionRef.current.style.opacity = String(captionOpacity);
      captionRef.current.style.visibility =
        captionOpacity > 0 ? "visible" : "hidden";
    }
    if (railRef.current) {
      railRef.current.style.transform = `scaleX(${filmProgress})`;
    }

    const nextChapter = chapterAt(frameIndex);
    if (nextChapter !== chapterRef.current) {
      chapterRef.current = nextChapter;
      setChapter(nextChapter);
    }

    /* Film frame. */
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    /* Nearest loaded frame at or before the target. */
    let paintIndex = -1;
    for (let i = frameIndex; i >= 0; i--) {
      if (imagesRef.current[i]) {
        paintIndex = i;
        break;
      }
    }
    if (paintIndex < 0) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const key = `${paintIndex}:${cw}x${ch}:${Math.round(scrim * 20)}`;
    if (key === paintedRef.current) return;
    paintedRef.current = key;

    const image = imagesRef.current[paintIndex]!;
    const iw = image.naturalWidth;
    const ih = image.naturalHeight - SOURCE_TRIM_BOTTOM;
    const cover = Math.max(cw / iw, ch / ih);
    const contain = Math.min(cw / iw, ch / ih);
    const scale = Math.min(cover, contain * MAX_ZOOM_OVER_CONTAIN);

    if (scale >= cover) {
      const dw = iw * cover;
      const dh = ih * cover;
      ctx.drawImage(image, 0, 0, iw, ih, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      return;
    }

    /* Letterboxed: a thumbnail-sized copy scaled back up is a cheap blur
     * (canvas `filter` is not available in Safari). */
    const blur = (blurCanvasRef.current ??= document.createElement("canvas"));
    blur.width = 32;
    blur.height = 18;
    blur
      .getContext("2d")!
      .drawImage(image, 0, 0, iw, ih, 0, 0, blur.width, blur.height);

    const bw = blur.width * Math.max(cw / blur.width, ch / blur.height);
    const bh = blur.height * Math.max(cw / blur.width, ch / blur.height);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(blur, (cw - bw) / 2, (ch - bh) / 2, bw, bh);
    ctx.fillStyle = `rgba(5,7,15,${0.5 * scrim})`;
    ctx.fillRect(0, 0, cw, ch);

    const dw = iw * scale;
    const dh = ih * scale;
    const top = Math.max(0, ch * LETTERBOX_CENTER_Y - dh / 2);
    ctx.drawImage(image, 0, 0, iw, ih, (cw - dw) / 2, top, dw, dh);
  }, []);

  /* ── Canvas size ──────────────────────────────────────────── */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      const ratio = Math.min(dpr, MAX_CANVAS_W / w);
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
      paintedRef.current = "";
      paint(smoothProgressRef.current);
    };

    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    fit();

    return () => ro.disconnect();
  }, [paint]);

  /* ── Render loop (only while the section is on screen) ────── */

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let animationFrame: number | null = null;

    const tick = () => {
      /* Ease the timeline toward the scrolled-to target, so fast wheel
       * flicks glide through frames instead of jumping. */
      const target = targetProgressRef.current;
      const smooth = smoothProgressRef.current;
      const next =
        reducedMotionRef.current || Math.abs(target - smooth) < 0.0004
          ? target
          : smooth + (target - smooth) * 0.08;
      smoothProgressRef.current = next;
      paint(next);
      animationFrame = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
        if (entry.isIntersecting && animationFrame === null) {
          animationFrame = requestAnimationFrame(tick);
        } else if (!entry.isIntersecting && animationFrame !== null) {
          cancelAnimationFrame(animationFrame);
          animationFrame = null;
        }
      },
      { rootMargin: "80px" }
    );
    io.observe(section);

    return () => {
      io.disconnect();
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    };
  }, [paint]);

  /* ── Load frames ──────────────────────────────────────────── */

  useEffect(() => {
    let cancelled = false;

    const loadFrame = (index: number) =>
      new Promise<void>((resolve) => {
        const image = new Image();
        image.onload = () => {
          if (!cancelled) {
            imagesRef.current[index] = image;
            paintedRef.current = "";
          }
          resolve();
        };
        image.onerror = () => resolve();
        image.src = getFramePath(index);
      });

    const loadFrames = async () => {
      await loadFrame(0);

      for (let start = 1; start < FRAME_COUNT; start += BATCH_SIZE) {
        if (cancelled) return;
        const batch: Promise<void>[] = [];
        for (let i = start; i < Math.min(start + BATCH_SIZE, FRAME_COUNT); i++) {
          batch.push(loadFrame(i));
        }
        await Promise.all(batch);
        await new Promise((resolve) => {
          requestAnimationFrame(() => resolve(null));
        });
      }
    };

    loadFrames();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Scroll timeline ──────────────────────────────────────── */

  useEffect(() => {
    let animationFrame: number | null = null;

    const update = () => {
      animationFrame = null;

      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const scrollDistance = section.offsetHeight - window.innerHeight;
      if (scrollDistance <= 0) return;

      /* Only record the target here; the render loop eases toward it. */
      targetProgressRef.current = clamp01(-rect.top / scrollDistance);

      /* When the loop is idle (off-screen scroll restore), snap + paint. */
      if (!inViewRef.current) {
        smoothProgressRef.current = targetProgressRef.current;
        paint(targetProgressRef.current);
      }
    };

    const onScroll = () => {
      if (animationFrame === null) {
        animationFrame = requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    };
  }, [paint]);

  /* ── Render ───────────────────────────────────────────────── */

  const atEnd = chapter === END_CHAPTER;

  return (
    <section
      id="film"
      ref={sectionRef}
      style={{ height: `${scrollHeightVh}vh` }}
      className="relative -mt-16 w-full bg-[#05070f]"
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          aria-hidden
          className="absolute inset-0 h-full w-full"
        />

        {/* Scrim: keeps the header and the copy legible on any shot. */}
        <div
          ref={scrimRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,7,15,0.55)_0,rgba(5,7,15,0)_22%,rgba(5,7,15,0)_42%,rgba(5,7,15,0.88)_100%)]"
        />

        {!atEnd && (
          <a
            href={skipHref}
            className="absolute right-4 top-20 z-10 rounded-full bg-black/35 px-3.5 py-1.5 text-xs font-medium text-white/85 backdrop-blur-md transition hover:bg-black/55 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-6 lg:right-8"
          >
            {skipLabel}
          </a>
        )}

        <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-7xl px-4 pb-9 sm:px-6 sm:pb-12 lg:px-8 lg:pb-16">
          <div className="relative">
            {/* Intro — over the opening shot */}
            <div ref={introRef}>{children}</div>

            {/* Scene caption / closing card */}
            <div
              ref={captionRef}
              style={{ opacity: 0, visibility: "hidden" }}
              className="absolute inset-x-0 bottom-0"
            >
              {atEnd ? (
                <div key="end" className="animate-[fadeUp_0.5s_ease-out]">
                  {end}
                </div>
              ) : (
                <p
                  key={chapter}
                  className="max-w-3xl animate-[fadeUp_0.5s_ease-out] text-balance text-[clamp(1.5rem,3.6vw,3rem)] font-medium leading-[1.12] tracking-[-0.02em] text-white"
                >
                  {captions[chapter]}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Playhead */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[3px] bg-white/15"
        >
          <span
            ref={railRef}
            style={{ transform: "scaleX(0)" }}
            className="block h-full origin-left bg-gradient-to-r from-sky-400 via-violet-500 to-rose-500"
          />
        </div>
      </div>
    </section>
  );
}
