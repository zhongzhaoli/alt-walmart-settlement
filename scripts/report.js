const elementList = [
  {
    key: 'feeDetailReport',
    cardElement: '[data-testid="settlement-card"]',
    planelElement: '[data-testid="settlement-panel"]',
  },
  {
    key: 'storageFeeReport',
    cardElement: '[data-testid="storage-card"]',
    planelElement: '[data-testid="storage-panel"]',
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

function addLogItem(content) {
  if (!document.body) return;
  const div = document.createElement('div');
  div.innerHTML = content;
  document.body.appendChild(div);
}

function downloadClick(planel) {
  const dialog = planel.querySelector('[role="dialog"]');
  const footer = dialog.children[dialog.children.length - 1];
  footer.querySelectorAll('button')[1].click();
}

function selectChange(radio, planel) {
  const selectItem = radio.parentNode.parentNode.querySelector('select');
  const children = selectItem.children;
  if (children.length) {
    selectItem.value = children[1].value;
    // 创建一个change事件
    var event = new Event('change', {
      bubbles: true,
      cancelable: false,
    });
    selectItem.dispatchEvent(event);
    setTimeout(() => {
      downloadClick(planel);
    }, 500);
  }
}

function radioClick() {
  const planelClass = elementList[nowStep].planelElement;
  const planel = document.querySelector(planelClass);
  const radio = planel.querySelector('input[type="radio"]');
  if (!radio.disabled) {
    radio.click();
    setTimeout(() => {
      selectChange(radio, planel);
    }, 500);
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
}

chrome.runtime.onMessage.addListener((request) => {
  const { type, data } = request;
  if (type === 'REQUEST_DATA') {
    const { url } = data;
    addLogItem('report:' + url);
    if (url.indexOf('/aurora/v1/wfs/partner-service/wfs-cbt') >= 0) {
      setTimeout(() => {
        cardClick();
      }, 500);
    }
    if (url.indexOf('/aurora/v1/wfs/reports/getPresetDate') >= 0) {
      setTimeout(() => {
        radioClick();
      }, 500);
    }
    if (url.includes('feeDetailReport') || url.includes('storageFeeReport')) {
      setTimeout(() => {
        nowStep++;
        cardClick();
      }, 500);
    }
  }
});
