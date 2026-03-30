/* ============================================================
   Blissful Beginnings | Luxury Wedding Planner
   script.js — Production Build
   ============================================================

   TABLE OF CONTENTS
   1.  Preloader
   2.  Custom Cursor
   3.  Navigation (Scroll + Mobile Menu + Active Link)
   4.  Hero — Parallax & Rose Particle System
   5.  GSAP Hero Entrance Animation
   6.  Scroll Reveal (Intersection Observer)
   7.  Counter Animation (Stats Bar)
   8.  Gallery Lightbox
   9.  Testimonials Slider
   10. Contact Form (WhatsApp redirect)
   11. Smooth Scroll
   12. Back to Top
   ============================================================ */

'use strict';

/* ============================================================
   1. PRELOADER
   ============================================================ */
(function initPreloader() {
  const preloader = document.getElementById('preloader');
  const bar       = document.getElementById('preloaderBar');
  if (!preloader || !bar) return;

  let progress = 0;
  const speed  = 18; // ms per tick

  const tick = setInterval(() => {
    progress += Math.random() * 12 + 4;
    if (progress >= 100) {
      progress = 100;
      clearInterval(tick);
      bar.style.width = '100%';

      setTimeout(() => {
        preloader.classList.add('hidden');
        document.body.style.overflow = '';
        startHeroAnimation();
      }, 400);
    }
    bar.style.width = progress + '%';
  }, speed);

  // Prevent scroll during preload
  document.body.style.overflow = 'hidden';
})();


/* ============================================================
   2. CUSTOM CURSOR
   ============================================================ */
(function initCursor() {
  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  // Only on non-touch devices
  if (!window.matchMedia('(hover: hover)').matches) return;

  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';
  });

  // Ring follows with lag
  function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  // Expand on interactive elements
  const hoverTargets = 'a, button, .svc-card, .gal-item, .insta-item, .testi-btn, .cs-btn';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) {
      ring.classList.add('hovering');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) {
      ring.classList.remove('hovering');
    }
  });
})();


/* ============================================================
   3. NAVIGATION
   ============================================================ */
(function initNav() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu= document.getElementById('mobileMenu');
  const navLinks  = document.querySelectorAll('.nav-link');
  const mobLinks  = document.querySelectorAll('.mob-link');
  if (!navbar) return;

  /* ---- Scroll: sticky glass effect ---- */
  const onScroll = () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Mobile menu toggle ---- */
  const openMenu = () => {
    hamburger.classList.add('open');
    mobileMenu.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');
  };

  const closeMenu = () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
  };

  hamburger.addEventListener('click', () => {
    hamburger.classList.contains('open') ? closeMenu() : openMenu();
  });

  mobLinks.forEach(link => link.addEventListener('click', closeMenu));

  /* ---- Active nav link on scroll ---- */
  const sections = document.querySelectorAll('section[id]');

  const highlightNav = () => {
    const scrollY = window.scrollY + 120;
    sections.forEach(section => {
      const top    = section.offsetTop;
      const height = section.offsetHeight;
      const id     = section.getAttribute('id');

      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(l => {
          l.classList.remove('active');
          if (l.getAttribute('href') === '#' + id) l.classList.add('active');
        });
      }
    });
  };

  window.addEventListener('scroll', highlightNav, { passive: true });
})();


/* ============================================================
   4. HERO — PARALLAX & GOLD PARTICLE SYSTEM
   ============================================================ */

// Parallax — rAF-throttled so it never blocks the main thread
(function initParallax() {
  const heroBg = document.getElementById('heroBg');
  if (!heroBg) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      if (scrollY <= window.innerHeight) {
        heroBg.style.transform = `translateY(${scrollY * 0.3}px)`;
      }
      ticking = false;
    });
  }, { passive: true });
})();

