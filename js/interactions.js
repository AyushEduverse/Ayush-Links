/* ============================================
   MICRO-INTERACTIONS — Parallax, Magnetic, Tooltips
   ============================================ */
const SocialInteraction = {
  init: function () {
    this.setupTooltipHide();
    this.setupMagneticButtons();
    this.setupAvatarTilt();
  },

  /* --------------------------------------------------
     Tooltip auto-hide after click on mobile
     -------------------------------------------------- */
  setupTooltipHide: function () {
    document.querySelectorAll('.social-icon-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const tip = this.querySelector('.tooltip');
        if (tip) {
          tip.style.opacity = '0';
          tip.style.transform = 'translateX(-50%) translateY(4px)';
        }
      });
    });
  },

  /* --------------------------------------------------
     Magnetic hover effect on social buttons
     Icon gently follows cursor within bounds
     -------------------------------------------------- */
  setupMagneticButtons: function () {
    const buttons = document.querySelectorAll('.social-icon-btn');
    if (buttons.length === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    buttons.forEach(function (btn) {
      const icon = btn.querySelector('i');
      if (!icon) return;

      btn.addEventListener('mousemove', function (e) {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const strength = 6;
        icon.style.transform = 'translate(' + (x / rect.width) * strength + 'px, ' + (y / rect.height) * strength + 'px) scale(1.1)';
      });

      btn.addEventListener('mouseleave', function () {
        icon.style.transform = '';
      });
    });
  },

  /* --------------------------------------------------
     Avatar tilt on mouse move (parallax)
     -------------------------------------------------- */
  setupAvatarTilt: function () {
    const avatar = document.getElementById('avatar');
    if (!avatar) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Skip mouse tilt on touch devices to avoid conflict with touch 3D tilt
    if (!window.matchMedia('(hover: hover)').matches) return;

    avatar.addEventListener('mousemove', function (e) {
      const rect = avatar.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const rotateY = x * 12;
      const rotateX = -y * 12;
      avatar.style.transform = 'perspective(400px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-6px)';
    });

    avatar.addEventListener('mouseleave', function () {
      avatar.style.transform = '';
    });
  },

};

