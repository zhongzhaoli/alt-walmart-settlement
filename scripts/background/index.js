let timer = {};
let timeInterval = 8;
let closeAlarmName = 'closeAlarm';
let isHandleWindowId = [];

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.type === 'CLOSE_OTHER_PAGE_KEY') {
    const tabs = await chrome.tabs.query({});
    tabs.forEach((tab) => {
      if (tab.id !== sender.tab.id) {
        chrome.tabs.remove(tab.id);
      }
    });
  }
  if (request.type === 'CLOSE_ALL') {
    await closeAll();
  }
  if (request.type === 'CLOSE_OTHER_LOGIN') {
    if (isHandleWindowId.includes(sender.tab.windowId)) return;
    isHandleWindowId.push(sender.tab.windowId);
    const tabs = await chrome.tabs.query({});
    tabs.forEach((tab) => {
      if (tab.id !== sender.tab.id) {
        chrome.tabs.remove(tab.id);
      }
    });
  }
  if (request.type === 'GET_INFO') {
    const closeAlarm = await chrome.alarms.get(closeAlarmName);
    const storageData = await chrome.storage.local.get('initTime');
    chrome.runtime.sendMessage({
      type: 'GET_INFO_RESPONSE',
      data: {
        interval: timeInterval,
        remainingTime:
          typeof closeAlarm !== 'undefined'
            ? calTime(closeAlarm.scheduledTime)
            : '未设置',
        storageTime:
          'initTime' in storageData && typeof storageData.initTime === 'string'
            ? storageData.initTime
            : '未设置',
      },
    });
  }
  if (request.type === 'TIME_OUT') {
    const timeNum = request.timeNum || 0;
    const businessType = request.businessType || '';
    await timeOutFun(timeNum);
    chrome.tabs.sendMessage(sender.tab.id, {
      type: 'TIME_OUT',
      businessType,
    });
  }
  if (request.type === 'TIME_INTERVAL') {
    const timeNum = request.timeNum || 0;
    const businessType = request.businessType || '';
    const key = request.key || '';
    timeIntervalFun(timeNum, key, sender.tab.id, businessType);
  }
  if (request.type === 'CLEAR_TIME_INTERVAL') {
    const { key } = request;
    clearInterval(timer[key]);
    delete timer[key];
  }
});

chrome.webRequest.onResponseStarted.addListener(
  async (details) => {
    chrome.tabs.sendMessage(details.tabId, {
      type: 'REQUEST_DATA',
      data: details,
    });
  },
  {
    urls: ['<all_urls>'],
    types: ['xmlhttprequest'],
  },
  []
);

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === closeAlarmName) {
    const now = Date.now();
    const scheduledTime = alarm.scheduledTime;
    if (scheduledTime && now < scheduledTime) {
      console.log('Alarm triggered too early, ignore.');
      return;
    }

    await chrome.alarms.clear(closeAlarmName);
    await closeAll();
  }
  if (alarm.name === 'storageClearAlarm') {
    initTimeTest();
  }
});

const calTime = (scheduledTime) => {
  const time = Math.floor(scheduledTime - Date.now());
  const hour = Math.floor(time / 3600000);
  const minute = Math.floor((time % 3600000) / 60000);
  const second = Math.floor((time % 60000) / 1000);
  return `${hour}小时${minute}分钟${second}秒`;
};

const timeOutFun = (t) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, t);
  });
};

const closeAll = async () => {
  await chrome.alarms.clear(closeAlarmName);
  const tabs = await chrome.tabs.query({});
  tabs.forEach((tab) => {
    chrome.tabs.remove(tab.id);
  });
  await chrome.storage.local.clear();
};

const timeIntervalFun = (t, key, tabId, businessType, data = {}) => {
  timer[key] = setInterval(() => {
    chrome.tabs.sendMessage(tabId, {
      type: 'TIME_INTERVAL',
      businessType,
      key,
      data,
    });
  }, t);
};

const setCloseAlarm = async () => {
  await chrome.alarms.clear(closeAlarmName);
  const alarm = await chrome.alarms.get(closeAlarmName);
  if (!alarm) {
    await chrome.alarms.create(closeAlarmName, {
      delayInMinutes: Number(timeInterval),
      periodInMinutes: Number(timeInterval),
    });
  }
  await chrome.alarms.clear('storageClearAlarm');
  const _alarm = await chrome.alarms.get('storageClearAlarm');
  if (!_alarm) {
    await chrome.alarms.create('storageClearAlarm', {
      delayInMinutes: 0.5,
      periodInMinutes: 0.5,
    });
  }
};

const initTimeTest = async () => {
  const storageData = await chrome.storage.local.get('initTime');
  if ('initTime' in storageData && typeof storageData.initTime === 'string') {
    const now = new Date();
    const initDate = new Date(storageData.initTime);
    const timeDiff = now - initDate;
    if (timeDiff > timeInterval * 60 * 1000) {
      await chrome.storage.local.clear();
      await closeAll();
    }
  } else {
    const formattedDate = formatDate(new Date());
    await chrome.storage.local.set({ initTime: formattedDate });
  }
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从0开始
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

let isRunning = false;
const init = async () => {
  if (isRunning) return;
  isRunning = true;
  await initTimeTest();
  await setCloseAlarm();
  setTimeout(() => {
    chrome.tabs.create({ url: 'https://seller.walmart.com' });
    isRunning = false;
  }, 1000);
};

init();

chrome.runtime.onInstalled.addListener(() => {
  init();
});
