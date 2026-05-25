// ─── Canvas setup ────────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// Always fill the window
function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ─── Player settings ─────────────────────────────────────────────────────────
const player = {
    x: 400,          // starting position (center of body)
    y: 300,
    bodyRadius: 24,  // size of the circle body

    // Barrel dimensions
    barrelWidth:  10, // how thick the barrel is
    barrelLength: 36, // how long the barrel is (starts at edge of circle)

    // Movement
    vx: 0,
    vy: 0,
    speed: 0.5,
    friction: 0.92,
    maxSpeed: 6,

    // Aiming — angle toward the mouse (in radians)
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

// ─── Walls ────────────────────────────────────────────────────────────────────
// Each wall: { x, y, w, h }  — add more here to build your map
const walls = [
    { x: 300, y: 150, w: 200, h: 20 },
    { x: 500, y: 300, w: 20,  h: 180 },
    { x: 100, y: 350, w: 20,  h: 180 },
];

// ─── Collision helpers ────────────────────────────────────────────────────────

// Check if circle overlaps a rectangle
function circleHitsRect(cx, cy, r, rx, ry, rw, rh) {
    const nearestX = Math.max(rx, Math.min(cx, rx + rw));
    const nearestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return (dx * dx + dy * dy) < (r * r);
}

// Push the circle out of the rectangle it's overlapping
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

// ─── Drawing ──────────────────────────────────────────────────────────────────

function drawPlayer() {
    const { x, y, bodyRadius, barrelWidth, barrelLength, aimAngle } = player;

    // ── Circle body ──
    ctx.beginPath();
    ctx.arc(x, y, bodyRadius, 0, Math.PI * 2);
    ctx.fillStyle   = '#78cbff';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 2;
    ctx.stroke();

    // ── Barrel (rotated to face mouse) ──
    // Translate to the player's center, rotate, then draw outward from edge
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(aimAngle);

    ctx.fillStyle = '#aaaaaa';
    ctx.fillRect(
        bodyRadius,               // starts at the edge of the circle
        -barrelWidth / 2,         // centered vertically
        barrelLength,             // extends outward
        barrelWidth
    );

    ctx.restore();
}

function drawWalls() {
    ctx.fillStyle   = '#555';
    ctx.strokeStyle = '#888';
    ctx.lineWidth   = 2;

    for (const wall of walls) {
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
        ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
    }
}

function drawHitboxes() {
    const { x, y, bodyRadius, barrelWidth, barrelLength, aimAngle } = player;

    // Body circle hitbox (green)
    ctx.beginPath();
    ctx.arc(x, y, bodyRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,255,0,0.6)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Barrel hitbox (orange)
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(aimAngle);
    ctx.strokeStyle = 'rgba(255,165,0,0.6)';
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(bodyRadius, -barrelWidth / 2, barrelLength, barrelWidth);
    ctx.restore();
}

// ─── Game loop ────────────────────────────────────────────────────────────────

function update() {
    // Movement input
    if (keys['w'] || keys['arrowup'])    player.vy -= player.speed;
    if (keys['s'] || keys['arrowdown'])  player.vy += player.speed;
    if (keys['a'] || keys['arrowleft'])  player.vx -= player.speed;
    if (keys['d'] || keys['arrowright']) player.vx += player.speed;

    // Clamp and apply friction
    player.vx = Math.max(-player.maxSpeed, Math.min(player.maxSpeed, player.vx)) * player.friction;
    player.vy = Math.max(-player.maxSpeed, Math.min(player.maxSpeed, player.vy)) * player.friction;

    if (Math.abs(player.vx) < 0.01) player.vx = 0;
    if (Math.abs(player.vy) < 0.01) player.vy = 0;

    player.x += player.vx;
    player.y += player.vy;

    // Screen boundary collision
    player.x = Math.max(player.bodyRadius, Math.min(canvas.width  - player.bodyRadius, player.x));
    player.y = Math.max(player.bodyRadius, Math.min(canvas.height - player.bodyRadius, player.y));

    // Wall collision (circle hitbox only — the barrel passes through)
    for (const wall of walls) {
        if (circleHitsRect(player.x, player.y, player.bodyRadius, wall.x, wall.y, wall.w, wall.h)) {
            const resolved = resolveCircleRect(player.x, player.y, player.bodyRadius, wall.x, wall.y, wall.w, wall.h);
            player.x  = resolved.cx;
            player.y  = resolved.cy;
            player.vx = 0;
            player.vy = 0;
        }
    }

    // Aim the barrel toward the mouse
    // Math.atan2 gives the angle between two points
    player.aimAngle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
}

function draw() {
    // Clear screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawWalls();
    drawPlayer();
    drawHitboxes(); // remove this line when you no longer need to see the hitboxes
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
