const sendContextmenuMessage = e => {
    if (chrome.runtime?.id) {
        chrome.runtime.sendMessage({
            event: 'contextmenu',
            data: e.target.innerText || e.target.value || ''
        });
    } else {
        self.removeEventListener('mouseover', sendContextmenuMessage);
    }
}
self.addEventListener('mouseover', sendContextmenuMessage);