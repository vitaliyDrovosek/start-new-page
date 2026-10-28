import SearchPhrases from './SearchPhrases.js';

class Search {
    constructor(app) {
        this.app = app;
        this.replaceTab = app?.data?.replaceTab ?? true;
        this.phrases = new SearchPhrases();
    }

    _getEngineName() {
        const name = this.app.data.searchEngine;
        return this.app.searchEngines[name] ? name : 'yandex';
    }

    setEngine(engine) {
        if (!this.app.searchEngines[engine]) return;
        if (this.app.data.searchEngine === engine) return;

        this.app.data.searchEngine = engine;
        this.app.storage.save();
        this.updateUI();
    }

    toggleOpenMethod() {
        this.replaceTab = !this.replaceTab;
        this.app.data.replaceTab = this.replaceTab;
        this.app.storage.save();
        this.updateOpenMethodIndicator();
    }

    updateOpenMethodIndicator() {
        const indicator = document.getElementById('openMethodIndicator');
        if (indicator) indicator.classList.toggle('off', !this.replaceTab);
    }

    loadReplaceTab() {
        this.replaceTab = this.app.data?.replaceTab ?? true;
        this.updateOpenMethodIndicator();
    }

    search(query) {
        const q = query?.trim();
        if (!q) return;

        const engineName = this._getEngineName();
        const engine = this.app.searchEngines[engineName];
        const url = engine.url + encodeURIComponent(q);

        this.app.history?.add(q);
        this.app.achievements?.trackSearch();

        if (this.replaceTab) window.location.href = url;
        else window.open(url, '_blank');
    }

    updateUI() {
        const engineName = this._getEngineName();
        const engine = this.app.searchEngines[engineName];

        const input = document.getElementById('searchInput');
        if (input) input.placeholder = this.phrases.getRandom();

        document.querySelectorAll('.dropdown-item.active').forEach(item => item.classList.remove('active'));
        document.getElementById(`engine${engine.name}`)?.classList.add('active');

        this.updateOpenMethodIndicator();
    }
}

export default Search;