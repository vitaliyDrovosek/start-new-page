import Audio from './modules/Audio.js';
import Particles from './modules/Particles.js';
import Video from './modules/Video.js';
import Storage from './modules/Storage.js';
import HUD from './modules/HUD.js';
import Weather from './modules/Weather.js';
import Background from './modules/Background.js';
import History from './modules/History.js';
import Search from './modules/Search.js';
import Groups from './modules/Group.js';
import Glow from './modules/Glow.js';
import Hue from './modules/Hue.js';
import Aim from './modules/Aim.js';
import Typing from './modules/Typing.js';
import Achievements from './modules/Achievements.js';
import GameIcons from './modules/GameIcons.js';
import TimeWidget from './modules/TimeWidget.js';

class App {
    constructor() {
        this.searchEngines = {
            yandex: { name: 'Yandex', url: 'https://yandex.ru/search/?text=' },
            google: { name: 'Google', url: 'https://www.google.com/search?q=' }
        };

        this.storage = new Storage(this);
        this.data = this.storage.load();

        this.hud = new HUD(this);
        this.video = new Video(this);
        this.audio = new Audio(this);
        this.weather = new Weather(this);
        this.history = new History(this);
        this.search = new Search(this);
        this.groups = new Groups(this);
        this.background = new Background(this);
        this.particles = new Particles(this.data.particlesSettings);
        this.glow = new Glow(this);
        this.hue = new Hue(this);
        this.aim = new Aim(this);
        this.typing = new Typing(this);
        this.achievements = new Achievements(this);
        this.gameIcons = new GameIcons(this);
        this.timeWidget = new TimeWidget(this);

        this.glowEnabled = this.data.glowEnabled !== false;
        document.body.classList.toggle('glow-enabled', this.glowEnabled);
        document.body.classList.toggle('glow-disabled', !this.glowEnabled);

        window.app = this;
        this.init();
    }

    init() {
        this.hud.init();
        this.audio.init();
        this.weather.init();
        this.history.init();
        this.search.updateUI();
        this.background.apply();
        this.groups.render();

        if (this.data.particlesEnabled === false) {
            this.particles.toggle();
        }

        this.glow.randomize();
        this.hue.init();
        this.aim.init();
        this.aim.updateDropdownBest();
        this.typing.init();
        this.typing.updateDropdownBest();
        this.achievements.init();
        this.gameIcons.init();
        this.timeWidget.init();

        this.search.loadReplaceTab();
        this.setupEventListeners();
        this.startVideoTimeSave();
    }

    setupEventListeners() {
        // зарезервировано
    }

    startVideoTimeSave() {
        setInterval(() => {
            const video = document.getElementById('bgVideo');
            if (video && video.style.display !== 'none') {
                this.data.videoCurrentTime = video.currentTime;
            }
        }, 5000);
    }
}

const app = new App();

window.addEventListener('beforeunload', () => {
    app.storage.saveBeforeUnload();
});