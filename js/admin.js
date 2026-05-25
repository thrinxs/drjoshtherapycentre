// ============================================================
// Admin Dashboard — Dr. Josh Therapy Centre
// ============================================================

import { supabase } from './supabase.js';

// ─── State ───────────────────────────────────────────────
let currentUser = null;
let currentRole = null;
let editingPostId = null;
let quill = null;

// ─── DOM refs ────────────────────────────────────────────
const $ = id => document.getElementById(id);
const views   = ['loginView','dashboardView','editorView','usersView','securityView'];
const show    = id => views.forEach(v => $(v).style.display = v === id ? 'block' : 'none');

const SITE_URL = 'https://drjoshtherapycentre-unp9.vercel.app';

// ─── Init ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Handle email confirmation callback (access_token in URL hash)
  await handleAuthCallback();

  await loadQuill();
  bindAuthEvents();
  bindDashboardEvents();
  bindEditorEvents();
  bindUserEvents();
  bindSecurityEvents();
  checkSession();
});

// ─── Handle Email Confirmation Callback ──────────────────
async function handleAuthCallback() {
  const hash = window.location.hash;
  if (hash && hash.includes('access_token')) {
    // Supabase automatically handles the session from the URL hash
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Auth callback error:', error);
    } else if (data?.session) {
      // Session established — clean the URL
      window.history.replaceState(null, '', '/admin.html');
      // Show a success message
      setTimeout(() => {
        const msg = document.createElement('div');
        msg.style.cssText = 'position:fixed;top:20px;right:20px;background:#d1fae5;color:#065f46;padding:14px 20px;border-radius:10px;font-family:sans-serif;font-size:14px;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.1);';
        msg.textContent = '✅ Email confirmed! You are now signed in.';
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 4000);
      }, 500);
    }
  }
}

async function loadQuill() {
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.href = 'https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js';
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
}

// ─── Session ─────────────────────────────────────────────
async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
    await loadProfile();
    showDashboard();
  } else {
    show('loginView');
  }
}

async function loadProfile() {
  // Try loading profile — if it fails (e.g., trigger didn't fire), create it
  let { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (!data) {
    // Profile doesn't exist yet — create it manually
    const { error: insertError } = await supabase.from('profiles').insert({
      id: currentUser.id,
      email: currentUser.email,
      full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
      role: 'client'
    });
    if (!insertError) {
      ({ data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single());
    }
  }

  if (data) {
    currentRole = data.role;
    $('userBadge').textContent = `${data.full_name} (${data.role})`;
    $('userBadge2').textContent = `${data.full_name} (${data.role})`;
    // Show/hide user management tab
    $('usersTab').style.display = data.role === 'admin' ? 'inline-flex' : 'none';
  }
}

// ─── Auth ────────────────────────────────────────────────
function bindAuthEvents() {
  $('loginBtn').addEventListener('click', login);
  $('signupBtn').addEventListener('click', signup);
  $('logoutBtn').addEventListener('click', logout);
  $('logoutBtn2').addEventListener('click', logout);
  $('showSignup').addEventListener('click', (e) => {
    e.preventDefault();
    $('loginForm').style.display = 'none';
    $('signupForm').style.display = 'block';
  });
  $('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    $('loginForm').style.display = 'block';
    $('signupForm').style.display = 'none';
  });
  $('authEmail').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
  $('authPassword').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
}

async function login() {
  const email = $('authEmail').value.trim();
  const password = $('authPassword').value;
  if (!email || !password) return showAuthMsg('Please enter email and password.', 'error');
  showAuthMsg('Signing in…', 'info');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.message.includes('Email not confirmed')) {
      return showAuthMsg('Please check your email and confirm your address before logging in.', 'error');
    }
    return showAuthMsg(error.message, 'error');
  }
  currentUser = data.user;
  await loadProfile();
  showDashboard();
}

