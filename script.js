const toast = document.querySelector('#toast');
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2400);
}

document.querySelector('#refreshButton').addEventListener('click', (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  showToast('正在同步 14 个监测节点的数据…');
  window.setTimeout(() => {
    button.disabled = false;
    showToast('数据已更新，所有在线节点响应正常');
  }, 900);
});

document.querySelector('#exportButton').addEventListener('click', () => showToast('监控日报已生成，正在准备下载…'));
document.querySelectorAll('.range').forEach((button) => button.addEventListener('click', () => {
  document.querySelector('.range.active').classList.remove('active');
  button.classList.add('active');
  showToast(`已切换至 ${button.textContent} 数据视图`);
}));
document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => {
  document.querySelector('.nav-item.active').classList.remove('active');
  item.classList.add('active');
}));
document.querySelector('.icon-button').addEventListener('click', () => showToast('当前有 3 条未处理告警'));
