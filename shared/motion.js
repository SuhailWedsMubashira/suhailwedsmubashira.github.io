const REDUCED_MOTION = matchMedia("(prefers-reduced-motion: reduce)").matches;

function primeLineDrawings() {
  document.querySelectorAll("svg[data-draw]").forEach((svg) => {
    svg.querySelectorAll("path, circle, rect, ellipse, line, polyline").forEach((shape) => {
      const style = getComputedStyle(shape);
      if (style.stroke !== "none" && typeof shape.getTotalLength === "function") {
        const length = shape.getTotalLength();
        shape.style.strokeDasharray = `${length}`;
        shape.style.strokeDashoffset = `${length}`;
        shape.dataset.drawKind = "stroke";
      } else {
        shape.style.opacity = "0";
        shape.dataset.drawKind = "fade";
      }
    });
  });
}

function playLineDrawings() {
  document.querySelectorAll("svg[data-draw]").forEach((svg) => {
    const duration = Number(svg.dataset.draw) || 1800;
    const delay = Number(svg.dataset.drawDelay) || 0;
    svg.querySelectorAll("[data-draw-kind]").forEach((shape, i) => {
      const stagger = delay + i * 90;
      if (shape.dataset.drawKind === "stroke") {
        shape.style.transition = `stroke-dashoffset ${duration}ms cubic-bezier(.6,.1,.3,1) ${stagger}ms`;
        shape.style.strokeDashoffset = "0";
      } else {
        shape.style.transition = `opacity 900ms ease ${delay + duration * 0.7}ms`;
        shape.style.opacity = "";
      }
    });
  });
}

function startParticles(canvas) {
  const ctx = canvas.getContext("2d");
  const petals = canvas.dataset.kind === "petals";
  const colors = (canvas.dataset.colors || "#d6b26e").split(",");
  let width = 0;
  let height = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener("resize", resize);

  const spawn = (anywhere) => ({
    x: Math.random() * width,
    y: anywhere ? Math.random() * height : petals ? -20 : height + 10,
    size: petals ? 5 + Math.random() * 5 : 0.6 + Math.random() * 1.6,
    vy: petals ? 0.35 + Math.random() * 0.45 : -(0.12 + Math.random() * 0.3),
    vx: (Math.random() - 0.5) * 0.3,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.02,
    phase: Math.random() * Math.PI * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
  });
  const count = petals ? (width < 600 ? 14 : 22) : width < 600 ? 34 : 56;
  const particles = Array.from({ length: count }, () => spawn(true));

  const drawPetal = (p) => {
    const r = p.size;
    ctx.scale(Math.cos(p.phase * 1.6), 1);
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.bezierCurveTo(r, -r * 0.6, r * 0.8, r * 0.8, 0, r);
    ctx.bezierCurveTo(-r * 0.8, r * 0.8, -r, -r * 0.6, 0, -r);
    ctx.fill();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(-r * 0.2, -r * 0.2, r * 0.35, r * 0.18, 0.4, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawMote = (p) => {
    ctx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(p.phase * 2));
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    ctx.fill();
  };

  let running = true;
  const frame = () => {
    if (!running) return;
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      p.phase += 0.01;
      p.x += p.vx + Math.sin(p.phase) * (petals ? 0.55 : 0.15);
      p.y += p.vy;
      p.rot += p.vr;
      if (petals ? p.y > height + 20 : p.y < -10) Object.assign(p, spawn(false));
      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (petals) drawPetal(p); else drawMote(p);
      ctx.restore();
    }
    requestAnimationFrame(frame);
  };
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) requestAnimationFrame(frame);
  });
  canvas.classList.add("live");
  requestAnimationFrame(frame);
}

function trackSheen() {
  const root = document.documentElement.style;
  const set = (x, y) => {
    root.setProperty("--mx", `${Math.max(0, Math.min(100, x))}%`);
    root.setProperty("--my", `${Math.max(0, Math.min(100, y))}%`);
  };
  let touched = false;
  addEventListener("pointermove", (e) => {
    touched = true;
    set((e.clientX / innerWidth) * 100, (e.clientY / innerHeight) * 100);
  }, { passive: true });
  addEventListener("deviceorientation", (e) => {
    if (e.gamma == null) return;
    touched = true;
    set(50 + e.gamma * 1.6, 30 + (e.beta - 40) * 1.2);
  });
  const drift = (t) => {
    if (touched) return;
    set(50 + Math.sin(t / 2600) * 35, 30 + Math.cos(t / 3400) * 20);
    requestAnimationFrame(drift);
  };
  requestAnimationFrame(drift);
}

let begun = false;
function beginMotion() {
  if (begun) return;
  begun = true;
  playLineDrawings();
  const canvas = document.getElementById("fx");
  if (canvas) startParticles(canvas);
  trackSheen();
}

if (!REDUCED_MOTION) {
  primeLineDrawings();
  if (document.body.classList.contains("locked")) {
    document.addEventListener("invite:open", beginMotion, { once: true });
  } else {
    beginMotion();
  }
}
