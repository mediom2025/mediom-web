// mediom — shared front-end behavior

/* walking cat: the clip is one stride held in place, cat facing right. The cat covers
   11.38 px of the 640 px source frame per 24 fps frame, so moving the element at that rate
   (times the playback rate) keeps its feet planted. It walks a rule from the left end,
   sets --walk on the rule as it goes, and fades once its nose passes the far end. */
function makeWalker(cat, rule, { rate = 2, onDone } = {}) {
  const SRC_SPEED = 11.382 * 24 / 640;                    // source widths per second
  const TAIL = 0.06, PAW = 0.86, NOSE = 0.94, FEET = 0.958; // fractions of the clip box
  let raf = 0, t0 = 0, on = false;
  const frame = (now) => {
    const host = cat.offsetParent.getBoundingClientRect(), r = rule.getBoundingClientRect();
    const cw = cat.offsetWidth, ch = cat.offsetHeight;
    const x0 = r.left - host.left, w = r.width;
    const left = x0 - TAIL * cw + (now - t0) / 1000 * SRC_SPEED * rate * cw;
    const fadeIn = Math.min(1, (now - t0) / 400);
    const fadeOut = 1 - Math.min(1, Math.max(0, (left + NOSE * cw - (x0 + w)) / (0.55 * cw)));
    cat.style.transform = `translate(${left}px, ${r.top - host.top - FEET * ch}px)`;
    cat.style.opacity = (fadeIn * fadeOut).toFixed(3);
    rule.style.setProperty('--walk', Math.min(1, Math.max(0, (left + PAW * cw - x0) / w)).toFixed(4));
    if (fadeOut > 0) { raf = requestAnimationFrame(frame); return; }
    cat.pause();
    if (onDone) onDone();
  };
  return {
    start() {
      if (on) return;
      on = true;
      cat.currentTime = 0;
      cat.playbackRate = rate;
      cat.play().then(() => {
        cat.playbackRate = rate;
        t0 = performance.now();
        raf = requestAnimationFrame(frame);
      }).catch(() => { if (onDone) onDone(); });
    },
    reset() {
      cancelAnimationFrame(raf);
      cat.pause();
      cat.style.opacity = 0;
      rule.style.setProperty('--walk', 0);
      on = false;
    }
  };
}

