const elementList = [
  // {
  //   key: 'feeDetailReport',
  //   cardElement: '[data-testid="settlement-card"]',
  //   planelElement: '[data-testid="settlement-panel"]',
  //   num: 0,
  // },
  {
    key: 'storageFeeReport',
    cardElement: '[data-testid="storage-card"]',
    planelElement: '[data-testid="storage-panel"]',
    num: 0,
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

function downloadClick() {
  const planel = getPlanel();
  const dialog = planel.querySelector('[role="dialog"]');
  const footer = dialog.children[dialog.children.length - 1];
  footer.querySelectorAll('button')[1].click();
}

async function getSelectOptions(radio) {
  const selectItem = radio.parentNode.parentNode.querySelector('select');
  const children = selectItem.children;
  const realNum = children.length - 1;
  elementList[nowStep].num = realNum;
  if (realNum) {
    await downloadCsv();
  }
}

async function downloadCsv() {
  const planel = getPlanel();
  const radio = planel.querySelector('input[type="radio"]');
  const selectItem = radio.parentNode.parentNode.querySelector('select');
  const children = selectItem.children;
  const num = elementList[nowStep].num;
  if (!children[num]) return;
  selectItem.value = children[num].value;
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
    setTimeout(() => {
      getSelectOptions(radio);
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
      addLogItem('report:' + url);
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
    // if (url.includes('storageFeeReport')) {
    // if (url.includes('feeDetailReport') || url.includes('storageFeeReport')) {
    // }
  }
  if (type === 'TIME_OUT') {
    const { businessType } = request;
    if (businessType === 'DOWNLOAD_CLICK') {
      const planel = getPlanel();
      const radio = planel.querySelector('input[type="radio"]');
      const selectItem = radio.parentNode.parentNode.querySelector('select');
      addLogItem('report.js: ' + selectItem.value);
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
