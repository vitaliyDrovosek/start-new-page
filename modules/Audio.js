class Audio {
    constructor(app) {
        this.app = app;

        // DOM-узлы ищем в init(), а не в конструкторе
        this.slider = null;
        this.value = null;
        this.icon = null;

        // Кэш для applyToVideo (ищем один раз)
        this._video = null;
        this._ytWrapper = null;

        this._keyHandler = null;
    }

    init() {
        this.slider = document.getElementById('volumeSlider');
        this.value  = document.getElementById('volumeValue');
        this.icon   = document.getElementById('volumeIcon');
        this._video = document.getElementById('bgVideo');
        this._ytWrapper = document.getElementById('youtubeWrapper');

        if (this.slider) {
            this.slider.addEventListener('input', (e) => this.onInput(e));
            this.slider.addEventListener('change', (e) => this.onChange(e));
        }

        this.setupKeyboardShortcuts();

        const vol = this.getVolume();
        const muted = this.isMuted();

        if (this.slider) this.slider.value = vol;
        this.updateValue(vol);
        this.updateIcon(vol, muted);
    }

    getVolume() {
        const v = this.app?.data?.volume;
        return Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 50;
    }

    isMuted() {
        return Boolean(this.app?.data?.isMuted);
    }

    setupKeyboardShortcuts() {
        if (this._keyHandler) return;
        this._keyHandler = (e) => {
            if (e.key !== 'F2') return;
            if (e.repeat) return; // удержание не спамит
            e.preventDefault();
            e.stopPropagation();
            this.toggleMute();
        };
        document.addEventListener('keydown', this._keyHandler);
    }

    updateValue(vol) {
        if (this.value) this.value.textContent = vol + '%';
    }

    updateIcon(vol, muted) {
        const iconText = (muted || vol === 0) ? '🔇'
                       : (vol < 30)           ? '🔈'
                       : (vol < 70)           ? '🔉'
                       :                        '🔊';
        if (this.icon) this.icon.textContent = iconText;
    }

    onInput(e) {
        const vol = parseInt(e.target.value, 10) || 0;
        this.updateValue(vol);
        this.updateIcon(vol, this.isMuted());
    }

    onChange(e) {
        const vol = parseInt(e.target.value, 10) || 0;
        this.app.data.volume = vol;

        if (vol > 0 && this.isMuted()) {
            this.app.data.isMuted = false;
        } else if (vol === 0 && !this.isMuted()) {
            this.app.data.isMuted = true;
        }

        this.applyToVideo();
        this.updateIcon(vol, this.isMuted());
        this.app.storage.save();
    }

    toggleMute() {
        this.app.data.isMuted = !this.isMuted();

        if (!this.isMuted() && this.getVolume() === 0) {
            this.app.data.volume = 50;
            if (this.slider) this.slider.value = 50;
            this.updateValue(50);
        }

        this.updateIcon(this.getVolume(), this.isMuted());
        this.applyToVideo();
        this.app.storage.save();
    }

    applyToVideo() {
        // HTML5 video
        const video = this._video || document.getElementById('bgVideo');
        if (video && video.style.display !== 'none') {
            video.muted = this.isMuted();
            if (!this.isMuted()) {
                video.volume = this.getVolume() / 100;
                video.play().catch((err) => {
                    console.debug('[Audio] video.play failed:', err?.message);
                });
            }
        }

        // YouTube iframe
        const wrapper = this._ytWrapper || document.getElementById('youtubeWrapper');
        if (wrapper && wrapper.style.display !== 'none') {
            const iframe = wrapper.querySelector('iframe');
            if (iframe?.contentWindow) {
                const send = (func, args) => {
                    try {
                        iframe.contentWindow.postMessage(JSON.stringify({
                            event: 'command',
                            func,
                            args
                        }), '*');
                    } catch (err) {
                        console.debug('[Audio] YT postMessage failed:', err?.message);
                    }
                };

                send('setVolume', [this.getVolume()]);
                send(this.isMuted() ? 'mute' : 'unMute', []);
            }
        }
    }
}

export default Audio;