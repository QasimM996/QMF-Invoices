// =========================
// 🖼️ UPLOAD LOGO
// =========================
window.uploadLogo = async function (event) {
  console.log("UPLOAD LOGO START");

  const file = event.target.files[0];

  console.log("SELECTED FILE", file);

if (!file) {
  return;
}

const previewUrl = URL.createObjectURL(file);

if (typeof updateAllLogos === 'function') {
  updateAllLogos(previewUrl);
}

if (!window.currentProfile?.id) {
  alert("اختر المستخدم أولاً");
  return;
}

  const profileId = window.currentProfile.id;

  const cleanFileName = file.name.replace(/\s+/g, "-");

  const fileName = `${profileId}/${Date.now()}-${cleanFileName}`;

  const uploadUrl =
    `${window.SUPABASE_URL}/storage/v1/object/logos/${fileName}`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`,
      "Content-Type": file.type,
      "x-upsert": "true"
    },
    body: file
  });

  const uploadResult = await response.json();

  console.log("UPLOAD RESULT", uploadResult);

  if (!response.ok) {
    console.error("UPLOAD LOGO ERROR", uploadResult);
    alert("فشل رفع الصورة");
    return;
  }

  const publicUrl =
    `${window.SUPABASE_URL}/storage/v1/object/public/logos/${fileName}`;

  console.log("NEW LOGO URL", publicUrl);

  window.currentProfile.logo_url = publicUrl;
  window.selectedProfile = window.currentProfile;

  if (typeof updateAllLogos === 'function') {
    updateAllLogos(publicUrl);
  }

  if (typeof loadUserSettings === 'function') {
    loadUserSettings(window.currentProfile);
  }

  event.target.value = "";
};







// =========================
// 📥 LOAD SETTINGS
// =========================
window.loadSettings = async function () {
  const profileId = window.selectedProfile?.id || window.currentProfile?.id;

  if (!profileId) {
    console.error("NO PROFILE ID");
    return;
  }

  const url =
    `${window.SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.${profileId}`;

  const response = await fetch(url, {
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`
    }
  });

  const profiles = await response.json();

  if (!response.ok) {
    console.error("LOAD SETTINGS ERROR", profiles);
    return;
  }

  const data = profiles[0];

  if (!data) {
    return;
  }

  window.currentProfile = data;

  if (window.selectedProfile) {
    window.selectedProfile = data;
  }

  setValue('storeName', data.store_name);
  setValue('storePhone', data.store_phone);
  setValue('storeAddress', data.store_address);
  setValue('storeSocial', data.store_social);

  if (typeof updateAllLogos === 'function') {
    updateAllLogos(data.logo_url);
  }
};






// =========================
// 💾 SAVE SETTINGS
// =========================
window.saveSettingsToDB = async function () {
  if (!window.currentProfile?.user_id) {
    alert("المستخدم غير مسجل دخول");
    return;
  }

  const body = {
    user_id: window.currentProfile.user_id,
    store_name: document.getElementById('storeName')?.value || '',
    store_phone: document.getElementById('storePhone')?.value || '',
    store_address: document.getElementById('storeAddress')?.value || '',
    store_social: document.getElementById('storeSocial')?.value || ''
  };

  const url =
    `${window.SUPABASE_URL}/rest/v1/settings?on_conflict=user_id`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(body)
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("SAVE SETTINGS ERROR", result);
    alert("فشل حفظ الإعدادات");
    return;
  }

  console.log("SETTINGS SAVED", result);
};


// =========================
// 🧠 UPDATE HEADER
// =========================
window.updateStoreHeader = function () {
  const name = getValue('storeName') || 'نظام فواتير موبايل';
  const phone = getValue('storePhone');
  const address = getValue('storeAddress');
  const social = getValue('storeSocial');

  const meta = [phone, address, social].filter(Boolean).join(' | ');

  setText('storeNamePreview', name);
  setText('storeMetaPreview', meta);
  setText('invoiceStoreName', name);
  setText('invoiceStoreMeta', meta);

  saveBranding();
};


// =========================
// 💾 LOCAL STORAGE
// =========================
window.saveBranding = function () {
  localStorage.setItem('invoice_branding', JSON.stringify({
    storeName: getValue('storeName'),
    storePhone: getValue('storePhone'),
    storeAddress: getValue('storeAddress'),
    storeSocial: getValue('storeSocial')
  }));
};


window.loadBranding = function () {
  const raw = localStorage.getItem('invoice_branding');
  if (!raw) return;

  const b = JSON.parse(raw);

  setValue('storeName', b.storeName);
  setValue('storePhone', b.storePhone);
  setValue('storeAddress', b.storeAddress);
  setValue('storeSocial', b.storeSocial);

  updateStoreHeader();
};


