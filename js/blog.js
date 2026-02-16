let blogLenis;
const EASE_OUT_EXPO = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t));
const BLOG_SCROLL_OFFSET = -12;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function scrollToElement(target, options = {}) {
  if (!target) return;

  if (blogLenis) {
    blogLenis.scrollTo(target, {
      offset: BLOG_SCROLL_OFFSET,
      ...options,
    });
    return;
  }

  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initBlogSmoothScroll() {
  if (typeof window.Lenis === 'undefined' || prefersReducedMotion()) return;

  blogLenis = new window.Lenis({
    duration: 1.2,
    easing: EASE_OUT_EXPO,
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
  });

  if (typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined') {
    blogLenis.on('scroll', () => {
      window.ScrollTrigger.update();
    });

    window.gsap.ticker.add((time) => {
      blogLenis.raf(time * 1000);
    });
    window.gsap.ticker.lagSmoothing(0);
  } else {
    const loop = (time) => {
      blogLenis.raf(time);
      window.requestAnimationFrame(loop);
    };
    window.requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => {
    if (blogLenis) {
      blogLenis.resize();
    }
  });
}

function initAnchorScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const section = document.querySelector(href);
      if (!section) return;
      event.preventDefault();

      scrollToElement(section, { duration: 1 });

      history.replaceState(null, '', href);
    });
  });

  const hash = window.location.hash;
  if (!hash) return;
  const target = document.querySelector(hash);
  scrollToElement(target, { immediate: true });
}

function initBlogRevealAnimations() {
  if (prefersReducedMotion()) return;
  if (typeof window.gsap === 'undefined') return;

  const gsap = window.gsap;
  const headerTargets = gsap.utils.toArray('.window-title, .description');
  const cardTargets = gsap.utils.toArray('.blog-card');
  const articleTargets = gsap.utils.toArray('.blog-article > *');

  if (headerTargets.length > 0) {
    gsap.from(headerTargets, {
      autoAlpha: 0,
      y: 14,
      duration: 0.45,
      ease: 'power2.out',
      stagger: 0.06,
    });
  }

  if (cardTargets.length > 0) {
    gsap.from(cardTargets, {
      autoAlpha: 0,
      y: 18,
      duration: 0.52,
      ease: 'power2.out',
      stagger: 0.1,
      delay: 0.08,
    });
  }

  if (articleTargets.length > 0) {
    gsap.from(articleTargets, {
      autoAlpha: 0,
      y: 10,
      duration: 0.4,
      ease: 'power2.out',
      stagger: 0.05,
      delay: 0.12,
    });
  }
}

function revealBlogShell() {
  const main = document.querySelector('.blog-page-main');

  if (typeof window.gsap !== 'undefined' && main) {
    window.gsap.set(main, { autoAlpha: 0 });
  }

  document.documentElement.classList.remove('js-loading');

  if (typeof window.gsap !== 'undefined' && main) {
    window.gsap.to(main, {
      autoAlpha: 1,
      duration: 0.24,
      ease: 'power1.out',
      clearProps: 'opacity,visibility',
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    initBlogSmoothScroll();
    initAnchorScroll();
    initBlogRevealAnimations();
  } finally {
    revealBlogShell();
  }
});
