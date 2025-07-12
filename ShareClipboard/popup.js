const peer = new Peer(pcId);
peer.on('connection', conn => onConnect(conn));
peer.on('open', () => onConnect(peer.connect(toId)));
function onConnect(conn) {
    conn.on('close', () => window.close());
    conn.on('data', data => {
        data = data?.trim();
        if (data) {
            hint.innerText = '复制中…';
            function oncopy(evt) {
                evt.preventDefault();
                evt.clipboardData.setData('text/plain', data);
                window.close();
            }
            document.addEventListener('copy', oncopy);
            document.execCommand('copy');
            document.removeEventListener('copy', oncopy);
        } else {
            window.close();
        }
    });
    conn.on('open', () => readClipboard().then(text => conn.send(text?.trim())));
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = e => resolve(e.target.result);
        fileReader.onerror = e => reject(e);
        fileReader.readAsDataURL(blob);
    });
}
function readClipboard() {
    return new Promise(resolve => {
        function onpaste(evt) {
            evt.preventDefault();
            if (evt.clipboardData.files.length > 0) {
                const data = evt.clipboardData.files[0];
                blobToBase64(data).then(base64 => resolve(base64));
            } else {
                resolve(evt.clipboardData.getData('text/plain'));
            }
        }
        document.addEventListener('paste', onpaste);
        document.execCommand('paste');
        document.removeEventListener('paste', onpaste);
    });
}
