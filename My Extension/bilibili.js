self.addEventListener('DOMNodeInserted', e => {
    if (e.target.classList && e.target.classList.contains('bilibili-player-ending-panel')) {
        e.target.querySelectorAll('.bilibili-player-ending-panel-box-recommend').forEach(e => {
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
    } else if (e.target.classList && e.target.classList.contains('bpx-player-ending')) {
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
    } else if (e.target.classList && (
        e.target.classList.contains('bilibili-player-video-btn-widescreen') ||
        e.target.classList.contains('squirtle-video-widescreen') ||
        e.target.classList.contains('bpx-player-ctrl-wide'))) {
        const interval = setInterval(() => {
            if (e.target.classList.contains('closed') ||
                e.target.classList.contains('active') ||
                e.target.classList.contains('bpx-state-entered')) {
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
                e.target.click();
            }
        }, 0);
    }
});
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
    document.querySelector('#bilibiliPlayer, #bilibili-player').scrollIntoView({ block: 'center' });
}
