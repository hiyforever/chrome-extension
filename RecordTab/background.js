const recordTabContextMenuId = 'recordTab';
const recordTabTitle = '录制标签页';
const cancelRecordTabTitle = '结束录制标签页';
const recordTabs = {};
chrome.tabs.onActivated.addListener(updateRecordTabContextMenu);
chrome.windows.onFocusChanged.addListener(updateRecordTabContextMenu);
chrome.alarms.onAlarm.addListener(() => { });
chrome.runtime.onSuspend.addListener(() => {
    if (Object.keys(recordTabs).length > 0) {
        chrome.alarms.create({ when: Date.now() });
    }
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
        case recordTabContextMenuId:
            if (tab.id < 0) {
                alert('不支持此操作');
                return;
            }
            function stopStream() {
                const stream = recordTabs[tab.id];
                if (stream) {
                    delete recordTabs[tab.id];
                    stream.getTracks().forEach(track => track.stop());
                    updateRecordTabContextMenu();
                    return true;
                }
                return false;
            }
            if (stopStream()) {
                return;
            }
            chrome.tabCapture.capture({
                video: true, audio: true, videoConstraints: {
                    mandatory: {
                        maxWidth: tab.width,
                        maxHeight: tab.height
                    }
                }
            }, stream => {
                if (tab.id in recordTabs) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }
                stream.getTracks().forEach(track => track.addEventListener('ended', stopStream));
                recordTabs[tab.id] = stream;
                updateRecordTabContextMenu();
                const recorder = new MediaRecorder(stream);
                recorder.ondataavailable = e => {
                    if (e.data.size > 0) {
                        try {
                            recorder.stop();
                        } catch (error) { }
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
                const timeSlice = 3600000;
                recorder.onstop = () => {
                    if (tab.id in recordTabs) {
                        recorder.start(timeSlice);
                    }
                };
                recorder.start(timeSlice);
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
