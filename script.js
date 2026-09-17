const toast = document.querySelector('#toast');
const state = {
  nodes: JSON.parse(localStorage.getItem('lora-nodes') || 'null') || [
    { id: 'NODE-01', type: '温湿度传感器', area: '环境监测', signal: -62, battery: 87, status: '在线' },
    { id: 'NODE-07', type: '土壤湿度传感器', area: '农业监测', signal: -78, battery: 54, status: '在线' },
    { id: 'NODE-12', type: '空气质量传感器', area: '环境监测', signal: -97, battery: 12, status: '弱信号' },
  ],
  alerts: [
    { title: '土壤湿度过低', detail: '节点 · NODE-07', value: '18%', note: '阈值 30%', level: 'critical' },
    { title: '节点信号减弱', detail: '节点 · NODE-12', value: '-97', note: 'dBm', level: 'warning' },
    { title: '电量即将耗尽', detail: '节点 · NODE-03', value: '12%', note: '剩余电量', level: 'info' },
  ],
  packets: 24680,
  lastSync: new Date(),
};
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2400);
}

function formatTime(date) {
  return date.toLocaleTimeString('zh-CN', { hour12: false });
}

function updateClock() {
  const clock = document.querySelector('.sync-time');
  if (clock) clock.innerHTML = `<i></i>数据同步于 ${formatTime(state.lastSync)}`;
}

function saveNodes() {
  localStorage.setItem('lora-nodes', JSON.stringify(state.nodes));
}

function renderSummary() {
  const cards = document.querySelectorAll('.metric-card strong');
  const online = state.nodes.filter((node) => node.status !== '离线').length;
  if (cards[0]) cards[0].innerHTML = `${online} <small>/ ${state.nodes.length}</small>`;
  if (cards[1]) cards[1].textContent = state.packets.toLocaleString('en-US');
  const signal = state.nodes.length ? Math.round(state.nodes.reduce((sum, node) => sum + node.signal, 0) / state.nodes.length) : 0;
  if (cards[2]) cards[2].innerHTML = `${signal} <small>dBm</small>`;
  const count = document.querySelector('.nav-item[href="#nodes"] b');
  if (count) count.textContent = state.nodes.length;
  const alertCount = document.querySelector('.alert-count');
  if (alertCount) alertCount.textContent = state.alerts.length;
}

function renderNodes() {
  const table = document.querySelector('.node-table');
  if (!table) return;
  table.querySelectorAll('.table-row:not(.table-head)').forEach((row) => row.remove());
  state.nodes.forEach((node) => {
    const signalBars = node.signal > -70 ? '▰▰▰▱' : node.signal > -90 ? '▰▰▱▱' : '▰▱▱▱';
    const signalClass = node.signal <= -90 ? ' weak' : '';
    const batteryClass = node.battery > 70 ? 'high' : node.battery > 30 ? 'medium' : 'low';
    const statusClass = node.status === '在线' ? 'online-tag' : 'warning-tag';
    const row = document.createElement('div');
    row.className = 'table-row';
    row.innerHTML = `<span class="node-name"><i class="status-dot ${node.status === '在线' ? 'online' : 'offline'}"></i><strong>${node.id}</strong><small>${node.type}</small></span><span>${node.area}</span><span class="signal${signalClass}">${signalBars} <small>${node.signal} dBm</small></span><span><span class="battery-pill ${batteryClass}">${node.battery}%</span></span><span class="status-tag ${statusClass}">${node.status}</span>`;
    row.addEventListener('click', () => openNodeEditor(node));
    table.appendChild(row);
  });
  renderSummary();
}

function renderAlerts() {
  const list = document.querySelector('.alert-list');
  if (!list) return;
  list.innerHTML = state.alerts.length ? state.alerts.map((alert, index) => `<div class="alert-item ${alert.level}" data-alert-index="${index}" title="点击确认告警"><span class="alert-symbol">${alert.level === 'critical' ? '!' : alert.level === 'warning' ? '⌁' : 'i'}</span><div><strong>${alert.title}</strong><p>${alert.detail} · 刚刚</p></div><span class="alert-value">${alert.value}<small>${alert.note}</small></span></div>`).join('') : '<p class="empty-state">当前没有未处理告警</p>';
  list.querySelectorAll('[data-alert-index]').forEach((item) => item.addEventListener('click', () => {
    state.alerts.splice(Number(item.dataset.alertIndex), 1);
    renderAlerts();
    showToast('告警已确认，已从待处理列表移除');
  }));
  renderSummary();
}

function simulateTelemetry() {
  state.packets += Math.floor(Math.random() * 16) + 4;
  state.nodes = state.nodes.map((node) => ({ ...node, signal: Math.max(-110, Math.min(-45, node.signal + Math.floor(Math.random() * 5) - 2)), battery: Math.max(1, node.battery - (Math.random() > .96 ? 1 : 0)) }));
  state.lastSync = new Date();
  renderSummary();
  renderNodes();
  updateClock();
}

