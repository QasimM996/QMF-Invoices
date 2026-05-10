window.currentProfile = null;
// =========================
// 🔐 CHECK ROLE
// =========================
window.updateSplash = function (profile) {

  const title = document.getElementById('splashTitle');
  const logo = document.getElementById('splashLogo');

  if (!profile) return;

  // 🏪 اسم المتجر
  if (title) {
    title.textContent = profile.store_name || 'Invoice System';
  }

  // 🖼️ اللوجو (مع كسر الكاش)
  if (logo) {
    logo.src = profile.logo_url
      ? profile.logo_url + '?v=' + Date.now()
      : 'logo.png';
  }

};
window.updateAllLogos = function (logoUrl) {
  let finalUrl = 'logo.png';

  if (logoUrl) {
    finalUrl = logoUrl;

    if (!logoUrl.startsWith('blob:')) {
      finalUrl = logoUrl + '?t=' + Date.now();
    }
  }

  document.querySelectorAll('.storeLogo').forEach(function (el) {
    el.src = finalUrl;
  });
};

window.listenToProfileChanges = function () {

  const profileId = window.currentProfile?.id;
  if (!profileId) return;

  if (window.profileChannel) return;

  window.profileChannel = supabaseClient
    .channel('profile-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${profileId}`
      },
      (payload) => {

        const updated = payload.new;

        window.currentProfile = updated;

        updateAllLogos(updated.logo_url);
      }
    )
    .subscribe();
};
window.listenToProfileChanges = window.listenToProfileChanges || function() {
  console.log('Realtime not loaded yet');
};

window.checkUserAccess = async function () {
  const userId = getSavedUserId();

  if (!userId) {
    console.log("NO SAVED USER ID");
    return;
  }

  await checkUserAccessById(userId);
};




supabaseClient.auth.onAuthStateChange(async (event, session) => {

  if (event === 'SIGNED_IN') {
    await checkUserAccess();
  }

  if (event === 'SIGNED_OUT') {
    location.reload();
  }

});

// =========================
// 🎬 SHOW CODE MODAL
// =========================
function showAccessCode() {
  console.log("SHOW CODE MODAL 🔥");

  const modal = document.getElementById('accessCodeModal');

  if (!modal) {
    console.error("❌ modal مش موجود");
    return;
  }

  modal.classList.remove('hidden');
}


// =========================
// 🔑 VERIFY CODE
// =========================
window.verifyCode = async function () {
  const code = document.getElementById('accessCodeInput')?.value.trim();

  if (!code) {
    alert('أدخل كود الشركة');
    return;
  }

  const userId = getSavedUserId();

  if (!userId) {
    alert('يجب تسجيل الدخول أولاً');
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
    console.error("VERIFY CODE ERROR", profiles);
    alert('حدث خطأ أثناء التحقق من الكود');
    return;
  }

  const data = profiles[0];

  if (!data) {
    alert('كود الشركة غير صحيح');
    return;
  }

  window.currentProfile = data;
  window.selectedProfile = data;
if (typeof refreshProfileUI === 'function') {
  refreshProfileUI(data);
}

  if (typeof updateAllLogos === 'function') {
    updateAllLogos(data.logo_url);
  }

  localStorage.setItem('verifiedUser', data.id);

  const modal = document.getElementById('accessCodeModal');

  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }

  openApp(false);

  if (typeof listenToProfileChanges === 'function') {
    listenToProfileChanges();
  }
};




window.addEventListener('load', async () => {

  const splash = document.getElementById('splash');
  const login = document.getElementById('loginPage');

  // ⏳ خلي splash يظهر شوي
  await new Promise(resolve => setTimeout(resolve, 1000));

  const { data } = await supabaseClient.auth.getSession();
  const session = data?.session;

  console.log('SESSION:', session);

  if (session?.user) {
    await checkUserAccess();
  } else {
    if (login) login.style.display = 'block';
  }

  // 🔥 بعد ما نقرر، نخفي splash
  if (splash) {
    splash.style.opacity = '0';

    setTimeout(() => {
      splash.style.display = 'none';
    }, 500);
  }

});