// Canvas Flower Particle System — optimised (no shadowBlur, offscreen pre-render, 30 fps cap)
(function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  // Skip on low-memory / mobile devices to prevent jank
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  let W, H, particles, offscreenLarge, offscreenSmall;

  const resize = () => {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  };

  /* ── Pre-render flower shapes to offscreen canvases (no per-frame path cost) ── */
  function makeFlowerSprite(r, petals, color) {
    const size = Math.ceil(r * 2.4);
    const oc   = document.createElement('canvas');
    oc.width   = size;
    oc.height  = size;
    const c    = oc.getContext('2d');
    const cx   = size / 2;

    c.fillStyle = color;
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2;
      c.save();
      c.translate(cx, cx);
      c.rotate(angle);
      c.beginPath();
      c.ellipse(0, -r * 0.52, r * 0.26, r * 0.52, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    // centre dot
    c.beginPath();
    c.arc(cx, cx, r * 0.18, 0, Math.PI * 2);
    c.fill();
    return oc;
  }

  const buildSprites = () => {
    offscreenLarge = makeFlowerSprite(28, 6, 'rgba(255,248,245,0.9)');
    offscreenSmall = makeFlowerSprite(7,  5, 'rgba(240,228,220,0.95)');
  };

  class Particle {
    constructor(init) { this.reset(init); }

    reset(init) {
      this.large    = Math.random() < 0.3;
      this.sprite   = this.large ? offscreenLarge : offscreenSmall;
      this.r        = this.large ? 28 : 7;
      this.x        = Math.random() * W;
      this.y        = init ? Math.random() * H : -this.r * 2 - 10;
      this.vx       = (Math.random() - 0.5) * 0.45;
      this.vy       = Math.random() * 0.5 + 0.18;
      this.angle    = Math.random() * Math.PI * 2;
      this.spin     = (Math.random() - 0.5) * 0.01;
      this.maxAlpha = this.large ? Math.random() * 0.16 + 0.05 : Math.random() * 0.5 + 0.18;
      this.alpha    = init ? Math.random() * this.maxAlpha : 0;
      this.fadingIn = !init;
    }

    update() {
      this.x     += this.vx;
      this.y     += this.vy;
      this.angle += this.spin;
      // gentle sway
      this.vx    += Math.sin(this.y * 0.013) * 0.006;
      if (this.fadingIn) {
        this.alpha = Math.min(this.alpha + 0.007, this.maxAlpha);
        if (this.alpha >= this.maxAlpha) this.fadingIn = false;
      }
      if (this.y > H + this.r * 2 + 10) this.reset(false);
    }

    draw() {
      if (this.alpha <= 0) return;
      const s = this.sprite;
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      // drawImage is GPU-accelerated — no path rebuild per frame
      ctx.drawImage(s, -s.width / 2, -s.height / 2);
      ctx.restore();
    }
  }

  // 30 fps cap — halves GPU cost vs 60 fps
  const FPS      = 30;
  const interval = 1000 / FPS;
  let   lastTime = 0;
  let   rafId;

  const animate = (now) => {
    rafId = requestAnimationFrame(animate);
    if (now - lastTime < interval) return;
    lastTime = now;
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }
  };

  // Pause when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(rafId); }
    else                 { lastTime = 0; rafId = requestAnimationFrame(animate); }
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      buildSprites();
      particles.forEach(p => p.reset(true));
    }, 200);
  }, { passive: true });

  resize();
  buildSprites();
  // 8 large bokeh + 17 small crisp = 25 total
  particles = [
    ...Array.from({ length: 8  }, () => new Particle(true)),
    ...Array.from({ length: 17 }, () => new Particle(true)),
  ];
  rafId = requestAnimationFrame(animate);
})();


/* ============================================================
   5. HERO ENTRANCE ANIMATION (pure CSS — no GSAP needed)
   ============================================================ */
function startHeroAnimation() {
  const elems = [
    { sel: '.hero-eyebrow', delay: 0   },
    { sel: '.hero-title',   delay: 150 },
    { sel: '.hero-subtitle',delay: 300 },
    { sel: '.hero-divider', delay: 420 },
    { sel: '.hero-buttons', delay: 540 },
  ];
  elems.forEach(({ sel, delay }) => {
    const el = document.querySelector(sel);
    if (!el) return;
    setTimeout(() => { el.classList.add('hero-visible'); }, delay);
  });
}


/* ============================================================
   6. SCROLL REVEAL (Intersection Observer)
   ============================================================ */
(function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el    = entry.target;
      const delay = parseInt(el.dataset.delay || 0, 10);

      setTimeout(() => {
        el.classList.add('in-view');
      }, delay);

      observer.unobserve(el);
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -60px 0px'
  });

  elements.forEach(el => observer.observe(el));
})();


/* ============================================================
   7. COUNTER ANIMATION (Stats Bar)
   ============================================================ */
(function initCounters() {
  const counters = document.querySelectorAll('.count');
  if (!counters.length) return;

  const easeOut = (t) => 1 - Math.pow(1 - t, 4);

  const animateCounter = (el) => {
    const target   = parseInt(el.dataset.target, 10);
    const duration = 1800;
    const start    = performance.now();

    const step = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      el.textContent = Math.floor(easeOut(progress) * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
})();


/* ============================================================
   8. GALLERY LIGHTBOX
   ============================================================ */
(function initLightbox() {
  const lightbox   = document.getElementById('lightbox');
  const lbImg      = document.getElementById('lbImg');
  const lbClose    = document.getElementById('lbClose');
  const lbPrev     = document.getElementById('lbPrev');
  const lbNext     = document.getElementById('lbNext');
  const lbCounter  = document.getElementById('lbCounter');
  const galleryGrid = document.getElementById('galleryGrid');
  if (!lightbox || !galleryGrid) return;

  const items    = Array.from(galleryGrid.querySelectorAll('.gal-item img'));
  let currentIdx = 0;

  const open = (idx) => {
    currentIdx = idx;
    lbImg.src  = items[idx].src;
    lbImg.alt  = items[idx].alt;
    lbCounter.textContent = `${idx + 1} / ${items.length}`;
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => { lbImg.src = ''; }, 400);
  };

  const prev = () => {
    currentIdx = (currentIdx - 1 + items.length) % items.length;
    lbImg.style.opacity = '0';
    setTimeout(() => {
      lbImg.src = items[currentIdx].src;
      lbImg.alt = items[currentIdx].alt;
      lbCounter.textContent = `${currentIdx + 1} / ${items.length}`;
      lbImg.style.opacity = '1';
    }, 200);
  };

  const next = () => {
    currentIdx = (currentIdx + 1) % items.length;
    lbImg.style.opacity = '0';
    setTimeout(() => {
      lbImg.src = items[currentIdx].src;
      lbImg.alt = items[currentIdx].alt;
      lbCounter.textContent = `${currentIdx + 1} / ${items.length}`;
      lbImg.style.opacity = '1';
    }, 200);
  };

  // Image transition
  lbImg.style.transition = 'opacity 0.2s ease';

  // Click gallery items
  galleryGrid.querySelectorAll('.gal-item').forEach((item, idx) => {
    item.addEventListener('click', () => open(idx));
  });

  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click', prev);
  lbNext.addEventListener('click', next);

  // Click outside
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) close();
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape')      close();
    if (e.key === 'ArrowLeft')   prev();
    if (e.key === 'ArrowRight')  next();
  });

  // Touch swipe
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
  });
})();


