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
const views   = ['loginView','dashboardView','editorView','usersView'];
const show    = id => views.forEach(v => $(v).style.display = v === id ? 'block' : 'none');

// ─── Init ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Load Quill from CDN
  await loadQuill();
  bindAuthEvents();
  bindDashboardEvents();
  bindEditorEvents();
  bindUserEvents();
  checkSession();
});

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
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();
  if (data) {
    currentRole = data.role;
    $('userBadge').textContent = `${data.full_name} (${data.role})`;
    // Show/hide user management tab
    $('usersTab').style.display = data.role === 'admin' ? 'inline-flex' : 'none';
  }
}

// ─── Auth ────────────────────────────────────────────────
function bindAuthEvents() {
  $('loginBtn').addEventListener('click', login);
  $('signupBtn').addEventListener('click', signup);
  $('logoutBtn').addEventListener('click', logout);
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
  if (error) return showAuthMsg(error.message, 'error');
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
    email, password,
    options: { data: { full_name: name } }
  });
  if (error) return showAuthMsg(error.message, 'error');
  if (data?.user?.identities?.length === 0) {
    showAuthMsg('An account with this email already exists. Please log in.', 'error');
    return;
  }
  showAuthMsg('Account created! Check your email for confirmation, then log in.', 'success');
  // Back to login after 3 seconds
  setTimeout(() => {
    $('loginForm').style.display = 'block';
    $('signupForm').style.display = 'none';
    $('authEmail').value = email;
    $('authMsg').textContent = '';
  }, 3000);
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
  el.className = 'auth-msg ' + type;
}

// ─── Dashboard ───────────────────────────────────────────
function showDashboard() {
  show('dashboardView');
  $('userEmail').textContent = currentUser.email;
  loadPosts();
}

function bindDashboardEvents() {
  $('newPostBtn').addEventListener('click', () => openEditor());
  $('usersTab').addEventListener('click', () => loadUsers());
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
  } else if (status === 'published') {
    // Check if it was previously draft
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
    // Therapists' posts go to pending_review
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
  el.className = 'auth-msg ' + type;
}

// ─── Delete Post ─────────────────────────────────────────
window.deletePost = async function(id) {
  if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) return;
  const { error } = await supabase.from('blog_posts').delete().eq('id', id);
  if (error) return alert('Error: ' + error.message);
  loadPosts();
};

// Expose for inline onclick
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

  // Bind role change events
  document.querySelectorAll('.role-select').forEach(sel => {
    sel.addEventListener('change', async function() {
      const newRole = this.value;
      const userId = this.dataset.userId;
      if (!confirm('Change this user\'s role to "' + newRole + '"?')) {
        // Revert
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