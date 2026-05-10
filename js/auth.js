// =========================
// 🔐 STATE
// =========================
let isLoggedIn = false;




// =========================
// 🎯 BODY SCROLL CONTROL
// =========================
function setBodyScroll(lock) {
  if (!document.body) return;
  document.body.style.overflow = lock ? 'hidden' : 'auto';
}
// =========================
// 🖥️ SHOW LOGIN
// =========================
window.showLogin = function () {
  isLoggedIn = false;

  const login = document.getElementById('loginPage');
  const app = document.getElementById('app');
  const accessModal = document.getElementById('accessCodeModal');

  if (login) {
    login.style.display = 'flex';
    login.classList.add('active-page');
    login.classList.remove('hidden-page');
  }

  if (app) {
    app.style.display = 'none';
    app.classList.add('hidden-page');
    app.classList.remove('active-page');
  }

  if (accessModal) {
    accessModal.classList.add('hidden');
  }


  setBodyScroll(true);
};

// =========================
// 🎯 AFTER LOGIN
// =========================
async function afterLogin() {
  console.log("AFTER LOGIN 🔥");
  const login = document.getElementById('loginPage');
  const app = document.getElementById('app');

  if (login) login.style.display = 'none';

listenToProfileChanges();
await checkUserAccess(); // 🔥 أهم سطر
if (document.getElementById('productTable')) {
  await loadProducts();
}

if (document.getElementById('itemSelect')) {
  loadProductsDropdown();
}



enableEnterNavigation();
setTodayAsDefaultDate();
}


// =========================
// 🔐 LOGIN
// =========================
window.setLoading = function (isLoading) {
  const text = document.getElementById('loginText');
  const loader = document.getElementById('loginLoader');

  if (text) text.style.display = isLoading ? 'none' : 'block';
  if (loader) loader.style.display = isLoading ? 'block' : 'none';
}

