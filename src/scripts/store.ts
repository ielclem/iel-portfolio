import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger, SplitText);

// ---- Tuning --------------------------------------------------------------
const FRAMES = 8;              // frames in walk-sprite.webp
const PX_PER_FRAME = 70;       // horizontal scroll distance per walk frame in the aisles
const STOREFRONT_LENGTH = 2.6; // storefront scroll length, in screen heights
const BOIL_MS = 140;           // how often hand-drawn lines wobble
const IDLE_AFTER_MS = 220;     // stop scrolling this long and the character switches to the idle pose
// --------------------------------------------------------------------------

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// The sprite holds the 8 walk frames and then the idle pose (frame 8).
const IDLE_FRAME = FRAMES;
const placeFrame = (el: HTMLElement, f: number) => { el.style.backgroundPositionX = `${(f * 100) / FRAMES}%`; };

// Walking shows a frame for the scroll position; when scrolling stops, the character idles.
const idleTimers = new WeakMap<HTMLElement, number>();
const setFrame = (el: HTMLElement, i: number) => {
  placeFrame(el, ((i % FRAMES) + FRAMES) % FRAMES);
  window.clearTimeout(idleTimers.get(el));
  idleTimers.set(el, window.setTimeout(() => placeFrame(el, IDLE_FRAME), IDLE_AFTER_MS));
};
const setIdle = (el: HTMLElement | null) => el && placeFrame(el, IDLE_FRAME);
// Start idle (and stay idle for reduced motion, where nothing walks).
setIdle(document.getElementById('sf-walker'));
setIdle(document.getElementById('aisle-walker'));

// ---- Boiling lines: re-seed the noise filter so drawings feel hand-animated
let boilTimer: number | undefined;
function startBoil() {
  const turb = document.querySelector('#boil feTurbulence');
  if (!turb || boilTimer || reduceMotion.matches) return;
  let seed = 1;
  boilTimer = window.setInterval(() => {
    seed = (seed % 3) + 1;
    turb.setAttribute('seed', String(seed));
  }, BOIL_MS);
}
function stopBoil() {
  window.clearInterval(boilTimer);
  boilTimer = undefined;
}

// ---- Falling petals on the storefront --------------------------------------
// Drawn on a canvas: each petal drifts down at an angle, sways, spins and
// flips as it falls. Scrolling adds a little gust. Paused when off-screen.
const PETAL_COLORS = ['#F2B8B0', '#EBA39A', '#DA8868', '#F6CFC8'];
const PETAL_ANGLE = 0.45;      // wind: sideways drift per unit of fall (≈24°)
const FADE_START = 0.5;        // petals start fading at this fraction of the screen height
type Petal = { x: number; y: number; size: number; speed: number; sway: number; phase: number; spin: number; rot: number; flip: number; color: string };

