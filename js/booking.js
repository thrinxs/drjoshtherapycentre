// ═══════════════════════════════════════════════════════════
// DR. JOSH THERAPY CENTRE — Booking Page JS
// ═══════════════════════════════════════════════════════════
//
// SETUP: Replace EMAILJS values below with your actual keys
// from emailjs.com (same account as library page).
// Create a second template for booking confirmations with:
// {{to_name}}, {{to_email}}, {{therapy_type}}, {{plan_name}},
// {{sessions}}, {{amount}}, {{reference}}, {{preferred_date}},
// {{preferred_time}}, {{session_mode}}, {{message}}
//
// ═══════════════════════════════════════════════════════════

const EMAILJS_SERVICE_ID   = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID  = 'YOUR_BOOKING_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY   = 'YOUR_PUBLIC_KEY';
const PAYSTACK_PUBLIC_KEY  = 'pk_live_46a4a694b209775fd38d0ba0b817a670bba7aeec';

// Plan data
const planData = {
  'basic-text':     { name: 'Basic Text',    price: 5000,    period: '30 mins · WhatsApp text',          group: 'online' },
  'standard-call':  { name: 'Standard Call', price: 15000,   period: '30 mins · WhatsApp call',          group: 'online' },
  'lite':           { name: 'Lite',          price: 35000,   period: '1 hour · In-person',               group: 'physical' },
  'basic':          { name: 'Basic',         price: 100000,  period: 'Up to 3 hours · In-person',        group: 'physical' },
  'standard':       { name: 'Standard',      price: 650000,  period: '8 sessions/month · In-person',     group: 'physical' },
  'premium':        { name: 'Premium',       price: 3000000, period: 'Until resolved · In-person',       group: 'physical' },
};

let selectedPlan = null;
let currentReference = null;
let currentBookingData = null;

