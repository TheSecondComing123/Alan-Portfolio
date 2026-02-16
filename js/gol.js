(function () {
  'use strict';

  const CONFIG = {
    cellSize: 10,
    updateInterval: 100,
    colors: {
      alive: '#7cc77c',
      dead: 'rgb(28, 28, 28)',
      grid: 'rgba(255, 255, 255, 0.05)'
    },
    trailDecay: 0.86,
    trailMin: 0.04,
    trailStrength: 0.65,
    cellTransitionSpeed: 14
  };
  const START_RETRY_MS = 150;
  const MAX_START_ATTEMPTS = 40;

  let canvas, ctx, grid, nextGrid, trailGrid, renderGrid, cols, rows, animationId, lastUpdate = 0, lastFrameTime = 0;
  let hasStarted = false;
  let isAnimating = false;

  class Cell {
    constructor() {
      this.alive = false;
    }
    randomize(density = 0.3) {
      this.alive = Math.random() < density;
    }
  }

  function initGrid() {
    cols = Math.floor(canvas.width / CONFIG.cellSize);
    rows = Math.floor(canvas.height / CONFIG.cellSize);
    grid = Array(cols).fill(null).map(() => Array(rows).fill(null).map(() => new Cell()));
    nextGrid = Array(cols).fill(null).map(() => Array(rows).fill(null).map(() => new Cell()));
    trailGrid = Array(cols).fill(null).map(() => Array(rows).fill(0));
    createPattern();
    renderGrid = Array(cols).fill(null).map((_, x) =>
      Array(rows).fill(null).map((__, y) => (grid[x][y].alive ? 1 : 0))
    );
  }

  function createPattern() {
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        grid[x][y].randomize(0.2);
      }
    }
    if (cols > 20 && rows > 20) {
      addGlider(5, 5);
      addGlider(Math.floor(cols * 0.7), Math.floor(rows * 0.3));
      addGlider(Math.floor(cols * 0.3), Math.floor(rows * 0.7));
    }
  }

  function addGlider(x, y) {
    const pattern = [[0, 1, 0], [0, 0, 1], [1, 1, 1]];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (x + i < cols && y + j < rows && pattern[j][i]) {
          grid[x + i][y + j].alive = true;
        }
      }
    }
  }

  function countNeighbors(x, y) {
    let count = 0;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        if (grid[(x + dx + cols) % cols][(y + dy + rows) % rows].alive) count++;
      }
    }
    return count;
  }

  function updateGame() {
    let aliveCount = 0;
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const neighbors = countNeighbors(x, y);
        nextGrid[x][y].alive = grid[x][y].alive
          ? neighbors === 2 || neighbors === 3
          : neighbors === 3;
        if (nextGrid[x][y].alive) aliveCount++;
      }
    }
    [grid, nextGrid] = [nextGrid, grid];
    if (aliveCount < 5 || aliveCount > cols * rows * 0.7) createPattern();
  }

  function draw(deltaSeconds = 0) {
    ctx.fillStyle = CONFIG.colors.dead;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const blend = Math.min(1, Math.max(0, deltaSeconds) * CONFIG.cellTransitionSpeed);

    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const target = grid[x][y].alive ? 1 : 0;
        const current = renderGrid[x][y];
        const next = current + (target - current) * blend;
        renderGrid[x][y] = next;

        if (target > 0) {
          trailGrid[x][y] = Math.max(trailGrid[x][y], next);
        } else {
          const nextTrail = trailGrid[x][y] * CONFIG.trailDecay;
          trailGrid[x][y] = nextTrail;
          if (nextTrail > CONFIG.trailMin) {
            const alpha = Math.min(1, nextTrail * CONFIG.trailStrength);
            ctx.fillStyle = `rgba(124, 199, 124, ${alpha.toFixed(3)})`;
            ctx.fillRect(x * CONFIG.cellSize, y * CONFIG.cellSize, CONFIG.cellSize - 1, CONFIG.cellSize - 1);
          }
        }

        if (next > 0.01) {
          ctx.globalAlpha = Math.min(1, 0.2 + next * 0.8);
          ctx.fillStyle = CONFIG.colors.alive;
          ctx.fillRect(x * CONFIG.cellSize, y * CONFIG.cellSize, CONFIG.cellSize - 1, CONFIG.cellSize - 1);
          ctx.globalAlpha = 1;
        }
      }
    }

    ctx.strokeStyle = CONFIG.colors.grid;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CONFIG.cellSize, 0);
      ctx.lineTo(x * CONFIG.cellSize, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CONFIG.cellSize);
      ctx.lineTo(canvas.width, y * CONFIG.cellSize);
      ctx.stroke();
    }
  }

  function animate(timestamp) {
    isAnimating = true;
    animationId = requestAnimationFrame(animate);
    const deltaSeconds = lastFrameTime ? (timestamp - lastFrameTime) / 1000 : 0;
    lastFrameTime = timestamp;
    if (timestamp - lastUpdate >= CONFIG.updateInterval) {
      updateGame();
      lastUpdate = timestamp;
    }
    draw(deltaSeconds);
  }

  function resize() {
    const hero = document.getElementById('home');
    if (!hero || !canvas) return;
    canvas.width = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
    initGrid();
    ctx.fillStyle = CONFIG.colors.dead;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    draw();
  }

  function stopAnimation() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    isAnimating = false;
  }

  function startWithCanvas(canvasEl) {
    if (hasStarted) return;
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    if (!ctx) return;

    hasStarted = true;
    resize();
    canvas.classList.add('active');
    lastUpdate = performance.now();
    lastFrameTime = lastUpdate;
    animate(lastUpdate);

    window.addEventListener('resize', resize);
    window.addEventListener('pagehide', stopAnimation);
    window.addEventListener('pageshow', () => {
      if (!hasStarted) {
        queueStart();
        return;
      }

      if (!isAnimating) {
        lastUpdate = performance.now();
        lastFrameTime = lastUpdate;
        animate(lastUpdate);
      }
    });
  }

  function queueStart(attempt = 0) {
    if (hasStarted) return;

    const canvasEl = document.getElementById('game-of-life-canvas');
    if (canvasEl) {
      startWithCanvas(canvasEl);
      return;
    }

    if (attempt >= MAX_START_ATTEMPTS) return;
    setTimeout(() => queueStart(attempt + 1), START_RETRY_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => queueStart());
  } else {
    queueStart();
  }
})();
