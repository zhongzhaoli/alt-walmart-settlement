chrome.runtime.sendMessage({
  type: 'GET_ALARM',
});

chrome.runtime.onMessage.addListener((request) => {
  const { type, data } = request;
  if (type === 'GET_ALARM') {
    document.body.innerHTML = data;
  }
});
