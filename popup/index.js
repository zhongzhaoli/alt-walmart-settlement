chrome.runtime.sendMessage({
  type: 'getURL',
});

chrome.runtime.onMessage.addListener((request) => {
  const { type, data } = request;
  if (type === 'POPUP_DATA') {
    document.body.innerHTML = data;
  }
});
