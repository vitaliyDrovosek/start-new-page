class Particles {
    constructor(savedSettings = null) {
        this.canvas = document.getElementById('particles');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.enabled = true;
        this.animationFrame = null;
        this.stars = [];
        this.mouseX = -10000;
        this.mouseY = -10000;
        this.mouseActive = false;

        this.loadSettings(savedSettings);

        // Автоснижение на мобилке
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (isMobile) {
            if (this.STAR_COUNT > 30) {
                this.STAR_COUNT = Math.max(20, Math.floor(this.STAR_COUNT / 2));
            }
            this.LINE_DISTANCE = Math.min(this.LINE_DISTANCE, 100);
        }

        this.init();
        this.bindEvents();
        this.animate();

        window.toggleParticlesSettings = () => this.toggleSettings();
        window.resetParticlesSettings = () => this.resetSettings();
        window.saveParticlesSettings = () => this.saveSettings();
    }

    loadSettings(savedSettings) {
        const defaultSettings = {
            STAR_COUNT: 50,
            REPEL_FORCE: 0.3,
            REPEL_RADIUS: 200,
            BASE_SPEED: 0.15,
            BOUNCE: 0.2,
            LINE_DISTANCE: 150,
            OVERLAP_DISTANCE: 5,
            PARTICLE_REPEL_FORCE: 0.01,
            PARTICLE_REPEL_RADIUS: 60
        };

        Object.assign(this, defaultSettings, savedSettings);
    }

    init() {
        this.resize();
        this.stars = Array.from({ length: this.STAR_COUNT }, () =>
            this.createStar(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height
            )
        );
    }

    createStar(x, y) {
        return {
            x, y,
            vx: (Math.random() - 0.5) * this.BASE_SPEED * 1.2,
            vy: (Math.random() - 0.5) * this.BASE_SPEED * 1.2,
            size: 1.5 + Math.random() * 3.0,
            opacity: 0.4 + Math.random() * 0.6
        };
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());

        document.addEventListener('mousemove', (e) => {
            if (!this.enabled) return;

            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;

            this.mouseX = (e.clientX - rect.left) * scaleX;
            this.mouseY = (e.clientY - rect.top) * scaleY;
            this.mouseActive = true;
        });

        document.addEventListener('mouseleave', () => {
            this.mouseActive = false;
        });

        document.addEventListener('touchmove', (e) => {
            if (!this.enabled || !e.touches.length) return;

            // Не блокируем скролл в скроллируемых зонах
            const target = e.target;
            const scrollable = target.closest(
                '.dropdown-menu, .search-history, .particles-settings-content, ' +
                '.achievements-modal, .tw-laps, .aim-overlay, .typing-field, .groups'
            );

            if (!scrollable) {
                e.preventDefault();
            }

            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;

            this.mouseX = (e.touches[0].clientX - rect.left) * scaleX;
            this.mouseY = (e.touches[0].clientY - rect.top) * scaleY;
            this.mouseActive = true;
        }, { passive: false });

        document.addEventListener('touchend', () => {
            this.mouseActive = false;
        });
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    update() {
        if (!this.enabled) return;

        for (let i = 0; i < this.stars.length; i++) {
            const s = this.stars[i];

            s.x += s.vx;
            s.y += s.vy;

            s.vx *= 0.998;
            s.vy *= 0.998;

            if (this.mouseActive) {
                const dx = s.x - this.mouseX;
                const dy = s.y - this.mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;

                if (dist < this.REPEL_RADIUS) {
                    const force = this.REPEL_FORCE * (1 - dist / this.REPEL_RADIUS) * 0.1;
                    s.vx += dx * force;
                    s.vy += dy * force;
                }
            }

            if (s.x < 0) {
                s.x = 0;
                s.vx *= -this.BOUNCE;
            } else if (s.x > this.canvas.width) {
                s.x = this.canvas.width;
                s.vx *= -this.BOUNCE;
            }

            if (s.y < 0) {
                s.y = 0;
                s.vy *= -this.BOUNCE;
            } else if (s.y > this.canvas.height) {
                s.y = this.canvas.height;
                s.vy *= -this.BOUNCE;
            }

            if (Math.random() < 0.005) {
                s.vx += (Math.random() - 0.5) * 0.05;
                s.vy += (Math.random() - 0.5) * 0.05;
            }
        }

        this.repelParticles();
    }

    draw() {
        if (!this.enabled || !this.ctx || !this.canvas) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#3b82f6';

        for (let i = 0; i < this.stars.length; i++) {
            const s1 = this.stars[i];

            for (let j = i + 1; j < this.stars.length; j++) {
                const s2 = this.stars[j];

                const dx = s1.x - s2.x;
                const dy = s1.y - s2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.LINE_DISTANCE && dist > this.OVERLAP_DISTANCE) {
                    const lineOpacity = 0.3 * (1 - dist / this.LINE_DISTANCE);

                    this.ctx.beginPath();
                    this.ctx.moveTo(s1.x, s1.y);
                    this.ctx.lineTo(s2.x, s2.y);
                    this.ctx.strokeStyle = `rgba(59, 130, 246, ${lineOpacity})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        }

        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#3b82f6';

        for (const s of this.stars) {
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.size * 0.7, 0, 2 * Math.PI);
            this.ctx.fillStyle = `rgba(59, 130, 246, ${s.opacity})`;
            this.ctx.fill();
        }

        this.ctx.shadowBlur = 0;
    }

    animate() {
        if (this.enabled) {
            this.update();
            this.draw();
            this.canvas.style.display = 'block';
        } else if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.canvas.style.display = 'none';
        }

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    toggle() {
        this.enabled = !this.enabled;

        const indicator = document.getElementById('particlesIndicator');
        if (indicator) {
            indicator.classList.toggle('off', !this.enabled);
        }

        if (this.enabled && this.stars.length === 0) {
            this.init();
            this.resize();
        }

        if (window.app) window.app.storage.save();
    }

    repelParticles() {
        if (!this.enabled) return;

        for (let i = 0; i < this.stars.length; i++) {
            for (let j = i + 1; j < this.stars.length; j++) {
                const s1 = this.stars[i];
                const s2 = this.stars[j];

                const dx = s1.x - s2.x;
                const dy = s1.y - s2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.PARTICLE_REPEL_RADIUS && dist > 0) {
                    const force = this.PARTICLE_REPEL_FORCE * (1 - dist / this.PARTICLE_REPEL_RADIUS);
                    const nx = dx / dist;
                    const ny = dy / dist;

                    s1.vx += nx * force;
                    s1.vy += ny * force;
                    s2.vx -= nx * force;
                    s2.vy -= ny * force;
                }
            }
        }
    }

    updateSetting(setting, value) {
        this[setting] = value;

        if (setting === 'STAR_COUNT') {
            this.init();
        }

        const settingId = setting.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        const valueSpan = document.getElementById(settingId + 'Value');
        if (valueSpan) {
            valueSpan.textContent = value;
        }
    }

    updateSettings(settings) {
        const changed = settings.STAR_COUNT !== undefined && settings.STAR_COUNT !== this.STAR_COUNT;

        Object.assign(this, settings);

        if (changed) this.init();

        if (window.app?.data) {
            window.app.data.particlesSettings = { ...settings };
        }
    }

    toggleSettings() {
        const panel = document.getElementById('particlesSettingsPanel');
        const dropdownMenu = document.getElementById('dropdownMenu');
        if (!panel) return;

        panel.classList.toggle('visible');

        if (panel.classList.contains('visible')) {
            dropdownMenu.classList.add('panel-open');
            this.setupSettingsListeners();
            this.updateSettingsPanel();

            setTimeout(() => {
                document.addEventListener('click', this.closeSettingsHandler);
            }, 100);
        } else {
            dropdownMenu.classList.remove('panel-open');
            this.removeSettingsListeners();
            document.removeEventListener('click', this.closeSettingsHandler);
        }
    }

    setupSettingsListeners() {
        const settings = [
            { id: 'starCount', setting: 'STAR_COUNT', type: 'int' },
            { id: 'repelForce', setting: 'REPEL_FORCE', type: 'float' },
            { id: 'repelRadius', setting: 'REPEL_RADIUS', type: 'int' },
            { id: 'baseSpeed', setting: 'BASE_SPEED', type: 'float' },
            { id: 'bounce', setting: 'BOUNCE', type: 'float' },
            { id: 'lineDistance', setting: 'LINE_DISTANCE', type: 'int' },
            { id: 'overlapDistance', setting: 'OVERLAP_DISTANCE', type: 'int' },
            { id: 'particleRepelForce', setting: 'PARTICLE_REPEL_FORCE', type: 'float' },
            { id: 'particleRepelRadius', setting: 'PARTICLE_REPEL_RADIUS', type: 'int' }
        ];

        settings.forEach(({ id, setting, type }) => {
            const input = document.getElementById(id);
            if (input) {
                const handler = (e) => {
                    const value = type === 'int' ? parseInt(e.target.value) : parseFloat(e.target.value);
                    const formattedValue = type === 'float' && id.includes('Force') && id !== 'repelForce'
                        ? value.toFixed(3)
                        : type === 'float' ? value.toFixed(2) : value;

                    document.getElementById(id + 'Value').textContent = formattedValue;
                    this.updateSetting(setting, value);
                };

                input.addEventListener('input', handler);
                input._handler = handler;
            }
        });
    }

    removeSettingsListeners() {
        const inputs = [
            'starCount', 'repelForce', 'repelRadius', 'baseSpeed',
            'bounce', 'lineDistance', 'overlapDistance',
            'particleRepelForce', 'particleRepelRadius'
        ];

        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input && input._handler) {
                input.removeEventListener('input', input._handler);
                delete input._handler;
            }
        });
    }

    closeSettingsHandler = (e) => {
        const panel = document.getElementById('particlesSettingsPanel');
        const dropdownMenu = document.getElementById('dropdownMenu');
        const settingsButton = document.querySelector('.dropdown-item[onclick="toggleParticlesSettings()"]');

        if (settingsButton?.contains(e.target)) return;

        if (panel?.classList.contains('visible') &&
            !panel.contains(e.target) &&
            dropdownMenu?.classList.contains('show') &&
            !dropdownMenu.contains(e.target)) {
            panel.classList.remove('visible');
            dropdownMenu.classList.remove('panel-open');
            this.removeSettingsListeners();
            document.removeEventListener('click', this.closeSettingsHandler);
        }
    }

    updateSettingsPanel() {
        const settings = [
            { id: 'starCount', value: this.STAR_COUNT },
            { id: 'repelForce', value: this.REPEL_FORCE, format: (v) => v.toFixed(2) },
            { id: 'repelRadius', value: this.REPEL_RADIUS },
            { id: 'baseSpeed', value: this.BASE_SPEED, format: (v) => v.toFixed(2) },
            { id: 'bounce', value: this.BOUNCE, format: (v) => v.toFixed(2) },
            { id: 'lineDistance', value: this.LINE_DISTANCE },
            { id: 'overlapDistance', value: this.OVERLAP_DISTANCE },
            { id: 'particleRepelForce', value: this.PARTICLE_REPEL_FORCE, format: (v) => v.toFixed(3) },
            { id: 'particleRepelRadius', value: this.PARTICLE_REPEL_RADIUS }
        ];

        settings.forEach(({ id, value, format }) => {
            const input = document.getElementById(id);
            const valueSpan = document.getElementById(id + 'Value');

            if (input) input.value = value;
            if (valueSpan) {
                valueSpan.textContent = format ? format(value) : value;
            }
        });
    }

    resetSettings() {
        const defaultSettings = {
            STAR_COUNT: 50,
            REPEL_FORCE: 0.3,
            REPEL_RADIUS: 200,
            BASE_SPEED: 0.15,
            BOUNCE: 0.2,
            LINE_DISTANCE: 150,
            OVERLAP_DISTANCE: 5,
            PARTICLE_REPEL_FORCE: 0.01,
            PARTICLE_REPEL_RADIUS: 60
        };

        Object.assign(this, defaultSettings);
        this.init();
        this.updateSettingsPanel();

        if (window.app?.data) {
            window.app.data.particlesSettings = { ...defaultSettings };
        }
    }

    saveSettings() {
        if (window.app) {
            window.app.storage.save();
        }
        this.toggleSettings();
    }
}

export default Particles;