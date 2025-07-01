const init = async () => {
  await fetch('https://altoa.api.altspicerver.com/v1/plugins/captcha/notify');
  chrome.runtime.sendMessage({
    type: 'CLOSE_ALL',
  });
};

init();
