let interval = null;

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'GET_INFO_RESPONSE') {
    const { remainingTime, interval } = request.data;
    document.getElementById('interval').innerHTML = `${interval}分钟`;
    document.getElementById('remainingTime').innerHTML = remainingTime;
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
