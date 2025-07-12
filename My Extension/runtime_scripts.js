const sendContextmenuEvents = ['mouseover', 'mousedown'];
const sendContextmenuMessage = e => {
    if (chrome.runtime?.id) {
        if (e.type == 'mousedown' && e.button != 2) {
            return;
        }
        chrome.runtime.sendMessage({
            event: 'contextmenu',
            data: extractElementCopyData(e.target),
        });
    } else {
        sendContextmenuEvents.forEach(event => self.removeEventListener(event, sendContextmenuMessage));
    }
};
sendContextmenuEvents.forEach(event => self.addEventListener(event, sendContextmenuMessage));

function extractElementCopyData(e) {
    return {
        'text/plain': trim(e.innerText) || trim(e.value) ||
            trim(e.src) || trim(e.href) || trim(e.placeholder) || '',
        'text/html': e.outerHTML,
    };

    function trim(t) {
        return t?.replace?.(/^[\s\u200B-\u200D\uFEFF]+|[\s\u200B-\u200D\uFEFF]+$/g, '');
    }
}