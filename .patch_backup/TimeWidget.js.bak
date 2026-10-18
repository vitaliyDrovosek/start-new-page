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
        this.pos = { x: 20, y: 0 };

        this.centerEl = null; this.centerSwEl = null; this.centerCdEl = null;
        this.saveInterval = null;

        this.boundMouseMove = this.onDragMove.bind(this);
        this.boundMouseUp = this.onDragEnd.bind(this);
        this.boundTouchMove = this.onDragMove.bind(this);
        this.boundTouchEnd = this.onDragEnd.bind(this);
    }

    init() {
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
        this.startAutoSave();
    }

    startAutoSave() {
        if (this.saveInterval) clearInterval(this.saveInterval);
        this.saveInterval = setInterval(() => this.saveState(), 1000);
    }

    saveState() {
        if (!this.app?.data) return;
        this.app.data.timeWidgetState = {
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
        this.app.storage.save();
    }

    restoreState() {
        const s = this.app.data?.timeWidgetState;
        if (!s) return;
        this.swLaps = s.swLaps || [];
        this.swLastLapTime = s.swLastLapTime || 0;

        if (s.swRunning && s.swStartTimeAbs) {
            this.swElapsed = Math.max(0, Date.now() - s.swStartTimeAbs);
            this.swRunning = true;
            this.swStartTime = performance.now() - this.swElapsed;
            this.swTick();
            this.swUpdateButton();
        } else {
            this.swElapsed = s.swElapsed || 0;
            this.swRunning = false;
            this.swRender();
            this.swUpdateButton();
        }
        this.swRenderLaps();

        this.cdTotal = s.cdTotal || 0;
        if (s.cdRunning && s.cdEndTimeAbs) {
            const remaining = s.cdEndTimeAbs - Date.now();
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
            this.cdRemaining = s.cdRemaining || 0;
            this.cdRunning = false;
            this.cdFinished = s.cdFinished || false;
            this.cdRender();
        }
        this.cdUpdateButton();
        this.updateCenter();
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
        this.app.storage.save();
    }
    updateIndicator() {
        const indicator = document.getElementById('timeWidgetIndicator');
        if (indicator) indicator.classList.toggle('off', !this.app.data.timeWidgetEnabled);
    }

    renderCenter() {
        if (!this.centerEl) return;
        const showSw = this.swRunning;
        const showCd = this.cdRunning;
        if (!showSw && !showCd) { this.centerEl.classList.remove('visible'); return; }
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
    }
    updateCenter() {
        if (!this.centerEl?.classList.contains('visible')) return;
        if (this.centerSwEl && !this.centerSwEl.classList.contains('hidden'))
            this.centerSwEl.textContent = this.swFormat(this.swElapsed);
        if (this.centerCdEl && !this.centerCdEl.classList.contains('hidden')) {
            this.centerCdEl.textContent = this.cdFormat(this.cdRemaining);
            this.centerCdEl.classList.toggle('finished', this.cdFinished);
        }
    }
    hideCenter() { this.centerEl?.classList.remove('visible'); }

    onDragStart(e) {
        if (!e) return;
        e.preventDefault?.();
        const rect = this.widget.getBoundingClientRect();
        this.dragging = true;
        this.dragOffsetX = e.clientX - rect.left;
        this.dragOffsetY = e.clientY - rect.top;
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
        const rect = this.widget.getBoundingClientRect();
        let x = Math.max(0, Math.min(window.innerWidth - rect.width, cx - this.dragOffsetX));
        let y = Math.max(0, Math.min(window.innerHeight - rect.height, cy - this.dragOffsetY));
        this.widget.style.left = x + 'px';
        this.widget.style.top = y + 'px';
        this.widget.style.bottom = 'auto';
        this.pos.x = x; this.pos.y = y;
    }
    onDragEnd() {
        if (!this.dragging) return;
        this.dragging = false;
        this.widget.classList.remove('dragging');
        document.removeEventListener('mousemove', this.boundMouseMove);
        document.removeEventListener('mouseup', this.boundMouseUp);
        document.removeEventListener('touchmove', this.boundTouchMove);
        document.removeEventListener('touchend', this.boundTouchEnd);
        this.app.data.timeWidgetPos = { x: this.pos.x, y: this.pos.y };
        this.app.storage.save();
    }
    restorePosition() {
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

    swToggle() { this.swRunning ? this.swPause() : this.swStart(); }
    swStart() {
        if (this.swRunning) return;
        this.swRunning = true;
        this.swStartTime = performance.now() - this.swElapsed;
        this.swTick(); this.swUpdateButton();
        this.app.hud?.resetTimer(); this.saveState();
    }
    swPause() {
        if (!this.swRunning) return;
        this.swRunning = false;
        cancelAnimationFrame(this.swRafId); this.swRafId = null;
        this.swUpdateButton(); this.app.hud?.resetTimer(); this.saveState();
    }
    swReset() {
        this.swPause();
        this.swElapsed = 0; this.swLaps = []; this.swLastLapTime = 0;
        this.swRender(); this.swRenderLaps(); this.swUpdateButton();
        this.updateCenter(); this.saveState();
    }
    swLap() {
        if (!this.swRunning) return;
        const total = this.swElapsed;
        const diff = total - this.swLastLapTime;
        this.swLastLapTime = total;
        this.swLaps.unshift({ total, diff });
        this.swRenderLaps(); this.saveState();
    }
    swTick() {
        this.swElapsed = performance.now() - this.swStartTime;
        this.swRender(); this.updateCenter();
        if (this.swRunning) this.swRafId = requestAnimationFrame(() => this.swTick());
    }
    swFormat(ms) {
        const total = Math.floor(ms);
        const m = Math.floor(total / 60000);
        const s = Math.floor((total % 60000) / 1000);
        const cs = Math.floor((total % 1000) / 10);
        return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
    }
    swRender() { if (this.swDisplay) this.swDisplay.textContent = this.swFormat(this.swElapsed); }
    swRenderLaps() {
        if (!this.swLapsList) return;
        if (this.swLaps.length === 0) {
            this.swLapsList.innerHTML = '';
            this.swLapsList.classList.remove('has-laps');
            return;
        }
        this.swLapsList.classList.add('has-laps');
        this.swLapsList.innerHTML = this.swLaps.map((l, i) => `
            <div class="tw-lap-row">
                <span class="tw-lap-num">Круг ${this.swLaps.length - i}</span>
                <span class="tw-lap-diff">+${this.swFormat(l.diff)}</span>
            </div>`).join('');
    }
    swUpdateButton() {
        if (!this.swStartBtn) return;
        this.swStartBtn.textContent = this.swRunning ? '⏸' : '▶';
    }

    renderPresets() {
        if (!this.cdPresetsEl) return;
        this.cdPresetsEl.innerHTML = this.PRESETS.map(m =>
            `<button class="tw-preset" data-min="${m}">${m}м</button>`).join('') + `
            <input type="number" class="tw-custom-input" id="cdCustomInput" min="1" max="999" placeholder="мин">
            <button class="tw-preset" id="cdCustomApply">OK</button>`;
        this.cdPresetsEl.querySelectorAll('.tw-preset[data-min]').forEach(btn => {
            btn.addEventListener('click', () => this.cdSetTime(parseInt(btn.dataset.min) * 60 * 1000));
        });
        document.getElementById('cdCustomApply')?.addEventListener('click', () => {
            const v = parseInt(document.getElementById('cdCustomInput')?.value);
            if (v > 0 && v <= 999) this.cdSetTime(v * 60 * 1000);
        });
    }
    cdSetTime(ms) {
        this.cdPause();
        this.cdTotal = ms; this.cdRemaining = ms; this.cdFinished = false;
        this.cdRender(); this.cdUpdateButton(); this.updateCenter(); this.saveState();
    }
    cdToggle() {
        if (this.cdFinished) { this.cdReset(); this.cdStart(); return; }
        if (this.cdRemaining <= 0) return;
        this.cdRunning ? this.cdPause() : this.cdStart();
    }
    cdStart() {
        if (this.cdRunning) return;
        if (this.cdRemaining <= 0) return;
        this.cdRunning = true; this.cdFinished = false;
        this.cdEndTime = performance.now() + this.cdRemaining;
        this.cdTick(); this.cdUpdateButton();
        this.app.hud?.resetTimer(); this.saveState();
    }
    cdPause() {
        if (!this.cdRunning) return;
        this.cdRunning = false;
        cancelAnimationFrame(this.cdRafId); this.cdRafId = null;
        this.cdUpdateButton(); this.app.hud?.resetTimer(); this.saveState();
    }
    cdReset() {
        this.cdPause();
        this.cdRemaining = this.cdTotal; this.cdFinished = false;
        this.cdRender(); this.cdUpdateButton(); this.updateCenter(); this.saveState();
    }
    cdTick() {
        this.cdRemaining = Math.max(0, this.cdEndTime - performance.now());
        this.cdRender(); this.updateCenter();
        if (this.cdRemaining <= 0) {
            this.cdRunning = false; this.cdFinished = true;
            this.cdUpdateButton(); this.cdPlaySound();
            this.updateCenter(); this.saveState();
            return;
        }
        if (this.cdRunning) this.cdRafId = requestAnimationFrame(() => this.cdTick());
    }
    cdFormat(ms) {
        const total = Math.ceil(ms / 1000);
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
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
    cdPlaySound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const now = ctx.currentTime;
            [880, 1100, 1320].forEach((f, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, now + i * 0.2);
                gain.gain.setValueAtTime(0.001, now + i * 0.2);
                gain.gain.exponentialRampToValueAtTime(0.15, now + i * 0.2 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.3);
                osc.start(now + i * 0.2); osc.stop(now + i * 0.2 + 0.35);
            });
        } catch {}
    }
}
export default TimeWidget;
