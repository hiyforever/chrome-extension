const recordTabContextMenuId = 'recordTab';
const recordTabTitle = '录制标签页';
const cancelRecordTabTitle = '结束录制标签页';
const recordTabs = {};
chrome.tabs.onActivated.addListener(showRecordTabContextMenu);
chrome.windows.onFocusChanged.addListener(windowId => {
    if (windowId < 0) {
        hiddenMuteTabContextMenu();
    } else {
        showRecordTabContextMenu();
    }
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case recordTabContextMenuId:
            const recorder = recordTabs[tab.id];
            if (recorder) {
                recorder.stop();
                return;
            }
            chrome.tabCapture.capture({ video: true, audio: true }, stream => {
                if (recordTabs.hasOwnProperty(tab.id)) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }
                stream.getTracks().forEach(track =>
                    track.addEventListener('ended', () =>
                        stream.getTracks().forEach(track => track.stop())
                    )
                );
                const recorder = new MediaRecorder(stream);
                recorder.ondataavailable = e => {
                    if (e.data.size > 0) {
                        const url = URL.createObjectURL(e.data);
                        const a = document.createElement('a');
                        a.style.display = 'none';
                        a.href = url;
                        a.download = tab.title + '.webm';
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);
                    }
                };
                recorder.onstop = () => {
                    delete recordTabs[tab.id];
                    stream.getTracks().forEach(track => track.stop());
                    showRecordTabContextMenu();
                };
                recorder.start(1800000);
                recordTabs[tab.id] = recorder;
                showRecordTabContextMenu();
            });
            break;
    }
});
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: recordTabContextMenuId,
        title: recordTabTitle,
        contexts: ['page']
    });
});
function showRecordTabContextMenu() {
    chrome.tabs.getSelected(tab => {
        if (!tab) {
            return;
        }
        chrome.contextMenus.update(recordTabContextMenuId, {
            title: recordTabs.hasOwnProperty(tab.id) ? cancelRecordTabTitle : recordTabTitle,
            enabled: true
        });
    });
}
function hiddenMuteTabContextMenu() {
    chrome.contextMenus.update(recordTabContextMenuId, { enabled: false });
}
