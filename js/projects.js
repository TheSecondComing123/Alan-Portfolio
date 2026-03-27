let lenis = null

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function initializeSmoothScroll() {
    if (prefersReducedMotion() || typeof Lenis === 'undefined') return

    lenis = new Lenis({
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

function initializeCardSpotlight() {
    if (window.matchMedia('(max-width: 768px)').matches) return

    const cards = document.querySelectorAll('.case-card')
    for (const card of cards) {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect()
            card.style.setProperty('--card-mouse-x', `${e.clientX - rect.left}px`)
            card.style.setProperty('--card-mouse-y', `${e.clientY - rect.top}px`)
        })
    }
}

function initializeImageLightbox() {
    const lightbox = document.createElement('div')
    lightbox.className = 'lightbox'
    const lightboxImg = document.createElement('img')
    lightbox.appendChild(lightboxImg)
    document.body.appendChild(lightbox)

    const close = () => lightbox.classList.remove('open')
    lightbox.addEventListener('click', close)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close()
    })

    document.querySelectorAll('.case-hero img').forEach((img) => {
        img.addEventListener('click', (e) => {
            e.stopPropagation()
            lightboxImg.src = img.src
            lightboxImg.alt = img.alt
            lightbox.classList.add('open')
        })
    })
}

function initializeRevealAnimations() {
    if (prefersReducedMotion() || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return

    gsap.registerPlugin(ScrollTrigger)

    if (lenis) {
        ScrollTrigger.scrollerProxy(document.body, {
            scrollTop(value) {
                if (arguments.length) {
                    lenis.scrollTo(value, { immediate: true })
                }
                return lenis.animatedScroll
            },
            getBoundingClientRect() {
                return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }
            },
        })
    }

    const topnav = document.querySelector('.projects-topnav')
    const title = document.querySelector('.projects-page-main .section-label')
    const cards = document.querySelectorAll('.case-card')

    const headerElements = [topnav, title].filter(Boolean)

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    if (headerElements.length > 0) {
        tl.from(headerElements, {
            autoAlpha: 0,
            y: 20,
            filter: 'blur(6px)',
            duration: 0.6,
            stagger: 0.06,
        })
    }

    cards.forEach((card, index) => {
        gsap.from(card, {
            autoAlpha: 0,
            y: 32,
            scale: 0.98,
            rotationX: 6,
            transformOrigin: '50% 100%',
            filter: 'blur(3px)',
            duration: 0.75,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                once: true,
                scroller: lenis ? document.body : window,
            },
            delay: index === 0 ? 0.15 : 0,
        })
    })
}

function initialize() {
    initializeSmoothScroll()
    initializeCardSpotlight()
    initializeImageLightbox()
    initializeRevealAnimations()
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true })
} else {
    initialize()
}
