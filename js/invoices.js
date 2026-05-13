// =========================
// 🧾 RENDER ITEMS
// =========================
window.renderItems = function () {
  const tbody = document.getElementById('itemsEditTableBody');
  const items = window.invoiceItems || [];
  const inputRow = document.getElementById('inputRow');

  if (!tbody) {
    return;
  }

  tbody.innerHTML = '';

  if (inputRow) {
    tbody.appendChild(inputRow);
  }

  items.forEach(function (item, index) {
    const total = Number(item.price || 0) * Number(item.qty || 0);

    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${item.name}</td>

      <td>
        <input
          type="number"
            inputmode="decimal"
  min="0"
  step="0.01"
          value="${item.qty}"
          onchange="updateItem(${index}, 'qty', this.value)"
          style="width: 85%;"
        />
        <span style="vertical-align: middle;">KG</span>
      </td>

      <td>
        <input
          type="number"
            inputmode="decimal"
  min="0"
  step="0.01"
          value="${item.price}"
          onchange="updateItem(${index}, 'price', this.value)"
        />
      </td>

      <td>
        <span style="width: 100%; border: 1px solid #4f5052; border-radius: 12px; padding: 12px; font-size: 15px;">
          ${total.toFixed(2)}
        </span>
      </td>

      <td>
        <button
          type="button"
          style="background: #ffffff; color: #e70a0a; border: 1px solid #e70a0a; padding: 12px; border-radius: 12px; cursor: pointer; margin-bottom:0px;"
          onclick="deleteItem(${index})"
        >
          ❌
        </button>
      </td>
    `;

    tbody.appendChild(row);
  });

  const mobileCards = document.getElementById('mobileItemsCards');

  if (mobileCards) {
    mobileCards.innerHTML = items.map(function (item, index) {
      const total = Number(item.price || 0) * Number(item.qty || 0);

      return `
        <div class="mobile-item-card">
          <div class="mobile-item-title">${item.name}</div>

          <div class="mobile-item-grid">
            <div>
              <label>الكمية</label>
              <input
  type="number"
  inputmode="decimal"
  min="0"
  step="0.01"
  value="${item.qty}"
  onchange="updateItem(${index}, 'qty', this.value)"
              >
            </div>

            <div>
              <label>السعر</label>
  type="number"
  inputmode="decimal"
  min="0"
  step="0.01"
  value="${item.price}"
  onchange="updateItem(${index}, 'price', this.value)"
              >
            </div>
          </div>

          <div class="mobile-item-total">
            المجموع: ${total.toFixed(2)} دينار
          </div>

          <div class="mobile-item-actions">
            <button type="button" class="btn btn-danger" onclick="deleteItem(${index})">
              حذف
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
};


window.onItemSelect = function (select) {
  console.log("ITEM SELECT CALLED");

  const selected = select.options[select.selectedIndex];

  const name = selected.text;
  const price = parseFloat(selected.getAttribute('data-price')) || 0;

  if (!name || name === "اختر صنف") return;

  window.invoiceItems = window.invoiceItems || [];

  window.invoiceItems.push({
    name,
    price,
    qty: 1
  });

  renderItems();
  updateTotals();

  select.value = '';
};
window.changeQty = function (index, delta) {

  const item = window.invoiceItems[index];

  item.qty += delta;

  if (item.qty < 1) item.qty = 1;

  renderItems();
  updateTotals();
};

window.updateItem = function (index, field, value) {

  const items = window.invoiceItems;

  items[index][field] = parseFloat(value) || 0;

  renderItems();
  updateTotals();
};
window.deleteItem = function (index) {
  window.invoiceItems.splice(index, 1);
  renderItems();
  updateTotals();
};

window.generateInvoiceNumber = async function () {

    console.trace("GENERATE INVOICE NUMBER CALLED");

  const invoiceInput = document.getElementById('invoiceNo');

  if (!invoiceInput) {
    return;
  }  
  invoiceInput.value = 'جاري الترقيم...';


  if (!window.currentProfile?.id) {
    invoiceInput.value = 'INV-00001';
    return;
  }

  const url =
    `${window.SUPABASE_URL}/rest/v1/invoices?select=invoice_no&profile_id=eq.${window.currentProfile.id}&order=created_at.desc&limit=1`;

  const response = await fetch(url, {
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${getSavedAccessToken()}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("GENERATE INVOICE NUMBER ERROR", data);
    invoiceInput.value = 'INV-00001';
    return;
  }

  const lastInvoiceNo = data[0]?.invoice_no || 'INV-00000';

  const lastNumber = Number(
    String(lastInvoiceNo).replace('INV-', '')
  );

  const nextNumber = lastNumber + 1;

  invoiceInput.value = `INV-${String(nextNumber).padStart(5, '0')}`;
};




window.updateInputRowTotal = function () {
  const price = parseFloat(document.getElementById('itemPrice').value) || 0;
  const qty = parseFloat(document.getElementById('itemQty').value) || 0;

  document.getElementById('inputRowTotal').textContent = (price * qty).toFixed(2);
};

window.addItemFromRow = function () {

  const select = document.getElementById('itemSelect');
  const name = select.options[select.selectedIndex].text;

  const price = parseFloat(document.getElementById('itemPrice').value) || 0;
  const qty = parseFloat(document.getElementById('itemQty').value) || 1;

  if (!name || name === "اختر صنف") {
    alert("اختر صنف");
    return;
  }

  window.invoiceItems = window.invoiceItems || [];

  window.invoiceItems.push({ name, price, qty });

  renderItems();
  updateTotals();

  // reset
  select.value = '';
  document.getElementById('itemPrice').value = '';
  document.getElementById('itemQty').value = 1;
  document.getElementById('inputRowTotal').textContent = '0.00';
};

// =========================
// 📊 RENDER SUMMARY
// =========================
window.renderSummary = function () {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.price)), 0);
  const discountTotal = items.reduce((sum, item) => sum + Number(item.discount || 0), 0);
  const grandTotal = items.reduce((sum, item) => sum + lineTotal(item), 0);

  document.getElementById('subtotal').textContent = formatNumber(subtotal);
  document.getElementById('discountTotal').textContent = formatNumber(discountTotal);
  document.getElementById('grandTotal').textContent = formatNumber(grandTotal);
const invoiceNumberPreview = document.getElementById('invoiceNumberPreview');
const invoiceNoInput = document.getElementById('invoiceNo');

if (invoiceNumberPreview && invoiceNoInput) {
  invoiceNumberPreview.textContent = invoiceNoInput.value || '-';
}

  if (typeof QRCode !== "undefined") {
    QRCode.toCanvas(
      document.getElementById('qrCanvas'),
      JSON.stringify({
        invoiceNo: document.getElementById('invoiceNo').value,
        client: document.getElementById('clientName').value,
        total: grandTotal
      }),
      { width: 140 }
    );
  }
};