function openNodeEditor(node) {
  const form = document.querySelector('#nodeForm');
  form.elements.nodeId.value = node ? node.id : '';
  form.elements.nodeType.value = node ? node.type : '温湿度传感器';
  form.elements.nodeArea.value = node ? node.area : '环境监测';
  form.elements.nodeBattery.value = node ? node.battery : 100;
  form.dataset.editing = node ? node.id : '';
  document.querySelector('#nodeModal').classList.add('open');
}

function closeNodeEditor() {
  document.querySelector('#nodeModal').classList.remove('open');
}

function addManagementStyles() {
  const style = document.createElement('style');
  style.textContent = `.modal-backdrop{align-items:center;background:rgba(18,35,43,.42);display:flex;inset:0;justify-content:center;position:fixed;z-index:8}.modal-backdrop:not(.open){display:none}.node-modal,.admin-modal{background:#fff;border-radius:12px;box-shadow:0 20px 60px rgba(18,35,43,.2);display:grid;gap:14px;max-width:420px;padding:24px;width:calc(100% - 32px)}.admin-modal{max-width:480px}.modal-heading{align-items:flex-start;display:flex;justify-content:space-between}.modal-close{background:none;border:0;color:#7f8d94;cursor:pointer;font-size:22px;line-height:1}.node-modal label,.admin-modal label{color:#66767e;display:grid;font-size:11px;gap:6px}.node-modal input,.node-modal select,.admin-modal input{border:1px solid #dce5e8;border-radius:6px;color:#25343c;font:12px var(--sans);padding:10px}.modal-actions{align-items:center;display:grid;gap:8px;grid-template-columns:auto 1fr auto auto;margin-top:8px}.delete-node{color:#d76b68}.danger-button{background:#fff;border:1px solid #f0cecd;border-radius:7px;color:#d76b68;cursor:pointer;font-size:11px;padding:9px 12px}.auth-hint{color:#99a5aa;font-size:10px;margin:0}.admin-form{display:grid;gap:12px}.admin-form[hidden]{display:none}.empty-state{color:#9ca8ad;font-size:12px;padding:25px 0;text-align:center}`;
  document.head.appendChild(style);
}

function createNodeModal() {
  const modal = document.createElement('div');
  modal.id = 'nodeModal';
  modal.className = 'modal-backdrop';
  modal.innerHTML = `<form class="node-modal" id="nodeForm"><div class="modal-heading"><div><p class="kicker">设备管理</p><h2>节点配置</h2></div><button class="modal-close" type="button" aria-label="关闭">×</button></div><label>节点编号<input name="nodeId" required pattern="NODE-[0-9]{2}" placeholder="NODE-13" /></label><label>传感器类型<select name="nodeType"><option>温湿度传感器</option><option>土壤湿度传感器</option><option>空气质量传感器</option><option>光照传感器</option></select></label><label>部署区域<input name="nodeArea" required value="环境监测" /></label><label>当前电量 (%)<input name="nodeBattery" type="number" min="1" max="100" required /></label><div class="modal-actions"><button class="outline-button delete-node" type="button">删除节点</button><span></span><button class="outline-button modal-close" type="button">取消</button><button class="primary-button" type="submit">保存配置</button></div></form>`;
  document.body.appendChild(modal);
  modal.querySelectorAll('.modal-close').forEach((button) => button.addEventListener('click', closeNodeEditor));
  modal.addEventListener('click', (event) => { if (event.target === modal) closeNodeEditor(); });
  modal.querySelector('.delete-node').addEventListener('click', () => {
    const id = modal.querySelector('[name="nodeId"]').value;
    if (!id || !state.nodes.some((node) => node.id === id)) return showToast('新增节点不能执行删除操作');
    state.nodes = state.nodes.filter((node) => node.id !== id);
    saveNodes(); renderNodes(); closeNodeEditor(); showToast(`${id} 已删除`);
  });
  modal.querySelector('#nodeForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = data.get('nodeId').trim();
    const existing = state.nodes.find((node) => node.id === event.currentTarget.dataset.editing);
    if (existing) Object.assign(existing, { id, type: data.get('nodeType'), area: data.get('nodeArea'), battery: Number(data.get('nodeBattery')) });
    else if (state.nodes.some((node) => node.id === id)) return showToast('节点编号已存在');
    else state.nodes.push({ id, type: data.get('nodeType'), area: data.get('nodeArea'), battery: Number(data.get('nodeBattery')), signal: -60, status: '在线' });
    saveNodes(); renderNodes(); closeNodeEditor(); showToast(`${id} 配置已保存`);
  });
}

function getAdmin() {
  return JSON.parse(localStorage.getItem('lora-admin') || 'null');
}

function saveAdmin(admin) {
  localStorage.setItem('lora-admin', JSON.stringify(admin));
}

function updateAdminUi() {
  const admin = getAdmin();
  if (!admin) return;
  const name = admin.name || '管理员';
  document.querySelector('.profile strong').textContent = name;
  document.querySelector('.user-button span:not(.avatar)').textContent = name;
  document.querySelectorAll('.avatar').forEach((avatar) => { avatar.textContent = name.slice(0, 1); });
  if (admin.project) {
    document.querySelector('.breadcrumb strong').textContent = admin.project;
    document.querySelector('.project-select strong').textContent = admin.project;
  }
}

