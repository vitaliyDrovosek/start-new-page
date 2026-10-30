import Calculator from './Calculator.js';

class CalculatorUI {
    constructor(app) {
        this.app = app;
        this.input = null;
        this.container = null;
        this.lastResult = null;
        this._downInside = false;

        
        this._boundDocMouseDown = this._handleDocMouseDown.bind(this);
        this._boundDocMouseUp = this._handleDocMouseUp.bind(this);
    }

    init() {
        this.input = document.getElementById('searchInput');
        this.container = document.getElementById('calcResult');
        if (!this.container || !this.input) return;

        
        this.container.addEventListener('click', (e) => {
            const btn = e.target.closest('.calc-copy-btn');
            if (!btn) return;
            e.stopPropagation();
            if (this.lastResult !== null) {
                this.copyResult(e, this.lastResult);
            }
        });

        
        document.addEventListener('mousedown', this._boundDocMouseDown, true);
        document.addEventListener('mouseup', this._boundDocMouseUp, true);

        this.input.addEventListener('input', () => this.render());
        this.input.addEventListener('focus', () => this.render());

        
        this.input.addEventListener('keydown', (e) => this._handleEnter(e), true);
    }

    _handleDocMouseDown(e) {
        this._downInside = !!(
            this.input?.contains(e.target) ||
            this.container?.contains(e.target)
        );
    }

    _handleDocMouseUp(e) {
        const isInside = !!(
            this.input?.contains(e.target) ||
            this.container?.contains(e.target)
        );
        if (!this._downInside && !isInside) {
            this.hide();
        }
    }

    _handleEnter(e) {
        if (e.key !== 'Enter') return;

        const query = this.input.value?.trim();
        if (!query) return;
        if (!Calculator.isMathExpression(query)) return;

        const result = Calculator.calculate(query);
        if (result === null) return; 

        e.preventDefault();
        e.stopImmediatePropagation();

        this.copyToClipboard(String(result));
        this.lastResult = null;
        this.input.value = '';
        this.hide();
    }

    render() {
        if (!this.container || !this.input) return;
        const query = this.input.value?.trim() || '';

        if (query && Calculator.isMathExpression(query)) {
            const result = Calculator.calculate(query);
            if (result !== null) {
                this.lastResult = String(result);
                this.container.innerHTML = `
                    <div class="calc-result">
                        <span class="calc-result-expression">${this.escapeHtml(query)}</span>
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
        this.container.replaceChildren();
        this.container.classList.remove('visible');
    }

    hide() {
        if (this.container) {
            this.container.classList.remove('visible');
        }
        this.lastResult = null;
    }

    copyResult(event, value) {
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
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(str).catch(() => this.fallbackCopy(str));
            return;
        }
        this.fallbackCopy(str);
    }

    fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        Object.assign(ta.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '1px',
            height: '1px',
            opacity: '0'
        });
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