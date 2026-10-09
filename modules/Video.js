class Video {
    constructor(app) {
        this.app = app;
        this.keepAliveInterval = null;
    }

    startKeepAlive() {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
        }
        this.keepAliveInterval = setInterval(() => {
            const video = document.getElementById('bgVideo');
            if (video.style.display !== 'none' && video.paused) {
                video.play().catch(() => {});
            }
        }, 5000);
    }
}
export default Video;