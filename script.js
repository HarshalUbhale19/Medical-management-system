const medicineForm = document.getElementById('medicineForm');
const medicineTableBody = document.querySelector('#medicineTable tbody');

// Sample initial data (optional)
const medicines = [
  { name: 'Paracetamol', quantity: 100, price: 12.5 },
  { name: 'Ibuprofen', quantity: 50, price: 20.0 },
  { name: 'Vitamin C', quantity: 75, price: 15.0 },
];

// Function to render the table rows
function renderTable() {
  medicineTableBody.innerHTML = ''; // Clear table

  medicines.forEach((med, index) => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${med.name}</td>
      <td>${med.quantity}</td>
      <td>₹${med.price.toFixed(2)}</td>
    `;

    medicineTableBody.appendChild(row);
  });
}

// Add new medicine on form submit
medicineForm.addEventListener('submit', function(event) {
  event.preventDefault();

  const name = medicineForm.name.value.trim();
  const quantity = parseInt(medicineForm.quantity.value);
  const price = parseFloat(medicineForm.price.value);

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

  medicines.push({ name, quantity, price });
  renderTable();

  medicineForm.reset();
});

renderTable();
