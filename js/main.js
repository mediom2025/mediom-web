// mediom — shared front-end behavior

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