window.enableEnterNavigation = function () {

  document.addEventListener('keydown', function (e) {

    if (e.key !== 'Enter') return;

    const active = document.activeElement;

    // 🔥 إذا داخل صف الإدخال → أضف المنتج
    if (
      active.id === 'itemSelect' ||
      active.id === 'itemQty' ||
      active.id === 'itemPrice'
    ) {
      e.preventDefault();

      const select = document.getElementById('itemSelect');
      const selected = select.options[select.selectedIndex];

      if (!selected || selected.value === '') return;

      // 🔥 نفس منطق الإضافة
      const name = selected.text;
      const price = parseFloat(selected.getAttribute('data-price')) || 0;
      const qty = parseFloat(document.getElementById('itemQty').value) || 1;

      window.invoiceItems = window.invoiceItems || [];

      // دمج المنتج إذا مكرر
      const existing = window.invoiceItems.find(i => i.name === name);

      if (existing) {
        existing.qty += qty;
      } else {
        window.invoiceItems.push({ name, price, qty });
      }

      renderItems();
      updateTotals();

      // reset
      select.value = '';
      document.getElementById('itemQty').value = 1;
      document.getElementById('itemPrice').value = '';

      select.focus();

      return;
    }

    // 🔁 التنقل الطبيعي
    const inputs = Array.from(document.querySelectorAll('input, select'));
    const index = inputs.indexOf(active);

    if (index > -1) {
      e.preventDefault();

      const next = inputs[index + 1];
      if (next) {
        next.focus();
        next.select?.();
      }
    }
new Audio('click.mp3').play();
  });

};





