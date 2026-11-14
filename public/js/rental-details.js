document.addEventListener('DOMContentLoaded', function () {
  // Success/Error Modal Functions
  function showSuccessModal(title, message) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    modal.innerHTML = `
      <div style="
        background: white;
        border-radius: 12px;
        padding: 30px;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      ">
        <div style="font-size: 50px; color: #28a745; margin-bottom: 15px;">
          <i class="fas fa-check-circle"></i>
        </div>
        <h2 style="color: #333; margin-bottom: 10px; font-size: 24px;">${title}</h2>
        <p style="color: #666; margin-bottom: 0; font-size: 15px; line-height: 1.6;">${message}</p>
      </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
  }

  function showErrorModal(title, message) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    modal.innerHTML = `
      <div style="
        background: white;
        border-radius: 12px;
        padding: 30px;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      ">
        <div style="font-size: 50px; color: #dc3545; margin-bottom: 15px;">
          <i class="fas fa-exclamation-circle"></i>
        </div>
        <h2 style="color: #333; margin-bottom: 10px; font-size: 24px;">${title}</h2>
        <p style="color: #666; margin-bottom: 0; font-size: 15px; line-height: 1.6;">${message}</p>
      </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
  }

  const container = document.querySelector('.rental-container');
  const equipmentId = container.dataset.equipmentId;
  const dailyRate = parseFloat(container.dataset.dailyRate);
  const weeklyRate = parseFloat(container.dataset.weeklyRate || 0);
  const monthlyRate = parseFloat(container.dataset.monthlyRate || 0);
  const qtyAvailable = parseInt(container.dataset.qtyAvailable);
  const userId = container.dataset.userId;
  const equipmentName = container.dataset.equipmentName;
  const equipmentImage = container.dataset.equipmentImage;

  // Rate type selection
  let selectedRateType = 'daily'; // Default to daily

  // Get dynamic service areas from data attribute
  const serviceAreasData = JSON.parse(container.dataset.serviceAreas || '[]');
  const allowedPostalCodes = serviceAreasData
    .map(area => area.postalCode.replace(/[^a-z0-9]/gi, '').toUpperCase());

  // Initialize rate type selection based on available rates
  function initializeRateType() {
    if (dailyRate > 0) {
      selectedRateType = 'daily';
    } else if (weeklyRate > 0) {
      selectedRateType = 'weekly';
    } else if (monthlyRate > 0) {
      selectedRateType = 'monthly';
    }
    updateRateTypeUI();
  }

  // Update UI based on selected rate type
  function updateRateTypeUI() {
    // Update pricing option selection
    document.querySelectorAll('.rd-pricing-option').forEach(option => {
      option.classList.remove('selected');
    });
    document.getElementById(selectedRateType + 'Option').classList.add('selected');

    // Update duration labels
    const durationLabel = document.getElementById('durationLabel');
    const durationSuffix = document.getElementById('durationSuffix');
    const rentalDaysInput = document.getElementById('rentalDays');

    if (selectedRateType === 'weekly') {
      durationLabel.textContent = 'Number of weeks';
      durationSuffix.textContent = 'Week(s)';
      rentalDaysInput.min = 1;
      rentalDaysInput.value = Math.max(1, Math.ceil(parseInt(rentalDaysInput.value) / 7));
    } else if (selectedRateType === 'monthly') {
      durationLabel.textContent = 'Number of months';
      durationSuffix.textContent = 'Month(s)';
      rentalDaysInput.min = 1;
      rentalDaysInput.value = Math.max(1, Math.ceil(parseInt(rentalDaysInput.value) / 30));
    } else {
      durationLabel.textContent = 'Number of days';
      durationSuffix.textContent = 'Day(s)';
      rentalDaysInput.min = 1;
    }
  }

  // Helper function to calculate price based on selected rate type
  function calculatePrice(units, quantity) {
    let total = 0;
    let rate = 0;
    let periodUnits = units;
    let periodLabel = '';

    if (selectedRateType === 'weekly') {
      rate = weeklyRate > 0 ? weeklyRate : (dailyRate > 0 ? dailyRate * 7 * 0.9 : 0);
      total = units * quantity * rate;
      periodLabel = 'week';
    } else if (selectedRateType === 'monthly') {
      rate = monthlyRate > 0 ? monthlyRate : (weeklyRate > 0 ? weeklyRate * 4 * 0.9 : (dailyRate > 0 ? dailyRate * 30 * 0.8 : 0));
      total = units * quantity * rate;
      periodLabel = 'month';
    } else {
      // Daily rate
      rate = dailyRate;
      total = units * quantity * rate;
      periodLabel = 'day';
    }

    return { total, rate, periodUnits, periodLabel };
  }

  const rentalDaysInput = document.getElementById('rentalDays');
  const rentalQtyInput = document.getElementById('rentalQty');
  const startDateInput = document.getElementById('startDate');
  const postalCodeSelect = document.getElementById('postalCode');
  const postalCodeError = document.getElementById('postalCodeError');
  const decreaseBtn = document.getElementById('decreaseQty');
  const increaseBtn = document.getElementById('increaseQty');
  const completeBtn = document.getElementById('completeOrderBtn');

  // Set min date to today
  const today = new Date().toISOString().split('T')[0];
  startDateInput.min = today;
  startDateInput.value = today;

  function validatePostalCode() {
    const val = postalCodeSelect.value.trim();
    if (!val) {
      postalCodeError.textContent = 'Please select a delivery area';
      postalCodeError.style.display = 'block';
      return false;
    }
    postalCodeError.textContent = '';
    postalCodeError.style.display = 'none';
    return true;
  }

  function updatePricing() {
    const units = parseInt(rentalDaysInput.value) || 1;
    const qty = parseInt(rentalQtyInput.value) || 1;
    
    const { total, rate, periodUnits, periodLabel } = calculatePrice(units, qty);
    
    // Check if any rate is available
    if (rate <= 0) {
      document.getElementById('summaryDays').textContent = units + ' ' + periodLabel + (units !== 1 ? 's' : '');
      document.getElementById('summaryQty').textContent = qty;
      document.getElementById('equipmentCost').textContent = '0.00';
      document.getElementById('totalPrice').textContent = '0.00';
      return;
    }
    
    document.getElementById('summaryDays').textContent = periodUnits + ' ' + periodLabel + (periodUnits !== 1 ? 's' : '');
    document.getElementById('summaryQty').textContent = qty;
    document.getElementById('equipmentCost').textContent = total.toFixed(2);
    document.getElementById('totalPrice').textContent = total.toFixed(2);
  }

  // Initialize rate type selection
  initializeRateType();

  // Add event listeners for rate type selection
  document.querySelectorAll('.rd-pricing-option').forEach(option => {
    option.addEventListener('click', function() {
      const rateType = this.dataset.rateType;
      const rate = rateType === 'daily' ? dailyRate : (rateType === 'weekly' ? weeklyRate : monthlyRate);
      
      // Only allow selection if rate is available
      if (rate > 0) {
        selectedRateType = rateType;
        updateRateTypeUI();
        updatePricing();
      }
    });
  });

  postalCodeSelect.addEventListener('change', validatePostalCode);

  decreaseBtn.addEventListener('click', function () {
    const val = parseInt(rentalQtyInput.value);
    if (val > 1) { rentalQtyInput.value = val - 1; updatePricing(); }
  });

  increaseBtn.addEventListener('click', function () {
    const val = parseInt(rentalQtyInput.value);
    if (val < qtyAvailable) { rentalQtyInput.value = val + 1; updatePricing(); }
  });

  rentalDaysInput.addEventListener('input', updatePricing);
  rentalQtyInput.addEventListener('input', updatePricing);

  completeBtn.addEventListener('click', async function (e) {
    e.preventDefault();
    console.log('Complete Order button clicked');
    
    // Check if any rate is available
    const { rate } = calculatePrice(1, 1);
    if (rate <= 0) {
      showErrorModal('Pricing Error', 'This equipment is not available for rental at this time. Please contact us for pricing information.');
      return;
    }
    
    if (!validatePostalCode()) {
      console.log('Postal code validation failed');
      return;
    }
    if (!document.getElementById('rentalForm').checkValidity()) {
      alert('Please fill in all required fields');
      return;
    }

    const units = parseInt(rentalDaysInput.value);
    const quantity = parseInt(rentalQtyInput.value);
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(startDate);
    
    // Calculate actual days based on rate type
    let actualDays = units;
    if (selectedRateType === 'weekly') {
      actualDays = units * 7;
    } else if (selectedRateType === 'monthly') {
      actualDays = units * 30; // Using 30 days per month for simplicity
    }
    
    endDate.setDate(endDate.getDate() + actualDays);
    const { total: totalAmount } = calculatePrice(units, quantity);

    console.log('Order data being prepared:', { units, actualDays, quantity, startDate, totalAmount, selectedRateType });

    const orderData = {
      equipmentId,
      equipmentName,
      quantity,
      dailyRate,
      weeklyRate,
      monthlyRate,
      rateType: selectedRateType,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days: actualDays,
      subtotal: totalAmount,
      totalAmount,
      postalCode: postalCodeSelect.value.toString().replace(/[^a-z0-9]/gi, '').toUpperCase(),
      equipmentImage
    };

    console.log('Final order data:', orderData);

    try {
      completeBtn.disabled = true;
      completeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

      // Save to localStorage if user is not logged in
      if (!userId) {
        console.log('User not logged in, saving to cart (localStorage)');
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart.push(orderData);
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Trigger cart update event for header
        window.dispatchEvent(new Event('cartUpdated'));
        
        showSuccessModal('Item Added!', 'Item saved to cart. Redirecting...');
        setTimeout(() => window.location.href = '/cart', 2000);
      } else {
        // If logged in, add to server
        console.log('User logged in, sending to server');
        const response = await fetch('/api/orders/add-to-cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });

        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response result:', result);

        if (result.success) {
          // Trigger cart update event for header
          window.dispatchEvent(new Event('cartUpdated'));
          
          showSuccessModal('Success!', 'Item added to cart successfully. Redirecting to your cart...');
          setTimeout(() => window.location.href = '/cart', 2000);
        } else {
          console.error('Server error:', result.message);
          showErrorModal('Error', result.message || 'Error adding to cart');
          completeBtn.disabled = false;
          completeBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> COMPLETE ORDER';
        }
      }
    } catch (err) {
      console.error('Error:', err);
      console.error('Error message:', err.message);
      showErrorModal('Error', 'Failed to complete order. Please try again.');
      completeBtn.disabled = false;
      completeBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> COMPLETE ORDER';
    }
  });

  updatePricing();
});
