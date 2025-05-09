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
function extractElementCopyData(e) {
    return {
        'text/plain': trim(e.innerText) || trim(e.value) ||
            trim(e.src) || trim(e.href) || trim(e.placeholder) || '',
        'text/html': e.outerHTML,
    };

    function trim(t) {
        return t?.replace?.(/^[\s\u200B-\u200D\uFEFF]+|[\s\u200B-\u200D\uFEFF]+$/g, '');
    }
}
self.addEventListener('copy', evt => {
    let text;
    if (mouseoverElement && mouseoverElement.tagName != 'IFRAME' && !document.getSelection().toString() && evt.clipboardData.types.length <= 0) {
        const data = extractElementCopyData(mouseoverElement);
        text = data['text/plain'];
        Object.keys(data).forEach(key => evt.clipboardData.setData(key, data[key]));
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
    element.style.left = mousemovePoint.x + 5 + 'px';
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
    ['contextmenu', 'selectstart'].forEach(event => element.addEventListener(event, e => e.stopPropagation(), true));
    const listener = e => {
        if (e.target == element || mouseoverElement == element) {
            return;
        }
        removeEventListener('mousedown', listener);
        removeEventListener('keydown', listener);
        element.remove();
    };
    element.onblur = listener;
    addEventListener('mousedown', listener);
    addEventListener('keydown', listener);
    document.body.append(element);
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
        const child = element.firstElementChild;
        if (element.children.length != 1 || child.tagName != 'svg' || !['LI'].includes(element.tagName)) {
            return false;
        }
        let matchText;
        switch (button) {
            case 3:
                matchText = '-prev';
                break;
            case 4:
                matchText = '-next';
                break;
            default:
                return false;
        }
        return element.getAttribute('data-testid')?.endsWith(matchText);
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
}, {
    isMatch: (element, button) => {
        if (button != 3 || !['BUTTON', 'I'].includes(element.tagName) && 'button' != element.type) {
            return false;
        }
        if (![element.textContent, element.value]
            .some(text => text && text.trim() != '' && text.replaceAll(/取消|取 消|关闭|关 闭/g, '').trim() == '') &&
            !Array.from(element.classList || []).some(name => name.endsWith('-close') || name.includes('-close_')) &&
            element.getAttribute('aria-label') != "Close") {
            return false;
        }
        for (let current = element; current; current = current.parentElement) {
            const style = getComputedStyle(current);
            if (style.position == 'fixed') {
                return true;
            }
        }
        return false;
    },
    action: (element, button) => element.click()
}];
self.addEventListener('mouseup', e => {
    if (![3, 4].includes(e.button)) {
        return;
    }
    for (let preTarget, target = e.target; target; preTarget = target, target = target.parentElement || target.ownerDocument.defaultView.frameElement) {
        let no = matchActions.length, result;
        const walker = document.createTreeWalker(target, NodeFilter.SHOW_ELEMENT);
        for (let element = target; element; element = walker.nextNode()) {
            if (element == preTarget) {
                while (walker.lastChild()) {
                }
                continue;
            }
            if (!element.checkVisibility()) {
                continue;
            }
            const style = getComputedStyle(element);
            if (style.cursor == 'not-allowed' || element.tagName != 'VIDEO' && style.pointerEvents == 'none' || style.opacity <= 0) {
                continue;
            }
            if (element != target && style.position == 'fixed') {
                while (walker.lastChild()) {
                }
                continue;
            }
            for (let i = 0; i < no; i++) {
                const action = matchActions[i];
                if (action.isMatch(element, e.button)) {
                    no = i;
                    result = () => action.action(element, e.button);
                    break;
                }
            }
            if (no <= 0) {
                break;
            }
        }
        if (result) {
            result();
            e.preventDefault();
            return;
        }
        if (getComputedStyle(target).position == 'fixed') {
            e.preventDefault();
            return;
        }
    }
    if (self != top) {
        e.preventDefault();
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
    list.forEach(e => {
        if (e.removedNodes.length) {
            return;
        }
        if (e.addedNodes.length) {
            e.addedNodes.forEach(node => modified.add(node));
            return;
        }
        if (e.target == document.body && e.attributeName == 'class') {
            return;
        }
        modified.add(e.target);
    });
    if (empty) {
        setTimeout(() => {
            modified.forEach(e => {
                if (e.childElementCount <= 0) {
                    doUpdate(e);
                    return;
                }
                const walker = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT);
                for (let node = e; node; node = walker.nextNode()) {
                    doUpdate(node);
                }
            });
            modified.clear();
            function doUpdate(e) {
                if (!(e instanceof Element)) {
                    return;
                }
                const style = getComputedStyle(e);
                const customColors = [224, 206, 158];
                const customColor = 'rgb(' + customColors.join(', ') + ')';
                let changeBackgroundColor;
                const name = 'my-extension-background-color';
                if (!['text', 'textarea'].includes(e.type) && e.hasAttribute(name)) {
                    const backgroundColor = e.getAttribute(name);
                    e.removeAttribute(name);
                    if (e.style.backgroundColor == customColor) {
                        changeBackgroundColor = true;
                        if (backgroundColor) {
                            e.style.backgroundColor = backgroundColor;
                        } else {
                            e.style.removeProperty('background-color');
                        }
                    }
                }
                let changeColor;
                const colorName = 'my-extension-color';
                if (e.hasAttribute(colorName)) {
                    const colors = (e.getAttribute(colorName) || ":").split(':');
                    e.removeAttribute(colorName);
                    if (colors[1] && e.style.color == colors[1]) {
                        changeColor = true;
                        if (colors[0]) {
                            e.style.color = colors[0];
                        } else {
                            e.style.removeProperty('color');
                        }
                    }
                }
                function doColor() {
                    if (!e.hasAttribute(name) && style.backgroundColor == 'rgb(255, 255, 255)') {
                        e.setAttribute(name, e.style.backgroundColor || '');
                        e.style.backgroundColor = customColor;
                    }
                    const colors = style.color.match(/rgb\((\d+), (\d+), (\d+)\)/)?.slice(1, 4);
                    if (!e.hasAttribute(colorName) && colors && Array.from(e.childNodes.values()).some(n => n.nodeType == n.TEXT_NODE && n.nodeValue.trim())) {
                        const compare = contrast(colors, customColors);
                        if (compare.match) {
                            let backgroundStyle = style;
                            for (let backgroundElement = e;
                                !['absolute', 'fixed'].includes(backgroundStyle?.position) && backgroundStyle?.backgroundColor == 'rgba(0, 0, 0, 0)';
                                backgroundElement = backgroundElement.parentElement, backgroundStyle = backgroundElement ? getComputedStyle(backgroundElement) : null) {
                            }
                            if (backgroundStyle?.backgroundColor == customColor) {
                                const color = 'rgb(' + colors.map(color => Math.min(Math.floor(color * compare.scale), 255)).join(', ') + ')';
                                e.setAttribute(colorName, (e.style.color || '') + ':' + color);
                                e.style.color = color;
                            }
                        }
                    }
                    return (e.hasAttribute(name) || !changeBackgroundColor) &&
                        (e.hasAttribute(colorName) || !changeColor);
                }
                if (doColor()) {
                    return;
                }
                let i = 100;
                const interval = setInterval(() => {
                    if (doColor() || --i <= 0) {
                        clearInterval(interval);
                    }
                }, 0);
            }
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
                const ratio = (brightest + 0.05) / (darkest + 0.05);
                const brighter = lum1 > lum2;
                const max = brighter ? 1.5 : 2;
                const scale = brighter ? Math.pow(max / ratio, 1 / 2.4) : ratio / max;
                return { match: ratio < max, scale: scale };
            }
        }, 0);
    }
}).observe(document.firstElementChild, { childList: true, subtree: true, attributeFilter: ['class'] });