// =========================
// ☁️ SAVE INVOICE
// =========================
window.saveInvoiceToSupabase = async function (e) {
  if (e) {
    e.preventDefault();
  }

  const invoiceNo = document.getElementById('invoiceNo')?.value?.trim();
  const invoiceDate = document.getElementById('invoiceDate')?.value;
  const clientName = document.getElementById('clientName')?.value?.trim();
  const clientPhone = document.getElementById('clientPhone')?.value?.trim() || '';
  const paymentMethod = document.getElementById('paymentMethod')?.value || 'cash';
  const notes = document.getElementById('notes')?.value?.trim() || '';

  const discount = parseFloat(document.getElementById('discountInput')?.value) || 0;
  const paid = parseFloat(document.getElementById('paidAmount')?.value) || 0;

  const items = window.invoiceItems || [];

  if (!invoiceNo) {
    alert('رقم الفاتورة غير موجود');
    return;
  }

  if (!invoiceDate) {
    alert('أدخل تاريخ الفاتورة');
    return;
  }

  if (!clientName) {
    alert('أدخل اسم العميل');
    return;
  }

  if (!items.length) {
    alert('أضف عنصر واحد على الأقل');
    return;
  }

  const subtotal = items.reduce(function (sum, item) {
    return sum + ((Number(item.price) || 0) * (Number(item.qty) || 0));
  }, 0);

  const total = subtotal - discount;
  const remaining = total - paid;

  const payload = {
    invoice_no: invoiceNo,
    client_name: clientName,
    total: total,
    data: {
      invoiceNo: invoiceNo,
      date: invoiceDate,
      invoiceDate: invoiceDate,
      clientName: clientName,
      clientPhone: clientPhone,
      payment: paymentMethod,
      paymentMethod: paymentMethod,
      notes: notes,
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      total: total.toFixed(2),
      paid: paid.toFixed(2),
      remaining: remaining.toFixed(2),
      items: items
    }
  };

  const savedInvoice = await dbSaveInvoice(payload);

  if (!savedInvoice) {
    return;
  }

  alert('تم حفظ الفاتورة بنجاح');

  if (typeof loadSavedInvoices === 'function') {
    await loadSavedInvoices();
  }

  if (typeof renderDashboard === 'function') {
    await renderDashboard();
  }

  if (typeof generateInvoiceNumber === 'function') {
    await generateInvoiceNumber();
  }

  window.invoiceItems = [];

  if (typeof renderItems === 'function') {
    renderItems();
  }

  if (typeof updateTotals === 'function') {
    updateTotals();
  }
};


window.setTodayAsDefaultDate = function () {
  const dateInput = document.getElementById('invoiceDate');

  if (!dateInput) {
    return;
  }

  if (!dateInput.value) {
    const today = new Date().toISOString().slice(0, 10);
    dateInput.value = today;
  }
};




// =========================
// 📥 DATABASE
// =========================
window.dbGetInvoices = async function () {
  if (!window.currentProfile?.id) {
    return [];
  }

  const url =
    `${window.SUPABASE_URL}/rest/v1/invoices?select=*&profile_id=eq.${window.currentProfile.id}&order=created_at.desc`;

  const response = await fetch(url, {
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${getSavedAccessToken()}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("GET INVOICES ERROR", data);
    throw data;
  }

  return data || [];
};



window.dbDeleteInvoice = async function (id) {
  if (!window.currentProfile?.user_id) {
    alert("لم يتم تحميل بيانات المستخدم");
    return;
  }

  const url =
    `${window.SUPABASE_URL}/rest/v1/invoices?id=eq.${id}&user_id=eq.${window.currentProfile.user_id}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${getSavedAccessToken()}`
    }
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("DELETE INVOICE ERROR", error);
    throw error;
  }
};



