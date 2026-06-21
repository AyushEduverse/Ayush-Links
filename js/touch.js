/* ============================================
   TOUCH GESTURE CONTROLLER — Mobile Visual Feedback
   Pointer Events + GSAP — Levels 1-3
   ============================================ */
const TouchController = {
  /** Is this a touch device (no fine hover)? */
  isTouchDevice: false,
  /** Long-press timer reference */
  longPressTimer: null,
  /** Is long-press currently active? */
  isLongPressing: false,
  /** Trail canvas context */
  trailCtx: null,
  trailCanvas: null,
  trailParticles: [],
  trailAnimId: null,

  /* --------------------------------------------------
     INIT
     -------------------------------------------------- */
  init: function () {
    this.isTouchDevice = !window.matchMedia('(hover: hover)').matches;

    // Always add ripple + press (Pointer Events work on all devices)
    this.setupRippleEffects();
    this.setupPressEffects();
    this.setupAvatarTouchBounce();
    this.setupTypedTouchGlow();

    // Touch-only features
    if (this.isTouchDevice) {
      this.setupTouchTooltips();
      this.setupAvatarTouchTilt();
      this.setupTouchTrail();
    }
  },

  /* =============================================
     LEVEL 2a — GSAP TOUCH RIPPLES
     ============================================= */
  setupRippleEffects: function () {
    const targets = document.querySelectorAll('.social-icon-btn, .hire-cta');
    if (!targets.length || typeof gsap === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    targets.forEach(function (el) {
      // Ensure parent is positioned for absolute children
      if (getComputedStyle(el).position === 'static') {
        el.style.position = 'relative';
      }

      el.addEventListener('pointerdown', function (e) {
        // Skip if it's not a touch pointer (desktop click uses progress animation in email.js)
        if (e.pointerType !== 'touch') return;

        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const size = Math.max(rect.width, rect.height) * 1.2;

        // Create ripple element
        const ripple = document.createElement('span');
        ripple.className = 'touch-ripple';
        ripple.style.width = size + 'px';
        ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        el.appendChild(ripple);

        // Animate with GSAP
        gsap.fromTo(ripple, {
          scale: 0,
          opacity: 0.6
        }, {
          scale: 2.5,
          opacity: 0,
          duration: 0.5,
          ease: 'power2.out',
          onComplete: function () {
            ripple.remove();
          }
        });
      });
    });
  },

  /* =============================================
     LEVEL 2b — PRESS SCALE EFFECTS
     ============================================= */
  setupPressEffects: function () {
    const targets = document.querySelectorAll('.social-icon-btn, .hire-cta');
    if (!targets.length || typeof gsap === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    targets.forEach(function (el) {
      el.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'touch') return;
        gsap.to(el, {
          scale: 0.92,
          duration: 0.1,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      });

      el.addEventListener('pointerup', function (e) {
        if (e.pointerType !== 'touch') return;
        gsap.to(el, {
          scale: 1,
          duration: 0.3,
          ease: 'back.out(1.5)',
          overwrite: 'auto'
        });
      });

      el.addEventListener('pointerleave', function (e) {
        if (e.pointerType !== 'touch') return;
        gsap.to(el, {
          scale: 1,
          duration: 0.2,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      });
    });
  },

  /* =============================================
     LEVEL 2b — AVATAR TOUCH BOUNCE
     ============================================= */
  setupAvatarTouchBounce: function () {
    const avatar = document.getElementById('avatar');
    if (!avatar || typeof gsap === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    avatar.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'touch') return;
      gsap.to(avatar, {
        scale: 0.95,
        duration: 0.1,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    });

    avatar.addEventListener('pointerup', function (e) {
      if (e.pointerType !== 'touch') return;
      gsap.to(avatar, {
        scale: 1,
        duration: 0.4,
        ease: 'back.out(2)',
        overwrite: 'auto'
      });
    });

    avatar.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'touch') return;
      gsap.to(avatar, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    });
  },

  /* =============================================
     LEVEL 2b — TYPED SECTION TOUCH GLOW
     ============================================= */
  setupTypedTouchGlow: function () {
    const wrapper = document.querySelector('.typed-wrapper');
    if (!wrapper || typeof gsap === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    wrapper.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'touch') return;
      gsap.to(wrapper, {
        borderColor: 'var(--accent)',
        boxShadow: '0 0 20px var(--accent-glow), inset 0 0 20px var(--accent-glow)',
        duration: 0.15,
        ease: 'power1.out',
        overwrite: 'auto'
      });
    });

    wrapper.addEventListener('pointerup', function (e) {
      if (e.pointerType !== 'touch') return;
      gsap.to(wrapper, {
        borderColor: 'var(--border)',
        boxShadow: 'none',
        duration: 0.4,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    });

    wrapper.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'touch') return;
      gsap.to(wrapper, {
        borderColor: 'var(--border)',
        boxShadow: 'none',
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    });
  },

  /* =============================================
     LEVEL 2c — LONG-PRESS TOOLTIP + COPY-LINK (Mobile)
     ============================================= */
  setupTouchTooltips: function () {
    const buttons = document.querySelectorAll('.social-icon-btn');
    if (!buttons.length) return;

    buttons.forEach(function (btn) {
      let tooltipTimer = null;
      let copyTimer = null;

      let tooltipCancelled = false;
      let copyCancelled = false;

      let startX = 0, startY = 0;
      let touchId = null;

      function resetCopyState() {
        copyCancelled = true;
        if (copyTimer) {
          clearTimeout(copyTimer);
          copyTimer = null;
        }
      }

      btn.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'touch') return;

        // Only track one pointer at a time for long-press behaviors.
        // If another touch starts, cancel copy/tooltip.
        if (touchId !== null && touchId !== e.pointerId) {
          tooltipCancelled = true;
          resetCopyState();
        }
        touchId = e.pointerId;

        const url = btn.getAttribute('href');
        tooltipCancelled = false;
        copyCancelled = false;

        startX = e.clientX;
        startY = e.clientY;

        // 1) Existing tooltip long-press (500ms)
        tooltipTimer = setTimeout(function () {
          if (!tooltipCancelled) {
            btn.classList.add('touch-tooltip-visible');
            if (navigator.vibrate) navigator.vibrate(10);
          }
        }, 500);

        // 2) New copy-link long-press (800ms)
        // Requires: Clipboard API available + valid URL.
        if (url) {
          copyTimer = setTimeout(async function () {
            if (copyCancelled) return;

            try {
              if (!navigator.clipboard || !window.isSecureContext) {
                // Clipboard API may be blocked on non-HTTPS contexts.
                throw new Error('Clipboard unavailable');
              }

              await navigator.clipboard.writeText(url);
              TouchController.showToast('Link copied');
            } catch (err) {
              // Graceful fallback: no toast.
              console.warn('[Touch] Copy link failed:', err);
            }
          }, 800);
        }
      });

      btn.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'touch') return;
        if (touchId !== null && e.pointerId !== touchId) return;

        const dx = Math.abs(e.clientX - startX);
        const dy = Math.abs(e.clientY - startY);

        // Cancel if finger moved too much (scroll resistance)
        if (dx > 10 || dy > 10) {
          tooltipCancelled = true;
          resetCopyState();
          if (tooltipTimer) {
            clearTimeout(tooltipTimer);
            tooltipTimer = null;
          }
          btn.classList.remove('touch-tooltip-visible');
        }
      });

      btn.addEventListener('pointerup', function (e) {
        if (e.pointerType !== 'touch') return;
        if (touchId !== null && e.pointerId !== touchId) return;

        if (tooltipTimer) {
          clearTimeout(tooltipTimer);
          tooltipTimer = null;
        }
        resetCopyState();

        // If tooltip was visible, keep it briefly then hide
        if (btn.classList.contains('touch-tooltip-visible')) {
          setTimeout(function () {
            btn.classList.remove('touch-tooltip-visible');
          }, 1200);
        }

        touchId = null;
      });

      btn.addEventListener('pointerleave', function (e) {
        if (e.pointerType !== 'touch') return;
        if (touchId !== null && e.pointerId !== touchId) return;

        if (tooltipTimer) {
          clearTimeout(tooltipTimer);
          tooltipTimer = null;
        }
        resetCopyState();
        btn.classList.remove('touch-tooltip-visible');
        touchId = null;
      });

      btn.addEventListener('pointercancel', function (e) {
        if (e.pointerType !== 'touch') return;
        if (touchId !== null && e.pointerId !== touchId) return;

        if (tooltipTimer) {
          clearTimeout(tooltipTimer);
          tooltipTimer = null;
        }
        resetCopyState();
        btn.classList.remove('touch-tooltip-visible');
        touchId = null;
      });
    });
  },

  /* --------------------------------------------------
     TOAST (used by copy-link)
     -------------------------------------------------- */
  showToast: function (message) {
    const existing = document.querySelector('.bb-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'bb-toast';
    toast.textContent = message;

    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add('bb-toast--visible');
    });

    setTimeout(function () {
      toast.classList.remove('bb-toast--visible');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 200);
    }, 1200);
  },


  /* =============================================
     LEVEL 3a — AVATAR 3D TOUCH TILT
     Uses touch angle + device orientation
     ============================================= */
  setupAvatarTouchTilt: function () {
    const avatar = document.getElementById('avatar');
    if (!avatar || typeof gsap === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let isTouching = false;

    avatar.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'touch') return;
      isTouching = true;
    });

    avatar.addEventListener('pointermove', function (e) {
      if (!isTouching || e.pointerType !== 'touch') return;

      const rect = avatar.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const rotateY = x * 15;
      const rotateX = -y * 15;

      gsap.to(avatar, {
        rotationX: rotateX,
        rotationY: rotateY,
        duration: 0.15,
        ease: 'power2.out',
        overwrite: 'auto',
        transformPerspective: 500
      });
    });

    avatar.addEventListener('pointerup', function () {
      isTouching = false;
      gsap.to(avatar, {
        rotationX: 0,
        rotationY: 0,
        duration: 0.4,
        ease: 'back.out(1.5)',
        overwrite: 'auto'
      });
    });

    avatar.addEventListener('pointerleave', function () {
      isTouching = false;
      gsap.to(avatar, {
        rotationX: 0,
        rotationY: 0,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    });
  },

  /* =============================================
     LEVEL 3b — TOUCH TRAILING STARS
     Finger movement pe particle trail
     ============================================= */
  setupTouchTrail: function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Create overlay canvas
    this.trailCanvas = document.createElement('canvas');
    this.trailCanvas.className = 'touch-trail-canvas';
    document.body.appendChild(this.trailCanvas);
    this.trailCtx = this.trailCanvas.getContext('2d');
    this.resizeTrailCanvas();

    const self = this;
    window.addEventListener('resize', function () { self.resizeTrailCanvas(); });

    var isActive = false;

    document.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'touch') return;
      isActive = true;
      self.spawnTrailParticles(e.clientX, e.clientY, 3);
      self.animateTrail(); // Start loop on first touch
    });

    document.addEventListener('pointermove', function (e) {
      if (!isActive || e.pointerType !== 'touch') return;
      self.spawnTrailParticles(e.clientX, e.clientY, 2);
    });

    document.addEventListener('pointerup', function () {
      isActive = false;
    });

    document.addEventListener('pointerleave', function () {
      isActive = false;
    });
  },

  resizeTrailCanvas: function () {
    if (!this.trailCanvas) return;
    this.trailCanvas.width = window.innerWidth;
    this.trailCanvas.height = window.innerHeight;
  },

  spawnTrailParticles: function (x, y, count) {
    const colors = [
      'rgba(225, 29, 72,',
      'rgba(190, 18, 60,',
      'rgba(244, 114, 182,',
      'rgba(251, 146, 60,',
      'rgba(255, 255, 255,'
    ];

    for (let i = 0; i < count; i++) {
      this.trailParticles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        size: Math.random() * 4 + 2,
        speedX: (Math.random() - 0.5) * 2.5,
        speedY: -(Math.random() * 2 + 1),
        life: 1,
        decay: Math.random() * 0.03 + 0.02,
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: Math.random() * 0.05 + 0.02
      });
    }

    // Limit particles for performance
    if (this.trailParticles.length > 200) {
      this.trailParticles.splice(0, this.trailParticles.length - 200);
    }

    // Restart trail animation loop if it died (particles decayed to zero)
    // so new particles spawned mid-gesture are rendered immediately
    if (!this.trailAnimId) {
      this.animateTrail();
    }
  },

  animateTrail: function () {
    const self = this;
    if (this.trailAnimId) return;

    function loop() {
      if (self.trailParticles.length === 0) {
        // No particles — stop the loop, clear final frame
        self.drawTrailClear();
        self.trailAnimId = null;
        return;
      }
      self.drawTrail();
      self.updateTrail();
      self.trailAnimId = requestAnimationFrame(loop);
    }

    self.trailAnimId = requestAnimationFrame(loop);
  },

  drawTrailClear: function () {
    const ctx = this.trailCtx;
    if (!ctx) return;
    ctx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
  },

  drawTrail: function () {
    const ctx = this.trailCtx;
    if (!ctx) return;

    ctx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);

    for (let i = 0; i < this.trailParticles.length; i++) {
      const p = this.trailParticles[i];
      const alpha = p.life * 0.6;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color + alpha + ')';
      ctx.fill();

      // Soft glow for bigger particles
      if (p.size > 3 && p.life > 0.3) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life * 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color + (alpha * 0.2) + ')';
        ctx.fill();
      }
    }
  },

  updateTrail: function () {
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const p = this.trailParticles[i];
      p.x += p.speedX;
      p.y += p.speedY;
      p.speedY += p.gravity;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.trailParticles.splice(i, 1);
      }
    }
  },

  /* --------------------------------------------------
     CLEANUP
     -------------------------------------------------- */
  destroy: function () {
    if (this.trailAnimId) {
      cancelAnimationFrame(this.trailAnimId);
      this.trailAnimId = null;
    }
    if (this.trailCanvas && this.trailCanvas.parentNode) {
      this.trailCanvas.parentNode.removeChild(this.trailCanvas);
    }
    this.trailParticles = [];
  }
};
