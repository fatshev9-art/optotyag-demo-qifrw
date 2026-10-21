/* Скин E «Волокно»: каталог открывается и по наведению, вкладки главной, фильтр-предложение категории
   (поповеры значений, «Ещё параметры», переключатель «Плотно»), липкая панель заказа на странице товара.
   Без библиотек. Ничего не падает, если нужного элемента на странице нет. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };
  var desk = window.matchMedia ? window.matchMedia('(min-width: 1180px)') : { matches: true };
  var hov = window.matchMedia ? window.matchMedia('(hover: hover)') : { matches: true };

  /* ---------- мега-слой каталога: наведение открывает, уход мыши закрывает ---------- */
  var catItem = $('.nav__item--cat');
  var catBtn = catItem ? $('button.nav__cat', catItem) : null;
  if (catItem && catBtn) {
    var tIn = 0;
    var tOut = 0;
    var byHover = false;
    var isOpen = function () { return catBtn.getAttribute('aria-expanded') === 'true'; };
    var canHover = function () { return desk.matches && hov.matches; };
    catItem.addEventListener('mouseenter', function () {
      if (!canHover()) return;
      clearTimeout(tOut);
      if (isOpen()) return;
      tIn = setTimeout(function () {
        if (!isOpen()) { byHover = true; catBtn.click(); }
      }, 140);
    });
    catItem.addEventListener('mouseleave', function () {
      clearTimeout(tIn);
      if (!canHover()) return;
      tOut = setTimeout(function () {
        if (byHover && isOpen()) catBtn.click();
        byHover = false;
      }, 260);
    });
    // настоящий клик по кнопке, пока слой открыт наведением, оставляет его открытым
    catBtn.addEventListener('click', function (e) {
      if (e.isTrusted && byHover) { e.stopImmediatePropagation(); byHover = false; }
    }, true);
  }

  /* ---------- вкладки ---------- */
  $$('[data-e-tabs]').forEach(function (box) {
    var tabs = $$('[role="tab"]', box);
    var panes = $$('[role="tabpanel"]', box);
    if (!tabs.length || tabs.length !== panes.length) return;
    box.classList.add('is-js');
    var select = function (i, focus) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      panes.forEach(function (p, k) { p.hidden = k !== i; });
      if (focus) tabs[i].focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        var n = tabs.length;
        var k = i;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') k = (i + 1) % n;
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') k = (i - 1 + n) % n;
        else if (e.key === 'Home') k = 0;
        else if (e.key === 'End') k = n - 1;
        else return;
        e.preventDefault();
        select(k, true);
      });
    });
    select(0);
  });

  /* ---------- фильтр-предложение на странице категории ---------- */
  var filterBox = $('[data-e-filter]');
  var gridWrap = $('[data-e-grid]');
  if (filterBox && gridWrap) {
    var cards = $$('.e-pc', gridWrap);
    var counter = $('[data-e-count]', filterBox);
    var emptyMsg = $('[data-e-empty]', gridWrap);
    var state = {};
    var openChip = null;

    var apply = function () {
      var shown = 0;
      cards.forEach(function (c) {
        var f = {};
        try { f = JSON.parse(c.getAttribute('data-f') || '{}') || {}; } catch (err) { f = {}; }
        var ok = Object.keys(state).every(function (k) { return state[k] === '' || f[k] === state[k]; });
        var li = c.closest('li');
        if (li) li.hidden = !ok;
        if (ok) shown++;
      });
      if (counter) counter.textContent = String(shown);
      if (emptyMsg) emptyMsg.hidden = shown > 0;
    };

    var closePop = function (focusBack) {
      if (!openChip) return;
      var chip = openChip;
      var pop = $('.e-pop', chip);
      var btn = $('button', chip);
      if (pop) pop.hidden = true;
      chip.classList.remove('is-open');
      if (btn) { btn.setAttribute('aria-expanded', 'false'); if (focusBack) btn.focus(); }
      doc.body.classList.remove('e-pop-open');
      openChip = null;
    };
    var openPop = function (chip) {
      if (openChip && openChip !== chip) closePop(false);
      var pop = $('.e-pop', chip);
      var btn = $('button', chip);
      if (!pop || !btn) return;
      pop.hidden = false;
      chip.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      doc.body.classList.add('e-pop-open');
      openChip = chip;
      var cur = $('button.is-on', pop) || $('button', pop);
      if (cur) setTimeout(function () { cur.focus(); }, 30);
    };

    $$('.e-chip', filterBox).forEach(function (chip) {
      var idx = chip.getAttribute('data-facet');
      var btn = $('button', chip);
      var pop = $('.e-pop', chip);
      var val = $('.e-val', chip);
      if (!btn || !pop) return;
      btn.addEventListener('click', function () {
        if (openChip === chip) closePop(false); else openPop(chip);
      });
      var opts = $$('button[role="option"]', pop);
      opts.forEach(function (o) {
        o.addEventListener('click', function () {
          var v = o.getAttribute('data-v') || '';
          state[idx] = v;
          opts.forEach(function (x) {
            var on = x === o;
            x.classList.toggle('is-on', on);
            x.setAttribute('aria-selected', on ? 'true' : 'false');
          });
          if (val) {
            val.textContent = v === '' ? 'не важно' : (o.getAttribute('data-t') || v);
            val.classList.remove('is-new');
            void val.offsetWidth;
            val.classList.add('is-new');
          }
          closePop(true);
          apply();
        });
        o.addEventListener('keydown', function (e) {
          var k = opts.indexOf(o);
          if (e.key === 'ArrowDown') { e.preventDefault(); opts[(k + 1) % opts.length].focus(); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); opts[(k - 1 + opts.length) % opts.length].focus(); }
        });
      });
    });

    // дополнительные параметры: группы кнопок, выбор одного значения на параметр
    $$('.e-xp__g', filterBox).forEach(function (g) {
      var idx = g.getAttribute('data-facet');
      var btns = $$('button', g);
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          var on = b.getAttribute('aria-pressed') === 'true';
          btns.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
          if (on) { state[idx] = ''; } else { b.setAttribute('aria-pressed', 'true'); state[idx] = b.getAttribute('data-v') || ''; }
          apply();
        });
      });
    });

    var more = $('[data-e-more]', filterBox);
    var xp = $('#e-xp', filterBox);
    if (more && xp) {
      more.addEventListener('click', function () {
        var open = more.getAttribute('aria-expanded') === 'true';
        more.setAttribute('aria-expanded', open ? 'false' : 'true');
        xp.hidden = open;
      });
    }

    var dense = $('[data-e-dense]', filterBox);
    if (dense) {
      dense.hidden = false;
      try { if (localStorage.getItem('wpg-e-dense') === '1') { gridWrap.classList.add('is-dense'); dense.setAttribute('aria-pressed', 'true'); dense.textContent = 'Крупно'; } } catch (err) { /* хранилище недоступно */ }
      dense.addEventListener('click', function () {
        var on = !gridWrap.classList.contains('is-dense');
        gridWrap.classList.toggle('is-dense', on);
        dense.setAttribute('aria-pressed', on ? 'true' : 'false');
        dense.textContent = on ? 'Крупно' : 'Плотно';
        try { localStorage.setItem('wpg-e-dense', on ? '1' : '0'); } catch (err) { /* хранилище недоступно */ }
      });
    }

    doc.addEventListener('click', function (e) {
      if (openChip && !e.target.closest('.e-chip')) closePop(false);
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && openChip) closePop(true);
    });
  }

  /* ---------- липкая панель заказа на странице товара ---------- */
  var stick = $('[data-e-stick]');
  if (stick) {
    var onScroll = function () { stick.classList.toggle('is-on', (window.scrollY || root.scrollTop) > 600); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