// =========================
// 🔐 LOGIN
// =========================
window.login = async function () {
  console.log("LOGIN CLICKED");

  const email = document.getElementById('email')?.value.trim().toLowerCase();
  const password = document.getElementById('password')?.value;

  if (!email || !password) {
    alert("اكتب الإيميل وكلمة المرور");
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  console.log("LOGIN RESULT:", data, error);

  if (error) {
    alert(error.message);
    return;
  }

  if (data?.session) {
    localStorage.setItem("qmf-auth-token", JSON.stringify(data.session));
  }

  const userId = data?.user?.id;

  if (!userId) {
    alert("لم يتم العثور على بيانات المستخدم");
    return;
  }

  await checkUserAccessById(userId);
};








// =========================
// 🚪 LOGOUT
// =========================
window.logout = async function () {
    if (window.profileChannel) {
    await supabaseClient.removeChannel(window.profileChannel);
    window.profileChannel = null;
  }

  // 🔥 حذف التحقق من الكود
  localStorage.removeItem('verifiedUser');

  // 🔥 تسجيل خروج
  await supabaseClient.auth.signOut();

  // 🔥 رجوع لصفحة الدخول
  document.getElementById('app').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
  localStorage.removeItem("verifiedUser");
  
showLogin();
};

if (window.profileChannel) {
  supabaseClient.removeChannel(window.profileChannel);
  window.profileChannel = null;
}

// =========================
// 👁️ TOGGLE PASSWORD
// =========================

window.togglePassword = function (inputId, el) {
 const input = document.getElementById(inputId);
  if (!input) return;

  const isHidden = input.type === "password";
  input.type = isHidden ? "text" : "password";

  // نعيد رسم الأيقونة بدل تعديل i القديمة
  el.innerHTML = `<i data-lucide="${isHidden ? 'eye-off' : 'eye'}"></i>`;

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
};

// =========================
// ❗ ERROR HANDLING
// =========================
function showAuthError(message) {
  const el = document.getElementById('loginError');
  if (el) el.textContent = message;
}

function handleAuthError(error, errorBox) {
  if (!errorBox) return;

  if (error.message.includes("Invalid login")) {
    errorBox.textContent = "الإيميل أو كلمة المرور غلط";
  } else if (error.message.includes("Email not confirmed")) {
    errorBox.textContent = "أكد الإيميل أولاً";
  } else if (error.message.includes("missing email")) {
    errorBox.textContent = "الإيميل غير مكتوب";
  } else {
    errorBox.textContent = error.message;
  }
}

function clearAuthError() {
  const el = document.getElementById('loginError');
  if (el) el.textContent = '';
}

async function verifyAccessCode(code) {
  const userId = getSavedUserId();

  if (!userId) {
    alert("مش مسجل دخول");
    return;
  }

  const url =
    `${window.SUPABASE_URL}/rest/v1/profiles?select=*&user_id=eq.${userId}&access_code=eq.${code}`;

  const response = await fetch(url, {
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`
    }
  });

  const profiles = await response.json();

  if (!response.ok) {
    console.error("VERIFY ACCESS CODE ERROR", profiles);
    alert("حدث خطأ أثناء التحقق من الكود");
    return;
  }

  const data = profiles[0];

  if (!data) {
    alert("الكود غير صحيح");
    return;
  }

  console.log("ACCESS GRANTED", data);

  window.currentProfile = data;
  window.selectedProfile = data;

  localStorage.setItem('access_code', code);
  localStorage.setItem('verifiedUser', data.id);

  if (typeof updateAllLogos === 'function') {
    updateAllLogos(data.logo_url);
  }

  if (typeof autoVerify === 'function') {
    autoVerify();
  }
}





window.getSavedUserId = function () {
  const savedSession = localStorage.getItem("qmf-auth-token");

  if (!savedSession) {
    return null;
  }

  try {
    const sessionObject = JSON.parse(savedSession);

    return (
      sessionObject?.user?.id ||
      sessionObject?.currentSession?.user?.id ||
      sessionObject?.session?.user?.id ||
      null
    );
  } catch (err) {
    console.error("SESSION READ ERROR", err);
    return null;
  }
};






// =========================
// 📦 CHECK SESSION (startup)
// =========================
window.checkUser = async function () {
  console.log("CHECK USER START");

  const splash = document.getElementById('splash');
  const loader = document.getElementById('appLoader');
  const login = document.getElementById('loginPage');
  const app = document.getElementById('app');

  if (login) login.style.display = 'none';
  if (app) app.style.display = 'none';

  const userId = getSavedUserId();

  console.log("SAVED USER ID", userId);

  if (userId) {
    await checkUserAccessById(userId);

    if (loader) loader.style.display = 'none';

    if (splash) {
      splash.style.display = 'none';
      splash.style.visibility = 'hidden';
      splash.style.opacity = '0';
      splash.style.pointerEvents = 'none';
    }

    return;
  }

  if (loader) loader.style.display = 'none';

  if (splash) {
    splash.style.display = 'none';
    splash.style.visibility = 'hidden';
    splash.style.opacity = '0';
    splash.style.pointerEvents = 'none';
  }

  if (login) login.style.display = 'flex';
};




window.checkUserAccessById = async function (userId) {
  const data = await getProfileByUserId(userId);

  if (!data) {
    console.error("PROFILE NOT FOUND");
    return;
  }

  window.currentProfile = data;
  window.selectedProfile = data;
const savedVersion = localStorage.getItem('sessionVersion');

if (savedVersion && String(savedVersion) !== String(data.session_version)) {
  localStorage.removeItem('qmf-auth-token');
  localStorage.removeItem('verifiedUser');
  localStorage.removeItem('sessionVersion');
  location.reload();
  return;
}

localStorage.setItem('sessionVersion', data.session_version || 1);

if (typeof refreshProfileUI === 'function') {
  refreshProfileUI(data);
}

  if (typeof updateAllLogos === 'function') {
    updateAllLogos(data.logo_url);
  }

  console.log('ROLE:', data.role);

  if (data.role === 'admin') {
    openApp(true);

    if (typeof listenToProfileChanges === 'function') {
      listenToProfileChanges();
    }

    return;
  }

  const verified = localStorage.getItem('verifiedUser');

  if (verified === data.id) {
    openApp(false);

    if (typeof listenToProfileChanges === 'function') {
      listenToProfileChanges();
    }

    return;
  }

  showAccessCode();

  if (typeof listenToProfileChanges === 'function') {
    listenToProfileChanges();
  }
};





window.getProfileByUserId = async function (userId) {
  const url =
    `${window.SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}&select=*`;

  const response = await fetch(url, {
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`
    }
  });

  const profiles = await response.json();

  if (!response.ok) {
    console.error("PROFILE FETCH ERROR", profiles);
    return null;
  }

  return profiles[0] || null;
};



window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
window.supabaseClient = supabaseClient;






window.initAuthListener = function () {
  supabaseClient.auth.onAuthStateChange(function (event, session) {
    console.log("AUTH EVENT:", event);
  });
};




// =========================
// 📩 RESET PASSWORD
// =========================
window.resetPassword = async function () {
  const email = document.getElementById('email').value.trim();

  if (!email) {
    showAuthError("اكتب البريد الإلكتروني أولاً");
    return;
  }

  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email);

    if (error) {
      showAuthError("فشل إرسال الرابط");
      return;
    }

    showAuthError("تم إرسال رابط إعادة تعيين كلمة المرور 📩");

  } catch (err) {
    console.error(err);
    showAuthError("حدث خطأ");
  }
};
