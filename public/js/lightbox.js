// macos-style image lightbox
// call initLightbox(selector) to attach to any clickable images

;(function () {
    let backdrop = null
    let filenameEl = null
    let bodyEl = null

    function el(tag, attrs, children) {
        const node = document.createElement(tag)
        if (attrs) {
            Object.keys(attrs).forEach(function (key) {
                if (key === 'className') node.className = attrs[key]
                else node.setAttribute(key, attrs[key])
            })
        }
        if (children) {
            children.forEach(function (child) {
                node.appendChild(child)
            })
        }
        return node
    }

    function createLightbox() {
        const closeBtn = el('button', {
            'className': 'lightbox-dot lightbox-dot--close',
            'aria-label': 'Close',
        })

        const dots = el('div', { className: 'lightbox-dots' }, [
            closeBtn,
            el('span', { className: 'lightbox-dot lightbox-dot--minimize' }),
            el('span', { className: 'lightbox-dot lightbox-dot--maximize' }),
        ])

        filenameEl = el('span', { className: 'lightbox-filename' })
        bodyEl = el('div', { className: 'lightbox-body' })

        const titlebar = el('div', { className: 'lightbox-titlebar' }, [dots, filenameEl])
        const win = el('div', { className: 'lightbox-window' }, [titlebar, bodyEl])

        backdrop = el(
            'div',
            {
                'className': 'lightbox-backdrop',
                'role': 'dialog',
                'aria-modal': 'true',
                'aria-label': 'Image preview',
            },
            [win],
        )

        backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop) closeLightbox()
        })

        closeBtn.addEventListener('click', closeLightbox)

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && backdrop.classList.contains('is-open')) {
                closeLightbox()
            }
        })

        document.body.appendChild(backdrop)
    }

    function openLightbox(src, alt) {
        if (!backdrop) createLightbox()

        const filename = src.split('/').pop().split('?')[0] || 'image'
        filenameEl.textContent = decodeURIComponent(filename)

        const img = document.createElement('img')
        img.src = src
        img.alt = alt || ''
        img.draggable = false

        while (bodyEl.firstChild) bodyEl.removeChild(bodyEl.firstChild)
        bodyEl.appendChild(img)

        void backdrop.offsetHeight
        backdrop.classList.add('is-open')
        document.body.style.overflow = 'hidden'
    }

    function closeLightbox() {
        if (!backdrop) return
        backdrop.classList.remove('is-open')
        document.body.style.overflow = ''

        setTimeout(function () {
            if (bodyEl) {
                while (bodyEl.firstChild) bodyEl.removeChild(bodyEl.firstChild)
            }
        }, 300)
    }

    window.initLightbox = function (selector) {
        const images = document.querySelectorAll(selector)

        images.forEach(function (img) {
            img.classList.add('lightbox-trigger')
            img.addEventListener('click', function () {
                openLightbox(img.src, img.alt)
            })
        })
    }
})()
