class Video {
    constructor(app) {
        this.app = app;
        this.keepAliveInterval = null;
    }

    startKeepAlive() {
        this.stopKeepAlive();
        this.keepAliveInterval = setInterval(() => {
            const video = document.getElementById('bgVideo');
            if (!video) return;
            if (video.style.display !== 'none' && video.paused) {
                video.play().catch((err) => {
                    console.debug('[Video] keep-alive play failed:', err?.message);
                });
            }
        }, 5000);
    }

    stopKeepAlive() {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
        }
    }
}

export default Video;