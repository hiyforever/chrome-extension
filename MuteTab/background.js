const muteTabContextMenuId = 'muteTab';
const muteTabTitle = '将这个标签静音';
const cancelMuteTabTitle = '将这个标签取消静音';
chrome.tabs.onActivated.addListener(updateMuteTabContextMenu);
chrome.windows.onFocusChanged.addListener(updateMuteTabContextMenu);
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.mutedInfo) {
        updateMuteTabContextMenu();
    }
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case muteTabContextMenuId:
            if (tab.id < 0) {
                alert('不支持此操作');
                return;
            }
            chrome.tabs.update(tab.id, { muted: !tab.mutedInfo.muted });
            break;
    }
});
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: muteTabContextMenuId,
        title: muteTabTitle
    });
    updateMuteTabContextMenu();
});
function updateMuteTabContextMenu() {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const tab = tabs[0];
        if (tab) {
            chrome.contextMenus.update(muteTabContextMenuId, {
                title: tab.mutedInfo.muted ? cancelMuteTabTitle : muteTabTitle
            });
        }
    });
}
