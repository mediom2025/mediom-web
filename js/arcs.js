// mediom — hero art: the two arches of the logo, drawn as a moving stipple.
// Particles from different arches link only when they come close.


class ArcField {
    constructor(p, o) {
        this.p = p;
        this.o = o;
        this.build();
    }

    build() {
        const p = this.p, o = this.o;
        p.randomSeed(o.seed);
        p.noiseSeed(o.seed);
        this.time = 0;
        this.parts = [];
        for (let i = 0; i < o.count; i++) {
            const arch = i % 2;
            const shape = [];
            for (let j = 0; j < 4; j++) {
                const a = j * Math.PI / 2 + p.random(-0.38, 0.38);
                const r = p.random(0.65, 1.2);
                shape.push([Math.cos(a) * r, Math.sin(a) * r]);
            }
            this.parts.push({
                a: arch,
                t: p.random(),
                off: p.randomGaussian(0, 1),
                v: (0.00032 + p.random(0.0005)) * (arch ? -1 : 1),
                k: p.random(1000),
                gold: p.random() < o.gold,
                sz: p.random(0.75, 1.3),
                rot: p.random(Math.PI * 2),
                spin: p.random(-1, 1),
                shape,
                x: 0, y: 0, f: 0
            });
        }
    }

    // Fit the figure into a w x h box with padding.
    layout(w, h, pad) {
        const gap = this.o.gap;
        const fw = 12 + gap, fh = 15;
        this.S = Math.min((w - 2 * pad) / fw, (h - 2 * pad) / fh);
        this.cx = [8, 8 + gap];
        this.ox = w / 2 - (2 + fw / 2) * this.S;
        this.oy = h / 2 - 9.5 * this.S;
    }

    // Point on arch path at t in [0,1]: left leg up, semicircle, right leg down.
    pt(cx, t) {
        const L = 18 + 6 * Math.PI;
        let s = t * L;
        if (s < 9) return [cx - 6, 17 - s, -1, 0];
        s -= 9;
        if (s < 6 * Math.PI) {
            const th = Math.PI - s / 6, c = Math.cos(th), sn = Math.sin(th);
            return [cx + 6 * c, 8 - 6 * sn, c, -sn];
        }
        s -= 6 * Math.PI;
        return [cx + 6, 8 + s, 1, 0];
    }

    step(dt) {
        const p = this.p, o = this.o, S = this.S;
        this.time += dt;
        const T = this.time;
        for (const q of this.parts) {
            q.t += q.v * o.drift * dt * 60;
            q.t -= Math.floor(q.t);
            const [ux, uy, nx, ny] = this.pt(this.cx[q.a], q.t);
            const breathe = 1 + 0.5 * (p.noise(q.k, T * 0.12) - 0.5);
            const jit = (p.noise(q.k + 57.3, T * 0.28) - 0.5) * 0.22;
            const d = q.off * o.spread * breathe + jit;
            q.x = this.ox + (ux + nx * d) * S;
            q.y = this.oy + (uy + ny * d) * S;
            const e = Math.min(q.t, 1 - q.t);
            const u = Math.min(1, e / 0.075);
            q.f = u * u * (3 - 2 * u);
        }
    }

    draw(ctx, col, alpha) {
        const p = this.p, o = this.o, S = this.S, T = this.time;
        const link = o.link * S;
        const parts = this.parts;

        // spatial hash for cross-arch links
        const grid = new Map();
        for (let i = 0; i < parts.length; i++) {
            const q = parts[i];
            if (q.gold || q.f < 0.05) continue;
            const key = Math.floor(q.x / link) + ',' + Math.floor(q.y / link);
            let cell = grid.get(key);
            if (!cell) grid.set(key, cell = []);
            cell.push(i);
        }

        ctx.strokeStyle = col.ink;
        ctx.lineWidth = Math.max(0.8, S * 0.055);
        const used = new Uint8Array(parts.length);
        for (let i = 0; i < parts.length; i++) {
            const a = parts[i];
            if (a.gold || a.f < 0.05 || used[i] >= 2) continue;
            const gx = Math.floor(a.x / link), gy = Math.floor(a.y / link);
            for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
                const cell = grid.get((gx + dx) + ',' + (gy + dy));
                if (!cell) continue;
                for (const j of cell) {
                    if (j <= i || used[j] >= 2) continue;
                    const b = parts[j];
                    if (b.a === a.a) continue;
                    const ddx = b.x - a.x, ddy = b.y - a.y;
                    const dd = Math.sqrt(ddx * ddx + ddy * ddy);
                    if (dd >= link) continue;
                    const pulse = p.noise(i * 0.013 + j * 0.0071, T * 0.22);
                    const pv = Math.min(1, Math.max(0, (pulse - 0.42) / 0.3));
                    const w = Math.pow(1 - dd / link, 1.6) * pv * a.f * b.f;
                    if (w < 0.02) continue;
                    ctx.globalAlpha = w * 0.5 * alpha;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                    used[i]++; used[j]++;
                }
            }
        }

        // stipple
        ctx.fillStyle = col.ink;
        const r = Math.max(1.6, S * 0.14);
        for (const q of parts) {
            if (q.gold) continue;
            ctx.globalAlpha = q.f * 0.82 * alpha;
            ctx.beginPath();
            ctx.arc(q.x, q.y, r * q.sz, 0, Math.PI * 2);
            ctx.fill();
        }

        // leaf
        ctx.fillStyle = col.gold;
        for (const q of parts) {
            if (!q.gold) continue;
            const s = S * 0.42 * q.sz, ang = q.rot + T * 0.12 * q.spin;
            const c = Math.cos(ang), sn = Math.sin(ang);
            ctx.globalAlpha = q.f * 0.92 * alpha;
            ctx.beginPath();
            q.shape.forEach(([vx, vy], n) => {
                const X = q.x + (vx * c - vy * sn) * s, Y = q.y + (vx * sn + vy * c) * s;
                n ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
            });
            ctx.closePath();
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}

(function () {
  const host = document.getElementById('hero-art');
  if (!host || !window.p5) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const opts = { seed: 827, count: 620, spread: 0.5, drift: 1, link: 3.6, gold: 0.01, gap: 8 };
  new p5(function (p) {
    let field;
    const size = () => [host.clientWidth, host.clientHeight];
    p.setup = function () {
      const [w, h] = size();
      p.createCanvas(w, h).parent(host);
      p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
      field = new ArcField(p, opts);
      field.layout(w, h, w * 0.08);
      field.step(0);
      // advance a little so the first frame already shows links
      for (let i = 0; i < 90; i++) field.step(1 / 60);
      if (reduce) { p.noLoop(); return; }
      // stop drawing while the hero is scrolled out of view
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([e]) => { e.isIntersecting ? p.loop() : p.noLoop(); }).observe(host);
      }
    };
    p.draw = function () {
      p.clear();
      if (!reduce) field.step(1 / 60);
      field.draw(p.drawingContext, { ink: '#114136', gold: '#b08a45' }, 1);
    };
    p.windowResized = function () {
      const [w, h] = size();
      p.resizeCanvas(w, h);
      field.layout(w, h, w * 0.08);
      field.step(0);
      if (reduce) p.redraw();
    };
  });
})();
