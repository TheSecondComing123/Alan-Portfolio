function scrollToElement(target) {
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function initAnchorScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (event) => {
            const href = anchor.getAttribute('href')
            if (!href || href === '#') return
            const section = document.querySelector(href)
            if (!section) return
            event.preventDefault()

            scrollToElement(section)
            history.replaceState(null, '', href)
        })
    })

    const hash = window.location.hash
    if (!hash) return
    const target = document.querySelector(hash)
    scrollToElement(target)
}

window.addEventListener('DOMContentLoaded', () => {
    initAnchorScroll()
})
