"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/* ── Frame Manifest ────────────────────────────────────────── */

const FIRST_FRAME = 1;
const LAST_FRAME = 600;

const FILE_PREFIX = "frame_";
const FILE_EXT = ".webp";
const PAD = 5;

const FRAME_COUNT = LAST_FRAME - FIRST_FRAME + 1;
const BATCH_SIZE = 12;

/* ── Scroll Timeline ───────────────────────────────────────── */

const OPEN_END = 0.18;
const CLOSE_START = 0.88;

/* ── 3D Spatial Geometry ───────────────────────────────────── */

/* Camera / Stage Tilts matching the reference */
const SCENE_TILT_SHUT = -10; // Viewing the closed lid from above
const SCENE_TILT_OPEN = 8;   // Natural eye-level look at open display

const DECK_INCLINE = 62;

/*
 * Lid Angles (Origin: bottom rear hinge)
 * - Closed: Folds exactly flush onto deck (-118deg)
 * - Open: Upright at 0deg
 */
const LID_SHUT_ANGLE = DECK_INCLINE - 180; // -118deg
const LID_OPEN_ANGLE = 0;

/* Hardware Proportions */
const BODY_RATIO = 1.435;
const PANEL_RATIO = 1.54;

const DECK_FORESHORTEN = Math.cos((DECK_INCLINE * Math.PI) / 180);
const DECK_MARGIN = -((1 - DECK_FORESHORTEN) / BODY_RATIO) * 100;

const STAGE_DROP = "-6%";

/* ── Helpers ───────────────────────────────────────────────── */

function getFramePath(index: number) {
  return `/frames/${FILE_PREFIX}${String(
    index + FIRST_FRAME
  ).padStart(PAD, "0")}${FILE_EXT}`;
}

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const lerp = (start: number, end: number, progress: number) =>
  start + (end - start) * progress;
const easeCubicHinge = (progress: number) => 1 - Math.pow(1 - progress, 3.2);

/* ── Apple Logo SVG ────────────────────────────────────────── */

function AppleLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 170 170"
      fill="currentColor"
      className={`opacity-75 ${className}`}
    >
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.42-9.78-11.39-20.9-14.93-33.34-3.53-12.44-5.3-23.75-5.3-33.91 0-14.02 3.42-25.75 10.26-35.18 6.84-9.44 15.53-14.28 26.06-14.53 4.9.11 10.19 1.34 15.86 3.69 5.66 2.35 9.4 3.58 11.22 3.69 1.63 0 5.61-1.34 11.93-4.02 6.32-2.68 11.66-3.83 16.03-3.46 12.39 1.09 21.99 5.86 28.78 14.34-11.09 6.74-16.52 16.08-16.3 28.03.22 9.57 3.91 17.5 11.08 23.8 7.17 6.31 15.65 10.01 25.43 11.09-2.18 6.52-4.79 13.04-7.82 19.56m-24.67-111.45c0 6.74-2.5 13.1-7.5 18.09-5 4.99-11.19 8.04-18.57 9.13-.22-1.09-.33-2.17-.33-3.26 0-6.95 2.72-13.69 8.15-20.21 5.43-6.52 12.17-10.21 20.21-11.08.11 2.39-.96 4.83-1.96 7.33z" />
    </svg>
  );
}

/* ── Keycap ────────────────────────────────────────────────── */

function Key({ grow = 1, className = "" }: { grow?: number; className?: string }) {
  return (
    <div
      style={{
        flexGrow: grow,
        flexBasis: 0,
        background: "linear-gradient(180deg,#2a2a2e 0%,#1a1a1d 45%,#111113 100%)",
        boxShadow:
          "inset 0 0.5px 0 rgba(255,255,255,0.08), inset 0 -1px 1px rgba(0,0,0,0.8), 0 0.5px 1px rgba(0,0,0,0.4)",
      }}
      className={`min-w-0 rounded-[2.5px] ${className}`}
    />
  );
}

/* ── Types ─────────────────────────────────────────────────── */

type ScenePanel = {
  title: string;
  desc?: string;
};

/* ── Component ─────────────────────────────────────────────── */

