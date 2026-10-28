class Aim {
    constructor(app) {
        this.app = app;
        this.overlay = null;
        this.field = null;
        this.hud = null;
        this.resultScreen = null;

        // Кэш DOM-узлов HUD (найдём один раз в init)
        this.counterEl = null;
        this.missesEl = null;
        this.avgEl = null;
        this.bestEl = null;
        this.hitEl = null;
        this.missesResultEl = null;
        this.recordEl = null;
        this.dropdownBestEl = null;

        this.TOTAL_TARGETS = 30;
        this.TARGET_LIFETIME = 2000;
        this.PENALTY_MISS = 0.5;
        this.START_DELAY = 1000;
        this.SPAWN_DELAY = 100;
        this.FINISH_DELAY = 200;
        this.HIT_ANIM_MS = 200;   // совпадает с CSS-анимацией
        this.MISS_FLASH_MS = 400; // совпадает с CSS-анимацией
        this.FIELD_PADDING = 20;

        this.active = false;
        this.currentTarget = null;
        this.reactionTimes = [];
        this.misses = 0;
        this.targetIndex = 0;
        this.spawnTime = 0;
        this.lifetimeTimer = null;
        this.startTimer = null;

        this._isMobile = false;
        this._fieldRect = null;

        this.boundKeyHandler = this.handleKey.bind(this);
    }

    init() {
        this.overlay = document.getElementById('aimOverlay');
        this.field = document.getElementById('aimField');
        this.hud = document.getElementById('aimHud');
        this.resultScreen = document.getElementById('aimResult');

        if (!this.overlay || !this.field) return;

        // Кэш HUD-элементов
        this.counterEl       = document.getElementById('aimCounter');
        this.missesEl        = document.getElementById('aimMisses');
        this.avgEl           = document.getElementById('aimAvg');
        this.bestEl          = document.getElementById('aimBestResult');
        this.hitEl           = document.getElementById('aimHitsResult');
        this.missesResultEl  = document.getElementById('aimMissesResult');
        this.recordEl        = document.getElementById('aimRecordBadge');
        this.dropdownBestEl  = document.getElementById('aimBestIndicator');

        this.field.addEventListener('mousedown', (e) => this.handleFieldClick(e));
        this.field.addEventListener('touchstart', (e) => {
            if (!e.touches.length) return;
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
        if (e.key === 'Escape') this.close();
    }

    start() {
        this.stop();

        this.active = true;
        this.reactionTimes = [];
        this.misses = 0;
        this.targetIndex = 0;

        this.field.replaceChildren();
        this.resultScreen?.classList.remove('visible');
        this.hud?.classList.add('visible');

        // Кэш размеров поля и режима — на всё время партии
        this._isMobile = window.matchMedia('(max-width: 768px)').matches;
        this._fieldRect = this.field.getBoundingClientRect();

        this.updateHud();

        this.startTimer = setTimeout(() => this.spawnTarget(), this.START_DELAY);
    }

    stop() {
        this.active = false;
        clearTimeout(this.lifetimeTimer);
        clearTimeout(this.startTimer);
        this.lifetimeTimer = null;
        this.startTimer = null;
        this.currentTarget = null;
        if (this.field) this.field.replaceChildren();
    }

    spawnTarget() {
        if (!this.active) return;

        if (this.currentTarget) {
            this.currentTarget.remove();
            this.currentTarget = null;
        }

        const rect = this._fieldRect || this.field.getBoundingClientRect();
        const size = this._isMobile ? 80 : 60;
        const pad = this.FIELD_PADDING;

        const maxX = Math.max(0, rect.width  - size - pad * 2);
        const maxY = Math.max(0, rect.height - size - pad * 2);

        const x = pad + Math.random() * maxX;
        const y = pad + Math.random() * maxY;

        const target = document.createElement('div');
        target.className = 'aim-target';
        target.style.left   = x + 'px';
        target.style.top    = y + 'px';
        target.style.width  = size + 'px';
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
        setTimeout(() => t.remove(), this.HIT_ANIM_MS);
        this.currentTarget = null;

        clearTimeout(this.lifetimeTimer);
        this.lifetimeTimer = null;

        this.targetIndex++;
        this.updateHud();

        if (this.targetIndex >= this.TOTAL_TARGETS) {
            setTimeout(() => this.finish(), this.FINISH_DELAY);
        } else {
            setTimeout(() => this.spawnTarget(), this.SPAWN_DELAY);
        }
    }

    missTarget() {
        if (!this.active) return;

        this.misses++;
        this.currentTarget?.remove();
        this.currentTarget = null;

        clearTimeout(this.lifetimeTimer);
        this.lifetimeTimer = null;

        this.targetIndex++;
        this.updateHud();

        if (this.targetIndex >= this.TOTAL_TARGETS) {
            setTimeout(() => this.finish(), this.FINISH_DELAY);
        } else {
            setTimeout(() => this.spawnTarget(), this.SPAWN_DELAY);
        }
    }

    handleFieldClick(e) {
        if (!this.active) return;

        // e может быть MouseEvent или Touch. У Touch нет .target — защищаемся.
        const target = e.target;
        if (target && target.classList && target.classList.contains('aim-target')) return;

        // Если есть elementFromPoint — надёжнее на тач
        if (typeof e.clientX === 'number' && typeof e.clientY === 'number') {
            const el = document.elementFromPoint(e.clientX, e.clientY);
            if (el && el.classList.contains('aim-target')) return;
        }

        this.misses++;
        this.updateHud();

        if (typeof e.clientX !== 'number' || typeof e.clientY !== 'number') return;

        const flash = document.createElement('div');
        flash.className = 'aim-miss-flash';
        flash.style.left = e.clientX + 'px';
        flash.style.top  = e.clientY + 'px';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), this.MISS_FLASH_MS);
    }

    updateHud() {
        if (this.counterEl) this.counterEl.textContent = `${this.targetIndex} / ${this.TOTAL_TARGETS}`;
        if (this.missesEl)  this.missesEl.textContent = this.misses;
    }

    finish() {
        this.active = false;
        clearTimeout(this.lifetimeTimer);
        this.lifetimeTimer = null;

        const avg = this.reactionTimes.length
            ? this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length
            : 0;

        const avgWithPenalty = avg + this.misses * this.PENALTY_MISS;
        const prevBest = this.app.data.aimBest ?? null;
        const isNewRecord = prevBest === null || avgWithPenalty < prevBest;

        if (isNewRecord) {
            this.app.data.aimBest = avgWithPenalty;
        }

        // Счётчик игр НЕ увеличиваем здесь — этим занимается Achievements.trackAimGame(),
        // чтобы не было двойного инкремента. Просто сохраняем best.
        this.app.storage?.save();

        this.app.achievements?.trackAimGame({
            avgWithPenalty,
            misses: this.misses
        });

        if (this.avgEl)  this.avgEl.textContent  = avgWithPenalty.toFixed(3) + ' с';
        if (this.bestEl) this.bestEl.textContent = (this.app.data.aimBest).toFixed(3) + ' с';
        if (this.hitEl)  this.hitEl.textContent  = `${this.reactionTimes.length} / ${this.TOTAL_TARGETS}`;
        if (this.missesResultEl) this.missesResultEl.textContent = this.misses;

        if (this.recordEl) this.recordEl.classList.toggle('visible', isNewRecord);

        this.hud?.classList.remove('visible');
        this.resultScreen?.classList.add('visible');

        this.updateDropdownBest();
    }

    updateDropdownBest() {
        if (!this.dropdownBestEl) return;
        const best = this.app.data.aimBest;
        this.dropdownBestEl.textContent = best ? best.toFixed(3) + ' с' : '—';
    }
}

export default Aim;