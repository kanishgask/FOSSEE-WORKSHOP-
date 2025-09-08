// Workshop Booking Demo - Interactivity
// Features: theme toggle, scroll reveal, particles, ripple/glow buttons,
// calendar + slots, multi-step form with validation, pricing toggle,
// live search, confirmation modal, confetti

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function on(event, selector, handler, opts) {
    document.addEventListener(event, (e) => {
      const target = e.target.closest(selector);
      if (target) handler(e, target);
    }, opts);
  }

  // ------------------------------
  // Theme Toggle (Dark / Light)
  // ------------------------------
  const THEME_KEY = 'booking_demo_theme';
  function applyTheme(theme) {
    const rootClassList = document.documentElement.classList;
    if (theme === 'light') rootClassList.add('theme-light');
    else rootClassList.remove('theme-light');
  }
  function initTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    const theme = stored || (prefersLight ? 'light' : 'dark');
    applyTheme(theme);
    const btn = $('.theme-toggle');
    if (btn) {
      btn.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
      btn.addEventListener('click', () => {
        const isLight = document.documentElement.classList.toggle('theme-light');
        localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
        btn.setAttribute('aria-pressed', isLight ? 'true' : 'false');
      });
    }
  }

  // ------------------------------
  // Scroll Reveal (CSS baseline + IO boost)
  // ------------------------------
  function initReveal() {
    const elements = $$('.reveal');
    if (!('IntersectionObserver' in window)) {
      elements.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    elements.forEach(el => io.observe(el));
  }

  // ------------------------------
  // Particles behind form
  // ------------------------------
  function initParticles() {
    const wrap = $('.particles');
    if (!wrap) return;
    const count = Math.min(80, Math.max(30, Math.round(window.innerWidth / 24)));
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 100 + '%';
      s.style.setProperty('--dur', (4 + Math.random() * 6) + 's');
      frag.appendChild(s);
    }
    wrap.innerHTML = '';
    wrap.appendChild(frag);
  }

  // ------------------------------
  // Buttons: Glow follows pointer; Ripple on click
  // ------------------------------
  function initButtons() {
    on('pointermove', '.btn', (e, target) => {
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left; const y = e.clientY - rect.top;
      target.style.setProperty('--x', x + 'px');
      target.style.setProperty('--y', y + 'px');
    });

    on('click', '.btn--ripple', (e, target) => {
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left; const y = e.clientY - rect.top;
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      target.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  }

  // Subtle 3D tilt for workshop cards
  function initTilt() {
    const cards = $$('.workshop-grid .card');
    cards.forEach(card => {
      card.classList.add('tilt');
      card.addEventListener('pointermove', (e) => {
        const b = card.getBoundingClientRect();
        const px = (e.clientX - b.left) / b.width;
        const py = (e.clientY - b.top) / b.height;
        const rx = (py - 0.5) * -6;
        const ry = (px - 0.5) * 8;
        card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  // ------------------------------
  // Calendar + Slots
  // ------------------------------
  const calendarState = { date: new Date(), selectedDate: null, selectedSlot: null };

  function getMonthMatrix(year, month) {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const days = last.getDate();
    const matrix = [];
    for (let d = 1; d <= days; d++) {
      const date = new Date(year, month, d);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      // Simple demo availability rule: weekends fewer slots
      matrix.push({ day: d, available: !isWeekend || d % 3 !== 0 });
    }
    return matrix;
  }

  function renderCalendar() {
    const wrap = $('.calendar');
    if (!wrap) return;
    const grid = $('.calendar__grid', wrap);
    const monthLabel = $('.calendar__month', wrap);
    if (!grid || !monthLabel) return;
    const { date } = calendarState;
    const y = date.getFullYear();
    const m = date.getMonth();
    monthLabel.textContent = date.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    grid.innerHTML = '';

    const firstDay = new Date(y, m, 1).getDay();
    for (let i = 0; i < firstDay; i++) {
      const pad = document.createElement('div');
      pad.className = 'calendar__cell';
      grid.appendChild(pad);
    }

    const days = getMonthMatrix(y, m);
    days.forEach((info) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'calendar__cell calendar__cell--day';
      el.textContent = info.day;
      if (info.available) el.classList.add('calendar__cell--available');
      else el.classList.add('calendar__cell--unavailable');
      el.disabled = !info.available;
      el.dataset.day = String(info.day);
      grid.appendChild(el);
    });
  }

  function loadSlotsForSelectedDate() {
    const slotsWrap = $('.slots');
    if (!slotsWrap) return;
    slotsWrap.innerHTML = '';
    if (!calendarState.selectedDate) return;

    // Demo slots generator
    const base = [
      '09:00', '10:00', '11:00', '12:00',
      '14:00', '15:00', '16:00', '17:00',
    ];
    const frag = document.createDocumentFragment();
    base.forEach((t, i) => {
      const s = document.createElement('button');
      s.type = 'button'; s.className = 'slot'; s.textContent = t;
      const available = (i % 4 !== 1); // some unavailable
      if (available) s.classList.add('slot--available'); else {
        s.classList.add('slot--unavailable'); s.disabled = true;
      }
      s.dataset.time = t;
      frag.appendChild(s);
    });
    slotsWrap.appendChild(frag);
  }

  function initCalendar() {
    if (!$('.calendar')) return;
    renderCalendar();
    const wrap = $('.calendar');
    $('.icon-prev', wrap)?.addEventListener('click', () => {
      calendarState.date.setMonth(calendarState.date.getMonth() - 1);
      renderCalendar();
    });
    $('.icon-next', wrap)?.addEventListener('click', () => {
      calendarState.date.setMonth(calendarState.date.getMonth() + 1);
      renderCalendar();
    });

    on('click', '.calendar__cell--available', (e, target) => {
      $$('.calendar__cell--day').forEach(c => c.classList.remove('calendar__cell--selected'));
      target.classList.add('calendar__cell--selected');
      const day = Number(target.dataset.day);
      const d = new Date(calendarState.date.getFullYear(), calendarState.date.getMonth(), day);
      calendarState.selectedDate = d;
      calendarState.selectedSlot = null;
      loadSlotsForSelectedDate();
    });

    on('click', '.slot--available', (e, target) => {
      $$('.slot').forEach(s => s.classList.remove('slot--selected'));
      target.classList.add('slot--selected');
      calendarState.selectedSlot = target.dataset.time;
    });
  }

  // ------------------------------
  // Multi-step Form + Validation
  // ------------------------------
  const formState = { step: 1, data: {} };

  function updateStepper() {
    const items = $$('.stepper__item');
    items.forEach((el, idx) => {
      el.classList.toggle('is-active', idx < formState.step);
    });
  }

  function showStep(step) {
    formState.step = step;
    updateStepper();
    $$('.form-step').forEach((s, idx) => {
      s.classList.toggle('hidden', idx !== (step - 1));
    });
  }

  function validateEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }
  function validatePhone(v) {
    return /^\+?[0-9\-\s]{7,15}$/.test(v);
  }

  function inlineValidate(input) {
    const val = input.value.trim();
    let ok = true;
    if (input.type === 'email') ok = validateEmail(val);
    else if (input.name === 'phone') ok = validatePhone(val);
    else ok = val.length > 0;
    input.classList.toggle('input--invalid', !ok);
    input.classList.toggle('input--valid', ok);
    return ok;
  }

  function collectStep(step) {
    const stepEl = $$('.form-step')[step - 1];
    if (!stepEl) return true;
    const inputs = $$('input, select, textarea', stepEl);
    let ok = true;
    inputs.forEach(inp => { if (!inlineValidate(inp)) ok = false; });
    if (!ok) return false;
    inputs.forEach(inp => { formState.data[inp.name || inp.id] = inp.value; });
    if (calendarState.selectedDate) formState.data['date'] = calendarState.selectedDate.toISOString().split('T')[0];
    if (calendarState.selectedSlot) formState.data['time'] = calendarState.selectedSlot;
    return true;
  }

  function initForm() {
    const form = $('#booking-form');
    if (!form) return;
    // floating label assistance for selects without placeholder
    $$('select', form).forEach(sel => {
      sel.addEventListener('change', () => {
        if (sel.value) sel.classList.add('has-value');
        else sel.classList.remove('has-value');
      });
    });

    // next/back buttons
    on('click', '[data-next]', (e) => {
      const nextTo = Number(e.target.getAttribute('data-next'));
      if (collectStep(formState.step)) showStep(nextTo);
    });
    on('click', '[data-back]', (e) => {
      const backTo = Number(e.target.getAttribute('data-back'));
      showStep(backTo);
    });

    // inline validation
    on('input', '#booking-form input, #booking-form textarea, #booking-form select', (e, target) => {
      inlineValidate(target);
    });

    // submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!collectStep(formState.step)) return;
      const submitBtn = $('button[type="submit"]', form);
      if (submitBtn) submitBtn.classList.add('btn--loading');
      setTimeout(() => {
        if (submitBtn) submitBtn.classList.remove('btn--loading');
        openModal();
        launchConfetti(36);
        showStep(4); // confirmation step
      }, 1200);
    });

    showStep(1);
  }

  // ------------------------------
  // Pricing Toggle + Promo
  // ------------------------------
  function initPricing() {
    const toggle = $('.toggle');
    if (!toggle) return;
    const state = { mode: 'one' };
    const bar = $('.toggle__bar', toggle);
    const btns = $$('.toggle__btn', toggle);
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        state.mode = btn.dataset.mode;
        toggle.dataset.state = state.mode === 'package' ? 'package' : 'one';
        updatePrices(state.mode);
      });
    });

    function updatePrices(mode) {
      $$('[data-price-set]').forEach(card => {
        const price = $('.price--animated', card);
        if (!price) return;
        price.classList.add('price--hidden');
        setTimeout(() => {
          price.textContent = mode === 'package' ? card.dataset.packagePrice || '$299' : card.dataset.onePrice || '$129';
          price.classList.remove('price--hidden');
        }, 200);
      });
    }

    const promo = $('#promo');
    const applyBtn = $('#apply-promo');
    if (promo && applyBtn) {
      applyBtn.addEventListener('click', () => {
        const code = promo.value.trim().toUpperCase();
        const ok = code === 'FOSSE20' || code === 'FOSS20';
        const total = $('#total-price');
        if (ok && total) {
          const badge = document.createElement('div');
          badge.className = 'discount-drop';
          badge.textContent = '-20%';
          total.parentElement.appendChild(badge);
          const val = Number(total.dataset.base || '129');
          total.textContent = '$' + Math.round(val * 0.8);
        } else {
          promo.classList.add('input--invalid');
          setTimeout(() => promo.classList.remove('input--invalid'), 400);
        }
      });
    }
  }

  // ------------------------------
  // Live Search
  // ------------------------------
  function initLiveSearch() {
    const search = $('#search');
    const cards = $$('.workshop-card');
    if (!search || cards.length === 0) return;
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      cards.forEach(card => {
        const txt = [card.dataset.title, card.dataset.trainer, card.dataset.category]
          .filter(Boolean).join(' ').toLowerCase();
        card.style.display = txt.includes(q) ? '' : 'none';
      });
    });
  }

  // Smooth scroll + active nav highlight
  function initNav() {
    const links = $$('.nav-link');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
    if ('IntersectionObserver' in window) {
      const map = new Map(links.map(l => [l.getAttribute('href'), l]));
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const id = '#' + entry.target.id;
          const link = map.get(id);
          if (link) link.classList.toggle('is-active', entry.isIntersecting);
        });
      }, { threshold: 0.5 });
      ['top','workshops','booking'].forEach(id => { const el = document.getElementById(id); if (el) io.observe(el); });
    }
    // Browse buttons trigger all workshops
    $$('.browse-workshops').forEach(btn => btn.addEventListener('click', () => { showAllWorkshops(); pulseTopCards(); }));
  }

  // Render all workshops section
  const WORKSHOP_DATA = [
    { title: 'Python for Data Science', date: 'Jun 15–16, 2023', cat: 'Data', trainer: 'Amit Sharma', img: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Advanced MATLAB Programming', date: 'Jun 20–21, 2023', cat: 'Programming', trainer: 'Priya Patel', img: 'https://images.unsplash.com/photo-1555421689-43cad7100751?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Introduction to Scilab', date: 'Jun 25–26, 2023', cat: 'Computation', trainer: 'Rajesh Kumar', img: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200&auto=format&fit=crop' },
    { title: 'JavaScript Essentials', date: 'Monthly', cat: 'Programming', trainer: 'A. Rao', img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Data Visualization', date: 'Monthly', cat: 'Data', trainer: 'K. Singh', img: 'https://images.unsplash.com/photo-1517148815978-75f6acaaf32c?q=80&w=1200&auto=format&fit=crop' },
  ];

  function showAllWorkshops() {
    const wrap = document.getElementById('all-workshops');
    if (!wrap) return;
    if (!wrap.childElementCount) {
      const frag = document.createDocumentFragment();
      WORKSHOP_DATA.forEach((w, idx) => {
        const col = document.createElement('div');
        col.className = 'col-4';
        col.innerHTML = `
          <article class="card list-card card--hover" data-idx="${idx}">
            <div class="list-thumb"><img src="${w.img}" alt="${w.title}" loading="lazy"></div>
            <div class="list-body">
              <h4 class="list-title">${w.title}</h4>
              <div class="muted">${w.trainer} • ${w.cat}</div>
              <div class="muted">${w.date}</div>
              <div class="wk-card-actions"><a href="#booking" class="btn btn--ripple">Book</a></div>
            </div>
          </article>`;
        frag.appendChild(col);
      });
      wrap.appendChild(frag);
      if (window.gsap && window.ScrollTrigger) {
        gsap.from('.list-card', { y: 18, autoAlpha: 0, duration: .5, ease: 'power2.out', stagger: 0.06, scrollTrigger: { trigger: wrap, start: 'top 90%' } });
      }
    }
    wrap.classList.remove('hidden');
    document.getElementById('show-all')?.classList.add('hidden');
    document.getElementById('workshops')?.scrollIntoView({ behavior: 'smooth' });
  }

  function pulseTopCards() {
    $$('.workshop-grid .card').forEach((c, i) => {
      setTimeout(() => { c.classList.add('card--pulse'); setTimeout(() => c.classList.remove('card--pulse'), 1500); }, i * 120);
    });
  }

  function initAllWorkshopsButton() {
    document.getElementById('show-all')?.addEventListener('click', showAllWorkshops);
  }

  // Details modal for catalog cards
  function initCatalogDetails() {
    on('click', '[data-details]', (e, target) => {
      try {
        const payload = JSON.parse(target.getAttribute('data-details'));
        const body = document.querySelector('#confirm-modal .modal__body');
        if (body && payload) {
          body.innerHTML = `<h3 style="margin:0 0 .4rem">${payload.title}</h3><div class="muted" style="margin-bottom:.6rem">${payload.date || ''}</div><p>${payload.desc || ''}</p>`;
          openModal();
        }
      } catch (err) {
        openModal();
      }
    });
    const newsletter = document.getElementById('newsletter');
    if (newsletter) {
      newsletter.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletter.querySelector('input[type="email"]');
        if (email && email.value) {
          const body = document.querySelector('#confirm-modal .modal__body');
          if (body) { body.innerHTML = `<p>Thanks! We'll keep you posted at <strong>${email.value}</strong>.</p>`; }
          openModal();
          email.value = '';
        }
      });
    }
  }

  // ------------------------------
  // Modal + Confetti
  // ------------------------------
  function openModal() { const m = $('#confirm-modal'); if (!m) return; m.classList.add('is-open'); }
  function closeModal() { const m = $('#confirm-modal'); if (!m) return; m.classList.remove('is-open'); }
  function initModal() {
    const dialog = $('.modal__dialog');
    let lastFocused = null;
    on('click', '[data-close-modal]', closeModal);
    on('click', '#confirm-modal', (e, target) => { if (e.target === target) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    // Focus trap when modal opens
    const modal = $('#confirm-modal');
    if (modal) {
      const observer = new MutationObserver(() => {
        if (modal.classList.contains('is-open')) {
          lastFocused = document.activeElement;
          const focusable = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', modal);
          focusable[0]?.focus();
          function trap(e) {
            if (!modal.classList.contains('is-open')) return;
            if (e.key !== 'Tab') return;
            const focusables = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', modal);
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
          }
          modal.addEventListener('keydown', trap);
        } else if (lastFocused) {
          lastFocused.focus();
        }
      });
      observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
    }
  }

  function launchConfetti(n = 30) {
    const m = $('#confirm-modal');
    if (!m) return;
    let layer = $('.confetti', m);
    if (!layer) { layer = document.createElement('div'); layer.className = 'confetti'; m.appendChild(layer); }
    for (let i = 0; i < n; i++) {
      const piece = document.createElement('i');
      piece.style.setProperty('--tx', (Math.random() * 400 - 200) + 'px');
      piece.style.setProperty('--ty', (Math.random() * 280 - 180) + 'px');
      piece.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      layer.appendChild(piece);
      setTimeout(() => piece.remove(), 900);
    }
  }

  // ------------------------------
  // Initialize all
  // ------------------------------
  function init() {
    initTheme();
    initReveal();
    initParticles();
    initButtons();
    initNav();
    initCalendar();
    initForm();
    initPricing();
    initLiveSearch();
    initCatalogDetails();
    initAllWorkshopsButton();
    initModal();
    initTilt();
    // Debounced resize for particles
    let raf;
    window.addEventListener('resize', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(initParticles); });

    // Sticky CTA visibility
    const sticky = document.querySelector('.cta-sticky');
    const booking = document.getElementById('booking');
    if (sticky && booking && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          // Hide sticky CTA when booking section is in view or modal is open
          const modalOpen = document.getElementById('confirm-modal')?.classList.contains('is-open');
          sticky.classList.toggle('is-hidden', entry.isIntersecting || modalOpen);
        });
      }, { threshold: 0.15 });
      io.observe(booking);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();


