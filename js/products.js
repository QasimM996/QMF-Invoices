// =========================
// 📦 STATE
// =========================
let products = [];


// =========================
// ➕ ADD PRODUCT
// =========================
window.addProduct = async function () {
  const nameInput = document.getElementById('productNameInput');
  const priceInput = document.getElementById('productPriceInput');

  const name = nameInput?.value.trim();
  const price = Number(priceInput?.value || 0);

  if (!name) {
    alert('اكتب اسم المنتج');
    return;
  }

  if (!window.currentProfile?.id || !window.currentProfile?.user_id) {
    alert("مش مسجل دخول");
    return;
  }

  const url =
    `${window.SUPABASE_URL}/rest/v1/products`;

  const response = await fetch(url, {
    method: "POST",
headers: {
  apikey: window.SUPABASE_ANON_KEY,
  Authorization: `Bearer ${getSavedAccessToken()}`,
  "Content-Type": "application/json",
  Prefer: "return=representation"
},

    body: JSON.stringify({
      user_id: window.currentProfile.user_id,
      profile_id: window.currentProfile.id,
      name,
      price
    })
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("ADD PRODUCT ERROR", result);
    alert("فشل الإضافة");
    return;
  }

  if (nameInput) {
    nameInput.value = '';
  }

  if (priceInput) {
    priceInput.value = '';
  }

  await window.loadProducts();

  if (typeof renderProductList === 'function') {
    renderProductList();
  }

  if (typeof renderPOSGrid === 'function') {
    renderPOSGrid();
  }
};


// =========================
// 📋 RENDER PRODUCTS TABLE
// =========================
window.renderProductList = function () {
  const tbody = document.getElementById('productTable');

  if (!tbody) {
    console.warn("PRODUCT TABLE NOT FOUND");
    return;
  }

  const productsList = window.productsCache || [];
  const query = document.getElementById('searchProduct')?.value?.trim().toLowerCase() || '';

  const filtered = productsList.filter(function (p) {
    return (p.name || '').toLowerCase().includes(query);
  });

  tbody.innerHTML = filtered.map(function (p, index) {
    return `
      <tr>
        <td>${index + 1}</td>
        <td><input id="product-name-${p.id}" value="${p.name || ''}" /></td>
        <td><input id="product-price-${p.id}" type="number" value="${p.price || 0}" /></td>
        <td style="display:flex; gap:6px;">
          <button type="button" class="btn btn-success" onclick="saveProductEdit('${p.id}')">حفظ</button>
          <button type="button" class="btn btn-danger" onclick="deleteProduct('${p.id}')">حذف</button>
        </td>
      </tr>
    `;
  }).join('');
};



window.saveProductEdit = async function (id) {
  const nameInput = document.getElementById(`product-name-${id}`);
  const priceInput = document.getElementById(`product-price-${id}`);

  const name = nameInput?.value?.trim();
  const price = Number(priceInput?.value || 0);

  if (!name) {
    alert('اسم المنتج مطلوب');
    return;
  }

  if (!window.currentProfile?.id) {
    alert('لم يتم تحميل بيانات المستخدم');
    return;
  }

  const url =
    `${window.SUPABASE_URL}/rest/v1/products?id=eq.${id}&profile_id=eq.${window.currentProfile.id}`;

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

  console.log("PRODUCT UPDATE RESULT", result);

  if (!response.ok) {
    console.error("UPDATE PRODUCT ERROR", result);
    alert('فشل تعديل المنتج');
    return;
  }

await loadProducts();

alert('تم تعديل المنتج');

};




window.deleteProduct = async function (id) {
  const { error } = await supabaseClient
    .from('products')
    .delete()
    .eq('id', id)
    .eq('profile_id', window.currentProfile.id);

  if (error) {
    console.error(error);
    alert('فشل حذف المنتج');
    return;
  }

  await loadProducts();
  renderProductList();
};

// =========================
// ✏️ UPDATE PRODUCT
// =========================
window.updateProduct = async function (id, field, value) {
  if (!window.currentProfile?.id) {
    return;
  }

  const updateData = {
    [field]: field === 'price' ? Number(value) : value
  };

  const url =
    `${window.SUPABASE_URL}/rest/v1/products?id=eq.${id}&profile_id=eq.${window.currentProfile.id}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify(updateData)
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("UPDATE PRODUCT ERROR", result);
    return;
  }

  await loadProducts();

  if (typeof renderProductSelect === 'function') {
    renderProductSelect();
  }
};

window.loadProductsDropdown = async function () {
  const select = document.getElementById('itemSelect');

  if (!select) {
    return;
  }

  if (!window.currentProfile?.id) {
    return;
  }

  const url =
    `${window.SUPABASE_URL}/rest/v1/products?select=*&profile_id=eq.${window.currentProfile.id}&order=created_at.desc`;

  const response = await fetch(url, {
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${getSavedAccessToken()}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("LOAD PRODUCTS DROPDOWN ERROR", data);
    return;
  }

  window.productsCache = data || [];

  select.innerHTML = `
    <option value="">اختر صنف</option>
    ${data.map(function (p) {
      return `
        <option value="${p.id}" data-price="${p.price}">
          ${p.name}
        </option>
      `;
    }).join('')}
  `;
};




// =========================
// 🗑️ DELETE PRODUCT
// =========================
window.deleteProduct = async function (id) {
  const { error } = await supabaseClient
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(error);
    alert("فشل الحذف");
    return;
  }

  await window.loadProducts();
};


// =========================
// ✏️ EDIT PRODUCT (Popup)
// =========================
window.editProduct = function (id) {
  const product = products.find(p => String(p.id) === String(id));
  if (!product) return;

  const newName = prompt('عدّل اسم المنتج', product.name);
  if (newName === null) return;

  const newPrice = prompt('عدّل سعر المنتج', product.price);
  if (newPrice === null) return;

  product.name = newName.trim() || product.name;
  product.price = Number(newPrice || product.price);

  saveProducts();
  renderProductSelect();
  renderProductList();
}


// =========================
// 💾 STORAGE (LOCAL)
// =========================
function saveProducts() {
  localStorage.setItem('products_catalog', JSON.stringify(products));
}

window.loadProducts = async function () {
  if (!window.currentProfile?.id) {
    return;
  }

  const url =
    `${window.SUPABASE_URL}/rest/v1/products?select=*&profile_id=eq.${window.currentProfile.id}&order=created_at.desc`;

  const response = await fetch(url, {
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${getSavedAccessToken()}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("LOAD PRODUCTS ERROR", data);
    return;
  }

  window.productsCache = data || [];

  if (typeof loadProductsDropdown === 'function') {
    loadProductsDropdown();
  }

  products = data || [];

  if (typeof renderProductList === 'function') {
    renderProductList();
  }

  if (typeof renderProductSelect === 'function') {
    renderProductSelect();
  }

  if (typeof renderPOSGrid === 'function') {
    renderPOSGrid();
  }
};




// =========================
// 🧹 CLEAR ALL
// =========================
window.clearProducts = function () {
  if (!confirm('متأكد من حذف كل المنتجات؟')) return;

  products = [];

  window.saveProducts();
  renderProductSelect();
  renderProductList();
}
// =========================
// 🔄 REALTIME PRODUCTS
// =========================
window.subscribeToProducts = function () {
  supabaseClient
    .channel('products-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'products'
      },
      (payload) => {
        console.log("Products changed 🔄", payload);
        window.loadProducts(); // تحديث تلقائي
      }
    )
    .subscribe();
};

 window.renderPOSGrid = function () { 
  const grid = document.getElementById('posGrid');

  if (!grid) return; // مهم جداً

  if (!products.length) {
    grid.innerHTML = 'لا توجد منتجات';
    return;
  }

  grid.innerHTML = products.map(p => `
    <div onclick="addFromPOS('${p.id}')"
      style="
        padding:15px;
        border-radius:10px;
        background:#16a34a;
        color:#fff;
        text-align:center;
        cursor:pointer;
      ">
      
      <div>${p.name}</div>
      <div style="font-size:12px; opacity:0.7;">
        ${formatNumber(p.price)}
      </div>

    </div>
  `).join('');
    };
   window.addFromPOS = function (id) {
  const product = products.find(p => String(p.id) === String(id));
  if (!product) return;

  items.push(createItem({
    name: product.name,
    price: product.price,
    qty: 1,
    discount: 0
  }));

  renderItems();
  renderSummary();
   };

    function renderProductSelect() {
      const suggestion = document.getElementById('productSuggestions');
      if (suggestion) {
        suggestion.innerHTML = products.map((p) => `<option value="${escapeHtml(p.name)}"></option>`).join('');
      }
    }
       window.applyProductSuggestion = function() {
  const name = (document.getElementById('quickItemName').value || '').trim();
  const product = products.find(p => p.name === name);

  if (product) {
    document.getElementById('quickItemPrice').value = product.price;
    }
   };
    window.applyProductSuggestion = function (){
  const name = (document.getElementById('quickItemName').value || '').trim();
  const product = products.find(p => p.name === name);

  if (product) {
    document.getElementById('quickItemPrice').value = product.price;
    }
   };