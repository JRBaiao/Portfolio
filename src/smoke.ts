import { find } from './dom.ts';
import { prefersReducedMotion } from './motion.ts';

// Slow, faint smoke behind the home hero, drawn by a fragment shader: layered value noise
// (fbm) warped by itself a couple of times, which is what makes it curl like smoke rather
// than drift like clouds. Kept deliberately quiet: it's a texture, not a feature.

const VERTEX_SHADER = `
attribute vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform vec2 uResolution;
uniform float uTime;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rotate = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = rotate * p * 2.0 + 17.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.y * 1.6;
  float t = uTime * 0.035;
  uv.y -= t * 1.4; // the whole field rises slowly

  vec2 q = vec2(fbm(uv + vec2(0.0, t)), fbm(uv + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(uv + 3.0 * q + vec2(1.7, 9.2) + 0.6 * t),
                fbm(uv + 3.0 * q + vec2(8.3, 2.8) - 0.4 * t));
  float density = smoothstep(0.42, 0.95, fbm(uv + 2.5 * r));

  vec3 color = mix(vec3(0.62, 0.78, 0.82), vec3(0.96), density); // faint cyan in the thin parts
  float alpha = density * 0.55;
  gl_FragColor = vec4(color * alpha, alpha);
}
`;

/** Fraction of CSS pixels actually rendered; smoke is soft, so the upscale is invisible. */
const RESOLUTION_SCALE = 0.5;
const FRAME_INTERVAL_MS = 1000 / 30;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Could not create shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`Shader failed to compile: ${gl.getShaderInfoLog(shader) ?? 'unknown error'}`);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error('Could not create shader program');
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Shader program failed to link: ${gl.getProgramInfoLog(program) ?? 'unknown error'}`);
  }
  return program;
}

export function initHeroSmoke(): void {
  const canvas = find(document, '.hero-smoke', HTMLCanvasElement);
  const gl = canvas?.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
  if (!canvas || !gl) return; // no WebGL: the hero simply has no smoke

  const program = createProgram(gl);
  gl.useProgram(program);

  // One triangle that covers the whole canvas.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const resolution = gl.getUniformLocation(program, 'uResolution');
  const time = gl.getUniformLocation(program, 'uTime');

  const resize = (): void => {
    const width = Math.max(1, Math.round(canvas.clientWidth * RESOLUTION_SCALE));
    const height = Math.max(1, Math.round(canvas.clientHeight * RESOLUTION_SCALE));
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
    gl.uniform2f(resolution, width, height);
  };

  // A random start so the smoke isn't identical on every visit.
  const startOffset = Math.random() * 1000;
  const draw = (now: number): void => {
    resize();
    gl.uniform1f(time, startOffset + now / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const reveal = (): void => canvas.classList.add('is-ready');
  if (prefersReducedMotion()) {
    draw(0);
    reveal();
    new ResizeObserver(() => draw(0)).observe(canvas);
    return;
  }

  let visible = true;
  let frame = 0;
  let lastDraw = -Infinity;
  const loop = (now: number): void => {
    frame = 0;
    if (!visible) return;
    if (now - lastDraw >= FRAME_INTERVAL_MS) {
      lastDraw = now;
      draw(now);
    }
    frame = requestAnimationFrame(loop);
  };
  const start = (): void => {
    if (visible && !frame) frame = requestAnimationFrame(loop);
  };

  // Only animate while the hero is on screen (rAF already pauses in background tabs).
  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    start();
  }).observe(canvas);

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    visible = false;
    canvas.classList.remove('is-ready');
  });

  draw(performance.now());
  reveal();
  start();
}
