const visitTabs = {};
chrome.commands.onCommand.addListener((command, tab) => {
    switch (command) {
        case 'switch-tab':
            const tabs = Array.from(visitTabs[tab.windowId] ?? []);
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
chrome.tabs.onRemoved.addListener((tabId, info) => visitTabs[info.windowId]?.delete(tabId));
chrome.windows.onRemoved.addListener(windowId => delete visitTabs[windowId]);