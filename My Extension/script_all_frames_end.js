document.querySelectorAll('*').forEach(e => {
    if (getComputedStyle(e).backgroundColor == 'rgb(255, 255, 255)') {
        e.style.backgroundColor = '#e0ce9e';
    }
});