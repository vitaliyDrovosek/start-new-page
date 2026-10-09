class Aim {
    constructor(app) {
        this.app = app;
        this.overlay = null;
        this.field = null;
        this.hud = null;
        this.resultScreen = null;

        this.TOTAL_TARGETS = 30;
        this.TARGET_LIFETIME = 2000;
        this.PENALTY_MISS = 0.5;
        this.START_DELAY = 1000;

        this.active = false;
        this.currentTarget = null;
        this.reactionTimes = [];
        this.misses = 0;
        this.targetIndex = 0;
        this.spawnTime = 0;
        this.lifetimeTimer = null;
        this.startTimer = null;

        this.boundKeyHandler = this.handleKey.bind(this);
    }

    init() {
        this.overlay = document.getElementById('aimOverlay');
        this.field = document.getElementById('aimField');
        this.hud = document.getElementById('aimHud');
        this.resultScreen = document.getElementById('aimResult');

        if (!this.overlay || !this.field) return;

        this.field.addEventListener('mousedown', (e) => this.handleFieldClick(e));
        this.field.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleFieldClick(e.touches[0]);
        }, { passive: false });

        document.getElementById('aimCloseBtn')?.addEventListener('click', () => this.close());
        document.getElementById('aimRestartBtn')?.addEventListener('click', () => this.start());
        document.getElementById('aimExitBtn')?.addEventListener('click', () => this.close());
    }

    open() {
        if (!this.overlay) return;
        this.overlay.classList.add('visible');
        document.addEventListener('keydown', this.boundKeyHandler);
        this.start();
    }

    close() {
        if (!this.overlay) return;
        this.overlay.classList.remove('visible');
        document.removeEventListener('keydown', this.boundKeyHandler);
        this.stop();
    }

    handleKey(e) {
        if (e.key === 'Escape') {
            this.close();
        }
    }

    start() {
        this.stop();

        this.active = true;
        this.reactionTimes = [];
        this.misses = 0;
        this.targetIndex = 0;

        this.field.innerHTML = '';
        this.resultScreen?.classList.remove('visible');
        this.hud?.classList.add('visible');

        this.updateHud();

        this.startTimer = setTimeout(() => this.spawnTarget(), this.START_DELAY);
    }

    stop() {
        this.active = false;
        clearTimeout(this.lifetimeTimer);
        clearTimeout(this.startTimer);
        this.currentTarget = null;
        if (this.field) this.field.innerHTML = '';
    }

    spawnTarget() {
        if (!this.active) return;

        if (this.currentTarget) this.currentTarget.remove();

        const rect = this.field.getBoundingClientRect();
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const size = isMobile ? 80 : 60;

        const maxX = rect.width - size - 20;
        const maxY = rect.height - size - 20;

        const x = 20 + Math.random() * maxX;
        const y = 20 + Math.random() * maxY;

        const target = document.createElement('div');
        target.className = 'aim-target';
        target.style.left = x + 'px';
        target.style.top = y + 'px';
        target.style.width = size + 'px';
        target.style.height = size + 'px';

        target.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.hitTarget();
        });
        target.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hitTarget();
        }, { passive: false });

        this.field.appendChild(target);
        this.currentTarget = target;
        this.spawnTime = performance.now();

        this.lifetimeTimer = setTimeout(() => {
            if (this.currentTarget === target && this.active) {
                this.missTarget();
            }
        }, this.TARGET_LIFETIME);
    }

    hitTarget() {
        if (!this.active || !this.currentTarget) return;

        const reaction = (performance.now() - this.spawnTime) / 1000;
        this.reactionTimes.push(reaction);

        const t = this.currentTarget;
        t.classList.add('hit');
        setTimeout(() => t.remove(), 150);
        this.currentTarget = null;

        clearTimeout(this.lifetimeTimer);

        this.targetIndex++;
        this.updateHud();

        if (this.targetIndex >= this.TOTAL_TARGETS) {
            setTimeout(() => this.finish(), 200);
        } else {
            setTimeout(() => this.spawnTarget(), 100);
        }
    }

    missTarget() {
        this.misses++;
        this.currentTarget?.remove();
        this.currentTarget = null;

        this.targetIndex++;
        this.updateHud();

        if (this.targetIndex >= this.TOTAL_TARGETS) {
            setTimeout(() => this.finish(), 200);
        } else {
            setTimeout(() => this.spawnTarget(), 100);
        }
    }

    handleFieldClick(e) {
        if (!this.active) return;
        if (e.target.classList.contains('aim-target')) return;

        this.misses++;
        this.updateHud();

        const flash = document.createElement('div');
        flash.className = 'aim-miss-flash';
        flash.style.left = e.clientX + 'px';
        flash.style.top = e.clientY + 'px';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 400);
    }

    updateHud() {
        if (!this.hud) return;
        const counter = document.getElementById('aimCounter');
        const missEl = document.getElementById('aimMisses');
        if (counter) counter.textContent = `${this.targetIndex} / ${this.TOTAL_TARGETS}`;
        if (missEl) missEl.textContent = this.misses;
    }

    finish() {
        this.active = false;
        clearTimeout(this.lifetimeTimer);

        const avg = this.reactionTimes.length
            ? this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length
            : 0;

        const avgWithPenalty = avg + this.misses * this.PENALTY_MISS;

        const prevBest = this.app.data.aimBest ?? null;
        const isNewRecord = prevBest === null || avgWithPenalty < prevBest;

        if (isNewRecord) {
            this.app.data.aimBest = avgWithPenalty;
        }

        this.app.data.aimGames = (this.app.data.aimGames ?? 0) + 1;
        if (this.app.storage) this.app.storage.save();

        if (this.app.achievements) {
            this.app.achievements.trackAimGame({
                avgWithPenalty,
                misses: this.misses
            });
        }

        const avgEl = document.getElementById('aimAvg');
        const bestEl = document.getElementById('aimBestResult');
        const hitEl = document.getElementById('aimHitsResult');
        const missEl = document.getElementById('aimMissesResult');
        const recordEl = document.getElementById('aimRecordBadge');

        if (avgEl) avgEl.textContent = avgWithPenalty.toFixed(3) + ' с';
        if (bestEl) bestEl.textContent = (this.app.data.aimBest).toFixed(3) + ' с';
        if (hitEl) hitEl.textContent = `${this.reactionTimes.length} / ${this.TOTAL_TARGETS}`;
        if (missEl) missEl.textContent = this.misses;

        if (recordEl) {
            recordEl.classList.toggle('visible', isNewRecord);
        }

        this.hud?.classList.remove('visible');
        this.resultScreen?.classList.add('visible');

        this.updateDropdownBest();
    }

    updateDropdownBest() {
        const el = document.getElementById('aimBestIndicator');
        if (!el) return;
        const best = this.app.data.aimBest;
        el.textContent = best ? best.toFixed(3) + ' с' : '—';
    }
}

export default Aim;