/**
 * Hemo — Premium scroll-driven animations
 */
(function () {
  'use strict';

  /* Navbar (hamburger, auth, active link) lives in /js/nav.js */

  const heroDistrict = document.getElementById('hero-district');
  if (heroDistrict && window.BD_LOCATIONS) {
    const districts = new Set();
    Object.values(window.BD_LOCATIONS).forEach((div) => {
      Object.keys(div).forEach((d) => districts.add(d));
    });
    [...districts].sort().forEach((d) => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      heroDistrict.appendChild(opt);
    });
  }

  document.getElementById('hero-search-btn')?.addEventListener('click', () => {
    const bg = document.getElementById('hero-blood-group')?.value;
    const d = document.getElementById('hero-district')?.value;
    let url = '/search?';
    if (bg) url += 'bloodGroup=' + encodeURIComponent(bg) + '&';
    if (d) url += 'district=' + encodeURIComponent(d);
    window.location.href = url;
  });

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  /* ── HERO: scroll pin — HEMO → BLOOD DONATION → blood cell ─ */
  const heroHemo = document.getElementById('hero-hemo');
  const heroTitle = document.getElementById('hero-title');
  const heroLines = document.querySelectorAll('.hero-scroll__line');
  const bloodcell = document.getElementById('hero-bloodcell');
  const heroBottom = document.getElementById('hero-bottom');
  const heroSearch = document.getElementById('hero-search-wrap');

  if (document.getElementById('hero') && bloodcell) {
    gsap.set(bloodcell, { xPercent: -50, yPercent: -50, left: '50%', top: '50%', transformPerspective: 800 });

    const heroTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        pin: '.hero-scroll__pin',
        anticipatePin: 1,
      },
    });

    /* Phase 1: HEMO appears */
    heroTl.fromTo(heroHemo,
      { opacity: 0, scale: 0.75, y: 40 },
      { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: 'power2.out' },
      0
    );

    /* Phase 2: HEMO fades, BLOOD DONATION reveals */
    heroTl.to(heroHemo,
      { opacity: 0, scale: 1.1, y: -30, duration: 0.15 },
      0.22
    );

    heroTl.to(heroTitle, { opacity: 1, duration: 0.05 }, 0.28);

    heroLines.forEach((line, i) => {
      heroTl.fromTo(line,
        { clipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0% 0 0)', duration: 0.18, ease: 'power3.out' },
        0.3 + i * 0.1
      );
    });

    /* Phase 3: Blood cell 3D spin in */
    heroTl.fromTo(bloodcell,
      {
        opacity: 0,
        rotateX: 70,
        rotateY: -40,
        scale: 0.25,
      },
      {
        opacity: 1,
        rotateX: 15,
        rotateY: 20,
        scale: 1,
        duration: 0.35,
        ease: 'power2.out',
      },
      0.52
    );

    /* Phase 4: Continue rotating blood cell on scroll */
    heroTl.to(bloodcell,
      { rotateX: 5, rotateY: -15, scale: 1.05, duration: 0.25 },
      0.75
    );

    /* Phase 5: Bottom bar + search */
    heroTl.fromTo(heroBottom,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.12 },
      0.82
    );

    heroTl.fromTo(heroSearch,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.1 },
      0.88
    );
  }

  /* Blood cell — subtle mouse follow after hero */
  if (bloodcell) {
    let mx = 0, my = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', (e) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 30;
      my = (e.clientY / window.innerHeight - 0.5) * 20;
    });

    gsap.ticker.add(() => {
      cx += (mx - cx) * 0.04;
      cy += (my - cy) * 0.04;
      const heroEl = document.getElementById('hero');
      if (!heroEl) return;
      const rect = heroEl.getBoundingClientRect();
      const inHero = rect.top <= 0 && rect.bottom > window.innerHeight * 0.4;
      if (inHero) {
        gsap.set(bloodcell, { x: cx, y: cy });
      }
    });
  }

  /* ── STATS: count-up on scroll (0 → target) ─────────────── */
  document.querySelectorAll('.stat-item').forEach((item, i) => {
    gsap.to(item, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      delay: i * 0.15,
      ease: 'power3.out',
      scrollTrigger: { trigger: '#stats-section', start: 'top 80%', once: true },
    });

    const numEl = item.querySelector('.stat__number');
    const target = parseInt(numEl?.dataset.count, 10) || 0;
    if (target <= 0) return;

    numEl.textContent = '0';

    ScrollTrigger.create({
      trigger: numEl,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        const counter = { val: 0 };
        gsap.to(counter, {
          val: target,
          duration: 2,
          ease: 'power2.out',
          onUpdate: () => {
            numEl.textContent = Math.floor(counter.val).toLocaleString();
          },
          onComplete: () => {
            numEl.textContent = target.toLocaleString();
          },
        });
      },
    });
  });

  /* ── MISSION text reveal ───────────────────────────────── */
  gsap.from('#mission-text', {
    color: 'rgba(255,255,255,0)',
    scrollTrigger: { trigger: '#mission', start: 'top 80%', end: 'center center', scrub: true },
  });
  gsap.to('#mission-text', {
    color: 'rgba(255,255,255,0.85)',
    scrollTrigger: { trigger: '#mission', start: 'top 60%', end: 'center 40%', scrub: true },
  });

  /* ── URGENT cards — premium stagger ────────────────────── */
  gsap.utils.toArray('.urgent-card').forEach((card, i) => {
    gsap.to(card, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      delay: i * 0.12,
      ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top 88%', once: true },
    });
  });

  /* ── HOW IT WORKS: scroll steps 1→2→3→4 ───────────────── */
  const stepSlides = document.querySelectorAll('.step-slide');
  const stepDots = document.querySelectorAll('.steps-dot');

  if (stepSlides.length && document.getElementById('how-it-works')) {
    stepSlides[0]?.classList.add('active');

    ScrollTrigger.create({
      trigger: '#how-it-works',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      pin: '.steps-scroll__pin',
      anticipatePin: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        const step = Math.min(Math.floor(progress * 4), 3);

        stepSlides.forEach((s, i) => {
          s.classList.toggle('active', i === step);
        });
        stepDots.forEach((d, i) => {
          d.classList.toggle('active', i === step);
        });
      },
    });
  }

  /* ── FAQ: marquee (CSS auto) + scroll reveal ───────────── */
  gsap.from('#faq-title', {
    opacity: 0,
    y: 40,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: { trigger: '#faq-list', start: 'top 85%', once: true },
  });

  gsap.utils.toArray('.faq-reveal').forEach((item, i) => {
    gsap.fromTo(item,
      { opacity: 0, x: -40, y: 20 },
      {
        opacity: 1,
        x: 0,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: item,
          start: 'top 92%',
          once: true,
        },
        delay: i * 0.12,
      }
    );
  });

  /* ── Gallery 3D tilt ───────────────────────────────────── */
  document.querySelectorAll('.gallery__panel').forEach((panel) => {
    panel.addEventListener('mousemove', (e) => {
      const rect = panel.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      panel.style.transform =
        `perspective(600px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.02)`;
    });
    panel.addEventListener('mouseleave', () => {
      panel.style.transform = '';
    });
  });

  /* ── Events floating pics — parallax + drag ──────────────── */
  const floatPics = document.querySelectorAll('.events__float-pic');
  const eventsSection = document.getElementById('events-section');

  floatPics.forEach((pic, i) => {
    let dragX = 0, dragY = 0, isDragging = false;
    let startX, startY, origX, origY;

    const cls = pic.className;
    if (cls.includes('--1')) pic.dataset.baseTransform = 'rotate(-8deg)';
    else if (cls.includes('--2')) pic.dataset.baseTransform = 'rotate(6deg)';
    else pic.dataset.baseTransform = 'translateX(-50%) rotate(0deg)';

    eventsSection?.addEventListener('mousemove', (e) => {
      if (isDragging) return;
      const rect = eventsSection.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      applyTransform(pic, dragX + relX * 30 * (i + 1), dragY + relY * 20 * (i + 1));
    });

    pic.addEventListener('pointerdown', (e) => {
      isDragging = true;
      pic.setPointerCapture(e.pointerId);
      startX = e.clientX; startY = e.clientY;
      origX = dragX; origY = dragY;
      pic.style.zIndex = '20';
    });
    pic.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      dragX = origX + (e.clientX - startX);
      dragY = origY + (e.clientY - startY);
      applyTransform(pic, dragX, dragY);
    });
    pic.addEventListener('pointerup', () => { isDragging = false; pic.style.zIndex = ''; });

    gsap.from(pic, {
      opacity: 0, y: 60,
      rotation: i % 2 === 0 ? -15 : 15,
      scrollTrigger: { trigger: '#events-section', start: 'top 75%', once: true },
      duration: 0.9, delay: i * 0.2, ease: 'power3.out',
    });
  });

  function applyTransform(el, x, y) {
    const base = el.dataset.baseTransform || '';
    el.style.transform = `${base} translate(${x}px, ${y}px)`;
  }

  document.querySelectorAll('.event-card').forEach((card, i) => {
    ScrollTrigger.create({
      trigger: '#events-section', start: 'top 70%', once: true,
      onEnter: () => {
        gsap.to(card, { rotation: 0, y: i * 8, duration: 0.8, delay: i * 0.15, ease: 'back.out(1.5)' });
      },
    });
  });

  /* ── FAQ accordion ───────────────────────────────────────── */
  document.querySelectorAll('.faq-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const body = btn.nextElementSibling;
      const arrow = btn.querySelector('.faq-arrow');
      const item = btn.closest('.faq-item');
      const isOpen = body.classList.contains('open');

      document.querySelectorAll('.faq-body').forEach((b) => b.classList.remove('open'));
      document.querySelectorAll('.faq-arrow').forEach((a) => {
        a.style.transform = 'rotate(0deg)';
        a.style.color = 'rgba(255,255,255,0.4)';
      });
      document.querySelectorAll('.faq-item').forEach((it) => { it.style.background = ''; });

      if (!isOpen) {
        body.classList.add('open');
        arrow.style.transform = 'rotate(90deg)';
        arrow.style.color = '#dc2626';
        item.style.background = '#161616';
        btn.setAttribute('aria-expanded', 'true');
      } else {
        btn.setAttribute('aria-expanded', 'false');
      }
    });
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
    });
  });

})();
