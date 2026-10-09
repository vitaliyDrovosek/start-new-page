class Storage {
    constructor(app) {
        this.app = app;
        this.STORAGE_KEY = "startV2";
    }

    load() {
        const savedData = JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || {};

        const defaultParticlesSettings = {
            STAR_COUNT: 50,
            REPEL_FORCE: 0.3,
            REPEL_RADIUS: 200,
            BASE_SPEED: 0.15,
            BOUNCE: 0.2,
            LINE_DISTANCE: 150,
            OVERLAP_DISTANCE: 5,
            PARTICLE_REPEL_FORCE: 0.01,
            PARTICLE_REPEL_RADIUS: 60
        };

        return {
            groups: savedData.groups || [],
            background: savedData.background || null,
            youtubeId: savedData.youtubeId || null,
            youtubePlaylistId: savedData.youtubePlaylistId || null,
            isMuted: savedData.isMuted ?? true,
            volume: savedData.volume ?? 50,
            searchEngine: savedData.searchEngine || 'yandex',
            searchHistory: savedData.searchHistory || [],
            historyEnabled: savedData.historyEnabled ?? true,
            weatherEnabled: savedData.weatherEnabled ?? false,
            sleepModeEnabled: savedData.sleepModeEnabled ?? true,
            blurEnabled: savedData.blurEnabled ?? true,
            particlesEnabled: savedData.particlesEnabled ?? true,
            videoCurrentTime: savedData.videoCurrentTime || 0,
            replaceTab: savedData.replaceTab ?? true,
            glowEnabled: savedData.glowEnabled ?? true,

            gameIconsEnabled: savedData.gameIconsEnabled ?? false,
            timeWidgetEnabled: savedData.timeWidgetEnabled ?? false,
            timeWidgetPos: savedData.timeWidgetPos ?? null,
            timeAutoSleepEnabled: savedData.timeAutoSleepEnabled ?? true,

            groupsLocked: savedData.groupsLocked ?? false,

            hue: savedData.hue ?? 220,
            rgbMode: savedData.rgbMode ?? false,
            brightness: savedData.brightness ?? 60,
            uiOpacity: savedData.uiOpacity ?? 100,

            aimBest: savedData.aimBest ?? null,
            aimGames: savedData.aimGames ?? 0,

            typingBestWpm: savedData.typingBestWpm ?? null,
            typingGames: savedData.typingGames ?? 0,

            achievements: savedData.achievements || [],
            visitsCount: savedData.visitsCount ?? 0,
            visitStreak: savedData.visitStreak ?? 0,
            lastVisitDate: savedData.lastVisitDate ?? null,
            searchCount: savedData.searchCount ?? 0,
            hueChanges: savedData.hueChanges ?? 0,

            particlesSettings: savedData.particlesSettings || defaultParticlesSettings
        };
    }

    save() {
        if (this.app.particles) {
            this.app.data.particlesEnabled = this.app.particles.enabled;
            this.app.data.particlesSettings = {
                STAR_COUNT: this.app.particles.STAR_COUNT,
                REPEL_FORCE: this.app.particles.REPEL_FORCE,
                REPEL_RADIUS: this.app.particles.REPEL_RADIUS,
                BASE_SPEED: this.app.particles.BASE_SPEED,
                BOUNCE: this.app.particles.BOUNCE,
                LINE_DISTANCE: this.app.particles.LINE_DISTANCE,
                OVERLAP_DISTANCE: this.app.particles.OVERLAP_DISTANCE,
                PARTICLE_REPEL_FORCE: this.app.particles.PARTICLE_REPEL_FORCE,
                PARTICLE_REPEL_RADIUS: this.app.particles.PARTICLE_REPEL_RADIUS
            };
        }

        this.app.data.glowEnabled = this.app.glowEnabled;

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.app.data));
    }

    saveBeforeUnload() {
        const video = document.getElementById('bgVideo');
        if (video.style.display !== 'none') {
            this.app.data.videoCurrentTime = video.currentTime;
        }
        this.save();
    }

    copyConfig() {
        const config = JSON.stringify(this.app.data, null, 2);
        navigator.clipboard.writeText(config)
            .then(() => alert("Конфигурация скопирована в буфер обмена"))
            .catch(this.fallbackCopy.bind(this, config));
    }

    fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert("Конфигурация скопирована в буфер обмена");
    }

    pasteConfig() {
        navigator.clipboard.readText()
            .then(text => this.applyConfig(text))
            .catch(() => alert("Не удалось прочитать буфер обмена"));
    }

    applyConfig(text) {
        try {
            const newConfig = JSON.parse(text);
            Object.assign(this.app.data, newConfig);

            if (this.app.particles && newConfig.particlesSettings) {
                this.app.particles.updateSettings(newConfig.particlesSettings);
            }

            this.save();
            this.applyChanges();
            alert("Конфигурация применена");
        } catch {
            alert("Неверный формат конфигурации");
        }
    }

    applyChanges() {
        this.app.background.apply();
        this.app.groups.render();
        this.app.search.updateUI();
        this.app.history.render();
        this.app.audio.updateIcon(this.app.data.volume, this.app.data.isMuted);

        document.body.classList.toggle('glow-enabled', this.app.data.glowEnabled !== false);
        document.body.classList.toggle('glow-disabled', this.app.data.glowEnabled === false);
        if (this.app.hud) this.app.hud.updateGlowIndicator();

        if (this.app.gameIcons) {
            this.app.gameIcons.updateVisibility();
            this.app.gameIcons.updateIndicator();
        }

        if (this.app.timeWidget) {
            this.app.timeWidget.updateVisibility();
            this.app.timeWidget.updateIndicator();
            this.app.timeWidget.restorePosition();
        }

        if (this.app.hud) {
            this.app.hud.updateAutoSleepIndicator();
            this.app.hud.updateGroupsLockIndicator();
        }

        if (this.app.hue) {
            const hue = this.app.data.hue ?? 220;
            const rgbMode = this.app.data.rgbMode ?? false;
            const brightness = this.app.data.brightness ?? 60;
            const uiOpacity = this.app.data.uiOpacity ?? 100;

            if (this.app.hue.slider) this.app.hue.slider.value = hue;
            if (this.app.hue.brightnessSlider) this.app.hue.brightnessSlider.value = brightness;
            if (this.app.hue.opacitySlider) this.app.hue.opacitySlider.value = uiOpacity;

            this.app.hue.applyBrightness(brightness);
            this.app.hue.applyOpacity(uiOpacity);
            this.app.hue.apply(hue);

            if (rgbMode !== this.app.hue.rgbMode) {
                this.app.hue.toggleRgbMode();
            } else {
                this.app.hue.updateRgbButton();
            }
        }

        if (this.app.aim) {
            this.app.aim.updateDropdownBest();
        }

        if (this.app.typing) {
            this.app.typing.updateDropdownBest();
        }

        if (this.app.achievements) {
            this.app.achievements.updateDropdownCounter();
        }

        if (this.app.weather.widget) {
            this.app.weather.widget.classList.toggle('visible', this.app.data.weatherEnabled);
            if (this.app.data.weatherEnabled) this.app.weather.fetch();
        }
    }

    resetConfig() {
        if (confirm("Вы уверены, что хотите сбросить все настройки?")) {
            localStorage.removeItem(this.STORAGE_KEY);
            this.app.data = this.load();

            if (this.app.particles && this.app.data.particlesSettings) {
                this.app.particles.updateSettings(this.app.data.particlesSettings);
            }

            this.applyChanges();

            if (this.app.weather.widget) {
                this.app.weather.widget.classList.remove('visible');
            }

            if (this.app.particles) {
                this.app.particles.enabled = this.app.data.particlesEnabled;
                const indicator = document.getElementById('particlesIndicator');
                if (indicator) {
                    indicator.classList.toggle('off', !this.app.particles.enabled);
                }
            }

            if (this.app.aim) {
                this.app.aim.updateDropdownBest();
            }

            if (this.app.typing) {
                this.app.typing.updateDropdownBest();
            }

            if (this.app.achievements) {
                this.app.achievements.updateDropdownCounter();
            }

            alert("Конфигурация сброшена");
        }
    }
}

export default Storage;