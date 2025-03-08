const REFRESH_ALARM_NAME = 'REFRESH_ALARM_NAME';

const isHandleWindowId = [];
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
});
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
      periodInMinutes: 180,
      delayInMinutes: 0.5,
    });
    refreshTab();
  }
};
export const removeRefreshAlarm = async () => {
  const alarm = await chrome.alarms.get(REFRESH_ALARM_NAME);
  if (typeof alarm !== 'undefined') {
    await chrome.alarms.clear(REFRESH_ALARM_NAME);
  }
};
// 插件初始化
chrome.runtime.onInstalled.addListener(async () => {
  await removeRefreshAlarm();
  createRefreshAlarm();
});

// 定时器回调
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === REFRESH_ALARM_NAME) {
    refreshTab();
  }
});

const init = () => {
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
