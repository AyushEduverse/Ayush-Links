/* ============================================
   THEME CONTROLLER — Dark/Light Toggle
   Manual override with system preference fallback
   ============================================ */
const ThemeController = {
  /** Current theme: 'light' or 'dark' */
  currentTheme: 'light',

  init: function () {
    // Restore saved preference, else use system
    let saved = null;
    try { saved = localStorage.getItem('theme-preference'); } catch (_) {}
    if (saved === 'dark' || saved === 'light') {
      this.currentTheme = saved;
    } else {
      this.currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Apply theme immediately (before any render)
    this.applyTheme(false);

    // Setup toggle button
    this.setupToggle();

    // Listen for system preference changes (only if no manual save)
    var self = this;
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      var saved = null;
      try { saved = localStorage.getItem('theme-preference'); } catch (_) {}
      if (!saved) {
        self.currentTheme = e.matches ? 'dark' : 'light';
        self.applyTheme(true);
      }
    });
  },

  /** Apply theme to <html> and update icon */
  applyTheme: function (animated) {
    const html = document.documentElement;
    html.setAttribute('data-theme', this.currentTheme);

    // Update toggle icon
    this.updateToggleIcon(animated);
  },

  /**
   * Toggle between light and dark with elastic burst reveal
   * An expanding circle bursts from the toggle button with
   * spring physics, revealing the new theme underneath.
   *
   * Design rationale (UI/UX Pro Max guidelines):
   * - Duration: 400ms (complex transition, under 500ms max)
   * - Easing: Back.easeOut(2) — subtle overshoot for premium feel
   * - Button press: Elastic.easeOut — tactile feedback
   * - Interruptible: rapid-click guard + killTweensOf
   * - Reduced-motion: instant switch fallback
   */
  toggle: function () {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('theme-preference', this.currentTheme);
    } catch (_) {}

    // Animate the theme transition
    this.animateElasticReveal();
  },

  /**
   * Elastic burst reveal animation
   * 1. Button press feedback — elastic scale rebound
   * 2. Switch page to NEW theme first
   * 3. OLD bg overlay starts as tiny circle at button → invisible
   * 4. Circle bursts OUTWARD from button with spring physics → covers screen
   * 5. Overlay fades during expansion → old bg ripple dissipates
   * 6. Icon swaps mid-burst with exit-faster-than-enter timing
   *
   * Visual: a circular ripple of the old theme bursts from the button
   * and fades away, leaving the new theme visible underneath.
   */
  animateElasticReveal: function () {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;

    // Remove any existing overlay (rapid-click guard)
    var existing = document.querySelector('.theme-wave');
    if (existing) {
      if (typeof gsap !== 'undefined') gsap.killTweensOf(existing);
      existing.parentNode.removeChild(existing);
    }

    // Kill any running button animations
    if (typeof gsap !== 'undefined') gsap.killTweensOf(btn);

    // Get toggle button position (center)
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // Read OLD theme's bg color from computed styles
    // (DOM still has old data-theme since applyTheme hasn't been called yet)
    const oldBg = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#fdf5f5';

    // Skip animation if GSAP not available or reduced motion
    if (typeof gsap === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.applyTheme(true);
      return;
    }

    // Step 1: Button press feedback — elastic scale rebound
    gsap.fromTo(btn, {
      scale: 0.92
    }, {
      scale: 1,
      duration: 0.6,
      ease: 'Elastic.easeOut.config(1, 0.5)'
    });

    // Step 2: Switch page to NEW theme first
    this.applyTheme(true);

    // Calculate max radius to cover screen from button
    const dx = Math.max(cx, window.innerWidth - cx);
    const dy = Math.max(cy, window.innerHeight - cy);
    const maxRadius = Math.sqrt(dx * dx + dy * dy);

    // Step 3: Create overlay with OLD theme's bg color
    // Starts as tiny circle at button → invisible → new theme shows through
    const overlay = document.createElement('div');
    overlay.className = 'theme-wave';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.zIndex = '9998';
    overlay.style.pointerEvents = 'none';
    overlay.style.background = oldBg;
    overlay.style.willChange = 'clip-path, opacity';
    document.body.appendChild(overlay);

    gsap.set(overlay, {
      clipPath: 'circle(0% at ' + cx + 'px ' + cy + 'px)',
      opacity: 1
    });

    // Step 4: Burst the circle OUTWARD from button with spring physics
    // Old bg ripples out from button and fades away → new theme revealed
    gsap.to(overlay, {
      clipPath: 'circle(' + (maxRadius * 1.5) + 'px at ' + cx + 'px ' + cy + 'px)',
      opacity: 0,
      duration: 0.6,
      ease: 'Back.easeOut.config(2)',
      onComplete: function () {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }
    });
  },

  /**
   * Update the toggle button icon
   * Uses exit-faster-than-enter timing for responsive feel:
   * - Exit: 120ms (faster)
   * - Enter: 180ms (slower, with spring bounce)
   * Total: 300ms — within micro-interaction guidelines (150-300ms)
   */
  updateToggleIcon: function (animated) {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;

    const icon = btn.querySelector('i');
    if (!icon) return;

    const isDark = this.currentTheme === 'dark';
    const newIconClass = isDark ? 'ri-sun-line' : 'ri-moon-line';

    if (icon.className.includes(newIconClass)) return;

    if (animated && typeof gsap !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.killTweensOf(icon);

      gsap.timeline({
        onComplete: function () {
          gsap.set(icon, { clearProps: 'rotation,scale' });
        }
      })
      // Exit: 200ms — fast exit
      .to(icon, {
        rotation: -120,
        scale: 0,
        duration: 0.2,
        ease: 'power2.in'
      })
      // Swap at peak
      .call(function () {
        icon.className = isDark ? 'ri-sun-line' : 'ri-moon-line';
      })
      // Enter: 300ms — slower, spring bounce for premium feel
      .to(icon, {
        rotation: 0,
        scale: 1,
        duration: 0.3,
        ease: 'back.out(1.7)'
      });
    } else {
      icon.className = isDark ? 'ri-sun-line' : 'ri-moon-line';
    }
  },

  /** Wire up the toggle button click */
  setupToggle: function () {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;

    var self = this;
    btn.addEventListener('click', function () {
      self.toggle();
    });
  }
};