let petalStop: (() => void) | null = null;
function startPetals() {
  const canvas = document.getElementById('sf-petals') as HTMLCanvasElement | null;
  if (!canvas || petalStop || reduceMotion.matches) return;
  const ctx = canvas.getContext('2d')!;
  let w = 0, h = 0, dpr = 1, raf = 0, visible = true, last = performance.now();
  let petals: Petal[] = [];

  const make = (anywhere: boolean): Petal => {
    const size = gsap.utils.random(10, 20);
    return {
      // start along the top or off the left edge, since the wind blows left to right
      x: anywhere ? Math.random() * w : (Math.random() < 0.7 ? Math.random() * w - w * 0.3 : -20),
      y: anywhere ? Math.random() * h : -20 - Math.random() * h * 0.3,
      size,
      speed: gsap.utils.random(28, 60) * (size / 14),      // px per second, bigger falls faster
      sway: gsap.utils.random(14, 34),
      phase: Math.random() * Math.PI * 2,
      spin: gsap.utils.random(-1.6, 1.6),
      rot: Math.random() * Math.PI * 2,
      flip: Math.random() * Math.PI * 2,
      color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
    };
  };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    const count = Math.round(gsap.utils.clamp(12, 34, w / 45));
    petals = Array.from({ length: count }, () => make(true));
  };

  const draw = (p: Petal) => {
    // Fade out over the lower part of the screen, fully gone at the bottom edge.
    const alpha = gsap.utils.clamp(0, 1, (h - p.y) / (h * (1 - FADE_START)));
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(1, 0.35 + 0.65 * Math.abs(Math.cos(p.flip))); // flipping in 3D
    const s = p.size;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.9, -s * 0.6, s * 0.7, s * 0.6, 0, s);
    ctx.bezierCurveTo(-s * 0.7, s * 0.6, -s * 0.9, -s * 0.6, -s * 0.15, -s * 0.85);
    ctx.lineTo(0, -s * 0.55); // the little notch at the tip of a cherry petal
    ctx.closePath();
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = 'rgba(30,26,23,.55)';
    ctx.stroke();
    ctx.restore();
  };

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!visible) return;
    const gust = gsap.utils.clamp(-1, 3, (lenis?.velocity ?? 0) / 20); // scrolling pushes them along
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];
      p.phase += dt * 1.3;
      p.flip += dt * 2.2;
      p.rot += p.spin * dt;
      const fall = p.speed * dt * (1 + Math.abs(gust) * 0.6);
      p.y += fall;
      p.x += fall * PETAL_ANGLE + Math.cos(p.phase) * p.sway * dt + gust * 40 * dt;
      if (p.y > h + 30 || p.x > w + 40) petals[i] = make(false);
      draw(petals[i]);
    }
  };

  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; last = performance.now(); });
  io.observe(canvas);
  const onVis = () => { visible = !document.hidden; last = performance.now(); };
  document.addEventListener('visibilitychange', onVis);
  addEventListener('resize', resize);
  resize();
  raf = requestAnimationFrame(frame);

  petalStop = () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    document.removeEventListener('visibilitychange', onVis);
    removeEventListener('resize', resize);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    petalStop = null;
  };
}

// ---- Smooth scrolling (Lenis), driven by GSAP's clock so scroll scenes stay in sync.
// Off for reduced motion and in the express lane; touch scrolling stays native.
let lenis: Lenis | null = null;
const lenisTick = (time: number) => lenis?.raf(time * 1000);
function startLenis() {
  if (lenis || reduceMotion.matches) return;
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, anchors: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(lenisTick);
  gsap.ticker.lagSmoothing(0);
}
function stopLenis() {
  if (!lenis) return;
  gsap.ticker.remove(lenisTick);
  lenis.destroy();
  lenis = null;
}

// ---- Jumping straight to an aisle -------------------------------------------
// While the aisles scroll sideways, an aisle's scroll position comes from the
// horizontal tween; otherwise it's just where the element sits on the page.
let aisleScrollTop: ((i: number) => number) | null = null;
let checkoutScrollTop: (() => number) | null = null;
const N_AISLES = document.querySelectorAll('.aisle').length;

function targetTop(key: string): number {
  const m = /^aisle-(\d+)$/.exec(key);
  if (m && aisleScrollTop) return aisleScrollTop(Number(m[1]) - 1);
  if (key === 'checkout' && checkoutScrollTop) return checkoutScrollTop();
  const target = document.getElementById(key);
  if (!target) return scrollY;
  // A pinned section sits at the end of its pin's scroll space, so measure where the pin starts.
  const el = (target.closest('.pin-spacer') as HTMLElement | null) ?? target;
  const navH = (document.querySelector('.snav') as HTMLElement)?.offsetHeight ?? 0;
  return el.getBoundingClientRect().top + scrollY - (m ? navH : 0);
}

function focusTarget(key: string) {
  const heading = document.getElementById(`${key}-title`) ?? document.querySelector<HTMLElement>(`#${key} :is(h1, h2)`);
  if (!heading) return;
  heading.setAttribute('tabindex', '-1');
  heading.focus({ preventScroll: true });
}

function jumpTo(key: string) {
  const go = () => {
    const top = targetTop(key);
    if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
    else window.scrollTo({ top, behavior: 'instant' as ScrollBehavior });
    ScrollTrigger.update();
    queueBar();
    focusTarget(key);
  };
  if (reduceMotion.matches) return go();
  gsap.timeline()
    .to('#jump-veil', { autoAlpha: 1, duration: 0.16, ease: 'power1.in' })
    .call(go)
    .to('#jump-veil', { autoAlpha: 0, duration: 0.35, ease: 'power1.out', delay: 0.05 });
}

