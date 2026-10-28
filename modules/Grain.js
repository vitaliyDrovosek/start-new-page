class Grain {
    constructor(app) {
        this.app = app;
        this.el = null;
        this._initialized = false;

        // Кэш DOM-элементов слайдера (чтобы не искать getElementById на каждый apply)
        this._indicator = null;
        this._slider = null;
        this._valEl = null;
    }

    init() {
        this.el = document.querySelector('.grain-overlay');
        if (!this.el) {
            this.el = document.createElement('div');
            this.el.className = 'grain-overlay';
            document.body.appendChild(this.el);
        }

        this._indicator = document.getElementById('grainIndicator');
        this._slider    = document.getElementById('grainOpacity');
        this._valEl     = document.getElementById('grainOpacityValue');

        this.apply();
    }

    _isEnabled() {
        return this.app.data.grainEnabled === true;
    }

    _getOpacity() {
        return this.clampOpacity(this.app.data.grainOpacity ?? 5.5);
    }

    clampOpacity(v) {
        v = Number(v);
        if (!Number.isFinite(v)) return 5.5;
        return Math.min(30, Math.max(0, v));
    }

    apply() {
        const enabled = this._isEnabled();
        const opacity = this._getOpacity();

        document.body.classList.toggle('grain-enabled', enabled);
        document.documentElement.style.setProperty('--grain-opacity', (opacity / 100).toFixed(3));

        this.updateIndicator();
    }

    toggle() {
        this.app.data.grainEnabled = !this._isEnabled();
        this.apply();
        this.app.storage.save();
    }

    setOpacity(value) {
        this.app.data.grainOpacity = this.clampOpacity(value);
        this.apply();
        this.app.storage.save();
    }

    updateIndicator() {
        if (this._indicator) {
            this._indicator.classList.toggle('off', !this._isEnabled());
        }

        const opacity = this._getOpacity();
        if (this._slider) {
            // не трогаем value, если пользователь как раз тянет слайдер
            if (document.activeElement !== this._slider) {
                this._slider.value = opacity;
            }
        }
        if (this._valEl) {
            this._valEl.textContent = opacity + '%';
        }
    }

    refresh() { this.apply(); }
}

export default Grain;