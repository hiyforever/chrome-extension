for (let i = 0; i < 2; i++) {
    const interval = setInterval(() => {
        const iframe = document.querySelector('.live-non-revenue-player iframe');
        if (iframe && iframe.style.position != 'fixed') {
            iframe.style.position = 'fixed';
            iframe.style.left = '0px';
            iframe.style.top = '0px';
            clearInterval(interval);
        }
    }, 0);
}
const liveApp = document.querySelector('.live-room-app');
if (liveApp) {
    for (let i = 0; i < 2; i++) {
        const interval = setInterval(() => {
            if (!document.body.classList.contains('player-full-win')) {
                document.body.classList.add('player-full-win', 'over-hidden');
                clearInterval(interval);
            }
        }, 0);
    }
    const fixFullPage = e => {
        const fullpage = document.querySelector('#player_fullpage');
        if (fullpage) {
            liveApp.removeEventListener('DOMNodeInserted', fixFullPage);
            document.body.className = ' ' + document.body.className;
            setTimeout(() => e.target.parentElement.click(), 0);
        }
    };
    liveApp.addEventListener('DOMNodeInserted', fixFullPage);
}