// ═══════════════════════════════════════════════════════════
// DR. JOSH THERAPY CENTRE — Library / Book Store JS
// ═══════════════════════════════════════════════════════════
//
// SETUP REQUIRED (one-time):
//
// 1. EMAILJS — Sign up free at https://emailjs.com
//    - Connect your Gmail or other email account
//    - Create an email template with these variables:
//      {{to_name}}, {{to_email}}, {{book_title}},
//      {{amount}}, {{reference}}, {{download_link}}, {{location}}
//    - Replace EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID,
//      and EMAILJS_PUBLIC_KEY below with your actual values
//
// 2. BOOK FILES — Upload your PDFs to Google Drive
//    - Right-click each file → Share → Anyone with link → Viewer
//    - Copy the file ID from the URL and use this format:
//      https://drive.google.com/uc?export=download&id=YOUR_FILE_ID
//    - Replace the bookDownloadLinks below with your actual links
//
// ═══════════════════════════════════════════════════════════

const EMAILJS_SERVICE_ID  = 'service_j9e9k1j';   // e.g. 'service_abc123'
const EMAILJS_TEMPLATE_ID = 'template_jfrlryo';  // e.g. 'template_xyz789'
const EMAILJS_PUBLIC_KEY  = 'PsNuXHLtsHGlCGq9R';   // from EmailJS dashboard
const PAYSTACK_PUBLIC_KEY = 'pk_live_46a4a694b209775fd38d0ba0b817a670bba7aeec';

// ── UPDATE THESE WITH YOUR ACTUAL GOOGLE DRIVE DOWNLOAD LINKS ──
const bookDownloadLinks = {
  'How to Completely Heal from Heartbreak': 'https://drive.google.com/file/d/1k1sl4NoUTdtZd06AtXssqoyXcly8Nef4/view?usp=sharing',
  'Loving Again After the Lie':             'https://drive.google.com/file/d/1ww0grZCgyYchk2rDEIk_NtaaJ_U-HD2r/view?usp=sharing',
  'The Turning Point':                      'https://drive.google.com/file/d/1JO0XXC5vKkm05gvaT-ydqL2Jriy_ACjB/view?usp=sharing',
  'What Are You Bringing To The Table?':    'https://drive.google.com/file/d/1vHlVi_on0cmVy0rKGxyIPrxwm1sXCGD-/view?usp=sharing',
};

// Current purchase state
let currentBook = null;
let currentBuyer = null;
let currentReference = null;

// ── OPEN PURCHASE MODAL ──
function openPurchaseModal(bookKey) {
  currentBook = books[bookKey];
  const modal = document.getElementById('purchaseModal');
  document.getElementById('modal-book-title').textContent = currentBook.title;
  document.getElementById('modal-book-price').textContent = '₦' + currentBook.price.toLocaleString('en-NG');
  document.getElementById('modal-book-thumb').src = currentBook.cover;
  document.getElementById('modal-book-thumb').alt = currentBook.title;

  // Clear form
  ['buyer-name','buyer-email','buyer-phone','buyer-location'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('emailStatus').textContent = '';

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

// ── CLOSE PURCHASE MODAL ──
function closePurchaseModal() {
  document.getElementById('purchaseModal').classList.remove('open');
  document.body.style.overflow = '';
}

// ── CLOSE SUCCESS MODAL ──
function closeSuccessModal() {
  document.getElementById('successModal').classList.remove('open');
  document.body.style.overflow = '';
}

// ── PROCEED TO PAYSTACK ──
function proceedToPaystack() {
  const name     = document.getElementById('buyer-name').value.trim();
  const email    = document.getElementById('buyer-email').value.trim();
  const phone    = document.getElementById('buyer-phone').value.trim();
  const location = document.getElementById('buyer-location').value.trim();

  if (!name || !email || !phone || !location) {
    alert('Please fill in all fields before proceeding.');
    return;
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('Please enter a valid email address.');
    return;
  }

  currentBuyer = { name, email, phone, location };
  currentReference = 'DJTC-' + Date.now() + '-' + Math.floor(Math.random() * 10000);

  closePurchaseModal();

  const handler = PaystackPop.setup({
    key:       PAYSTACK_PUBLIC_KEY,
    email:     email,
    amount:    currentBook.price * 100,
    currency:  'NGN',
    ref:       currentReference,
    metadata: {
      custom_fields: [
        { display_name: 'Customer Name',  variable_name: 'customer_name',  value: name },
        { display_name: 'Phone Number',   variable_name: 'phone_number',   value: phone },
        { display_name: 'Location',       variable_name: 'location',       value: location },
        { display_name: 'Book Purchased', variable_name: 'book_purchased', value: currentBook.title },
      ]
    },
    callback: function(response) {
      onPaymentSuccess(response);
    },
    onClose: function() {
      // Payment window closed without completing
    }
  });

  handler.openIframe();
}

// ── ON PAYMENT SUCCESS ──
function onPaymentSuccess(response) {
  currentReference = response.reference;

  // Populate success modal
  document.getElementById('success-buyer-name').textContent  = currentBuyer.name;
  document.getElementById('success-book-title').textContent  = currentBook.title;
  document.getElementById('success-amount').textContent      = '₦' + currentBook.price.toLocaleString('en-NG');
  document.getElementById('success-reference').textContent   = currentReference;
  document.getElementById('success-email').textContent       = currentBuyer.email;

  // Show success modal
  document.getElementById('successModal').classList.add('open');
  document.body.style.overflow = 'hidden';

  // Send email automatically
  sendBookEmail();
}

// ── SEND BOOK EMAIL VIA EMAILJS ──
function sendBookEmail() {
  const statusEl = document.getElementById('emailStatus');
  statusEl.textContent = '📧 Sending your book to ' + currentBuyer.email + '...';
  statusEl.className = 'email-status';

  const downloadLink = bookDownloadLinks[currentBook.title] || '#';

  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    to_name:       currentBuyer.name,
    to_email:      currentBuyer.email,
    phone:         currentBuyer.phone,
    location:      currentBuyer.location,
    book_title:    currentBook.title,
    amount:        '₦' + currentBook.price.toLocaleString('en-NG'),
    reference:     currentReference,
    download_link: downloadLink,
  }, EMAILJS_PUBLIC_KEY)
  .then(function() {
    statusEl.textContent = '✅ Book sent successfully to ' + currentBuyer.email;
    statusEl.className = 'email-status';
  })
  .catch(function(error) {
    statusEl.textContent = '⚠️ Email delivery failed. Please contact us on WhatsApp for your book.';
    statusEl.className = 'email-status error';
    console.error('EmailJS error:', error);
  });
}

