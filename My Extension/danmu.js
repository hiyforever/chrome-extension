
chrome.webNavigation.onDOMContentLoaded.addListener(details => {
    function readClipboard(onread) {
        function onpaste(evt) {
            evt.preventDefault();
            onread(evt.clipboardData.getData('text/plain'));
        }
        document.addEventListener('paste', onpaste);
        document.execCommand('paste');
        document.removeEventListener('paste', onpaste);
    }
    function addDanmu(cid, details) {
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
                setTimeout(() => chrome.tabs.executeScript(details.tabId, {
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
                                        font-family:Lolita!important;
                                    }
                                    .danmuVideo span {
                                        opacity: .5;
                                        font-weight: bold;
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
                    addDanmu(matchResult[1], details)
                }
            }
        }
        if (search != null) {
            fetch('https://api.bilibili.com/x/player/pagelist?' + search)
                .then(response => response.json())
                .then(result => addDanmu(result.data[num - 1].cid, details));
        }
    });
}, {
    'url': [
        { hostEquals: 'www.bimiacg.com', pathPrefix: '/bangumi' },
        { hostEquals: 'bimiacg.com', pathPrefix: '/bangumi' },
        { hostEquals: 'www.tucao.one', pathPrefix: '/play' },
        { hostEquals: 'www.yhdmk.com', pathPrefix: '/play' },
    ]
});