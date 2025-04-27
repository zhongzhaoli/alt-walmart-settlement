let timer = {};
let timeInterval = 10;
let closeAlarmName = 'closeAlarm';

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
    const tabs = await chrome.tabs.query({});
    tabs.forEach((tab) => {
      chrome.tabs.remove(tab.id);
    });
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
    chrome.runtime.sendMessage({
      type: 'GET_INFO_RESPONSE',
      data: {
        interval: timeInterval,
        remainingTime:
          typeof closeAlarm !== 'undefined'
            ? calTime(closeAlarm.scheduledTime)
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
    const tabs = await chrome.tabs.query({});
    tabs.forEach((tab) => {
      chrome.tabs.remove(tab.id);
    });
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

const setCloseAlarm = async (minute) => {
  await chrome.alarms.clear(closeAlarmName);
  const alarm = await chrome.alarms.get(closeAlarmName);

  // 确认 alarm 已经清除
  if (!alarm) {
    console.log('已成功清除旧的 closeAlarm，准备创建新的');
    await chrome.alarms.create(closeAlarmName, {
      delayInMinutes: Number(minute),
      periodInMinutes: Number(minute),
    });
  } else {
    console.warn('closeAlarm 清除失败，可能存在旧的定时器，取消创建新的 alarm');
  }
};

const init = async () => {
  await setCloseAlarm(timeInterval);
  setTimeout(() => {
    chrome.tabs.create({ url: 'https://seller.walmart.com' });
  }, 1000);
};

init();
