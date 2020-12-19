const muteTabContextMenuId = 'muteTab';
const muteTabTitle = '将这个标签静音';
const cancelMuteTabTitle = '将这个标签取消静音';
chrome.tabs.onActivated.addListener(showMuteTabContextMenu);
chrome.windows.onFocusChanged.addListener(windowId => {
    if (windowId < 0) {
        hiddenMuteTabContextMenu();
    } else {
        showMuteTabContextMenu();
    }
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.mutedInfo) {
        showMuteTabContextMenu();
    }
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case muteTabContextMenuId:
            chrome.tabs.update(tab.id, { muted: !tab.mutedInfo.muted });
            break;
    }
});
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: muteTabContextMenuId,
        title: muteTabTitle
    });
    showMuteTabContextMenu();
});
function showMuteTabContextMenu() {
    chrome.tabs.getSelected(tab => {
        if (!tab) {
            return;
        }
        chrome.contextMenus.update(muteTabContextMenuId, {
            title: tab.mutedInfo.muted ? cancelMuteTabTitle : muteTabTitle,
            enabled: true
        });
    });
}
function hiddenMuteTabContextMenu() {
    chrome.contextMenus.update(muteTabContextMenuId, { enabled: false });
}
