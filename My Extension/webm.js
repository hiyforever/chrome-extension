document.querySelector('video').onloadedmetadata = () => {
  if (this.duration === Infinity) {
    this.ontimeupdate = () => {
      this.ontimeupdate = null;
      this.currentTime = 0.1;
      this.currentTime = 0;
    };
    this.currentTime = Number.MAX_SAFE_INTEGER;
  }
};