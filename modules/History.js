class History {
    constructor(app) {
        this.app = app;
        this.input = document.getElementById('searchInput');
        this.container = document.getElementById('searchHistory');
        this.indicator = document.getElementById('historyIndicator');

        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.input) {
            this.input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") this.performSearch(e.target.value);
            });

            this.input.addEventListener("focus", () => {
                this.render();
                this.show();
            });

            this.input.addEventListener("input", () => {
                this.render();
                this.show();
            });

            this.input.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowDown' && this.container?.classList.contains('show')) {
                    e.preventDefault();
                    const items = this.container.querySelectorAll('.history-item');
                    if (items.length > 0) items[0].focus();
                }
            });
        }

        let _downInside = false;
        document.addEventListener('mousedown', (e) => {
            _downInside = !!(
                this.input?.contains(e.target) ||
                this.container?.contains(e.target) ||
                document.getElementById('calcResult')?.contains(e.target)
            );
        }, true);

        document.addEventListener('mouseup', (e) => {
            const isInside = !!(
                this.input?.contains(e.target) ||
                this.container?.contains(e.target) ||
                document.getElementById('calcResult')?.contains(e.target)
            );
            if (!_downInside && !isInside) {
                this.hide();
            }
        }, true);
    }

    init() {
        this.updateIndicator();
    }

    updateIndicator() {
        if (this.indicator) {
            this.indicator.classList.toggle('off', !this.app.data.historyEnabled);
        }
    }

    toggle() {
        this.app.data.historyEnabled = !this.app.data.historyEnabled;
        this.updateIndicator();
        this.app.storage.save();
        if (!this.app.data.historyEnabled) this.hide();
    }

    add(query) {
        if (!this.app.data.historyEnabled || !query.trim()) return;

        this.app.data.searchHistory = this.app.data.searchHistory.filter(item => item.query !== query);
        this.app.data.searchHistory.unshift({ query, timestamp: Date.now() });
        if (this.app.data.searchHistory.length > 20) this.app.data.searchHistory.pop();

        this.app.storage.save();
        this.render();
    }

    remove(index, event) {
        event.stopPropagation();
        this.app.data.searchHistory.splice(index, 1);
        this.app.storage.save();
        this.render();
    }

    clear() {
        this.app.data.searchHistory = [];
        this.app.storage.save();
        this.render();
        this.hide();
    }

    render() {
        if (!this.container) return;

        if (!this.app.data.searchHistory?.length) {
            this.container.innerHTML = '';
            return;
        }

        let html = '';

        this.app.data.searchHistory.forEach((item, index) => {
            if (!item?.query) return;

            const date = new Date(item.timestamp || Date.now());
            const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            const escapedQuery = item.query.replace(/'/g, "\\'").replace(/"/g, '&quot;');

            html += `
                <div class="history-item" onclick="app.history.use('${escapedQuery}')">
                    <span class="history-text">${item.query}</span>
                    <span class="history-time">${timeStr}</span>
                    <span class="history-delete" onclick="app.history.remove(${index}, event)">✕</span>
                </div>
            `;
        });

        if (this.app.data.searchHistory.length > 0) {
            html += `<div class="history-clear" onclick="app.history.clear()">Очистить историю</div>`;
        }

        this.container.innerHTML = html;
    }

    use(query) {
        if (this.input) this.input.value = query;
        this.hide();
        this.performSearch(query);
    }

    show() {
        if (this.container && this.app.data.historyEnabled && this.app.data.searchHistory?.length > 0) {
            this.container.classList.add('show');
        }
    }

    hide() {
        if (this.container) {
            this.container.classList.remove('show');
        }
        document.getElementById('calcResult')?.classList.remove('visible');
    }

    performSearch(query) {
        if (!query?.trim()) return;
        this.add(query);
        this.app.search.search(query);
    }
}
export default History;
