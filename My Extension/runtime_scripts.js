const sendContextmenuEvents = ['mouseover', 'mousedown'];
const sendContextmenuMessage = e => {
    if (chrome.runtime?.id) {
        if (e.type == 'mousedown' && e.button != 2) {
            return;
        }
        chrome.runtime.sendMessage({
            event: 'contextmenu',
            data: e.target.innerText?.trim() || e.target.value,
        });
    } else {
        sendContextmenuEvents.forEach(event => self.removeEventListener(event, sendContextmenuMessage));
    }
};
sendContextmenuEvents.forEach(event => self.addEventListener(event, sendContextmenuMessage));