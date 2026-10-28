class TimeWidget {
    constructor(app) {
        this.app = app;
        this.widget = null;
        this.dragHandle = null;

        this.swDisplay = null; this.swStartBtn = null; this.swLapBtn = null;
        this.swResetBtn = null; this.swLapsList = null;
        this.swRunning = false; this.swStartTime = 0; this.swElapsed = 0;
        this.swRafId = null; this.swLaps = []; this.swLastLapTime = 0;

        this.cdDisplay = null; this.cdStartBtn = null; this.cdResetBtn = null;
        this.cdPresetsEl = null;
        this.cdRunning = false; this.cdTotal = 0; this.cdRemaining = 0;
        this.cdEndTime = 0; this.cdRafId = null; this.cdFinished = false;

        this.PRESETS = [1, 5, 10, 15, 25, 60];

        this.dragging = false; this.dragOffsetX = 0; this.dragOffsetY = 0;
        this.dragRect = null;
        this.pos = { x: 20, y: 0 };

        this.centerEl = null; this.centerSwEl = null; this.centerCdEl = null;
        this._centerVisible = false;

        this.saveInterval = null;
        this._lastSavedStateJson = '';
        this._saveIntervalMs = 2000;
        this._audioCtx = null;
        this._initialized = false;

        this.boundMouseMove = this.onDragMove.bind(this);
        this.boundMouseUp = this.onDragEnd.bind(this);
        this.boundTouchMove = this.onDragMove.bind(this);
        this.boundTouchEnd = this.onDragEnd.bind(this);
    }

    init() {
        if (this._initialized) return;
        this._initialized = true;

        this.widget = document.getElementById('timeWidget');
        if (!this.widget) return;
        this.dragHandle = document.getElementById('timeWidgetDrag');
        this.swDisplay = document.getElementById('swDisplay');
        this.swStartBtn = document.getElementById('swStartBtn');
        this.swLapBtn = document.getElementById('swLapBtn');
        this.swResetBtn = document.getElementById('swResetBtn');
        this.swLapsList = document.getElementById('swLaps');
        this.cdDisplay = document.getElementById('cdDisplay');
        this.cdStartBtn = document.getElementById('cdStartBtn');
        this.cdResetBtn = document.getElementById('cdResetBtn');
        this.cdPresetsEl = document.getElementById('cdPresets');
        this.centerEl = document.getElementById('timeCenter');
        this.centerSwEl = document.getElementById('timeCenterSw');
        this.centerCdEl = document.getElementById('timeCenterCd');

        this.swStartBtn?.addEventListener('click', () => this.swToggle());
        this.swLapBtn?.addEventListener('click', () => this.swLap());
        this.swResetBtn?.addEventListener('click', () => this.swReset());
        this.cdStartBtn?.addEventListener('click', () => this.cdToggle());
        this.cdResetBtn?.addEventListener('click', () => this.cdReset());

        this.renderPresets();
        this.restorePosition();
        this.restoreState();
        this.dragHandle?.addEventListener('mousedown', (e) => this.onDragStart(e));
        this.dragHandle?.addEventListener('touchstart', (e) => this.onDragStart(e.touches[0]), { passive: false });
        this.updateVisibility();
        this.updateIndicator();

        // Автосохранение — только когда таймер/секундомер идут
        this._refreshAutoSave();
    }

    // ---------- Автосохранение ----------

    _refreshAutoSave() {
        const need = this.isActive();
        if (need && !this.saveInterval) {
            this.saveInterval = setInterval(() => this.saveState(), this._saveIntervalMs);
        } else if (!need && this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
    }

    saveState() {
        if (!this.app?.data) return;
        if (!this.isActive()) return;

        const state = {
            swRunning: this.swRunning,
            swElapsed: this.swElapsed,
            swStartTimeAbs: this.swRunning ? Date.now() - this.swElapsed : 0,
            swLaps: this.swLaps,
            swLastLapTime: this.swLastLapTime,
            cdRunning: this.cdRunning,
            cdTotal: this.cdTotal,
            cdRemaining: this.cdRemaining,
            cdEndTimeAbs: this.cdRunning ? Date.now() + this.cdRemaining : 0,
            cdFinished: this.cdFinished
        };

        let json;
        try { json = JSON.stringify(state); } catch { return; }
        if (json === this._lastSavedStateJson) return;
        this._lastSavedStateJson = json;

        this.app.data.timeWidgetState = state;
        this.app.storage.save();
    }

    restoreState() {
        const s = this.app.data?.timeWidgetState;
        if (!s) return;

        const num = (v, def) => Number.isFinite(Number(v)) ? Number(v) : def;

        this.swLaps = Array.isArray(s.swLaps) ? s.swLaps : [];
        this.swLastLapTime = num(s.swLastLapTime, 0);

        if (s.swRunning && s.swStartTimeAbs) {
            this.swElapsed = Math.max(0, Date.now() - num(s.swStartTimeAbs, 0));
            this.swRunning = true;
            this.swStartTime = performance.now() - this.swElapsed;
            this.swTick();
            this.swUpdateButton();
        } else {
            this.swElapsed = num(s.swElapsed, 0);
            this.swRunning = false;
            this.swRender();
            this.swUpdateButton();
        }
        this.swRenderLaps();

        this.cdTotal = num(s.cdTotal, 0);
        if (s.cdRunning && s.cdEndTimeAbs) {
            const remaining = num(s.cdEndTimeAbs, 0) - Date.now();
            if (remaining > 0) {
                this.cdRemaining = remaining;
                this.cdRunning = true;
                this.cdFinished = false;
                this.cdEndTime = performance.now() + remaining;
                this.cdTick();
            } else {
                this.cdRemaining = 0;
                this.cdRunning = false;
                this.cdFinished = true;
                this.cdRender();
            }
        } else {
            this.cdRemaining = num(s.cdRemaining, 0);
            this.cdRunning = false;
            this.cdFinished = !!s.cdFinished;
            this.cdRender();
        }
        this.cdUpdateButton();
        this.updateCenter();
    }

    // ---------- Спящий режим ----------

    toggleSleepDisplay() {
        this.app.data.timeCenterInSleepEnabled = !(this.app.data.timeCenterInSleepEnabled !== false);
        this.updateSleepDisplayIndicator();
        this.app.storage.save();
        if (this.app.data.timeCenterInSleepEnabled === false) {
            this.hideCenter();
        } else if (this.isActive() && document.body.classList.contains('hud-hidden')) {
            this.renderCenter();
        }
    }

    updateSleepDisplayIndicator() {
        const indicator = document.getElementById('timeCenterSleepIndicator');
        if (indicator) {
            indicator.classList.toggle('off', this.app.data.timeCenterInSleepEnabled === false);
        }
    }

    isSwActive() { return this.swRunning || this.swElapsed > 0; }
    isCdActive() { return this.cdRunning || this.cdRemaining > 0 || this.cdFinished; }
    isActive() { return this.swRunning || this.cdRunning; }
    isSwRunning() { return this.swRunning; }
    isCdRunning() { return this.cdRunning; }

    updateVisibility() {
        if (!this.widget) return;
        this.widget.classList.toggle('visible', this.app.data.timeWidgetEnabled === true);
    }

    toggle() {
        this.app.data.timeWidgetEnabled = !this.app.data.timeWidgetEnabled;
        this.updateVisibility();
        this.updateIndicator();
        this._refreshAutoSave();
        this.app.storage.save();
    }

    updateIndicator() {
        const indicator = document.getElementById('timeWidgetIndicator');
        if (indicator) indicator.classList.toggle('off', !this.app.data.timeWidgetEnabled);
    }

    // ---------- Центр (sleep) ----------

    renderCenter() {
        if (!this.centerEl) return;
        if (this.app.data.timeCenterInSleepEnabled === false) {
            this.centerEl.classList.remove('visible');
            this._centerVisible = false;
            return;
        }
        const showSw = this.swRunning;
        const showCd = this.cdRunning;
        if (!showSw && !showCd) {
            this.centerEl.classList.remove('visible');
            this._centerVisible = false;
            return;
        }
        if (this.centerSwEl) {
            this.centerSwEl.classList.toggle('hidden', !showSw);
            this.centerSwEl.textContent = this.swFormat(this.swElapsed);
        }
        if (this.centerCdEl) {
            this.centerCdEl.classList.toggle('hidden', !showCd);
            this.centerCdEl.textContent = this.cdFormat(this.cdRemaining);
            this.centerCdEl.classList.toggle('finished', this.cdFinished);
        }
        this.centerEl.classList.add('visible');
        this._centerVisible = true;
    }

    updateCenter() {
        if (!this._centerVisible) return;
        if (this.app.data.timeCenterInSleepEnabled === false) {
            this.centerEl.classList.remove('visible');
            this._centerVisible = false;
            return;
        }
        if (this.centerSwEl && !this.centerSwEl.classList.contains('hidden'))
            this.centerSwEl.textContent = this.swFormat(this.swElapsed);
        if (this.centerCdEl && !this.centerCdEl.classList.contains('hidden')) {
            this.centerCdEl.textContent = this.cdFormat(this.cdRemaining);
            this.centerCdEl.classList.toggle('finished', this.cdFinished);
        }
    }

    hideCenter() {
        this.centerEl?.classList.remove('visible');
        this._centerVisible = false;
    }

    // ---------- Drag ----------

    onDragStart(e) {
        if (!e) return;
        e.preventDefault?.();
        const rect = this.widget.getBoundingClientRect();
        this.dragging = true;
        this.dragOffsetX = e.clientX - rect.left;
        this.dragOffsetY = e.clientY - rect.top;
        this.dragRect = { width: rect.width, height: rect.height };
        this.widget.classList.add('dragging');
        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('mouseup', this.boundMouseUp);
        document.addEventListener('touchmove', this.boundTouchMove, { passive: false });
        document.addEventListener('touchend', this.boundTouchEnd);
    }

    onDragMove(e) {
        if (!this.dragging) return;
        if (e.touches) e.preventDefault();
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        const r = this.dragRect || { width: 240, height: 200 };
        const x = Math.max(0, Math.min(window.innerWidth - r.width, cx - this.dragOffsetX));
        const y = Math.max(0, Math.min(window.innerHeight - r.height, cy - this.dragOffsetY));
        this.widget.style.left = x + 'px';
        this.widget.style.top = y + 'px';
        this.widget.style.bottom = 'auto';
        this.pos.x = x;
        this.pos.y = y;
    }

    onDragEnd() {
        if (!this.dragging) return;
        this.dragging = false;
        this.widget.classList.remove('dragging');
        document.removeEventListener('mousemove', this.boundMouseMove);
        document.removeEventListener('mouseup', this.boundMouseUp);
        document.removeEventListener('touchmove', this.boundTouchMove);
        document.removeEventListener('touchend', this.boundTouchEnd);
        this.dragRect = null;
        this.app.data.timeWidgetPos = { x: this.pos.x, y: this.pos.y };
        this.app.storage.save();
    }

    restorePosition() {
        if (!this.widget) return;
        const saved = this.app.data.timeWidgetPos;
        if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
            this.pos = { x: saved.x, y: saved.y };
            this.widget.style.left = saved.x + 'px';
            this.widget.style.top = saved.y + 'px';
            this.widget.style.bottom = 'auto';
        } else {
            this.widget.style.left = '20px';
            this.widget.style.bottom = '20px';
            this.widget.style.top = 'auto';
        }
    }

    // ---------- Секундомер ----------

    swToggle() { this.swRunning ? this.swPause() : this.swStart(); }

    swStart() {
        if (this.swRunning) return;
        this.swRunning = true;
        this.swStartTime = performance.now() - this.swElapsed;
        this.swTick();
        this.swUpdateButton();
        this.app.hud?.resetTimer();
        this._refreshAutoSave();
        this.saveState();
    }

    swPause() {
        if (!this.swRunning) return;
        this.swRunning = false;
        cancelAnimationFrame(this.swRafId);
        this.swRafId = null;
        this.swUpdateButton();
        this.app.hud?.resetTimer();
        this._refreshAutoSave();
        this.saveState();
    }

    swReset() {
        this.swPause();
        this.swElapsed = 0;
        this.swLaps = [];
        this.swLastLapTime = 0;
        this.swRender();
        this.swRenderLaps();
        this.swUpdateButton();
        this.updateCenter();
        this.saveState();
    }

    swLap() {
        if (!this.swRunning) return;
        const total = this.swElapsed;
        const diff = total - this.swLastLapTime;
        this.swLastLapTime = total;
        this.swLaps.unshift({ total, diff });
        this.swRenderLaps();
        this.saveState();
    }

    swTick() {
        this.swElapsed = performance.now() - this.swStartTime;
        this.swRender();
        this.updateCenter();
        if (this.swRunning) {
            this.swRafId = requestAnimationFrame(() => this.swTick());
        }
    }

    swFormat(ms) {
        const total = Math.floor(ms);
        const m = Math.floor(total / 60000);
        const s = Math.floor((total % 60000) / 1000);
        const cs = Math.floor((total % 1000) / 10);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
    }

    swRender() {
        if (this.swDisplay) this.swDisplay.textContent = this.swFormat(this.swElapsed);
    }

    swRenderLaps() {
        if (!this.swLapsList) return;
        if (this.swLaps.length === 0) {
            this.swLapsList.replaceChildren();
            this.swLapsList.classList.remove('has-laps');
            return;
        }
        this.swLapsList.classList.add('has-laps');

        const fragment = document.createDocumentFragment();
        const n = this.swLaps.length;
        for (let i = 0; i < n; i++) {
            const l = this.swLaps[i];
            const row = document.createElement('div');
            row.className = 'tw-lap-row';

            const num = document.createElement('span');
            num.className = 'tw-lap-num';
            num.textContent = `Круг ${n - i}`;

            const diff = document.createElement('span');
            diff.className = 'tw-lap-diff';
            diff.textContent = `+${this.swFormat(l.diff)}`;

            row.append(num, diff);
            fragment.appendChild(row);
        }
        this.swLapsList.replaceChildren(fragment);
    }

    swUpdateButton() {
        if (!this.swStartBtn) return;
        this.swStartBtn.textContent = this.swRunning ? '⏸' : '▶';
    }

    // ---------- Таймер ----------

    renderPresets() {
        if (!this.cdPresetsEl) return;
        this.cdPresetsEl.innerHTML = this.PRESETS.map(m =>
            `<button class="tw-preset" data-min="${m}">${m}м</button>`).join('') + `
            <input type="number" class="tw-custom-input" id="cdCustomInput" min="1" max="999" placeholder="мин">
            <button class="tw-preset" id="cdCustomApply">OK</button>`;
        this.cdPresetsEl.querySelectorAll('.tw-preset[data-min]').forEach(btn => {
            btn.addEventListener('click', () => this.cdSetTime(parseInt(btn.dataset.min, 10) * 60 * 1000));
        });
        document.getElementById('cdCustomApply')?.addEventListener('click', () => {
            const v = parseInt(document.getElementById('cdCustomInput')?.value, 10);
            if (v > 0 && v <= 999) this.cdSetTime(v * 60 * 1000);
        });
    }

    cdSetTime(ms) {
        this.cdPause();
        this.cdTotal = ms;
        this.cdRemaining = ms;
        this.cdFinished = false;
        this.cdRender();
        this.cdUpdateButton();
        this.updateCenter();
        this.saveState();
    }

    cdToggle() {
        if (this.cdFinished) { this.cdReset(); this.cdStart(); return; }
        if (this.cdRemaining <= 0) return;
        this.cdRunning ? this.cdPause() : this.cdStart();
    }

    cdStart() {
        if (this.cdRunning) return;
        if (this.cdRemaining <= 0) return;
        this.cdRunning = true;
        this.cdFinished = false;
        this.cdEndTime = performance.now() + this.cdRemaining;
        this.cdTick();
        this.cdUpdateButton();
        this.app.hud?.resetTimer();
        this._refreshAutoSave();
        this.saveState();
    }

    cdPause() {
        if (!this.cdRunning) return;
        this.cdRunning = false;
        cancelAnimationFrame(this.cdRafId);
        this.cdRafId = null;
        this.cdUpdateButton();
        this.app.hud?.resetTimer();
        this._refreshAutoSave();
        this.saveState();
    }

    cdReset() {
        this.cdPause();
        this.cdRemaining = this.cdTotal;
        this.cdFinished = false;
        this.cdRender();
        this.cdUpdateButton();
        this.updateCenter();
        this.saveState();
    }

    cdTick() {
        this.cdRemaining = Math.max(0, this.cdEndTime - performance.now());
        this.cdRender();
        this.updateCenter();

        if (this.cdRemaining <= 0) {
            this.cdRunning = false;
            this.cdFinished = true;
            this.cdUpdateButton();
            this.cdPlaySound();
            this.updateCenter();
            this._refreshAutoSave();
            this.saveState();
            return;
        }
        if (this.cdRunning) {
            this.cdRafId = requestAnimationFrame(() => this.cdTick());
        }
    }

    cdFormat(ms) {
        const total = Math.ceil(ms / 1000);
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    cdRender() {
        if (this.cdDisplay) {
            this.cdDisplay.textContent = this.cdFormat(this.cdRemaining);
            this.cdDisplay.classList.toggle('finished', this.cdFinished);
        }
    }

    cdUpdateButton() {
        if (!this.cdStartBtn) return;
        if (this.cdFinished) this.cdStartBtn.textContent = '↺';
        else if (this.cdRunning) this.cdStartBtn.textContent = '⏸';
        else this.cdStartBtn.textContent = '▶';
    }

    // ---------- Звук (один AudioContext на модуль) ----------

    _getAudioCtx() {
        if (this._audioCtx) return this._audioCtx;
        try {
            this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch {
            this._audioCtx = null;
        }
        return this._audioCtx;
    }

    cdPlaySound() {
        const ctx = this._getAudioCtx();
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});

        try {
            const now = ctx.currentTime;
            [880, 1100, 1320].forEach((f, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, now + i * 0.2);
                gain.gain.setValueAtTime(0.001, now + i * 0.2);
                gain.gain.exponentialRampToValueAtTime(0.15, now + i * 0.2 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.3);
                osc.start(now + i * 0.2);
                osc.stop(now + i * 0.2 + 0.35);
            });
        } catch { /* ignore */ }
    }
}

export default TimeWidget;