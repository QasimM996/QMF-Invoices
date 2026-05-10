window.currentProfile = null;
window.currentFilter = 'all';

window.showError = function (message) {
  const el = document.getElementById('adminError');
  if (!el) return;

  el.textContent = message;

  // يخفي الرسالة بعد 3 ثواني
  setTimeout(() => {
    el.textContent = '';
  }, 5000);
};

window.filterUsers = function (type) {
  window.currentFilter = type;
  loadUsers();
};
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

window.createUser = async function (e) {
  if (window.isCreatingUser) {
  return;
}

window.isCreatingUser = true;

  const btn = e.target;

  setButtonLoading(btn, true);

  try {
    const email = document.getElementById('newUserEmail').value.trim().toLowerCase();
    const password = document.getElementById('newUserPassword').value;
    const storeName = document.getElementById('storeNameAdmin').value;
    const customCode = document.getElementById('customCode').value;
    const phone = document.getElementById('storePhoneAdmin').value;
    const address = document.getElementById('storeAddressAdmin').value;
    const file = document.getElementById('logoAdminInput').files[0];

    const access_code = customCode || generateCode();

    const { data: existingUsers, error: existingError } = await supabaseClient
      .from('profiles')
      .select('email, access_code');

    if (existingError) {
      console.error(existingError);
      showError("فشل التحقق من المستخدمين");
      return;
    }

    const emailExists = (existingUsers || []).some(function (u) {
      return String(u.email || '').toLowerCase() === email;
    });

    const codeExists = (existingUsers || []).some(function (u) {
      return String(u.access_code || '') === String(access_code);
    });

    if (emailExists) {
      showError("📧 هذا الإيميل مستخدم");
      return;
    }

    if (codeExists) {
      showError("❌ كود الشركة مستخدم مسبقًا");
      return;
    }
console.log("EMAIL BEING SENT:", email);
console.log("CODE BEING SENT:", access_code);
    const { data, error } = await supabaseClient.functions.invoke('quick-service', {
      body: {
        email,
        password,
        store_name: storeName,
        access_code,
        store_phone: phone,
        store_address: address
      }
    });

    console.log("CREATE USER DATA:", data);
    console.log("CREATE USER ERROR:", error);

    if (error) {
      console.error("CREATE USER ERROR:", error);

      if (error.context) {
        try {
          const errorBody = await error.context.json();
          console.error("CREATE USER ERROR BODY:", errorBody);
          showError(errorBody.error || error.message);
        } catch (parseError) {
          showError(error.message);
        }
      } else {
        showError(error.message);
      }

      return;
    }

    const profileId = data.user_id;

    if (file) {
      const fileName = `${profileId}/${Date.now()}_${file.name}`;

      await supabaseClient.storage
        .from('logos')
        .upload(fileName, file);

      const { data: urlData } = supabaseClient.storage
        .from('logos')
        .getPublicUrl(fileName);

      await supabaseClient
        .from('profiles')
        .update({ logo_url: urlData.publicUrl })
        .eq('user_id', profileId);
    }

    showError(`✅ تم إنشاء المستخدم\n🔑 الكود: ${access_code}`);

    if (typeof loadUsers === 'function') {
      await loadUsers();
    }

  } catch (err) {
    console.error("CREATE USER UNEXPECTED ERROR:", err);
    showError("حدث خطأ غير متوقع أثناء إنشاء المستخدم");

  } finally {
    window.isCreatingUser = false;
    setButtonLoading(btn, false);
  }
};







