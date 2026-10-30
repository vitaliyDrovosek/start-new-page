import Favicon from './Favicon.js';

class Groups {
    constructor(app) {
        this.app = app;
        this._container = null;
    }

    isLocked() {
        return this.app.data.groupsLocked === true;
    }

    _getGroups() {
        if (!Array.isArray(this.app.data.groups)) {
            this.app.data.groups = [];
        }
        return this.app.data.groups;
    }

    render() {
        const container = document.getElementById('groups');
        if (!container) return;
        this._container = container;

        const locked = this.isLocked();
        const groups = this._getGroups();

        const fragment = document.createDocumentFragment();

        groups.forEach((group, gi) => {
            fragment.appendChild(this._renderGroup(group, gi, locked));
        });

        container.replaceChildren(fragment);
    }

    _renderGroup(group, gi, locked) {
        const div = document.createElement('div');
        div.className = 'group';
        div.classList.toggle('locked', locked);

        
        const title = document.createElement('div');
        title.className = 'group-title';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = group.name || '(без имени)';
        title.appendChild(nameSpan);

        
        nameSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            if (locked) return;
            const n = prompt('Новое имя группы:', group.name || '');
            if (n && n.trim()) {
                group.name = n.trim();
                this.app.storage.save();
                this.render();
            }
        });

        
        if (!locked) {
            const delSpan = document.createElement('span');
            delSpan.textContent = '✕';
            delSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!confirm(`Удалить группу «${group.name || '(без имени)'}»?`)) return;
                this._getGroups().splice(gi, 1);
                this.app.storage.save();
                this.render();
            });
            title.appendChild(delSpan);
        }

        div.appendChild(title);

        
        div.addEventListener('click', (e) => {
            if (locked) return;
            
            if (e.target.closest('a') || e.target.closest('.group-title')) return;
            this.addTab(gi);
        });

        
        (group.links || []).forEach((link) => {
            div.appendChild(this._renderLink(link, locked));
        });

        return div;
    }

    _renderLink(link, locked) {
        const a = document.createElement('a');
        a.className = 'link';
        a.href = link.url || '#';
        a.target = '';

        const text = document.createElement('span');
        text.className = 'link-text';
        text.textContent = link.customName || link.name || link.url || '(без имени)';
        a.appendChild(text);

        const fav = Favicon.createImg(link.url, 16, 'link-favicon');
        if (fav) a.appendChild(fav);

        if (!locked) {
            a.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const display = prompt('Отображаемое имя:', link.customName || link.name || '');
                if (display === null) return; 
                link.customName = display.trim() || link.customName;

                const real = prompt('URL:', link.url || '');
                if (real === null) return; 
                if (real.trim()) link.url = real.trim();

                this.app.storage.save();
                this.render();
            });
        }

        return a;
    }

    add() {
        if (this.isLocked()) {
            alert('Группы заблокированы. Отключите блокировку в настройках.');
            return;
        }
        const name = prompt('Название группы:');
        if (!name || !name.trim()) return;

        this._getGroups().push({ name: name.trim(), links: [] });
        this.app.storage.save();
        this.render();
    }

    addTab(groupIndex) {
        if (this.isLocked()) return;

        const groups = this._getGroups();
        const group = groups[groupIndex];
        if (!group) return;

        const display = prompt('Отображаемое имя:');
        if (!display || !display.trim()) return;

        const url = prompt('URL:');
        if (!url || !url.trim()) return;

        if (!Array.isArray(group.links)) group.links = [];
        group.links.push({ customName: display.trim(), url: url.trim() });

        this.app.storage.save();
        this.render();
    }
}

export default Groups;