// ─── Canvas setup ─────────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ─── Menu → Game transition ───────────────────────────────────────────────────
const mainmenu = document.getElementById('mainmenu');
const playBtn  = document.getElementById('playBtn');

playBtn.addEventListener('click', () => {
    mainmenu.style.display = 'none';
    canvas.style.display   = 'block';
    // Reset player to center of screen when game starts
    player.x = canvas.width  / 2;
    player.y = canvas.height / 2;
});

// ─── Player settings ─────────────────────────────────────────────────────────
const player = {
    x: 400,
    y: 300,
    bodyRadius: 24,

    // Barrel — slightly thicker and shorter
    barrelWidth:  14,
    barrelLength: 26,

    // Movement with acceleration
    vx: 0,
    vy: 0,
    speed: 0.5,      // acceleration per frame
    friction: 0.92,
    maxSpeed: 6,

    // Aiming angle toward the mouse
    aimAngle: 0,
};

// ─── Mouse tracking ───────────────────────────────────────────────────────────
const mouse = { x: 0, y: 0 };

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// ─── Keyboard tracking ────────────────────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true;  });
window.addEventListener('keyup',   (e) => { keys[e.key.toLowerCase()] = false; });

// ─── Collision helpers ────────────────────────────────────────────────────────
function circleHitsRect(cx, cy, r, rx, ry, rw, rh) {
    const nearestX = Math.max(rx, Math.min(cx, rx + rw));
    const nearestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return (dx * dx + dy * dy) < (r * r);
}

function resolveCircleRect(cx, cy, r, rx, ry, rw, rh) {
    const nearestX = Math.max(rx, Math.min(cx, rx + rw));
    const nearestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
    const overlap = r - dist;
    return {
        cx: cx + (dx / dist) * overlap,
        cy: cy + (dy / dist) * overlap,
    };
}

// Walls array — empty for now, add objects here when you want walls
const walls = [];

// ─── Drawing ──────────────────────────────────────────────────────────────────
function drawPlayer() {
    const { x, y, bodyRadius, barrelWidth, barrelLength, aimAngle } = player;

    // Barrel — drawn first so the circle overlaps it at the base
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(aimAngle);
    ctx.fillStyle = '#78cbff';
    ctx.fillRect(
        bodyRadius - 5,       // slightly inside the circle edge to close the gap
        -barrelWidth / 2,     // centered on the aim axis
        barrelLength,
        barrelWidth
    );
    ctx.restore();

    // Circle body — drawn on top of barrel base for clean look
    ctx.beginPath();
    ctx.arc(x, y, bodyRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#78cbff';
    ctx.fill();
}

// ─── Update logic ─────────────────────────────────────────────────────────────
function update() {
    // Acceleration-based movement
    if (keys['w'] || keys['arrowup'])    player.vy -= player.speed;
    if (keys['s'] || keys['arrowdown'])  player.vy += player.speed;
    if (keys['a'] || keys['arrowleft'])  player.vx -= player.speed;
    if (keys['d'] || keys['arrowright']) player.vx += player.speed;

    // Clamp speed and apply friction
    player.vx = Math.max(-player.maxSpeed, Math.min(player.maxSpeed, player.vx)) * player.friction;
    player.vy = Math.max(-player.maxSpeed, Math.min(player.maxSpeed, player.vy)) * player.friction;

    if (Math.abs(player.vx) < 0.01) player.vx = 0;
    if (Math.abs(player.vy) < 0.01) player.vy = 0;

    player.x += player.vx;
    player.y += player.vy;

    // Screen boundary
    player.x = Math.max(player.bodyRadius, Math.min(canvas.width  - player.bodyRadius, player.x));
    player.y = Math.max(player.bodyRadius, Math.min(canvas.height - player.bodyRadius, player.y));

    // Wall collision (ready for when you add walls)
    for (const wall of walls) {
        if (circleHitsRect(player.x, player.y, player.bodyRadius, wall.x, wall.y, wall.w, wall.h)) {
            const r = resolveCircleRect(player.x, player.y, player.bodyRadius, wall.x, wall.y, wall.w, wall.h);
            player.x  = r.cx;
            player.y  = r.cy;
            player.vx = 0;
            player.vy = 0;
        }
    }

    // Aim barrel toward mouse
    player.aimAngle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
}

// ─── Game loop ────────────────────────────────────────────────────────────────
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
    drawPlayer();
    requestAnimationFrame(gameLoop);
}

gameLoop();
