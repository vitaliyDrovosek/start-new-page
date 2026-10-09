class Hue {
    constructor(app) {
        this.app = app;
        this.slider = null;
        this.valueLabel = null;
        this.rgbButton = null;
        this.brightnessSlider = null;
        this.brightnessLabel = null;
        this.opacitySlider = null;
        this.opacityLabel = null;
        this.rgbMode = false;
        this.currentHue = 220;
        this.currentBrightness = 60;
        this.currentOpacity = 100;
    }

    init() {
        this.slider = document.getElementById('hueSlider');
        this.valueLabel = document.getElementById('hueValue');
        this.rgbButton = document.getElementById('rgbModeBtn');
        this.brightnessSlider = document.getElementById('brightnessSlider');
        this.brightnessLabel = document.getElementById('brightnessValue');
        this.opacitySlider = document.getElementById('opacitySlider');
        this.opacityLabel = document.getElementById('opacityValue');

        this.currentHue = this.app.data.hue ?? 220;
        this.currentBrightness = this.app.data.brightness ?? 60;
        this.currentOpacity = this.app.data.uiOpacity ?? 100;

        if (this.slider) {
            this.slider.value = this.currentHue;
            this.slider.addEventListener('input', (e) => {
                this.currentHue = parseInt(e.target.value);
                this.app.data.hue = this.currentHue;
                this.applyAll();
                if (this.app.storage) this.app.storage.save();
                this.app.achievements?.trackHueChange();
            });
        }

        if (this.brightnessSlider) {
            this.brightnessSlider.value = this.currentBrightness;
            this.brightnessSlider.addEventListener('input', (e) => {
                this.currentBrightness = parseInt(e.target.value);
                this.app.data.brightness = this.currentBrightness;
                this.applyAll();
                if (this.app.storage) this.app.storage.save();
            });
        }

        if (this.opacitySlider) {
            this.opacitySlider.value = this.currentOpacity;
            this.opacitySlider.addEventListener('input', (e) => {
                this.currentOpacity = parseInt(e.target.value);
                this.app.data.uiOpacity = this.currentOpacity;
                this.applyAll();
                if (this.app.storage) this.app.storage.save();
            });
        }

        if (this.rgbButton) {
            this.rgbButton.addEventListener('click', () => this.toggleRgbMode());
        }

        this.applyAll();

        const savedRgbMode = this.app.data.rgbMode ?? false;
        if (savedRgbMode && !this.rgbMode) {
            this.toggleRgbMode();
        } else {
            this.updateRgbButton();
        }
    }

    toggleRgbMode() {
        this.rgbMode = !this.rgbMode;
        document.body.classList.toggle('rgb-mode', this.rgbMode);

        if (this.rgbMode) {
            if (this.app.glow) this.app.glow.startRgbLoop();
        } else {
            if (this.app.glow) this.app.glow.stopRgbLoop();
        }

        this.updateRgbButton();

        this.app.data.rgbMode = this.rgbMode;
        if (this.app.storage) this.app.storage.save();

        if (this.rgbMode) this.app.achievements?.trackRgbMode();
    }

    updateRgbButton() {
        if (!this.rgbButton) return;
        this.rgbButton.classList.toggle('active', this.rgbMode);
        this.rgbButton.textContent = this.rgbMode ? 'RGB: ВКЛ' : 'RGB';
    }

    applyAll() {
        const hue = ((this.currentHue % 360) + 360) % 360;
        const brightness = this.currentBrightness;
        const opacity = this.currentOpacity;

        const bFactor = 0.5 + (brightness / 100) * 0.7;

        const root = document.documentElement;

        const accent = this.hsl(hue, 75, 60 * bFactor);
        const accentHover = this.hsl(hue, 80, 68 * bFactor);
        const accentRgb = this.hslToRgbStr(hue, 75, 60 * bFactor);

        const accentSoft = this.hsl(hue, 45, 65 * bFactor);
        const accentSoftRgb = this.hslToRgbStr(hue, 45, 65 * bFactor);

        const accentDeep = this.hsl(hue, 60, 40 * bFactor);
        const accentDeepRgb = this.hslToRgbStr(hue, 60, 40 * bFactor);

        const accentBright = this.hsl(hue, 90, 70 * bFactor);
        const accentBrightRgb = this.hslToRgbStr(hue, 90, 70 * bFactor);

        const accentDark = this.hsl(hue, 50, 25 * bFactor);
        const accentDarkRgb = this.hslToRgbStr(hue, 50, 25 * bFactor);

        const accentMuted = this.hsl(hue, 35, 50 * bFactor);
        const accentMutedRgb = this.hslToRgbStr(hue, 35, 50 * bFactor);

        root.style.setProperty('--accent', accent);
        root.style.setProperty('--accent-hover', accentHover);
        root.style.setProperty('--accent-rgb', accentRgb);

        root.style.setProperty('--accent-soft', accentSoft);
        root.style.setProperty('--accent-soft-rgb', accentSoftRgb);

        root.style.setProperty('--accent-deep', accentDeep);
        root.style.setProperty('--accent-deep-rgb', accentDeepRgb);

        root.style.setProperty('--accent-bright', accentBright);
        root.style.setProperty('--accent-bright-rgb', accentBrightRgb);

        root.style.setProperty('--accent-dark', accentDark);
        root.style.setProperty('--accent-dark-rgb', accentDarkRgb);

        root.style.setProperty('--accent-muted', accentMuted);
        root.style.setProperty('--accent-muted-rgb', accentMutedRgb);

        // Инвертированный акцент
        const invertHue = (hue + 180) % 360;
        const accentInvert = this.hsl(invertHue, 70, 60 * bFactor);
        const accentInvertRgb = this.hslToRgbStr(invertHue, 70, 60 * bFactor);

        root.style.setProperty('--accent-invert', accentInvert);
        root.style.setProperty('--accent-invert-rgb', accentInvertRgb);

        root.style.setProperty('--ui-brightness', brightness / 100);
        root.style.setProperty('--ui-opacity', opacity / 100);

        if (this.valueLabel) this.valueLabel.textContent = hue + '°';
        if (this.brightnessLabel) this.brightnessLabel.textContent = brightness + '%';
        if (this.opacityLabel) this.opacityLabel.textContent = opacity + '%';

        if (this.slider) {
            const l = Math.round(60 * bFactor);
            this.slider.style.background = `linear-gradient(to right,
                hsl(0, 80%, ${l}%),
                hsl(60, 80%, ${l}%),
                hsl(120, 80%, ${l}%),
                hsl(180, 80%, ${l}%),
                hsl(240, 80%, ${l}%),
                hsl(300, 80%, ${l}%),
                hsl(360, 80%, ${l}%))`;
        }

        document.querySelector('meta[name="theme-color"]')
            ?.setAttribute('content', this.hsl(hue, 20, 8));

        if (this.app.glow) this.app.glow.applyPalette();
    }

    apply(hue) {
        if (hue !== undefined) this.currentHue = hue;
        this.applyAll();
    }

    applyBrightness(value) {
        this.currentBrightness = Math.max(0, Math.min(100, value));
        this.applyAll();
    }

    applyOpacity(value) {
        this.currentOpacity = Math.max(0, Math.min(100, value));
        this.applyAll();
    }

    hsl(h, s, l, a = 1) {
        return a === 1
            ? `hsl(${h}, ${s}%, ${l}%)`
            : `hsla(${h}, ${s}%, ${l}%, ${a})`;
    }

    hslToRgbStr(h, s, l) {
        s /= 100;
        l /= 100;

        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

        return `${Math.round(f(0) * 255)}, ${Math.round(f(8) * 255)}, ${Math.round(f(4) * 255)}`;
    }
}

export default Hue;