// Highlight the aisle you're in, in the floating bar.
const barLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.aisle-bar a[data-aisle]'));
let currentAisle = -1;
function setCurrentAisle(i: number) {
  if (i === currentAisle) return;
  currentAisle = i;
  barLinks.forEach((a, j) => a.setAttribute('aria-current', String(j === i)));
}

// Show the floating bar while you're among the aisles, measured live from the page
// so it stays right in every layout. When the aisles stack vertically, the one
// crossing mid-screen is the current one.
const bar = document.getElementById('aisle-bar') as HTMLElement;
const aislesEl = document.getElementById('aisles') as HTMLElement;
const checkoutEl = document.getElementById('checkout') as HTMLElement;
const panelsEl = Array.from(document.querySelectorAll<HTMLElement>('.aisle'));
let barQueued = false;
function updateBar() {
  barQueued = false;
  if (root.dataset.mode === 'express') return bar.classList.remove('is-visible');
  const line = innerHeight * 0.55;
  bar.classList.toggle('is-visible', aislesEl.getBoundingClientRect().top < line && checkoutEl.getBoundingClientRect().top > line);
  if (!aisleScrollTop) {
    const mid = innerHeight / 2;
    const i = panelsEl.findIndex((p) => { const r = p.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; });
    if (i >= 0) setCurrentAisle(i);
  }
}
const queueBar = () => { if (!barQueued) { barQueued = true; requestAnimationFrame(updateBar); } };
addEventListener('scroll', queueBar, { passive: true });
addEventListener('resize', queueBar);

// Aisles menu in the nav.
const menuBtn = document.getElementById('aisles-btn') as HTMLButtonElement;
const menuList = document.getElementById('aisles-list') as HTMLUListElement;
function setMenu(open: boolean) {
  menuBtn.setAttribute('aria-expanded', String(open));
  menuList.hidden = !open;
  if (open) menuList.querySelector('a')?.focus();
}
menuBtn.addEventListener('click', () => setMenu(menuList.hidden));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !menuList.hidden) { setMenu(false); menuBtn.focus(); }
});
document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  if (!menuList.hidden && !t.closest('.aisles-menu')) setMenu(false);
  const link = t.closest<HTMLAnchorElement>('a[data-jump]');
  if (!link || root.dataset.mode === 'express') return;
  e.preventDefault();
  setMenu(false);
  jumpTo(link.dataset.jump!);
});

// ---- Store animations -----------------------------------------------------
let mm: gsap.MatchMedia | null = null;

