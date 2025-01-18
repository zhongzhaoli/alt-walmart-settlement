// 登录按钮的选择器
const SELECTOR_CONDITION = '[data-automation-id="loginBtn"]';
// 账号输入框的选择器
const SELECTOR_USERNAME = '[data-automation-id="uname"]';
// 密码输入框的选择器
const SELECTOR_PASSWORD = '[data-automation-id="pwd"]';

// 关闭其他登录页面
const CLOSE_OTHER_LOGIN_KEY = 'CLOSE_OTHER_LOGIN';

let timer = null;
let count = 0;
window.onload = function () {
  chrome.runtime.sendMessage({ type: CLOSE_OTHER_LOGIN_KEY });
  timer = setInterval(() => {
    const element = document.querySelector(SELECTOR_CONDITION);
    const username = document.querySelector(SELECTOR_USERNAME);
    const password = document.querySelector(SELECTOR_PASSWORD);
    if (username && username.value && password && password.value && element) {
      count = 0;
      element.click();
    } else {
      // 是为了防止账号密码不出来的刷新
      count++;
      if (count >= 60) {
        count = 0;
        window.location.reload();
      }
    }
  }, 1000);
};

window.addEventListener('beforeunload', () => {
  clearInterval(timer);
  count = 0;
});
