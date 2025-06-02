const canvas = document.getElementById('network');
const ctx = canvas.getContext('2d');
let width, height;

let mouse = { x: null, y: null, radius: 150 };

class Node {
  constructor(x, y, id, color = null) {
    this.x = x;
    this.y = y;
    this.radius = 2.5;
    this.baseRadius = 2.5;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.baseAlpha = 0.3 + Math.random() * 0.7;
    this.alpha = this.baseAlpha;
    this.pulseSpeed = 0.01 + Math.random() * 0.02;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.hovered = false;
    this.id = id;
    this.color = color;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if(this.x < 0 || this.x > width) this.vx *= -1;
    if(this.y < 0 || this.y > height) this.vy *= -1;

    this.pulsePhase += this.pulseSpeed;
    this.alpha = this.baseAlpha + 0.3 * Math.sin(this.pulsePhase);

    this.hovered = false;
    if(mouse.x !== null && mouse.y !== null) {
      let dx = this.x - mouse.x;
      let dy = this.y - mouse.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if(dist < 15) {
        this.hovered = true;
        this.alpha = Math.min(1, this.alpha + (1 - dist / 15) * 0.7);
        this.radius += 0.3;
      } else {
        this.radius -= 0.3;
      }
    } else {
      this.radius -= 0.3;
    }
    this.radius = Math.min(Math.max(this.radius, this.baseRadius), this.baseRadius + 0.6);
  }

  draw() {
    if (this.color) {
      let gradientRadius = this.radius + 5;
      let gradient = ctx.createRadialGradient(
        this.x, this.y, this.radius,
        this.x, this.y, gradientRadius
      );
      gradient.addColorStop(0, this.color);
      gradient.addColorStop(0.3, this.color + '33');
      gradient.addColorStop(1, this.color + '00');

      ctx.fillStyle = gradient;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, gradientRadius * 1.1, gradientRadius * 0.6, Math.PI / 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha.toFixed(2)})`;

      ctx.shadowColor = this.hovered ? 'white' : 'rgba(0,0,0,0)';
      ctx.shadowBlur = this.hovered ? 10 : 0;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

let nodes = [];
const maxNodes = 2000;
const areaPerNode = 6000;
const maxConnectionDistance = 220;
const maxConnectionsPerNode = 80;

function init() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  const nodeCount = Math.min(maxNodes, Math.floor((width * height) / areaPerNode));
  nodes = [];

  const neonColors = [
    '#00ffff', // cian brillante
    '#ff00ff', // magenta neón
    '#39ff14', // verde neón
    '#ff073a', // rojo neón
    '#ffae00', // ámbar neón
    '#00ffea'  // aqua neón
  ];

  const brightIndices = new Set();
  while (brightIndices.size < 6 && brightIndices.size < nodeCount) {
    brightIndices.add(Math.floor(Math.random() * nodeCount));
  }

  let colorIndex = 0;
  for (let i = 0; i < nodeCount; i++) {
    const color = brightIndices.has(i) ? neonColors[colorIndex++] : null;
    nodes.push(new Node(Math.random() * width, Math.random() * height, i + 1, color));
  }
}

function draw() {
  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i < nodes.length; i++) {
    let connections = 0;
    for (let j = i + 1; j < nodes.length && connections < maxConnectionsPerNode; j++) {
      let dx = nodes[i].x - nodes[j].x;
      let dy = nodes[i].y - nodes[j].y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < maxConnectionDistance) {
        let baseAlpha = 1 - dist / maxConnectionDistance;
        let midX = (nodes[i].x + nodes[j].x) / 2;
        let midY = (nodes[i].y + nodes[j].y) / 2;
        let dxm = midX - mouse.x;
        let dym = midY - mouse.y;
        let distMouse = Math.sqrt(dxm * dxm + dym * dym);

        let alpha = baseAlpha * 0.6;
        if (mouse.x !== null && distMouse < mouse.radius) {
          alpha = Math.min(1, alpha + (1 - distMouse / mouse.radius) * 0.7);
        }

        if (alpha > 0.1) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
          ctx.lineWidth = 0.35;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
          connections++;
        }
      }
    }
  }

  nodes.forEach(node => {
    node.update();
    node.draw();
  });

  requestAnimationFrame(draw);
}

function showModal(node) {
  const modal = document.getElementById('modal');
  const modalBg = document.getElementById('modalBackground');
  const content = document.getElementById('modalContent');
  content.textContent = `Neurona ID: ${node.id}\nPosición: (${node.x.toFixed(1)}, ${node.y.toFixed(1)})`;
  modal.style.display = 'block';
  modalBg.style.display = 'block';
}

function hideModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modalBackground').style.display = 'none';
}

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  let clickedNode = null;
  let minDist = 15;

  for (const node of nodes) {
    const dx = node.x - clickX;
    const dy = node.y - clickY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
      clickedNode = node;
    }
  }

  if (clickedNode) {
    showModal(clickedNode);
  }
});

document.getElementById('closeModal').addEventListener('click', hideModal);
document.getElementById('modalBackground').addEventListener('click', hideModal);

window.addEventListener('resize', init);

window.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

window.addEventListener('mouseout', () => {
  mouse.x = null;
  mouse.y = null;
});

init();
draw();