function initStore() {
  mm = gsap.matchMedia();

  mm.add(
    {
      desktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
      mobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
      reduce: '(prefers-reduced-motion: reduce)',
    },
    (ctx) => {
      const { desktop, reduce } = ctx.conditions as Record<string, boolean>;
      if (reduce) return; // everything is already visible and static

      // ---------- Storefront: walk to the door, doors open, push inside
      const sfWalker = document.getElementById('sf-walker') as HTMLElement;
      const WALK_END = 4.5;
      const sf = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: '#storefront',
          start: 'top top',
          end: () => `+=${innerHeight * STOREFRONT_LENGTH}`,
          pin: true,
          scrub: 0.4,
          onUpdate(self) {
            const t = self.progress * sf.duration();
            if (t <= WALK_END) setFrame(sfWalker, Math.floor((t / WALK_END) * FRAMES * 3));
            sfWalker.classList.toggle('is-back', self.direction < 0 && t < WALK_END);
          },
        },
      });
      sf.to('#sf-hint', { autoAlpha: 0, duration: 0.6 }, 0)
        .to(sfWalker, { left: '36%', duration: WALK_END }, 0)
        .to('#door-l', { x: -138, duration: 1.6, ease: 'power2.inOut' }, 3)
        .to('#door-r', { x: 138, duration: 1.6, ease: 'power2.inOut' }, 3)
        .to('#sf-world', { scale: 6, transformOrigin: '56.25% 66%', duration: 4, ease: 'power2.in' }, 5)
        .to(sfWalker, { autoAlpha: 0, duration: 1 }, 5.6)
        .to('#sf-veil', { autoAlpha: 1, duration: 1.4 }, 7.6);

      // ---------- Directory: signs drop in on their wires and swing
      const dirTitle = SplitText.create('.dir__title', { type: 'words,chars' });
      gsap.from(dirTitle.chars, {
        yPercent: -120, rotation: () => gsap.utils.random(-30, 30), autoAlpha: 0,
        stagger: 0.04, duration: 0.8, ease: 'back.out(2.5)',
        scrollTrigger: { trigger: '#directory', start: 'top 70%' },
      });
      gsap.from('.hsign', {
        y: -260, rotation: () => gsap.utils.random(-28, 28), autoAlpha: 0,
        stagger: 0.12, duration: 1.6, ease: 'elastic.out(1, 0.35)',
        scrollTrigger: { trigger: '.dir__signs', start: 'top 85%' },
      });

      // ---------- Aisles
      if (desktop) {
        const track = document.querySelector('.aisles__track') as HTMLElement;
        const panels = gsap.utils.toArray<HTMLElement>('.aisle');
        const walker = document.getElementById('aisle-walker') as HTMLElement;
        const endcaps = gsap.utils.toArray<HTMLElement>('.endcap');
        const distance = () => track.scrollWidth - innerWidth;

        const swing = endcaps.map((el) => gsap.quickTo(el, 'rotation', { duration: 0.35, ease: 'power2.out' }));

        const hTween = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: '#aisles',
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate(self) {
              setFrame(walker, Math.floor((self.progress * distance()) / PX_PER_FRAME));
              walker.classList.toggle('is-back', self.direction < 0);
              const r = gsap.utils.clamp(-16, 16, -self.getVelocity() / 180);
              swing.forEach((s) => s(r));
              setCurrentAisle(Math.round(self.progress * (panels.length - 1)));
            },
          },
        });
        aisleScrollTop = (i) => hTween.scrollTrigger!.start + (distance() * i) / (panels.length - 1) + 2;

        // Settle the signs when scrolling stops.
        const settle = () => gsap.to(endcaps, { rotation: 0, duration: 1.8, ease: 'elastic.out(1, 0.25)', overwrite: true });
        ScrollTrigger.addEventListener('scrollEnd', settle);

        // Parallax layers and the floor.
        const layer = (sel: string, k: number) =>
          gsap.to(sel, {
            x: () => -distance() * k, ease: 'none',
            scrollTrigger: { trigger: '#aisles', start: 'top top', end: () => `+=${distance()}`, scrub: true, invalidateOnRefresh: true },
          });
        layer('.aisles__back', 0.45);
        layer('.aisles__front', 1.35);
        gsap.to('.aisles__floor', {
          backgroundPositionX: () => `${-distance()}px`, ease: 'none',
          scrollTrigger: { trigger: '#aisles', start: 'top top', end: () => `+=${distance()}`, scrub: true, invalidateOnRefresh: true },
        });

        // Products pop and titles bounce as each aisle comes into view.
        panels.forEach((panel) => {
          const title = SplitText.create(panel.querySelector('.aisle__title'), { type: 'words,chars' });
          const tl = gsap.timeline({
            scrollTrigger: { trigger: panel, containerAnimation: hTween, start: 'left 65%', toggleActions: 'play none none reverse' },
          });
          tl.from(panel.querySelectorAll('.product, .caution-tape'), { y: 70, autoAlpha: 0, rotation: () => gsap.utils.random(-12, 12), stagger: 0.05, duration: 0.6, ease: 'back.out(2.2)' })
            .from(title.chars, { yPercent: 110, autoAlpha: 0, stagger: 0.03, duration: 0.5, ease: 'back.out(3)' }, 0.1)
            .from(panel.querySelectorAll('.aisle__label, .aisle__tagline, .price-tag'), { y: 20, autoAlpha: 0, stagger: 0.08, duration: 0.4 }, 0.3);
        });

        // Checkout: hold the section in place while the receipt prints,
        // so the whole receipt is always on screen.
        const print = gsap.fromTo('#receipt', { yPercent: -100 }, {
          yPercent: 0, ease: 'none',
          scrollTrigger: {
            trigger: '#checkout', start: 'top top', end: () => `+=${innerHeight * 0.9}`,
            pin: true, scrub: 0.3, invalidateOnRefresh: true,
          },
        });
        checkoutScrollTop = () => print.scrollTrigger!.end; // jumping to checkout lands on the printed receipt

        return () => {
          aisleScrollTop = null;
          checkoutScrollTop = null;
          ScrollTrigger.removeEventListener('scrollEnd', settle);
        };
      }

      // Phones: the checkout is taller than the screen, so the receipt prints as it scrolls past.
      gsap.fromTo('#receipt', { yPercent: -100 }, {
        yPercent: 0, ease: 'none',
        scrollTrigger: { trigger: '.receipt-clip', start: 'top 80%', end: 'bottom 85%', scrub: 0.3 },
      });

      // Phones: aisles stack; each one's products and title pop as you reach it.
      gsap.utils.toArray<HTMLElement>('.aisle').forEach((panel) => {
        gsap.from(panel.querySelectorAll('.endcap, .product, .caution-tape, .aisle__info > *'), {
          y: 40, autoAlpha: 0, stagger: 0.05, duration: 0.5, ease: 'back.out(2)',
          scrollTrigger: { trigger: panel, start: 'top 75%' },
        });
      });
    },
  );

  // Shared by desktop and phone (not reduced motion).
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // ---------- Checkout title
    const checkoutTitle = SplitText.create('.checkout__title', { type: 'words' });
    gsap.from(checkoutTitle.words, {
      y: 30, autoAlpha: 0, stagger: 0.08, duration: 0.5, ease: 'back.out(2)',
      scrollTrigger: { trigger: '#checkout', start: 'top 70%' },
    });

    // ---------- Closing time: dusk falls and the sign flips
    const closing = document.getElementById('closing')!;
    gsap.fromTo(closing, { backgroundColor: '#FBEACC', color: '#3A2418' }, {
      backgroundColor: '#3A2418', color: '#FBEACC', ease: 'none',
      scrollTrigger: {
        trigger: closing, start: 'top 85%', end: 'top 25%', scrub: true,
        onUpdate: (self) => closing.classList.toggle('is-dusk', self.progress > 0.5),
      },
    });
    const sign = document.getElementById('closing-sign')!;
    gsap.timeline({ scrollTrigger: { trigger: closing, start: 'top 30%', toggleActions: 'play none none reverse' } })
      .to(sign, { rotationX: 90, duration: 0.25, ease: 'power2.in' })
      .call(() => { sign.textContent = sign.textContent === 'open' ? 'come again!' : 'open'; })
      .to(sign, { rotationX: 0, duration: 0.6, ease: 'back.out(3)' })
      .to(sign, { boxShadow: '0 0 40px 6px rgba(212,174,64,.55)', duration: 0.6 }, '<');
  });

  startBoil();
  startLenis();
  startPetals();
}

