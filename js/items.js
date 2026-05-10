    window.updateQuickLineTotal = function () {
      const price = Number(document.getElementById('quickItemPrice').value || 0);
      const qty = Number(document.getElementById('quickItemQty').value || 0);
      const discount = Number(document.getElementById('quickItemDiscount').value || 0);
      document.getElementById('quickLineTotal').textContent = formatNumber((price * qty) - discount);
    };



    window.clearQuickInputs = function () {
      document.getElementById('quickItemName').value = '';
      document.getElementById('quickItemPrice').value = '';
      document.getElementById('quickItemQty').value = 1;
      document.getElementById('quickItemDiscount').value = 0;
      updateQuickLineTotal();
      document.getElementById('quickItemName').focus();
    };
window.updateTotals = function () {

  let subtotal = 0;

  const items = window.invoiceItems || [];

  items.forEach(item => {
    subtotal += item.price * item.qty;
  });

  // 🔥 القيم من inputs
  const discount = parseFloat(document.getElementById('discountInput')?.value) || 0;
  const paid = parseFloat(document.getElementById('paidAmount')?.value) || 0;

  const total = subtotal - discount;
  const remaining = total - paid;

  // 🔥 تحديث UI
  document.getElementById('subtotal').textContent = subtotal.toFixed(2);

  const discountEl = document.getElementById('discountTotal');
  if (discountEl) discountEl.textContent = discount.toFixed(2);

  const totalEl = document.getElementById('grandTotal');
  if (totalEl) totalEl.textContent = total.toFixed(2);

  const paidEl = document.getElementById('paidDisplay');
  if (paidEl) paidEl.textContent = paid.toFixed(2);

  const remainingEl = document.getElementById('remainingAmount');
  if (remainingEl) remainingEl.textContent = remaining.toFixed(2);
};
    
    window.addQuickItem = function () {
      const name = (document.getElementById('quickItemName').value || '').trim();
      const price = Number(document.getElementById('quickItemPrice').value || 0);
      const qty = Number(document.getElementById('quickItemQty').value || 1);
      const discount = Number(document.getElementById('quickItemDiscount').value || 0);
      if (!name) return alert('اكتب اسم الصنف');
      items.push(createItem({ name, price, qty, discount }));
      renderItems();
      renderSummary();
      clearQuickInputs();
      updateTotals();
    };


    window.removeItem = function (id) {
      items = items.filter((item) => String(item.id) !== String(id));
      renderItems();
      renderSummary();
      updateTotals();
    };

    window.updateItem = function (id, field, value) {
      items = items.map((item) => {
        if (String(item.id) !== String(id)) return item;
        const next = { ...item };
        next[field] = Math.max(0, Number(value || 0));
        return next;
      });
      renderItems();
      renderSummary();
    };