import * as THREE from "three";

/**
 * Studio environment for metal products viewed from above.
 *
 * Why not RoomEnvironment: a closed laptop lid is a flat mirror facing up,
 * so it reflects exactly one region of the env map — the ceiling. Room-
 * Environment's ceiling is uniform, so the lid renders as one flat bright
 * sheet. This env instead places elongated gradient softboxes at angles
 * against a mid-gray surround, so a flat surface reflects a soft diagonal
 * gradient — the classic satin-aluminium product-shot look.
 *
 * Usage:
 *   const envTex = createStudioEnvironment(renderer);
 *   scene.environment = envTex;
 *   // cleanup: envTex.dispose()
 */
export function createStudioEnvironment(renderer) {
  const env = new THREE.Scene();

  // Neutral clean studio backdrop color
  env.background = new THREE.Color(0xdde1e5);

  /* Soft-edged white gradient so the reflections fade out smoothly. */
  const makeSoftTexture = () => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(128, 128, 4, 128, 128, 128);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.5, "rgba(255,255,255,0.9)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };
  const soft = makeSoftTexture();

  const softbox = (w, h, intensity) => {
    const mat = new THREE.MeshBasicMaterial({
      map: soft,
      transparent: true,
      side: THREE.DoubleSide,
    });
    mat.color.setScalar(intensity);
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  };

  // Primary diagonal overhead softbox (creates the signature Apple lid sheen)
  const keyBox = softbox(10, 4.0, 5.0);
  keyBox.position.set(-2.0, 5.0, 2.0);
  keyBox.lookAt(0, 0, 0);
  keyBox.rotateZ(Math.PI / 4);
  env.add(keyBox);

  // Secondary fill to soften harsh drop-offs
  const fillBox = softbox(8, 3.0, 1.5);
  fillBox.position.set(3.0, 4.0, 3.0);
  fillBox.lookAt(0, 0, 0);
  env.add(fillBox);

  /* Higher blur than default => broader, gentler gradients on the metal. */
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(env, 0.04).texture;
  pmrem.dispose();
  soft.dispose();

  return envTex;
}