// =========================
// 🔄 AUTO SAVE INPUTS
// =========================
window.autoSaveBrandingInputs = function () {
  ['storeName', 'storePhone', 'storeAddress', 'storeSocial']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', updateStoreHeader);
    });
};
window.updateSelectedUserPassword = async function () {
  const newPassword = document.getElementById('adminNewPassword')?.value?.trim();

  if (!window.selectedProfile || !window.selectedProfile.user_id) {
    alert('اختر مستخدم من القائمة أولاً');
    return;
  }

  if (window.selectedProfile.role === 'admin') {
    alert('لا يمكن تغيير كلمة سر الأدمن من هنا');
    return;
  }

  if (!newPassword) {
    alert('أدخل كلمة سر جديدة');
    return;
  }

  console.log("UPDATING PASSWORD FOR:", {
    email: window.selectedProfile.email,
    user_id: window.selectedProfile.user_id
  });

  const { data, error } = await supabaseClient.functions.invoke('quick-service', {
    body: {
      action: 'update-password',
      target_user_id: window.selectedProfile.user_id,
      password: newPassword
    }
  });

  console.log("PASSWORD UPDATE:", data, error);

  if (error) {
    console.error("PASSWORD UPDATE ERROR:", error);

    if (error.context) {
      try {
        const errorBody = await error.context.json();
        console.error("PASSWORD UPDATE ERROR BODY:", errorBody);
        alert(errorBody.error || 'فشل تغيير كلمة السر');
      } catch (e) {
        alert('فشل تغيير كلمة السر');
      }
    } else {
      alert('فشل تغيير كلمة السر');
    }

    return;
  }

  document.getElementById('adminNewPassword').value = '';

  alert('تم تغيير كلمة السر');
};






// =========================
// 💾 SAVE + HIDE
// =========================
window.saveAndHideStoreSettings = async function () {

  const store_name = document.getElementById('storeName')?.value || '';
  const store_phone = document.getElementById('storePhone')?.value || '';
  const store_address = document.getElementById('storeAddress')?.value || '';

  if (!window.currentProfile?.id) {
    alert("لم يتم تحديد المستخدم");
    return;
  }

  const logo_url = window.currentProfile.logo_url || null;

  const url =
    `${window.SUPABASE_URL}/rest/v1/profiles?id=eq.${window.currentProfile.id}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      store_name,
      store_phone,
      store_address,
      logo_url
    })
  });


  const result = await response.json();

  if (!response.ok) {
    console.error("SAVE PROFILE ERROR", result);
    alert("فشل الحفظ");
    return;
  }

  const updatedProfile = result[0];

  window.currentProfile = updatedProfile;
  window.selectedProfile = updatedProfile;

  if (typeof loadUserSettings === 'function') {
    loadUserSettings(updatedProfile);
  }

  if (typeof updateAllLogos === 'function') {
    updateAllLogos(updatedProfile.logo_url);
  }

  if (typeof loadUsers === 'function') {
    await loadUsers();
  }

  alert("تم الحفظ");
};




window.refreshProfileUI = function (profile) {

  if (!profile) return;

  // 🖼️ تحديث اللوجو
  document.querySelectorAll('.storeLogo').forEach(el => {
    el.src = profile.logo_url ? profile.logo_url + '?v=' + Date.now() : 'logo.png';
  });

  // 🏪 تحديث اسم المتجر
  const nameInput = document.getElementById('storeName');
  if (nameInput) nameInput.value = profile.store_name || '';

  const phoneInput = document.getElementById('storePhone');
  if (phoneInput) phoneInput.value = profile.store_phone || '';

  const addressInput = document.getElementById('storeAddress');
  if (addressInput) addressInput.value = profile.store_address || '';

const title = document.getElementById('invoiceStoreName');

if (title) {
  const storeName = profile.store_name || 'الفواتير';
  const storeAddress = profile.store_address || '';

  title.innerHTML = `
    <div class="invoice-store-name">${storeName}</div>
    ${
      storeAddress
        ? `<div class="invoice-store-address">${storeAddress}</div>`
        : ''
    }
  `;
}


};

// =========================
// 🔄 REALTIME SETTINGS
// =========================
window.subscribeToSettings = function () {
  supabaseClient
    .channel('settings-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'settings' },
      (payload) => {
        const data = payload.new;

        setValue('storeName', data.store_name);
        setValue('storePhone', data.store_phone);
        setValue('storeAddress', data.store_address);
        setValue('storeSocial', data.store_social);

        if (data.logo_url) {
          const logo = document.getElementById('storeLogo');
          if (logo) logo.src = data.logo_url;
        }

        updateStoreHeader();
      }
    )
    .subscribe();
};


// =========================
// 🧰 HELPERS (داخلي)
// =========================
function getValue(id) {
  return document.getElementById(id)?.value || '';
}

window.setValue = function (id, value) {
  const el = document.getElementById(id);

  if (el) {
    el.value = value || '';
  }
};


function setText(id, value) {
  const el = document.getElementById(id);
  if (el && value !== undefined) el.textContent = value;
}
