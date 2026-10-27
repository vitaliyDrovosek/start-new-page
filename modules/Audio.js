class Audio {
    constructor(app) {
        this.app = app;

        this.slider = document.getElementById('volumeSlider');
        this.value = document.getElementById('volumeValue');
        this.icon = document.getElementById('volumeIcon');

        if (this.slider) {
            this.slider.addEventListener('input', (e) => this.onInput(e));
            this.slider.addEventListener('change', (e) => this.onChange(e));
        }

        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                e.stopPropagation();
                this.toggleMute();
            }
        });
    }

    init() {
        if (this.slider) this.slider.value = this.app.data.volume;
        this.updateValue(this.app.data.volume);
        this.updateIcon(this.app.data.volume, this.app.data.isMuted);
    }

    updateValue(vol) {
        if (this.value) this.value.textContent = vol + '%';
    }

    updateIcon(vol, muted) {
        const iconText = (muted || vol === 0) ? '🔇' : (vol < 30) ? '🔈' : (vol < 70) ? '🔉' : '🔊';
        if (this.icon) this.icon.textContent = iconText;
    }

    onInput(e) {
        const vol = parseInt(e.target.value);
        this.updateValue(vol);
        this.updateIcon(vol, this.app.data.isMuted);
    }

    onChange(e) {
        const vol = parseInt(e.target.value);
        this.app.data.volume = vol;

        if (vol > 0 && this.app.data.isMuted) {
            this.app.data.isMuted = false;
        } else if (vol === 0 && !this.app.data.isMuted) {
            this.app.data.isMuted = true;
        }

        this.applyToVideo();
        this.updateIcon(vol, this.app.data.isMuted);
        this.app.storage.save();
    }

    toggleMute() {
        this.app.data.isMuted = !this.app.data.isMuted;

        if (!this.app.data.isMuted && this.app.data.volume === 0) {
            this.app.data.volume = 50;
            if (this.slider) this.slider.value = 50;
            this.updateValue(50);
        }

        this.updateIcon(this.app.data.volume, this.app.data.isMuted);
        this.applyToVideo();
        this.app.storage.save();
    }

    applyToVideo() {
        const video = document.getElementById('bgVideo');
        if (video.style.display !== 'none') {
            video.muted = this.app.data.isMuted;
            if (!this.app.data.isMuted) {
                video.volume = this.app.data.volume / 100;
                video.play().catch(() => {});
            }
        }

        const wrapper = document.getElementById('youtubeWrapper');
        if (wrapper.style.display !== 'none') {
            const iframe = wrapper.querySelector('iframe');
            if (iframe?.contentWindow) {
                try {
                    iframe.contentWindow.postMessage(JSON.stringify({
                        event: 'command',
                        func: 'setVolume',
                        args: [this.app.data.volume]
                    }), '*');

                    iframe.contentWindow.postMessage(JSON.stringify({
                        event: 'command',
                        func: this.app.data.isMuted ? 'mute' : 'unMute',
                        args: []
                    }), '*');
                } catch {  }
            }
        }
    }
}
export default Audio;