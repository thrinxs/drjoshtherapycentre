document.addEventListener('DOMContentLoaded', function () {

    // ── STATS COUNTER ANIMATION ──
    const statsBar = document.querySelector('.stats-bar');
    let animated = false;
  
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !animated) {
        animated = true;
        document.querySelectorAll('.stat-num').forEach(el => {
          const target = parseInt(el.dataset.target);
          const suffix = el.dataset.suffix || '';
          let count = 0;
          const step = Math.ceil(target / 50);
          const timer = setInterval(() => {
            count = Math.min(count + step, target);
            el.innerHTML = count + (suffix ? `<span>${suffix}</span>` : '');
            if (count >= target) clearInterval(timer);
          }, 30);
        });
      }
    }, { threshold: 0.5 });
  
    if (statsBar) observer.observe(statsBar);
  
    // ── FAQ ACCORDION ──
    document.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });
  
    // ── BOOKING TOTAL CALCULATOR ──
    const planSelect = document.getElementById('plan-select');
    const qtySelect = document.getElementById('qty-select');
    const totalDisplay = document.getElementById('total-display');
  
    function updateTotal() {
      const price = parseInt(planSelect.value) || 0;
      const qty = parseInt(qtySelect.value) || 1;
      if (!price) { totalDisplay.textContent = '₦—'; return; }
      totalDisplay.textContent = '₦' + (price * qty).toLocaleString('en-NG');
    }
  
    if (planSelect && qtySelect) {
      planSelect.addEventListener('change', updateTotal);
      qtySelect.addEventListener('change', updateTotal);
    }
  
    // ── BOOKING FORM SUBMIT (WhatsApp) ──
    window.handleBooking = function () {
      const name = document.getElementById('client-name').value.trim();
      const phone = document.getElementById('client-phone').value.trim();
      const email = document.getElementById('client-email').value.trim();
      const planText = planSelect.options[planSelect.selectedIndex]?.text || '';
      const qty = qtySelect.value;
      const total = totalDisplay.textContent;
  
      if (!name || !phone || !planSelect.value) {
        alert('Please fill in your name, phone number, and select a plan.');
        return;
      }
  
      const msg = encodeURIComponent(
        `Hello Dr. Josh Therapy Centre 👋\n\n` +
        `I'd like to book a therapy session.\n\n` +
        `Name: ${name}\n` +
        `Phone: ${phone}\n` +
        `Email: ${email || 'N/A'}\n` +
        `Plan: ${planText}\n` +
        `Quantity: ${qty}\n` +
        `Total: ${total}\n\n` +
        `Please confirm my booking. Thank you!`
      );
      window.open(`https://wa.me/2349011339978?text=${msg}`, '_blank');
    };
  
    // ── PLAN CARD BUTTON → SCROLL TO BOOKING ──
    document.querySelectorAll('.choose-plan').forEach(btn => {
      btn.addEventListener('click', function () {
        const planValue = this.dataset.plan;
        if (planSelect) {
          planSelect.value = planValue;
          updateTotal();
        }
        document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  
  });