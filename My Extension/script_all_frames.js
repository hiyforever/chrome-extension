self.addEventListener('keydown', e => {
    if (e.ctrlKey) {
        switch (e.key) {
            case 's':
            case 'd':
                e.preventDefault();
                break;
        }
    }
});
let lastSelection;
document.addEventListener('selectionchange', () => {
    lastSelection = document.getSelection();
});
self.addEventListener('mouseup', e => {
    if (e.button != 0) {
        return;
    }
    const selection = document.getSelection();
    const text = selection.toString();
    if (selection == lastSelection && !selection.isCollapsed && text) {
        lastSelection = null;
        chrome.runtime.sendMessage({
            event: 'selectionchange',
            data: text,
            x: e.pageX,
            y: e.pageY
        });
    }
});
self.addEventListener('contextmenu', e => {
    const tag = 'data-context-menu-target';
    document.querySelectorAll('[' + tag + ']').forEach(e => e.removeAttribute(tag))
    e.target.setAttribute(tag, true)
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
