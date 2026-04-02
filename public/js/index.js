const SECTION_IDS = ['home', 'projects', 'blog']
const HOMEPAGE_FONT_STYLESHEET =
    'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;800&family=Manrope:wght@400;600;700&family=Sora:wght@600;700&display=swap'
const app = document.getElementById('app')
const assetVersion = document.body?.dataset.assetVersion || ''
let lenis

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isMobileViewport() {
    return window.matchMedia('(max-width: 768px)').matches
}

async function init() {
    if (!app) return

    try {
        scheduleDeferredAssets()
        initializeNavigationIcons()
        initializeNavigationHandlers()
        setCurrentButton('home')
        revealPortfolioShell()
        scheduleNonCriticalInitialization()
        if (typeof initLightbox === 'function') {
            initLightbox('.showcase-media img')
        }
    } finally {
        document.documentElement.classList.remove('js-loading')
    }
}

function scheduleNonCriticalInitialization() {
    const run = async () => {
        const shouldLoadHeavyEnhancements = !isMobileViewport() && !prefersReducedMotion()

        if (shouldLoadHeavyEnhancements) {
            await loadEnhancementScripts()
            initializeSmoothScroll()
            initializeRevealAnimations()
        }

        initializeScrollObserver()
        initializeHeroBackgroundTransition()
    }

    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(
            () => {
                window.requestAnimationFrame(() => {
                    void run()
                })
            },
            { timeout: 700 },
        )
        return
    }

    window.setTimeout(() => {
        window.requestAnimationFrame(() => {
            void run()
        })
    }, 0)
}

function scheduleDeferredAssets() {
    const run = () => loadHomepageFontStylesheet()

    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => void run(), { timeout: 1200 })
        return
    }

    window.setTimeout(() => void run(), 250)
}

function loadHomepageFontStylesheet() {
    if (document.getElementById('homepage-font-stylesheet')) return

    const link = document.createElement('link')
    link.id = 'homepage-font-stylesheet'
    link.rel = 'stylesheet'
    link.href = HOMEPAGE_FONT_STYLESHEET
    document.head.appendChild(link)
}

async function loadEnhancementScripts() {
    await loadScript('https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js').catch(() => {})
    await loadScript('https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/ScrollTrigger.min.js').catch(
        () => {},
    )
    await loadScript(versionedAssetPath('/js/vendor/lenis.min.js')).catch(() => {})
}

function versionedAssetPath(path) {
    if (!assetVersion) return path
    return `${path}?v=${encodeURIComponent(assetVersion)}`
}

function loadScript(src) {
    const existing = document.querySelector(`script[src="${CSS.escape(src)}"]`)
    if (existing) {
        if (existing.dataset.loaded === 'true') return Promise.resolve()

        return new Promise((resolve, reject) => {
            existing.addEventListener('load', () => resolve(), { once: true })
            existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), {
                once: true,
            })
        })
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = src
        script.defer = true
        script.addEventListener(
            'load',
            () => {
                script.dataset.loaded = 'true'
                resolve()
            },
            { once: true },
        )
        script.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), {
            once: true,
        })
        document.head.appendChild(script)
    })
}

function revealPortfolioShell() {
    document.documentElement.classList.remove('js-loading')
}

