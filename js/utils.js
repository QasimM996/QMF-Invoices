// =========================
// 🔢 FORMAT NUMBER
// =========================
window.formatNumber = function (value) {
  return Number(value || 0).toFixed(2);
};


// =========================
// 🔐 ESCAPE HTML
// =========================
window.escapeHtml = function (text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};


// =========================
// 🔢 GENERATE INVOICE NUMBER
// =========================
window.generateInvoiceNumber = function () {
  return 'INV-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-6);
};


// =========================
// 📦 CREATE ITEM
// =========================
window.createItem = function (item = {}) {
  return {
    id: item.id || Date.now() + Math.random(),
    name: item.name || '',
    qty: Number(item.qty || 1),
    price: Number(item.price || 0),
    discount: Number(item.discount || 0)
  };
};


// =========================
// 💰 LINE TOTAL
// =========================
window.lineTotal = function (item) {
  return (Number(item.qty) * Number(item.price)) - Number(item.discount || 0);
};
window.setButtonLoading = function (btn, isLoading) {
  if (!btn) return;

  if (isLoading) {
    btn.classList.add('btn-loading');
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = '<div class="btn-loader"></div>';
  } else {
    btn.classList.remove('btn-loading');
    btn.innerHTML = btn.dataset.originalText;
  }
};