// ── SELECT PLAN (from pill clicks) ──
function selectPlan(planKey) {
  selectedPlan = planKey;

  // Update pill UI
  document.querySelectorAll('.plan-pill').forEach(p => p.classList.remove('selected'));
  document.querySelector(`[data-plan="${planKey}"]`).classList.add('selected');

  // Sync dropdown
  document.getElementById('plan-select').value = planKey;

  updateOrderSummary();
  document.getElementById('booking-form-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── UPDATE ORDER SUMMARY ──
function updateOrderSummary() {
  const plan     = planData[selectedPlan || document.getElementById('plan-select').value];
  const qty      = parseInt(document.getElementById('qty-select').value) || 1;
  const therapy  = document.getElementById('therapy-select').value;
  const mode     = document.getElementById('mode-select').value;
  const date     = document.getElementById('preferred-date').value;
  const time     = document.getElementById('preferred-time').value;

  const summaryEl = document.getElementById('order-summary-content');
  const totalEl   = document.getElementById('order-total');
  const payBtn    = document.getElementById('pay-btn');

  if (!plan) {
    summaryEl.innerHTML = '<p class="os-empty">Select a plan above to see your summary.</p>';
    totalEl.innerHTML   = '<span class="os-empty" style="font-size:14px;">—</span>';
    payBtn.disabled     = true;
    return;
  }

  const total = plan.price * qty;
  const formattedTotal = '₦' + total.toLocaleString('en-NG');

  summaryEl.innerHTML = `
    <div class="os-row">
      <span class="os-label">Plan</span>
      <span class="os-value">${plan.name}</span>
    </div>
    <div class="os-row">
      <span class="os-label">Duration</span>
      <span class="os-value">${plan.period}</span>
    </div>
    <div class="os-row">
      <span class="os-label">Quantity</span>
      <span class="os-value">${qty}</span>
    </div>
    ${therapy ? `<div class="os-row"><span class="os-label">Therapy Type</span><span class="os-value">${therapy}</span></div>` : ''}
    ${mode ? `<div class="os-row"><span class="os-label">Mode</span><span class="os-value">${mode}</span></div>` : ''}
    ${date ? `<div class="os-row"><span class="os-label">Preferred Date</span><span class="os-value">${date}</span></div>` : ''}
    ${time ? `<div class="os-row"><span class="os-label">Preferred Time</span><span class="os-value">${time}</span></div>` : ''}
  `;

  totalEl.innerHTML = `${formattedTotal}`;
  payBtn.disabled   = false;

  // Sync pill if changed via dropdown
  selectedPlan = document.getElementById('plan-select').value;
  document.querySelectorAll('.plan-pill').forEach(p => {
    p.classList.toggle('selected', p.dataset.plan === selectedPlan);
  });
}

// ── PROCEED TO PAYMENT ──
function proceedToPayment() {
  const name     = document.getElementById('client-name').value.trim();
  const email    = document.getElementById('client-email').value.trim();
  const phone    = document.getElementById('client-phone').value.trim();
  const location = document.getElementById('client-location').value.trim();
  const therapy  = document.getElementById('therapy-select').value;
  const planKey  = document.getElementById('plan-select').value;
  const qty      = parseInt(document.getElementById('qty-select').value) || 1;
  const date     = document.getElementById('preferred-date').value;
  const time     = document.getElementById('preferred-time').value;
  const mode     = document.getElementById('mode-select').value;
  const message  = document.getElementById('client-message').value.trim();

  if (!name || !email || !phone || !location || !planKey || !therapy) {
    alert('Please fill in all required fields and select a therapy type and plan.');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('Please enter a valid email address.');
    return;
  }

  const plan  = planData[planKey];
  const total = plan.price * qty;

  currentReference   = 'DJTC-BK-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
  currentBookingData = { name, email, phone, location, therapy, plan, qty, total, date, time, mode, message };

  const handler = PaystackPop.setup({
    key:      PAYSTACK_PUBLIC_KEY,
    email:    email,
    amount:   total * 100,
    currency: 'NGN',
    ref:      currentReference,
    metadata: {
      custom_fields: [
        { display_name: 'Customer Name',   variable_name: 'customer_name',   value: name },
        { display_name: 'Phone Number',    variable_name: 'phone_number',    value: phone },
        { display_name: 'Location',        variable_name: 'location',        value: location },
        { display_name: 'Therapy Type',    variable_name: 'therapy_type',    value: therapy },
        { display_name: 'Session Plan',    variable_name: 'session_plan',    value: plan.name },
        { display_name: 'Sessions/Qty',    variable_name: 'sessions',        value: String(qty) },
        { display_name: 'Preferred Date',  variable_name: 'preferred_date',  value: date || 'Not specified' },
        { display_name: 'Preferred Time',  variable_name: 'preferred_time',  value: time || 'Not specified' },
        { display_name: 'Session Mode',    variable_name: 'session_mode',    value: mode || 'Not specified' },
      ]
    },
    callback: function(response) {
      currentReference = response.reference;
      onBookingSuccess();
    },
    onClose: function() {}
  });

  handler.openIframe();
}

// ── ON BOOKING SUCCESS ──
function onBookingSuccess() {
  const d = currentBookingData;

  document.getElementById('s-name').textContent     = d.name;
  document.getElementById('s-therapy').textContent  = d.therapy;
  document.getElementById('s-plan').textContent     = d.plan.name;
  document.getElementById('s-sessions').textContent = d.qty;
  document.getElementById('s-amount').textContent   = '₦' + d.total.toLocaleString('en-NG');
  document.getElementById('s-mode').textContent     = d.mode || 'To be confirmed';
  document.getElementById('s-date').textContent     = d.date || 'To be confirmed';
  document.getElementById('s-ref').textContent      = currentReference;
  document.getElementById('s-email').textContent    = d.email;

  document.getElementById('successModal').classList.add('open');
  document.body.style.overflow = 'hidden';

  sendBookingEmail();
}

// ── SEND CONFIRMATION EMAIL ──
function sendBookingEmail() {
  const statusEl = document.getElementById('emailStatus');
  const d        = currentBookingData;

  statusEl.textContent = '📧 Sending confirmation to ' + d.email + '...';
  statusEl.className   = 'email-status';

  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    to_name:        d.name,
    to_email:       d.email,
    phone:          d.phone,
    location:       d.location,
    therapy_type:   d.therapy,
    plan_name:      d.plan.name,
    sessions:       String(d.qty),
    amount:         '₦' + d.total.toLocaleString('en-NG'),
    reference:      currentReference,
    preferred_date: d.date || 'Not specified',
    preferred_time: d.time || 'Not specified',
    session_mode:   d.mode || 'Not specified',
    message:        d.message || 'No additional message provided.',
  }, EMAILJS_PUBLIC_KEY)
  .then(() => {
    statusEl.textContent = '✅ Confirmation sent to ' + d.email;
    statusEl.className   = 'email-status';
  })
  .catch(err => {
    statusEl.textContent = '⚠️ Email failed. Please contact us on WhatsApp with your reference number.';
    statusEl.className   = 'email-status error';
    console.error('EmailJS error:', err);
  });
}

