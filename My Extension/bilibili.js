new MutationObserver(list => {
    list.forEach(d => d.addedNodes.forEach(e => {
        const t = e;
        if (t.classList && t.classList.contains('bilibili-player-ending-panel')) {
            t.querySelectorAll('.bilibili-player-ending-panel-box-recommend').forEach(e => {
                e.addEventListener('mousedown', evt => {
                    if (evt.button == 1) {
                        evt.preventDefault();
                    }
                });
                e.addEventListener('mouseup', evt => {
                    if (evt.button == 1) {
                        window.open('/video/' + e.getAttribute('data-bvid'));
                    } else if (evt.button == 0) {
                        setTimeout(() => scrollVideoCenter(), 0);
                    }
                });
            });
        } else if (t.classList && t.classList.contains('bpx-player-ending')) {
            const items = document.querySelectorAll('.bpx-player-ending-related-item-cover');
            const links = document.querySelectorAll('.video-page-card-small .pic a');
            for (let i = 0; i < items.length; i++) {
                const e = items[i];
                e.addEventListener('mousedown', evt => {
                    if (evt.button == 1) {
                        evt.preventDefault();
                    }
                });
                e.addEventListener('mouseup', evt => {
                    if (evt.button == 1) {
                        window.open(links[i].href);
                    } else if (evt.button == 0) {
                        setTimeout(() => scrollVideoCenter(), 0);
                    }
                });
            }
        } else if (t.classList && (
            t.classList.contains('bilibili-player-video-btn-widescreen') ||
            t.classList.contains('squirtle-video-widescreen') ||
            t.classList.contains('bpx-player-ctrl-wide'))) {
            const interval = setInterval(() => {
                if (t.classList.contains('closed') ||
                    t.classList.contains('active') ||
                    t.classList.contains('bpx-state-entered')) {
                    clearInterval(interval);
                    scrollVideoCenter();
                    let cnt = 2;
                    const scrollVideo = () => {
                        if (--cnt <= 0) {
                            document.removeEventListener('scroll', scrollVideo);
                        }
                        scrollVideoCenter();
                    };
                    document.addEventListener('scroll', scrollVideo);
                } else {
                    t.click();
                }
            }, 0);
        }
    }));
}).observe(document.firstElementChild, { childList: true, subtree: true });

setInterval(() => {
    if (document.querySelector('.bilibili-player-electric-panel')?.style.display == 'block') {
        document.querySelector('.bilibili-player-electric-panel-jump-content')?.click();
    }
}, 0);
if (location.host == 'search.bilibili.com') {
    try {
        matchActions.push(matchActions.shift());
    } catch (error) {
        console.log(error);
    }
}

function scrollVideoCenter() {
    document.querySelector('#bilibiliPlayer, #bilibili-player, #playerWrap').scrollIntoView({ block: 'center' });
}
