// =========================
// 📦 GLOBAL STATE
// =========================
window.items = [];
window.products = [];
window.clientViewActive = false;

window.openApp = function (isAdmin = false) {

  const loginPage = document.getElementById('loginPage');
  const app = document.getElementById('app');
  const adminPanel = document.getElementById('adminPanel');
  const mainContent = document.getElementById('mainContent');
  const splash = document.getElementById('splash');
  const accessCodeModal = document.getElementById('accessCodeModal');


  // 2. إخفاء login
  if (loginPage) loginPage.style.display = 'none';

  // 3. إظهار التطبيق
  if (app) app.style.display = 'block';

  // 4. إخفاء كل شيء أولًا (مهم جدًا)
  if (adminPanel) adminPanel.style.display = 'none';
  if (mainContent) mainContent.style.display = 'none';

  // 5. إخفاء مودال الكود
  if (accessCodeModal) accessCodeModal.classList.add('hidden');

  // 6. إخفاء السبلاش
  if (splash) splash.style.display = 'none';

  // 7. عرض حسب الدور
  if (isAdmin) {
    console.log('👑 Admin View');
      window.selectedProfile = null;
  if (adminPanel) {
    adminPanel.style.display = 'block';
  }

  if (typeof renderAdminCharts === 'function') {
    renderAdminCharts();
  }

} else {
  console.log('User View');

  if (mainContent) {
    mainContent.style.display = 'block';
  }
  if (typeof setTodayAsDefaultDate === 'function') {
    setTodayAsDefaultDate();
  }
  if (typeof refreshProfileUI === 'function' && window.currentProfile) {
    refreshProfileUI(window.currentProfile);
  }
if (typeof renderDashboard === 'function') {
  renderDashboard();
}

  if (typeof loadProducts === 'function') {
    loadProducts();
  }

  if (typeof generateInvoiceNumber === 'function') {
    generateInvoiceNumber();
  }
}



};

window.getSavedAccessToken = function () {
  const savedSession = localStorage.getItem("qmf-auth-token");

  if (!savedSession) {
    return null;
  }

  try {
    const sessionObject = JSON.parse(savedSession);

    return (
      sessionObject?.access_token ||
      sessionObject?.currentSession?.access_token ||
      sessionObject?.session?.access_token ||
      null
    );
  } catch (err) {
    console.error("TOKEN READ ERROR", err);
    return null;
  }
};


// =========================
// 👁️ TOGGLE SETTINGS
// =========================
window.toggleStoreSettings = function (shouldHide) {
  const content = document.querySelectorAll('#storeSettingsContent input, #storeSettingsContent textarea');
  content.forEach(el => {
    el.style.display = shouldHide ? 'none' : 'block';
  });
};
async function checkFirstTimeUser() {
  const userId = getSavedUserId();

  if (!userId) {
    return null;
  }

  const url =
    `${window.SUPABASE_URL}/rest/v1/settings?select=*&user_id=eq.${userId}`;

  const response = await fetch(url, {
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("CHECK FIRST TIME USER ERROR", data);
    return null;
  }

  return data[0] || null;
}

// =========================
// 🚀 INIT APP
// =========================
async function init() {

document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons(); // 🔥 يشغل الأيقونات
});
  // 🔐 تأكد من تسجيل الدخول
  if (typeof initAuthListener === "function") {
  initAuthListener();
  }
  await checkFirstTimeUser();
  // 🏪 إعدادات المتجر
  if (typeof loadBranding === "function") loadBranding();
  if (typeof autoSaveBrandingInputs === "function") autoSaveBrandingInputs();

  if (typeof loadSettings === "function") await loadSettings();
  if (typeof subscribeToSettings === "function") subscribeToSettings();

  // 📦 المنتجات
  if (typeof loadProducts === "function") loadProducts();

// 🔄 realtime products
if (typeof subscribeToProducts === "function") {
  subscribeToProducts();
}
  
  // 🧾 الفاتورة
  const invoiceNoEl = document.getElementById('invoiceNo');
  const invoiceDateEl = document.getElementById('invoiceDate');


  if (invoiceDateEl) invoiceDateEl.value = new Date().toISOString().split('T')[0];

  // 🧾 Render
  if (typeof renderItems === "function") renderItems();
  if (typeof renderSummary === "function") renderSummary();
  if (typeof renderPOSGrid === "function") renderPOSGrid();

  // 📊 Dashboard
  if (typeof renderSavedInvoices === "function") await renderSavedInvoices();
  if (typeof renderDashboard === "function") await renderDashboard();

  // 🌐 Load invoice from URL
  if (typeof loadInvoiceFromURL === "function") await loadInvoiceFromURL();

  // ⌨️ Events
  initEvents();

  // 🧹 Reset inputs
  if (typeof clearQuickInputs === "function") clearQuickInputs();

  // 📂 Start tab
  showTab('invoice');
}
if (!window.authInitialized) {
  initAuthListener();
  window.authInitialized = true;
}

// =========================
// 🎯 EVENTS
// =========================
function initEvents() {

  const ids = ['quickItemPrice', 'quickItemQty', 'quickItemDiscount'];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateQuickLineTotal);
  });

  const nameInput = document.getElementById('quickItemName');

  if (nameInput) {
    nameInput.addEventListener('input', applyProductSuggestion);

    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('quickItemPrice')?.focus();
      }
    });
  }

  document.getElementById('quickItemPrice')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('quickItemQty')?.focus();
    }
  });

  document.getElementById('quickItemQty')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('quickItemDiscount')?.focus();
    }
  });

  document.getElementById('quickItemDiscount')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addQuickItem();
    }
  });
}


// =========================
// 📂 TABS
// =========================
window.showTab = function (tab) {
  ['settings', 'invoice', 'saved', 'products'].forEach(t => {
    const el = document.getElementById('tab-' + t);
    if (el) el.style.display = (t === tab) ? 'block' : 'none';
  });
    // 🔥 الحل
  if (tab === 'products') {
    renderProductList();
  }
    if (tab === 'invoice') {
    renderPOSGrid();
  }
  if (tab === 'saved') {
  loadSavedInvoices();
}

};


// =========================
// ▶️ START
// =========================
document.addEventListener("DOMContentLoaded", () => {
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
});

document.addEventListener("DOMContentLoaded", init);

function init() {
  checkUser();
}