// ── DOWNLOAD RECEIPT ──
function downloadBookingReceipt() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a5' });
  const d   = currentBookingData;

  const blue      = [107, 163, 224];
  const charcoal  = [46, 46, 46];
  const grey      = [107, 114, 128];
  const lightGrey = [241, 245, 249];

  doc.setFillColor(...blue);
  doc.rect(0, 0, 148, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Dr. Josh Therapy Centre', 14, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Port Harcourt, Nigeria  |  support@drjoshtherapycentre.com', 14, 23);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('BOOKING RECEIPT', 14, 34);

  let y = 52;

  doc.setTextColor(...charcoal);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Dear ' + d.name + ',', 14, y);
  y += 7;
  doc.setFontSize(9.5);
  doc.setTextColor(...grey);
  const msg = doc.splitTextToSize(
    'Your therapy session has been booked and payment received. We will contact you within 24 hours to confirm your appointment details. Thank you for trusting Dr. Josh Therapy Centre.',
    120
  );
  doc.text(msg, 14, y);
  y += msg.length * 5 + 8;

  doc.setDrawColor(...blue);
  doc.setLineWidth(0.5);
  doc.line(14, y, 134, y);
  y += 8;

  doc.setTextColor(...charcoal);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('BOOKING DETAILS', 14, y);
  y += 8;

  const rows = [
    ['Client Name',     d.name],
    ['Email',           d.email],
    ['Phone',           d.phone],
    ['Location',        d.location],
    ['Therapy Type',    d.therapy],
    ['Session Plan',    d.plan.name],
    ['No. of Sessions', String(d.qty)],
    ['Session Mode',    d.mode || 'To be confirmed'],
    ['Preferred Date',  d.date || 'To be confirmed'],
    ['Preferred Time',  d.time || 'To be confirmed'],
    ['Amount Paid',     '₦' + d.total.toLocaleString('en-NG')],
    ['Reference No.',   currentReference],
    ['Booking Date',    new Date().toLocaleDateString('en-NG', { day:'numeric', month:'long', year:'numeric' })],
    ['Status',          'CONFIRMED ✓'],
  ];

  rows.forEach(([label, value], i) => {
    if (i % 2 === 0) {
      doc.setFillColor(...lightGrey);
      doc.rect(14, y - 4, 120, 8, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...grey);
    doc.text(label + ':', 16, y + 1);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...charcoal);
    const valText = doc.splitTextToSize(value, 70);
    doc.text(valText, 60, y + 1);
    y += 9;
  });

  y += 6;
  doc.setDrawColor(...blue);
  doc.line(14, y, 134, y);
  y += 8;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...grey);
  const note = doc.splitTextToSize(
    'We will reach out within 24 hours to confirm your session time. For urgent enquiries: WhatsApp +234 901 133 9978 or email support@drjoshtherapycentre.com',
    120
  );
  doc.text(note, 14, y);

  doc.setFillColor(...charcoal);
  doc.rect(0, 195, 148, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('© 2025 Dr. Josh Therapy Centre  |  www.drjoshtherapycentre.com', 14, 204);

  doc.save('DJTC-Booking-' + currentReference + '.pdf');
}

// ── CLOSE SUCCESS MODAL ──
function closeSuccessModal() {
  document.getElementById('successModal').classList.remove('open');
  document.body.style.overflow = '';
}

// ── WHATSAPP FALLBACK ──
function bookViaWhatsApp() {
  const name    = document.getElementById('client-name').value.trim();
  const phone   = document.getElementById('client-phone').value.trim();
  const email   = document.getElementById('client-email').value.trim();
  const therapy = document.getElementById('therapy-select').value;
  const planKey = document.getElementById('plan-select').value;
  const qty     = document.getElementById('qty-select').value;
  const date    = document.getElementById('preferred-date').value;
  const time    = document.getElementById('preferred-time').value;
  const mode    = document.getElementById('mode-select').value;
  const message = document.getElementById('client-message').value.trim();
  const plan    = planData[planKey];

  const msg = encodeURIComponent(
    `Hello Dr. Josh Therapy Centre 👋\n\nI'd like to book a therapy session.\n\n` +
    `Name: ${name || 'N/A'}\nPhone: ${phone || 'N/A'}\nEmail: ${email || 'N/A'}\n` +
    `Therapy Type: ${therapy || 'N/A'}\nPlan: ${plan ? plan.name : 'N/A'}\n` +
    `Sessions: ${qty}\nMode: ${mode || 'N/A'}\nPreferred Date: ${date || 'N/A'}\n` +
    `Preferred Time: ${time || 'N/A'}\n\n` +
    `Message: ${message || 'N/A'}\n\nPlease confirm my booking. Thank you!`
  );
  window.open(`https://wa.me/2349011339978?text=${msg}`, '_blank');
}

// ── FAQ ACCORDION ──
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item   = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// ── LIVE ORDER SUMMARY UPDATE ──
['plan-select','qty-select','therapy-select','mode-select',
 'preferred-date','preferred-time'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', updateOrderSummary);
});

// ── CLICK OUTSIDE MODAL TO CLOSE ──
document.getElementById('successModal').addEventListener('click', function(e) {
  if (e.target === this) closeSuccessModal();
});