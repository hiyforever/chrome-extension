const visitTabs = {};
chrome.commands.onCommand.addListener((command, tab) => {
    switch (command) {
        case 'duplicate-tab':
            chrome.tabs.duplicate(tab.id);
            break;
        case 'switch-tab':
            const tabs = Array.from(visitTabs[tab.windowId] || []);
            const preVisitTab = tabs[tabs.length - 2];
            if (preVisitTab) {
                chrome.tabs.update(preVisitTab, { active: true });
            }
            break;
    }
});
chrome.tabs.onActivated.addListener(info => {
    const tabId = info.tabId;
    if (tabId < 0) {
        return;
    }
    let tabs = visitTabs[info.windowId];
    if (!tabs) {
        visitTabs[info.windowId] = tabs = new Set();
    }
    tabs.delete(tabId);
    tabs.add(info.tabId);
});
chrome.tabs.onRemoved.addListener((tabId, info) => {
    const tabs = visitTabs[info.windowId];
    if (tabs) {
        tabs.delete(tabId);
    }
});
chrome.windows.onRemoved.addListener(windowId => delete visitTabs[windowId]);
const copyLinkTextContextMenuId = 'copyLinkText';
chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case copyLinkTextContextMenuId:
            if (tab.id < 0) {
                alert('不支持此操作');
                return;
            }
            chrome.tabs.executeScript(tab.id, {
                code: '(' + function () {
                    const tag = 'data-context-menu-target';
                    const target = document.querySelector('[' + tag + ']');
                    target.removeAttribute(tag);
                    const text = target.innerText;
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(text).then(null, err => alert(err));
                    } else {
                        function oncopy(evt) {
                            evt.preventDefault();
                            evt.clipboardData.setData('text/plain', text);
                        }
                        document.addEventListener('copy', oncopy);
                        document.execCommand('copy');
                        document.removeEventListener('copy', oncopy);
                    }
                } + ')()'
            });
            break;
    }
});
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: copyLinkTextContextMenuId,
        title: '复制链接文字',
        contexts: ['link']
    });
});