// ── DOWNLOAD RECEIPT (PDF) ──
function downloadReceipt() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a5' });

  const blue = [107, 163, 224];
  const charcoal = [46, 46, 46];
  const grey = [107, 114, 128];
  const lightGrey = [241, 245, 249];

  // Header background
  doc.setFillColor(...blue);
  doc.rect(0, 0, 148, 40, 'F');

  // Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Dr. Josh Therapy Centre', 14, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Port Harcourt, Nigeria  |  support@drjoshtherapycentre.com', 14, 23);

  // Receipt title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT RECEIPT', 14, 34);

  // Content area
  let y = 52;

  // Thank you message
  doc.setTextColor(...charcoal);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Dear ' + currentBuyer.name + ',', 14, y);
  y += 7;
  doc.setFontSize(9.5);
  doc.setTextColor(...grey);
  const thankYou = doc.splitTextToSize(
    'Thank you for your purchase. Your payment has been received and your book will be delivered to your email address shortly. We are grateful for your trust in Dr. Josh Therapy Centre.',
    120
  );
  doc.text(thankYou, 14, y);
  y += thankYou.length * 5 + 8;

  // Divider
  doc.setDrawColor(...blue);
  doc.setLineWidth(0.5);
  doc.line(14, y, 134, y);
  y += 8;

  // Order details
  doc.setTextColor(...charcoal);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ORDER DETAILS', 14, y);
  y += 8;

  const rows = [
    ['Book Title',      currentBook.title],
    ['Customer Name',   currentBuyer.name],
    ['Email Address',   currentBuyer.email],
    ['Phone Number',    currentBuyer.phone],
    ['Location',        currentBuyer.location],
    ['Amount Paid',     '₦' + currentBook.price.toLocaleString('en-NG')],
    ['Payment Ref',     currentReference],
    ['Date',            new Date().toLocaleDateString('en-NG', { day:'numeric', month:'long', year:'numeric' })],
    ['Status',          'SUCCESSFUL ✓'],
  ];

  rows.forEach(([label, value], i) => {
    if (i % 2 === 0) {
      doc.setFillColor(...lightGrey);
      doc.rect(14, y - 4, 120, 8, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...grey);
    doc.text(label + ':', 16, y + 1);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...charcoal);
    const valText = doc.splitTextToSize(value, 72);
    doc.text(valText, 62, y + 1);
    y += 9;
  });

  y += 6;
  doc.setDrawColor(...blue);
  doc.line(14, y, 134, y);
  y += 8;

  // Footer note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...grey);
  const note = doc.splitTextToSize(
    'If you have not received your book within 24 hours, please contact us on WhatsApp: +234 901 133 9978 or email: support@drjoshtherapycentre.com',
    120
  );
  doc.text(note, 14, y);
  y += note.length * 5 + 8;

  // Bottom bar
  doc.setFillColor(...charcoal);
  doc.rect(0, 195, 148, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('© 2025 Dr. Josh Therapy Centre  |  www.drjoshtherapycentre.com', 14, 204);

  doc.save('DJTC-Receipt-' + currentReference + '.pdf');
}

// ── CLICK OUTSIDE MODAL TO CLOSE ──
document.getElementById('purchaseModal').addEventListener('click', function(e) {
  if (e.target === this) closePurchaseModal();
});
document.getElementById('successModal').addEventListener('click', function(e) {
  if (e.target === this) closeSuccessModal();
});