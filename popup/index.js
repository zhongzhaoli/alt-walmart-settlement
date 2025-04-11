chrome.runtime.sendMessage({
  type: 'GET_ALARM',
});

const createDiv = (innerHTML) => {
  const div = document.createElement('div');
  div.innerHTML = innerHTML;
  div.className = 'timeDiv';
  document.body.appendChild(div);
};

chrome.runtime.onMessage.addListener((request) => {
  const { type, data } = request;
  if (type === 'GET_ALARM') {
    if (Array.isArray(data)) {
      data.forEach((item) => {
        createDiv(`${item.name}：${item.time}`);
      });
    } else {
      createDiv(data);
    }
  }
});
