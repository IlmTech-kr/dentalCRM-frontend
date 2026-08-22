"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/* ── Frame manifest — 600 frames, 1280×720 ─────────────── */
const FIRST_FRAME = 1;
const LAST_FRAME = 600;
const FILE_PREFIX = "frame_";
const FILE_EXT = ".webp";
const PAD = 5;

const FRAME_COUNT = LAST_FRAME - FIRST_FRAME + 1;
const BATCH_SIZE = 12;

/* ── Scroll timeline ───────────────────────────────────── */
const OPEN_END = 0.13;
const CLOSE_START = 0.87;

/* ── 3D pose ───────────────────────────────────────────── */
const SCENE_TILT_SHUT = 26;   // deg — viewed more from above when closed
const SCENE_TILT_OPEN = 9;    // settles as it opens
const LID_SHUT = -74;         // never reaches -90, so it never degenerates
const DECK_LAY = 68;          // deck lies back into the scene

function getFramePath(index: number) {
  return `/frames/${FILE_PREFIX}${String(index + FIRST_FRAME).padStart(PAD, "0")}${FILE_EXT}`;
}

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeHinge = (t: number) => 1 - Math.pow(1 - t, 2.4);

type ScenePanel = { title: string; desc?: string };

export default function MacbookFrameScene({
  children,
  panels = [],
  loaderLabel,
}: {
  children: ReactNode;
  panels?: ScenePanel[];
  loaderLabel?: string;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const machineRef = useRef<HTMLDivElement>(null);
  const lidRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const spillRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const lidTRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });

  const imagesRef = useRef<(HTMLImageElement | null)[]>(
    new Array(FRAME_COUNT).fill(null),
  );
  const currentFrameRef = useRef(0);
  const drawFrameRef = useRef<(index: number) => void>(() => {});

  const [firstPainted, setFirstPainted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState(-1);
  const [progressPct, setProgressPct] = useState(0);

  /* ── Sticky sanity check ──────────────────────────────── */
  useEffect(() => {
    let el: HTMLElement | null = stickyRef.current?.parentElement ?? null;
    while (el && el !== document.documentElement) {
      const s = getComputedStyle(el);
      if (s.overflow !== "visible" || s.overflowX !== "visible") {
        console.warn(
          "[MacbookFrameScene] Ancestor overflow != visible disables position:sticky. " +
            "Use `overflow-x: clip` instead of `hidden` on:",
          el,
        );
        break;
      }
      el = el.parentElement;
    }
  }, []);

  /* ── Draw ─────────────────────────────────────────────── */
  useEffect(() => {
    drawFrameRef.current = (index: number) => {
      const canvas = canvasRef.current;
      const image = imagesRef.current[index];
      if (!canvas || !image) return;

      const context = canvas.getContext("2d", { alpha: false });
      if (!context) return;

      const container = canvas.parentElement;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const bw = Math.round(width * dpr);
      const bh = Math.round(height * dpr);

      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
      const dw = image.naturalWidth * scale;
      const dh = image.naturalHeight * scale;

      context.fillStyle = "#08080a";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, (width - dw) / 2, (height - dh) / 2, dw, dh);
    };
  }, []);

  /* ── Load frames ──────────────────────────────────────── */
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
      console.error("[MacbookFrameScene] frame failed to load:", firstPath);
      setLoadError(firstPath);
    };
    firstImage.src = firstPath;

    const loadFrames = async () => {
      let loaded = 0;
      for (let start = 1; start < FRAME_COUNT; start += BATCH_SIZE) {
        if (cancelled) return;
        const batch: Promise<void>[] = [];

        for (let i = start; i < Math.min(start + BATCH_SIZE, FRAME_COUNT); i++) {
          batch.push(
            new Promise<void>((resolve) => {
              const image = new Image();
              const settle = () => {
                loaded += 1;
                resolve();
              };
              image.onload = () => {
                imagesRef.current[i] = image;
                if (currentFrameRef.current === i) drawFrameRef.current(i);
                settle();
              };
              image.onerror = settle;
              image.src = getFramePath(i);
            }),
          );
        }

        await Promise.all(batch);
        if (!cancelled) setProgressPct(Math.round((loaded / (FRAME_COUNT - 1)) * 100));
        await new Promise((r) => requestAnimationFrame(() => r(null)));
      }
    };

    loadFrames();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Apply the 3D pose from lidT + pointer ────────────── */
  const applyPose = () => {
    const lidT = lidTRef.current;
    const { x, y } = pointerRef.current;

    const tilt = lerp(SCENE_TILT_SHUT, SCENE_TILT_OPEN, lidT);

    if (machineRef.current) {
      machineRef.current.style.transform = [
        `rotateX(${tilt + y * 5}deg)`,
        `rotateY(${x * 11}deg)`,
        `translateZ(${lerp(-40, 0, lidT)}px)`,
      ].join(" ");
    }

    if (lidRef.current) {
      const angle = lerp(LID_SHUT, 0, lidT);
      lidRef.current.style.transform = `rotateX(${angle}deg)`;
      // Clip hides the first sliver of travel, where any rotated plane
      // reads as a thin artifact rather than a lid.
      const hide = clamp01((0.16 - lidT) / 0.16);
      lidRef.current.style.clipPath = `inset(${hide * 100}% 0 0 0)`;
    }
  };

  /* ── Scroll → lid + frame + caption ───────────────────── */
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
      if (progress < OPEN_END) {
        lidT = easeHinge(progress / OPEN_END);
      } else if (progress > CLOSE_START) {
        lidT = 1 - easeHinge((progress - CLOSE_START) / (1 - CLOSE_START));
      } else {
        lidT = 1;
      }

      lidTRef.current = lidT;
      applyPose();

      if (screenRef.current) {
        screenRef.current.style.opacity = String(clamp01((lidT - 0.42) / 0.3));
      }
      if (glareRef.current) {
        const sweep = Math.sin(lidT * Math.PI);
        glareRef.current.style.opacity = String(0.05 + sweep * 0.45);
        glareRef.current.style.transform = `translateX(${lerp(-26, 26, lidT)}%)`;
      }
      if (spillRef.current) {
        spillRef.current.style.opacity = String(clamp01((lidT - 0.45) / 0.3) * 0.6);
      }
      if (shadowRef.current) {
        shadowRef.current.style.opacity = String(lerp(0.4, 1, lidT));
        shadowRef.current.style.transform = `translateY(${lerp(-14, 0, lidT)}px) scaleX(${lerp(0.8, 1, lidT)})`;
      }

      const scrubT = clamp01((progress - OPEN_END) / (CLOSE_START - OPEN_END));
      const frameIndex = Math.min(FRAME_COUNT - 1, Math.floor(scrubT * (FRAME_COUNT - 1)));
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

      if (panels.length) {
        const next =
          progress < OPEN_END || progress > CLOSE_START
            ? -1
            : Math.min(panels.length - 1, Math.floor(scrubT * panels.length));
        setActivePanel((c) => (c === next ? c : next));
      }
    };

    const onScroll = () => {
      if (animationFrame === null) animationFrame = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [panels.length]);

  /* ── Pointer parallax (desktop only, respects reduced motion) ── */
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
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const panel = activePanel >= 0 ? panels[activePanel] : undefined;

  return (
    <div
      ref={sectionRef}
      className="relative h-[300vh] w-full bg-[radial-gradient(circle_at_top_left,#e0f7ff,transparent_38%),radial-gradient(circle_at_top_right,#f5d0fe,transparent_30%),linear-gradient(to_bottom,#ffffff,#f8fbff)] sm:h-[380vh]"
    >
      <div
        ref={stickyRef}
        data-scene-sticky
        className="sticky top-0 flex h-[100svh] w-full items-center overflow-hidden"
      >
        <div className="absolute left-1/2 top-16 h-48 w-48 -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-200/40 via-violet-200/40 to-rose-200/40 blur-3xl sm:h-72 sm:w-72" />

        <div className="mx-auto grid w-full max-w-7xl items-center gap-6 px-4 py-8 sm:gap-10 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="relative text-center lg:text-left">{children}</div>

          {/* ── 3D stage ────────────────────────────────── */}
          <div
            ref={stageRef}
            className="relative mx-auto w-full max-w-[420px] sm:max-w-[500px] lg:max-w-[580px]"
            style={{ perspective: "1700px", perspectiveOrigin: "50% 62%" }}
          >
            <div
              ref={machineRef}
              className="relative will-change-transform"
              style={{
                transformStyle: "preserve-3d",
                transform: `rotateX(${SCENE_TILT_SHUT}deg) translateZ(-40px)`,
                transition: "none",
              }}
            >
              {/* Lid — hinges on its bottom edge */}
              <div
                ref={lidRef}
                className="relative origin-bottom will-change-transform"
                style={{
                  transformStyle: "preserve-3d",
                  transform: `rotateX(${LID_SHUT}deg)`,
                  clipPath: "inset(100% 0 0 0)",
                }}
              >
                {/* Aluminium back — visible while the lid is angled away */}
                <div
                  className="absolute inset-0 rounded-t-[15px] rounded-b-[3px] sm:rounded-t-[19px]"
                  style={{
                    transform: "translateZ(-9px)",
                    background:
                      "linear-gradient(168deg,#eaeaee 0%,#d4d4d9 30%,#bcbcc3 62%,#d8d8dd 100%)",
                    boxShadow: "inset 0 -3px 8px rgba(0,0,0,.2)",
                  }}
                />

                <div className="relative overflow-hidden rounded-t-[15px] rounded-b-[3px] border-[8px] border-b-[15px] border-[#0f0f12] bg-[#0f0f12] shadow-[0_30px_60px_-12px_rgba(15,23,42,.45)] sm:rounded-t-[19px] sm:border-[10px] sm:border-b-[19px]">
                  <div className="absolute left-1/2 top-[4px] z-20 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-[#28282e]" />

                  {/* Screen — 16:9, exactly matching the source */}
                  <div className="relative aspect-video overflow-hidden rounded-[2px] bg-[#08080a]">
                    <div ref={screenRef} className="h-full w-full" style={{ opacity: 0 }}>
                      <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />

                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_54%,rgba(0,0,0,.34)_100%)]" />

                      {panel ? (
                        <>
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                          <div
                            key={activePanel}
                            className="pointer-events-none absolute inset-x-0 bottom-0 animate-[fadeUp_.4s_ease-out] p-3 sm:p-4"
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 via-violet-600 to-rose-500 text-[9px] font-black text-white sm:h-9 sm:w-9 sm:text-[11px]">
                                {String(activePanel + 1).padStart(2, "0")}
                              </div>
                              <div className="min-w-0 pt-0.5">
                                <p className="truncate text-[11px] font-black text-white drop-shadow sm:text-base">
                                  {panel.title}
                                </p>
                                {panel.desc ? (
                                  <p className="mt-0.5 line-clamp-2 text-[9px] leading-snug text-white/70 drop-shadow sm:text-xs">
                                    {panel.desc}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : null}

                      {panels.length && panel ? (
                        <div className="pointer-events-none absolute right-2.5 top-2.5 rounded-full bg-black/45 px-2 py-0.5 text-[8px] font-black text-white/85 backdrop-blur sm:text-[10px]">
                          {String(activePanel + 1).padStart(2, "0")}
                          <span className="text-white/40">
                            {" "}/ {String(panels.length).padStart(2, "0")}
                          </span>
                        </div>
                      ) : null}

                      {progressPct < 100 ? (
                        <div className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-black/45 px-2 py-0.5 text-[8px] font-black text-white/50 backdrop-blur sm:text-[9px]">
                          {progressPct}%
                        </div>
                      ) : null}
                    </div>

                    <div
                      ref={glareRef}
                      className="pointer-events-none absolute -inset-y-10 -inset-x-1/4 will-change-transform"
                      style={{
                        opacity: 0.05,
                        background:
                          "linear-gradient(102deg,transparent 34%,rgba(255,255,255,.13) 45%,rgba(255,255,255,.26) 50%,rgba(255,255,255,.10) 56%,transparent 67%)",
                      }}
                    />

                    {loadError ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#08080a] px-6 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">
                          Frame not found
                        </p>
                        <p className="break-all font-mono text-[9px] text-white/45">{loadError}</p>
                      </div>
                    ) : null}

                    {!firstPainted && !loadError && loaderLabel ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-6 text-center">
                        <div className="h-[3px] w-32 overflow-hidden rounded-full bg-white/15 sm:w-44">
                          <span className="block h-full w-1/3 animate-pulse rounded-full bg-gradient-to-r from-sky-400 via-violet-400 to-rose-400" />
                        </div>
                        <p className="text-[9px] uppercase tracking-[0.25em] text-white/35">
                          {loaderLabel}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Hinge barrel */}
              <div
                className="relative mx-auto h-[7px] w-[96%] rounded-full sm:h-[8px]"
                style={{
                  transform: "translateZ(2px)",
                  background: "linear-gradient(180deg,#3c3c42,#1c1c20 42%,#4e4e56)",
                  boxShadow: "0 1px 3px rgba(0,0,0,.45)",
                }}
              />

              {/* Keyboard deck — laid back into the scene */}
              <div
                className="relative mx-auto w-[100%] origin-top will-change-transform"
                style={{ transform: `rotateX(${DECK_LAY}deg)`, transformStyle: "preserve-3d" }}
              >
                <div
                  className="relative h-[150px] w-full sm:h-[190px]"
                  style={{
                    background:
                      "linear-gradient(180deg,#dcdce1 0%,#e9e9ed 12%,#d6d6dc 48%,#c2c2c9 78%,#aeaeb6 100%)",
                    borderRadius: "3px 3px 16px 16px",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,.85)",
                  }}
                >
                  {/* Screen light spilling forward onto the deck */}
                  <div
                    ref={spillRef}
                    className="pointer-events-none absolute inset-x-[5%] top-0 h-[55%]"
                    style={{
                      opacity: 0,
                      background: "linear-gradient(180deg,rgba(180,214,255,.95),transparent)",
                      filter: "blur(10px)",
                    }}
                  />

                  {/* Speaker grilles */}
                  <div className="absolute left-[5%] top-[5%] h-[22%] w-[11%] rounded-sm bg-[#b8b8c0] opacity-70" />
                  <div className="absolute right-[5%] top-[5%] h-[22%] w-[11%] rounded-sm bg-[#b8b8c0] opacity-70" />

                  {/* Keyboard well */}
                  <div
                    className="absolute inset-x-[18%] top-[5%] h-[40%] rounded-[4px]"
                    style={{
                      background: "linear-gradient(180deg,#7e7e86,#9a9aa2)",
                      boxShadow: "inset 0 2px 5px rgba(0,0,0,.4)",
                    }}
                  >
                    <div className="grid h-full grid-rows-5 gap-[2px] p-[3px]">
                      {[14, 14, 13, 12, 8].map((n, r) => (
                        <div key={r} className="flex gap-[2px]">
                          {Array.from({ length: n }).map((_, c) => (
                            <div
                              key={c}
                              className="flex-1 rounded-[1.5px] bg-[#26262c]"
                              style={{ boxShadow: "0 .5px 0 rgba(255,255,255,.18)" }}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trackpad */}
                  <div
                    className="absolute inset-x-[33%] top-[52%] h-[34%] rounded-[5px]"
                    style={{
                      background: "linear-gradient(180deg,#cfcfd6,#dedee3)",
                      boxShadow: "inset 0 1px 3px rgba(0,0,0,.22)",
                    }}
                  />

                  {/* Front lip notch */}
                  <div className="absolute inset-x-[43%] bottom-0 h-[4px] rounded-t-full bg-[#a4a4ac]" />
                </div>
              </div>
            </div>

            {/* Contact shadow on the floor */}
            <div
              ref={shadowRef}
              className="mx-auto h-10 w-[92%] rounded-[50%] bg-slate-900/25 blur-[26px] will-change-transform"
              style={{ opacity: 0.4, transform: "translateY(-14px) scaleX(0.8)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}