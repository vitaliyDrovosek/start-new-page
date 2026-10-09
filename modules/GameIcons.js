class GameIcons {
    constructor(app) {
        this.app = app;
        this.panel = null;
    }

    init() {
        this.panel = document.getElementById('gameIcons');
        if (!this.panel) return;

        this.updateVisibility();

        document.getElementById('gameIconAim')
            ?.addEventListener('click', () => this.app.aim.open());
        document.getElementById('gameIconTyping')
            ?.addEventListener('click', () => this.app.typing.open());
    }

    updateVisibility() {
        if (!this.panel) return;
        this.panel.classList.toggle('visible', this.app.data.gameIconsEnabled === true);
    }

    toggle() {
        this.app.data.gameIconsEnabled = !this.app.data.gameIconsEnabled;
        this.updateVisibility();
        this.updateIndicator();
        this.app.storage.save();
    }

    updateIndicator() {
        const indicator = document.getElementById('gameIconsIndicator');
        if (indicator) {
            indicator.classList.toggle('off', !this.app.data.gameIconsEnabled);
        }
    }
}

export default GameIcons;