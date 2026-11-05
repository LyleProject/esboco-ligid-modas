(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  /* ---- Título: revela palavra por palavra ---- */
  let wi = 0;
  const splitWords = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((t) => {
          if (!t.trim()) { frag.append(t); return; }
          const w = document.createElement('span');
          w.className = 'w';
          const s = document.createElement('span');
          s.textContent = t;
          s.style.setProperty('--i', wi++);
          w.append(s);
          frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) splitWords(n);
    });
  };
  $$('.split').forEach(splitWords);

  /* ---- Revelar ao entrar na tela ---- */
  let ioFired = false;
  const revealAll = () => {
    $$('.reveal, .split, .reveal-img').forEach((el) => el.classList.add('in'));
    $$('.count').forEach((c) => { c.textContent = parseFloat(c.dataset.to).toFixed(+c.dataset.dec || 0).replace('.', ','); });
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      ioFired = true;
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        if (e.target.querySelector('.count')) countUp(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.18 });
    $$('.reveal, .split, .reveal-img').forEach((el) => io.observe(el));
    /* se o navegador nunca avisar (visualizador limitado), mostra tudo */
    setTimeout(() => { if (!ioFired) revealAll(); }, 3000);
  } else revealAll();

  /* ---- Números contando ---- */
  function countUp(root) {
    $$('.count', root).forEach((el) => {
      const to = parseFloat(el.dataset.to), dec = +el.dataset.dec || 0;
      if (reduce) { el.textContent = to.toFixed(dec).replace('.', ','); return; }
      const t0 = performance.now(), dur = 1600;
      const tick = (t) => {
        const p = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
        el.textContent = (to * e).toFixed(dec).replace('.', ',');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---- Manifesto: palavras acendem ao rolar ---- */
  const man = $('[data-lit]');
  let words = [];
  if (man) {
    man.innerHTML = man.textContent.trim().split(/\s+/)
      .map((w) => `<span class="lw${/voc|amor|linda|Ligid/i.test(w) ? ' pk' : ''}">${w}</span>`).join(' ');
    words = $$('.lw', man);
  }

  /* ---- Fotos grandes com paralaxe ---- */
  const feats = $$('.feat-img img, .destaque-img img');

  /* ---- Cabeçalho + rolagem (um único loop) ---- */
  const header = $('.header');
  const heroScript = $('.hero-script');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    header.classList.toggle('solid', y > 40);

    if (heroScript && y < vh * 1.2 && !reduce) heroScript.style.transform = `translate3d(0,${y * -0.12}px,0)`;

    if (man && words.length) {
      const r = man.getBoundingClientRect();
      const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1);
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < n || reduce));
    }

    /* paralaxe suave dentro das fotos grandes (só computador) */
    if (!reduce && !touch && innerWidth > 900) {
      feats.forEach((img) => {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const p = clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1);
        img.style.setProperty('--py', `${(p * -36).toFixed(1)}px`);
      });
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---- Paralaxe do mouse no hero (só com mouse) ---- */
  const hero = $('.hero');
  if (hero && !touch && !reduce) {
    const items = $$('[data-depth]', hero);
    hero.addEventListener('pointermove', (e) => {
      const x = e.clientX - innerWidth / 2, y = e.clientY - innerHeight / 2;
      items.forEach((el) => {
        const d = parseFloat(el.dataset.depth);
        el.style.setProperty('--px', `${x * d}px`);
        el.style.setProperty('--py', `${y * d}px`);
      });
    });
  }

  /* ---- Botões magnéticos ---- */
  if (!touch && !reduce) {
    $$('.magnetic').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px,${(e.clientY - r.top - r.height / 2) * 0.3}px) scale(1.03)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* ---- Menu do celular ---- */
  const burger = $('.burger'), menu = $('#menu');
  const setMenu = (open) => {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* ---- Escolha da loja (WhatsApp) ---- */
  const dlg = $('#wa-dialog');
  $$('[data-open-wa]').forEach((b) => b.addEventListener('click', () => dlg.showModal()));
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
})();
