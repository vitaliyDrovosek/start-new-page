class Glow {
    constructor(app) {
        this.app = app;

        
        this.balls = [
            { el: document.querySelector('.glow-ball'),        size: 600, intensity: 0.12, pulse: true,  hueShift: 0   },
            { el: document.querySelector('.glow-ball-small'),  size: 800, intensity: 0.10, pulse: true,  hueShift: 40  },
            { el: document.querySelector('.glow-ball-bottom'), size: 700, intensity: 0.14, pulse: false, hueShift: -40 }
        ].filter(b => b.el);

        this.rgbLoop = null;
    }

    randomize() {
        const zones = [
            { x: [10, 40],  y: [10, 45] },
            { x: [60, 95],  y: [10, 45] },
            { x: [30, 70],  y: [60, 95] }
        ];

        this.balls.forEach((ball, i) => {
            const zone = zones[i % zones.length];

            const startX   = this.rand(zone.x[0], zone.x[1]);
            const startY   = this.rand(zone.y[0], zone.y[1]);
            const driftX   = this.rand(-30, 30);
            const driftY   = this.rand(-30, 30);
            const duration = this.rand(18, 35);
            const size     = ball.size * this.rand(0.85, 1.2);

            const el = ball.el;
            el.style.setProperty('--start-x', startX + 'vw');
            el.style.setProperty('--start-y', startY + 'vh');
            el.style.setProperty('--drift-x', driftX + 'vw');
            el.style.setProperty('--drift-y', driftY + 'vh');
            el.style.setProperty('--drift-duration', duration + 's');
            el.style.setProperty('--size', size + 'px');
            el.style.setProperty('--intensity', ball.intensity);

            el.style.animationDelay = this.rand(0, 5) + 's';
            el.classList.toggle('glow-pulse', !!ball.pulse);
        });

        this.applyPalette();
    }

    applyPalette() {
        const root = getComputedStyle(document.documentElement);
        let baseHue = parseInt(root.getPropertyValue('--rgb-hue'), 10) || 0;
        const rgbMode = document.body.classList.contains('rgb-mode');

        if (!rgbMode) {
            baseHue = Number(this.app.data.hue);
            if (!Number.isFinite(baseHue)) baseHue = 220;
        }

        this.balls.forEach(ball => {
            const h = ((baseHue + ball.hueShift) % 360 + 360) % 360;
            const s = Math.floor(this.rand(65, 90));
            const l = Math.floor(this.rand(55, 68));
            ball.el.style.setProperty('--rgb', this.hslToRgbStr(h, s, l));
        });
    }

    startRgbLoop() {
        if (this.rgbLoop) return;
        this.rgbLoop = setInterval(() => this.applyPalette(), 200);
    }

    stopRgbLoop() {
        if (this.rgbLoop) {
            clearInterval(this.rgbLoop);
            this.rgbLoop = null;
        }
        this.applyPalette();
    }

    hslToRgbStr(h, s, l) {
        s /= 100;
        l /= 100;
        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return `${Math.round(f(0) * 255)}, ${Math.round(f(8) * 255)}, ${Math.round(f(4) * 255)}`;
    }

    rand(min, max) {
        return Math.random() * (max - min) + min;
    }
}

export default Glow;