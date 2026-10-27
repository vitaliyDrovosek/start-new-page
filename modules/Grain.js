class Grain {
    constructor(app) {
        this.app = app;
        this.el = null;
    }

    init() {
        this.el = document.querySelector('.grain-overlay');
        if (!this.el) {
            this.el = document.createElement('div');
            this.el.className = 'grain-overlay';
            document.body.appendChild(this.el);
        }
        this.apply();
    }

    apply() {
        const enabled = this.app.data.grainEnabled === true;
        const opacity = this.clampOpacity(this.app.data.grainOpacity ?? 5.5);

        document.body.classList.toggle('grain-enabled', enabled);
        document.documentElement.style.setProperty('--grain-opacity', (opacity / 100).toFixed(3));

        this.updateIndicator();
    }

    clampOpacity(v) {
        v = Number(v);
        if (!Number.isFinite(v)) return 5.5;
        return Math.min(30, Math.max(0, v));
    }

    toggle() {
        this.app.data.grainEnabled = !(this.app.data.grainEnabled === true);
        this.apply();
        this.app.sleepToggles?.update();
        this.app.storage.save();
    }

    setOpacity(value) {
        this.app.data.grainOpacity = this.clampOpacity(value);
        this.apply();
        this.app.storage.save();
    }

    updateIndicator() {
        const indicator = document.getElementById('grainIndicator');
        if (indicator) indicator.classList.toggle('off', this.app.data.grainEnabled !== true);

        const slider = document.getElementById('grainOpacity');
        const valEl = document.getElementById('grainOpacityValue');
        if (slider) slider.value = this.app.data.grainOpacity ?? 5.5;
        if (valEl) valEl.textContent = (this.app.data.grainOpacity ?? 5.5) + '%';
    }

    refresh() { this.apply(); }
}

export default Grain;
