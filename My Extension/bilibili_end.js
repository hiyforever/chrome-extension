(() => {
    const liveLink = document.querySelector('#i_cecream .bili-header__bar a[href~="//live.bilibili.com"]');
    if (liveLink) {
        liveLink.href = '//live.bilibili.com/p/eden/area-tags?areaId=0&parentAreaId=9';
    }
})();