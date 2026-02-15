(function () {
  'use strict';

  const CONFIG = {
    cellSize: 10,
    updateInterval: 150,
    colors: { alive: '#7cc77c', dead: '#1c1c1c', grid: 'rgba(255, 255, 255, 0.05)' },
  };

  let canvas, ctx, grid, nextGrid, cols, rows, animationId, lastUpdate = 0;

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
    createPattern();
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

  function draw() {
    ctx.fillStyle = CONFIG.colors.dead;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        if (grid[x][y].alive) {
          ctx.fillStyle = CONFIG.colors.alive;
          ctx.fillRect(x * CONFIG.cellSize, y * CONFIG.cellSize, CONFIG.cellSize - 1, CONFIG.cellSize - 1);
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
    animationId = requestAnimationFrame(animate);
    if (timestamp - lastUpdate >= CONFIG.updateInterval) {
      updateGame();
      lastUpdate = timestamp;
    }
    draw();
  }

  function resize() {
    const hero = document.getElementById('home');
    canvas.width = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
    initGrid();
    draw();
  }

  function start() {
    canvas = document.getElementById('game-of-life-canvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    resize();
    canvas.classList.add('active');
    lastUpdate = performance.now();
    animate(lastUpdate);

    window.addEventListener('resize', resize);
    window.addEventListener('beforeunload', () => cancelAnimationFrame(animationId));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(start, 500));
  } else {
    setTimeout(start, 500);
  }
})();
