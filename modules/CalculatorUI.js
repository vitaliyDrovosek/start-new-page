import Calculator from './Calculator.js';

class CalculatorUI {
    constructor(app) {
        this.app = app;
        this.input = null;
        this.container = null;
        this.lastResult = null;
        this.delegateBound = false;
        this._downInside = false;
    }

    init() {
        this.input = document.getElementById('searchInput');
        this.container = document.getElementById('calcResult');
        if (!this.container) return;


        this.container.addEventListener('click', (e) => {
            const btn = e.target.closest('.calc-copy-btn');
            if (!btn) return;
            e.stopPropagation();
            if (this.lastResult !== null) {
                this.copyResult(e, this.lastResult);
            }
        });


        document.addEventListener('mousedown', (e) => {
            this._downInside = !!(
                this.input?.contains(e.target) ||
                this.container?.contains(e.target)
            );
        }, true);

        document.addEventListener('mouseup', (e) => {
            const isInside = !!(
                this.input?.contains(e.target) ||
                this.container?.contains(e.target)
            );
            if (!this._downInside && !isInside) {
                this.hide();
            }
        }, true);


        if (this.input) {
            this.input.addEventListener('input', () => this.render());
            this.input.addEventListener('focus', () => this.render());


            this.input.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter') return;
                const query = this.input.value?.trim();
                if (!query) return;
                if (Calculator.isMathExpression(query)) {
                    const result = Calculator.calculate(query);
                    if (result !== null) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        this.copyToClipboard(String(result));
                        this.lastResult = null;
                        this.input.value = '';
                        this.hide();
                    }
                }
            });
        }
    }

    render() {
        if (!this.container) return;
        const query = this.input?.value?.trim() || '';

        if (query && Calculator.isMathExpression(query)) {
            const result = Calculator.calculate(query);
            if (result !== null) {
                this.lastResult = String(result);
                const escapedQuery = this.escapeHtml(query);
                this.container.innerHTML = `
                    <div class="calc-result">
                        <span class="calc-result-expression">${escapedQuery}</span>
                        <div class="calc-result-equals">
                            <span class="calc-result-value">= ${result}</span>
                            <button class="calc-copy-btn" title="Копировать"><span class="iconify" data-icon="mdi:content-copy"></span></button>
                        </div>
                    </div>
                `;
                this.container.classList.add('visible');
                return;
            }
        }

        this.lastResult = null;
        this.container.innerHTML = '';
        this.container.classList.remove('visible');
    }

    hide() {
        if (this.container) {
            this.container.classList.remove('visible');
        }
        this.lastResult = null;
    }

    copyResult(event, value) {
        if (event && event.stopPropagation) event.stopPropagation();
        if (value === undefined || value === null) return;
        this.copyToClipboard(value);

        const btn = event?.target?.closest?.('.calc-copy-btn');
        if (btn) {
            btn.classList.add('flash');
            setTimeout(() => btn.classList.remove('flash'), 600);
        }
    }

    copyToClipboard(text) {
        const str = String(text);
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(str).catch(() => this.fallbackCopy(str));
            return;
        }
        this.fallbackCopy(str);
    }

    fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '0';
        ta.style.left = '0';
        ta.style.width = '1px';
        ta.style.height = '1px';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, text.length);
        try { document.execCommand('copy'); } catch {  }
        document.body.removeChild(ta);
    }

    escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
}

export default CalculatorUI;
