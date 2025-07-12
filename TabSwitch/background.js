chrome.commands.onCommand.addListener((command, tab) => {
    switch (command) {
        case 'switch-tab':
            getTabs(tab.windowId).then(tabs => {
                tabs = Array.from(tabs);
                const preVisitTab = tabs[tabs.length - 2];
                if (preVisitTab) {
                    chrome.tabs.update(preVisitTab, { active: true });
                }
            });
            break;
    }
});
chrome.tabs.onActivated.addListener(info => {
    const tabId = info.tabId;
    if (tabId < 0) {
        return;
    }
    getTabs(info.windowId).then(tabs => {
        tabs.delete(tabId);
        tabs.add(tabId);
        setTabs(info.windowId, tabs);
    });
});
chrome.tabs.onRemoved.addListener((tabId, info) => getTabs(info.windowId).then(tabs => {
    tabs.delete(tabId);
    setTabs(info.windowId, tabs);
}));
chrome.windows.onRemoved.addListener(windowId => removeTabs(windowId));

function getTabs(windowId) {
    const key = String(windowId);
    return chrome.storage.session.get(key).then(r => new Set(r[key] ?? []));
}

function setTabs(windowId, tabs) {
    const result = {};
    result[String(windowId)] = Array.from(tabs);
    return chrome.storage.session.set(result);
}

function removeTabs(windowId) {
    return chrome.storage.session.remove(String(windowId));
}
