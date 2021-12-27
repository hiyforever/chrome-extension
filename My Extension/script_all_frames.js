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
self.addEventListener('mousemove', e => {
    const element = e.target;
    if (element.tagName == 'INPUT' && element.type == 'password') {
        element.title = element.value;
        setTimeout(() => element.removeAttribute('title'), 0);
    }
});
const matchPatternPage = (text, pattern) => text.trim() != '' && text.replaceAll(pattern, '').trim() == '';
const matchPrevPage = text => matchPatternPage(text, /上一页|‹|«|<|上页|前|Previous|Prev/g);
const matchNextPage = text => matchPatternPage(text, /下一页|›|»|>|下页|次|Next/g);
const matchIcons = [{
    classPrefix: 'ICN_type-',
    code: 0xe6a6,
}, {
    classPrefix: 'el-icon-arrow-',
    code: 0xe6df,
}, {
    classPrefix: 'fa-chevron-',
    code: 0xf053,
}];
const mouseUpMatchActions = [{
    isMatch: (element, button) => element.tagName.includes('VIDEO'),
    action: (element, button) => {
        element.currentTime += button * 10 - 35;
        if (element.currentTime || element.tagName == 'VIDEO') {
            return;
        }
        const script = document.createElement('script');
        script.textContent = '(' + function (tagName, button) {
            document.querySelector(tagName).currentTime += button * 10 - 35;
        } + ')("' + element.tagName + '",' + button + ')';
        document.firstElementChild.appendChild(script);
        script.remove();
    },
}, {
    isMatch: function (element, button) {
        if (!['BUTTON', 'A'].includes(element.tagName)) {
            return false;
        }
        let matchPage;
        switch (button) {
            case 3:
                matchPage = matchPrevPage;
                break;
            case 4:
                matchPage = matchNextPage;
                break;
            default:
                return false;
        }
        return matchPage(element.textContent) || matchPage(element.title);
    },
    action: (element, button) => element.click(),
}, {
    isMatch: function (element, button) {
        if (element.tagName != 'LI') {
            return false;
        }
        let matchPage, matchText, matchOffset;
        switch (button) {
            case 3:
                matchPage = matchPrevPage;
                matchText = 'left';
                matchOffset = 0;
                break;
            case 4:
                matchPage = matchNextPage;
                matchText = 'right';
                matchOffset = 1;
                break;
            default:
                return false;
        }
        if (matchPage(element.textContent) || matchPage(element.title)) {
            return true;
        }
        if (element.children.length == 1 && element.firstChild.tagName == 'I') {
            for (const icon of matchIcons) {
                if (element.firstChild.className?.includes(icon.classPrefix + matchText) &&
                    getComputedStyle(element.firstChild, ':before').content == unescape('"%u' + (icon.code + matchOffset).toString(16) + '"')) {
                    return true;
                }
            }
        }
        return false;
    },
    action: (element, button) => element.click(),
}];
self.addEventListener('mouseup', e => {
    switch (e.button) {
        case 3:
        case 4:
            const items = Array.from(document.querySelectorAll('*')).map(element => {
                for (const i in mouseUpMatchActions) {
                    if (mouseUpMatchActions[i].isMatch(element, e.button)) {
                        return { id: i, element: element };
                    }
                }
            }).filter(item => item).sort((item1, item2) => item1.id - item2.id);
            let target = e.target;
            while (target) {
                for (const item of items) {
                    if (target.contains(item.element)) {
                        mouseUpMatchActions[item.id].action(item.element, e.button);
                        e.preventDefault();
                        target = undefined;
                        break;
                    }
                }
                target = target?.parentNode;
            }
            break;
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
    if (selection == lastSelection && !selection.isCollapsed && !selection.anchorNode.parentNode.isContentEditable && text) {
        lastSelection = null;
        chrome.i18n.detectLanguage(text, info => {
            if (info.languages.length > 1 ||
                info.languages.length == 1 && info.languages[0].language != 'zh') {
                chrome.runtime.sendMessage({
                    event: 'selectionchange',
                    data: text,
                    x: e.pageX,
                    y: e.pageY
                });
            }
        });
    }
});
self.addEventListener('contextmenu', e => {
    const tag = 'data-context-menu-target';
    document.querySelectorAll('[' + tag + ']').forEach(e => e.removeAttribute(tag))
    e.target.setAttribute(tag, true)
});
const modified = new Set();
self.addEventListener('DOMSubtreeModified', e => {
    if (e.target.querySelectorAll) {
        modified.add(e.target);
        setTimeout(() => {
            modified.forEach(e => e.querySelectorAll('*').forEach(e => {
                if (getComputedStyle(e).backgroundColor == 'rgb(255, 255, 255)') {
                    e.style.backgroundColor = '#e0ce9e';
                }
            }));
            modified.clear();
        }, 0);
    }
});