window.dbGetInvoiceById = async function (id) {
  if (!window.currentProfile?.user_id) {
    return null;
  }

  const url =
    `${window.SUPABASE_URL}/rest/v1/invoices?select=*&id=eq.${id}&user_id=eq.${window.currentProfile.user_id}`;

  const response = await fetch(url, {
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("GET INVOICE ERROR", data);
    throw data;
  }

  return data[0] || null;
};


window.getSavedInvoices = async function () {
  try {
    return await window.dbGetInvoices();
  } catch (e) {
    console.error(e);
    return [];
  }
};

window.savedInvoicesCache = [];

window.loadSavedInvoices = async function () {
  const container = document.getElementById('savedInvoicesContainer');

  if (!container) {
    return;
  }

  container.innerHTML = 'جاري تحميل الفواتير...';

  const invoices = await getSavedInvoices();

  window.savedInvoicesCache = invoices || [];

  renderSavedInvoices();
};
window.renderSavedInvoices = function () {
  const container = document.getElementById('savedInvoicesContainer');

  if (!container) {
    return;
  }

  const searchValue =
    document.getElementById('searchSavedInvoices')?.value?.trim().toLowerCase() || '';

  const invoices = window.savedInvoicesCache || [];

  const filtered = invoices.filter(function (invoice) {
    const invoiceNo = String(invoice.invoice_no || '').toLowerCase();
    const clientName = String(invoice.client_name || '').toLowerCase();

    return invoiceNo.includes(searchValue) || clientName.includes(searchValue);
  });

  if (!filtered.length) {
    container.innerHTML = 'لا توجد فواتير محفوظة';
    return;
  }

  container.innerHTML = filtered.map(function (invoice) {
    const invoiceData = invoice.data || {};

    return `
      <div class="saved-invoice-card">
        <div><strong>رقم الفاتورة:</strong> ${invoice.invoice_no || '-'}</div>
        <div><strong>العميل:</strong> ${invoice.client_name || '-'}</div>
        <div><strong>التاريخ:</strong> ${invoiceData.date || '-'}</div>
        <div><strong>الإجمالي:</strong> ${invoice.total || '0.00'}</div>

      <div style="display:flex; gap:8px; margin-top:10px;">
  <button type="button" class="btn btn-primary" onclick="previewSavedInvoice('${invoice.id}')">
    عرض
  </button>

  <button type="button" class="btn btn-success" onclick="sendInvoiceLinkWhatsApp('${invoice.id}')">
    واتساب
  </button>

  <button type="button" class="btn btn-danger" onclick="deleteSavedInvoice('${invoice.id}')">
    حذف
  </button>
     </div>
   <div id="saved-preview-${invoice.id}" class="saved-inline-preview"></div>

      </div>
    `;
  }).join('');
};



window.printSavedInvoice = function (id) {
  const invoice = (window.savedInvoicesCache || []).find(function (item) {
    return String(item.id) === String(id);
  });

  if (!invoice) {
    alert('لم يتم العثور على الفاتورة');
    return;
  }

  const invoiceData = invoice.data || {};

  localStorage.setItem('printData', JSON.stringify({
    logo: window.currentProfile?.logo_url || 'logo.png',
    store: window.currentProfile?.store_name || '',
    address: window.currentProfile?.store_address || '',
    invoiceNo: invoice.invoice_no || '',
    date: invoiceData.date || '',
    client: invoice.client_name || '',
    payment: invoiceData.payment || '',
    subtotal: invoiceData.subtotal || '0.00',
    discount: invoiceData.discount || '0.00',
    total: invoiceData.total || invoice.total || '0.00',
    paid: invoiceData.paid || '0.00',
    remaining: invoiceData.remaining || '0.00',
    items: invoiceData.items || []
  }));

  window.open('print.html', '_blank');
};


window.closeSavedInvoicePreview = function (id) {
  const preview = document.getElementById('saved-preview-' + id);

  if (preview) {
    preview.style.display = 'none';
    preview.innerHTML = '';
    return;
  }

  const oldPreview = document.getElementById('savedInvoicePreview');

  if (oldPreview) {
    oldPreview.style.display = 'none';
    oldPreview.innerHTML = '';
  }
};



window.previewSavedInvoice = function (id) {
const preview = document.getElementById(`saved-preview-${id}`);

  if (!preview) {
    return;
  }

  const invoice = (window.savedInvoicesCache || []).find(function (item) {
    return String(item.id) === String(id);
  });

  if (!invoice) {
    alert('لم يتم العثور على الفاتورة');
    return;
  }

  const invoiceData = invoice.data || {};
  const items = invoiceData.items || [];

  let itemsRows = '';

  items.forEach(function (item) {
    const qty = Number(item.qty || 0);
    const price = Number(item.price || 0);
    const lineTotal = qty * price;

    itemsRows += '<tr>';
    itemsRows += '<td>' + (item.name || '-') + '</td>';
    itemsRows += '<td>' + qty + ' KG</td>';
    itemsRows += '<td>' + price.toFixed(2) + ' دينار</td>';
    itemsRows += '<td>' + lineTotal.toFixed(2) + ' دينار</td>';
    itemsRows += '</tr>';
  });

  const logo = window.currentProfile?.logo_url || 'logo.png';
  const storeName = window.currentProfile?.store_name || '';
  const storeAddress = window.currentProfile?.store_address || '';

  preview.style.display = 'block';

  preview.innerHTML =
    '<div class="preview-header">' +
      '<img src="' + logo + '" class="preview-logo">' +
      '<div>' +
        '<h3>' + storeName + '</h3>' +
        '<div class="preview-address">' + storeAddress + '</div>' +
      '</div>' +
    '</div>' +

    '<div class="preview-meta">' +
      '<div><strong>رقم الفاتورة:</strong> ' + (invoice.invoice_no || '-') + '</div>' +
      '<div><strong>التاريخ:</strong> ' + (invoiceData.date || '-') + '</div>' +
      '<div><strong>العميل:</strong> ' + (invoice.client_name || '-') + '</div>' +
      '<div><strong>الدفع:</strong> ' + (invoiceData.payment || '-') + '</div>' +
    '</div>' +

    '<table class="preview-table">' +
      '<thead>' +
        '<tr>' +
          '<th>الصنف</th>' +
          '<th>الكمية</th>' +
          '<th>السعر</th>' +
          '<th>المجموع</th>' +
        '</tr>' +
      '</thead>' +
      '<tbody>' +
        itemsRows +
      '</tbody>' +
    '</table>' +

    '<div class="preview-totals">' +
      '<div><span>المجموع</span><strong>' + (invoiceData.subtotal || '0.00') + ' دينار</strong></div>' +
      '<div><span>الخصم</span><strong>' + (invoiceData.discount || '0.00') + ' دينار</strong></div>' +
      '<div><span>الإجمالي</span><strong>' + (invoiceData.total || invoice.total || '0.00') + ' دينار</strong></div>' +
      '<div><span>المدفوع</span><strong>' + (invoiceData.paid || '0.00') + ' دينار</strong></div>' +
      '<div><span>الباقي</span><strong>' + (invoiceData.remaining || '0.00') + ' دينار</strong></div>' +
    '</div>' +

    '<div style="margin-top:12px;">' +
      '<button type="button" class="btn btn-primary" onclick="printSavedInvoice(\'' + invoice.id + '\')">طباعة</button> ' +
      '<button type="button" class="btn btn-secondary" onclick="closeSavedInvoicePreview(\'' + invoice.id + '\')">إغلاق</button>' +
    '</div>';
};




window.getNextInvoiceNumber = async function () {
  if (!window.currentProfile?.id) {
    return 1;
  }

  const url =
    `${window.SUPABASE_URL}/rest/v1/invoices?select=invoice_no&profile_id=eq.${window.currentProfile.id}&order=invoice_no.desc&limit=1`;

  const response = await fetch(url, {
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("GET NEXT INVOICE ERROR", data);
    return 1;
  }

  const lastInvoiceNo = Number(data[0]?.invoice_no || 0);

  return lastInvoiceNo + 1;
};

window.setNextInvoiceNumber = async function () {
  const invoiceInput = document.getElementById('invoiceNo');

  if (!invoiceInput) {
    return;
  }

  const nextNumber = await getNextInvoiceNumber();

  invoiceInput.value = nextNumber;
};





// =========================
// 📄 PDF
// =========================
window.generatePDF = async function () {

  const element = document.getElementById('invoiceArea');

  const canvas = await html2canvas(element, {
    scale: 2, // جودة عالية
    useCORS: true
  });

  const imgData = canvas.toDataURL('image/png');

  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF('p', 'mm', 'a4');

  const imgWidth = 210;
  const pageHeight = 295;

  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;

  let position = 0;

  // الصفحة الأولى
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // صفحات إضافية إذا طويل
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save('invoice.pdf');
};


window.downloadPDF = function () {
  try {
    const data = getInvoiceData();
    const doc = new window.jspdf.jsPDF();

    doc.setFontSize(14);
    doc.text(data.storeName || 'Invoice', 14, 15);

    doc.setFontSize(10);
    doc.text('Invoice No: ' + (data.invoiceNo || '-'), 14, 25);
    doc.text('Client: ' + (data.clientName || '-'), 14, 32);
    doc.text('Date: ' + (data.invoiceDate || '-'), 14, 39);

    const body = (data.items || []).map((item, i) => [
      i + 1,
      item.name,
      item.qty,
      item.price,
      item.discount,
      (item.qty * item.price) - item.discount
    ]);

    doc.autoTable({
      startY: 45,
      head: [['#', 'Item', 'Qty', 'Price', 'Discount', 'Total']],
      body
    });

    const grandTotal = (data.items || []).reduce((s, i) => s + ((i.qty * i.price) - i.discount), 0);

    doc.text('Total: ' + grandTotal.toFixed(2), 14, doc.lastAutoTable.finalY + 10);

    if (typeof QRCode !== "undefined") {
      const canvas = document.createElement('canvas');

      QRCode.toCanvas(canvas, data.invoiceNo || 'invoice', { width: 100 }, function () {
        try {
          doc.addImage(canvas.toDataURL(), 'PNG', 150, 20, 40, 40);
        } catch (e) {}

        doc.save((data.invoiceNo || 'invoice') + '.pdf');
      });
    } else {
      doc.save((data.invoiceNo || 'invoice') + '.pdf');
    }

  } catch (e) {
    console.error(e);
    alert("في خطأ بتوليد PDF");
  }
};





// =========================
// 📊 GET INVOICE DATA
// =========================
window.getInvoiceData = function () {
  return {
    invoiceNo: document.getElementById('invoiceNo')?.value,
    invoiceDate: document.getElementById('invoiceDate')?.value,
    clientName: document.getElementById('clientName')?.value,
    clientPhone: document.getElementById('clientPhone')?.value,
    notes: document.getElementById('notes')?.value,
    storeName: document.getElementById('storeName')?.value,
    storePhone: document.getElementById('storePhone')?.value,
    storeAddress: document.getElementById('storeAddress')?.value,
    storeSocial: document.getElementById('storeSocial')?.value,
    items
  };
};


// =========================
// 🖨️ PRINT
// =========================
window.printInvoice = function () {
  const invoiceDate = document.getElementById('invoiceDate')?.value;
  const clientName = document.getElementById('clientName')?.value?.trim();

  if (!invoiceDate) {
    alert('أدخل تاريخ الفاتورة قبل الطباعة');
    return;
  }

  if (!clientName) {
    alert('أدخل اسم العميل قبل الطباعة');
    return;
  }

  const data = {
logo: window.currentProfile?.logo_url || 'logo.png',
    store: window.currentProfile?.store_name || '',
    address: window.currentProfile?.store_address || '',
    invoiceNo: document.getElementById('invoiceNo')?.value || '',
    date: invoiceDate,
    client: clientName,
    payment: document.getElementById('paymentMethod')?.value || '',
    subtotal: document.getElementById('subtotal')?.textContent || '0.00',
    discount: document.getElementById('discountTotal')?.textContent || '0.00',
    total: document.getElementById('grandTotal')?.textContent || '0.00',
    paid: document.getElementById('paidDisplay')?.textContent || '0.00',
    remaining: document.getElementById('remainingAmount')?.textContent || '0.00',
    items: window.invoiceItems || []
  };

localStorage.setItem('printData', JSON.stringify(data));

const printWindow = window.open('print.html', '_blank');

if (printWindow) {
  printWindow.focus();
}

setTimeout(function () {
  if (typeof generateInvoiceNumber === 'function') {
    generateInvoiceNumber();
  }
}, 1000);

};


// =========================
// 💾 SAVE DRAFT (LOCAL)
// =========================
window.saveCurrentDraft = function () {
  localStorage.setItem('mobile_invoice_draft', JSON.stringify(getInvoiceData()));
  alert('تم حفظ الفاتورة الحالية');
};

window.saveAndPrintInvoice = async function () {
  console.log("SAVE PRINT CLICKED");

  const invoiceDate = document.getElementById('invoiceDate')?.value || '';
  const clientName = document.getElementById('clientName')?.value?.trim() || '';
  const invoiceNo = document.getElementById('invoiceNo')?.value || '';
  const items = window.invoiceItems || [];

  console.log("SAVE PRINT VALIDATION:", {
    invoiceDate,
    clientName,
    invoiceNo,
    itemsLength: items.length
  });

  if (!invoiceDate) {
    alert('أدخل تاريخ الفاتورة قبل الحفظ والطباعة');
    return;
  }

  if (!clientName) {
    alert('أدخل اسم العميل قبل الحفظ والطباعة');
    return;
  }

  if (!invoiceNo) {
    alert('رقم الفاتورة غير موجود');
    return;
  }

  if (!items.length) {
    alert('أضف صنف واحد على الأقل');
    return;
  }

  const printWindow = window.open('', '_blank');

  const payload = {
    invoice_no: invoiceNo,
    client_name: clientName,
    total: Number(document.getElementById('grandTotal')?.textContent || 0),
    data: {
      date: invoiceDate,
      payment: document.getElementById('paymentMethod')?.value || '',
      subtotal: document.getElementById('subtotal')?.textContent || '0.00',
      discount: document.getElementById('discountTotal')?.textContent || '0.00',
      total: document.getElementById('grandTotal')?.textContent || '0.00',
      paid: document.getElementById('paidDisplay')?.textContent || '0.00',
      remaining: document.getElementById('remainingAmount')?.textContent || '0.00',
      items: items
    }
  };

  const savedInvoice = await dbSaveInvoice(payload);

  if (!savedInvoice) {
    if (printWindow) printWindow.close();
    alert('فشل حفظ الفاتورة');
    return;
  }

  const printData = {
    logo: window.currentProfile?.logo_url || 'logo.png',
    store: window.currentProfile?.store_name || '',
    address: window.currentProfile?.store_address || '',
    invoiceNo: invoiceNo,
    date: invoiceDate,
    client: clientName,
    payment: document.getElementById('paymentMethod')?.value || '',
    subtotal: document.getElementById('subtotal')?.textContent || '0.00',
    discount: document.getElementById('discountTotal')?.textContent || '0.00',
    total: document.getElementById('grandTotal')?.textContent || '0.00',
    paid: document.getElementById('paidDisplay')?.textContent || '0.00',
    remaining: document.getElementById('remainingAmount')?.textContent || '0.00',
    items: items
  };

  localStorage.setItem('printData', JSON.stringify(printData));

  if (printWindow) {
    printWindow.location.href = 'print.html';
    printWindow.focus();
  } else {
    window.location.href = 'print.html';
  }

  if (typeof renderSavedInvoices === 'function') {
    await renderSavedInvoices();
  }

  if (typeof renderDashboard === 'function') {
    await renderDashboard();
  }

  if (typeof generateInvoiceNumber === 'function') {
    await generateInvoiceNumber();
  }
};



// =========================
// ☁️ SAVE TO DB
// =========================
window.dbSaveInvoice = async function (payload) {
  if (!window.currentProfile?.id || !window.currentProfile?.user_id) {
    alert("لم يتم تحميل بيانات المستخدم");
    return null;
  }

  const invoiceNo =
    document.getElementById('invoiceNo')?.value ||
    payload.invoice_no ||
    '';

  if (!invoiceNo) {
    alert("رقم الفاتورة غير موجود");
    return null;
  }

  const url = `${window.SUPABASE_URL}/rest/v1/invoices`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: window.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${getSavedAccessToken()}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
  body: JSON.stringify({
  profile_id: window.currentProfile.id,
  user_id: window.currentProfile.user_id,
  invoice_no: invoiceNo,
  client_name: payload.client_name,
  total: payload.total,
  data: payload.data,
  public_token: crypto.randomUUID()
  })

  });

  const result = await response.json();

  if (!response.ok) {
    console.error("SAVE INVOICE ERROR", result);
    alert("فشل حفظ الفاتورة");
    return null;
  }

  console.log("INVOICE SAVED", result);

  return result[0];
};




