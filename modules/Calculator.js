class Calculator {
    static isMathExpression(str) {
        if (!str || !str.trim()) return false;
        const s = str.trim().toLowerCase();

        if (this.hasPercentPhrase(s)) return true;

        return /^[\d\s\+\-\*\/\(\)\.\%]+$/.test(s) && /[\d]/.test(s);
    }

    static hasPercentPhrase(str) {
        return /процент/i.test(str) && /от/i.test(str) || /%\s*от/i.test(str);
    }

    static calculate(str) {
        if (!str) return null;
        const s = str.trim().toLowerCase();

        const phraseResult = this.parsePercentPhrase(s);
        if (phraseResult !== null) return phraseResult;

        try {
            const tokens = this.tokenize(s);
            if (!tokens.length) return null;
            const parser = new Parser(tokens);
            const result = parser.parseExpression();
            if (!parser.isEnd()) return null;
            if (!isFinite(result)) return null;
            return result;
        } catch {
            return null;
        }
    }

    static parsePercentPhrase(str) {

        let s = str.replace(/сколько\s+будет/gi, '').trim();

        let match = s.match(/^(.+?)\s+процент(?:а|ов)?\s+от\s+(.+)$/i);
        if (!match) {
            match = s.match(/^(.+?)\s*%\s*от\s+(.+)$/i);
        }
        if (!match) return null;

        const leftExpr = match[1].trim();
        const rightExpr = match[2].trim();

        const n = this.evalSimple(leftExpr);
        const total = this.evalSimple(rightExpr);

        if (n === null || total === null) return null;

        return (n / 100) * total;
    }

    static evalSimple(str) {
        if (!str) return null;
        try {
            const tokens = this.tokenize(str);
            if (!tokens.length) return null;
            const parser = new Parser(tokens);
            const result = parser.parseExpression();
            if (!parser.isEnd()) return null;
            if (!isFinite(result)) return null;
            return result;
        } catch {
            return null;
        }
    }

    static tokenize(str) {
        const tokens = [];
        let i = 0;
        const s = str.replace(/\s+/g, '');
        while (i < s.length) {
            const ch = s[i];
            if (/\d/.test(ch) || ch === '.') {
                let num = '';
                while (i < s.length && /[\d\.]/.test(s[i])) {
                    num += s[i];
                    i++;
                }
                tokens.push({ type: 'num', value: parseFloat(num) });
            } else if ('+-*/()%'.includes(ch)) {
                tokens.push({ type: 'op', value: ch });
                i++;
            } else {
                throw new Error('Invalid char: ' + ch);
            }
        }
        return tokens;
    }
}

class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
    }

    isEnd() {
        return this.pos >= this.tokens.length;
    }

    peek() {
        return this.tokens[this.pos];
    }

    next() {
        return this.tokens[this.pos++];
    }

    parseExpression() {
        let left = this.parseTerm();
        while (this.peek() && this.peek().type === 'op' && (this.peek().value === '+' || this.peek().value === '-')) {
            const op = this.next().value;
            const right = this.parseTerm();
            left = op === '+' ? left + right : left - right;
        }
        return left;
    }

    parseTerm() {
        let left = this.parseFactor();
        while (this.peek() && this.peek().type === 'op' && (this.peek().value === '*' || this.peek().value === '/')) {
            const op = this.next().value;
            const right = this.parseFactor();
            left = op === '*' ? left * right : left / right;
        }
        return left;
    }

    parseFactor() {
        const token = this.peek();
        if (!token) throw new Error('Unexpected end');

        if (token.type === 'op' && token.value === '-') {
            this.next();
            return -this.parseFactor();
        }
        if (token.type === 'op' && token.value === '+') {
            this.next();
            return this.parseFactor();
        }
        if (token.type === 'op' && token.value === '(') {
            this.next();
            const val = this.parseExpression();
            if (!this.peek() || this.peek().value !== ')') throw new Error('Missing )');
            this.next();
            return this.parsePostfix(val);
        }
        if (token.type === 'num') {
            this.next();
            return this.parsePostfix(token.value);
        }
        throw new Error('Unexpected token');
    }

    parsePostfix(val) {
        while (this.peek() && this.peek().type === 'op' && this.peek().value === '%') {
            this.next();
            val = val / 100;
        }
        return val;
    }
}

export default Calculator;
