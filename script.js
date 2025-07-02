let username = "Player";
function startGame() {
  const input = document.getElementById("username").value.trim();
  if (input.length > 0) username = input;

  document.getElementById("startScreen").style.display = "none";
  document.getElementById("gameUI").style.display = "block";
  document.getElementById("info").innerText = `👤 Player: ${username}`;

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  let x = canvas.width / 2;
  let y = canvas.height - 30;
  let dx = 2;
  let dy = -2;
  let paddleHeight = 10;
  let paddleWidth = 75;
  let paddleX = (canvas.width - paddleWidth) / 2;
  let rightPressed = false;
  let leftPressed = false;
  let ballRadius = 8;
  let score = 0;
  let lives = 3;
  let mission = "🎯 Break 15 bricks!";
  let bricksBroken = 0;
  let paused = false;
  let trail = [];

  const brickRowCount = 3;
  const brickColumnCount = 5;
  const brickWidth = 75;
  const brickHeight = 20;
  const brickPadding = 10;
  const brickOffsetTop = 30;
  const brickOffsetLeft = 30;

  const bricks = [];
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
  }

  document.addEventListener("keydown", keyDownHandler);
  document.addEventListener("keyup", keyUpHandler);

  function keyDownHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
    if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
    if (e.key === "p" || e.key === "P") paused = !paused;
  }

  function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
    if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
  }

  function drawTrail() {
    trail.push({ x, y, alpha: 1 });
    if (trail.length > 15) trail.shift();
    trail.forEach(t => {
      ctx.beginPath();
      ctx.arc(t.x, t.y, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,255,200,${t.alpha})`;
      ctx.fill();
      t.alpha -= 0.07;
    });
  }

  function drawBall() {
    drawTrail();
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#00ffc8";
    ctx.fill();
    ctx.closePath();
  }

  function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#00ffc8";
    ctx.fill();
    ctx.closePath();
  }

  function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        if (bricks[c][r].status === 1) {
          const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
          const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
          bricks[c][r].x = brickX;
          bricks[c][r].y = brickY;
          ctx.beginPath();
          ctx.rect(brickX, brickY, brickWidth, brickHeight);
          ctx.fillStyle = "#0095DD";
          ctx.fill();
          ctx.closePath();
        }
      }
    }
  }

  function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        const b = bricks[c][r];
        if (b.status === 1) {
          if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
            dy = -dy;
            b.status = 0;
            bricksBroken++;
            score += 10;

            if (bricksBroken >= 15) {
              showEnd(`🎉 Mission Complete, ${username}!`);
            }
          }
        }
      }
    }
  }

  function showEnd(msg) {
    document.getElementById("gameUI").style.display = "none";
    document.getElementById("endScreen").style.display = "block";
    document.getElementById("endMessage").innerText = msg;
  }

  function drawScore() {
    ctx.font = "14px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`💯 Score: ${score}`, 8, 20);
    ctx.fillText(`❤️ Lives: ${lives}`, canvas.width - 80, 20);
  }

  function draw() {
    if (paused) {
      ctx.font = "24px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("⏸️ Paused", canvas.width / 2 - 40, canvas.height / 2);
      requestAnimationFrame(draw);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    drawScore();
    collisionDetection();

    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx;
    if (y + dy < ballRadius) dy = -dy;
    else if (y + dy > canvas.height - ballRadius) {
      if (x > paddleX && x < paddleX + paddleWidth) {
        dy = -dy;
        dx *= 1.05;
        dy *= 1.05;
      } else {
        lives--;
        if (!lives) {
          showEnd(`💀 Game Over, ${username}`);
        } else {
          x = canvas.width / 2;
          y = canvas.height - 30;
          dx = 2;
          dy = -2;
          paddleX = (canvas.width - paddleWidth) / 2;
        }
      }
    }

    if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 5;
    else if (leftPressed && paddleX > 0) paddleX -= 5;

    x += dx;
    y += dy;

    requestAnimationFrame(draw);
  }

  document.getElementById("mission").innerText = mission;
  draw();
}