function destroyStore() {
  mm?.revert();
  mm = null;
  stopBoil();
  stopLenis();
  petalStop?.();
}

// ---- Express lane ---------------------------------------------------------
const toggle = document.getElementById('express-toggle') as HTMLButtonElement;
const back = document.getElementById('express-back') as HTMLButtonElement;

function setExpress(on: boolean, fromUser = true) {
  root.dataset.mode = on ? 'express' : 'store';
  toggle.setAttribute('aria-pressed', String(on));
  try { localStorage.setItem('ic-express', on ? '1' : '0'); } catch {}
  if (fromUser) {
    history.replaceState(null, '', on ? '#recruiter' : location.pathname);
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
  }
  if (on) destroyStore();
  else if (!mm) initStore();
  ScrollTrigger.refresh();
  if (fromUser) {
    const target = document.getElementById(on ? 'express-title' : 'sf-title');
    target?.setAttribute('tabindex', '-1');
    target?.focus({ preventScroll: true });
  }
}

toggle.addEventListener('click', () => setExpress(root.dataset.mode !== 'express'));
back.addEventListener('click', () => setExpress(false));

// Start in whichever mode the head script picked.
const startExpress = root.dataset.mode === 'express';
toggle.setAttribute('aria-pressed', String(startExpress));
if (!startExpress) {
  // Wait for fonts so SplitText measures the real letters.
  document.fonts.ready.then(() => {
    initStore();
    // Arriving from a case study's "back to aisle N" link: land on that aisle.
    const key = location.hash.slice(1);
    if (/^(aisle-\d+|checkout|closing)$/.test(key)) {
      requestAnimationFrame(() => { ScrollTrigger.refresh(); jumpTo(key); });
    }
  });
}
