// Game State
let gameState = {
  player: 'NEXUS',
  difficulty: 'easy',
  score: 0,
  level: 1,
  lives: 3,
  startTime: 0,
  bricksDestroyed: 0,
  totalBricks: 0,
  paused: false,
  gameActive: false
};

// Game Objects
let ball, paddle, bricks = [], powerUps = [], particles = [];
let canvas, ctx;

// Difficulty Settings
const difficulties = {
  easy: { ballSpeed: 4, paddleSpeed: 8, lives: 3, brickRows: 4 },
  medium: { ballSpeed: 6, paddleSpeed: 10, lives: 2, brickRows: 5 },
  hard: { ballSpeed: 8, paddleSpeed: 12, lives: 1, brickRows: 6 }
};

// Initialize particles background
function createParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 6 + 's';
    particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
    container.appendChild(particle);
  }
}

// Screen Management
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
}

// Difficulty Selection
document.querySelectorAll('.difficulty-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    gameState.difficulty = btn.dataset.difficulty;
  });
});

// Initialize Game
function initGame() {
  const playerName = document.getElementById('playerName').value.trim();
  gameState.player = playerName || 'NEXUS';
  
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  
  resetGame();
  showScreen('gameScreen');
  updateUI();
  startGameLoop();
}

function resetGame() {
  const settings = difficulties[gameState.difficulty];
  
  gameState.score = 0;
  gameState.level = 1;
  gameState.lives = settings.lives;
  gameState.startTime = Date.now();
  gameState.bricksDestroyed = 0;
  gameState.gameActive = true;
  gameState.paused = false;

  // Initialize ball
  ball = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    dx: (Math.random() > 0.5 ? 1 : -1) * settings.ballSpeed,
    dy: -settings.ballSpeed,
    radius: 8,
    trail: [],
    glowIntensity: 0
  };

  // Initialize paddle
  paddle = {
    x: canvas.width / 2 - 60,
    y: canvas.height - 20,
    width: 120,
    height: 12,
    speed: settings.paddleSpeed,
    powerUp: null,
    powerUpTime: 0
  };

  // Initialize bricks
  createBricks();
  
  // Clear arrays
  powerUps = [];
  particles = [];
}

function createBricks() {
  bricks = [];
  const settings = difficulties[gameState.difficulty];
  const rows = settings.brickRows;
  const cols = 10;
  const brickWidth = 70;
  const brickHeight = 20;
  const padding = 5;
  const offsetTop = 60;
  const offsetLeft = (canvas.width - (cols * (brickWidth + padding) - padding)) / 2;

  gameState.totalBricks = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Create different brick types
      let brickType = 'normal';
      let hits = 1;
      
      if (Math.random() < 0.1) {
        brickType = 'strong';
        hits = 2;
      } else if (Math.random() < 0.05) {
        brickType = 'power';
        hits = 1;
      }

      bricks.push({
        x: offsetLeft + col * (brickWidth + padding),
        y: offsetTop + row * (brickHeight + padding),
        width: brickWidth,
        height: brickHeight,
        type: brickType,
        hits: hits,
        maxHits: hits,
        destroyed: false,
        color: getBrickColor(brickType, row)
      });
      
      gameState.totalBricks++;
    }
  }
}

function getBrickColor(type, row) {
  const colors = {
    normal: [`hsl(${180 + row * 30}, 70%, 50%)`, `hsl(${200 + row * 30}, 70%, 40%)`],
    strong: ['#ff6b6b', '#e74c3c'],
    power: ['#f39c12', '#e67e22']
  };
  return colors[type] || colors.normal;
}

// Game Loop
function startGameLoop() {
  gameLoop();
}

function gameLoop() {
  if (!gameState.gameActive) return;
  
  if (!gameState.paused) {
    update();
    render();
  }
  
  requestAnimationFrame(gameLoop);
}

function update() {
  // Update ball
  updateBall();
  
  // Update paddle
  updatePaddle();
  
  // Update power-ups
  updatePowerUps();
  
  // Update particles
  updateParticles();
  
  // Check collisions
  checkCollisions();
  
  // Check win/lose conditions
  checkGameEnd();
}

function updateBall() {
  // Add trail effect
  ball.trail.push({ x: ball.x, y: ball.y, alpha: 1 });
  if (ball.trail.length > 10) ball.trail.shift();
  
  ball.trail.forEach(point => point.alpha *= 0.9);

  // Move ball
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Ball collision with walls
  if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
    ball.dx = -ball.dx;
    createImpactParticles(ball.x, ball.y);
  }
  
  if (ball.y - ball.radius < 0) {
    ball.dy = -ball.dy;
    createImpactParticles(ball.x, ball.y);
  }

  // Ball falls below paddle
  if (ball.y + ball.radius > canvas.height) {
    loseLife();
  }

  // Update glow effect
  ball.glowIntensity = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
}

