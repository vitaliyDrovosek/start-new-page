class SleepToggles {
    constructor(app) {
        this.app = app;
        this.grainBtn = null;
        this.blurBtn = null;
    }

    init() {
        this.grainBtn = document.getElementById('sleepGrainBtn');
        this.blurBtn = document.getElementById('sleepBlurBtn');

        if (this.grainBtn) {
            this.grainBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.app.hud?.toggleSleepGrain();
                this.update();
            });
        }

        if (this.blurBtn) {
            this.blurBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.app.hud?.toggleSleepBlur();
                this.update();
            });
        }

        this.update();
    }

    update() {
        if (this.grainBtn) {
            const enabled = this.app.data.sleepGrainEnabled !== false;
            this.grainBtn.classList.toggle('off', !enabled);
        }
        if (this.blurBtn) {
            const enabled = this.app.data.sleepBlurEnabled !== false;
            this.blurBtn.classList.toggle('off', !enabled);
        }
    }
}

export default SleepToggles;
