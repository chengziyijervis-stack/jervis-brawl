const SPRITE_SIZE = 60;

// --- Hitbox settings (tweak these to match your character model) ---
const bodyRadius = 18;   // radius of the circular body
const barrelLength = 20; // how far the barrel sticks out from the center
const barrelWidth = 8;   // thickness of the barrel

// Character center position
let cx = 200;
let cy = 200;
let angle = 0; // facing direction in radians

let vx = 0;
let vy = 0;

const acceleration = 0.5;
const friction = 0.95;
const maxSpeed = 9;

const keys = {};

const character = document.getElementById('character');

// Debug canvas - draws the hitbox outline so you can see it
const debugCanvas = document.createElement('canvas');
debugCanvas.style.position = 'fixed';
debugCanvas.style.top = '0';
debugCanvas.style.left = '0';
debugCanvas.style.pointerEvents = 'none';
debugCanvas.style.zIndex = '999';
document.body.appendChild(debugCanvas);
const ctx = debugCanvas.getContext('2d');

function resizeCanvas() {
    debugCanvas.width = window.innerWidth;
    debugCanvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Walls array - each wall is { x, y, w, h }
// Add your walls here once you start building the map
const walls = [
    // Example wall (uncomment to test):
    // { x: 300, y: 200, w: 200, h: 20 }
];

// Check if circle overlaps a rectangle
function circleHitsRect(cx, cy, r, rx, ry, rw, rh) {
    const nearestX = Math.max(rx, Math.min(cx, rx + rw));
    const nearestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy < r * r;
}

// Push the circle out of a rectangle it's overlapping
function resolveCircleRect(cx, cy, r, rx, ry, rw, rh) {
    const nearestX = Math.max(rx, Math.min(cx, rx + rw));
    const nearestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return { cx: cx, cy: cy - r };
    const overlap = r - dist;
    return {
        cx: cx + (dx / dist) * overlap,
        cy: cy + (dy / dist) * overlap
    };
}

// Draw the hitbox outlines on the debug canvas
function drawDebug() {
    ctx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);

    // Body circle (green)
    ctx.beginPath();
    ctx.arc(cx, cy, bodyRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Barrel rectangle (orange) — extends forward in the facing direction
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.strokeStyle = 'rgba(255, 165, 0, 0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(bodyRadius, -barrelWidth / 2, barrelLength, barrelWidth);
    ctx.restore();

    // Walls (red)
    ctx.strokeStyle = 'rgba(255, 60, 60, 0.9)';
    ctx.lineWidth = 2;
    for (const wall of walls) {
        ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
    }
}

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

function gameLoop() {
    if (keys['w'] || keys['arrowup'])    vy -= acceleration;
    if (keys['s'] || keys['arrowdown'])  vy += acceleration;
    if (keys['a'] || keys['arrowleft'])  vx -= acceleration;
    if (keys['d'] || keys['arrowright']) vx += acceleration;

    vx = Math.max(-maxSpeed, Math.min(maxSpeed, vx));
    vy = Math.max(-maxSpeed, Math.min(maxSpeed, vy));

    vx *= friction;
    vy *= friction;

    if (Math.abs(vx) < 0.01) vx = 0;
    if (Math.abs(vy) < 0.01) vy = 0;

    // Update facing angle based on movement direction
    if (vx !== 0 || vy !== 0) {
        angle = Math.atan2(vy, vx);
    }

    cx += vx;
    cy += vy;

    // Screen boundary collision (circle-aware)
    cx = Math.max(bodyRadius, Math.min(window.innerWidth - bodyRadius, cx));
    cy = Math.max(bodyRadius, Math.min(window.innerHeight - bodyRadius, cy));

    // Wall collision — uses circle body hitbox, not bounding box
    for (const wall of walls) {
        if (circleHitsRect(cx, cy, bodyRadius, wall.x, wall.y, wall.w, wall.h)) {
            const resolved = resolveCircleRect(cx, cy, bodyRadius, wall.x, wall.y, wall.w, wall.h);
            cx = resolved.cx;
            cy = resolved.cy;
            vx = 0;
            vy = 0;
        }
    }

    // Position the image so its center matches the collision center
    character.style.left = (cx - SPRITE_SIZE / 2) + 'px';
    character.style.top  = (cy - SPRITE_SIZE / 2) + 'px';

    drawDebug();
    requestAnimationFrame(gameLoop);
}

gameLoop();
