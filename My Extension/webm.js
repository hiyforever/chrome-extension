(() => {
  const video = document.querySelector('video');
  video.onloadedmetadata = () => {
    if (video.duration === Infinity) {
      video.ontimeupdate = () => {
        video.ontimeupdate = null;
        video.currentTime = 0.1;
        video.currentTime = 0;
      };
      video.currentTime = Number.MAX_SAFE_INTEGER;
    }
  };
})();