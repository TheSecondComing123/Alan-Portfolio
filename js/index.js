const SECTION_IDS = ['home', 'projects', 'work', 'technologies']
const EASE_OUT_EXPO = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
const app = document.getElementById('app')
let lenis

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

async function init() {
    if (!app) return

    try {
        await loadComponents()
        initializeNavigationIcons()
        initializeNavigationHandlers()
        setCurrentButton('home')

        if (typeof lucide !== 'undefined') {
            lucide.createIcons()
        }

        revealPortfolioShell()
        scheduleNonCriticalInitialization()
    } finally {
        document.documentElement.classList.remove('js-loading')
    }
}

function scheduleNonCriticalInitialization() {
    const run = () => {
        initializeSmoothScroll()
        initializeRevealAnimations()
        initializeScrollObserver()
        initializeHeroBackgroundTransition()
    }

    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(
            () => {
                window.requestAnimationFrame(run)
            },
            { timeout: 700 },
        )
        return
    }

    window.setTimeout(() => {
        window.requestAnimationFrame(run)
    }, 0)
}

function revealPortfolioShell() {
    const targets = [app, document.querySelector('nav')].filter(Boolean)

    if (typeof window.gsap !== 'undefined' && targets.length > 0) {
        window.gsap.set(targets, { autoAlpha: 0 })
    }

    document.documentElement.classList.remove('js-loading')

    if (typeof window.gsap !== 'undefined' && targets.length > 0) {
        window.gsap.to(targets, {
            autoAlpha: 1,
            duration: 0.24,
            ease: 'power1.out',
            clearProps: 'opacity,visibility',
        })
    }
}

function initializeSmoothScroll() {
    if (typeof Lenis === 'undefined') return

    if (prefersReducedMotion()) return

    lenis = new Lenis({
        duration: 1.5,
        easing: EASE_OUT_EXPO,
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.0,
        smoothTouch: false,
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

async function loadComponents() {
    try {
        const bundledResponse = await fetch('/components/all.html')
        if (!bundledResponse.ok) {
            throw new Error(`Failed to fetch bundled components: ${bundledResponse.status}`)
        }
        app.innerHTML = await bundledResponse.text()
        return
    } catch {
        const htmlParts = await Promise.all(
            SECTION_IDS.map(async (id) => {
                const response = await fetch(`components/${id}.html`)
                if (!response.ok) {
                    throw new Error(`Failed to fetch component "${id}": ${response.status}`)
                }
                return response.text()
            }),
        )

        app.innerHTML = htmlParts.join('')
    }
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

function initializeNavigationIcons() {
    const iconMap = {
        'btn-home': 'home',
        'btn-projects': 'briefcase',
        'btn-work': 'building-2',
        'btn-technologies': 'cpu',
    }

    for (const [buttonId, iconName] of Object.entries(iconMap)) {
        const button = document.getElementById(buttonId)
        const icon = document.createElement('i')
        icon.setAttribute('data-lucide', iconName)
        icon.className = 'icon'
        button.appendChild(icon)
    }
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
        const scrollMid = getScrollY() + window.innerHeight * 0.45
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

function initializeRevealAnimations() {
    const sections = [...document.querySelectorAll('.window')]
    if (sections.length === 0) return

    const hasGSAP = typeof window.gsap !== 'undefined'
    const hasScrollTrigger = typeof window.ScrollTrigger !== 'undefined'

    const revealPlan = [
        {
            selector: '.hero-kicker, .window-title, .window-subtitle, .description',
            at: 0,
            prepare(gsap, elements) {
                gsap.set(elements, { autoAlpha: 0, y: 24, filter: 'blur(4px)' })
            },
            to: {
                autoAlpha: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: 0.62,
                ease: 'power3.out',
                stagger: { each: 0.075, from: 'start' },
            },
        },
        {
            selector: '.contact-panel, .project-card, .work-card',
            at: 0.12,
            prepare(gsap, elements) {
                gsap.set(elements, {
                    autoAlpha: 0,
                    y: 28,
                    scale: 0.985,
                    rotationX: 5,
                    transformOrigin: '50% 100%',
                })
            },
            to: {
                autoAlpha: 1,
                y: 0,
                scale: 1,
                rotationX: 0,
                duration: 0.66,
                ease: 'power2.out',
                stagger: { each: 0.11, from: 'start' },
            },
        },
        {
            selector: '.contact-item, .technology-card',
            at: 0.28,
            prepare(gsap, elements) {
                elements.forEach((element, index) => {
                    gsap.set(element, {
                        autoAlpha: 0,
                        x: index % 2 === 0 ? -16 : 16,
                        y: 10,
                        scale: 0.985,
                    })
                })
            },
            to: {
                autoAlpha: 1,
                x: 0,
                y: 0,
                scale: 1,
                duration: 0.48,
                ease: 'power2.out',
                stagger: { each: 0.05, from: 'edges' },
            },
        },
        {
            selector: '.project-highlights li, .work-highlights li',
            at: 0.4,
            prepare(gsap, elements) {
                gsap.set(elements, { autoAlpha: 0, x: 18 })
            },
            to: {
                autoAlpha: 1,
                x: 0,
                duration: 0.44,
                ease: 'power2.out',
                stagger: { each: 0.06, from: 'start' },
            },
        },
    ]

    const registered = new Set()
    const sectionSequences = new Map()

    for (const section of sections) {
        const sequence = []
        sectionSequences.set(section, sequence)

        for (const group of revealPlan) {
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

        if (inViewOnInit(section)) {
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

function setCurrentButton(id) {
    document.querySelectorAll('.nav-button').forEach((button) => {
        button.removeAttribute('aria-current')
    })

    const active = document.getElementById(`btn-${id}`)
    if (active) {
        active.setAttribute('aria-current', 'page')
    }
}

function initializeHeroBackgroundTransition() {
    const hero = document.getElementById('home')
    const background = document.getElementById('game-of-life-canvas')
    if (!hero || !background) return

    const clamp01 = (value) => Math.max(0, Math.min(1, value))
    const getScrollY = () => {
        if (lenis && Number.isFinite(lenis.animatedScroll)) return lenis.animatedScroll
        return window.scrollY || window.pageYOffset || 0
    }

    const setOpacity = (value) => {
        background.style.setProperty('--hero-bg-opacity', clamp01(value).toFixed(3))
    }

    setOpacity(1)

    if (prefersReducedMotion()) return

    const updateFromScroll = () => {
        const heroTop = hero.offsetTop
        const heroHeight = Math.max(hero.offsetHeight, 1)
        const progress = clamp01((getScrollY() - heroTop) / heroHeight)
        setOpacity(1 - progress)
    }

    updateFromScroll()
    if (lenis) {
        lenis.on('scroll', updateFromScroll)
    }
    window.addEventListener('scroll', updateFromScroll, { passive: true })
    window.addEventListener('resize', updateFromScroll)
}

init()
