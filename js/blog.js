let currentY = window.scrollY || window.pageYOffset || 0
let targetY = currentY
let wheelFrameId = null
let anchorFrameId = null
let isWheelSmoothing = false

function isScrollableElement(element) {
    if (!element || !(element instanceof Element)) return false
    const style = window.getComputedStyle(element)
    const overflowY = style.overflowY
    const canScrollY = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay'
    return canScrollY && element.scrollHeight > element.clientHeight
}

function hasScrollableParent(target) {
    let current = target
    while (current && current !== document.body) {
        if (isScrollableElement(current)) return true
        current = current.parentElement
    }
    return false
}

function clampToPage(y) {
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    if (y < 0) return 0
    if (y > maxY) return maxY
    return y
}

function stepWheelSmoothing() {
    const delta = targetY - currentY
    currentY += delta * 0.14

    if (Math.abs(delta) < 0.4) {
        currentY = targetY
        window.scrollTo(0, targetY)
        wheelFrameId = null
        isWheelSmoothing = false
        return
    }

    window.scrollTo(0, currentY)
    wheelFrameId = window.requestAnimationFrame(stepWheelSmoothing)
}

function onWheel(event) {
    if (event.ctrlKey || event.shiftKey) return
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
    if (hasScrollableParent(event.target)) return

    event.preventDefault()
    targetY = clampToPage(targetY + event.deltaY)
    if (!wheelFrameId) {
        isWheelSmoothing = true
        wheelFrameId = window.requestAnimationFrame(stepWheelSmoothing)
    }
}

function onScroll() {
    if (isWheelSmoothing) return
    const y = window.scrollY || window.pageYOffset || 0
    currentY = y
    targetY = y
}

function smoothScrollTo(y, duration = 900) {
    if (anchorFrameId) {
        window.cancelAnimationFrame(anchorFrameId)
    }

    const startY = window.scrollY || window.pageYOffset || 0
    const target = clampToPage(y)
    const distance = target - startY
    const startTime = performance.now()

    const tick = (now) => {
        const elapsed = now - startTime
        const progress = Math.min(1, elapsed / duration)
        const eased = EASE_OUT_EXPO(progress)
        const nextY = startY + distance * eased
        window.scrollTo(0, nextY)

        if (progress < 1) {
            anchorFrameId = window.requestAnimationFrame(tick)
            return
        }

        anchorFrameId = null
        currentY = target
        targetY = target
    }

    anchorFrameId = window.requestAnimationFrame(tick)
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
    document.documentElement.classList.add('lenis')
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
}

function initialize() {
    initializeSmoothScroll()
    initAnchorScroll()
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true })
} else {
    initialize()
}
