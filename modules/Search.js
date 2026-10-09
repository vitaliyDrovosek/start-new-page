class Search {
    constructor(app) {
        this.app = app;
        this.replaceTab = true;
    }

    setEngine(engine) {
        if (this.app.searchEngines[engine]) {
            this.app.data.searchEngine = engine;
            this.app.storage.save();
            this.updateUI();
        }
    }

    toggleOpenMethod() {
        this.replaceTab = !this.replaceTab;
        this.app.data.replaceTab = this.replaceTab;
        this.app.storage.save();
        this.updateOpenMethodIndicator();
    }

    updateOpenMethodIndicator() {
        const indicator = document.getElementById('openMethodIndicator');
        if (indicator) {
            indicator.classList.toggle('off', !this.replaceTab);
        }
    }

    loadReplaceTab() {
        this.replaceTab = this.app.data?.replaceTab ?? true;
        this.updateOpenMethodIndicator();
    }

    search(query) {
        if (!query?.trim()) return;

        const engine = this.app.searchEngines[this.app.data.searchEngine];
        const url = engine.url + encodeURIComponent(query);

        this.app.history?.add(query);
        this.app.achievements?.trackSearch();

        if (this.replaceTab) {
            window.location.href = url;
        } else {
            window.open(url, '_blank');
        }
    }

    updateUI() {
        const engine = this.app.searchEngines[this.app.data.searchEngine];
        const input = document.getElementById('searchInput');
        if (input) {
            input.placeholder = `Поиск в ${engine.name}...`;
        }

        document.querySelectorAll('.dropdown-item.active').forEach(item => {
            item.classList.remove('active');
        });
        document.getElementById(`engine${engine.name}`)?.classList.add('active');
    }
}

export default Search;