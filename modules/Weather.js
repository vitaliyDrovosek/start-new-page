class Weather {
    constructor(app) {
        this.app = app;
        this.widget = null;
        this.indicator = null;
        this.dragHandle = null;
        this.body = null;
        this.API_KEY = 'fec5256dfac4d4d59519eda0a8cb1c7e';
        this.interval = null;
        this.dragging = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.pos = { x: null, y: null };
        this.boundMouseMove = this.onDragMove.bind(this);
        this.boundMouseUp = this.onDragEnd.bind(this);
    }

    init() {
        this.widget = document.getElementById('weatherWidget');
        this.indicator = document.getElementById('weatherIndicator');
        this.dragHandle = document.getElementById('weatherDrag');
        this.body = document.getElementById('weatherBody');

        // drag
        this.dragHandle?.addEventListener('mousedown', (e) => this.onDragStart(e));
        this.dragHandle?.addEventListener('touchstart', (e) => this.onDragStart(e.touches[0]), { passive: false });

        // обновление
        document.getElementById('weatherRefreshBtn')?.addEventListener('click', () => this.fetch());

        this.restorePosition();
        this.updateIndicator();

        if (this.app.data.weatherEnabled) {
            this.widget?.classList.add('visible');
            this.fetch();
            this.interval = setInterval(() => this.fetch(), 600000);
        }
    }

    updateIndicator() {
        if (this.indicator) {
            this.indicator.classList.toggle('off', !this.app.data.weatherEnabled);
        }
    }

    async fetch() {
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=54.9924&lon=73.3686&appid=${this.API_KEY}&units=metric&lang=ru`);
            const data = await response.json();

            const city = data.name || 'Город';

            const tempEl = document.getElementById('weatherTemp');
            const humEl = document.getElementById('weatherHumidity');
            const windEl = document.getElementById('weatherWind');
            const pressEl = document.getElementById('weatherPressure');
            const feelsEl = document.getElementById('weatherFeels');

            if (tempEl) tempEl.textContent = `${Math.round(data.main.temp)}°C`;
            if (humEl) humEl.textContent = `${data.main.humidity}%`;
            if (windEl) windEl.textContent = `${Math.round(data.wind.speed * 10) / 10} м/с`;
            if (pressEl) pressEl.textContent = `${Math.round(data.main.pressure * 0.75)} мм`;
            if (feelsEl) feelsEl.textContent = `${Math.round(data.main.feels_like)}°C`;

            const updateEl = document.getElementById('weatherUpdate');
            if (updateEl) updateEl.textContent = city;
        } catch (err) {
            console.warn('Weather fetch error:', err);
        }
    }

    toggle() {
        this.app.data.weatherEnabled = !this.app.data.weatherEnabled;
        this.updateIndicator();
        this.widget?.classList.toggle('visible', this.app.data.weatherEnabled);

        if (this.app.data.weatherEnabled) {
            this.fetch();
            if (this.interval) clearInterval(this.interval);
            this.interval = setInterval(() => this.fetch(), 600000);
        } else if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.app.storage.save();
    }

    // ============ DRAG ============

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
        document.addEventListener('touchmove', this.boundMouseMove, { passive: false });
        document.addEventListener('touchend', this.boundMouseUp);
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
        this.widget.style.right = 'auto';
        this.widget.style.bottom = 'auto';

        this.pos.x = x;
        this.pos.y = y;
    }

    onDragEnd() {
        if (!this.dragging) return;
        this.dragging = false;
        this.widget.classList.remove('dragging');

        document.removeEventListener('mousemove', this.boundMouseMove);
        document.removeEventListener('mouseup', this.boundMouseUp);
        document.removeEventListener('touchmove', this.boundMouseMove);
        document.removeEventListener('touchend', this.boundMouseUp);

        this.app.data.weatherPos = { x: this.pos.x, y: this.pos.y };
        this.app.storage.save();
    }

    restorePosition() {
        if (!this.widget) return;
        const saved = this.app.data.weatherPos;
        if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
            this.pos = { x: saved.x, y: saved.y };
            this.widget.style.left = saved.x + 'px';
            this.widget.style.top = saved.y + 'px';
            this.widget.style.right = 'auto';
            this.widget.style.bottom = 'auto';
        } else {
            this.widget.style.left = 'auto';
            this.widget.style.right = '20px';
            this.widget.style.top = '20px';
            this.widget.style.bottom = 'auto';
        }
    }
}

export default Weather;
