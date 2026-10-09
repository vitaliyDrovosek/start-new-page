class Typing {
    constructor(app) {
        this.app = app;
        this.overlay = null;
        this.wordEl = null;
        this.input = null;
        this.timerEl = null;
        this.scoreEl = null;
        this.wpmEl = null;
        this.accuracyEl = null;
        this.resultScreen = null;

        this.DURATION = 60;
        this.WORDS = [
            "the","and","for","are","but","not","you","all","any","can",
            "had","her","was","one","our","out","day","get","has","him",
            "his","how","man","new","now","old","see","two","way","who",
            "boy","did","its","let","put","say","she","too","use","that",
            "with","have","this","will","your","from","they","know","want","been",
            "good","much","some","time","very","when","come","here","just","like",
            "long","make","many","over","such","take","than","them","well","were",
            "what","work","year","back","call","came","each","even","find","give",
            "hand","high","keep","last","left","life","live","look","made","most",
            "move","must","name","need","next","only","open","part","play","right",
            "said","same","seem","show","side","tell","turn","used","want","ways",
            "week","went","word","work","world","write","young","about","after","again",
            "below","bring","build","carry","catch","cause","check","class","clear","close",
            "could","cover","cross","dream","drive","early","earth","enjoy","enough","every",
            "field","fight","final","first","focus","force","found","fresh","front","fruit",
            "given","glass","great","green","group","happy","heart","heavy","horse","house",
            "human","ideal","image","issue","learn","leave","level","light","local","logic",
            "lucky","lunch","magic","major","maybe","metal","might","money","month","moral",
            "music","never","night","north","offer","often","order","other","paper","party",
            "peace","phone","place","plant","point","power","press","price","proud","quick",
            "quiet","radio","raise","reach","ready","real","reply","right","river","round"
        ];

        this.active = false;
        this.currentWord = "";
        this.typed = "";
        this.timeLeft = 0;
        this.correctWords = 0;
        this.totalChars = 0;
        this.correctChars = 0;
        this.errors = 0;
        this.timerInterval = null;
        this.startTime = 0;

        this.boundKeyHandler = this.handleKey.bind(this);
    }

    init() {
        this.overlay = document.getElementById('typingOverlay');
        this.wordEl = document.getElementById('typingWord');
        this.input = document.getElementById('typingInput');
        this.timerEl = document.getElementById('typingTimer');
        this.scoreEl = document.getElementById('typingScore');
        this.wpmEl = document.getElementById('typingWpmLive');
        this.accuracyEl = document.getElementById('typingAccuracyLive');
        this.resultScreen = document.getElementById('typingResult');

        if (!this.overlay) return;

        document.getElementById('typingCloseBtn')?.addEventListener('click', () => this.close());
        document.getElementById('typingRestartBtn')?.addEventListener('click', () => this.start());
        document.getElementById('typingExitBtn')?.addEventListener('click', () => this.close());

        if (this.input) {
            this.input.setAttribute('inputmode', 'text');
            this.input.setAttribute('enterkeyhint', 'done');

            this.input.addEventListener('input', () => this.handleInput());
            this.input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') e.preventDefault();
            });
            this.input.addEventListener('paste', (e) => e.preventDefault());
        }
    }

    open() {
        if (!this.overlay) return;
        this.overlay.classList.add('visible');
        document.addEventListener('keydown', this.boundKeyHandler);
        this.start();
    }

    close() {
        if (!this.overlay) return;
        this.overlay.classList.remove('visible');
        document.removeEventListener('keydown', this.boundKeyHandler);
        this.stop();
    }

    handleKey(e) {
        if (e.key === 'Escape') {
            this.close();
        }
    }

    start() {
        this.stop();

        this.active = true;
        this.correctWords = 0;
        this.totalChars = 0;
        this.correctChars = 0;
        this.errors = 0;
        this.typed = "";
        this.timeLeft = this.DURATION;
        this.startTime = performance.now();

        this.resultScreen?.classList.remove('visible');

        if (this.input) {
            this.input.value = "";
            this.input.disabled = false;
            setTimeout(() => {
                this.input.focus();
                if (window.matchMedia('(max-width: 768px)').matches) {
                    setTimeout(() => {
                        this.input?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                    }, 300);
                }
            }, 100);
        }

        this.nextWord();
        this.updateHud();

        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateHud();
            if (this.timeLeft <= 0) {
                this.finish();
            }
        }, 1000);
    }

    stop() {
        this.active = false;
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        if (this.input) this.input.disabled = true;
    }

    nextWord() {
        let word;
        do {
            word = this.WORDS[Math.floor(Math.random() * this.WORDS.length)];
        } while (word === this.currentWord);

        this.currentWord = word;
        this.typed = "";
        this.renderWord();
    }

    renderWord() {
        if (!this.wordEl) return;

        let html = '';
        for (let i = 0; i < this.currentWord.length; i++) {
            const char = this.currentWord[i];
            let cls = 'typing-char';

            if (i < this.typed.length) {
                cls += this.typed[i] === char ? ' correct' : ' wrong';
            } else if (i === this.typed.length) {
                cls += ' current';
            }

            html += `<span class="${cls}">${char}</span>`;
        }

        this.wordEl.innerHTML = html;
    }

    handleInput() {
        if (!this.active || !this.input) return;

        const value = this.input.value;
        const prevLen = this.typed.length;

        if (value.length < prevLen) {
            this.typed = value;
            this.renderWord();
            return;
        }

        const newChar = value[value.length - 1];
        const expected = this.currentWord[this.typed.length];

        this.totalChars++;

        if (newChar === expected) {
            this.typed += newChar;
            this.correctChars++;
        } else {
            this.errors++;
            this.input.value = this.typed;
            this.flashWrong();
            this.renderWord();
            return;
        }

        this.renderWord();

        if (this.typed === this.currentWord) {
            this.correctWords++;
            this.input.value = "";
            this.typed = "";
            this.nextWord();
            this.updateHud();
        } else {
            this.updateHud();
        }
    }

    flashWrong() {
        if (this.wordEl) {
            this.wordEl.classList.add('shake');
            setTimeout(() => this.wordEl.classList.remove('shake'), 200);
        }
    }

    updateHud() {
        if (this.timerEl) this.timerEl.textContent = this.timeLeft + 'с';
        if (this.scoreEl) this.scoreEl.textContent = this.correctWords;

        const elapsed = (performance.now() - this.startTime) / 1000;
        const wpm = elapsed > 0 ? Math.round((this.correctWords / elapsed) * 60) : 0;
        if (this.wpmEl) this.wpmEl.textContent = wpm;

        const accuracy = this.totalChars > 0
            ? Math.round((this.correctChars / this.totalChars) * 100)
            : 100;
        if (this.accuracyEl) this.accuracyEl.textContent = accuracy + '%';
    }

    finish() {
        this.stop();
        this.active = false;

        const elapsed = this.DURATION;
        const wpm = Math.round((this.correctWords / elapsed) * 60);
        const accuracy = this.totalChars > 0
            ? Math.round((this.correctChars / this.totalChars) * 100)
            : 100;

        const prevBest = this.app.data.typingBestWpm ?? null;
        const isNewRecord = prevBest === null || wpm > prevBest;

        if (isNewRecord) {
            this.app.data.typingBestWpm = wpm;
        }

        this.app.data.typingGames = (this.app.data.typingGames ?? 0) + 1;
        if (this.app.storage) this.app.storage.save();

        if (this.app.achievements) {
            this.app.achievements.trackTypingGame({ wpm, accuracy });
        }

        const wpmEl = document.getElementById('typingWpmResult');
        const accEl = document.getElementById('typingAccuracyResult');
        const wordsEl = document.getElementById('typingWordsResult');
        const errEl = document.getElementById('typingErrorsResult');
        const bestEl = document.getElementById('typingBestResult');
        const recordEl = document.getElementById('typingRecordBadge');

        if (wpmEl) wpmEl.textContent = wpm;
        if (accEl) accEl.textContent = accuracy + '%';
        if (wordsEl) wordsEl.textContent = this.correctWords;
        if (errEl) errEl.textContent = this.errors;
        if (bestEl) bestEl.textContent = (this.app.data.typingBestWpm ?? 0) + ' WPM';

        if (recordEl) {
            recordEl.classList.toggle('visible', isNewRecord);
        }

        this.resultScreen?.classList.add('visible');
        this.updateDropdownBest();
    }

    updateDropdownBest() {
        const el = document.getElementById('typingBestIndicator');
        if (!el) return;
        const best = this.app.data.typingBestWpm;
        el.textContent = best ? best + ' WPM' : '—';
    }
}

export default Typing;