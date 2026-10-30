class Clock {
    constructor(app) {
        this.app = app;
        this.el = null;
        this.interval = null;
    }

    init() {
        this.el = document.getElementById('clock');
        this.startClock();
    }

    startClock() {
        this.updateClock();
        this.interval = setInterval(() => this.updateClock(), 1000);
    }

    stopClock() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    updateClock() {
        if (!this.el) return;
        this.el.textContent = new Date().toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

export default Clock;
