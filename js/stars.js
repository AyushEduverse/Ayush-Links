/* ============================================
   FLOATING STAR PARTICLES — Ayush-link
   ============================================ */
const StarsController = {
  canvas: null,
  ctx: null,
  particles: [],
  animationId: null,
  isRunning: false,

  init: function () {
    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.canvas = document.getElementById('star-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this.animate();

    // Resize on window change (debounced)
    var self = this;
    var resizeTimeout;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function () { self.resize(); }, 150);
    });
  },

  resize: function () {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.createParticles();
  },

  createParticles: function () {
    this.particles = [];
    var count = Math.min(Math.floor(window.innerWidth * 0.06), 50);
    var colors = [
      'rgba(225, 29, 72,',   // accent red
      'rgba(190, 18, 60,',   // accent dim
      'rgba(244, 114, 182,', // soft pink
      'rgba(251, 146, 60,',  // warm orange
      'rgba(251, 191, 36,'   // golden
    ];

    for (var i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: -(Math.random() * 0.5 + 0.2),
        opacity: Math.random() * 0.4 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  },

  animate: function () {
    var self = this;
    this.isRunning = true;

    function loop() {
      self.draw();
      self.update();
      self.animationId = requestAnimationFrame(loop);
    }

    loop();
  },

  draw: function () {
    var ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw ambient glow at top (subtle)
    var gradient = ctx.createRadialGradient(
      this.canvas.width / 2, -100, 0,
      this.canvas.width / 2, -100, 500
    );
    gradient.addColorStop(0, 'rgba(225, 29, 72, 0.04)');
    gradient.addColorStop(1, 'rgba(225, 29, 72, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw star particles
    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      var twinkle = Math.sin(p.twinklePhase) * 0.3 + 0.7;
      var alpha = p.opacity * twinkle;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color + alpha + ')';
      ctx.fill();

      // Soft glow around brighter stars
      if (p.size > 2 && alpha > 0.2) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color + (alpha * 0.15) + ')';
        ctx.fill();
      }
    }
  },

  update: function () {
    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      p.x += p.speedX;
      p.y += p.speedY;
      p.twinklePhase += p.twinkleSpeed;

      // Reset particles that go off screen
      if (p.y < -10) {
        p.y = this.canvas.height + 10;
        p.x = Math.random() * this.canvas.width;
      }
      if (p.x < -10) p.x = this.canvas.width + 10;
      if (p.x > this.canvas.width + 10) p.x = -10;
    }
  },

  destroy: function () {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.isRunning = false;
    }
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
};
