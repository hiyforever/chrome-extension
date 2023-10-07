const fullPageContextMenu = { id: 'fullPage', title: '视频网页全屏', contexts: ['page', 'video'], documentUrlPatterns: ['*://*/*'] };
chrome.contextMenus.onClicked.addListener(info => {
    if (fullPageContextMenu.id != info.menuItemId) {
        return;
    }
    chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(([tab]) => {
        chrome.scripting.executeScript({
            target: {
                allFrames: true,
                tabId: tab.id
            },
            func: () => {
                const video = document.querySelector('video.player') || document.querySelector('video');
                if (!video) {
                    return;
                }
                const container = video.parentElement.parentElement.parentElement;
                addEventListener('keydown', e => {
                    if (e.key == 'Escape') {
                        container.style.display = container.style.display == 'none' ? 'unset' : 'none';
                    }
                });
                container.style.display = 'unset';
                video.style.width = container.style.width = '100vw';
                video.style.height = container.style.height = '100vh';
                video.style.maxWidth = video.style.maxHeight = container.style.maxWidth = container.style.maxHeight = 'unset';
                container.style.position = 'fixed';
                container.style.left = container.style.top = 0;
                container.style.zIndex = Number.MAX_SAFE_INTEGER;
            }
        });
    });
});
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create(fullPageContextMenu);
});