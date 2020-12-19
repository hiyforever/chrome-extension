(() => {
    const script = document.createElement('script');
    script.innerText = 'document.oncontextmenu = document.onselectstart = null;';
    document.firstElementChild.appendChild(script);
    script.remove();
    try {
        document.getElementById("note").remove();
        document.getElementById("countdown").parentNode.remove();
    }
    catch (error) {
    }
})();