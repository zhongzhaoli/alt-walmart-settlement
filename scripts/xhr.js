const originFetch = window.fetch;

const elementList = [
  {
    key: 'feeDetailReport',
    cardElement: '[data-testid="settlement-card"]',
    planelElement: '[data-testid="settlement-panel"]',
    num: 0,
    childrenList: [],
  },
  {
    key: 'storageFeeReport',
    cardElement: '[data-testid="storage-card"]',
    planelElement: '[data-testid="storage-panel"]',
    num: 0,
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
  if (
    url &&
    (url.indexOf('feeDetailReport') >= 0 ||
      url.indexOf('storageFeeReport') >= 0)
  ) {
    const type =
      url.indexOf('feeDetailReport') >= 0
        ? 'feeDetailReport'
        : 'storageFeeReport';
    // 获取店铺信息
    const jsonElement = document.querySelector('[id="app-context-info"]');
    if (!jsonElement || !jsonElement.textContent) return;
    const { sellerId } = JSON.parse(jsonElement.textContent).sellerContext;
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
    // 修改响应状态码和内容
    _this.status = 500;
    _this.responseText = '模拟的错误信息';
    _this.response = '模拟的错误信息';
    _this.dispatchEvent(new Event('error'));
    addLogItem('已发送请求至服务器');
    while (true) {
      try {
        await fetchCore(
          formData,
          type === 'feeDetailReport'
            ? '/recon/settlement/add'
            : '/recon/storage/add'
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

function fetchCore(formData, url) {
  return new Promise((resolve, reject) => {
    // const xhr = new XMLHttpRequest();
    // xhr.timeout = 120000;
    // xhr.open(
    //   'POST',
    //   `https://altoa.api.altspicerver.com/v1/walmart/order${url}`
    // );
    // xhr.ontimeout = function () {
    //   reject(new Error('请求超时'));
    // };
    // xhr.onerror = function (err) {
    //   reject(new Error(err));
    // };
    // xhr.onload = function () {
    //   if (xhr.status >= 200 && xhr.status < 300) {
    //     addLogItem('服务器回调成功');
    //     resolve();
    //   } else {
    //     reject(new Error('服务器回调失败'));
    //   }
    // };
    // xhr.send(formData);

    originFetch(`https://altoa.api.altspicerver.com/v1/walmart/order${url}`, {
      method: 'post',
      body: formData,
    })
      .then(() => {
        addLogItem('服务器回调成功');
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function generateMonthRange() {
  // 固定起始时间
  const FIXED_START = { year: 2022, month: 1 };

  // 获取当前时间的前一个月
  const now = new Date();
  let endYear = now.getFullYear();
  let endMonth = now.getMonth(); // 0-based (0=一月)

  // 计算前一个月
  if (endMonth === 0) {
    endYear--;
    endMonth = 11; // 12月
  } else {
    endMonth--;
  }

  // 转换为1-based月份
  const endDate = {
    year: endYear,
    month: endMonth + 1,
  };

  // 生成月份数组
  const result = [];
  let currentYear = FIXED_START.year;
  let currentMonth = FIXED_START.month;

  // 循环直到当前超过结束日期
  while (
    currentYear < endDate.year ||
    (currentYear === endDate.year && currentMonth <= endDate.month)
  ) {
    // 格式化月份为两位数
    result.push(`${currentYear}-${currentMonth.toString().padStart(2, '0')}`);

    // 处理月份递增
    if (currentMonth === 12) {
      currentYear++;
      currentMonth = 1;
    } else {
      currentMonth++;
    }
  }

  return result;
}

function getPreviousMonthRange(yearMonth) {
  // 解析年份和月份
  const [year, month] = yearMonth.split('-').map(Number);

  // 创建一个日期对象，表示当前月份的第一天
  const currentDate = new Date(year, month - 1, 1);

  // 获取前一个月的年份和月份
  const prevYear = currentDate.getFullYear();
  const prevMonth = currentDate.getMonth() + 1; // 月份从 0 开始，需要 +1

  // 获取前一个月的初始日期
  const startDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;

  // 获取前一个月的结束日期
  const endDate = new Date(prevYear, prevMonth, 0); // 下个月的第 0 天即为当前月的最后一天
  const endDateFormatted = `${prevYear}-${String(prevMonth).padStart(
    2,
    '0'
  )}-${String(endDate.getDate()).padStart(2, '0')}`;

  return {
    startDate, // 初始日期
    endDate: endDateFormatted, // 结束日期
  };
}

function init(XMLHttpRequest) {
  var XHR = XMLHttpRequest.prototype;
  var send = XHR.send;
  var open = XHR.open;
  XHR.open = function (method, url) {
    let newUrl = url;
    if (
      url.indexOf('storageFeeReport') >= 0 ||
      url.indexOf('feeDetailReport') >= 0
    ) {
      const elementItem = elementList.find((item) =>
        item.key === url.indexOf('storageFeeReport') >= 0
          ? 'storageFeeReport'
          : 'feeDetailReport'
      );
      if (elementItem.num <= 0) {
        const dateRange = generateMonthRange();
        elementItem.childrenList = dateRange;
        elementItem.num = dateRange.length;
      }
      const childrenItem = elementItem.childrenList[elementItem.num - 1];
      addLogItem('current select: ' + childrenItem);
      elementItem.num--;
      const { startDate, endDate } = getPreviousMonthRange(childrenItem);
      const tempUrl = url.split('?')[0];
      newUrl = `${tempUrl}?startDate=${startDate}&endDate=${endDate}`;
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
