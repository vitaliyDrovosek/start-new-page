class Favicon {
    static getUrl(url, size = 32) {
        try {
            const hostname = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?sz=${size}&domain=${hostname}`;
        } catch (e) {
            return '';
        }
    }

    static createImg(url, size = 16, className = 'link-favicon') {
        const src = this.getUrl(url, size);
        if (!src) return null;

        const img = document.createElement('img');
        img.src = src;
        img.className = className;
        img.width = size;
        img.height = size;
        img.loading = 'lazy';
        img.alt = '';
        img.draggable = false;
        img.onerror = () => { img.style.visibility = 'hidden'; };
        return img;
    }
}

export default Favicon;