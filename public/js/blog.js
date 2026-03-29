let lenis = null

function smoothScrollTo(y, duration = 900) {
    if (lenis) {
        lenis.scrollTo(y, { duration: Math.max(0.35, duration / 1000), easing: EASE_OUT_EXPO })
        return
    }

    window.scrollTo({ top: y, behavior: 'smooth' })
}

function initAnchorScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (event) => {
            const href = anchor.getAttribute('href')
            if (!href || href === '#') return

            const section = document.querySelector(href)
            if (!section) return

            event.preventDefault()
            const y = section.getBoundingClientRect().top + window.scrollY
            smoothScrollTo(y, 1000)
            history.replaceState(null, '', href)
        })
    })

    const hash = window.location.hash
    if (!hash) return

    const target = document.querySelector(hash)
    if (!target) return

    const y = target.getBoundingClientRect().top + window.scrollY
    smoothScrollTo(y, 900)
}

function initializeSmoothScroll() {
    const prefersReducedMotion =
        typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion || typeof window.Lenis === 'undefined') return

    lenis = new window.Lenis({
        duration: 1.25,
        easing: EASE_OUT_EXPO,
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        touchMultiplier: 1.7,
        wheelMultiplier: 1.0,
        infinite: false,
    })

    document.documentElement.classList.add('lenis')

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        lenis.on('scroll', () => {
            ScrollTrigger.update()
        })

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000)
        })

        gsap.ticker.lagSmoothing(0)
    } else {
        const raf = (time) => {
            if (!lenis) return
            lenis.raf(time)
            window.requestAnimationFrame(raf)
        }
        window.requestAnimationFrame(raf)
    }

    window.addEventListener('resize', () => {
        if (lenis) lenis.resize()
    })
}

function initializeRevealAnimations() {
    const prefersReducedMotion =
        typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion || typeof gsap === 'undefined') return

    const cards = document.querySelectorAll('.blog-grid .blog-card')
    const yearHeaders = document.querySelectorAll('.blog-year')
    const articleChildren = document.querySelectorAll('.blog-article > *')
    const topnav = document.querySelector('.topnav')

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    const headerElements = [topnav, ...yearHeaders].filter(Boolean)
    if (headerElements.length > 0) {
        tl.from(headerElements, {
            autoAlpha: 0,
            y: 20,
            filter: 'blur(6px)',
            duration: 0.6,
            stagger: 0.06,
        })
    }

    if (cards.length > 0) {
        tl.from(
            cards,
            {
                autoAlpha: 0,
                y: 24,
                scale: 0.985,
                rotationX: 4,
                transformOrigin: '50% 100%',
                filter: 'blur(3px)',
                duration: 0.7,
                stagger: { each: 0.09, from: 'start' },
            },
            headerElements.length > 0 ? '-=0.35' : 0,
        )
    }

    if (articleChildren.length > 0) {
        tl.from(
            articleChildren,
            {
                autoAlpha: 0,
                y: 14,
                filter: 'blur(3px)',
                duration: 0.5,
                stagger: { each: 0.035, from: 'start' },
            },
            headerElements.length > 0 ? '-=0.3' : 0,
        )
    }
}

function initialize() {
    initializeSmoothScroll()
    initAnchorScroll()
    initializeRevealAnimations()
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true })
} else {
    initialize()
}
