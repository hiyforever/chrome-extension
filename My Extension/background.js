chrome.commands.onCommand.addListener((command, tab) => {
    switch (command) {
        case 'duplicate-tab':
            chrome.tabs.duplicate(tab.id);
            break;
    }
});
let removing = false;
chrome.windows.onCreated.addListener(window => chrome.windows.getAll({ populate: true }, windows => {
    if (removing) {
        return;
    }
    removing = true;
    const closeWindows = windows.filter(win => win.id != window.id && win.incognito == window.incognito)
        .filter(window => window.tabs.every(tab => !tab.url));
    closeWindows.forEach(window => chrome.windows.remove(window.id, () => removing = false));
    if (closeWindows.length <= 0) {
        removing = false;
    }
}));
const copyPageTextContextMenu = { id: 'copyPageText', title: '复制文字', contexts: ['page'], documentUrlPatterns: ['*://*/*'] };
const copyTextContextMenuIds = [
    { id: 'copyLinkText', title: '复制链接文字', contexts: ['link'], documentUrlPatterns: ['*://*/*'] },
    copyPageTextContextMenu
];
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (copyTextContextMenuIds.some(item => item.id == info.menuItemId)) {
        if (tab.id < 0) {
            alert('不支持此操作');
            return;
        }
        chrome.tabs.executeScript(tab.id, {
            code: '(' + function () {
                const tag = 'data-context-menu-target';
                const target = document.querySelector('[' + tag + ']');
                target.removeAttribute(tag);
                const text = target.innerText.trim();
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(text).then(null, err => alert(err));
                } else {
                    function oncopy(evt) {
                        evt.preventDefault();
                        evt.clipboardData.setData('text/plain', text);
                    }
                    document.addEventListener('copy', oncopy);
                    document.execCommand('copy');
                    document.removeEventListener('copy', oncopy);
                }
            } + ')()'
        });
    }
});
const resetCopyPageTextContextMenu = () => {
    return chrome.contextMenus.update(copyPageTextContextMenu.id, { title: copyPageTextContextMenu.title });
};
chrome.tabs.onActivated.addListener(resetCopyPageTextContextMenu);
chrome.windows.onFocusChanged.addListener(resetCopyPageTextContextMenu);
chrome.runtime.onInstalled.addListener(() => copyTextContextMenuIds.forEach(e => chrome.contextMenus.create(e)));
chrome.downloads.onChanged.addListener(item => {
    const clean = () => chrome.downloads.erase({ id: item.id });
    if (item.state?.current == 'complete') {
        setTimeout(clean, 5000);
    } else if (item.error?.current == 'USER_CANCELED' && !item.canResume?.current) {
        clean();
    }
});
chrome.runtime.onMessage.addListener(message => {
    switch (message.event) {
        case 'contextmenu':
            const maxLength = 20;
            let text = message.data.trim();
            if (text.length > maxLength) {
                text = text.substr(0, maxLength - 1).trim() + '…';
            }
            chrome.contextMenus.update(copyPageTextContextMenu.id, { title: '复制“' + text + '”' });
            break;
        case 'selectionchange':
            const MD5 = string => {
                function RotateLeft(lValue, iShiftBits) {
                    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
                }
                function AddUnsigned(lX, lY) {
                    var lX4, lY4, lX8, lY8, lResult;
                    lX8 = (lX & 0x80000000);
                    lY8 = (lY & 0x80000000);
                    lX4 = (lX & 0x40000000);
                    lY4 = (lY & 0x40000000);
                    lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
                    if (lX4 & lY4) {
                        return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
                    }
                    if (lX4 | lY4) {
                        if (lResult & 0x40000000) {
                            return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
                        } else {
                            return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
                        }
                    } else {
                        return (lResult ^ lX8 ^ lY8);
                    }
                }

                function F(x, y, z) { return (x & y) | ((~x) & z); }
                function G(x, y, z) { return (x & z) | (y & (~z)); }
                function H(x, y, z) { return (x ^ y ^ z); }
                function I(x, y, z) { return (y ^ (x | (~z))); }

                function FF(a, b, c, d, x, s, ac) {
                    a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
                    return AddUnsigned(RotateLeft(a, s), b);
                };

                function GG(a, b, c, d, x, s, ac) {
                    a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
                    return AddUnsigned(RotateLeft(a, s), b);
                };

                function HH(a, b, c, d, x, s, ac) {
                    a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
                    return AddUnsigned(RotateLeft(a, s), b);
                };

                function II(a, b, c, d, x, s, ac) {
                    a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
                    return AddUnsigned(RotateLeft(a, s), b);
                };

                function ConvertToWordArray(string) {
                    var lWordCount;
                    var lMessageLength = string.length;
                    var lNumberOfWords_temp1 = lMessageLength + 8;
                    var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
                    var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
                    var lWordArray = Array(lNumberOfWords - 1);
                    var lBytePosition = 0;
                    var lByteCount = 0;
                    while (lByteCount < lMessageLength) {
                        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
                        lBytePosition = (lByteCount % 4) * 8;
                        lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
                        lByteCount++;
                    }
                    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
                    lBytePosition = (lByteCount % 4) * 8;
                    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
                    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
                    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
                    return lWordArray;
                };

                function WordToHex(lValue) {
                    var WordToHexValue = "", WordToHexValue_temp = "", lByte, lCount;
                    for (lCount = 0; lCount <= 3; lCount++) {
                        lByte = (lValue >>> (lCount * 8)) & 255;
                        WordToHexValue_temp = "0" + lByte.toString(16);
                        WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
                    }
                    return WordToHexValue;
                };

                function Utf8Encode(string) {
                    string = string.replace(/\r\n/g, "\n");
                    var utftext = "";

                    for (var n = 0; n < string.length; n++) {

                        var c = string.charCodeAt(n);

                        if (c < 128) {
                            utftext += String.fromCharCode(c);
                        }
                        else if ((c > 127) && (c < 2048)) {
                            utftext += String.fromCharCode((c >> 6) | 192);
                            utftext += String.fromCharCode((c & 63) | 128);
                        }
                        else {
                            utftext += String.fromCharCode((c >> 12) | 224);
                            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                            utftext += String.fromCharCode((c & 63) | 128);
                        }

                    }

                    return utftext;
                };

                var x = Array();
                var k, AA, BB, CC, DD, a, b, c, d;
                var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
                var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
                var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
                var S41 = 6, S42 = 10, S43 = 15, S44 = 21;

                string = Utf8Encode(string);

                x = ConvertToWordArray(string);

                a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

                for (k = 0; k < x.length; k += 16) {
                    AA = a; BB = b; CC = c; DD = d;
                    a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
                    d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
                    c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
                    b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
                    a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
                    d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
                    c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
                    b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
                    a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
                    d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
                    c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
                    b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
                    a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
                    d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
                    c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
                    b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
                    a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
                    d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
                    c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
                    b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
                    a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
                    d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
                    c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
                    b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
                    a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
                    d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
                    c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
                    b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
                    a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
                    d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
                    c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
                    b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
                    a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
                    d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
                    c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
                    b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
                    a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
                    d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
                    c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
                    b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
                    a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
                    d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
                    c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
                    b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
                    a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
                    d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
                    c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
                    b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
                    a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
                    d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
                    c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
                    b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
                    a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
                    d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
                    c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
                    b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
                    a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
                    d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
                    c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
                    b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
                    a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
                    d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
                    c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
                    b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
                    a = AddUnsigned(a, AA);
                    b = AddUnsigned(b, BB);
                    c = AddUnsigned(c, CC);
                    d = AddUnsigned(d, DD);
                }

                var temp = WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d);

                return temp.toLowerCase();
            };
            var appid = '20151211000007653';
            var key = 'IFJB6jBORFuMmVGDRude';
            var salt = new Date().getTime();
            var sign = MD5(appid + message.data + salt + key);
            fetch('http://api.fanyi.baidu.com/api/trans/vip/translate?q=' + encodeURIComponent(message.data) + '&appid=' + appid + '&salt=' + salt + '&from=auto&to=zh&sign=' + sign)
                .then(response => response.json()).then(data => {
                    let text = message.data;
                    data.trans_result.forEach(result => text = text.replace(result.src, result.dst));
                    if (!text || message.data == text) {
                        return;
                    }
                    chrome.tabs.executeScript({
                        allFrames: true,
                        code: '(' + function (source, target, x, y) {
                            if (document.getSelection().toString() != unescape(source)) {
                                return;
                            }
                            const element = document.createElement('pre');
                            element.innerText = unescape(target).trim();
                            element.style.width = 'initial';
                            element.style.height = 'initial';
                            element.style.maxWidth = '30em';
                            element.style.maxHeight = '20em';
                            element.style.overflow = 'auto';
                            element.style.textAlign = 'initial';
                            element.style.position = 'absolute';
                            element.style.left = x + 'px';
                            element.style.top = y + 'px';
                            element.style.zIndex = Number.MAX_SAFE_INTEGER;
                            element.style.backgroundColor = 'white';
                            element.style.border = '1px solid rgba(0,0,0,.2)';
                            element.style.boxShadow = '0 2px 4px rgba(0,0,0,.2)';
                            element.style.margin = 'initial';
                            element.style.padding = '5px 8px';
                            element.style.outline = 'none';
                            element.style.font = 'initial';
                            element.style.color = 'initial';
                            element.style.whiteSpace = 'pre-wrap';
                            element.style.overflowWrap = 'anywhere';
                            element.setAttribute('tabindex', 0);
                            element.onblur = () => element.remove();
                            document.body.append(element);
                            element.focus();
                        } + ')("' + escape(message.data) + '","' + escape(text) + '",' + message.x + ',' + message.y + ')'
                    });
                });
            break;
    }
});

