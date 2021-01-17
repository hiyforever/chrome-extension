if (document.querySelector('.live-room-app')) {
    for (let i = 0; i < 2; i++) {
        const interval = setInterval(() => {
            if (!document.body.classList.contains('player-full-win')) {
                document.body.classList.add('player-full-win', 'over-hidden');
                clearInterval(interval);
            }
        }, 0);
    }
    const controller = document.querySelector('.bilibili-live-player-video-controller');
    setInterval(() => controller.click(), 10000);
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