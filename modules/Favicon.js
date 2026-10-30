
class Favicon {
    static MIN_SIZE = 16;
    static MAX_SIZE = 128;
    static DEFAULT_SIZE = 32;

    
    static getUrl(url, size = Favicon.DEFAULT_SIZE) {
        if (!url) return '';

        let hostname;
        try {
            hostname = new URL(url).hostname;
        } catch {
            return '';
        }

        if (!hostname) return '';

        
        hostname = hostname.replace(/^www\./i, '');

        const sz = Math.max(
            Favicon.MIN_SIZE,
            Math.min(Favicon.MAX_SIZE, Number(size) || Favicon.DEFAULT_SIZE)
        );

        return `https://www.google.com/s2/favicons?sz=${sz}&domain=${encodeURIComponent(hostname)}`;
    }

    
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
            
            img.style.visibility = 'hidden';
        }, { once: true });

        return img;
    }
}

export default Favicon;