function updatePaddle() {
  // Handle paddle power-ups
  if (paddle.powerUp) {
    paddle.powerUpTime--;
    if (paddle.powerUpTime <= 0) {
      paddle.powerUp = null;
      paddle.width = 120; // Reset to normal size
    }
  }
}

function updatePowerUps() {
  powerUps.forEach((powerUp, index) => {
    powerUp.y += powerUp.speed;
    powerUp.rotation += powerUp.rotationSpeed;
    
    // Remove if off screen
    if (powerUp.y > canvas.height) {
      powerUps.splice(index, 1);
    }
    
    // Check collision with paddle
    if (powerUp.y + powerUp.size > paddle.y &&
        powerUp.y < paddle.y + paddle.height &&
        powerUp.x + powerUp.size > paddle.x &&
        powerUp.x < paddle.x + paddle.width) {
      
      activatePowerUp(powerUp.type);
      powerUps.splice(index, 1);
    }
  });
}

function updateParticles() {
  particles.forEach((particle, index) => {
    particle.x += particle.dx;
    particle.y += particle.dy;
    particle.alpha *= particle.decay;
    particle.size *= 0.99;
    
    if (particle.alpha < 0.01) {
      particles.splice(index, 1);
    }
  });
}

function checkCollisions() {
  // Ball-paddle collision
  if (ball.y + ball.radius > paddle.y &&
      ball.y - ball.radius < paddle.y + paddle.height &&
      ball.x > paddle.x &&
      ball.x < paddle.x + paddle.width) {
    
    // Calculate bounce angle based on hit position
    const hitPos = (ball.x - paddle.x) / paddle.width;
    const angle = (hitPos - 0.5) * Math.PI / 3; // Max 60 degrees
    
    const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    ball.dx = speed * Math.sin(angle);
    ball.dy = -Math.abs(speed * Math.cos(angle));
    
    createImpactParticles(ball.x, ball.y);
  }

  // Ball-brick collision
  bricks.forEach((brick, index) => {
    if (!brick.destroyed &&
        ball.x + ball.radius > brick.x &&
        ball.x - ball.radius < brick.x + brick.width &&
        ball.y + ball.radius > brick.y &&
        ball.y - ball.radius < brick.y + brick.height) {
      
      // Bounce ball
      ball.dy = -ball.dy;
      
      // Damage brick
      brick.hits--;
      if (brick.hits <= 0) {
        brick.destroyed = true;
        gameState.bricksDestroyed++;
        gameState.score += getBrickScore(brick.type);
        
        // Create explosion particles
        createExplosionParticles(brick.x + brick.width/2, brick.y + brick.height/2, brick.color[0]);
        
        // Chance to drop power-up
        if (brick.type === 'power' || Math.random() < 0.1) {
          createPowerUp(brick.x + brick.width/2, brick.y + brick.height/2);
        }
      } else {
        createImpactParticles(ball.x, ball.y);
      }
    }
  });
}

function getBrickScore(type) {
  const scores = { normal: 10, strong: 25, power: 50 };
  return scores[type] || 10;
}

function createPowerUp(x, y) {
  const types = ['multiball', 'bigpaddle', 'slowmo'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  powerUps.push({
    x: x - 15,
    y: y,
    size: 30,
    type: type,
    speed: 3,
    rotation: 0,
    rotationSpeed: 0.1,
    color: getPowerUpColor(type)
  });
}

function getPowerUpColor(type) {
  const colors = {
    multiball: '#ff6b6b',
    bigpaddle: '#4ecdc4',
    slowmo: '#f39c12'
  };
  return colors[type] || '#ffffff';
}

function activatePowerUp(type) {
  const powerUpElements = {
    multiball: document.getElementById('multiballPower'),
    bigpaddle: document.getElementById('bigPaddlePower'),
    slowmo: document.getElementById('slowmoPower')
  };

  // Visual feedback
  if (powerUpElements[type]) {
    powerUpElements[type].classList.add('active');
    setTimeout(() => powerUpElements[type].classList.remove('active'), 300);
  }

  switch (type) {
    case 'multiball':
      // Create additional balls (simplified - just speed up current ball)
      ball.dx *= 1.2;
      ball.dy *= 1.2;
      break;
    case 'bigpaddle':
      paddle.width = 180;
      paddle.powerUp = 'bigpaddle';
      paddle.powerUpTime = 600; // 10 seconds at 60fps
      break;
    case 'slowmo':
      ball.dx *= 0.7;
      ball.dy *= 0.7;
      break;
  }
}

function createImpactParticles(x, y) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: x,
      y: y,
      dx: (Math.random() - 0.5) * 4,
      dy: (Math.random() - 0.5) * 4,
      size: Math.random() * 4 + 2,
      alpha: 1,
      decay: 0.95,
      color: '#00d4ff'
    });
  }
}

