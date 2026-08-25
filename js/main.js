// mediom — shared front-end behavior

(() => {
  /* intro loader — only plays in full on the first page of a visit;
     later page navigations within the same session skip straight past it
     so browsing the site doesn't feel like reloading an app each click */
  const loader = document.querySelector('.site-loader');
  if (!loader) return;
  const alreadyVisited = sessionStorage.getItem('mediom-visited');
  if (alreadyVisited) {
    loader.classList.add('is-skipped');
    return;
  }
  sessionStorage.setItem('mediom-visited', '1');
  const MIN_DISPLAY_MS = 700;
  const shown = Date.now();
  const hide = () => {
    const elapsed = Date.now() - shown;
    const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
    setTimeout(() => {
      loader.classList.add('is-hidden');
      setTimeout(() => loader.classList.add('is-skipped'), 550);
    }, wait);
  };
  if (document.readyState === 'complete') {
    hide();
  } else {
    window.addEventListener('load', hide);
    setTimeout(hide, 2200); // safety fallback if load never fires
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  /* mobile nav toggle */
  const toggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  if (toggle && mobileNav) {
    const closeBtn = mobileNav.querySelector('.close-btn');
    const openNav = () => {
      mobileNav.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
    };
    const closeNav = () => {
      mobileNav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    toggle.addEventListener('click', openNav);
    closeBtn && closeBtn.addEventListener('click', closeNav);
    mobileNav.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', closeNav)
    );
  }

  /* interactive hero lines — a gentle cursor-parallax on the two hero
     background curves, plus a soft antique-gold glow and short green
     trail that follow the pointer (idly drifting when it's not over the
     hero). Only present on the homepage; respects reduced-motion. */
  const hero = document.querySelector('.hero');
  const heroLine1 = document.getElementById('hero-line1');
  const heroLine2 = document.getElementById('hero-line2');
  const heroTrailG = document.getElementById('hero-trail');
  const heroGlow = document.getElementById('hero-cursor-glow');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (hero && heroLine1 && heroLine2 && heroTrailG && heroGlow && !prefersReducedMotion) {
    const TRAIL_LEN = 9;
    const trailDots = [];
    const trailHistory = [];
    for (let i = 0; i < TRAIL_LEN; i++) {
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('class', 'hero-trail-dot');
      dot.setAttribute('r', 0);
      dot.style.opacity = 0;
      heroTrailG.appendChild(dot);
      trailDots.push(dot);
      trailHistory.push({ x: 720, y: 400 });
    }

    let rect = hero.getBoundingClientRect();
    const updateRect = () => { rect = hero.getBoundingClientRect(); };
    window.addEventListener('resize', updateRect);

    const toViewBox = (clientX, clientY) => ({
      x: (clientX - rect.left) / rect.width * 1440,
      y: (clientY - rect.top) / rect.height * 800,
    });

    let hasPointer = false;
    let target = { x: 720, y: 400 };
    hero.addEventListener('pointermove', (e) => {
      hasPointer = true;
      target = toViewBox(e.clientX, e.clientY);
    });
    hero.addEventListener('pointerleave', () => { hasPointer = false; });

    let t = 0;
    const idleTarget = () => {
      t += 0.006;
      return { x: 720 + Math.sin(t) * 260, y: 400 + Math.cos(t * 0.72) * 168 };
    };

    const lerp = (a, b, n) => a + (b - a) * n;
    const pointer = { x: 720, y: 400 };
    let prevPointer = { x: 720, y: 400 };

    const frame = () => {
      const idle = idleTarget();
      pointer.x = lerp(pointer.x, hasPointer ? target.x : idle.x, 0.07);
      pointer.y = lerp(pointer.y, hasPointer ? target.y : idle.y, 0.07);
      const speed = Math.hypot(pointer.x - prevPointer.x, pointer.y - prevPointer.y);
      prevPointer = { x: pointer.x, y: pointer.y };

      trailHistory.unshift({ x: pointer.x, y: pointer.y });
      trailHistory.length = TRAIL_LEN;
      trailDots.forEach((dot, i) => {
        const p = trailHistory[i];
        const frac = 1 - i / TRAIL_LEN;
        dot.setAttribute('cx', p.x);
        dot.setAttribute('cy', p.y);
        dot.setAttribute('r', Math.max(0, frac * 4.2));
        dot.style.opacity = frac * 0.36;
      });
      heroGlow.setAttribute('cx', pointer.x);
      heroGlow.setAttribute('cy', pointer.y);
      const boost = Math.min(1, speed / 30);
      heroGlow.setAttribute('r', 64 + boost * 46);
      heroGlow.style.opacity = 0.4 + boost * 0.26;

      // translate only — no rotation, keeps the motion soft and calm
      const dx = (pointer.x - 720) / 720;
      const dy = (pointer.y - 400) / 400;
      heroLine1.setAttribute('transform', `translate(${dx * 46},${dy * 32})`);
      heroLine2.setAttribute('transform', `translate(${dx * -78},${dy * -56})`);

      requestAnimationFrame(frame);
    };

    updateRect();
    requestAnimationFrame(frame);
  }

  /* scroll reveal */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* generic chip-filter: wires up any [data-*-chips] row of .chip elements
     against sibling items carrying the matching data-*-category attribute */
  function initChipFilter(rowSelector, itemSelector, categoryProp) {
    const row = document.querySelector(rowSelector);
    if (!row) return;
    const chips = row.querySelectorAll('.chip');
    const items = document.querySelectorAll(itemSelector);
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const cat = chip.dataset.filter;
        items.forEach(item => {
          const show = cat === 'all' || item.dataset[categoryProp] === cat;
          item.style.display = show ? '' : 'none';
        });
      });
    });
  }
  initChipFilter('[data-filter-chips]', '[data-work-category]', 'workCategory');
  initChipFilter('[data-news-chips]', '[data-news-category]', 'newsCategory');

  /* contact form radio pills */
  document.querySelectorAll('.radio-group').forEach(group => {
    const opts = group.querySelectorAll('.radio-opt');
    opts.forEach(opt => {
      opt.addEventListener('click', () => {
        opts.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        const input = opt.querySelector('input');
        if (input) input.checked = true;
      });
    });
  });

  /* contact form validation + mailto handoff (no backend is wired up yet —
     this builds a pre-filled email in the visitor's own mail client rather
     than silently discarding the submission) */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const form = document.querySelector('#contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      let firstInvalid = null;

      form.querySelectorAll('[required]').forEach(field => {
        const wrapper = field.closest('.field') || field.closest('.checkbox-field');
        let filled;
        if (field.type === 'checkbox') {
          filled = field.checked;
        } else if (field.type === 'email') {
          filled = field.value.trim() !== '' && EMAIL_RE.test(field.value.trim());
        } else {
          filled = field.value.trim() !== '';
        }
        if (!filled) {
          valid = false;
          wrapper && wrapper.classList.add('has-error');
          field.setAttribute('aria-invalid', 'true');
          if (!firstInvalid) firstInvalid = field;
        } else {
          wrapper && wrapper.classList.remove('has-error');
          field.removeAttribute('aria-invalid');
        }
      });

      if (!valid) {
        firstInvalid && firstInvalid.focus();
        return;
      }

      const get = (name) => (form.elements[name] ? form.elements[name].value.trim() : '');
      const typeLabel = get('type') === 'other' ? 'その他' : '案件のご相談';
      const budgetMap = {
        '~100': '〜100万円', '100-300': '100〜300万円', '300-500': '300〜500万円',
        '500+': '500万円〜', 'undecided': '未定', '': '未選択',
      };
      const subject = `【mediomサイトより】${typeLabel} - ${get('company')}様`;
      const body = [
        `お問い合わせ種別: ${typeLabel}`,
        `会社名: ${get('company')}`,
        `お名前: ${get('name')}`,
        `メール: ${get('email')}`,
        `ご予算: ${budgetMap[get('budget')] ?? get('budget')}`,
        '',
        'ご相談内容:',
        get('message'),
      ].join('\n');
      const mailto = `mailto:hello@mediom.jp?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      form.hidden = true;
      const thanks = document.querySelector('#form-thanks');
      if (thanks) thanks.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.location.href = mailto;
    });
  }
});
