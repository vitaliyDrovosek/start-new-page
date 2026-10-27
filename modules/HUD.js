class HUD {
    constructor(app) {
        this.app = app;
        this.timer = null;
        this.TIMEOUT = 15000;
        this.clockInterval = null;

        this.activityDetected = false;
        this.activityTimer = null;
        this.tabVisible = true;
        this.mouseInWindow = true;

        this.boundHandlers = this.createBoundHandlers();
    }

    createBoundHandlers() {
        return {
            handleMouseMove: this.handleMouseMove.bind(this),
            handleMouseDown: this.handleActivity.bind(this),
            handleKeyDown: this.handleKeyDown.bind(this),
            handleTouchMove: this.handleTouchMove.bind(this),
            handleWheel: this.handleActivity.bind(this),
            handleVisibilityChange: this.handleVisibilityChange.bind(this),
            handleWindowBlur: this.handleWindowBlur.bind(this),
            handleWindowFocus: this.handleWindowFocus.bind(this),
            handleMouseLeave: () => this.mouseInWindow = false,
            handleMouseEnter: () => {
                this.mouseInWindow = true;
                this.handleActivity();
            }
        };
    }

    init() {
        const h = this.boundHandlers;


        document.addEventListener('mousemove', h.handleMouseMove);
        document.addEventListener('mousedown', h.handleMouseDown);
        document.addEventListener('keydown', h.handleKeyDown);
        document.addEventListener('touchmove', h.handleTouchMove, { passive: false });
        document.addEventListener('touchstart', h.handleMouseDown, { passive: true });
        document.addEventListener('wheel', h.handleWheel, { passive: true });
        document.addEventListener('mouseleave', h.handleMouseLeave);
        document.addEventListener('mouseenter', h.handleMouseEnter);
        document.addEventListener('visibilitychange', h.handleVisibilityChange);
        window.addEventListener('blur', h.handleWindowBlur);
        window.addEventListener('focus', h.handleWindowFocus);


        let _downInside = false;
        document.addEventListener('mousedown', (e) => {
            const menu = document.getElementById('dropdownMenu');
            if (!menu || !menu.classList.contains('show')) return;
            _downInside = !!(e.target.closest && (
                e.target.closest('#dropdownMenu') ||
                e.target.closest('.dropdown-button')
            ));
        }, true);

        document.addEventListener('mouseup', (e) => {
            const menu = document.getElementById('dropdownMenu');
            if (!menu || !menu.classList.contains('show')) return;
            const upInside = !!(e.target.closest && (
                e.target.closest('#dropdownMenu') ||
                e.target.closest('.dropdown-button')
            ));
            if (!_downInside && !upInside) {
                this.hideDropdown();
            }
        }, true);

        this.startClock();


        this.updateSleepModeIndicator();
        this.updateAutoSleepIndicator();
        this.updateGroupsLockIndicator();
        this.updateGlowIndicator();
        this.updateBlurIndicator();
    }



    handleMouseMove(e) {
        if (!this.tabVisible) return;
        if (this.lastMouseX && this.lastMouseY) {
            const dx = Math.abs(e.clientX - this.lastMouseX);
            const dy = Math.abs(e.clientY - this.lastMouseY);
            if (dx > 5 || dy > 5) this.handleActivity();
        }
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }

    handleKeyDown(e) {
        if (!this.tabVisible) return;
        const functionalKeys = ['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12'];
        if (!e.ctrlKey && !e.altKey && !e.metaKey && !functionalKeys.includes(e.key)) {
            this.handleActivity();
        }
    }

    handleTouchMove(e) {
        if (!this.tabVisible || !e.touches.length) return;
        const target = e.target;
        const scrollable = target.closest(
            '.dropdown-menu, .search-history, .particles-settings-content, ' +
            '.achievements-modal, .tw-laps, .aim-overlay, .typing-field, .groups'
        );
        if (!scrollable) e.preventDefault();

        const touch = e.touches[0];
        if (this.lastTouchX && this.lastTouchY) {
            const dx = Math.abs(touch.clientX - this.lastTouchX);
            const dy = Math.abs(touch.clientY - this.lastTouchY);
            if (dx > 10 || dy > 10) this.handleActivity();
        }
        this.lastTouchX = touch.clientX;
        this.lastTouchY = touch.clientY;
    }

    handleActivity() {
        if (!this.tabVisible) return;
        if (!this.activityDetected) {
            this.activityDetected = true;
            this.resetTimer();
            clearTimeout(this.activityTimer);
            this.activityTimer = setTimeout(() => { this.activityDetected = false; }, 1000);
        } else {
            this.resetTimer();
        }
    }

    handleVisibilityChange() {
        this.tabVisible = !document.hidden;
        if (this.tabVisible) this.resetTimer();
        else this.clearSleepTimer();
    }

    handleWindowBlur() { this.tabVisible = false; }
    handleWindowFocus() { this.tabVisible = true; this.resetTimer(); }

    removeActivityListeners() {
        const h = this.boundHandlers;
        document.removeEventListener('mousemove', h.handleMouseMove);
        document.removeEventListener('mousedown', h.handleMouseDown);
        document.removeEventListener('keydown', h.handleKeyDown);
        document.removeEventListener('touchmove', h.handleTouchMove);
        document.removeEventListener('touchstart', h.handleMouseDown);
        document.removeEventListener('wheel', h.handleWheel);
        document.removeEventListener('mouseleave', h.handleMouseLeave);
        document.removeEventListener('mouseenter', h.handleMouseEnter);
        document.removeEventListener('visibilitychange', h.handleVisibilityChange);
        window.removeEventListener('blur', h.handleWindowBlur);
        window.removeEventListener('focus', h.handleWindowFocus);
        clearTimeout(this.activityTimer);
        this.clearSleepTimer();
    }



    startClock() {
        this.updateClock();
        this.clockInterval = setInterval(() => this.updateClock(), 1000);
    }

    stopClock() {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
        }
    }

    updateClock() {
        const clock = document.getElementById("clock");
        if (clock) {
            clock.textContent = new Date().toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }



    show() {
        document.body.classList.remove('hud-hidden');
        this.app.timeWidget?.hideCenter();
    }

    hide() {
        if (!this.tabVisible) return;
        if (!this.app.data.sleepModeEnabled) return;
        if (!this.app.data.timeAutoSleepEnabled && this.app.timeWidget?.isActive()) return;
        document.body.classList.add('hud-hidden');
        if (this.app.timeWidget?.isActive()) this.app.timeWidget.renderCenter();
    }

    forceHide() {
        if (!this.tabVisible) return;
        document.body.classList.add('hud-hidden');
        if (this.app.timeWidget?.isActive()) this.app.timeWidget.renderCenter();
        this.clearSleepTimer();
    }

    resetTimer() {
        this.show();
        this.clearSleepTimer();
        if (this.app.data.sleepModeEnabled && this.tabVisible) {
            if (!this.app.data.timeAutoSleepEnabled && this.app.timeWidget?.isActive()) return;
            this.timer = setTimeout(() => this.hide(), this.TIMEOUT);
        }
    }

    clearSleepTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }



    toggleSleepMode() {
        this.app.data.sleepModeEnabled = !this.app.data.sleepModeEnabled;
        this.updateSleepModeIndicator();
        if (this.app.data.sleepModeEnabled) this.resetTimer();
        else { this.show(); this.clearSleepTimer(); }
        this.app.storage.save();
    }

    updateSleepModeIndicator() {
        const indicator = document.getElementById('sleepModeIndicator');
        if (indicator) indicator.classList.toggle('off', !this.app.data.sleepModeEnabled);
    }

    toggleAutoSleep() {
        this.app.data.timeAutoSleepEnabled = !this.app.data.timeAutoSleepEnabled;
        this.updateAutoSleepIndicator();
        this.app.storage.save();
        this.resetTimer();
    }

    updateAutoSleepIndicator() {
        const indicator = document.getElementById('timeAutoSleepIndicator');
        if (indicator) indicator.classList.toggle('off', !this.app.data.timeAutoSleepEnabled);
    }

    toggleGroupsLock() {
        this.app.data.groupsLocked = !this.app.data.groupsLocked;
        this.updateGroupsLockIndicator();
        this.app.groups.render();
        this.app.storage.save();
    }

    updateGroupsLockIndicator() {
        const indicator = document.getElementById('groupsLockIndicator');
        if (indicator) indicator.classList.toggle('off', !this.app.data.groupsLocked);
    }

    toggleGlow() {
        this.app.glowEnabled = !this.app.glowEnabled;
        document.body.classList.toggle('glow-enabled', this.app.glowEnabled);
        document.body.classList.toggle('glow-disabled', !this.app.glowEnabled);
        this.updateGlowIndicator();
        this.app.storage.save();
        this.app.achievements?.trackGlowOff(this.app.glowEnabled);
    }

    updateGlowIndicator() {
        const indicator = document.getElementById('glowIndicator');
        if (indicator) indicator.classList.toggle('off', !this.app.glowEnabled);
    }

    toggleBlur() {
        this.app.data.blurEnabled = !this.app.data.blurEnabled;
        this.updateBlurIndicator();
        document.body.classList.toggle('blur-enabled', this.app.data.blurEnabled);
        document.body.classList.toggle('blur-disabled', !this.app.data.blurEnabled);
        this.app.sleepToggles?.update();
        this.app.storage.save();
    }

    updateBlurIndicator() {
        const indicator = document.getElementById('blurIndicator');
        if (indicator) indicator.classList.toggle('off', !this.app.data.blurEnabled);
    }

    toggleSleepGrain() {
        this.app.data.sleepGrainEnabled = !(this.app.data.sleepGrainEnabled !== false);
        this.updateSleepGrainIndicator();
        this.applySleepStyles();
        this.app.storage.save();
    }

    updateSleepGrainIndicator() {
        const indicator = document.getElementById('sleepGrainIndicator');
        if (indicator) indicator.classList.toggle('off', this.app.data.sleepGrainEnabled === false);
    }

    toggleSleepBlur() {
        this.app.data.sleepBlurEnabled = !(this.app.data.sleepBlurEnabled !== false);
        this.updateSleepBlurIndicator();
        this.applySleepStyles();
        this.app.storage.save();
    }

    updateSleepBlurIndicator() {
        const indicator = document.getElementById('sleepBlurIndicator');
        if (indicator) indicator.classList.toggle('off', this.app.data.sleepBlurEnabled === false);
    }

    applySleepStyles() {
        const hideGrain = this.app.data.sleepGrainEnabled === false;
        const hideBlur = this.app.data.sleepBlurEnabled === false;

        document.body.classList.toggle('sleep-no-grain', hideGrain);
        document.body.classList.toggle('sleep-no-blur', hideBlur);
    }

    toggleGameIcons() { this.app.gameIcons?.toggle(); }



    toggleDropdown() {
        const menu = document.getElementById("dropdownMenu");
        const particlesPanel = document.getElementById("particlesSettingsPanel");
        const overlay = document.getElementById("mobileHudOverlay");

        if (menu.classList.contains("show") && particlesPanel?.classList.contains("visible")) {
            particlesPanel.classList.remove("visible");
            menu.classList.remove('panel-open');
        }

        menu.classList.toggle("show");

        if (menu.classList.contains("show")) {
            document.body.classList.add('dropdown-open');
            if (overlay) overlay.classList.add('visible');
        } else {
            document.body.classList.remove('dropdown-open');
            menu.classList.remove('panel-open');
            if (overlay) overlay.classList.remove('visible');
        }

        this.resetTimer();
    }

    hideDropdown() {
        const menu = document.getElementById("dropdownMenu");
        const overlay = document.getElementById("mobileHudOverlay");
        if (menu) menu.classList.remove("show");
        document.body.classList.remove('dropdown-open');
        if (overlay) overlay.classList.remove('visible');
    }

    toggleGrain() { this.app.grain?.toggle(); }
    setGrainOpacity(v) { this.app.grain?.setOpacity(v); }
}

export default HUD;