function createExplosionParticles(x, y, color) {
  for (let i = 0; i < 15; i++) {
    particles.push({
      x: x,
      y: y,
      dx: (Math.random() - 0.5) * 8,
      dy: (Math.random() - 0.5) * 8,
      size: Math.random() * 6 + 3,
      alpha: 1,
      decay: 0.92,
      color: color
    });
  }
}

function checkGameEnd() {
  // Check if all bricks destroyed
  const remainingBricks = bricks.filter(brick => !brick.destroyed);
  
  if (remainingBricks.length === 0) {
    // Level complete
    gameState.level++;
    gameState.score += 1000 * gameState.level; // Level bonus
    
    if (gameState.level > 5) {
      // Game won
      endGame(true);
    } else {
      // Next level
      createBricks();
      resetBallPosition();
    }
  }
}

function loseLife() {
  gameState.lives--;
  updateUI();
  
  if (gameState.lives <= 0) {
    endGame(false);
  } else {
    resetBallPosition();
  }
}

function resetBallPosition() {
  const settings = difficulties[gameState.difficulty];
  ball.x = canvas.width / 2;
  ball.y = canvas.height - 60;
  ball.dx = (Math.random() > 0.5 ? 1 : -1) * settings.ballSpeed;
  ball.dy = -settings.ballSpeed;
  ball.trail = [];
}

