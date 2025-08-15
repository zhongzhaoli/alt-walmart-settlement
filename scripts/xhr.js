const originFetch = window.fetch;

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
    days: 45,
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
    days: 45,
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
    days: 30,
    childrenList: [],
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

const timeOutFun = (t) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, t);
  });
};

async function requestLoadListener(_this, response, { url }) {
  const target = elementList.find(
    (item) => item.requestEndWiths && url.indexOf(item.requestEndWiths) >= 0
  );
  if (url && target) {
    // 获取店铺信息
    const jsonElement = document.querySelector('[id="app-context-info"]');
    if (!jsonElement || !jsonElement.textContent) return;
    const { sellerId } = JSON.parse(jsonElement.textContent).sellerContext;
    // 内容
    const csvContent = response.currentTarget?.response || '';
    let formData = null;
    if (target.type === 'csv') {
      // 将 CSV 内容转换为 Blob 对象
      const blob = new Blob([csvContent], {
        type: 'text/csv',
      });
      const file = new File([blob], `data.csv`, {
        type: 'text/csv',
      });
      // formData组合
      formData = new FormData();
      formData.append('file', file);
      formData.append('store_info', JSON.stringify({ sellerId, file }));
      // 创建 File 对象
    } else {
      formData = JSON.stringify({
        seller_id: sellerId,
        datas: JSON.parse(csvContent),
      });
    }
    // 修改响应状态码和内容
    _this.status = 500;
    _this.responseText = '模拟的错误信息';
    _this.response = null;
    // 抛出 error 事件以阻止页面处理
    _this.dispatchEvent(new Event('error'));
    addLogItem('已发送请求至服务器');
    while (true) {
      try {
        await fetchCore(
          formData,
          target.api,
          target.type === 'json' ? true : false
        );
        break;
      } catch (err) {
        addLogItem('服务器回调失败，正在重试 + ' + err);
        await timeOutFun(2000);
      }
    }
    return;
  }
}

function fetchCore(formData, url, json = false) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'post',
      body: formData,
    };
    if (json) {
      options.headers = {
        'Content-Type': 'application/json',
      };
    }
    originFetch(`https://altoa.api.altspicerver.com/v1${url}`, options)
      .then(() => {
        addLogItem('服务器回调成功');
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function generateMonthRange(days = 7) {
  // 获取当前日期
  const today = new Date();
  const endDate = new Date(today);

  // 计算7天前的日期
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days); // 减6得到7天（包括今天）
  // const startDate = new Date('2024-12-31');
  // const endDate = new Date('2025-07-01');

  const result = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    result.push(formatDate(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function init(XMLHttpRequest) {
  // 阻止创建url
  const originalCreateObjectURL = URL.createObjectURL;
  URL.createObjectURL = function (blob) {
    if (
      blob &&
      blob.type ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      addLogItem('阻止下载链接生成');
      throw new Error('下载链接创建被阻止');
    }
    return originalCreateObjectURL.call(this, blob);
  };
  var XHR = XMLHttpRequest.prototype;
  var send = XHR.send;
  var open = XHR.open;
  XHR.open = function (method, url) {
    let newUrl = url;
    const target = elementList.find(
      (item) => item.requestEndWiths && url.indexOf(item.requestEndWiths) >= 0
    );
    if (url && target) {
      const elementItem = target;
      const tempUrl = url.split('?')[0];
      if (target.key !== 'customerReturnReport') {
        if (elementItem.num <= 0) {
          const dateRange = generateMonthRange(elementItem.days);
          elementItem.childrenList = dateRange;
          elementItem.num = dateRange.length;
        }
        const childrenItem = elementItem.childrenList[elementItem.num - 1];
        elementItem.num--;
        addLogItem('current select: ' + childrenItem);
        // 其他类型的请求
        newUrl = `${tempUrl}?${target.startKey}=${childrenItem}&${target.endKey}=${childrenItem}`;
      } else {
        const today = new Date();
        const pastDate = new Date();
        pastDate.setDate(today.getDate() - 180);
        addLogItem(
          'current select: ' + formatDate(pastDate) + ' - ' + formatDate(today)
        );
        newUrl = `${tempUrl}?${target.startKey}=${formatDate(pastDate)}&${
          target.endKey
        }=${formatDate(today)}`;
      }
    }
    this._url = newUrl;
    this._method = method;
    return open.apply(this, [method, newUrl]);
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
