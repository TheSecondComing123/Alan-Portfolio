; (function () {
    'use strict'

    const CONFIG = {
        cellSize: 11,
        updateInterval: 120,
        trailDecay: 0.92,
        trailMin: 0.02,
        trailStrength: 0.65,
        cellTransitionSpeed: 10,
        glowRadius: 14,
        glowAlpha: 0.24,
        aliveHue: 127,
        aliveSat: 55,
        aliveLit: 56,
        bgColor: 'hsl(0 0% 8%)',
    }
    const START_RETRY_MS = 150
    const MAX_START_ATTEMPTS = 40

    let canvas
    let ctx
    let grid
    let nextGrid
    let trailGrid
    let renderGrid
    let cols
    let rows
    let animationId
    let lastUpdate = 0
    let lastFrameTime = 0
    let hasStarted = false
    let isAnimating = false
    let glowGradientCache = null

    function buildGlowGradient() {
        const size = CONFIG.glowRadius * 2
        const offscreen = document.createElement('canvas')
        offscreen.width = size
        offscreen.height = size
        const offCtx = offscreen.getContext('2d')
        const gradient = offCtx.createRadialGradient(
            CONFIG.glowRadius, CONFIG.glowRadius, 0,
            CONFIG.glowRadius, CONFIG.glowRadius, CONFIG.glowRadius,
        )
        gradient.addColorStop(0, `hsla(${CONFIG.aliveHue} ${CONFIG.aliveSat}% 70% / ${CONFIG.glowAlpha})`)
        gradient.addColorStop(0.4, `hsla(${CONFIG.aliveHue} ${CONFIG.aliveSat}% 60% / ${CONFIG.glowAlpha * 0.5})`)
        gradient.addColorStop(1, `hsla(${CONFIG.aliveHue} ${CONFIG.aliveSat}% 50% / 0)`)
        offCtx.fillStyle = gradient
        offCtx.fillRect(0, 0, size, size)
        glowGradientCache = offscreen
    }

    class Cell {
        constructor() {
            this.alive = false
        }

        randomize(density = 0.3) {
            this.alive = Math.random() < density
        }
    }

    function initGrid() {
        cols = Math.floor(canvas.width / CONFIG.cellSize)
        rows = Math.floor(canvas.height / CONFIG.cellSize)
        grid = Array(cols)
            .fill(null)
            .map(() =>
                Array(rows)
                    .fill(null)
                    .map(() => new Cell()),
            )
        nextGrid = Array(cols)
            .fill(null)
            .map(() =>
                Array(rows)
                    .fill(null)
                    .map(() => new Cell()),
            )
        trailGrid = Array(cols)
            .fill(null)
            .map(() => Array(rows).fill(0))
        createPattern()
        renderGrid = Array(cols)
            .fill(null)
            .map((_, x) =>
                Array(rows)
                    .fill(null)
                    .map((__, y) => (grid[x][y].alive ? 1 : 0)),
            )
    }

    function createPattern() {
        for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
                grid[x][y].randomize(0.16)
            }
        }
        if (cols > 20 && rows > 20) {
            addGlider(5, 5)
            addGlider(Math.floor(cols * 0.7), Math.floor(rows * 0.3))
            addGlider(Math.floor(cols * 0.3), Math.floor(rows * 0.7))
        }
    }

    function addGlider(x, y) {
        const pattern = [
            [0, 1, 0],
            [0, 0, 1],
            [1, 1, 1],
        ]
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (x + i < cols && y + j < rows && pattern[j][i]) {
                    grid[x + i][y + j].alive = true
                }
            }
        }
    }

    function countNeighbors(x, y) {
        let count = 0
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue
                if (grid[(x + dx + cols) % cols][(y + dy + rows) % rows].alive) count++
            }
        }
        return count
    }

    function updateGame() {
        let aliveCount = 0
        for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
                const neighbors = countNeighbors(x, y)
                nextGrid[x][y].alive =
                    grid[x][y].alive
                        ? neighbors === 2 || neighbors === 3
                        : neighbors === 3 || neighbors === 6
                if (nextGrid[x][y].alive) aliveCount++
            }
        }
        ;[grid, nextGrid] = [nextGrid, grid]
        if (aliveCount < 5 || aliveCount > cols * rows * 0.7) createPattern()
    }

    function draw(deltaSeconds = 0) {
        const w = canvas.width
        const h = canvas.height
        const cs = CONFIG.cellSize
        const blend = Math.min(1, Math.max(0, deltaSeconds) * CONFIG.cellTransitionSpeed)
        const gap = Math.max(1, Math.round(cs * 0.1))
        const inner = cs - gap

        ctx.fillStyle = CONFIG.bgColor
        ctx.fillRect(0, 0, w, h)

        for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
                const target = grid[x][y].alive ? 1 : 0
                const current = renderGrid[x][y]
                const next = current + (target - current) * blend
                renderGrid[x][y] = next

                const px = x * cs
                const py = y * cs

                if (target > 0) {
                    trailGrid[x][y] = Math.max(trailGrid[x][y], next)
                } else {
                    const nextTrail = trailGrid[x][y] * CONFIG.trailDecay
                    trailGrid[x][y] = nextTrail
                    if (nextTrail > CONFIG.trailMin) {
                        const t = nextTrail
                        const alpha = Math.min(1, t * CONFIG.trailStrength)
                        const hue = CONFIG.aliveHue - (1 - t) * 30
                        const sat = CONFIG.aliveSat - (1 - t) * 20
                        const lit = 20 + t * 30
                        ctx.fillStyle = `hsla(${hue} ${sat}% ${lit}% / ${alpha.toFixed(3)})`
                        ctx.fillRect(px, py, inner, inner)
                    }
                }

                if (next > 0.01) {
                    const alpha = 0.3 + next * 0.7
                    const lit = CONFIG.aliveLit + next * 14
                    ctx.fillStyle = `hsla(${CONFIG.aliveHue} ${CONFIG.aliveSat}% ${lit}% / ${alpha.toFixed(3)})`
                    ctx.fillRect(px, py, inner, inner)
                }
            }
        }

        if (glowGradientCache) {
            const gr = CONFIG.glowRadius
            const size = gr * 2
            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    const val = renderGrid[x][y]
                    if (val > 0.15) {
                        ctx.globalAlpha = Math.min(1, (val - 0.15) * 1.18)
                        ctx.drawImage(
                            glowGradientCache,
                            x * cs + cs * 0.5 - gr,
                            y * cs + cs * 0.5 - gr,
                            size,
                            size,
                        )
                    }
                }
            }
            ctx.globalAlpha = 1
        }
    }

    function animate(timestamp) {
        isAnimating = true
        animationId = requestAnimationFrame(animate)
        const deltaSeconds = lastFrameTime ? (timestamp - lastFrameTime) / 1000 : 0
        lastFrameTime = timestamp
        if (timestamp - lastUpdate >= CONFIG.updateInterval) {
            updateGame()
            lastUpdate = timestamp
        }
        draw(deltaSeconds)
    }

    function resize() {
        if (!canvas) return
        const hero = document.getElementById('home')
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight
        const heroHeight = hero ? hero.offsetHeight : viewportHeight
        const rect = canvas.getBoundingClientRect()
        const targetWidth = Math.round(rect.width || viewportWidth)
        const targetHeight = Math.round(rect.height || heroHeight)
        canvas.width = Math.max(1, targetWidth)
        canvas.height = Math.max(1, targetHeight)
        initGrid()
        ctx.fillStyle = CONFIG.bgColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        draw()
    }

    function stopAnimation() {
        if (animationId) {
            cancelAnimationFrame(animationId)
            animationId = null
        }
        isAnimating = false
    }

    function startWithCanvas(canvasEl) {
        if (hasStarted) return
        canvas = canvasEl
        ctx = canvas.getContext('2d')
        if (!ctx) return

        hasStarted = true
        buildGlowGradient()
        resize()
        canvas.classList.add('active')
        canvas.style.setProperty('--hero-bg-opacity', '1')
        lastUpdate = performance.now()
        lastFrameTime = lastUpdate
        animate(lastUpdate)

        window.addEventListener('resize', resize)
        window.addEventListener('pagehide', stopAnimation)
        window.addEventListener('pageshow', () => {
            if (!hasStarted) {
                queueStart()
                return
            }

            if (!isAnimating) {
                lastUpdate = performance.now()
                lastFrameTime = lastUpdate
                animate(lastUpdate)
            }
        })
    }

    function queueStart(attempt = 0) {
        if (hasStarted) return

        const canvasEl = document.getElementById('game-of-life-canvas')
        if (canvasEl) {
            startWithCanvas(canvasEl)
            return
        }

        if (attempt >= MAX_START_ATTEMPTS) return
        setTimeout(() => queueStart(attempt + 1), START_RETRY_MS)
    }

    function startWhenReady() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        const isMobileViewport = window.matchMedia('(max-width: 768px)').matches
        if (!isMobileViewport) {
            queueStart()
            return
        }

        const run = () => queueStart()
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(run, { timeout: 1200 })
            return
        }

        setTimeout(run, 300)
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startWhenReady)
    } else {
        startWhenReady()
    }
})()
