self.addEventListener('keydown', evt => {
    if (evt.ctrlKey) {
        switch (evt.key) {
            case 's':
            case 'd':
                evt.preventDefault();
                break;
        }
    }
});
self.addEventListener('contextmenu', evt => {
    const tag = 'data-context-menu-target';
    document.querySelectorAll('[' + tag + ']').forEach(e => e.removeAttribute(tag))
    evt.target.setAttribute(tag, true)
});
self.addEventListener('DOMSubtreeModified', e => {
    if (e.target.querySelectorAll) {
        e.target.querySelectorAll('*').forEach(e => {
            if ((e.style.backgroundColor || getComputedStyle(e).backgroundColor) == 'rgb(255, 255, 255)') {
                e.style.backgroundColor = '#e0ce9e';
            }
        });
    }
});