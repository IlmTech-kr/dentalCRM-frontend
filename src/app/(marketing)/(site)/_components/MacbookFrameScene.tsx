"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { createStudioEnvironment } from "./three/studio-environment.js";
import { buildMacBook, FINISHES } from "./three/macbook-model.js";

/* ── Frame Manifest (same sequence as the old CSS scene) ───── */

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

/* ── Hinge ─────────────────────────────────────────────────── */

/* The model's convention: lid.rotation.x = (90 - deg) * PI/180,
 * so 0deg = shut flat on the deck, ~112deg = comfortably open. */
const LID_OPEN_DEG = 99;

/* Product-shot look = long lens: narrow FOV, camera further back.
 * A wide FOV up close splays the near corners and instantly reads
 * as CG instead of an Apple-style photo. */
const CAMERA_FOV = 18;

/* Screen panel is 16:10 — the offscreen canvas the frames are
 * composited into before being uploaded as the display texture. */
const SCREEN_W = 1536;
const SCREEN_H = 960;

/* ── Helpers ───────────────────────────────────────────────── */

function getFramePath(index: number) {
  return `/frames/${FILE_PREFIX}${String(index + FIRST_FRAME).padStart(
    PAD,
    "0"
  )}${FILE_EXT}`;
}

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const lerp = (start: number, end: number, progress: number) =>
  start + (end - start) * progress;
const easeCubicHinge = (progress: number) => 1 - Math.pow(1 - progress, 3.2);

/* ── Types ─────────────────────────────────────────────────── */

type ScenePanel = {
  title: string;
  desc?: string;
};

/* ── In-screen caption (drawn straight into the display texture) ── */

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && line && !lines.includes(line)) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, "") + "…";
  }
  return lines;
}

function drawPanelOverlay(
  ctx: CanvasRenderingContext2D,
  index: number,
  panel: ScenePanel
) {
  /* Bottom gradient, same as the CSS original. */
  const grad = ctx.createLinearGradient(0, SCREEN_H, 0, SCREEN_H * 0.5);
  grad.addColorStop(0, "rgba(0,0,0,0.9)");
  grad.addColorStop(0.55, "rgba(0,0,0,0.4)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, SCREEN_H * 0.5, SCREEN_W, SCREEN_H * 0.5);

  const pad = 52;
  const badge = 68;
  const badgeY = SCREEN_H - pad - badge;

  /* Numbered badge with the sky→violet→rose gradient. */
  const bg = ctx.createLinearGradient(pad, badgeY, pad + badge, badgeY + badge);
  bg.addColorStop(0, "#0ea5e9");
  bg.addColorStop(0.5, "#7c3aed");
  bg.addColorStop(1, "#f43f5e");
  roundRectPath(ctx, pad, badgeY, badge, badge, 14);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 26px ${FONT_STACK}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(index + 1).padStart(2, "0"), pad + badge / 2, badgeY + badge / 2 + 1);

  /* Title + description. */
  const textX = pad + badge + 26;
  const textW = SCREEN_W - textX - pad;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#ffffff";
  ctx.font = `600 34px ${FONT_STACK}`;
  let title = panel.title;
  while (title.length > 1 && ctx.measureText(title).width > textW) {
    title = title.slice(0, -2) + "…";
  }
  ctx.fillText(title, textX, badgeY + 30);

  if (panel.desc) {
    ctx.fillStyle = "#d4d4d8";
    ctx.font = `400 24px ${FONT_STACK}`;
    const lines = wrapLines(ctx, panel.desc, textW, 2);
    lines.forEach((l, i) => ctx.fillText(l, textX, badgeY + 30 + 36 + i * 32));
  }
}

type Finish = keyof typeof FINISHES;

/* ── Component ─────────────────────────────────────────────── */