function endGame(victory) {
  gameState.gameActive = false;
  
  const endTime = Date.now();
  const playTime = Math.floor((endTime - gameState.startTime) / 1000);
  const accuracy = gameState.totalBricks > 0 ? Math.floor((gameState.bricksDestroyed / gameState.totalBricks) * 100) : 0;
  
  // Update end screen
  document.getElementById('endTitle').textContent = victory ? '🎉 VICTORY ACHIEVED!' : '💀 MISSION FAILED';
  document.getElementById('endTitle').className = victory ? 'end-title victory' : 'end-title defeat';
  document.getElementById('finalScore').textContent = gameState.score.toLocaleString();
  document.getElementById('levelsCleared').textContent = victory ? gameState.level : gameState.level - 1;
  document.getElementById('accuracy').textContent = accuracy + '%';
  document.getElementById('playTime').textContent = formatTime(playTime);
  
  setTimeout(() => showScreen('endScreen'), 1000);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Rendering
function render() {
  // Clear canvas with gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#0a0a1a');
  gradient.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Render particles
  renderParticles();
  
  // Render bricks
  renderBricks();
  
  // Render ball
  renderBall();
  
  // Render paddle
  renderPaddle();
  
  // Render power-ups
  renderPowerUps();
  
  // Render UI elements
  renderGameUI();
}

function renderBall() {
  // Render trail
  ball.trail.forEach((point, index) => {
    const size = (index / ball.trail.length) * ball.radius;
    ctx.beginPath();
    ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 212, 255, ${point.alpha * 0.6})`;
    ctx.fill();
  });

  // Render main ball with glow
  const glowSize = ball.radius + 10 * ball.glowIntensity;
  
  // Outer glow
  const glowGradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, glowSize);
  glowGradient.addColorStop(0, 'rgba(0, 212, 255, 0.8)');
  glowGradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, glowSize, 0, Math.PI * 2);
  ctx.fill();

  // Main ball
  const ballGradient = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 0, ball.x, ball.y, ball.radius);
  ballGradient.addColorStop(0, '#ffffff');
  ballGradient.addColorStop(0.3, '#00d4ff');
  ballGradient.addColorStop(1, '#0066cc');
  ctx.fillStyle = ballGradient;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
}

function renderPaddle() {
  // Paddle glow
  ctx.shadowColor = '#00d4ff';
  ctx.shadowBlur = 15;
  
  // Main paddle
  const paddleGradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
  paddleGradient.addColorStop(0, '#ffffff');
  paddleGradient.addColorStop(0.5, '#00d4ff');
  paddleGradient.addColorStop(1, '#0066cc');
  
  ctx.fillStyle = paddleGradient;
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  
  // Power-up indicator
  if (paddle.powerUp === 'bigpaddle') {
    ctx.fillStyle = 'rgba(78, 205, 196, 0.3)';
    ctx.fillRect(paddle.x - 5, paddle.y - 5, paddle.width + 10, paddle.height + 10);
  }
  
  ctx.shadowBlur = 0;
}

function renderBricks() {
  bricks.forEach(brick => {
    if (!brick.destroyed) {
      // Brick shadow/glow
      ctx.shadowColor = brick.color[0];
      ctx.shadowBlur = 8;
      
      // Main brick
      const brickGradient = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
      brickGradient.addColorStop(0, brick.color[0]);
      brickGradient.addColorStop(1, brick.color[1]);
      
      ctx.fillStyle = brickGradient;
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      
      // Damage indicator
      if (brick.hits < brick.maxHits) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(brick.x, brick.y, brick.width * (brick.hits / brick.maxHits), 3);
      }
      
      // Special brick indicators
      if (brick.type === 'power') {
        ctx.fillStyle = '#f39c12';
        ctx.font = '12px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('⚡', brick.x + brick.width/2, brick.y + brick.height/2 + 4);
      } else if (brick.type === 'strong') {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(brick.hits.toString(), brick.x + brick.width/2, brick.y + brick.height/2 + 3);
      }
    }
  });
  
  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';
}

function renderPowerUps() {
  powerUps.forEach(powerUp => {
    ctx.save();
    ctx.translate(powerUp.x + powerUp.size/2, powerUp.y + powerUp.size/2);
    ctx.rotate(powerUp.rotation);
    
    // Power-up glow
    ctx.shadowColor = powerUp.color;
    ctx.shadowBlur = 15;
    
    // Power-up shape
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, powerUp.size/2);
    gradient.addColorStop(0, powerUp.color);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, powerUp.size/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Power-up icon
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const icons = {
      multiball: '⚡',
      bigpaddle: '🛡️',
      slowmo: '⏱️'
    };
    
    ctx.fillText(icons[powerUp.type] || '?', 0, 0);
    ctx.restore();
  });
  
  ctx.shadowBlur = 0;
}

function renderParticles() {
  particles.forEach(particle => {
    ctx.save();
    ctx.globalAlpha = particle.alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function renderGameUI() {
  if (gameState.paused) {
    // Pause overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '48px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('⏸️ PAUSED', canvas.width/2, canvas.height/2);
    
    ctx.font = '18px Orbitron';
    ctx.fillText('Press SPACE to Resume', canvas.width/2, canvas.height/2 + 60);
  }
}

// Controls
const keys = {};

document.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  
  if (e.code === 'Space') {
    e.preventDefault();
    if (gameState.gameActive) {
      gameState.paused = !gameState.paused;
    }
  }
  
  if (e.code === 'KeyR' && gameState.gameActive) {
    if (confirm('Reset current game?')) {
      resetGame();
      updateUI();
    }
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

// Continuous key handling
function handleInput() {
  if (!gameState.gameActive || gameState.paused) return;
  
  if (keys['ArrowLeft'] || keys['KeyA']) {
    paddle.x = Math.max(0, paddle.x - paddle.speed);
  }
  if (keys['ArrowRight'] || keys['KeyD']) {
    paddle.x = Math.min(canvas.width - paddle.width, paddle.x + paddle.speed);
  }
}

// Update input every frame
function updateInput() {
  handleInput();
  if (gameState.gameActive) {
    requestAnimationFrame(updateInput);
  }
}

// UI Updates
function updateUI() {
  document.getElementById('playerDisplay').textContent = gameState.player;
  document.getElementById('scoreDisplay').textContent = gameState.score.toLocaleString();
  document.getElementById('levelDisplay').textContent = gameState.level;
  
  // Update lives display
  const livesContainer = document.getElementById('livesDisplay');
  livesContainer.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const heart = document.createElement('div');
    heart.innerHTML = '❤️';
    heart.className = 'life-heart';
    if (i >= gameState.lives) {
      heart.classList.add('lost');
    }
    livesContainer.appendChild(heart);
  }
}

function restartGame() {
  showScreen('startScreen');
  // Reset difficulty to easy
  gameState.difficulty = 'easy';
  document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.difficulty === 'easy');
  });
}

// Initialize
createParticles();

// Start input handling when game starts
function startInputHandling() {
  updateInput();
}

// Override initGame to include input handling
const originalInitGame = initGame;
initGame = function() {
  originalInitGame();
  startInputHandling();
};