/* ============================================================
   9. TESTIMONIALS SLIDER
   ============================================================ */
(function initTestimonials() {
  const track  = document.getElementById('testiTrack');
  const dotsEl = document.getElementById('testiDots');
  const prev   = document.getElementById('testiPrev');
  const next   = document.getElementById('testiNext');
  if (!track) return;

  const cards  = Array.from(track.querySelectorAll('.testi-card'));
  const total  = cards.length;
  let current  = 0;
  let autoTimer;

  /* Build dots */
  const dots = cards.map((_, i) => {
    const btn = document.createElement('button');
    btn.className   = 'testi-dot' + (i === 0 ? ' active' : '');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-label', `Testimonial ${i + 1}`);
    btn.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(btn);
    return btn;
  });

  const goTo = (idx) => {
    current = (idx + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    resetAuto();
  };

  const resetAuto = () => {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 5500);
  };

  prev?.addEventListener('click', () => goTo(current - 1));
  next?.addEventListener('click', () => goTo(current + 1));

  // Touch swipe
  let startX = 0;
  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
  });

  resetAuto();
})();


/* ============================================================
   10. CONTACT FORM
   ============================================================ */
(function initContactForm() {
  const form    = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Basic validation
    const inputs = form.querySelectorAll('[required]');
    let valid = true;

    inputs.forEach(input => {
      input.style.borderColor = '';
      if (!input.value.trim()) {
        input.style.borderColor = '#f87171';
        valid = false;
      }
    });

    if (!valid) {
      form.querySelector('[required]:invalid, [required]')?.focus();
      return;
    }

    // Build WhatsApp message
    const name    = form.querySelector('#cName')?.value.trim()  || '';
    const phone   = form.querySelector('#cPhone')?.value.trim() || '';
    const event   = form.querySelector('#cEvent')?.value        || '';
    const message = form.querySelector('#cMsg')?.value.trim()   || '';

    const wa = [
      `*New Enquiry - Blissful Beginnings*`,
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Event: ${event}`,
      `Message: ${message}`
    ].join('\n');

    // Open WhatsApp
    window.open(`https://wa.me/917060433239?text=${encodeURIComponent(wa)}`, '_blank');

    // Show success
    if (success) {
      success.classList.add('show');
      setTimeout(() => success.classList.remove('show'), 5000);
    }

    form.reset();
  });
})();


/* ============================================================
   11. SMOOTH SCROLL
   ============================================================ */
(function initSmoothScroll() {
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    const targetId = anchor.getAttribute('href');
    if (targetId === '#') return;

    const target = document.querySelector(targetId);
    if (!target) return;

    e.preventDefault();

    const navHeight = document.getElementById('navbar')?.offsetHeight || 80;
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight;

    window.scrollTo({ top, behavior: 'smooth' });
  });
})();


/* ============================================================
   12. CONSULTATION MODAL
   ============================================================ */
(function initConsultModal() {
  const modal    = document.getElementById('consultModal');
  const backdrop = document.getElementById('consultBackdrop');
  const closeBtn = document.getElementById('consultClose');
  const skipBtn  = document.getElementById('consultSkip');
  const form     = document.getElementById('consultForm');
  if (!modal) return;

  if (sessionStorage.getItem('consultShown')) return;

  const open = () => {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    sessionStorage.setItem('consultShown', '1');
  };

  const close = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  setTimeout(open, 20000);

  closeBtn.addEventListener('click', close);
  skipBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) close();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name  = form.name.value.trim();
    const phone = form.phone.value.trim();
    const event = form.event.value;
    if (!name || !phone || !event) return;

    const msg = `*Consultation Request \u2014 Blissful Beginnings*\nName: ${name}\nPhone: ${phone}\nEvent: ${event}`;
    window.open(`https://wa.me/917060433239?text=${encodeURIComponent(msg)}`, '_blank');
    close();
  });
})();


/* ============================================================
   13. BACK TO TOP
   ============================================================ */
(function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
