const recordTabContextMenuId = 'recordTab';
const recordTabTitle = '录制标签页';
const cancelRecordTabTitle = '结束录制标签页';
const recordTabs = {};
chrome.tabs.onActivated.addListener(updateRecordTabContextMenu);
chrome.windows.onFocusChanged.addListener(updateRecordTabContextMenu);
chrome.alarms.onAlarm.addListener(() => {
    if (Object.keys(recordTabs).length > 0) {
        chrome.alarms.create({ when: Date.now() + 1000 });
    }
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case recordTabContextMenuId:
            if (tab.id < 0) {
                alert('不支持此操作');
                return;
            }
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
                    updateRecordTabContextMenu();
                };
                recorder.start(1800000);
                recordTabs[tab.id] = recorder;
                updateRecordTabContextMenu();
                if (Object.keys(recordTabs).length == 1) {
                    chrome.alarms.create({ when: Date.now() + 1000 });
                }
            });
            break;
    }
});
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: recordTabContextMenuId,
        title: recordTabTitle
    });
});
function updateRecordTabContextMenu() {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const tab = tabs[0];
        if (tab) {
            chrome.contextMenus.update(recordTabContextMenuId, {
                title: tab.id in recordTabs ? cancelRecordTabTitle : recordTabTitle
            });
        }
    });
}