(() => {
  /* intro loader — only on the first page of a visit; later navigations within the
     same session skip it. The cat walks the line under the logo, then the loader lifts.
     A click skips it, and it never stays longer than 4 s. */
  const loader = document.querySelector('.site-loader');
  if (!loader) return;
  let alreadyVisited = false;
  try {
    alreadyVisited = !!sessionStorage.getItem('mediom-visited');
    sessionStorage.setItem('mediom-visited', '1');
  } catch (e) { /* storage blocked: just play the loader */ }
  if (alreadyVisited) {
    loader.classList.add('is-skipped');
    return;
  }
  let gone = false;
  const hide = () => {
    if (gone) return;
    gone = true;
    loader.classList.add('is-hidden');
    setTimeout(() => loader.classList.add('is-skipped'), 400);
  };
  loader.addEventListener('click', hide);
  const cat = loader.querySelector('.walk-cat');
  const track = loader.querySelector('.loader-track');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (cat && track && !still) {
    const walker = makeWalker(cat, track, { rate: 3, onDone: () => setTimeout(hide, 150) });
    if (cat.readyState >= 3) walker.start();
    else cat.addEventListener('canplay', () => walker.start(), { once: true });
    setTimeout(hide, 4000);
  } else {
    // no cat: wait for the DOM, not every image — the loader is a greeting, not a gate
    const later = () => setTimeout(hide, 400);
    if (document.readyState !== 'loading') later();
    else document.addEventListener('DOMContentLoaded', later, { once: true });
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* hero: while the tall section is pinned, publish scroll progress as --p */
  const hero = document.querySelector('.hero');
  if (hero && !reduce) {
    let queued = false;
    const pin = hero.querySelector('.hero-pin');
    const update = () => {
      queued = false;
      const stickTop = parseFloat(getComputedStyle(pin).top) || 0;
      const travel = Math.max(1, hero.offsetHeight - pin.offsetHeight);
      const p = Math.min(1, Math.max(0, (stickTop - hero.getBoundingClientRect().top) / travel));
      hero.style.setProperty('--p', p.toFixed(4));
    };
    const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  /* footer: the cat walks the rule once the footer is in view; it resets when the footer leaves */
  const footCat = document.querySelector('.foot-cat');
  const footRule = document.querySelector('.foot-bottom');
  if (footCat && footRule && !reduce && 'IntersectionObserver' in window) {
    const walker = makeWalker(footCat, footRule, { rate: 2 });
    new IntersectionObserver(([e]) => {
      if (e.intersectionRatio >= 0.6) walker.start();
      else if (!e.isIntersecting) walker.reset();
    }, { threshold: [0, 0.6] }).observe(document.querySelector('.site-footer'));
  }

  /* scroll reveal: blocks rise in as they enter the viewport; siblings are
     staggered. Skipped entirely when the visitor prefers reduced motion. */
  if (!reduce) {
    const SELECTOR = [
      'main .sechead', '.pillar', '.wk .meta', '.wk .media-col', '.devices .phone',
      '.about-top > *', '.cols > div', '.about-more', '.nrow',
      '.cta-band .container > *', '.svc-detail > div', '.steps > div',
      '.uses > div', '.tl > div', '.ax-intro > *', '.aid', '.info-table tr', '.filters'
    ].join(',');
    const targets = [...document.querySelectorAll(SELECTOR)];
    targets.forEach(el => {
      const sibs = [...el.parentElement.children].filter(c => targets.includes(c));
      el.style.setProperty('--d', Math.min(sibs.indexOf(el), 5) * 90 + 'ms');
      el.setAttribute('data-reveal', el.matches('.devices .phone') ? 'side' : '');
    });
    document.documentElement.classList.add('reveal-on');
    // reveal anything whose top has reached the lower part of the screen,
    // including blocks a fast scroll or an anchor jump skipped past
    let pending = targets;
    let ticking = false;
    const check = () => {
      ticking = false;
      const line = window.innerHeight * 0.9;
      pending = pending.filter(el => {
        if (el.getBoundingClientRect().top < line) { el.classList.add('is-in'); return false; }
        return true;
      });
      if (!pending.length) window.removeEventListener('scroll', onScroll);
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(check); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    check();
  }

  /* mobile menu: the header button opens a panel under the sticky bar */
  const toggle = document.querySelector('.nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  if (toggle && mobileNav) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
      mobileNav.hidden = !open;
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  /* chip filter: items carry a space-separated list of categories,
     e.g. data-category="web branding" */
  document.querySelectorAll('[data-filter-chips]').forEach(row => {
    const scope = row.closest('section') || document;
    const chips = row.querySelectorAll('.chip');
    const items = scope.querySelectorAll('[data-category]');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
        chip.classList.add('active');
        chip.setAttribute('aria-pressed', 'true');
        const cat = chip.dataset.filter;
        items.forEach(item => {
          item.hidden = !(cat === 'all' || item.dataset.category.split(' ').includes(cat));
        });
        // keep the left/right alternation readable after filtering
        let n = 0;
        items.forEach(item => {
          if (item.hidden || !item.classList.contains('wk')) return;
          item.classList.toggle('rev', n % 2 === 1);
          n++;
        });
      });
    });
  });

  /* live samples on the works rows */
  const sleep = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  document.querySelectorAll('.demo-fit').forEach(fit => {
    const inner = fit.firstElementChild;
    const scale = () => { inner.style.transform = 'scale(' + (fit.clientWidth / 640) + ')'; };
    scale();
    if ('ResizeObserver' in window) new ResizeObserver(scale).observe(fit);
  });
  const NOTES = [
    '需要と競合を3つの軸で\n整理しています…\n候補は2案に絞れそう',
    '必要な手続きと表示を\n確認しています…\n要確認：2件',
    '配送手段を3案で比較…\n費用・日数・補償の表',
    '損益を3つのシナリオで\n試算しています…\n前提は一覧に',
    '紹介文の案を2本…\n現地の言い回しに直す',
    '小さく試す計画…\n予算と撤退基準を付ける'
  ];
  const type = async (el, text) => {
    if (reduce) { el.textContent = text; return; }
    el.textContent = '';
    for (const ch of text) { el.textContent += ch; await sleep(18); }
  };
  const runOffice = async (root) => {
    const ph = [...root.querySelectorAll('.do-ph li')];
    const desks = [...root.querySelectorAll('.do-desk')];
    const avs = [...root.querySelectorAll('.do-av')];
    const seals = [...root.querySelectorAll('.do-seals span')];
    const memo = root.querySelector('.do-memo');
    const setPh = i => ph.forEach((li, k) => { li.className = k < i ? 'past' : k === i ? 'now' : ''; });
    desks.forEach(d => { d.className = 'do-desk'; d.querySelector('.do-paper').textContent = ''; d.querySelector('.do-lamp').textContent = '待機'; });
    seals.forEach(x => x.classList.remove('on'));
    memo.classList.remove('on');
    avs.forEach(a => a.classList.remove('busy'));
    setPh(0); await sleep(500);
    setPh(1); avs[0].classList.add('busy'); await sleep(700); avs[0].classList.remove('busy');
    setPh(2);
    await Promise.all(desks.map(async (d, i) => {
      await sleep(i * 160);
      d.classList.add('on'); avs[i + 1].classList.add('busy'); d.querySelector('.do-lamp').textContent = '執筆中';
      await type(d.querySelector('.do-paper'), NOTES[i]);
      d.classList.remove('on'); d.classList.add('done'); avs[i + 1].classList.remove('busy'); d.querySelector('.do-lamp').textContent = '提出済み';
    }));
    setPh(3);
    for (const x of seals) { await sleep(380); x.classList.add('on'); }
    await sleep(400); setPh(4); avs[0].classList.add('busy');
    await sleep(700); memo.classList.add('on'); avs[0].classList.remove('busy');
    setPh(5);
  };
  document.querySelectorAll('.demo-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const root = document.getElementById(btn.dataset.target);
      if (!root) return;
      btn.disabled = true;
      try { await runOffice(root); }
      finally { btn.disabled = false; btn.firstChild.textContent = 'もう一度動かす '; }
    });
  });

  /* contact form: preselect the inquiry type from ?type= (e.g. from the AX page) */
  const preset = new URLSearchParams(location.search).get('type');
  if (preset) {
    const r = document.querySelector(`.radio-group input[value="${CSS.escape(preset)}"]`);
    if (r) r.checked = true;
  }

  /* contact form: validate, then post to FormSubmit, which emails the
     entry to info@mediom.biz (FormSubmit sends a one-time activation mail
     to that address on the first submission) */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const form = document.querySelector('#contact-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;
      let firstInvalid = null;

      form.querySelectorAll('[required]').forEach(field => {
        const wrapper = field.closest('.field');
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
      const typeLabels = { project: '制作のご相談', ax: 'AX支援のご相談', other: 'その他' };
      const typeLabel = typeLabels[get('type')] || 'その他';
      const budgetMap = {
        '~100': '〜100万円', '100-300': '100〜300万円', '300-500': '300〜500万円',
        '500+': '500万円〜', 'undecided': '未定', '': '未選択',
      };
      const payload = {
        _subject: `【mediomサイトより】${typeLabel} - ${get('company')}様`,
        _template: 'table',
        _captcha: 'false',
        _replyto: get('email'),
        _honey: get('_honey'),
        'お問い合わせ種別': typeLabel,
        '会社名': get('company'),
        'お名前': get('name'),
        'メール': get('email'),
        'ご予算': budgetMap[get('budget')] ?? get('budget'),
        'ご相談内容': get('message'),
      };

      const btn = form.querySelector('.btn-submit');
      const error = document.querySelector('#form-error');
      const label = btn.textContent;
      btn.disabled = true;
      btn.textContent = '送信中…';
      if (error) error.hidden = true;
      try {
        const res = await fetch('https://formsubmit.co/ajax/info@mediom.biz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || String(data.success) !== 'true') throw new Error(data.message || String(res.status));
        form.hidden = true;
        const thanks = document.querySelector('#form-thanks');
        if (thanks) {
          thanks.hidden = false;
          // bring the confirmation into view (scroll-padding-top keeps it clear of the sticky header)
          thanks.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
          thanks.focus({ preventScroll: true });
        }
      } catch (err) {
        if (error) { error.hidden = false; error.focus(); }
      } finally {
        btn.disabled = false;
        btn.textContent = label;
      }
    });
  }
});
