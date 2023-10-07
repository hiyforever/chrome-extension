addEventListener('blur', () => {
    const video = document.querySelector('video.player');
    if (!video || video.paused) {
        return;
    }
    const listener = () => video.play();
    video.addEventListener('pause', listener);
    setTimeout(() => {
        video.removeEventListener('pause', listener);
    }, 100);
});