export default function Macbook3DScene({
  children,
  panels = [],
  loaderLabel = "INITIALIZING HARDWARE DISPLAY...",
  stageOffsetY = "-2%",
  finish = "silver",
  lidLogoUrl = "/lid-logo-mark.png",
  scrollHeightVh = 1100,
}: {
  children: ReactNode;
  panels?: ScenePanel[];
  loaderLabel?: string;
  stageOffsetY?: string;
  finish?: Finish;
  lidLogoUrl?: string | null;
  /** Total scroll length of the section in vh. Bigger = slower playback.
   *  ~1100 gives a slow, cinematic pace for 600 frames; raise for slower,
   *  lower toward 700 for snappier. */
  scrollHeightVh?: number;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);

  const lidTRef = useRef(0);
  const targetProgressRef = useRef(0);
  const smoothProgressRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const smoothPointerRef = useRef({ x: 0, y: 0 });
  const inViewRef = useRef(false);

  const imagesRef = useRef<(HTMLImageElement | null)[]>(
    new Array(FRAME_COUNT).fill(null)
  );
  const currentFrameRef = useRef(0);
  const paintedFrameRef = useRef(-1);
  const paintedScreenTRef = useRef(-1);
  const paintedPanelRef = useRef(-2);
  const panelsRef = useRef(panels);
  panelsRef.current = panels;
  const activePanelRef = useRef(-1);

  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    rig: THREE.Group;
    lid: THREE.Group;
    ground: THREE.Mesh<THREE.PlaneGeometry, THREE.ShadowMaterial>;
    screenCanvas: HTMLCanvasElement;
    screenCtx: CanvasRenderingContext2D;
    screenTex: THREE.CanvasTexture;
    displayMat: THREE.MeshStandardMaterial;
    envTex: THREE.Texture;
    setFinish: (key: string) => void;
    dims: { W: number; D: number; BASE_H: number; SCREEN_H: number };
  } | null>(null);

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [progressPct, setProgressPct] = useState(0);

  /* ── Build the three.js scene once ────────────────────────── */

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    const scene = new THREE.Scene();

    /* Studio environment — angled softboxes against a mid-gray surround.
     * This, not the lights, is what the aluminium "looks like".
     * scene.background stays unset so the page gradient shows through. */
    const envTex = createStudioEnvironment(renderer);
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.01, 20);

    /* With the env map carrying the base illumination, direct lights
     * only shape the contact shadow and add a hint of warmth. */
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(0.4, 0.9, 0.6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0002;
    key.shadow.radius = 6;
    const span = 0.35;
    key.shadow.camera.left = -span;
    key.shadow.camera.right = span;
    key.shadow.camera.top = span;
    key.shadow.camera.bottom = -span;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xfff4e6, 0.25);
    fill.position.set(-0.6, 0.35, -0.5);
    scene.add(fill);

    /* Contact shadow under the machine. */
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 4),
      new THREE.ShadowMaterial({ opacity: 0.16 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.0012;
    ground.receiveShadow = true;
    scene.add(ground);

    /* The machine itself. */
    const mac = buildMacBook({ logoUrl: lidLogoUrl });
    mac.setFinish(finish);
    mac.root.traverse((o: THREE.Object3D) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });

    const rig = new THREE.Group();
    rig.add(mac.root);
    scene.add(rig);

    /* Screen: frames are composited into this canvas, uploaded as
     * an emissive texture so the panel glows instead of being lit. */
    const screenCanvas = document.createElement("canvas");
    screenCanvas.width = SCREEN_W;
    screenCanvas.height = SCREEN_H;
    const screenCtx = screenCanvas.getContext("2d")!;
    screenCtx.fillStyle = "#020203";
    screenCtx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    const screenTex = new THREE.CanvasTexture(screenCanvas);
    screenTex.colorSpace = THREE.SRGBColorSpace;
    screenTex.anisotropy = 8;

    const displayMat = mac.materials.display as THREE.MeshStandardMaterial;
    displayMat.map = screenTex;
    displayMat.emissiveMap = screenTex;
    displayMat.color.setHex(0x0a0a0c);
    displayMat.emissive.setHex(0xffffff);
    displayMat.emissiveIntensity = 0;
    displayMat.needsUpdate = true;

    threeRef.current = {
      renderer,
      scene,
      camera,
      rig,
      lid: mac.lid,
      ground,
      screenCanvas,
      screenCtx,
      screenTex,
      displayMat,
      envTex,
      setFinish: mac.setFinish,
      dims: mac.dims,
    };

    /* Frame the camera so the machine fits the mount at any aspect. */
    const fit = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;

      const halfFov = (camera.fov * Math.PI) / 360;
      const targetW = mac.dims.W * 1.08;
      const targetH = (mac.dims.SCREEN_H + mac.dims.BASE_H) * 1.18;
      const distW = targetW / 2 / (Math.tan(halfFov) * camera.aspect);
      const distH = targetH / 2 / Math.tan(halfFov);
      camDistRef.current = Math.max(distW, distH);

      camera.updateProjectionMatrix();
      renderNow();
    };

    const ro = new ResizeObserver(fit);
    ro.observe(mount);
    fit();
    setReady(true);

    return () => {
      ro.disconnect();
      renderer.setAnimationLoop(null);
      screenTex.dispose();
      envTex.dispose();
      scene.environment = null;
      scene.traverse((o: THREE.Object3D) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) m.geometry?.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
      threeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Finish can change live without rebuilding the scene. */
  useEffect(() => {
    threeRef.current?.setFinish(finish);
  }, [finish]);

  /* ── Pose + paint ─────────────────────────────────────────── */

  const camDistRef = useRef(0.9);

  const paintScreen = () => {
    const t = threeRef.current;
    if (!t) return;

    const frameIndex = currentFrameRef.current;
    const lidT = lidTRef.current;
    const screenT = clamp01((lidT - 0.12) / 0.4);

    /* Nearest loaded frame at or before the target. */
    let paintIndex = -1;
    for (let i = frameIndex; i >= 0; i--) {
      if (imagesRef.current[i]) {
        paintIndex = i;
        break;
      }
    }

    const screenTQ = Math.round(screenT * 100);
    const panelIndex = activePanelRef.current;
    if (
      paintIndex === paintedFrameRef.current &&
      screenTQ === paintedScreenTRef.current &&
      panelIndex === paintedPanelRef.current
    ) {
      return;
    }
    paintedFrameRef.current = paintIndex;
    paintedScreenTRef.current = screenTQ;
    paintedPanelRef.current = panelIndex;

    const ctx = t.screenCtx;
    ctx.fillStyle = "#020203";
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    const image = paintIndex >= 0 ? imagesRef.current[paintIndex] : null;
    if (image && screenT > 0) {
      const scale = Math.max(
        SCREEN_W / image.naturalWidth,
        SCREEN_H / image.naturalHeight
      );
      const dw = image.naturalWidth * scale;
      const dh = image.naturalHeight * scale;
      ctx.drawImage(image, (SCREEN_W - dw) / 2, (SCREEN_H - dh) / 2, dw, dh);

      /* Caption composited into the display, like the CSS original. */
      const panel = panelIndex >= 0 ? panelsRef.current[panelIndex] : undefined;
      if (panel) drawPanelOverlay(ctx, panelIndex, panel);

      /* Screen "wakes" as the lid comes up. */
      if (screenT < 1) {
        ctx.fillStyle = `rgba(2,2,3,${1 - screenT})`;
        ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
      }
    }

    /* ACES tone mapping compresses highlights, so drive the emissive
     * a touch above 1 to keep the panel looking backlit. */
    t.displayMat.emissiveIntensity = screenT * 1.15;
    t.screenTex.needsUpdate = true;
  };

  const applyPose = () => {
    const t = threeRef.current;
    if (!t) return;

    const lidT = lidTRef.current;
    const p = smoothPointerRef.current;

    /* Hinge. */
    const deg = lerp(0, LID_OPEN_DEG, lidT);
    t.lid.rotation.x = ((90 - deg) * Math.PI) / 180;

    /* Parallax on the machine itself. */
    t.rig.rotation.y = p.x * 0.11;
    t.rig.rotation.x = p.y * 0.05;
    t.rig.position.y = lerp(0.008, 0, lidT);

    /* Camera: looking down at the shut lid, easing to eye level.
     * Height is proportional to distance so the view *angle* stays the
     * same regardless of FOV / fitted distance. */
    const dist = camDistRef.current;
    const camY = dist * lerp(0.68, 0.24, lidT);
    const lookY = lerp(0.015, 0.115, lidT);
    t.camera.position.set(0, camY, dist);
    t.camera.lookAt(0, lookY, 0);

    /* Contact shadow deepens as it opens. */
    t.ground.material.opacity = lerp(0.1, 0.22, lidT);
  };

  const renderNow = () => {
    const t = threeRef.current;
    if (!t) return;
    applyPose();
    paintScreen();
    t.renderer.render(t.scene, t.camera);
  };

  const renderNowRef = useRef(renderNow);
  renderNowRef.current = renderNow;

  /* ── Render loop (only while the section is on screen) ────── */

  useEffect(() => {
    if (!ready) return;
    const t = threeRef.current;
    const section = sectionRef.current;
    if (!t || !section) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
        t.renderer.setAnimationLoop(
          entry.isIntersecting
            ? () => {
                /* Ease the parallax toward the pointer. */
                const p = pointerRef.current;
                const s = smoothPointerRef.current;
                s.x += (p.x - s.x) * 0.08;
                s.y += (p.y - s.y) * 0.08;

                /* Ease the timeline toward the scrolled-to target. */
                const target = targetProgressRef.current;
                const smooth = smoothProgressRef.current;
                const next =
                  Math.abs(target - smooth) < 0.0004
                    ? target
                    : smooth + (target - smooth) * 0.06;
                smoothProgressRef.current = next;
                applyProgressRef.current(next);

                renderNowRef.current();
              }
            : null
        );
      },
      { rootMargin: "80px" }
    );
    io.observe(section);

    return () => {
      io.disconnect();
      t.renderer.setAnimationLoop(null);
    };
  }, [ready]);

  /* ── Load frames ──────────────────────────────────────────── */

  useEffect(() => {
    let cancelled = false;
    const firstPath = getFramePath(0);
    const firstImage = new Image();

    firstImage.onload = () => {
      if (cancelled) return;
      imagesRef.current[0] = firstImage;
      paintedFrameRef.current = -1;
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
                if (currentFrameRef.current === i) {
                  paintedFrameRef.current = -1;
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

  /* ── Scroll timeline ──────────────────────────────────────── */

  /* Turn a 0..1 section progress into lid pose, frame index, and panel. */
  const applyProgress = (progress: number) => {
    let lidT: number;

    if (progress <= OPEN_END) {
      lidT = easeCubicHinge(progress / OPEN_END);
    } else if (progress >= CLOSE_START) {
      lidT = 1 - easeCubicHinge((progress - CLOSE_START) / (1 - CLOSE_START));
    } else {
      lidT = 1;
    }

    lidTRef.current = lidT;

    /* Frame timeline. */
    let frameIndex = 0;
    if (progress <= OPEN_END) {
      frameIndex = 0;
    } else if (progress < CLOSE_START) {
      const videoProgress = (progress - OPEN_END) / (CLOSE_START - OPEN_END);
      frameIndex = Math.min(
        FRAME_COUNT - 1,
        Math.floor(videoProgress * (FRAME_COUNT - 1))
      );
    } else {
      frameIndex = FRAME_COUNT - 1;
    }
    currentFrameRef.current = frameIndex;

    /* Panels. */
    const panelList = panelsRef.current;
    if (panelList.length) {
      let next = -1;
      if (progress > OPEN_END && progress < CLOSE_START) {
        const panelProgress = (progress - OPEN_END) / (CLOSE_START - OPEN_END);
        next = Math.min(
          panelList.length - 1,
          Math.floor(panelProgress * panelList.length)
        );
      }
      activePanelRef.current = next;
    }
  };

  const applyProgressRef = useRef(applyProgress);
  applyProgressRef.current = applyProgress;

  useEffect(() => {
    let animationFrame: number | null = null;

    const update = () => {
      animationFrame = null;

      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const scrollDistance = section.offsetHeight - window.innerHeight;
      if (scrollDistance <= 0) return;

      /* Only record the target here; the render loop eases toward it,
       * so fast wheel flicks glide through frames instead of jumping. */
      targetProgressRef.current = clamp01(-rect.top / scrollDistance);

      /* When the loop is idle (off-screen scroll restore), snap + paint. */
      if (!inViewRef.current) {
        smoothProgressRef.current = targetProgressRef.current;
        applyProgressRef.current(targetProgressRef.current);
        renderNowRef.current();
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
  }, []);

  /* ── Mouse parallax ───────────────────────────────────────── */

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const onMove = (event: MouseEvent) => {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      pointerRef.current = {
        x: clamp01((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: clamp01((event.clientY - rect.top) / rect.height) * 2 - 1,
      };
    };

    const onLeave = () => {
      pointerRef.current = { x: 0, y: 0 };
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  /* ── Render ───────────────────────────────────────────────── */

  return (
    <div
      ref={sectionRef}
      style={{ height: `${scrollHeightVh}vh` }}
      className="
        relative
        w-full
        bg-[radial-gradient(circle_at_top_left,#e8f3fa,transparent_40%),radial-gradient(circle_at_top_right,#f3e8f7,transparent_35%),linear-gradient(to_bottom,#ffffff,#f5f8fc)]
      "
    >
      <div className="sticky top-0 flex h-[100svh] w-full items-center overflow-hidden">
        <div
          className="
            mx-auto grid w-full max-w-7xl items-center gap-6
            px-4 py-8 sm:gap-10 sm:px-6 lg:grid-cols-2 lg:px-8
          "
        >
          {/* Left content */}
          <div className="relative text-center lg:text-left">{children}</div>

          {/* ── MacBook 3D stage (real WebGL model) ── */}
          <div
            ref={stageRef}
            className="
              relative mx-auto aspect-[10/9] w-full
              max-w-[460px] sm:max-w-[560px] lg:max-w-[640px]
            "
            style={{ transform: `translateY(${stageOffsetY})` }}
          >
            <div ref={mountRef} className="absolute inset-0" />

            {/* Buffering badge */}
            {progressPct < 100 && !loadError && (
              <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[8px] font-medium tracking-wider text-zinc-300 backdrop-blur-md">
                BUFFERING {progressPct}%
              </div>
            )}

            {/* Loader */}
            {!ready && !loadError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-4 text-center">
                <div className="h-[2px] w-28 overflow-hidden rounded-full bg-zinc-300">
                  <span className="block h-full w-1/3 animate-pulse bg-gradient-to-r from-sky-400 via-violet-400 to-rose-400" />
                </div>
                <p className="text-[8px] tracking-[0.25em] text-zinc-500">
                  {loaderLabel}
                </p>
              </div>
            )}

            {/* Error state */}
            {loadError && (
              <div className="absolute inset-x-4 bottom-4 rounded-lg bg-black/80 p-3 text-center backdrop-blur">
                <p className="text-[9px] font-bold tracking-widest text-red-400">
                  FRAME ASSET MISSING
                </p>
                <p className="mx-auto max-w-[240px] truncate font-mono text-[8px] text-zinc-400">
                  {loadError}
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}