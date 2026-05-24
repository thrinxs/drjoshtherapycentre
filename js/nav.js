document.addEventListener('DOMContentLoaded', function () {

    // Sticky navbar shadow on scroll
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    });
  
    // Mobile nav open/close
    const navToggle = document.getElementById('navToggle');
    const mobileNav = document.getElementById('mobileNav');
    const navClose = document.getElementById('navClose');
  
    if (navToggle && mobileNav && navClose) {
      navToggle.addEventListener('click', () => mobileNav.classList.add('open'));
      navClose.addEventListener('click', () => mobileNav.classList.remove('open'));
      mobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => mobileNav.classList.remove('open'));
      });
    }
  
  });