// =========================
// 📥 LOAD FROM DB
// =========================
window.loadInvoiceFromDB = function (data) {
  setValue('invoiceNo', data.invoiceNo);
  setValue('invoiceDate', data.invoiceDate);
  setValue('clientName', data.clientName);
  setValue('clientPhone', data.clientPhone);
  setValue('notes', data.notes);

  items = (data.items || []).map(createItem);

  renderItems();
  renderSummary();
  showTab('invoice');
};


// =========================
// 🗑️ DELETE
// =========================
window.deleteSavedInvoice = async function (id) {
  if (!confirm('هل أنت متأكد من حذف الفاتورة؟')) {
    return;
  }

  try {
    await dbDeleteInvoice(id);

    window.savedInvoicesCache = (window.savedInvoicesCache || []).filter(function (invoice) {
      return String(invoice.id) !== String(id);
    });

    renderSavedInvoices();

    if (typeof renderDashboard === 'function') {
      await renderDashboard();
    }

    const preview = document.getElementById('savedInvoicePreview');

    if (preview) {
      preview.style.display = 'none';
      preview.innerHTML = '';
    }

    alert('تم الحذف');

  } catch (error) {
    console.error("DELETE SAVED INVOICE ERROR", error);
    alert('فشل حذف الفاتورة');
  }
};