window.loadUsers = async function () {
  const container = document.getElementById('usersList');

  if (!container) {
    return;
  }

  container.innerHTML = "جاري تحميل المستخدمين...";

  let url =
    `${window.SUPABASE_URL}/rest/v1/profiles?select=*&role=neq.admin&order=created_at.desc`;

  if (window.currentFilter === 'active') {
    url += `&is_active=eq.true`;
  }

  if (window.currentFilter === 'disabled') {
    url += `&is_active=eq.false`;
  }

  const response = await fetch(url, {
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`
    }
  });

  const data = await response.json();

  console.log("USERS DATA:", data);

  if (!response.ok) {
    console.error("LOAD USERS ERROR", data);
    container.innerHTML = "فشل تحميل المستخدمين";
    return;
  }

  container.innerHTML = data.map(u => `
    <div class="user-card" onclick="selectUser('${u.id}')">

      <div><strong>${u.email}</strong></div>
      <div>Store: ${u.store_name || '-'}</div>
      <div>Code: <b>${u.access_code || '-'}</b></div>
      <div>Status:
        <span style="color:${u.is_active ? 'green' : 'red'}">
          ${u.is_active ? 'نشــط' : 'مــعطل'}
        </span>
      </div>

      <div style="display:flex; gap:8px; justify-content:space-between; margin-top:8px;">
        <button
          class="btn"
          style="background-color:${u.is_active ? '#dc2626' : '#16a34a'};color:white;cursor:pointer;"
          onclick="event.stopPropagation(); toggleUserStatus('${u.id}', ${u.is_active})"
        >
          ${u.is_active ? 'تعطيل' : 'تفعيل'}
        </button>

        <button
          class="btn btn-danger"
          onclick="event.stopPropagation(); deleteUserProfile('${u.id}')"
        >
          حذف
        </button>
      </div>
    </div>
  `).join('');

  if (typeof renderAdminCharts === 'function') {
    renderAdminCharts();
  }
};

window.toggleAdminPasswordView = function (btn) {
  const input = document.getElementById('adminNewPassword');

  if (!input) {
    return;
  }

  const icon = btn.querySelector('i');

  if (input.type === 'password') {
    input.type = 'text';
    btn.setAttribute('aria-label', 'إخفاء كلمة السر');

    if (icon) {
      icon.setAttribute('data-lucide', 'eye-off');
    }
  } else {
    input.type = 'password';
    btn.setAttribute('aria-label', 'إظهار كلمة السر');

    if (icon) {
      icon.setAttribute('data-lucide', 'eye');
    }
  }

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
};


window.toggleUserStatus = async function (profileId, currentState) {
  const { error } = await supabaseClient
    .from('profiles')
    .update({ is_active: !currentState })
    .eq('id', profileId);

  if (error) {
    alert(error.message);
    return;
  }

  loadUsers();
};
window.deleteUserProfile = async function (profileId) {
  const ok = confirm("متأكد من حذف هذا المستخدم من profiles؟");
  if (!ok) return;

  const { error } = await supabaseClient
    .from('profiles')
    .delete()
    .eq('id', profileId);

  if (error) {
    alert(error.message);
    return;
  }

  loadUsers();
};
window.renderAdminCharts = async function () {
  console.log("RENDER STATS START");

  const url =
    `${window.SUPABASE_URL}/rest/v1/profiles?select=is_active,role&role=neq.admin`;

  const response = await fetch(url, {
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("STATS ERROR", data);
    return;
  }

  const totalUsers = data.length;

  const activeUsers = data.filter(function (u) {
    return u.is_active === true;
  }).length;

  const disabledUsers = totalUsers - activeUsers;

  const totalEl = document.getElementById('totalUsers');
  const activeEl = document.getElementById('activeUsers');
  const disabledEl = document.getElementById('disabledUsers');

  if (totalEl) {
    totalEl.textContent = totalUsers;
  }

  if (activeEl) {
    activeEl.textContent = activeUsers;
  }

  if (disabledEl) {
    disabledEl.textContent = disabledUsers;
  }

  console.log("STATS", {
    totalUsers,
    activeUsers,
    disabledUsers
  });
};



function loadUserSettings(profile) {
  const storeName = document.getElementById('storeName');
  const storePhone = document.getElementById('storePhone');
  const storeAddress = document.getElementById('storeAddress');

  if (storeName) {
    storeName.value = profile.store_name || '';
  }

  if (storePhone) {
    storePhone.value = profile.store_phone || '';
  }

  if (storeAddress) {
    storeAddress.value = profile.store_address || '';
  }

  if (typeof updateAllLogos === 'function') {
    updateAllLogos(profile.logo_url);
  }
}

window.selectUser = async function (profileId) {
  const url =
    `${window.SUPABASE_URL}/rest/v1/profiles?id=eq.${profileId}&select=*`;

  const response = await fetch(url, {
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`
    }
  });

  const profiles = await response.json();

  if (!response.ok) {
    console.error("SELECT USER ERROR", profiles);
    return;
  }

  const data = profiles[0];

  if (!data) {
    console.error("USER NOT FOUND");
    return;
  }

  window.selectedProfile = data;
  window.currentProfile = data;

  const title = document.getElementById('selectedUserTitle');

  if (title) {
    title.textContent =
      `إعدادات: ${data.email || '-'} || ${data.access_code || '-'} || ${data.store_name || '-'}`;
  }

  loadUserSettings(data);

  if (typeof updateAllLogos === 'function') {
    updateAllLogos(data.logo_url);
  }
  if (typeof loadAdminProducts === 'function') {
  loadAdminProducts();
}

};

