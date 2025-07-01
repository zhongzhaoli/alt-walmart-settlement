let interval = null;

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'GET_INFO_RESPONSE') {
    const { remainingTime, storageTime } = request.data;
    document.getElementById('remainingTime').innerHTML = remainingTime;
    document.getElementById('storageTime').innerHTML = storageTime;
  }
});

const getInfo = () => {
  chrome.runtime.sendMessage({
    type: 'GET_INFO',
  });
};

const init = () => {
  clearInterval(interval);
  getInfo();
  setInterval(() => {
    getInfo();
  }, 1000);
};

window.onload = () => {
  init();
};
