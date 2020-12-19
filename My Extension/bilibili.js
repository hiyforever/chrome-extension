self.addEventListener('DOMNodeInserted', e => {
    if (e.target.classList && e.target.classList.contains('bilibili-player-ending-panel-box-recommend')) {
        e.target.addEventListener('mousedown', evt => {
            if (evt.button == 1) {
                evt.preventDefault();
            }
        });
        e.target.addEventListener('mouseup', evt => {
            if (evt.button == 1) {
                window.open('/video/' + e.target.getAttribute('data-bvid'));
            }
        });
    } else if (e.target.classList && e.target.classList.contains('bilibili-player-video-btn-widescreen')) {
        setTimeout(() => {
            const player = document.querySelector('#bilibiliPlayer');
            if (player.className.indexOf('mode-') < 0) {
                e.target.click();
                player.scrollIntoView({ block: 'center' });
            }
        }, 0);
    }
});
localStorage.removeItem('search_history');