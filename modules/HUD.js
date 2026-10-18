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
        this.resetTimer();
        this.startClock();
        this.setupActivityListeners();
        this.setupVisibilityListeners();
        this.updateSleepModeIndicator();
        this.updateBlurIndicator();
        this.updateGlowIndicator();
        this.updateAutoSleepIndicator();
        this.updateGroupsLockIndicator();
        this.app.gameIcons?.updateIndicator();
    }

    setupVisibilityListeners() {
        document.addEventListener('visibilitychange', this.boundHandlers.handleVisibilityChange);
        window.addEventListener('blur', this.boundHandlers.handleWindowBlur);
        window.addEventListener('focus', this.boundHandlers.handleWindowFocus);
    }

    handleVisibilityChange() {
        const wasVisible = this.tabVisible;
        this.tabVisible = !document.hidden;

        if (this.tabVisible && !wasVisible) {
            this.resetTimer();
            this.show();
        } else if (!this.tabVisible) {
            this.clearSleepTimer();
        }
    }

    handleWindowBlur() {
        this.clearSleepTimer();
    }

    handleWindowFocus() {
        if (this.tabVisible) {
            this.resetTimer();
            this.show();
        }
    }

    clearSleepTimer() {
        clearTimeout(this.timer);
        this.timer = null;
    }

    setupActivityListeners() {
        const { boundHandlers } = this;

        document.addEventListener('mousemove', boundHandlers.handleMouseMove);
        document.addEventListener('mousedown', boundHandlers.handleMouseDown);
        document.addEventListener('keydown', boundHandlers.handleKeyDown);
        document.addEventListener('touchmove', boundHandlers.handleTouchMove, { passive: false });
        document.addEventListener('touchstart', boundHandlers.handleMouseDown);
        document.addEventListener('wheel', boundHandlers.handleWheel);
        document.addEventListener('mouseleave', boundHandlers.handleMouseLeave);
        document.addEventListener('mouseenter', boundHandlers.handleMouseEnter);
    }

    handleMouseMove(e) {
        if (!this.tabVisible) return;

        if (this.lastMouseX && this.lastMouseY) {
            const dx = Math.abs(e.clientX - this.lastMouseX);
            const dy = Math.abs(e.clientY - this.lastMouseY);

            if (dx > 5 || dy > 5) {
                this.handleActivity();
            }
        }

        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }

    handleKeyDown(e) {
        if (!this.tabVisible) return;

        const functionalKeys = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];

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

        if (!scrollable) {
            e.preventDefault();
        }

        const touch = e.touches[0];

        if (this.lastTouchX && this.lastTouchY) {
            const dx = Math.abs(touch.clientX - this.lastTouchX);
            const dy = Math.abs(touch.clientY - this.lastTouchY);

            if (dx > 10 || dy > 10) {
                this.handleActivity();
            }
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
            this.activityTimer = setTimeout(() => {
                this.activityDetected = false;
            }, 1000);
        } else {
            this.resetTimer();
        }
    }

    removeActivityListeners() {
        const { boundHandlers } = this;

        document.removeEventListener('mousemove', boundHandlers.handleMouseMove);
        document.removeEventListener('mousedown', boundHandlers.handleMouseDown);
        document.removeEventListener('keydown', boundHandlers.handleKeyDown);
        document.removeEventListener('touchmove', boundHandlers.handleTouchMove);
        document.removeEventListener('touchstart', boundHandlers.handleMouseDown);
        document.removeEventListener('wheel', boundHandlers.handleWheel);
        document.removeEventListener('mouseleave', boundHandlers.handleMouseLeave);
        document.removeEventListener('mouseenter', boundHandlers.handleMouseEnter);
        document.removeEventListener('visibilitychange', boundHandlers.handleVisibilityChange);
        window.removeEventListener('blur', boundHandlers.handleWindowBlur);
        window.removeEventListener('focus', boundHandlers.handleWindowFocus);

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

        if (!this.app.data.timeAutoSleepEnabled && this.app.timeWidget?.isActive()) {
            return;
        }

        document.body.classList.add('hud-hidden');

        if (this.app.timeWidget?.isActive()) {
            this.app.timeWidget.renderCenter();
        }
    }

    forceHide() {
        if (!this.tabVisible) return;

        document.body.classList.add('hud-hidden');

        if (this.app.timeWidget?.isActive()) {
            this.app.timeWidget.renderCenter();
        }

        this.clearSleepTimer();
    }

    resetTimer() {
        this.show();
        this.clearSleepTimer();

        if (this.app.data.sleepModeEnabled && this.tabVisible) {
            if (!this.app.data.timeAutoSleepEnabled && this.app.timeWidget?.isActive()) {
                return;
            }
            this.timer = setTimeout(() => this.hide(), this.TIMEOUT);
        }
    }

    toggleSleepMode() {
        this.app.data.sleepModeEnabled = !this.app.data.sleepModeEnabled;
        this.updateSleepModeIndicator();

        if (this.app.data.sleepModeEnabled) {
            this.resetTimer();
        } else {
            this.show();
            this.clearSleepTimer();
        }

        this.app.storage.save();
    }

    updateSleepModeIndicator() {
        const indicator = document.getElementById('sleepModeIndicator');
        if (indicator) {
            indicator.classList.toggle('off', !this.app.data.sleepModeEnabled);
        }
    }

    toggleAutoSleep() {
        this.app.data.timeAutoSleepEnabled = !this.app.data.timeAutoSleepEnabled;
        this.updateAutoSleepIndicator();
        this.app.storage.save();
        this.resetTimer();
    }

    updateAutoSleepIndicator() {
        const indicator = document.getElementById('timeAutoSleepIndicator');
        if (indicator) {
            indicator.classList.toggle('off', !this.app.data.timeAutoSleepEnabled);
        }
    }

    toggleGroupsLock() {
        this.app.data.groupsLocked = !this.app.data.groupsLocked;
        this.updateGroupsLockIndicator();
        this.app.groups.render();
        this.app.storage.save();
    }

    updateGroupsLockIndicator() {
        const indicator = document.getElementById('groupsLockIndicator');
        if (indicator) {
            indicator.classList.toggle('off', !this.app.data.groupsLocked);
        }
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
        if (indicator) {
            indicator.classList.toggle('off', !this.app.glowEnabled);
        }
    }

    toggleBlur() {
        this.app.data.blurEnabled = !this.app.data.blurEnabled;
        this.updateBlurIndicator();
        document.body.classList.toggle('blur-enabled', this.app.data.blurEnabled);
        document.body.classList.toggle('blur-disabled', !this.app.data.blurEnabled);
        this.app.storage.save();
    }

    updateBlurIndicator() {
        const indicator = document.getElementById('blurIndicator');
        if (indicator) {
            indicator.classList.toggle('off', !this.app.data.blurEnabled);
        }
    }

    toggleGameIcons() {
        if (this.app.gameIcons) {
            this.app.gameIcons.toggle();
        }
    }

    toggleDropdown() {
        const menu = document.getElementById("dropdownMenu");
        const particlesPanel = document.getElementById("particlesSettingsPanel");

        if (menu.classList.contains("show") && particlesPanel?.classList.contains("visible")) {
            particlesPanel.classList.remove("visible");
            menu.classList.remove('panel-open');
        }

        menu.classList.toggle("show");

        if (menu.classList.contains("show")) {
            document.body.classList.add('dropdown-open');
            setTimeout(() => {
                document.addEventListener('click', this.handleClickOutside);
            }, 100);
        } else {
            document.body.classList.remove('dropdown-open');
            document.removeEventListener('click', this.handleClickOutside);
            menu.classList.remove('panel-open');
        }

        this.resetTimer();
    }

    hideDropdown() {
        const menu = document.getElementById("dropdownMenu");
        menu.classList.remove("show");
        document.body.classList.remove('dropdown-open');
        document.removeEventListener('click', this.handleClickOutside);
    }

    handleClickOutside = (e) => {
        const menu = document.getElementById("dropdownMenu");
        const button = document.querySelector(".dropdown-button");
        const particlesPanel = document.getElementById("particlesSettingsPanel");

        if (particlesPanel?.classList.contains('visible')) {
            if (menu.contains(e.target) && !particlesPanel.contains(e.target)) return;

            if (!menu.contains(e.target) && !button.contains(e.target)) {
                particlesPanel.classList.remove('visible');
                menu.classList.remove('panel-open');
                return;
            }
        }

        if (!menu.contains(e.target) && !button.contains(e.target)) {
            this.hideDropdown();
        }
    }

    toggleGrain() {
        this.app.grain?.toggle();
    }

    setGrainOpacity(value) {
        this.app.grain?.setOpacity(value);
    }
}

export default HUD;