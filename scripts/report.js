const elementList = [
  {
    key: 'feeDetailReport',
    cardElement: '[data-testid="settlement-card"]',
    planelElement: '[data-testid="settlement-panel"]',
    requestEndWiths: 'feeDetailReport',
    api: '/walmart/order/recon/settlement/add',
    type: 'csv',
    startKey: 'startDate',
    endKey: 'endDate',
    num: 0,
    days: 30,
    childrenList: [],
  },
  {
    key: 'storageFeeReport',
    cardElement: '[data-testid="storage-card"]',
    planelElement: '[data-testid="storage-panel"]',
    requestEndWiths: 'storageFeeReport',
    api: '/walmart/order/recon/storage/add',
    type: 'csv',
    startKey: 'startDate',
    endKey: 'endDate',
    num: 0,
    days: 30,
    childrenList: [],
  },
  // {
  //   key: 'inventoryReport',
  //   cardElement: '[data-testid="inventoryReconciliation-card"]',
  //   planelElement: '[data-testid="inventoryReconciliation-panel"]',
  //   requestEndWiths: 'inventoryReconciliation',
  //   api: '/plugins/inventory_reconciliation/add',
  //   type: 'csv',
  //   startKey: 'fromDate',
  //   endKey: 'toDate',
  //   num: 0,
  //   days: 7,
  //   childrenList: [],
  // },
  {
    key: 'customerReturnReport',
    cardElement: '[data-testid="customerReturns-card"]',
    planelElement: '[data-testid="customerReturns-panel"]',
    requestEndWiths: 'customerReturnsReportDca',
    api: '/plugins/customer_returns/add',
    type: 'json',
    startKey: 'fromDate',
    endKey: 'toDate',
    num: 0,
    days: 7,
    childrenList: [],
  },
];
let nowStep = 0;

function isEnd(index) {
  if (index >= elementList.length) {
    chrome.runtime.sendMessage({ type: 'CLOSE_ALL' });
    return true;
  }
  return false;
}

function getPlanel() {
  const planelClass = elementList[nowStep].planelElement;
  const planel = document.querySelector(planelClass);
  return planel;
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

function generateMonthRange(days = 7) {
  // 获取当前日期
  const today = new Date();
  const endDate = new Date(today);

  // 计算7天前的日期
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days);
  // const startDate = new Date('2024-12-31');
  // const endDate = new Date('2025-07-01');

  const result = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    result.push(`${year}-${month}-${day}`);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

let isDoing = false;
function downloadClick() {
  if (isDoing) return;
  isDoing = true;
  const planel = getPlanel();
  const dialog = planel.querySelector('[role="dialog"]');
  const footer = dialog.children[dialog.children.length - 1];
  const button = footer.querySelectorAll('button')[1];
  if (button) {
    if (button.disabled) {
      chrome.runtime.sendMessage({
        type: 'TIME_OUT',
        timeNum: 2000,
        businessType: 'DOWNLOAD_CLICK',
      });
    } else {
      button.click();
      isDoing = false;
    }
  }
}

async function getSelectOptions() {
  const dateRange = generateMonthRange(elementList[nowStep].days);
  elementList[nowStep].num = dateRange.length;
  await downloadCsv();
}

async function downloadCsv() {
  const planel = getPlanel();
  const radio = planel.querySelector('input[type="radio"]');
  const selectItem = radio.parentNode.parentNode.querySelector('select');
  const children = selectItem.children;
  if (Array.prototype.slice.call(children).length <= 1) {
    chrome.runtime.sendMessage({
      type: 'TIME_OUT',
      timeNum: 2000,
      businessType: 'NEXT_CARD',
    });
    return;
  }
  const num = elementList[nowStep].num;
  // TODO：一直点击一个select value就好
  selectItem.value = children[1].value;
  // // 创建一个change事件
  setTimeout(() => {
    var event = new Event('change', {
      bubbles: true,
      cancelable: false,
    });
    selectItem.dispatchEvent(event);
  }, 0);
  chrome.runtime.sendMessage({
    type: 'TIME_OUT',
    timeNum: 1000,
    businessType: 'DOWNLOAD_CLICK',
  });
}

function radioClick() {
  const planel = getPlanel();
  const radio = planel.querySelector('input[type="radio"]');
  if (!radio.disabled) {
    radio.click();
    if (elementList[nowStep].key === 'customerReturnReport') {
      elementList[nowStep].num = 1;
      chrome.runtime.sendMessage({
        type: 'TIME_OUT',
        timeNum: 1000,
        businessType: 'DOWNLOAD_CLICK',
      });
    } else {
      setTimeout(() => {
        getSelectOptions();
      }, 500);
    }
  } else {
    nowStep++;
    cardClick();
  }
}

function cardClick() {
  if (isEnd(nowStep)) return;
  const cardSelector = elementList[nowStep].cardElement;
  const card = document.querySelector(cardSelector);
  card.querySelector('button').click();
  if (
    elementList[nowStep].key === 'inventoryReport' ||
    elementList[nowStep].key === 'customerReturnReport'
  ) {
    chrome.runtime.sendMessage({
      type: 'TIME_OUT',
      timeNum: 2000,
      businessType: 'RADIO_CLICK',
    });
  }
}

chrome.runtime.onMessage.addListener((request) => {
  const { type, data } = request;
  if (type === 'REQUEST_DATA') {
    const { url } = data;
    if (url.indexOf('/aurora/v1/wfs/partner-service/wfs-cbt') >= 0) {
      setTimeout(() => {
        cardClick();
      }, 500);
    }
    if (url.indexOf('/aurora/v1/wfs/reports/getPresetDate') >= 0) {
      chrome.runtime.sendMessage({
        type: 'TIME_OUT',
        timeNum: 2000,
        businessType: 'RADIO_CLICK',
      });
    }
    if (url.includes('https://altoa.api.altspicerver.com')) {
      elementList[nowStep].num--;
      if (elementList[nowStep].num <= 0) {
        chrome.runtime.sendMessage({
          type: 'TIME_OUT',
          timeNum: 2000,
          businessType: 'NEXT_CARD',
        });
      } else {
        chrome.runtime.sendMessage({
          type: 'TIME_OUT',
          timeNum: 1000,
          businessType: 'DOWNLOAD_CSV',
        });
      }
    }
  }
  if (type === 'TIME_OUT') {
    const { businessType } = request;
    if (businessType === 'DOWNLOAD_CLICK') {
      downloadClick();
    }
    if (businessType === 'RADIO_CLICK') {
      radioClick();
    }
    if (businessType === 'DOWNLOAD_CSV') {
      downloadCsv();
    }
    if (businessType === 'NEXT_CARD') {
      nowStep++;
      cardClick();
    }
  }
});
