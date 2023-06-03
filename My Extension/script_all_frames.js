let mouseoverElement;
self.addEventListener('mouseover', e => {
    mouseoverElement = e.target;
});
self.addEventListener('mouseout', () => {
    mouseoverElement = undefined;
});
let mousemovePoint = { x: 0, y: 0 };
self.addEventListener('mousemove', e => {
    mousemovePoint = { x: e.pageX, y: e.pageY };
});
self.addEventListener('keydown', e => {
    if (e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        switch (e.key) {
            case 's':
            case 'd':
                e.preventDefault();
                break;
            case 'c':
                if (mouseoverElement && mouseoverElement.tagName != 'IFRAME' && !document.getSelection().toString()) {
                    const text = mouseoverElement.innerText?.trim() || mouseoverElement.value?.trim() || '';
                    const oncopy = evt => {
                        evt.preventDefault();
                        evt.clipboardData.setData('text/plain', text);
                    };
                    document.addEventListener('copy', oncopy);
                    const success = document.execCommand('copy');
                    document.removeEventListener('copy', oncopy);
                    const element = document.createElement('pre');
                    element.innerText = success ? '已复制“' + text + '”' : '复制“' + text + '”失败';
                    element.style.width = 'initial';
                    element.style.height = 'initial';
                    element.style.maxWidth = '30em';
                    element.style.maxHeight = '20em';
                    element.style.overflow = 'auto';
                    element.style.textAlign = 'initial';
                    element.style.position = 'absolute';
                    element.style.left = mousemovePoint.x + 'px';
                    element.style.top = mousemovePoint.y + 'px';
                    element.style.zIndex = Number.MAX_SAFE_INTEGER;
                    element.style.backgroundColor = 'white';
                    element.style.border = '1px solid rgba(0,0,0,.2)';
                    element.style.boxShadow = '0 2px 4px rgba(0,0,0,.2)';
                    element.style.margin = 'initial';
                    element.style.padding = '5px 8px';
                    element.style.outline = 'none';
                    element.style.font = 'initial';
                    element.style.color = 'initial';
                    element.style.whiteSpace = 'pre-wrap';
                    element.style.overflowWrap = 'anywhere';
                    element.setAttribute('tabindex', 0);
                    element.onblur = () => element.remove();
                    document.body.append(element);
                    element.focus();
                }
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
        if (element.children.length != 1 || child.tagName != 'I' || !['BUTTON', 'A', 'LI'].includes(element.tagName)) {
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
}, {
    isMatch: (element, button) => {
        const child = element.firstElementChild?.firstElementChild;
        if (element.children.length != 1 || element.firstElementChild.children.length != 1 || child.tagName != 'svg' || !['LI'].includes(element.tagName)) {
            return false;
        }
        let matchText;
        switch (button) {
            case 4:
                matchText = '-right';
                break;
            default:
                return false;
        }
        return child.className?.baseVal?.includes(matchText);
    },
    action: (element, button) => {
        element.click();
        scrollTo({ top: 0 });
    }
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
new MutationObserver(list => {
    const empty = modified.size <= 0;
    list.forEach(e => modified.add(e.target));
    if (empty) {
        setTimeout(() => {
            modified.forEach(e => {
                if (e.childElementCount <= 0) {
                    doUpdate(e);
                    return;
                }
                const walker = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT);
                for (let node = e; node; node = next(walker)) {
                    doUpdate(node);
                }
            });
            modified.clear();
            function next(walker) {
                const e = walker.nextNode();
                return modified.has(e) ? walker.nextSibling() : e;
            }
            function doUpdate(e) {
                const name = 'my-extension-background-color';
                if (e.getAttribute(name)) {
                    e.removeAttribute(name);
                    e.style.removeProperty('background-color');
                }
                if (getComputedStyle(e).backgroundColor == 'rgb(255, 255, 255)') {
                    e.setAttribute(name, true);
                    e.style.backgroundColor = '#e0ce9e';
                }
            }
        }, 0);
    }
}).observe(document.firstElementChild, { childList: true, subtree: true });