// =========================
// 🔗 SHARE LINKS
// =========================

window.generateInvoiceLink = function (inv) {
  const base = window.location.origin + window.location.pathname;
  return `${base}?id=${inv.id}`;
};

window.copyInvoiceLink = function (id) {
  navigator.clipboard.writeText(generateInvoiceLink({ id }));
  alert('تم نسخ رابط الفاتورة');
};

window.shareInvoiceLinkWhatsApp = function (id) {
  const url = generateInvoiceLink({ id });
  window.open('https://wa.me/?text=' + encodeURIComponent(url), '_blank');
};


// =========================
// 📋 RENDER SAVED INVOICES
// =========================
window.openSavedInvoice = function (id) {
  const invoice = (window.savedInvoicesCache || []).find(function (item) {
    return String(item.id) === String(id);
  });

  if (!invoice) {
    alert('لم يتم العثور على الفاتورة');
    return;
  }

  const invoiceData = invoice.data || {};

  localStorage.setItem('printData', JSON.stringify({
    logo: window.currentProfile?.logo_url || 'logo.png',
    store: window.currentProfile?.store_name || '',
    address: window.currentProfile?.store_address || '',
    invoiceNo: invoice.invoice_no || '',
    date: invoiceData.date || '',
    client: invoice.client_name || '',
    payment: invoiceData.payment || '',
    subtotal: invoiceData.subtotal || '0.00',
    discount: invoiceData.discount || '0.00',
    total: invoiceData.total || invoice.total || '0.00',
    paid: invoiceData.paid || '0.00',
    remaining: invoiceData.remaining || '0.00',
    items: invoiceData.items || []
  }));

  window.open('print.html', '_blank');
};








