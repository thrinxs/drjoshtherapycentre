// ============================================================
// Blog — Dr. Josh Therapy Centre (Supabase-powered)
// ============================================================

import { supabase } from './supabase.js';

let allPosts = [];
let currentFilter = 'all';
let viewingArticle = null;

// ─── DOM refs ────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ─── Init ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadPosts();
  bindFilters();
  // Check URL hash for direct article link
  checkUrlHash();
  // Listen for hash changes
  window.addEventListener('hashchange', checkUrlHash);
});

// ─── Load Posts from Supabase ────────────────────────────
async function loadPosts() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('featured', { ascending: false })
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error loading posts:', error);
    $('blogGrid').innerHTML = `<div class="no-posts" style="display:block;">
      <p>Unable to load articles right now. Please try again later.</p>
    </div>`;
    return;
  }

  allPosts = data || [];
  renderPosts();
}

// ─── Render Posts ────────────────────────────────────────
function renderPosts() {
  // Featured post
  const featuredPost = allPosts.find(p => p.featured);
  if (featuredPost) {
    renderFeatured(featuredPost);
  } else if (allPosts.length > 0) {
    renderFeatured(allPosts[0]);
  } else {
    $('featuredPost').style.display = 'none';
  }

  // Filter and render grid
  renderGrid();
}

function renderFeatured(post) {
  const el = $('featuredPost');
  el.style.display = 'grid';

  const emojiMap = {
    relationship: '💔', marriage: '💍', intimacy: '🌿',
    family: '👨‍👩‍👧', mental: '🧠', emotional: '💙', personal: '🌱'
  };

  el.innerHTML = `
    <div class="featured-post-img">${emojiMap[post.category] || '💔'}</div>
    <div class="featured-post-body">
      <span class="featured-label">⭐ Featured Post</span>
      <div class="post-meta">
        <span>${post.author_name || 'Dr. Josh Therapy Centre'}</span>
        <div class="meta-dot"></div>
        <span class="capitalize">${post.category}</span>
        <div class="meta-dot"></div>
        <span>${post.read_time || 5} min read</span>
      </div>
      <h2>${post.title}</h2>
      <p>${post.excerpt || ''}</p>
      <a href="#${post.slug}" class="read-more-btn">Read Full Article →</a>
    </div>
  `;
}

function renderGrid() {
  const grid = $('blogGrid');
  const noPosts = $('noPosts');
  const loadMore = $('loadMoreBtn');

  let filtered = currentFilter === 'all'
    ? allPosts
    : allPosts.filter(p => p.category === currentFilter);

  if (filtered.length === 0) {
    grid.innerHTML = '';
    noPosts.style.display = 'block';
    loadMore.style.display = 'none';
    return;
  }

  noPosts.style.display = 'none';
  loadMore.style.display = 'block';

  const emojiMap = {
    relationship: '❤️', marriage: '💍', intimacy: '🌿',
    family: '👨‍👩‍👧', mental: '🧠', emotional: '💙', personal: '🌱'
  };

  const categoryNames = {
    relationship: 'Relationships', marriage: 'Marriage', intimacy: 'Intimacy',
    family: 'Family', mental: 'Mental Health', emotional: 'Emotional Healing',
    personal: 'Personal Growth'
  };

  grid.innerHTML = filtered.map(post => `
    <div class="blog-card" data-category="${post.category}">
      <div class="blog-card-img cat-${post.category}">${emojiMap[post.category] || '📝'}</div>
      <div class="blog-card-body">
        <span class="blog-tag tag-${post.category}">${categoryNames[post.category] || post.category}</span>
        <h4>${post.title}</h4>
        <p>${post.excerpt || ''}</p>
        <div class="blog-card-footer">
          <span>${post.read_time || 5} min read</span>
          <a href="#${post.slug}">Read More →</a>
        </div>
      </div>
    </div>
  `).join('');
}

// ─── Filters ─────────────────────────────────────────────
function bindFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;

      // Hide featured on category filter
      $('featuredPost').style.display = currentFilter === 'all' ? 'grid' : 'none';
      renderGrid();
    });
  });
}

// ─── Single Article View ────────────────────────────────
function checkUrlHash() {
  const slug = window.location.hash.replace('#', '');
  if (slug) {
    showArticle(slug);
  } else {
    hideArticle();
  }
}

async function showArticle(slug) {
  // If we already have the posts loaded, find it
  let post = allPosts.find(p => p.slug === slug);

  // If not found locally, fetch from Supabase
  if (!post) {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();
    post = data;
  }

  if (!post) {
    window.location.hash = '';
    return;
  }

  viewingArticle = post;

  // Hide listing, show article
  $('featuredPost').style.display = 'none';
  $('blogGridSection').style.display = 'none';
  $('loadMoreBtn').style.display = 'none';
  $('newsletterStrip').style.display = 'none';
  $('blogFilters').style.display = 'none';

  const articleEl = $('articleView');
  articleEl.style.display = 'block';

  const categoryNames = {
    relationship: 'Relationships', marriage: 'Marriage', intimacy: 'Intimacy',
    family: 'Family', mental: 'Mental Health', emotional: 'Emotional Healing',
    personal: 'Personal Growth'
  };

  articleEl.innerHTML = `
    <div class="article-container">
      <button class="back-to-blog" onclick="window.location.hash=''">
        ← Back to Blog
      </button>

      <div class="article-header">
        <span class="blog-tag tag-${post.category}">${categoryNames[post.category] || post.category}</span>
        <h1>${post.title}</h1>
        <div class="article-meta">
          <span>${post.author_name || 'Dr. Josh Therapy Centre'}</span>
          <span class="meta-sep">·</span>
          <span>${new Date(post.published_at || post.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
          })}</span>
          <span class="meta-sep">·</span>
          <span>${post.read_time || 5} min read</span>
        </div>
      </div>

      ${post.featured_image ? `<img src="${post.featured_image}" alt="${post.title}" class="article-image">` : ''}

      <div class="article-content">
        ${post.content}
      </div>

      <div class="article-footer">
        <div class="article-cta">
          <h3>Ready to start your healing journey?</h3>
          <p>If this article resonated with you, a real conversation could make all the difference.</p>
          <a href="booking.html" class="read-more-btn">Book a Session →</a>
        </div>
        <button class="back-to-blog" onclick="window.location.hash=''" style="margin-top:16px;">
          ← Back to all articles
        </button>
      </div>
    </div>
  `;

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideArticle() {
  viewingArticle = null;
  $('articleView').style.display = 'none';
  $('articleView').innerHTML = '';
  $('featuredPost').style.display = currentFilter === 'all' ? 'grid' : 'none';
  $('blogGridSection').style.display = 'block';
  $('loadMoreBtn').style.display = 'block';
  $('newsletterStrip').style.display = 'flex';
  $('blogFilters').style.display = 'block';
}

// ─── Load More ────────────────────────────────────────────
// (Already all loaded, but keep the button for UX)
$('loadMoreBtn').addEventListener('click', function () {
  this.textContent = 'All articles loaded ✓';
  this.disabled = true;
  this.style.opacity = '0.5';
});
