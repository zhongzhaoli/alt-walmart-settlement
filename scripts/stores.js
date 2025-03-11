const NEXT_PAGE_SELECTION = 'li[title="下一页"]';

// 获取Loading状态
const getLoading = () => {
  const loadingList = document.querySelectorAll('.ant-spin-nested-loading');
  if (loadingList && loadingList.length) {
    const lastLoading = loadingList[loadingList.length - 1];
    return lastLoading.children.length >= 2;
  } else {
    return false;
  }
};

// 点击下一页
let storeLen = 0;
let index = 0;
let divList = [];
const toNextPage = () => {
  const li = document.querySelector(NEXT_PAGE_SELECTION);
  const disabled = li.getAttribute('aria-disabled');
  if (disabled === 'false') {
    const button = li.querySelector('button');
    button.click();
    chrome.runtime.sendMessage({
      type: 'TIME_INTERVAL',
      timeNum: 100,
      businessType: 'OPEN_STORE_LOADING',
      key: 'OPEN_STORE_LOADING_INTERVAL',
    });
  }
};

const callback = (mutationsList, observer) => {
  let isDisconnect = false;
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      if (mutation.target) {
        const svgList = mutation.target.querySelectorAll('svg g g g');
        if (svgList && svgList.length) {
          const svgItem = svgList[svgList.length - 1].querySelector('path');
          if (!svgItem) return;
          const fill = svgItem.getAttribute('fill');
          if (fill === '#3569FD' && !isDisconnect) {
            // 上一个店铺已关闭
            isDisconnect = true;
            observer.disconnect();
            index++;
            handle();
          }
        }
      }
    }
  }
};

const handle = () => {
  if (index >= storeLen) {
    chrome.runtime.sendMessage({
      type: 'TIME_OUT',
      timeNum: 2000,
      businessType: 'TO_NEXT_PAGE',
    });
    return;
  }
  const lenDiv = document.createElement('div');
  lenDiv.innerHTML = `${index} - ${storeLen}`;
  document.body.appendChild(lenDiv);
  const target = divList[index];
  const buttonItem = target.querySelector('[class*="superStartBtn"] button');
  buttonItem.click();
  const config = { childList: true, subtree: true };
  // 创建一个观察器实例并传入回调函数
  const observer = new MutationObserver(callback);
  // 开始观察目标节点
  observer.observe(target, config);
};

// 打开店铺
const openStore = () => {
  index = 0;
  chrome.runtime.sendMessage({
    type: 'TIME_OUT',
    timeNum: 2000,
    businessType: 'OPEN_STORE',
  });
};

const openStoreCore = () => {
  divList = Array.prototype.slice.call(
    document.querySelectorAll('tbody tr.ant-table-row')
  );
  storeLen = divList.length;
  handle();
};

let isStart = false;
chrome.runtime.onMessage.addListener((request) => {
  const { type, data } = request;
  if (type === 'REQUEST_DATA') {
    const { url } = data;
    if (
      url.startsWith(
        'https://sbentproapi.ziniao.com/pro/api/v5/shortcut/store'
      ) &&
      data.statusCode === 200
    ) {
      if (isStart) return;
      isStart = true;
      openStore();
    }
  }
  if (type === 'TIME_OUT') {
    const { businessType } = request;
    if (businessType === 'OPEN_STORE') {
      openStoreCore();
    }
    if (businessType === 'TO_NEXT_PAGE') {
      toNextPage();
    }
  }
  if (type === 'TIME_INTERVAL') {
    const { businessType } = request;
    if (businessType === 'OPEN_STORE_LOADING') {
      const isLoading = getLoading();
      if (!isLoading) {
        chrome.runtime.sendMessage({
          type: 'CLEAR_TIME_INTERVAL',
          businessType: 'OPEN_STORE_LOADING_CLEAL_INTERVAL',
          key: 'OPEN_STORE_LOADING_INTERVAL',
        });
        openStore();
      }
    }
  }
});
