/**
 * Утилита для получения favicon'ок сторонних сайтов через Google S2.
 * Ничего не хранит, не кэширует у себя — только формирует URL и <img>.
 */
class Favicon {
    static MIN_SIZE = 16;
    static MAX_SIZE = 128;
    static DEFAULT_SIZE = 32;

    /**
     * Возвращает URL иконки для указанного адреса.
     * @param {string} url — любой URL (http/https/…)
     * @param {number} [size=32] — 16..128
     * @returns {string} URL или '' если адрес некорректный
     */
    static getUrl(url, size = Favicon.DEFAULT_SIZE) {
        if (!url) return '';

        let hostname;
        try {
            hostname = new URL(url).hostname;
        } catch {
            return '';
        }

        if (!hostname) return '';

        // www. не нужен — у Google S2 иконки для www и без www одинаковые
        hostname = hostname.replace(/^www\./i, '');

        const sz = Math.max(
            Favicon.MIN_SIZE,
            Math.min(Favicon.MAX_SIZE, Number(size) || Favicon.DEFAULT_SIZE)
        );

        return `https://www.google.com/s2/favicons?sz=${sz}&domain=${encodeURIComponent(hostname)}`;
    }

    /**
     * Создаёт <img> с favicon'кой.
     * @param {string} url — адрес сайта
     * @param {number} [size=16] — размер в px
     * @param {string} [className='link-favicon']
     * @returns {HTMLImageElement|null} null, если URL некорректный
     */
    static createImg(url, size = 16, className = 'link-favicon') {
        const src = this.getUrl(url, size);
        if (!src) return null;

        const img = document.createElement('img');
        Object.assign(img, {
            src,
            className: typeof className === 'string' ? className : 'link-favicon',
            width: size,
            height: size,
            loading: 'lazy',
            decoding: 'async',
            alt: '',
            draggable: false,
            referrerPolicy: 'no-referrer'
        });

        img.addEventListener('error', () => {
            // Google не отдал иконку — прячем, чтобы не было «битой» картинки
            img.style.visibility = 'hidden';
        }, { once: true });

        return img;
    }
}

export default Favicon;