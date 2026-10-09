class Weather {
    constructor(app) {
        this.app = app;
        this.widget = document.getElementById('weatherWidget');
        this.indicator = document.getElementById('weatherIndicator');
        this.API_KEY = 'fec5256dfac4d4d59519eda0a8cb1c7e';
        this.interval = null;
    }

    init() {
        this.updateIndicator();
        if (this.app.data.weatherEnabled) {
            this.widget.classList.add('visible');
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

            document.getElementById('weatherTemp').textContent = `${Math.round(data.main.temp)}°C`;
            document.getElementById('weatherHumidity').textContent = `${data.main.humidity}%`;
            document.getElementById('weatherWind').textContent = `${Math.round(data.wind.speed * 10) / 10} м/с`;
            document.getElementById('weatherPressure').textContent = `${Math.round(data.main.pressure * 0.75)} мм`;
            document.getElementById('weatherFeels').textContent = `${Math.round(data.main.feels_like)}°C`;

            const now = new Date();
            document.getElementById('weatherUpdate').textContent = `Обновлено: ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        } catch {
            // Тихая обработка ошибок
        }
    }

    toggle() {
        this.app.data.weatherEnabled = !this.app.data.weatherEnabled;
        this.updateIndicator();
        this.widget.classList.toggle('visible', this.app.data.weatherEnabled);

        if (this.app.data.weatherEnabled) {
            this.fetch();
            if (this.interval) clearInterval(this.interval);
            this.interval = setInterval(() => this.fetch(), 600000);
        } else if (this.interval) {
            clearInterval(this.interval);
        }
        this.app.storage.save();
    }
}
export default Weather;