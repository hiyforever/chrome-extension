if (document.querySelector('.live-room-app')) {
    document.body.classList.add('player-full-win', 'over-hidden');
    const controller = document.querySelector('.bilibili-live-player-video-controller');
    const fixFullPage = e => {
        const fullpage = document.querySelector('#player_fullpage');
        if (fullpage) {
            controller.removeEventListener('DOMNodeInserted', fixFullPage);
            document.body.className = ' ' + document.body.className;
            setTimeout(() => e.target.parentElement.click(), 0);
        }
    };
    controller.addEventListener('DOMNodeInserted', fixFullPage);
}