async function signup() {
  const email = $('signupEmail').value.trim();
  const password = $('signupPassword').value;
  const name = $('signupName').value.trim();
  if (!email || !password || !name) return showAuthMsg('Please fill in all fields.', 'error');
  if (password.length < 6) return showAuthMsg('Password must be at least 6 characters.', 'error');
  showAuthMsg('Creating account…', 'info');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${SITE_URL}/admin.html`
    }
  });
  if (error) return showAuthMsg(error.message, 'error');
  if (data?.user?.identities?.length === 0) {
    showAuthMsg('An account with this email already exists. Please log in.', 'error');
    return;
  }
  showAuthMsg('Account created! A confirmation email has been sent to your inbox. Check your email (including spam) and click the link to verify.', 'success');
  // Back to login after 5 seconds
  setTimeout(() => {
    $('loginForm').style.display = 'block';
    $('signupForm').style.display = 'none';
    $('authEmail').value = email;
  }, 5000);
}

async function logout() {
  await supabase.auth.signOut();
  currentUser = null;
  currentRole = null;
  show('loginView');
}

function showAuthMsg(text, type) {
  const el = $('authMsg');
  el.textContent = text;
  // Make sure the element is visible
  el.style.display = 'block';
  el.className = 'auth-msg ' + type;
}

// ─── Dashboard ───────────────────────────────────────────
function showDashboard() {
  show('dashboardView');
  $('userEmail').textContent = currentUser?.email || '';
  loadPosts();
}

function bindDashboardEvents() {
  $('newPostBtn').addEventListener('click', () => openEditor());
  $('usersTab').addEventListener('click', () => loadUsers());
  $('securityTab').addEventListener('click', () => showSecurity());
}

async function loadPosts() {
  const tbody = $('postsTableBody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;">Loading posts…</td></tr>';

  let query = supabase
    .from('blog_posts')
    .select('id, title, category, status, featured, created_at, author_id')
    .order('created_at', { ascending: false });

  // Non-admin: only show own posts
  if (currentRole !== 'admin') {
    query = query.eq('author_id', currentUser.id);
  }

  const { data, error } = await query;
  if (error) return tbody.innerHTML = `<tr><td colspan="6" style="color:red;">${error.message}</td></tr>`;
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#6b7280;">No blog posts yet. Click "New Post" to create one.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(post => `
    <tr>
      <td>${post.title.substring(0, 50)}${post.title.length > 50 ? '…' : ''}</td>
      <td><span class="badge badge-${post.category}">${post.category}</span></td>
      <td><span class="badge badge-${post.status}">${post.status}</span></td>
      <td>${post.featured ? '⭐' : '—'}</td>
      <td>${new Date(post.created_at).toLocaleDateString()}</td>
      <td class="action-cell">
        <button class="tbl-btn edit" onclick="window.openEditor('${post.id}')">✏️</button>
        ${currentRole === 'admin' ? `<button class="tbl-btn delete" onclick="window.deletePost('${post.id}')">🗑️</button>` : ''}
      </td>
    </tr>
  `).join('');
}

// ─── Editor ──────────────────────────────────────────────
async function openEditor(postId = null) {
  show('editorView');
  editingPostId = postId;

  if (postId) {
    const { data } = await supabase.from('blog_posts').select('*').eq('id', postId).single();
    if (data) {
      $('postTitle').value = data.title;
      $('postSlug').value = data.slug;
      $('postExcerpt').value = data.excerpt || '';
      $('postCategory').value = data.category;
      $('postReadTime').value = data.read_time || 5;
      $('postStatus').value = data.status;
      $('postFeatured').checked = data.featured;
      $('editorTitle').textContent = 'Edit Post';
      if (quill) quill.root.innerHTML = data.content || '';
      return;
    }
  }

  // New post — reset form
  $('postTitle').value = '';
  $('postSlug').value = '';
  $('postExcerpt').value = '';
  $('postCategory').value = 'relationship';
  $('postReadTime').value = 5;
  $('postStatus').value = 'draft';
  $('postFeatured').checked = false;
  $('editorTitle').textContent = 'New Post';
  if (quill) quill.root.innerHTML = '';
}

function bindEditorEvents() {
  // Wait for Quill to load, then initialize
  const waitForQuill = setInterval(() => {
    if (typeof Quill !== 'undefined') {
      clearInterval(waitForQuill);
      quill = new Quill('#postContent', {
        theme: 'snow',
        placeholder: 'Write your article here…',
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ align: [] }],
            ['blockquote', 'code-block'],
            [{ color: [] }, { background: [] }],
            ['link', 'image'],
            ['clean']
          ]
        }
      });
    }
  }, 100);

  // Auto-generate slug from title
  $('postTitle').addEventListener('input', function() {
    if (!editingPostId) {
      $('postSlug').value = this.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
  });

  $('savePostBtn').addEventListener('click', savePost);
  $('cancelEditorBtn').addEventListener('click', () => show('dashboardView'));
  $('backToPostsBtn').addEventListener('click', () => show('dashboardView'));
}

async function savePost() {
  const title = $('postTitle').value.trim();
  const slug = $('postSlug').value.trim();
  const excerpt = $('postExcerpt').value.trim();
  const category = $('postCategory').value;
  const readTime = parseInt($('postReadTime').value) || 5;
  const status = $('postStatus').value;
  const featured = $('postFeatured').checked;
  const content = quill ? quill.root.innerHTML : '';

  if (!title) return showEditorMsg('Please enter a title.', 'error');
  if (!slug) return showEditorMsg('Please enter a URL slug.', 'error');
  if (!content || content === '<p><br></p>') return showEditorMsg('Please write some content.', 'error');

  showEditorMsg('Saving…', 'info');

  const postData = {
    title,
    slug,
    excerpt: excerpt || title.substring(0, 120),
    content,
    category,
    read_time: readTime,
    status,
    featured,
    updated_at: new Date().toISOString()
  };

  if (status === 'published' && !editingPostId) {
    postData.published_at = new Date().toISOString();
  } else if (status === 'published' && editingPostId) {
    const { data: old } = await supabase.from('blog_posts').select('status').eq('id', editingPostId).single();
    if (old && old.status === 'draft') {
      postData.published_at = new Date().toISOString();
    }
  }

  let error;
  if (editingPostId) {
    ({ error } = await supabase.from('blog_posts').update(postData).eq('id', editingPostId));
  } else {
    postData.author_id = currentUser.id;
    if (currentRole === 'therapist' && postData.status === 'published') {
      postData.status = 'pending_review';
    }
    ({ error } = await supabase.from('blog_posts').insert(postData));
  }

  if (error) return showEditorMsg(error.message, 'error');
  showEditorMsg('Post saved successfully! ✅', 'success');
  setTimeout(() => show('dashboardView'), 1200);
  loadPosts();
}

function showEditorMsg(text, type) {
  const el = $('editorMsg');
  el.textContent = text;
  el.style.display = 'block';
  el.className = 'auth-msg ' + type;
}

// ─── Delete Post ─────────────────────────────────────────
window.deletePost = async function(id) {
  if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) return;
  const { error } = await supabase.from('blog_posts').delete().eq('id', id);
  if (error) return alert('Error: ' + error.message);
  loadPosts();
};

window.openEditor = openEditor;

// ─── User Management ─────────────────────────────────────
function bindUserEvents() {
  $('usersTab').addEventListener('click', loadUsers);
}

async function loadUsers() {
  show('usersView');
  const tbody = $('usersTableBody');
  tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;">Loading users…</td></tr>';

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return tbody.innerHTML = `<tr><td colspan="4" style="color:red;">${error.message}</td></tr>`;
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;">No users found.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(user => `
    <tr>
      <td>${user.full_name || '—'}</td>
      <td>${user.email || '—'}</td>
      <td>
        <select class="role-select" data-user-id="${user.id}" ${currentRole === 'admin' ? '' : 'disabled'}>
          <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
          <option value="staff" ${user.role === 'staff' ? 'selected' : ''}>Staff</option>
          <option value="therapist" ${user.role === 'therapist' ? 'selected' : ''}>Therapist</option>
          <option value="client" ${user.role === 'client' ? 'selected' : ''}>Client</option>
        </select>
      </td>
      <td>${new Date(user.created_at).toLocaleDateString()}</td>
    </tr>
  `).join('');

  document.querySelectorAll('.role-select').forEach(sel => {
    sel.addEventListener('change', async function() {
      const newRole = this.value;
      const userId = this.dataset.userId;
      if (!confirm('Change this user\'s role to "' + newRole + '"?')) {
        const { data: orig } = await supabase.from('profiles').select('role').eq('id', userId).single();
        if (orig) this.value = orig.role;
        return;
      }
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) return alert('Error: ' + error.message);
      alert('Role updated!');
    });
  });
}

// ─── Security / MFA ──────────────────────────────────────
function bindSecurityEvents() {
  $('securityTab').addEventListener('click', showSecurity);
  $('setupTotpBtn').addEventListener('click', setupTotp);
  $('disableTotpBtn').addEventListener('click', disableTotp);
}

async function showSecurity() {
  show('securityView');

  // Check current MFA factors
  const { data: factors, error } = await supabase.auth.mfa.listFactors();
  if (error) {
    $('securityStatus').innerHTML = `<p style="color:#dc2626;">Error loading security info: ${error.message}</p>`;
    return;
  }

  const totpFactor = factors?.all?.find(f => f.factor_type === 'totp');
  const verifiedTotp = factors?.totp?.length > 0;

  if (verifiedTotp && totpFactor) {
    // TOTP is already set up and verified
    $('totpStatus').innerHTML = `
      <div class="mfa-active">
        <span class="mfa-badge">✅ Active</span>
        <p>Authenticator app (TOTP) is enabled on your account.</p>
        <p style="font-size:0.82rem;color:#6b7280;">When you log in, you'll be prompted for a 6-digit code from your authenticator app after your password.</p>
      </div>
    `;
    $('setupTotpBtn').style.display = 'none';
    $('disableTotpBtn').style.display = 'inline-flex';
  } else {
    // No TOTP set up
    $('totpStatus').innerHTML = `
      <p style="color:#6b7280;">You have not set up two-factor authentication yet.</p>
      <p style="font-size:0.82rem;color:#9ca3af;margin-top:4px;">
        With 2FA, you'll need both your password and a one-time code from your phone to log in.
        Supports Google Authenticator, Authy, Microsoft Authenticator, and any TOTP app.
      </p>
    `;
    $('setupTotpBtn').style.display = 'inline-flex';
    $('disableTotpBtn').style.display = 'none';
  }
}

async function setupTotp() {
  const statusEl = $('totpStatus');
  statusEl.innerHTML = '<p>Generating QR code…</p>';

  // Step 1: Enroll
  const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Authenticator App'
  });

  if (enrollError) {
    statusEl.innerHTML = `<p style="color:#dc2626;">Error: ${enrollError.message}</p>`;
    return;
  }

  const factorId = enrollData.id;
  const qrUrl = enrollData.totp.qr_code;

  // Show QR code and verification form
  statusEl.innerHTML = `
    <div class="mfa-setup">
      <p style="font-weight:600;margin-bottom:10px;">📱 Scan this QR code with your authenticator app:</p>
      <div class="qr-container">
        <img src="${qrUrl}" alt="QR Code" style="width:180px;height:180px;border:1px solid #e5e7eb;border-radius:8px;">
      </div>
      <p style="font-size:0.85rem;color:#6b7280;margin:10px 0;">
        Can't scan? Use this code: <code style="background:#f3f4f6;padding:4px 8px;border-radius:4px;font-size:0.8rem;">${enrollData.totp.secret}</code>
      </p>
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb;">
        <p style="font-weight:500;margin-bottom:8px;">Verify the code from your authenticator app:</p>
        <div style="display:flex;gap:8px;">
          <input type="text" id="totpVerifyCode" placeholder="000000" maxlength="6" style="width:120px;padding:10px;border:1px solid #d1d5db;border-radius:6px;font-size:1.1rem;text-align:center;letter-spacing:4px;font-family:monospace;">
          <button id="verifyTotpBtn" class="btn-primary" style="padding:10px 20px;">Verify</button>
        </div>
        <p id="totpVerifyMsg" style="margin-top:8px;font-size:0.85rem;"></p>
      </div>
    </div>
  `;

  $('setupTotpBtn').style.display = 'none';

  document.getElementById('verifyTotpBtn').addEventListener('click', async () => {
    const code = document.getElementById('totpVerifyCode').value.trim();
    if (!code || code.length !== 6) {
      document.getElementById('totpVerifyMsg').textContent = 'Please enter the 6-digit code.';
      document.getElementById('totpVerifyMsg').style.color = '#dc2626';
      return;
    }

    const verifyMsg = document.getElementById('totpVerifyMsg');
    verifyMsg.textContent = 'Verifying…';
    verifyMsg.style.color = '#6b7280';

    // Step 2: Verify
    const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      code
    });

    if (verifyError) {
      verifyMsg.textContent = '❌ Incorrect code. Please try again.';
      verifyMsg.style.color = '#dc2626';
      return;
    }

    verifyMsg.textContent = '✅ 2FA enabled successfully!';
    verifyMsg.style.color = '#16a34a';

    setTimeout(() => showSecurity(), 1500);
  });
}

async function disableTotp() {
  if (!confirm('Are you sure you want to disable two-factor authentication?')) return;

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const totpFactor = factors?.all?.find(f => f.factor_type === 'totp' && f.status === 'verified');

  if (!totpFactor) {
    showSecurity();
    return;
  }

  const { error } = await supabase.auth.mfa.unenroll({ factorId: totpFactor.id });
  if (error) return alert('Error: ' + error.message);
  alert('2FA has been disabled.');
  showSecurity();
}

// Expose switchTab for navigation
window.switchTab = function(tab) {
  if (tab === 'posts') show('dashboardView');
  if (tab === 'users') loadUsers();
  if (tab === 'security') showSecurity();
};