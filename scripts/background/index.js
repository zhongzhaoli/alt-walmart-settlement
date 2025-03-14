const REFRESH_ALARM_NAME = 'REFRESH_ALARM_NAME';
const ADMIN_REFRESH_URL = 'https://adminnew.ziniao.com/';
const isHandleWindowId = [];
let timer = {};
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

const openLogin = () => {
  chrome.tabs.query({ currentWindow: true }, function (tabs) {
    tabs.forEach((tab) => {
      const { title, url } = tab;
      if (
        title.indexOf('跨境电商环境安全提速系统') >= 0 &&
        url.startsWith('chrome-extension://')
      ) {
        chrome.tabs.create({ url: 'https://seller.walmart.com' });
      }
    });
  });
};

const getCurrentTabId = (callback) => {
  chrome.tabs.query({}, function (tabs) {
    const newTabs = tabs.filter((tab) =>
      tab.url.includes('https://adminnew.ziniao.com/')
    );
    for (let tab of newTabs) {
      callback(tab.id);
    }
  });
};

const refreshTab = () => {
  getCurrentTabId(async (tabId) => {
    try {
      await chrome.tabs.reload(tabId);
    } catch (err) {
      console.log(err);
    }
  });
};

// 刷新页面定时器
export const createRefreshAlarm = async () => {
  const alarm = await chrome.alarms.get(REFRESH_ALARM_NAME);
  if (typeof alarm === 'undefined') {
    chrome.alarms.create(REFRESH_ALARM_NAME, {
      periodInMinutes: 360,
      delayInMinutes: 360,
    });
  }
};
export const removeRefreshAlarm = async () => {
  const alarm = await chrome.alarms.get(REFRESH_ALARM_NAME);
  if (typeof alarm !== 'undefined') {
    await chrome.alarms.clear(REFRESH_ALARM_NAME);
  }
};
export const removeCloseAllAlarm = async () => {
  const alarm = await chrome.alarms.get('CLOSE_ALL_ALARM');
  if (typeof alarm !== 'undefined') {
    await chrome.alarms.clear('CLOSE_ALL_ALARM');
  }
};
const createCloseAllAlarm = async () => {
  const alarm = await chrome.alarms.get('CLOSE_ALL_ALARM');
  if (typeof alarm === 'undefined') {
    chrome.alarms.create('CLOSE_ALL_ALARM', {
      delayInMinutes: 10,
    });
  }
};

const onInit = async () => {
  // 强制清理旧Alarm
  await chrome.alarms.clearAll();
  // 创建新Alarm
  await createRefreshAlarm();
  await createCloseAllAlarm();
};

chrome.runtime.onInstalled.addListener(() => {
  onInit();
});

// 插件初始化
chrome.runtime.onStartup.addListener(() => {
  onInit();
});
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (removeInfo.isWindowClosing) {
    chrome.alarms.clearAll();
  }
});

// 定时器回调
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === REFRESH_ALARM_NAME) {
    refreshTab();
  }
  if (alarm.name === 'CLOSE_ALL_ALARM') {
    const tabs = await chrome.tabs.query({});
    const isAdmin = tabs.some((tab) => tab.url.indexOf(ADMIN_REFRESH_URL) >= 0);
    if (!isAdmin) {
      tabs.forEach((tab) => {
        chrome.tabs.remove(tab.id);
      });
    }
  }
});

const init = async () => {
  setTimeout(() => {
    openLogin();
  }, 5000);
};
init();

// 响应回调
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
