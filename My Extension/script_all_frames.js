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
        }
    }
});
self.addEventListener('copy', evt => {
    let text;
    if (mouseoverElement && mouseoverElement.tagName != 'IFRAME' && !document.getSelection().toString() && evt.clipboardData.types.length <= 0) {
        text = mouseoverElement.innerText?.trim() || mouseoverElement.value?.trim() || '';
        evt.clipboardData.setData('text/plain', text);
        evt.preventDefault();
    } else if (evt.defaultPrevented) {
        if (evt.clipboardData.types.length <= 0) {
            return;
        }
        text = evt.clipboardData.getData('text/plain');
    } else {
        text = document.getSelection().toString();
        if (text == '') {
            return;
        }
    }
    const element = document.createElement('pre');
    element.innerText = '已复制“' + text + '”';
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
    setTimeout(() => element.focus(), 0);
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
        const child = element.firstElementChild;
        if (element.children.length != 1 || child.tagName != 'svg' || !['A'].includes(element.tagName)) {
            return false;
        }
        let matchText;
        switch (button) {
            case 3:
                matchText = 'prev';
                break;
            case 4:
                matchText = 'next';
                break;
            default:
                return false;
        }
        return element.getAttribute('rel') == matchText;
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
                            if (!current.checkVisibility()) {
                                return;
                            }
                            const style = getComputedStyle(current);
                            if (style.cursor == 'not-allowed') {
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
    list.forEach(e => e.addedNodes.forEach(e => modified.add(e.parentNode || e)));
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
                if (!(e instanceof Element)) {
                    return;
                }
                const name = 'my-extension-background-color';
                if (e.hasAttribute(name)) {
                    const backgroundColor = e.getAttribute(name);
                    e.removeAttribute(name);
                    if (backgroundColor) {
                        e.style.backgroundColor = backgroundColor;
                    } else {
                        e.style.removeProperty('background-color');
                    }
                }
                const customColors = [224, 206, 158];
                const customColor = 'rgb(' + customColors.join(', ') + ')';
                const style = getComputedStyle(e);
                if (style.backgroundColor == 'rgb(255, 255, 255)') {
                    e.setAttribute(name, e.style.backgroundColor || '');
                    e.style.backgroundColor = customColor;
                }
                const colorName = 'my-extension-color';
                if (e.hasAttribute(colorName)) {
                    const color = e.getAttribute(colorName);
                    e.removeAttribute(colorName);
                    if (color) {
                        e.style.color = color;
                    } else {
                        e.style.removeProperty('color');
                    }
                }
                const colors = style.color.match(/rgb\((\d+), (\d+), (\d+)\)/)?.slice(1, 4);
                if (colors?.every(color => color >= 128)) {
                    let backgroundStyle = style;
                    for (let backgroundElement = e;
                        backgroundStyle?.backgroundColor == 'rgba(0, 0, 0, 0)';
                        backgroundElement = backgroundElement.parentElement, backgroundStyle = backgroundElement ? getComputedStyle(backgroundElement) : null) {
                    }
                    if (backgroundStyle?.backgroundColor == customColor) {
                        e.setAttribute(colorName, e.style.color || '');
                        e.style.color = 'rgb(' + colors.map(color => color / 2).join(', ') + ')';
                    }
                }
            }
            // contrast(colors, customColors) < 4.5
            function luminanace(r, g, b) {
                const c = [r, g, b].map(v => {
                    v /= 255;
                    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
                });
                return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
            }
            function contrast(rgb1, rgb2) {
                const lum1 = luminanace(rgb1[0], rgb1[1], rgb1[2]);
                const lum2 = luminanace(rgb2[0], rgb2[1], rgb2[2]);
                const brightest = Math.max(lum1, lum2);
                const darkest = Math.min(lum1, lum2);
                return (brightest + 0.05) / (darkest + 0.05);
            }
        }, 0);
    }
}).observe(document.firstElementChild, { childList: true, subtree: true });