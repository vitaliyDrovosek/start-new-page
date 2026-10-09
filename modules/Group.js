import Favicon from './Favicon.js';

class Groups {
    constructor(app) {
        this.app = app;
    }

    isLocked() {
        return this.app.data.groupsLocked === true;
    }

    render() {
        const container = document.getElementById("groups");
        if (!container) return;

        container.innerHTML = "";

        const locked = this.isLocked();

        this.app.data.groups.forEach((group, gi) => {
            const div = document.createElement("div");
            div.className = "group";
            div.classList.toggle("locked", locked);

            div.onclick = (e) => {
                if (e.target.tagName === 'A' ||
                    (e.target.tagName === 'SPAN' && e.target.textContent === '✕') ||
                    e.target === title.children[0]) {
                    return;
                }
                if (locked) return;
                this.addTab(gi);
            };

            const title = document.createElement("div");
            title.className = "group-title";

            title.innerHTML = locked
                ? `<span>${group.name}</span>`
                : `<span>${group.name}</span><span>✕</span>`;

            title.children[0].onclick = (e) => {
                e.stopPropagation();
                if (locked) return;
                const n = prompt("Новое имя группы:", group.name);
                if (n) { group.name = n; this.app.storage.save(); this.render(); }
            };

            if (!locked && title.children[1]) {
                title.children[1].onclick = (e) => {
                    e.stopPropagation();
                    this.app.data.groups.splice(gi, 1);
                    this.app.storage.save();
                    this.render();
                };
            }
            div.appendChild(title);

            group.links.forEach(link => {
                const a = document.createElement("a");
                a.className = "link";
                a.href = link.url;
                a.target = "";

                const text = document.createElement("span");
                text.className = "link-text";
                text.textContent = link.customName || link.name;
                a.appendChild(text);

                const fav = Favicon.createImg(link.url, 16, 'link-favicon');
                if (fav) a.appendChild(fav);

                if (!locked) {
                    a.oncontextmenu = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const display = prompt("Отображаемое имя:", link.customName || link.name);
                        const real = prompt("URL:", link.url);
                        if (display && real) {
                            link.customName = display;
                            link.url = real;
                            this.app.storage.save();
                            this.render();
                        }
                    };
                } else {
                    a.oncontextmenu = null;
                }

                div.appendChild(a);
            });

            container.appendChild(div);
        });
    }

    add() {
        if (this.isLocked()) {
            alert("Группы заблокированы. Отключите блокировку в настройках.");
            return;
        }
        const name = prompt("Название группы:");
        if (name) {
            this.app.data.groups.push({ name: name, links: [] });
            this.app.storage.save();
            this.render();
        }
    }

    addTab(groupIndex) {
        if (this.isLocked()) return;
        const display = prompt("Отображаемое имя:");
        if (!display) return;
        const url = prompt("URL:");
        if (!url) return;
        this.app.data.groups[groupIndex].links.push({ customName: display, url: url });
        this.app.storage.save();
        this.render();
    }
}

export default Groups;