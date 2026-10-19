class Notes {
    constructor(app) {
        this.app = app;
        this.btn = null;
        this.panel = null;
        this.list = null;
        this.visible = false;
        this.saveTimers = new Map();
        this.emptyNoteIds = new Set();

        // Drag карточек
        this.draggingId = null;
        this.dragEl = null;

        // Флаг: mousedown был внутри панели/кнопки
        this._downInside = false;
    }

    init() {
        this.btn = document.getElementById('notesBtn');
        this.panel = document.getElementById('notesPanel');
        this.list = document.getElementById('notesList');
        if (!this.btn || !this.panel || !this.list) return;

        this.btn.addEventListener('click', () => this.toggle());
        document.getElementById('notesCloseBtn')?.addEventListener('click', () => this.hide());
        document.getElementById('notesAddBtn')?.addEventListener('click', () => this.addNote());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.visible) this.hide();
        });

        window.addEventListener('beforeunload', () => {
            this.flushSaves();
            this.dropEmptyNotes();
        });

        // Enter — создать новую заметку
        this.list.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                const ta = e.target.closest('.note-text');
                if (ta) {
                    e.preventDefault();
                    const id = ta.closest('.note-card')?.dataset.id;
                    if (id) this.updateNoteText(id, ta.value);
                    this.addNote();
                }
            }
        });

        // Drag через делегирование
        this.list.addEventListener('mousedown', (e) => {
            if (e.target.closest('.note-action')) return;
            const header = e.target.closest('.note-card-header');
            if (!header) return;
            const card = header.closest('.note-card');
            if (!card) return;
            this.startDrag(card.dataset.id, e, card);
        });

        this.list.addEventListener('touchstart', (e) => {
            if (e.target.closest('.note-action')) return;
            const header = e.target.closest('.note-card-header');
            if (!header) return;
            const card = header.closest('.note-card');
            if (!card) return;
            this.startDrag(card.dataset.id, e.touches[0], card);
        }, { passive: false });

        // === Закрытие: только если mousedown и mouseup оба вне ===
        document.addEventListener('mousedown', (e) => {
            if (!this.visible) return;
            const el = e.target;
            this._downInside = !!(el.closest && (
                el.closest('#notesPanel') ||
                el.closest('#notesBtn')
            ));
        }, true);

        document.addEventListener('mouseup', (e) => {
            if (!this.visible) return;
            const el = e.target;
            const upInside = !!(el.closest && (
                el.closest('#notesPanel') ||
                el.closest('#notesBtn')
            ));
            // Если drag только что закончился — не закрываем
            if (this._justDragged) {
                this._justDragged = false;
                return;
            }
            if (!this._downInside && !upInside) {
                this.hide();
            }
        }, true);

        this.getNotes();
        this.render();
        this.updateVisibility();
        this.updateIndicator();
    }

    // ============ NOTES ============

    getNotes() {
        if (!Array.isArray(this.app.data.notes)) {
            const old = this.app.data.notes;
            if (typeof old === 'string' && old.trim()) {
                this.app.data.notes = [{ id: this.genId(), text: old, createdAt: Date.now(), pinned: false, order: 0 }];
            } else {
                this.app.data.notes = [];
            }
            this.app.storage.save();
        }
        let migrated = false;
        for (let i = 0; i < this.app.data.notes.length; i++) {
            const n = this.app.data.notes[i];
            if (typeof n.pinned !== 'boolean') { n.pinned = false; migrated = true; }
            if (typeof n.order !== 'number') { n.order = i; migrated = true; }
        }
        if (migrated) this.app.storage.save();
        return this.app.data.notes;
    }

    sortNotes(notes) {
        return [...notes].sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return (a.order ?? 0) - (b.order ?? 0);
        });
    }

    genId() {
        return 'n_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    }

    addNote() {
        const notes = this.getNotes();
        const minOrder = Math.min(0, ...notes.filter(n => !n.pinned).map(n => n.order ?? 0));
        const note = {
            id: this.genId(),
            text: '',
            createdAt: Date.now(),
            pinned: false,
            order: minOrder - 1
        };
        notes.push(note);
        this.emptyNoteIds.add(note.id);
        this.app.storage.save();
        this.render();
        setTimeout(() => {
            const ta = this.list.querySelector(`[data-id="${note.id}"] .note-text`);
            if (ta) { ta.focus(); ta.scrollIntoView({ block: 'nearest' }); }
        }, 50);
    }

    deleteNote(id) {
        const notes = this.getNotes();
        const idx = notes.findIndex(n => n.id === id);
        if (idx === -1) return;
        clearTimeout(this.saveTimers.get(id));
        this.saveTimers.delete(id);
        this.emptyNoteIds.delete(id);

        const card = this.list.querySelector(`[data-id="${id}"]`);
        if (card) card.classList.add('removing');

        setTimeout(() => {
            notes.splice(idx, 1);
            this.app.storage.save();
            this.render();
        }, 180);
    }

    togglePin(id) {
        const notes = this.getNotes();
        const note = notes.find(n => n.id === id);
        if (!note) return;
        note.pinned = !note.pinned;
        note.updatedAt = Date.now();
        this.app.storage.save();
        this.render();
    }

    dropIfEmpty(id) {
        if (!this.emptyNoteIds.has(id)) return;
        const notes = this.getNotes();
        const note = notes.find(n => n.id === id);
        if (!note) return;

        if (!note.text.trim()) {
            clearTimeout(this.saveTimers.get(id));
            this.saveTimers.delete(id);
            this.emptyNoteIds.delete(id);

            const idx = notes.indexOf(note);
            if (idx !== -1) notes.splice(idx, 1);
            this.app.storage.save();
            this.render();
        } else {
            this.emptyNoteIds.delete(id);
        }
    }

    dropEmptyNotes() {
        const notes = this.getNotes();
        const filtered = notes.filter(n => n.text.trim() !== '');
        if (filtered.length !== notes.length) {
            this.app.data.notes = filtered;
            this.app.storage.save();
        }
        this.emptyNoteIds.clear();
    }

    async copyNote(id) {
        const notes = this.getNotes();
        const note = notes.find(n => n.id === id);
        if (!note) return;

        const text = (note.text || '').trim();
        if (!text) { this.flashCopy(id, '×'); return; }

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                this.legacyCopy(text);
            }
            this.flashCopy(id, '✓');
        } catch {
            try { this.legacyCopy(text); this.flashCopy(id, '✓'); }
            catch { this.flashCopy(id, '×'); }
        }
    }

    legacyCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '0';
        ta.style.left = '0';
        ta.style.width = '1px';
        ta.style.height = '1px';
        ta.style.padding = '0';
        ta.style.border = 'none';
        ta.style.outline = 'none';
        ta.style.boxShadow = 'none';
        ta.style.background = 'transparent';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, text.length);

        let ok = false;
        try { ok = document.execCommand('copy'); } catch { ok = false; }

        document.body.removeChild(ta);
        if (!ok) throw new Error('copy failed');
    }

    flashCopy(id, text) {
        const btn = this.list.querySelector(`[data-id="${id}"] .note-copy`);
        if (!btn) return;
        const original = btn.dataset.original || btn.textContent;
        btn.dataset.original = original;
        btn.textContent = text;
        btn.classList.add('flash');
        setTimeout(() => {
            btn.textContent = original;
            btn.classList.remove('flash');
        }, 1000);
    }

    updateNoteText(id, text) {
        const notes = this.getNotes();
        const note = notes.find(n => n.id === id);
        if (!note) return;

        note.text = text;
        note.updatedAt = Date.now();

        if (text.trim() && this.emptyNoteIds.has(id)) {
            this.emptyNoteIds.delete(id);
        }

        clearTimeout(this.saveTimers.get(id));
        this.saveTimers.set(id, setTimeout(() => {
            this.app.storage.save();
            this.saveTimers.delete(id);
        }, 400));
    }

    flushSaves() {
        for (const t of this.saveTimers.values()) clearTimeout(t);
        this.saveTimers.clear();
        this.dropEmptyNotes();
        this.app.storage.save();
    }

    render() {
        if (!this.list) return;
        const notes = this.getNotes();
        const sorted = this.sortNotes(notes);

        if (sorted.length === 0) {
            this.list.innerHTML = '<div class="notes-empty">Пока нет заметок.<br>Нажмите «+», чтобы создать.</div>';
            return;
        }

        this.list.innerHTML = sorted.map(n => `
            <div class="note-card ${n.pinned ? 'pinned' : ''}" data-id="${n.id}">
                <div class="note-card-header">
                    <span class="note-date">${this.formatDate(n.createdAt)}</span>
                    <div class="note-card-actions">
                        <button class="note-action note-pin ${n.pinned ? 'active' : ''}" title="${n.pinned ? 'Открепить' : 'Закрепить'}"><span class="iconify" data-icon="${n.pinned ? 'mdi:pin' : 'mdi:pin-outline'}"></span></button>
                        <button class="note-action note-copy" title="Копировать"><span class="iconify" data-icon="mdi:content-copy"></span></button>
                        <button class="note-action note-delete" title="Удалить"><span class="iconify" data-icon="mdi:trash-can-outline"></span></button>
                    </div>
                </div>
                <textarea class="note-text" placeholder="Текст заметки..." spellcheck="false">${this.escapeHtml(n.text)}</textarea>
            </div>
        `).join('');

        this.list.querySelectorAll('.note-card').forEach(card => {
            const id = card.dataset.id;
            const ta = card.querySelector('.note-text');
            const pinBtn = card.querySelector('.note-pin');
            const copyBtn = card.querySelector('.note-copy');
            const delBtn = card.querySelector('.note-delete');

            ta?.addEventListener('input', () => this.updateNoteText(id, ta.value));
            ta?.addEventListener('blur', () => { if (!ta.value.trim()) this.dropIfEmpty(id); });

            pinBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePin(id);
            });
            copyBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.copyNote(id);
            });
            delBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteNote(id);
            });
        });
    }

    // ============ DRAG ============

    startDrag(id, e, card) {
        if (!e) return;
        this.draggingId = id;
        this.dragEl = card;
        card.classList.add('dragging-card');
        this._justDragged = false;

        this._moveHandler = (ev) => this.onDragMove(ev);
        this._endHandler = () => this.onDragEnd();
        document.addEventListener('mousemove', this._moveHandler);
        document.addEventListener('mouseup', this._endHandler);
        document.addEventListener('touchmove', this._moveHandler, { passive: false });
        document.addEventListener('touchend', this._endHandler);
    }

    onDragMove(e) {
        if (!this.draggingId || !this.dragEl) return;
        if (e.touches) e.preventDefault();
        const cy = e.touches ? e.touches[0].clientY : e.clientY;

        const cards = [...this.list.querySelectorAll('.note-card')];
        const target = cards.find(c => {
            if (c === this.dragEl) return false;
            const r = c.getBoundingClientRect();
            return cy >= r.top && cy <= r.bottom;
        });

        if (target && target !== this.dragEl) {
            const targetRect = target.getBoundingClientRect();
            const before = cy < targetRect.top + targetRect.height / 2;
            if (before) {
                this.list.insertBefore(this.dragEl, target);
            } else {
                this.list.insertBefore(this.dragEl, target.nextSibling);
            }
        }
    }

    onDragEnd() {
        if (!this.draggingId) return;
        const draggedId = this.draggingId;
        this.draggingId = null;
        this.dragEl?.classList.remove('dragging-card');
        this.dragEl = null;

        document.removeEventListener('mousemove', this._moveHandler);
        document.removeEventListener('mouseup', this._endHandler);
        document.removeEventListener('touchmove', this._moveHandler);
        document.removeEventListener('touchend', this._endHandler);

        // Собираем актуальный порядок из DOM
        const cards = [...this.list.querySelectorAll('.note-card')];
        const ids = cards.map(c => c.dataset.id);

        // Определяем, где сейчас перетаскиваемая
        const draggedPos = ids.indexOf(draggedId);

        // Если карточка закреплена и оказалась НИЖЕ любой незакреплённой — снимаем пин
        const notes = this.getNotes();
        const draggedNote = notes.find(n => n.id === draggedId);
        if (draggedNote && draggedNote.pinned) {
            // Есть ли ниже неё незакреплённые?
            let hasUnpinnedBelow = false;
            for (let i = draggedPos + 1; i < ids.length; i++) {
                const n = notes.find(x => x.id === ids[i]);
                if (n && !n.pinned) { hasUnpinnedBelow = true; break; }
            }
            if (hasUnpinnedBelow) {
                draggedNote.pinned = false;
                draggedNote.updatedAt = Date.now();
            }
        }

        // Сохраняем order для всех, как в DOM
        ids.forEach((id, idx) => {
            const n = notes.find(x => x.id === id);
            if (n) n.order = idx;
        });

        this.app.storage.save();

        // Перерисовываем, чтобы сортировка применилась
        this.render();

        this._justDragged = true;
        setTimeout(() => { this._justDragged = false; }, 50);
    }

    formatDate(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        const pad = n => String(n).padStart(2, '0');
        return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    updateVisibility() {
        if (!this.btn) return;
        const enabled = this.app.data.notesButtonEnabled !== false;
        this.btn.style.display = enabled ? 'flex' : 'none';
        if (!enabled) this.hide();
    }

    updateIndicator() {
        const indicator = document.getElementById('notesIndicator');
        if (!indicator) return;
        indicator.classList.toggle('off', this.app.data.notesButtonEnabled === false);
    }

    toggleButton() {
        const cur = this.app.data.notesButtonEnabled !== false;
        this.app.data.notesButtonEnabled = !cur;
        this.updateVisibility();
        this.updateIndicator();
        this.app.storage.save();
    }

    toggle() { this.visible ? this.hide() : this.show(); }

    show() {
        this.render();
        this.panel.classList.add('visible');
        this.visible = true;
    }

    hide() {
        this.flushSaves();
        this.render();
        this.panel.classList.remove('visible');
        this.visible = false;
    }
}

export default Notes;
