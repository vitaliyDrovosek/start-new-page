class Countdown {
    constructor(app) {
        this.app = app;
        this.container = null;
        this.enabled = false;
        this.pinned = false;
        this.interval = null;
    }

    init() {
        this.container = document.getElementById('countdownWidget');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'countdownWidget';
            this.container.className = 'countdown-widget';

            const groups = document.getElementById('groups');
            if (groups && groups.parentNode) {
                groups.parentNode.insertBefore(this.container, groups.nextSibling);
            } else {
                document.body.appendChild(this.container);
            }
        }

        this.enabled = this.app.data.countdownEnabled === true;
        this.pinned = this.app.data.countdownPinned === true;
        this.updateVisibility();
        this.render();
        this.updateIndicator();
        this.startTick();
    }

    updateVisibility() {
        if (!this.container) return;
        this.container.classList.toggle('visible', this.enabled);
    }

    togglePin() {
        this.pinned = !this.pinned;
        this.app.data.countdownPinned = this.pinned;
        this.updatePinIndicator();
        this.app.storage.save();
        this.render();
    }

    updatePinIndicator() {
        const indicator = document.getElementById('countdownPinIndicator');
        if (indicator) indicator.classList.toggle('off', !this.pinned);
    }

        updateIndicator() {
        const indicator = document.getElementById('countdownIndicator');
        if (indicator) indicator.classList.toggle('off', !this.enabled);
    }

    toggle() {
        this.enabled = !this.enabled;
        this.app.data.countdownEnabled = this.enabled;
        this.updateVisibility();
        this.updateIndicator();
        this.app.storage.save();
    }



    getEvents() {
        if (!Array.isArray(this.app.data.countdownEvents)) {
            this.app.data.countdownEvents = [];
        }
        return this.app.data.countdownEvents;
    }

    genId() {
        return 'cd_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    }

    addEvent() {
        const name = prompt('Название события:');
        if (!name) return;
        const dateStr = prompt('Дата (в формате ГГГГ-ММ-ДД):');
        if (!dateStr) return;

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            alert('Неверный формат даты. Используй ГГГГ-ММ-ДД');
            return;
        }

        const events = this.getEvents();
        events.push({
            id: this.genId(),
            name: name,
            date: date.getTime(),
            createdAt: Date.now()
        });
        this.app.storage.save();
        this.render();
    }

    deleteEvent(id) {
        const events = this.getEvents();
        const idx = events.findIndex(e => e.id === id);
        if (idx === -1) return;
        events.splice(idx, 1);
        this.app.storage.save();
        this.render();
    }



    render() {
        if (!this.container) return;
        const events = this.getEvents();

        if (!this.enabled) {
            this.container.innerHTML = '';
            return;
        }

        let html = '<div class="countdown-title">Счётчик дней</div>';

        if (events.length === 0) {
            html += '<div class="countdown-empty">Пока нет событий</div>';
        } else {
            const sorted = [...events].sort((a, b) => a.date - b.date);
            html += '<div class="countdown-list">';
            sorted.forEach(ev => {
                const days = this.daysUntil(ev.date);
                const isPast = days < 0;
                const absDays = Math.abs(days);
                const label = isPast ? 'прошло' : 'осталось';
                const dateStr = new Date(ev.date).toLocaleDateString('ru-RU', {
                    day: '2-digit', month: '2-digit', year: 'numeric'
                });

                html += `
                    <div class="countdown-item ${isPast ? 'past' : ''}" data-id="${ev.id}">
                        <div class="countdown-item-info">
                            <div class="countdown-item-name">${this.escapeHtml(ev.name)}</div>
                            <div class="countdown-item-date">${dateStr}</div>
                        </div>
                        <div class="countdown-item-days">
                            <span class="countdown-days-num">${absDays}</span>
                            <span class="countdown-days-label">${isPast ? 'дн. назад' : 'дн.'}</span>
                        </div>
                        ${this.pinned ? '' : '<button class="countdown-delete" title="Удалить">✕</button>'}
                    </div>
                `;
            });
            html += '</div>';
        }

        this.container.innerHTML = html;


        this.container.querySelectorAll('.countdown-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.closest('.countdown-item').dataset.id;
                this.deleteEvent(id);
            });
        });
    }

    startTick() {
        if (this.interval) clearInterval(this.interval);

        this.interval = setInterval(() => {
            if (this.enabled) this.render();
        }, 3600000);
    }



    daysUntil(timestamp) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const target = new Date(timestamp);
        target.setHours(0, 0, 0, 0);
        const diff = target - now;
        return Math.round(diff / 86400000);
    }

    escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
}

export default Countdown;
