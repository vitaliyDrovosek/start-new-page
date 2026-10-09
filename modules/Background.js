class Background {
    constructor(app) {
        this.app = app;
        this.restoringTime = false;
    }

    apply() {
        const img = document.getElementById("bgImage");
        const vid = document.getElementById("bgVideo");
        const wrapper = document.getElementById("youtubeWrapper");

        if (!img || !vid || !wrapper) return;

        img.style.display = "none";
        vid.style.display = "none";
        wrapper.style.display = "none";
        wrapper.innerHTML = '';

        if (this.app.data.youtubePlaylistId || this.app.data.youtubeId) {
            wrapper.style.display = "block";

            const iframe = document.createElement('iframe');
            iframe.id = 'bgYoutube';
            iframe.frameBorder = '0';
            iframe.allow = 'autoplay; encrypted-media; accelerometer; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            Object.assign(iframe.style, {
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: '0',
                left: '0',
                pointerEvents: 'none'
            });

            if (this.app.data.youtubePlaylistId) {
                iframe.src = `https://www.youtube.com/embed/videoseries?list=${this.app.data.youtubePlaylistId}&autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1`;
            } else {
                iframe.src = `https://www.youtube.com/embed/${this.app.data.youtubeId}?autoplay=1&mute=1&loop=1&playlist=${this.app.data.youtubeId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1`;
            }

            wrapper.appendChild(iframe);
            this.app.video.startKeepAlive();
            return;
        }

        if (this.app.data.background) {
            const url = this.app.data.background.toLowerCase();

            if (url.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/)) {
                vid.src = this.app.data.background;
                vid.style.display = "block";
                vid.loop = true;
                vid.muted = this.app.data.isMuted;
                if (!this.app.data.isMuted) vid.volume = this.app.data.volume / 100;

                vid.ontimeupdate = () => {
                    this.app.data.videoCurrentTime = vid.currentTime;
                };

                vid.play()
                    .then(() => {
                        if (this.app.data.videoCurrentTime > 0 && !this.restoringTime) {
                            this.restoringTime = true;
                            vid.currentTime = this.app.data.videoCurrentTime;
                            vid.addEventListener('seeked', () => {
                                this.restoringTime = false;
                            }, { once: true });
                        }
                    })
                    .catch(() => {
                        setTimeout(() => vid.play().catch(() => {}), 1000);
                    });

                this.app.video.startKeepAlive();
            } else {
                img.src = this.app.data.background;
                img.style.display = "block";
            }
        }
    }

    extractYoutubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    extractPlaylistId(url) {
        const regExp = /[&?]list=([^&]+)/;
        const match = url.match(regExp);
        return match ? match[1] : null;
    }

    set() {
        const url = prompt("Введите ссылку на фон (YouTube, картинку или видео):");
        if (!url) return;

        this.app.data.youtubeId = null;
        this.app.data.youtubePlaylistId = null;
        this.app.data.background = null;
        this.app.data.videoCurrentTime = 0;

        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const youtubeId = this.extractYoutubeId(url);
            const playlistId = this.extractPlaylistId(url);

            if (playlistId) {
                this.app.data.youtubePlaylistId = playlistId;
            } else if (youtubeId) {
                this.app.data.youtubeId = youtubeId;
            } else {
                alert("Неверная YouTube ссылка!");
                return;
            }
        } else {
            this.app.data.background = url;
        }

        this.app.storage.save();
        this.apply();
    }

    unmuteIfNeeded() {
        if (!this.app.data.isMuted) {
            const wrapper = document.getElementById('youtubeWrapper');
            if (wrapper.style.display !== 'none') {
                const iframe = wrapper.querySelector('iframe');
                if (iframe?.contentWindow) {
                    try {
                        iframe.contentWindow.postMessage(JSON.stringify({
                            event: 'command',
                            func: 'playVideo',
                            args: []
                        }), '*');
                        iframe.contentWindow.postMessage(JSON.stringify({
                            event: 'command',
                            func: 'unMute',
                            args: []
                        }), '*');
                        iframe.contentWindow.postMessage(JSON.stringify({
                            event: 'command',
                            func: 'setVolume',
                            args: [this.app.data.volume]
                        }), '*');
                    } catch { /* Игнорируем ошибки YouTube API */ }
                }
            }
        }
    }
}

export default Background;