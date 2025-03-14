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

async function requestLoadListener(_this, response, { url }) {
  if (
    // url.indexOf('feeDetailReport') >= 0 ||
    url &&
    url.indexOf('storageFeeReport') >= 0
  ) {
    const elementItem = elementList.find(
      (item) => item.key === 'storageFeeReport'
    );
    const selectItem =
      document
        ?.querySelector(elementItem.planelElement)
        ?.querySelector('input[type="radio"]')
        ?.parentNode.parentNode.querySelector('select') || null;
    addLogItem(url);
    // 获取店铺信息
    const jsonElement = document.querySelector('[id="app-context-info"]');
    if (!jsonElement || !jsonElement.textContent) return;
    const { sellerId } = JSON.parse(jsonElement.textContent).sellerContext;
    const params = new URLSearchParams(url.split('?')[1]);
    const startDate = params.get('startDate');
    const endDate = params.get('endDate');
    // csv内容
    const csvContent = response.currentTarget?.response || '';
    // 将 CSV 内容转换为 Blob 对象
    const blob = new Blob([csvContent], { type: 'text/csv' });
    // 创建 File 对象
    const file = new File([blob], 'data.csv', { type: 'text/csv' });
    // formData组合
    const formData = new FormData();
    formData.append('file', file);
    formData.append('store_info', JSON.stringify({ sellerId }));
    // formData.append(
    //   'type',
    //   url.includes('feeDetailReport') ? 'settlementFee' : 'storageFee'
    // );
    // if (url.includes('feeDetailReport')) {
    // fetch('https://api.dadeszxz.cn/plugin/test', {
    //   method: 'post',
    //   body: formData,
    // });ß
    // } else {
    // 发送请求
    formData.append(
      'date_info',
      JSON.stringify({
        startDate,
        endDate,
        reportDate: selectItem?.value || null,
      })
    );
    // 修改响应状态码和内容
    _this.status = 500;
    _this.responseText = '模拟的错误信息';
    _this.response = '模拟的错误信息';
    _this.dispatchEvent(new Event('error'));
    addLogItem('已发送请求至服务器，report_date: ' + selectItem?.value);
    while (true) {
      try {
        await fetchCore(formData);
        break;
      } catch (err) {
        addLogItem('服务器回调失败，正在重试');
      }
    }
    // }
    return;
  }
}
function fetchCore(formData) {
  return new Promise((resolve, reject) => {
    fetch(
      'https://altoa.api.altspicerver.com/v1/walmart/order/recon/storage/add',
      {
        method: 'post',
        body: formData,
      }
    )
      .then(() => {
        addLogItem('服务器回调成功');
        resolve();
      })
      .catch(() => {
        reject();
      });
  });
}

function init(XMLHttpRequest) {
  var XHR = XMLHttpRequest.prototype;
  var send = XHR.send;
  var open = XHR.open;
  XHR.open = function (method, url) {
    this._url = url;
    this._method = method;
    return open.apply(this, arguments);
  };
  XHR.send = function () {
    this.addEventListener('load', function (response) {
      requestLoadListener(this, response, {
        url: this._url,
        method: this._method,
      });
    });
    return send.apply(this, arguments);
  };
}

init(window.XMLHttpRequest);
