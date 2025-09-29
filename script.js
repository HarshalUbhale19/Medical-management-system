const medicineForm = document.getElementById('medicineForm');
const medicineTableBody = document.querySelector('#medicineTable tbody');
const searchInput = document.getElementById('searchInput');
const csvInput = document.getElementById('csvInput');
const importBtn = document.getElementById('importBtn');
const cancelEditBtn = document.getElementById('cancelEdit');
const expiryInput = document.getElementById('expiry');

let medicines = [];
let editIndex = -1;
let currentSort = { key: null, direction: 'asc' };

// Set minimum expiry date to today
const today = new Date().toISOString().split('T')[0];
expiryInput.setAttribute('min', today);

// Load from localStorage if available
function loadMedicines() {
  const data = localStorage.getItem('medicines');
  medicines = data ? JSON.parse(data) : [
    { name: 'Paracetamol', quantity: 100, price: 12.5, expiry: '2025-12-31' },
    { name: 'Ibuprofen', quantity: 50, price: 20.0, expiry: '2024-08-15' },
    { name: 'Vitamin C', quantity: 75, price: 15.0, expiry: '2023-11-20' },
  ];
}
function saveMedicines() {
  localStorage.setItem('medicines', JSON.stringify(medicines));
}

function compare(a, b, key, direction) {
  if (key === 'name') {
    return direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
  } else if (key === 'expiry') {
    return direction === 'asc' ? new Date(a.expiry) - new Date(b.expiry) : new Date(b.expiry) - new Date(a.expiry);
  } else {
    // quantity or price - numeric sort
    return direction === 'asc' ? a[key] - b[key] : b[key] - a[key];
  }
}

function sortMedicines(key) {
  if (currentSort.key === key) {
    // Toggle direction
    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    currentSort.key = key;
    currentSort.direction = 'asc';
  }
  medicines.sort((a, b) => compare(a, b, key, currentSort.direction));
}

function isExpired(expiryDate) {
  const now = new Date();
  const exp = new Date(expiryDate);
  return exp < now;
}

function renderTable() {
  const filterText = searchInput.value.trim().toLowerCase();

  medicineTableBody.innerHTML = '';

  medicines.forEach((med, index) => {
    if (!med.name.toLowerCase().includes(filterText)) return;

    const row = document.createElement('tr');

    // Low stock class
    const lowStockClass = med.quantity < 10 ? 'low-stock' : '';
    row.classList.add(lowStockClass);

    // Expired date display
    const expiredClass = isExpired(med.expiry) ? 'expired' : '';

    row.innerHTML = `
      <td data-label="Medicine Name">${med.name}</td>
      <td data-label="Quantity">${med.quantity}</td>
      <td data-label="Price">₹${med.price.toFixed(2)}</td>
      <td data-label="Expiry Date" class="${expiredClass}">${med.expiry}</td>
      <td data-label="Actions">
        <button class="edit-btn" data-index="${index}">Edit</button>
        <button class="delete-btn" data-index="${index}">Delete</button>
      </td>
    `;

    medicineTableBody.appendChild(row);
  });
}

function resetForm() {
  medicineForm.reset();
  expiryInput.setAttribute('min', today);
  editIndex = -1;
  cancelEditBtn.classList.add('hidden');
  medicineForm.querySelector('button[type="submit"]').textContent = 'Save Medicine';
}

medicineForm.addEventListener('submit', function(event) {
  event.preventDefault();

  const name = medicineForm.name.value.trim();
  const quantity = parseInt(medicineForm.quantity.value);
  const price = parseFloat(medicineForm.price.value);
  const expiry = medicineForm.expiry.value;

  // Basic validation
  if (!name) {
    alert('Please enter the medicine name.');
    return;
  }
  if (isNaN(quantity) || quantity < 1) {
    alert('Quantity must be at least 1.');
    return;
  }
  if (isNaN(price) || price <= 0) {
    alert('Price must be a positive number.');
    return;
  }
  if (!expiry) {
    alert('Please select an expiry date.');
    return;
  }
  if (new Date(expiry) < new Date(today)) {
    alert('Expiry date cannot be in the past.');
    return;
  }

  if (editIndex === -1) {
    // Add new medicine
    medicines.push({ name, quantity, price, expiry });
  } else {
    // Update existing medicine
    medicines[editIndex] = { name, quantity, price, expiry };
  }

  saveMedicines();
  renderTable();
  resetForm();
});

// Handle Edit and Delete clicks
medicineTableBody.addEventListener('click', (event) => {
  if (event.target.classList.contains('edit-btn')) {
    const idx = parseInt(event.target.dataset.index);
    const med = medicines[idx];
    medicineForm.name.value = med.name;
    medicineForm.quantity.value = med.quantity;
    medicineForm.price.value = med.price;
    medicineForm.expiry.value = med.expiry;

    editIndex = idx;
    cancelEditBtn.classList.remove('hidden');
    medicineForm.querySelector('button[type="submit"]').textContent = 'Update Medicine';
  }
  if (event.target.classList.contains('delete-btn')) {
    const idx = parseInt(event.target.dataset.index);
    if (confirm(`Are you sure you want to delete "${medicines[idx].name}"?`)) {
      medicines.splice(idx, 1);
      saveMedicines();
      renderTable();
      if (editIndex === idx) resetForm();
    }
  }
});

// Cancel edit button
cancelEditBtn.addEventListener('click', () => {
  resetForm();
});

// Search/filter input
searchInput.addEventListener('input', renderTable);

// Sorting headers
document.querySelectorAll('#medicineTable thead th[data-sort]').forEach(th => {
  th.style.cursor = 'pointer';
  th.addEventListener('click', () => {
    sortMedicines(th.dataset.sort);
    renderTable();
  });
});

// CSV import handler
importBtn.addEventListener('click', () => {
  const file = csvInput.files[0];
  if (!file) {
    alert('Please select a CSV file first.');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    parseCSV(text);
  };
  reader.readAsText(file);
});

function parseCSV(text) {
  // Expecting CSV with header: name,quantity,price,expiry
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  if (!headers.includes('name') || !headers.includes('quantity') || !headers.includes('price') || !headers.includes('expiry')) {
    alert('CSV must have headers: name, quantity, price, expiry');
    return;
  }
  const nameIdx = headers.indexOf('name');
  const qtyIdx = headers.indexOf('quantity');
  const priceIdx = headers.indexOf('price');
  const expiryIdx = headers.indexOf('expiry');

  let importedCount = 0;
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    if (row.length < headers.length) continue;

    const name = row[nameIdx].trim();
    const quantity = parseInt(row[qtyIdx]);
    const price = parseFloat(row[priceIdx]);
    const expiry = row[expiryIdx].trim();

    if (!name || isNaN(quantity) || quantity < 1 || isNaN(price) || price <= 0 || !expiry) {
      continue; // skip invalid
    }

    medicines.push({ name, quantity, price, expiry });
    importedCount++;
  }
  if (importedCount > 0) {
    alert(`${importedCount} medicines imported successfully.`);
    saveMedicines();
    renderTable();
    csvInput.value = ''; // Reset file input
  } else {
    alert('No valid medicine entries found in CSV.');
  }
}

// Initial load
loadMedicines();
renderTable();