function initializeSmoothScroll() {
    if (typeof Lenis === 'undefined') return

    lenis = new Lenis({
        duration: 1.5,
        easing: EASE_OUT_EXPO,
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.0,
        syncTouch: true,
        touchMultiplier: 2,
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
        function raf(time) {
            lenis.raf(time)
            requestAnimationFrame(raf)
        }
        requestAnimationFrame(raf)
    }

    window.addEventListener('resize', () => {
        if (lenis) {
            lenis.resize()
        }
    })
}

/* gsap scroll-triggered reveal animations */
function initializeRevealAnimations() {
    const sections = [...document.querySelectorAll('.hero, .projects, .blog-preview')]
    if (sections.length === 0) return

    const hasGSAP = typeof window.gsap !== 'undefined'
    const hasScrollTrigger = typeof window.ScrollTrigger !== 'undefined'

    const revealPlan = [
        {
            selector:
                '.hero-name, .hero-tagline, .hero-bio, .hero-availability, .hero-now, .hero-contact-row',
            at: 0,
            prepare(gsap, elements) {
                gsap.set(elements, { autoAlpha: 0, y: 28, filter: 'blur(6px)' })
            },
            to: {
                autoAlpha: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: 0.7,
                ease: 'expo.out',
                stagger: { each: 0.07, from: 'start' },
            },
        },
        {
            selector: '.gol-container',
            at: 0.25,
            skip: window.matchMedia('(max-width: 768px)').matches,
            prepare(gsap, elements) {
                gsap.set(elements, { autoAlpha: 0, scale: 1.04, filter: 'blur(4px)' })
            },
            to: {
                autoAlpha: 1,
                scale: 1,
                filter: 'blur(0px)',
                duration: 0.9,
                ease: 'expo.out',
            },
        },
        {
            selector: '.section-label',
            at: 0,
            prepare(gsap, elements) {
                gsap.set(elements, { autoAlpha: 0, y: 14, filter: 'blur(3px)' })
            },
            to: { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'power3.out' },
        },
        {
            selector: '.project-item',
            at: 0.08,
            prepare(gsap, elements) {
                gsap.set(elements, { autoAlpha: 0, y: 20, filter: 'blur(3px)' })
            },
            to: {
                autoAlpha: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: 0.6,
                ease: 'power3.out',
                stagger: { each: 0.1, from: 'start' },
            },
        },
        {
            selector: '.blog-preview-entry',
            at: 0,
            prepare(gsap, elements) {
                gsap.set(elements, { autoAlpha: 0, y: 16 })
            },
            to: {
                autoAlpha: 1,
                y: 0,
                duration: 0.5,
                ease: 'power3.out',
                stagger: { each: 0.06, from: 'start' },
            },
        },
        {
            selector: '.project-item-desc',
            at: 0.2,
            prepare(gsap, elements) {
                gsap.set(elements, { autoAlpha: 0, y: 10 })
            },
            to: {
                autoAlpha: 1,
                y: 0,
                duration: 0.5,
                ease: 'power3.out',
                stagger: { each: 0.06, from: 'start' },
            },
        },
        {
            selector: '.showcase-media',
            at: 0.15,
            prepare(gsap, elements) {
                gsap.set(elements, { autoAlpha: 0, clipPath: 'inset(6% 6% 6% 6%)', scale: 0.96 })
            },
            to: {
                autoAlpha: 1,
                clipPath: 'inset(0% 0% 0% 0%)',
                scale: 1,
                duration: 0.8,
                ease: 'expo.out',
            },
        },
    ]

    const registered = new Set()
    const sectionSequences = new Map()

    for (const section of sections) {
        const sequence = []
        sectionSequences.set(section, sequence)

        for (const group of revealPlan) {
            if (group.skip) continue
            const targets = section.querySelectorAll(group.selector)
            const elements = []

            for (const element of targets) {
                if (registered.has(element)) continue
                registered.add(element)
                elements.push(element)
            }

            if (elements.length === 0) continue
            sequence.push({ ...group, elements })
        }
    }

    const allTargets = [...sectionSequences.values()].flatMap((sequence) =>
        sequence.flatMap((item) => item.elements),
    )
    if (allTargets.length === 0) return

    if (prefersReducedMotion() || !hasGSAP || !hasScrollTrigger) {
        for (const element of allTargets) {
            element.style.opacity = '1'
            element.style.transform = 'none'
            element.style.filter = 'none'
        }
        return
    }

    const gsap = window.gsap
    const ScrollTrigger = window.ScrollTrigger
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

    const inViewOnInit = (element) => {
        const rect = element.getBoundingClientRect()
        return rect.top < window.innerHeight * 0.86 && rect.bottom > 0
    }

    for (const [section, sequence] of sectionSequences) {
        if (sequence.length === 0) continue

        const isHero = section.classList.contains('hero')

        if (!isHero && inViewOnInit(section)) {
            for (const group of sequence) {
                for (const element of group.elements) {
                    element.style.opacity = '1'
                    element.style.transform = 'none'
                    element.style.filter = 'none'
                }
            }
            continue
        }

        for (const group of sequence) {
            group.prepare(gsap, group.elements)
        }

        if (isHero) {
            // hero always animates on load, no scroll trigger
            const timeline = gsap.timeline({ delay: 0.4 })
            for (const group of sequence) {
                timeline.to(group.elements, group.to, group.at)
            }
            continue
        }

        const timeline = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                once: true,
                scroller: lenis ? document.body : window,
            },
        })

        for (const group of sequence) {
            timeline.to(group.elements, group.to, group.at)
        }
    }
}

