(() => {
    const liveLink = document.querySelector('#internationalHeader li.nav-link-item a.link[href~="//live.bilibili.com"]');
    if (liveLink) {
        liveLink.href = '//live.bilibili.com/p/eden/area-tags?areaId=0&parentAreaId=9';
    }
})();