// =========================
// 📊 DASHBOARD
// =========================
window.renderDashboard = async function () {
  if (!window.currentProfile?.id) {
    console.log("DASHBOARD: no currentProfile");
    setText('dashboardCount', 0);
    setText('dashboardSales', 0);
    return;
  }

  const invoices = await getSavedInvoices();

  console.log("DASHBOARD INVOICES:", invoices);

  const total = invoices.reduce(function (sum, invoice) {
    return sum + Number(invoice.total || 0);
  }, 0);

  setText('dashboardCount', invoices.length);
  setText('dashboardSales', formatNumber(total));
};



// =========================
// 📤 WHATSAPP TEXT
// =========================
window.buildWhatsAppText = function (data) {
  const total = (data.items || []).reduce((sum, item) => sum + lineTotal(item), 0);

  let text = '';

  if (data.storeName) text += `*${data.storeName}*\n`;

  text += `فاتورة رقم: ${data.invoiceNo || '-'}\n`;
  text += `العميل: ${data.clientName || '-'}\n`;
  text += `التاريخ: ${data.invoiceDate || '-'}\n\n`;

  text += `العناصر:\n`;

  (data.items || []).forEach((item, index) => {
    text += `${index + 1}. ${item.name} | الكمية: ${item.qty} | السعر: ${formatNumber(item.price)} | المجموع: ${formatNumber(lineTotal(item))}\n`;
  });

  text += `\nالإجمالي: ${formatNumber(total)}\n`;

  if (data.notes) text += `ملاحظات: ${data.notes}`;

  return text;
}


