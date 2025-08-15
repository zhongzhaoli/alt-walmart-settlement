const notificationElement = '[data-automation-id="top-nav-notifications"]';
const messageElement = '[data-automation-id="top-nav-message-center-link"]';

chrome.runtime.sendMessage({ type: 'CLOSE_OTHER_PAGE_KEY' });

function getShopInfo() {
  const jsonElement = document.querySelector('[id="app-context-info"]');
  if (!jsonElement || !jsonElement.textContent) return;
  const { partnerId, sellerId } = JSON.parse(
    jsonElement.textContent
  ).sellerContext;
  return { partnerId, sellerId };
}

function addLogItem(content) {
  if (!document.body) return;
  if (document.getElementById('logDiv')) {
    const logText = document.createElement('div');
    logText.innerHTML = content;
    document.getElementById('logDiv').appendChild(logText);
  } else {
    const div = document.createElement('div');
    div.id = 'logDiv';
    div.style.cssText =
      'position: fixed; top: 0; left: 0; z-index: 9999; background: #fff; padding: 10px; height: 200px;overflow: auto; width: 50vw';
    div.innerHTML = content;
    document.body.appendChild(div);
  }
  document.getElementById('logDiv').scrollTop =
    document.getElementById('logDiv').scrollHeight;
}

let isRequired = false;
const requestApi = () => {
  if (isRequired) return;
  isRequired = true;
  chrome.runtime.sendMessage({
    type: 'TIME_OUT',
    timeNum: 500,
    businessType: 'NOTIFICATION_REQUEST',
  });
};

function notificationCoreFunction() {
  let result = false;
  const notification = document.querySelector(notificationElement);
  if (notification) {
    const children = notification.children;
    addLogItem(children.length);
    if (children && children.length > 1) {
      // 有新通知
      result = true;
    }
  }
  return result;
}

function messageCoreFunction() {
  let result = false;
  const message = document.querySelector(messageElement);
  if (message) {
    const children = message.children;
    addLogItem(children.length);
    if (children && children.length > 1) {
      // 有新站内信
      result = true;
    }
  }
  return result;
}

const timeOutFun = (t) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, t);
  });
};

let requestNum = 0;
chrome.runtime.onMessage.addListener((request) => {
  const { type, data } = request;
  if (type === 'REQUEST_DATA') {
    const { url } = data;
    if (
      url.includes('notificationService/gql') ||
      url.includes('auroraMessageService/gql')
    ) {
      addLogItem(url);
      requestNum++;
      if (requestNum >= 2) {
        requestApi();
      }
    }
  }
  if (type === 'TIME_OUT') {
    const { businessType } = request;
    if (businessType === 'NOTIFICATION_REQUEST') {
      debugger;
      const { sellerId } = getShopInfo();
      const data = {
        // 通知
        notification: false,
        // 站内信
        message: false,
      };
      data.notification = notificationCoreFunction();
      data.message = messageCoreFunction();
      addLogItem(JSON.stringify(data));
      fetch('https://altoa.api.altspicerver.com/v1/plugins/message/notify', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop_id: sellerId,
          ...data,
        }),
      }).then(() => {
        window.location.href = 'https://seller.walmart.com/wfs/reports';
      });
    }
  }
});
