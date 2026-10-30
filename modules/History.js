class History {
    constructor(app) {
        this.app = app;
        this.input = null;
        this.container = null;
        this.indicator = null;

        this._boundDocMouseDown = this._onDocMouseDown.bind(this);
        this._boundDocMouseUp = this._onDocMouseUp.bind(this);
    }

    init() {
        this.input = document.getElementById('searchInput');
        this.container = document.getElementById('searchHistory');
        this.indicator = document.getElementById('historyIndicator');

        this.setupEventListeners();
        this.updateIndicator();
    }

    setupEventListeners() {
        if (this.input) {
            this.input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                    return;
                }
                if (e.key === 'ArrowDown' && this.container?.classList.contains('show')) {
                    e.preventDefault();
                    const first = this.container.querySelector('.history-item');
                    if (first) first.focus();
                }
            });

            this.input.addEventListener('focus', () => {
                this.render();
                this.show();
            });

            this.input.addEventListener('input', () => {
                this.render();
                this.show();
            });
        }

        document.addEventListener('mousedown', this._boundDocMouseDown, true);
        document.addEventListener('mouseup', this._boundDocMouseUp, true);
    }

    _isInside(target) {
        return !!(
            this.input?.contains(target) ||
            this.container?.contains(target) ||
            document.getElementById('calcResult')?.contains(target)
        );
    }

    _onDocMouseDown(e) {
        this._downInside = this._isInside(e.target);
    }

    _onDocMouseUp(e) {
        if (!this._downInside && !this._isInside(e.target)) {
            this.hide();
        }
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
        if (!this.app.data.historyEnabled) return;
        const q = query?.trim();
        if (!q) return;

        const list = Array.isArray(this.app.data.searchHistory)
            ? this.app.data.searchHistory
            : (this.app.data.searchHistory = []);

        
        const filtered = list.filter(item => item?.query !== q);
        filtered.unshift({ query: q, timestamp: Date.now() });
        if (filtered.length > 20) filtered.length = 20;

        this.app.data.searchHistory = filtered;
        this.app.storage.save();
        this.render();
    }

    remove(item) {
        const list = this.app.data.searchHistory;
        if (!Array.isArray(list)) return;
        const idx = list.indexOf(item);
        if (idx === -1) return;
        list.splice(idx, 1);
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

        const list = this.app.data.searchHistory;
        if (!Array.isArray(list) || list.length === 0) {
            this.container.replaceChildren();
            return;
        }

        const fragment = document.createDocumentFragment();

        for (const item of list) {
            if (!item?.query) continue;

            const date = new Date(item.timestamp || Date.now());
            const hh = String(date.getHours()).padStart(2, '0');
            const mm = String(date.getMinutes()).padStart(2, '0');

            const row = document.createElement('div');
            row.className = 'history-item';
            row.tabIndex = -1;  

            const text = document.createElement('span');
            text.className = 'history-text';
            text.textContent = item.query;

            const time = document.createElement('span');
            time.className = 'history-time';
            time.textContent = `${hh}:${mm}`;

            const del = document.createElement('span');
            del.className = 'history-delete';
            del.textContent = '✕';

            row.append(text, time, del);

            
            row.addEventListener('click', (e) => {
                if (e.target === del) return; 
                this.use(item.query);
            });

            
            del.addEventListener('click', (e) => {
                e.stopPropagation();
                this.remove(item);
            });

            fragment.appendChild(row);
        }

        
        const clearBtn = document.createElement('div');
        clearBtn.className = 'history-clear';
        clearBtn.textContent = 'Очистить историю';
        clearBtn.addEventListener('click', () => this.clear());
        fragment.appendChild(clearBtn);

        this.container.replaceChildren(fragment);
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
        if (this.container) this.container.classList.remove('show');
        document.getElementById('calcResult')?.classList.remove('visible');
    }

    performSearch(query) {
        if (!query?.trim()) return;
        this.add(query);
        this.app.search.search(query);
    }
}

export default History;