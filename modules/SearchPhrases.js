class SearchPhrases {
    constructor() {
        this.phrases = [
            'Поиск...', 'Что ищем?', 'Введите запрос...', 'Найти что-нибудь...',
            'Куда идём?', 'Что узнаем?', 'Искать...', 'Введите текст...',
            'Поиск в интернете...', 'Чем помочь?', 'Что на уме?', 'Гуглим?',
            'Яндексим?', 'Найдём ответ...', 'Спроси меня...'
        ];
    }
    getRandom() {
        return this.phrases[Math.floor(Math.random() * this.phrases.length)];
    }
}
export default SearchPhrases;