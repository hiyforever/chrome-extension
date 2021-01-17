const recordTabContextMenuId = 'recordTab';
const recordTabTitle = '录制标签页';
const cancelRecordTabTitle = '结束录制标签页';
const recordTabs = {};
chrome.tabs.onActivated.addListener(updateRecordTabContextMenu);
chrome.windows.onFocusChanged.addListener(updateRecordTabContextMenu);
chrome.alarms.onAlarm.addListener(() => { });
chrome.runtime.onSuspend.addListener(() => {
    if (Object.keys(recordTabs).length > 0) {
        chrome.alarms.create({ when: 0 });
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
                        maxWidth: 2 * tab.width,
                        maxHeight: 2 * tab.height
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
                let recordData = [];
                const recorder = new MediaRecorder(stream);
                recorder.ondataavailable = e => {
                    if (e.data.size > 0) {
                        recordData.push(e.data);
                        chrome.system.memory.getInfo(info => {
                            const limit = 1024 * 1024 * 1024;
                            const size = recordData.map(data => data.size).reduce((total, size) => total + size, 0);
                            if (size >= limit || info.availableCapacity < limit && size >= limit / 8) {
                                recorder.stop();
                            }
                        });
                    }
                };
                const timeSlice = 600_000;
                recorder.onstop = () => {
                    if (tab.id in recordTabs) {
                        recorder.start(timeSlice);
                    }
                    if (recordData.length > 0) {
                        const url = URL.createObjectURL(new Blob(recordData));
                        recordData = [];
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