function openAdminModal() {
  const modal = document.querySelector('#adminModal');
  const admin = getAdmin();
  if (admin) {
    modal.querySelector('.auth-view').hidden = true;
    modal.querySelector('.profile-view').hidden = false;
    modal.querySelector('[name="profileName"]').value = admin.name;
    modal.querySelector('[name="profileEmail"]').value = admin.email;
    modal.querySelector('[name="profilePhone"]').value = admin.phone || '';
    modal.querySelector('[name="profileProject"]').value = admin.project || '智慧农场试验区';
  } else {
    modal.querySelector('.auth-view').hidden = false;
    modal.querySelector('.profile-view').hidden = true;
  }
  modal.classList.add('open');
}

function createAdminModal() {
  const modal = document.createElement('div');
  modal.id = 'adminModal';
  modal.className = 'modal-backdrop';
  modal.innerHTML = `<section class="admin-modal"><div class="modal-heading"><div><p class="kicker">LoRaSense 管理中心</p><h2>管理员账号</h2></div><button class="modal-close" type="button">×</button></div><div class="auth-view"><p class="auth-hint">首次使用请注册管理员账号，账号信息保存在当前浏览器。</p><form class="admin-form"><label>管理员姓名<input name="name" required minlength="2" placeholder="例如：李明远" /></label><label>邮箱地址<input name="email" type="email" required placeholder="admin@example.com" /></label><label>登录密码<input name="password" type="password" required minlength="6" placeholder="至少 6 位字符" /></label><button class="primary-button" type="submit">注册并进入系统</button></form></div><form class="profile-view admin-form" hidden><label>管理员姓名<input name="profileName" required minlength="2" /></label><label>联系邮箱<input name="profileEmail" type="email" required /></label><label>联系电话<input name="profilePhone" placeholder="可选" /></label><label>项目名称<input name="profileProject" required /></label><div class="modal-actions"><button class="danger-button" id="logoutButton" type="button">退出登录</button><span></span><button class="outline-button modal-close" type="button">取消</button><button class="primary-button" type="submit">保存信息</button></div></form></section>`;
  document.body.appendChild(modal);
  modal.querySelectorAll('.modal-close').forEach((button) => button.addEventListener('click', () => modal.classList.remove('open')));
  modal.querySelector('.admin-form:not(.profile-view)').addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    saveAdmin({ name: data.get('name').trim(), email: data.get('email').trim(), password: data.get('password'), phone: '', project: '智慧农场试验区' });
    modal.classList.remove('open'); updateAdminUi(); showToast('管理员注册成功，欢迎进入系统');
  });
  modal.querySelector('.profile-view').addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    saveAdmin({ ...getAdmin(), name: data.get('profileName').trim(), email: data.get('profileEmail').trim(), phone: data.get('profilePhone').trim(), project: data.get('profileProject').trim() });
    modal.classList.remove('open'); updateAdminUi(); showToast('管理员信息已保存');
  });
  modal.querySelector('#logoutButton').addEventListener('click', () => { localStorage.removeItem('lora-admin'); modal.classList.remove('open'); showToast('已退出管理员账号'); window.setTimeout(openAdminModal, 300); });
}

document.querySelector('#refreshButton').addEventListener('click', () => { simulateTelemetry(); showToast('已完成实时数据同步'); });
document.querySelector('#exportButton').addEventListener('click', () => {
  const csv = ['节点编号,类型,区域,信号强度(dBm),电量(%),状态', ...state.nodes.map((node) => [node.id, node.type, node.area, node.signal, node.battery, node.status].join(','))].join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
  link.download = `lora-monitor-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('节点监控报告已导出');
});
document.querySelectorAll('.range').forEach((button) => button.addEventListener('click', () => { document.querySelector('.range.active').classList.remove('active'); button.classList.add('active'); showToast(`已切换至 ${button.textContent} 数据视图`); }));
document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => { document.querySelector('.nav-item.active').classList.remove('active'); item.classList.add('active'); }));
document.querySelector('.icon-button').addEventListener('click', () => document.querySelector('#alerts').scrollIntoView({ behavior: 'smooth' }));
document.querySelector('.text-button').addEventListener('click', () => openNodeEditor(null));
document.querySelector('.user-button').addEventListener('click', openAdminModal);
document.querySelector('.profile').addEventListener('click', openAdminModal);
document.querySelector('a[href="#settings"]').addEventListener('click', (event) => { event.preventDefault(); openAdminModal(); });

addManagementStyles();
createNodeModal();
createAdminModal();
updateAdminUi();
if (!getAdmin()) window.setTimeout(openAdminModal, 250);
renderNodes();
renderAlerts();
updateClock();
window.setInterval(simulateTelemetry, 5000);
window.setInterval(() => { state.lastSync = new Date(); updateClock(); }, 1000);
