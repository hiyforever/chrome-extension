(() => {
    const animeLink = document.querySelector('#i_cecream .bili-header__bar a[href~="//www.bilibili.com/anime/"]');
    if (animeLink) {
        animeLink.href = '//www.bilibili.com/v/anime/serial/';
    }
})();