window.adminProductsCache = [];

window.loadAdminProducts = async function () {
  if (!window.selectedProfile?.id) {
    return;
  }

  const table = document.getElementById('adminProductTable');

  if (table) {
    table.innerHTML = '<tr><td colspan="4">جاري تحميل المنتجات...</td></tr>';
  }

const url =
  `${window.SUPABASE_URL}/rest/v1/products?select=*&or=(profile_id.eq.${window.selectedProfile.id},user_id.eq.${window.selectedProfile.user_id})&order=created_at.desc`;

  const response = await fetch(url, {
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${getSavedAccessToken()}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("LOAD ADMIN PRODUCTS ERROR", data);

    if (table) {
      table.innerHTML = '<tr><td colspan="4">فشل تحميل المنتجات</td></tr>';
    }

    return;
  }

  window.adminProductsCache = data || [];

  renderAdminProductList();
};



window.renderAdminProductList = function () {
  const table = document.getElementById('adminProductTable');

  if (!table) {
    return;
  }

  const query =
    document.getElementById('adminSearchProduct')?.value?.trim().toLowerCase() || '';

  const products = window.adminProductsCache || [];

  const filtered = products.filter(function (p) {
    return String(p.name || '').toLowerCase().includes(query);
  });

  if (!filtered.length) {
    table.innerHTML = '<tr><td colspan="4">لا توجد منتجات</td></tr>';
    return;
  }

  table.innerHTML = filtered.map(function (p, index) {
    return `
      <tr>
        <td>${index + 1}</td>
        <td>
          <input id="admin-product-name-${p.id}" value="${p.name || ''}">
        </td>
        <td>
          <input id="admin-product-price-${p.id}" type="number" value="${p.price || 0}">
        </td>
        <td>
          <button type="button" class="btn btn-success" onclick="saveAdminProductEdit('${p.id}')">
            حفظ
          </button>

          <button type="button" class="btn btn-danger" onclick="deleteAdminProduct('${p.id}')">
            حذف
          </button>
        </td>
      </tr>
    `;
  }).join('');
};




window.addAdminProduct = async function () {
  if (!window.selectedProfile?.id || !window.selectedProfile?.user_id) {
    alert('اختر المستخدم أولاً');
    return;
  }

  const nameInput = document.getElementById('adminProductNameInput');
  const priceInput = document.getElementById('adminProductPriceInput');

  const name = nameInput?.value?.trim() || '';
  const price = Number(priceInput?.value || 0);

  if (!name) {
    alert('اكتب اسم المنتج');
    return;
  }

  const url = `${window.SUPABASE_URL}/rest/v1/products`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${getSavedAccessToken()}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      user_id: window.selectedProfile.user_id,
      profile_id: window.selectedProfile.id,
      name,
      price
    })
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("ADD ADMIN PRODUCT ERROR", result);
    alert('فشل إضافة المنتج');
    return;
  }

  if (nameInput) {
    nameInput.value = '';
  }

  if (priceInput) {
    priceInput.value = '';
  }

  await loadAdminProducts();
};



window.saveAdminProductEdit = async function (id) {
  if (!window.selectedProfile?.id) {
    alert('اختر المستخدم أولاً');
    return;
  }

  const name = document.getElementById(`admin-product-name-${id}`)?.value?.trim();
  const price = Number(document.getElementById(`admin-product-price-${id}`)?.value || 0);

  if (!name) {
    alert('اسم المنتج مطلوب');
    return;
  }

  const url =
    `${window.SUPABASE_URL}/rest/v1/products?id=eq.${id}&profile_id=eq.${window.selectedProfile.id}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${getSavedAccessToken()}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      name,
      price
    })
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("SAVE ADMIN PRODUCT ERROR", result);
    alert('فشل تعديل المنتج');
    return;
  }

  await loadAdminProducts();
  alert('تم تعديل المنتج');
};



window.deleteAdminProduct = async function (id) {
  if (!window.selectedProfile?.id) {
    alert('اختر المستخدم أولاً');
    return;
  }

  if (!confirm('هل تريد حذف المنتج؟')) {
    return;
  }

  const url =
    `${window.SUPABASE_URL}/rest/v1/products?id=eq.${id}&profile_id=eq.${window.selectedProfile.id}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${getSavedAccessToken()}`
    }
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("DELETE ADMIN PRODUCT ERROR", error);
    alert('فشل حذف المنتج');
    return;
  }

  await loadAdminProducts();
  alert('تم حذف المنتج');
};