export default function MacbookFrameScene({
  children,
  panels = [],
  loaderLabel = "INITIALIZING HARDWARE DISPLAY...",
  stageOffsetY = STAGE_DROP,
  shellMark,
}: {
  children: ReactNode;
  panels?: ScenePanel[];
  loaderLabel?: string;
  stageOffsetY?: string;
  shellMark?: ReactNode;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const machineRef = useRef<HTMLDivElement>(null);
  const lidRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const shellGlareRef = useRef<HTMLDivElement>(null);
  const spillRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const deckShadowRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const lidTRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const imagesRef = useRef<(HTMLImageElement | null)[]>(
    new Array(FRAME_COUNT).fill(null)
  );
  const currentFrameRef = useRef(0);
  const drawFrameRef = useRef<(index: number) => void>(() => {});

  const [firstPainted, setFirstPainted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState(-1);
  const [progressPct, setProgressPct] = useState(0);

  /* ── Canvas Engine ────────────────────────────────────────── */

  useEffect(() => {
    drawFrameRef.current = (index: number) => {
      const canvas = canvasRef.current;
      const image = imagesRef.current[index];

      if (!canvas || !image) return;

      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const container = canvas.parentElement;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const canvasWidth = Math.round(width * dpr);
      const canvasHeight = Math.round(height * dpr);

      if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const scale = Math.max(
        width / image.naturalWidth,
        height / image.naturalHeight
      );

      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;

      ctx.fillStyle = "#020203";
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(
        image,
        (width - drawWidth) / 2,
        (height - drawHeight) / 2,
        drawWidth,
        drawHeight
      );
    };
  }, []);

  /* ── Load Frames ─────────────────────────────────────────── */

  useEffect(() => {
    let cancelled = false;
    const firstPath = getFramePath(0);
    const firstImage = new Image();

    firstImage.onload = () => {
      if (cancelled) return;
      imagesRef.current[0] = firstImage;
      drawFrameRef.current(0);
      setFirstPainted(true);
    };

    firstImage.onerror = () => {
      if (cancelled) return;
      setLoadError(firstPath);
    };

    firstImage.src = firstPath;

    const loadFrames = async () => {
      let loaded = 0;

      for (let start = 1; start < FRAME_COUNT; start += BATCH_SIZE) {
        if (cancelled) return;
        const batch: Promise<void>[] = [];

        for (
          let i = start;
          i < Math.min(start + BATCH_SIZE, FRAME_COUNT);
          i++
        ) {
          batch.push(
            new Promise<void>((resolve) => {
              const image = new Image();
              const settle = () => {
                loaded += 1;
                resolve();
              };

              image.onload = () => {
                imagesRef.current[i] = image;
                if (currentFrameRef.current === i) {
                  drawFrameRef.current(i);
                }
                settle();
              };

              image.onerror = settle;
              image.src = getFramePath(i);
            })
          );
        }

        await Promise.all(batch);

        if (!cancelled) {
          setProgressPct(Math.round((loaded / (FRAME_COUNT - 1)) * 100));
        }

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

  /* ── 3D Spatial Angles ───────────────────────────────────── */

  const applyPose = () => {
    const lidT = lidTRef.current;
    const { x, y } = pointerRef.current;

    const stageTilt = lerp(SCENE_TILT_SHUT, SCENE_TILT_OPEN, lidT);

    if (machineRef.current) {
      machineRef.current.style.transform = [
        `rotateX(${stageTilt + y * 3.5}deg)`,
        `rotateY(${x * 6}deg)`,
        `translateZ(${lerp(-20, 0, lidT)}px)`,
      ].join(" ");
    }

    if (lidRef.current) {
      const angle = lerp(LID_SHUT_ANGLE, LID_OPEN_ANGLE, lidT);
      lidRef.current.style.transform = `rotateX(${angle}deg)`;
    }
  };

  /* ── Scroll Animation ────────────────────────────────────── */

  useEffect(() => {
    let animationFrame: number | null = null;

    const update = () => {
      animationFrame = null;

      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const scrollDistance = section.offsetHeight - window.innerHeight;

      if (scrollDistance <= 0) return;

      const progress = clamp01(-rect.top / scrollDistance);
      let lidT: number;

      if (progress <= OPEN_END) {
        lidT = easeCubicHinge(progress / OPEN_END);
      } else if (progress >= CLOSE_START) {
        lidT =
          1 -
          easeCubicHinge((progress - CLOSE_START) / (1 - CLOSE_START));
      } else {
        lidT = 1;
      }

      lidTRef.current = lidT;
      applyPose();

      /* ── Screen Reveal ── */
      if (screenRef.current) {
        screenRef.current.style.opacity = String(
          clamp01((lidT - 0.12) / 0.4)
        );
      }

      /* ── Glare Sweeps ── */
      if (glareRef.current) {
        const sweep = Math.sin(lidT * Math.PI);
        glareRef.current.style.opacity = String(0.02 + sweep * 0.28);
        glareRef.current.style.transform = `translateX(${lerp(
          -35,
          35,
          lidT
        )}%) rotate(${lerp(-5, 5, lidT)}deg)`;
      }

      if (shellGlareRef.current) {
        shellGlareRef.current.style.opacity = String(lerp(0.85, 0.05, lidT));
        shellGlareRef.current.style.transform = `translateX(${lerp(
          -15,
          15,
          lidT
        )}%)`;
      }

      /* ── Deck Illumination ── */
      if (spillRef.current) {
        spillRef.current.style.opacity = String(
          clamp01((lidT - 0.3) / 0.35) * 0.7
        );
      }

      /* ── Deck Shadow ── */
      if (deckShadowRef.current) {
        deckShadowRef.current.style.opacity = String(clamp01((1 - lidT) * 0.95));
      }

      /* ── Floor Shadow ── */
      if (shadowRef.current) {
        shadowRef.current.style.opacity = String(lerp(0.45, 0.9, lidT));
        shadowRef.current.style.transform = `translateY(${lerp(
          -2,
          8,
          lidT
        )}px) scaleX(${lerp(0.95, 1, lidT)})`;
      }

      /* ── Frame Timeline ── */
      let frameIndex = 0;
      if (progress <= OPEN_END) {
        frameIndex = 0;
      } else if (progress < CLOSE_START) {
        const videoProgress =
          (progress - OPEN_END) / (CLOSE_START - OPEN_END);
        frameIndex = Math.min(
          FRAME_COUNT - 1,
          Math.floor(videoProgress * (FRAME_COUNT - 1))
        );
      } else {
        frameIndex = FRAME_COUNT - 1;
      }

      currentFrameRef.current = frameIndex;

      if (imagesRef.current[frameIndex]) {
        drawFrameRef.current(frameIndex);
      } else {
        for (let i = frameIndex; i >= 0; i--) {
          if (imagesRef.current[i]) {
            drawFrameRef.current(i);
            break;
          }
        }
      }

      /* ── Panels ── */
      if (panels.length) {
        let next = -1;
        if (progress > OPEN_END && progress < CLOSE_START) {
          const panelProgress =
            (progress - OPEN_END) / (CLOSE_START - OPEN_END);
          next = Math.min(
            panels.length - 1,
            Math.floor(panelProgress * panels.length)
          );
        }
        setActivePanel((current) => (current === next ? current : next));
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
  }, [panels.length]);

  /* ── Mouse Parallax ───────────────────────────────────────── */

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let raf: number | null = null;

    const onMove = (event: MouseEvent) => {
      const stage = stageRef.current;
      if (!stage) return;

      const rect = stage.getBoundingClientRect();
      pointerRef.current = {
        x: clamp01((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: clamp01((event.clientY - rect.top) / rect.height) * 2 - 1,
      };

      if (raf === null) {
        raf = requestAnimationFrame(() => {
          raf = null;
          applyPose();
        });
      }
    };

    const onLeave = () => {
      pointerRef.current = { x: 0, y: 0 };
      applyPose();
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  const panel = activePanel >= 0 ? panels[activePanel] : undefined;

  /* ── Render ───────────────────────────────────────────────── */

  return (
    <div
      ref={sectionRef}
      className="
        relative
        h-[350vh]
        w-full
        bg-[radial-gradient(circle_at_top_left,#e8f3fa,transparent_40%),radial-gradient(circle_at_top_right,#f3e8f7,transparent_35%),linear-gradient(to_bottom,#ffffff,#f5f8fc)]
        sm:h-[420vh]
      "
    >
      <div
        className="
          sticky
          top-0
          flex
          h-[100svh]
          w-full
          items-center
          overflow-hidden
        "
      >
        <div
          className="
            mx-auto
            grid
            w-full
            max-w-7xl
            items-center
            gap-6
            px-4
            py-8
            sm:gap-10
            sm:px-6
            lg:grid-cols-2
            lg:px-8
          "
        >
          {/* Left Content */}
          <div className="relative text-center lg:text-left">
            {children}
          </div>

          {/* ── MacBook 3D Stage ── */}
          <div
            ref={stageRef}
            className="
              relative
              mx-auto
              w-full
              max-w-[360px]
              sm:max-w-[430px]
              lg:max-w-[490px]
            "
            style={{
              perspective: "2200px",
              perspectiveOrigin: "50% 55%",
              transform: `translateY(${stageOffsetY})`,
            }}
          >
            <div
              ref={machineRef}
              className="relative will-change-transform"
              style={{
                transformStyle: "preserve-3d",
                transform: `rotateX(${SCENE_TILT_SHUT}deg) translateZ(-20px)`,
              }}
            >
              {/* ── MACBOOK LID (Origin at bottom/hinge edge) ── */}
              <div
                ref={lidRef}
                className="
                  relative
                  w-full
                  origin-bottom
                  will-change-transform
                "
                style={{
                  aspectRatio: String(BODY_RATIO),
                  transformStyle: "preserve-3d",
                  transform: `rotateX(${LID_SHUT_ANGLE}deg)`,
                }}
              >
                {/* ── TOP ALUMINUM SHELL (Outer Lid with Apple Logo) ── */}
                <div
                  className="
                    absolute
                    inset-0
                    overflow-hidden
                    rounded-[16px]
                  "
                  style={{
                    transform: "rotateY(180deg) rotateZ(180deg)",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    background:
                      "linear-gradient(175deg, #abb0b9 0%, #9ca1aa 32%, #8e939c 68%, #9ca1aa 88%, #a7acb5 100%)",
                    boxShadow:
                      "inset 0 1px 1px rgba(255,255,255,0.7), inset 0 -1.5px 3px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  {/* Sheen */}
                  <div
                    ref={shellGlareRef}
                    className="
                      pointer-events-none
                      absolute
                      -inset-y-1/2
                      -inset-x-1/4
                      will-change-transform
                    "
                    style={{
                      background:
                        "linear-gradient(108deg, transparent 30%, rgba(255,255,255,0.3) 48%, rgba(255,255,255,0.08) 54%, transparent 70%)",
                    }}
                  />

                  {/* Apple Logo (Centered & Right Side Up) */}
                  <div
                    className="
                      absolute
                      left-1/2
                      top-1/2
                      flex
                      aspect-square
                      w-[12%]
                      -translate-x-1/2
                      -translate-y-1/2
                      items-center
                      justify-center
                      text-[#595d65]
                    "
                    style={{
                      filter:
                        "drop-shadow(0 1px 0 rgba(255,255,255,0.35)) drop-shadow(0 -1px 0 rgba(0,0,0,0.2))",
                    }}
                  >
                    {shellMark ?? <AppleLogo className="h-full w-full" />}
                  </div>

                  {/* Machined Lip Highlight */}
                  <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-black/10" />
                </div>

                {/* ── INNER DISPLAY ASSEMBLY (Screen + Camera Notch at Top) ── */}
                <div
                  className="
                    relative
                    h-full
                    w-full
                    overflow-hidden
                    rounded-[16px]
                    bg-[#08080a]
                    p-[4px]
                    pb-[7px]
                    shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)]
                    sm:p-[5px]
                    sm:pb-[9px]
                  "
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    background: "#08080a",
                    border: "1px solid #1a1a1f",
                  }}
                >
                  <div
                    className="
                      relative
                      h-full
                      w-full
                      overflow-hidden
                      rounded-[10px]
                      bg-[#020203]
                    "
                    style={{ aspectRatio: String(PANEL_RATIO) }}
                  >
                    {/* Camera Notch at top center of display */}
                    <div
                      className="
                        absolute
                        left-1/2
                        top-0
                        z-30
                        flex
                        h-[10px]
                        w-[13%]
                        -translate-x-1/2
                        items-center
                        justify-center
                        rounded-b-[5px]
                        bg-[#08080a]
                        sm:h-[12px]
                      "
                    >
                      <div className="h-[3px] w-[3px] rounded-full bg-[#030305] ring-1 ring-[#202025]" />
                    </div>

                    {/* Canvas Display */}
                    <div
                      ref={screenRef}
                      className="h-full w-full"
                      style={{ opacity: 0 }}
                    >
                      <canvas
                        ref={canvasRef}
                        className="h-full w-full"
                        aria-hidden="true"
                      />

                      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_8px_rgba(0,0,0,0.8)]" />

                      {/* Information Panel */}
                      {panel && (
                        <>
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                          <div
                            key={activePanel}
                            className="pointer-events-none absolute inset-x-0 bottom-0 p-3.5 sm:p-4"
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-sky-500 via-violet-600 to-rose-500 text-[9px] font-bold text-white shadow sm:h-8 sm:w-8 sm:text-[10px]">
                                {String(activePanel + 1).padStart(2, "0")}
                              </div>
                              <div className="min-w-0 pt-0.5">
                                <p className="truncate text-xs font-semibold text-white">
                                  {panel.title}
                                </p>
                                {panel.desc && (
                                  <p className="mt-0.5 line-clamp-2 text-[9px] leading-relaxed text-zinc-300 sm:text-[10px]">
                                    {panel.desc}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Buffering Indicator */}
                      {progressPct < 100 && (
                        <div className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-black/60 px-2 py-0.5 text-[7px] font-medium tracking-wider text-zinc-400 backdrop-blur-md">
                          BUFFERING {progressPct}%
                        </div>
                      )}
                    </div>

                    {/* Glass Reflection */}
                    <div
                      ref={glareRef}
                      className="pointer-events-none absolute -inset-y-16 -inset-x-1/2 will-change-transform"
                      style={{
                        opacity: 0.03,
                        background:
                          "linear-gradient(112deg, transparent 38%, rgba(255,255,255,0.08) 46%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.03) 54%, transparent 62%)",
                      }}
                    />

                    {/* Error State */}
                    {loadError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-[#08080a] p-4 text-center">
                        <p className="text-[9px] font-bold tracking-widest text-red-400">
                          FRAME ASSET MISSING
                        </p>
                        <p className="max-w-[240px] truncate font-mono text-[8px] text-zinc-500">
                          {loadError}
                        </p>
                      </div>
                    )}

                    {/* Loader */}
                    {!firstPainted && !loadError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-[#020203] p-4 text-center">
                        <div className="h-[2px] w-28 overflow-hidden rounded-full bg-zinc-800">
                          <span className="block h-full w-1/3 animate-pulse bg-gradient-to-r from-sky-400 via-violet-400 to-rose-400" />
                        </div>
                        <p className="text-[8px] tracking-[0.25em] text-zinc-500">
                          {loaderLabel}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── KEYBOARD DECK (Base Clamshell) ── */}
              <div
                className="
                  relative
                  mx-auto
                  w-full
                  origin-top
                  will-change-transform
                "
                style={{
                  transform: `rotateX(${DECK_INCLINE}deg)`,
                  transformStyle: "preserve-3d",
                  marginBottom: `${DECK_MARGIN}%`,
                }}
              >
                <div
                  className="relative w-full rounded-[16px]"
                  style={{
                    aspectRatio: String(BODY_RATIO),
                    background:
                      "linear-gradient(180deg, #a7acb5 0%, #9ca1aa 22%, #8e939c 65%, #7f848d 100%)",
                    boxShadow:
                      "inset 0 1px 1px rgba(255,255,255,0.7), inset 0 -2px 4px rgba(0,0,0,0.35), 0 20px 38px -8px rgba(15,23,42,0.45)",
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Screen Spill */}
                  <div
                    ref={spillRef}
                    className="
                      pointer-events-none
                      absolute
                      inset-x-[6%]
                      top-0
                      h-[65%]
                      will-change-transform
                    "
                    style={{
                      opacity: 0,
                      background:
                        "linear-gradient(180deg, rgba(160,210,255,0.7), transparent)",
                      filter: "blur(20px)",
                    }}
                  />

                  {/* ── Keyboard & Speakers ── */}
                  <div
                    className="
                      absolute
                      inset-x-[3.2%]
                      top-[3.2%]
                      flex
                      h-[47%]
                      items-stretch
                      gap-[1.5%]
                    "
                  >
                    {/* Left Speaker */}
                    <div
                      className="w-[7.5%] rounded-[3px]"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(20,20,25,0.45) 0.65px, transparent 0.75px) 0 0 / 3.5px 3.5px",
                      }}
                    />

                    {/* Keyboard Tray */}
                    <div
                      className="
                        flex
                        flex-1
                        flex-col
                        gap-[1.6%]
                        rounded-[6px]
                        p-[3px]
                      "
                      style={{
                        background: "#0c0c0e",
                        boxShadow:
                          "inset 0 1px 2px rgba(0,0,0,0.9), 0 0.5px 0 rgba(255,255,255,0.25)",
                      }}
                    >
                      {/* Function row */}
                      <div className="flex gap-[2px]" style={{ flexGrow: 0.68, flexBasis: 0 }}>
                        <Key grow={1.25} />
                        {Array.from({ length: 12 }).map((_, i) => (
                          <Key key={i} />
                        ))}
                        <Key grow={1.1} className="!rounded-[4px]" />
                      </div>

                      {/* Number row */}
                      <div className="flex gap-[2px]" style={{ flexGrow: 1, flexBasis: 0 }}>
                        {Array.from({ length: 13 }).map((_, i) => (
                          <Key key={i} />
                        ))}
                        <Key grow={1.55} />
                      </div>

                      {/* Tab row */}
                      <div className="flex gap-[2px]" style={{ flexGrow: 1, flexBasis: 0 }}>
                        <Key grow={1.5} />
                        {Array.from({ length: 13 }).map((_, i) => (
                          <Key key={i} />
                        ))}
                        <Key grow={1.05} />
                      </div>

                      {/* Home row */}
                      <div className="flex gap-[2px]" style={{ flexGrow: 1, flexBasis: 0 }}>
                        <Key grow={1.75} />
                        {Array.from({ length: 11 }).map((_, i) => (
                          <Key key={i} />
                        ))}
                        <Key grow={1.8} />
                      </div>

                      {/* Shift row */}
                      <div className="flex gap-[2px]" style={{ flexGrow: 1, flexBasis: 0 }}>
                        <Key grow={2.3} />
                        {Array.from({ length: 10 }).map((_, i) => (
                          <Key key={i} />
                        ))}
                        <Key grow={2.25} />
                      </div>

                      {/* Bottom row + arrows */}
                      <div className="flex gap-[2px]" style={{ flexGrow: 1, flexBasis: 0 }}>
                        <Key />
                        <Key />
                        <Key grow={1.15} />
                        <Key grow={1.35} />
                        <Key grow={5.6} />
                        <Key grow={1.35} />
                        <Key grow={1.15} />

                        <div className="flex gap-[2px]" style={{ flexGrow: 3, flexBasis: 0 }}>
                          <Key />
                          <div className="flex flex-1 flex-col gap-[1.5px]">
                            <Key />
                            <Key />
                          </div>
                          <Key />
                        </div>
                      </div>
                    </div>

                    {/* Right Speaker */}
                    <div
                      className="w-[7.5%] rounded-[3px]"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(20,20,25,0.45) 0.65px, transparent 0.75px) 0 0 / 3.5px 3.5px",
                      }}
                    />
                  </div>

                  {/* ── Trackpad ── */}
                  <div
                    className="
                      absolute
                      inset-x-[26%]
                      bottom-[6%]
                      top-[55%]
                      rounded-[8px]
                    "
                    style={{
                      background:
                        "linear-gradient(180deg,#9ca1aa 0%,#a7acb5 40%,#b1b6bf 100%)",
                      boxShadow:
                        "inset 0 0 0 1px rgba(0,0,0,0.15), inset 0 1.5px 3px rgba(0,0,0,0.18), inset 0 -0.5px 0 rgba(255,255,255,0.7)",
                    }}
                  />

                  {/* Lid Shadow Overlay */}
                  <div
                    ref={deckShadowRef}
                    className="
                      pointer-events-none
                      absolute
                      inset-0
                      z-20
                      rounded-[inherit]
                      bg-black/75
                    "
                    style={{ opacity: 0 }}
                  />

                  {/* Machined Thumb Opening Notch */}
                  <div
                    className="
                      absolute
                      inset-x-[42%]
                      bottom-0
                      z-30
                      h-[1.8%]
                      rounded-t-[3px]
                    "
                    style={{
                      background:
                        "linear-gradient(180deg, #595d65 0%, #757a84 100%)",
                      boxShadow: "inset 0 1px 1px rgba(0,0,0,0.5)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Floor Contact Shadow */}
            <div
              ref={shadowRef}
              className="
                mx-auto
                h-8
                w-[86%]
                rounded-[50%]
                bg-slate-950/35
                blur-[20px]
                will-change-transform
              "
              style={{
                opacity: 0.45,
                transform: "translateY(-2px) scaleX(0.95)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}