if (navigator.appVersion.includes('Edg')) {
    const tabIdList = new Set();
    chrome.windows.onCreated.addListener(window => chrome.windows.get(window.id, { populate: true }, window => {
        const tabId = window.tabs[0].id;
        if (window.tabs.length == 1 && !tabIdList.has(tabId)) {
            tabIdList.add(tabId);
            chrome.windows.create({
                tabId: tabId,
                left: window.left,
                top: window.top,
                width: window.width,
                height: window.height,
                incognito: window.incognito,
                focused: window.focused,
                type: window.type,
            }, newWindow => chrome.windows.update(newWindow.id, { state: window.state }));
        } else {
            tabIdList.delete(tabId);
        }
    }));
}

chrome.webNavigation.onDOMContentLoaded.addListener(() => {
    function readClipboard(onread) {
        function onpaste(evt) {
            evt.preventDefault();
            onread(evt.clipboardData.getData('text/plain'));
        }
        document.addEventListener('paste', onpaste);
        document.execCommand('paste');
        document.removeEventListener('paste', onpaste);
    }
    function addDanmu(cid) {
        fetch('https://comment.bilibili.com/' + cid + '.xml')
            .then(response => response.text())
            .then(result => {
                allDanmus = [];
                var xml = new DOMParser().parseFromString(result, 'text/xml').getElementsByTagName('d');
                for (var i = 0; i < xml.length; i++) {
                    var p = xml[i].getAttribute('p').split(',');
                    var color = parseInt(p[3]).toString(16);
                    allDanmus.push({
                        'id': p[7],
                        'time': p[0],
                        'local': parseInt(p[1]),
                        'font': p[2],
                        'color': '#' + new Array(7 - color.length).join(0) + color,
                        'text': xml[i].textContent
                    });
                }
                setTimeout(() => chrome.tabs.executeScript({
                    allFrames: true,
                    code: '(' + function (allDanmus) {
                        var video = document.getElementsByTagName('video')[0];
                        if (!video || video.parentElement.classList.contains('danmuVideo')) {
                            return;
                        }
                        addDanmus(video, allDanmus);
                        function addDanmus(video, danmus) {
                            if (!this.style) {
                                this.style = document.createElement('style');
                                this.style.innerHTML = `
                                    .danmuVideo {
                                        position: relative;
                                        margin: auto;
                                    }
                                    .danmuVideo video {
                                        width: 100%;
                                        height: 100%;
                                        background-color: black;
                                    }
                                    .danmuVideo .danmuDiv {
                                        position: absolute;
                                        width: 100%;
                                        height: 100%;
                                        overflow: hidden;
                                        text-align: center;
                                        pointer-events: none;
                                    }
                                    .danmuVideo span {
                                        opacity: .5;
                                        text-shadow: 1px 1px 1px black;
                                        position: absolute;
                                        white-space: nowrap;
                                        line-height: initial;
                                    }
                                    .danmuVideo .danmuShow {
                                        animation: danmuShow 6s
                                    }
                                    @keyframes danmuShow {}`;
                                document.firstElementChild.appendChild(this.style);
                            }
                            const danmuDiv = document.createElement('div');
                            danmuDiv.classList.add('danmuDiv');
                            danmuDiv.style.fontSize = '100%';
                            danmuDiv.style.lineHeight = 'initial';
                            danmuDiv.allDanmus = danmus;
                            danmuDiv.currentTime = 0;
                            danmuDiv.addDanmu = danmu => {
                                if (document.getElementById('danmu' + danmu.id)) {
                                    return;
                                }
                                var danmuSpan = document.createElement('span');
                                danmuSpan.addEventListener('animationend', () => {
                                    danmuSpan.remove();
                                });
                                danmuSpan.id = 'danmu' + danmu.id;
                                danmuSpan.innerText = danmu.text;
                                danmuSpan.style.fontSize = danmu.font / 12 + 'em';
                                danmuSpan.style.color = danmu.color;
                                danmuDiv.appendChild(danmuSpan);
                                switch (danmu.local) {
                                    case 5:
                                        for (var i = 0; danmuDiv.getElementsByClassName('danmuTop' + i).length > 0; i++) { }
                                        danmuSpan.style.transform = 'translateX(-50%) translateY(' + (i * 100) + '%)';
                                        danmuSpan.classList.add('danmuShow');
                                        danmuSpan.classList.add('danmuTop' + i);
                                        break;
                                    case 4:
                                        for (i = 0; danmuDiv.getElementsByClassName('danmuBottom' + i).length > 0; i++) { }
                                        danmuSpan.style.bottom = 0;
                                        danmuSpan.style.transform = 'translateX(-50%) translateY(' + (-i * 100) + '%)';
                                        danmuSpan.classList.add('danmuShow');
                                        danmuSpan.classList.add('danmuBottom' + i);
                                        break;
                                    default:
                                        for (i = 0; danmuDiv.getElementsByClassName('danmuMove' + i).length > 0; i++) {
                                            if (!Array.from(danmuDiv.getElementsByClassName('danmuMove' + i)).find(e => getComputedStyle(e).right.replace('px', '') < danmuSpan.offsetWidth)) {
                                                break;
                                            }
                                        }
                                        var danmuStyle = document.createElement('style');
                                        danmuStyle.innerHTML = '@keyframes danmuMove' + danmu.id + '{from{left:100%;transform:translateX(0%) translateY(' + (i * 100) + '%);}to{left:0%;transform: translateX(-100%) translateY(' + (i * 100) + '%);}}';
                                        danmuSpan.appendChild(danmuStyle);
                                        danmuSpan.style.animation = 'danmuMove' + danmu.id + ' 10s linear';
                                        danmuSpan.classList.add('danmuMove' + i);
                                        break;
                                }
                                danmuSpan.style.animationPlayState = 'inherit';
                            };
                            document.onwebkitfullscreenchange = () => {
                                danmuDiv.style.fontSize = document.fullscreenElement ? '125%' : '100%';
                            };
                            video.parentElement.classList.add('danmuVideo');
                            video.parentElement.style.fontSize = 'unset';
                            video.parentElement.prepend(danmuDiv);
                            video.onplaying = () => danmuDiv.style.animationPlayState = 'running';
                            video.ontimeupdate = () => {
                                if (!video.paused) {
                                    danmuDiv.allDanmus.forEach(danmu => {
                                        if (danmu.time <= video.currentTime && (danmuDiv.currentTime == 0 || danmu.time > danmuDiv.currentTime)) {
                                            danmuDiv.addDanmu(danmu);
                                        }
                                    });
                                }
                                danmuDiv.currentTime = video.currentTime;
                            };
                            video.onseeking = () => {
                                danmuDiv.innerHTML = '';
                                danmuDiv.currentTime = video.currentTime;
                            };
                            video.onpause = () => danmuDiv.style.animationPlayState = 'paused';
                            video.addEventListener('waiting', video.onpause);
                        }
                    } + ')(' + JSON.stringify(allDanmus) + ')'
                }), 1000);
            });
    }
    readClipboard(data => {
        var search;
        var num = 1;
        var matchResult = data.match(/^(\d*)AV(\d+)$/);
        if (matchResult != null) {
            num = parseInt(matchResult[1]) || 1;
            search = 'aid=' + matchResult[2];
        } else {
            matchResult = data.match(/^(\d*)BV(\w+)$/);
            if (matchResult != null) {
                num = parseInt(matchResult[1]) || 1;
                search = 'bvid=' + matchResult[2];
            } else {
                matchResult = data.match(/^CV(\d+)$/);
                if (matchResult != null) {
                    addDanmu(matchResult[1])
                }
            }
        }
        if (search != null) {
            fetch('https://api.bilibili.com/x/player/pagelist?' + search)
                .then(response => response.json())
                .then(result => addDanmu(result.data[num - 1].cid));
        }
    });
}, {
    'url': [
        { hostEquals: 'www.bimiacg.com', pathPrefix: '/bangumi' },
        { urlMatches: '.*bimiacg.*net.*', pathPrefix: '/bangumi' },
        { hostEquals: 'bimiacg.com', pathPrefix: '/bangumi' },
        { hostEquals: 'www.tucao.one', pathPrefix: '/play' },
        { hostEquals: 'www.yhdmk.com', pathPrefix: '/play' },
        { hostEquals: 'www.bbdm.cc', pathPrefix: '/play' },
        { hostEquals: 'www.yhdm.so', pathPrefix: '/v' },
        { hostEquals: 'www.yinghuacd.com', pathPrefix: '/v' },
    ]
});