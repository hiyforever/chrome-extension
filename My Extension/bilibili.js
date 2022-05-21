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
                    setTimeout(() => document.querySelector('#bilibiliPlayer, #bilibili-player').scrollIntoView({ block: 'center' }), 0);
                }
            });
        });
    } else if (e.target.classList && (
        e.target.classList.contains('bilibili-player-video-btn-widescreen') ||
        e.target.classList.contains('squirtle-video-widescreen'))) {
        const interval = setInterval(() => {
            if (e.target.classList.contains('closed') || e.target.classList.contains('active')) {
                clearInterval(interval);
            } else {
                e.target.click();
                document.querySelector('#bilibiliPlayer, #bilibili-player').scrollIntoView({ block: 'center' });
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