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
const isMatchPatternPage = (element, button, tagNames) => {
    if (!tagNames.includes(element.tagName)) {
        return false;
    }
    let matchPattern;
    switch (button) {
        case 3:
            matchPattern = /上一页|‹|«|<|上页|上一章|前|Previous Page|Prev Page|Previous|Prev/g;
            break;
        case 4:
            matchPattern = /下一页|›|»|>|下页|下一章|次|Next Page|Next/g;
            break;
        default:
            return false;
    }
    return [element.textContent, element.title].some(text => text.trim() != '' && text.replaceAll(matchPattern, '').trim() == '');
};
const matchActions = [{
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
    }
}, {
    isMatch: (element, button) => isMatchPatternPage(element, button, ['BUTTON', 'A']),
    action: (element, button) => element.click()
}, {
    isMatch: (element, button) => isMatchPatternPage(element, button, ['LI']),
    action: (element, button) => element.click()
}, {
    isMatch: (element, button) => {
        const child = element.firstElementChild;
        if (element.children.length != 1 || child.tagName != 'I' || !['BUTTON', 'A', "LI"].includes(element.tagName)) {
            return false;
        }
        let matchText;
        switch (button) {
            case 3:
                matchText = '-left';
                break;
            case 4:
                matchText = '-right';
                break;
            default:
                return false;
        }
        return child.className?.includes(matchText) && getComputedStyle(child, ':before').content?.match(/"[\u0000-\uffff]"/);
    },
    action: (element, button) => element.click()
}];
self.addEventListener('mouseup', e => {
    switch (e.button) {
        case 3:
        case 4:
            const items = Array.from(document.querySelectorAll('*')).map(element => {
                for (const i in matchActions) {
                    if (matchActions[i].isMatch(element, e.button)) {
                        for (let current = element; current; current = current.parentElement) {
                            const style = getComputedStyle(current);
                            if (style.cursor == 'not-allowed' || style.display == 'none') {
                                return;
                            }
                        }
                        return { id: i, element: element };
                    }
                }
            }).filter(item => item).sort((item1, item2) => item1.id - item2.id);
            let actionItem;
            if (items.length == 1) {
                actionItem = items[0];
            } else if (items.length > 1) {
                for (let target = e.target; target; target = target?.parentNode) {
                    for (const item of items) {
                        if (target.contains(item.element)) {
                            actionItem = item;
                            target = undefined;
                            break;
                        }
                    }
                }
            }
            if (actionItem) {
                matchActions[actionItem.id].action(actionItem.element, e.button);
                e.preventDefault();
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
const modified = new Set();
setInterval(() => {
    modified.forEach(e => e.querySelectorAll('*').forEach(e => {
        if (getComputedStyle(e).backgroundColor == 'rgb(255, 255, 255)') {
            e.style.backgroundColor = '#e0ce9e';
        }
    }));
    modified.clear();
}, 0);
new MutationObserver(list => list.forEach(e => modified.add(e.target)))
    .observe(document.firstElementChild, { childList: true, subtree: true });