function initializeHeroBackgroundTransition() {
    const hero = document.getElementById('home')
    const golContainer = document.querySelector('.gol-container')
    if (!hero || !golContainer) return

    golContainer.style.opacity = '1'

    if (prefersReducedMotion()) return

    const hasGSAP =
        typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined'

    if (hasGSAP) {
        window.gsap.to(golContainer, {
            opacity: 0,
            ease: 'none',
            scrollTrigger: {
                trigger: hero,
                start: 'top top',
                end: 'bottom top',
                scrub: true,
                scroller: lenis ? document.body : window,
            },
        })
        return
    }

    const clamp01 = (value) => Math.max(0, Math.min(1, value))

    const updateFromScroll = () => {
        const heroTop = hero.offsetTop
        const heroHeight = Math.max(hero.offsetHeight, 1)
        const scrollY = window.scrollY || window.pageYOffset || 0
        const progress = clamp01((scrollY - heroTop) / heroHeight)
        golContainer.style.opacity = (1 - progress).toFixed(3)
    }

    updateFromScroll()
    window.addEventListener('scroll', updateFromScroll, { passive: true })
    window.addEventListener('resize', updateFromScroll)
}

function initializeNavigationIcons() {
    // icons are now inline SVGs in the template
}

function initializeNavigationHandlers() {
    document.addEventListener('click', (event) => {
        const button = event.target.closest('[data-section]')
        if (!button) return

        event.preventDefault()
        const section = button.dataset.section
        switchWindow(section)
    })
}

function switchWindow(id) {
    const section = document.getElementById(id)
    if (!section) return

    setCurrentButton(id)

    if (lenis) {
        lenis.scrollTo(section, { offset: 0, duration: 1.2, easing: EASE_OUT_EXPO })
    } else {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
}

function initializeScrollObserver() {
    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean)
    if (sections.length === 0) return

    const getScrollY = () => {
        if (lenis && Number.isFinite(lenis.animatedScroll)) return lenis.animatedScroll
        return window.scrollY || window.pageYOffset || 0
    }

    const updateActiveSection = () => {
        const scrollY = getScrollY()
        const remainingScroll = document.documentElement.scrollHeight - scrollY - window.innerHeight
        const atBottom = remainingScroll < window.innerHeight * 0.1

        if (atBottom) {
            setCurrentButton(sections[sections.length - 1].id)
            return
        }

        const scrollMid = scrollY + window.innerHeight * 0.45
        let current = sections[0]

        for (const section of sections) {
            if (section.offsetTop <= scrollMid) {
                current = section
            } else {
                break
            }
        }

        setCurrentButton(current.id)
    }

    updateActiveSection()
    if (lenis) {
        lenis.on('scroll', updateActiveSection)
    }
    window.addEventListener('scroll', updateActiveSection, { passive: true })
    window.addEventListener('resize', updateActiveSection)
}

function setCurrentButton(id) {
    const buttonId = id
    document.querySelectorAll('.nav-button').forEach((button) => {
        button.removeAttribute('aria-current')
    })
    const active = document.getElementById(`btn-${buttonId}`)
    if (active) {
        active.setAttribute('aria-current', 'location')
    }
}

init()
