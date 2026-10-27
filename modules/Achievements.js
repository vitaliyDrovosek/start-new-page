class Achievements {
    constructor(app) {
        this.app = app;
        this.queue = [];
        this.showing = false;
        this.toastEl = null;
        this.modalEl = null;
        this.boundModalKey = null;

        this.LIST = {
            first_visit: {
                title: 'Первый шаг',
                desc: 'Открыл стартпейдж впервые'
            },
            ten_visits: {
                title: 'Постоянный гость',
                desc: 'Зашёл 10 раз'
            },
            hundred_visits: {
                title: 'Завсегдатай',
                desc: 'Зашёл 100 раз'
            },
            week_streak: {
                title: 'Верный пользователь',
                desc: 'Заходил 7 дней подряд'
            },

            first_palette: {
                title: 'Стилист',
                desc: 'Поменял оттенок сайта'
            },
            rgb_master: {
                title: 'Радужный',
                desc: 'Включил RGB-режим'
            },
            customizer: {
                title: 'Коллекционер тем',
                desc: 'Сохранил 5 палитр'
            },
            glow_off: {
                title: 'Минималист',
                desc: 'Выключил glow-эффект'
            },

            first_search: {
                title: 'Первый поиск',
                desc: 'Что-то нашёл через стартпейдж'
            },
            ten_searches: {
                title: 'Искатель',
                desc: '10 поисков'
            },
            hundred_searches: {
                title: 'Охотник',
                desc: '100 поисков'
            },

            aim_first: {
                title: 'Первая партия',
                desc: 'Сыграл в Aim Trainer'
            },
            aim_10: {
                title: 'Меткий',
                desc: '10 партий в Aim Trainer'
            },
            aim_under_half: {
                title: 'Снайпер',
                desc: 'Среднее время меньше 0.5с'
            },
            aim_perfect: {
                title: 'Без промаха',
                desc: 'Партия в Aim Trainer без промахов'
            },

            typing_first: {
                title: 'Первое слово',
                desc: 'Сыграл в Typing Speed'
            },
            typing_10: {
                title: 'Скоростной',
                desc: '10 партий в Typing Speed'
            },
            typing_40wpm: {
                title: 'Ловкие пальцы',
                desc: '40+ WPM'
            },
            typing_60wpm: {
                title: 'Клавиатурный ниндзя',
                desc: '60+ WPM'
            },
            typing_90acc: {
                title: 'Снайпер клавиатуры',
                desc: '90%+ точности в Typing Speed'
            },

            night_owl: {
                title: 'Полуночник',
                desc: 'Зашёл после 3:00'
            },
            early_bird: {
                title: 'Ранняя пташка',
                desc: 'Зашёл до 6:00'
            },

            all_achievements: {
                title: 'Одержимый',
                desc: 'Собрал все достижения'
            }
        };
    }

    init() {
        this.toastEl = document.getElementById('achievementToast');
        this.modalEl = document.getElementById('achievementsModal');

        document.getElementById('achievementsOpenBtn')?.addEventListener('click', () => this.openModal());
        document.getElementById('achievementsCloseBtn')?.addEventListener('click', () => this.closeModal());

        this.trackVisit();
        this.checkTimeOfDay();
        this.updateDropdownCounter();
    }

    isUnlocked(id) {
        return (this.app.data.achievements || []).includes(id);
    }

    unlock(id) {
        if (!this.LIST[id]) return;
        if (this.isUnlocked(id)) return;

        if (!Array.isArray(this.app.data.achievements)) {
            this.app.data.achievements = [];
        }

        this.app.data.achievements.push(id);
        if (this.app.storage) this.app.storage.save();

        this.enqueue(id);
        this.updateDropdownCounter();

        if (id !== 'all_achievements') {
            const total = Object.keys(this.LIST).length - 1;
            if (this.app.data.achievements.length >= total) {
                this.unlock('all_achievements');
            }
        }
    }

    trackVisit() {
        const today = new Date().toDateString();
        const last = this.app.data.lastVisitDate;

        if (this.app.data.visitsCount === undefined || this.app.data.visitsCount === 0) {
            this.app.data.visitsCount = 1;
            this.unlock('first_visit');
        }

        if (last !== today) {
            const yesterday = new Date(Date.now() - 86400000).toDateString();

            if (last === yesterday) {
                this.app.data.visitStreak = (this.app.data.visitStreak || 0) + 1;
            } else {
                this.app.data.visitStreak = 1;
            }

            this.app.data.lastVisitDate = today;
            this.app.data.visitsCount = (this.app.data.visitsCount || 0) + 1;

            if (this.app.data.visitsCount >= 10) this.unlock('ten_visits');
            if (this.app.data.visitsCount >= 100) this.unlock('hundred_visits');
            if (this.app.data.visitStreak >= 7) this.unlock('week_streak');
        }

        if (this.app.storage) this.app.storage.save();
    }

    checkTimeOfDay() {
        const hour = new Date().getHours();
        if (hour >= 3 && hour < 6) {
            this.unlock('night_owl');
        }
        if (hour >= 4 && hour < 6) {
            this.unlock('early_bird');
        }
    }

    trackSearch() {
        this.app.data.searchCount = (this.app.data.searchCount || 0) + 1;
        if (this.app.data.searchCount === 1) this.unlock('first_search');
        if (this.app.data.searchCount >= 10) this.unlock('ten_searches');
        if (this.app.data.searchCount >= 100) this.unlock('hundred_searches');
        if (this.app.storage) this.app.storage.save();
    }

    trackHueChange() {
        this.app.data.hueChanges = (this.app.data.hueChanges || 0) + 1;
        if (this.app.data.hueChanges >= 1) this.unlock('first_palette');
    }

    trackRgbMode() {
        if (this.app.data.rgbMode) {
            this.unlock('rgb_master');
        }
    }

    trackPaletteSaved() {
        const count = (this.app.data.savedPalettes || []).length;
        if (count >= 5) this.unlock('customizer');
    }

    trackGlowOff(enabled) {
        if (!enabled) this.unlock('glow_off');
    }

    trackAimGame(stats) {
        this.app.data.aimGames = (this.app.data.aimGames || 0) + 1;
        if (this.app.data.aimGames === 1) this.unlock('aim_first');
        if (this.app.data.aimGames >= 10) this.unlock('aim_10');
        if (stats.avgWithPenalty < 0.5) this.unlock('aim_under_half');
        if (stats.misses === 0) this.unlock('aim_perfect');
        if (this.app.storage) this.app.storage.save();
    }

    trackTypingGame(stats) {
        this.app.data.typingGames = (this.app.data.typingGames || 0) + 1;
        if (this.app.data.typingGames === 1) this.unlock('typing_first');
        if (this.app.data.typingGames >= 10) this.unlock('typing_10');
        if (stats.wpm >= 40) this.unlock('typing_40wpm');
        if (stats.wpm >= 60) this.unlock('typing_60wpm');
        if (stats.accuracy >= 90) this.unlock('typing_90acc');
        if (this.app.storage) this.app.storage.save();
    }

    enqueue(id) {
        this.queue.push(id);
        if (!this.showing) this.showNext();
    }

    showNext() {
        if (this.queue.length === 0) {
            this.showing = false;
            return;
        }

        this.showing = true;
        const id = this.queue.shift();
        const data = this.LIST[id];

        if (!this.toastEl) {
            this.showNext();
            return;
        }

        const titleEl = this.toastEl.querySelector('.achievement-toast-title');
        const descEl = this.toastEl.querySelector('.achievement-toast-desc');

        if (titleEl) titleEl.textContent = data.title;
        if (descEl) descEl.textContent = data.desc;

        this.toastEl.classList.add('visible');
        this.playSound();

        const progress = this.toastEl.querySelector('.achievement-toast-progress');
        if (progress) {
            progress.style.transition = 'none';
            progress.style.width = '100%';
            void progress.offsetWidth;
            progress.style.transition = 'width 5s linear';
            progress.style.width = '0%';
        }

        setTimeout(() => {
            this.toastEl.classList.remove('visible');
            setTimeout(() => this.showNext(), 400);
        }, 5000);
    }

    playSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(660, ctx.currentTime);
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);

            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
        } catch {

        }
    }

    openModal() {
        if (!this.modalEl) return;
        this.renderModal();
        this.modalEl.classList.add('visible');
        this.boundModalKey = (e) => {
            if (e.key === 'Escape') this.closeModal();
        };
        document.addEventListener('keydown', this.boundModalKey);
    }

    closeModal() {
        if (!this.modalEl) return;
        this.modalEl.classList.remove('visible');
        if (this.boundModalKey) {
            document.removeEventListener('keydown', this.boundModalKey);
        }
    }

    renderModal() {
        const grid = this.modalEl.querySelector('.achievements-grid');
        const counter = this.modalEl.querySelector('.achievements-counter');
        if (!grid) return;

        const unlocked = this.app.data.achievements || [];
        const total = Object.keys(this.LIST).length;

        if (counter) {
            counter.textContent = `${unlocked.length} / ${total}`;
        }

        grid.innerHTML = '';

        Object.entries(this.LIST).forEach(([id, data]) => {
            const isUnlocked = unlocked.includes(id);

            const card = document.createElement('div');
            card.className = 'achievement-card' + (isUnlocked ? ' unlocked' : ' locked');

            card.innerHTML = `
                <div class="achievement-card-title">${data.title}</div>
                <div class="achievement-card-desc">${data.desc}</div>
                <div class="achievement-card-status">${isUnlocked ? 'Получено' : 'Заблокировано'}</div>
            `;

            grid.appendChild(card);
        });
    }

    updateDropdownCounter() {
        const el = document.getElementById('achievementsCounter');
        if (!el) return;
        const unlocked = (this.app.data.achievements || []).length;
        const total = Object.keys(this.LIST).length;
        el.textContent = `${unlocked} / ${total}`;
    }
}

export default Achievements;