// =========================
// 📤 SHARE WHATSAPP
// =========================
window.sendInvoiceLinkWhatsApp = function (id) {
  const invoice = (window.savedInvoicesCache || []).find(function (item) {
    return String(item.id) === String(id);
  });

  if (!invoice) {
    alert('لم يتم العثور على الفاتورة');
    return;
  }

  if (!invoice.public_token) {
    alert('هذه الفاتورة لا تحتوي على رابط عام. احفظ فاتورة جديدة أو حدّث الفاتورة القديمة.');
    return;
  }

  const invoiceLink =
    `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}print.html?token=${invoice.public_token}`;

  const message =
    `رابط الفاتورة: ${invoiceLink}`;

  const whatsappUrl =
    `https://wa.me/?text=${encodeURIComponent(message)}`;

const win = window.open(whatsappUrl, '_blank');

if (!win) {
  window.location.href = whatsappUrl;
}

};



// =========================
// 👁️ VIEW MODE
// =========================
window.enableViewMode = function () {
  document.querySelectorAll('.no-print').forEach(el => el.style.display = 'none');
  document.querySelectorAll('input, textarea, select').forEach(el => el.disabled = true);

  showTab('invoice');
};


// =========================
// 🌐 LOAD FROM URL
// =========================
window.loadInvoiceFromURL = async function () {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) return;

  try {
    const inv = await dbGetInvoiceById(id);
    if (inv?.data) {
      loadInvoiceFromDB(inv.data);
      enableViewMode();
    }
  } catch (e) {
    console.error(e);
  }
};


// =========================
// 🧰 HELPERS
// =========================
function setValue(id, value) {
  const el = document.getElementById(id);
  if (el && value !== undefined) el.value = value;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el && value !== undefined) el.textContent = value;
}






    

