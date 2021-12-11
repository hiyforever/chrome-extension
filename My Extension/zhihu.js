const interval = setInterval(() => {
    const closeButton = document.querySelector('.Modal-closeButton');
    if (closeButton) {
        clearInterval(interval);
        closeButton.click();
    }
}, 0);