gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {

  /* ============================================
     COMPONENTE 1 — Animación de entrada del hero
     ============================================ */
  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTl
    .from('.hero-proyecto__nav', { y: -20, opacity: 0, duration: 0.7 })
    .from('.hero-proyecto__title', { y: 30, opacity: 0, duration: 0.8 }, '-=0.3')
    .from('.hero-proyecto__subtitle', { y: 20, opacity: 0, duration: 0.6 }, '-=0.5')
    .from('.hero-proyecto__desc', { y: 20, opacity: 0, duration: 0.6 }, '-=0.45')
    .from('.hero-proyecto__cta', { y: 20, opacity: 0, duration: 0.6 }, '-=0.4');

  // Cambiar pill activa al click (aquí solo visual; conecta esto a tu router/tabs real)
  const pills = document.querySelectorAll('.hero-proyecto__pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('hero-proyecto__pill--active'));
      pill.classList.add('hero-proyecto__pill--active');
      // TODO: aquí podrías disparar el cambio de imagen/contenido del hero
      // según data-target, o navegar a la sección correspondiente.
    });
  });


  /* ============================================
     Utilidad reutilizable: carrusel con drag + flechas
     (la usan tanto las cards del hero como las de experiencias)
     ============================================ */
  function initDragCarousel({ track, itemSelector, btnPrev, btnNext, gap = 20, rubberBand = 40 }) {
    const viewport = track.parentElement;
    let itemWidth = 0;
    let maxScroll = 0;
    let currentX = 0;

    function measure() {
      const item = track.querySelector(itemSelector);
      if (!item) return;
      itemWidth = item.offsetWidth + gap;
      maxScroll = Math.max(0, track.scrollWidth - viewport.offsetWidth);
      currentX = Math.min(Math.max(currentX, -maxScroll), 0);
      gsap.set(track, { x: currentX });
    }

    function goTo(deltaItems) {
      currentX -= deltaItems * itemWidth;
      currentX = Math.min(0, Math.max(currentX, -maxScroll));
      gsap.to(track, { x: currentX, duration: 0.6, ease: 'power3.out' });
    }

    if (btnNext) btnNext.addEventListener('click', () => goTo(1));
    if (btnPrev) btnPrev.addEventListener('click', () => goTo(-1));

    // Soporte de arrastre (drag) con mouse/touch, vanilla — sin plugin Draggable
    let isDown = false;
    let startX = 0;
    let startTrackX = 0;

    function dragStart(x) {
      isDown = true;
      startX = x;
      startTrackX = currentX;
      gsap.killTweensOf(track);
      track.style.cursor = 'grabbing';
    }
    function dragMove(x) {
      if (!isDown) return;
      const delta = x - startX;
      let next = startTrackX + delta;
      next = Math.min(rubberBand, Math.max(next, -maxScroll - rubberBand));
      gsap.set(track, { x: next });
    }
    function dragEnd() {
      if (!isDown) return;
      isDown = false;
      track.style.cursor = 'grab';
      currentX = Math.min(0, Math.max(gsap.getProperty(track, 'x'), -maxScroll));
      gsap.to(track, { x: currentX, duration: 0.4, ease: 'power2.out' });
    }

    viewport.style.cursor = 'grab';
    viewport.addEventListener('mousedown', e => dragStart(e.clientX));
    window.addEventListener('mousemove', e => dragMove(e.clientX));
    window.addEventListener('mouseup', dragEnd);
    viewport.addEventListener('touchstart', e => dragStart(e.touches[0].clientX), { passive: true });
    viewport.addEventListener('touchmove', e => dragMove(e.touches[0].clientX), { passive: true });
    viewport.addEventListener('touchend', dragEnd);

    window.addEventListener('resize', measure);
    measure();

    // Se expone measure() para poder recalcular límites de drag
    // cuando algo externo cambia el ancho de las tarjetas (ej. la expansión al hover/click)
    return { measure };
  }


  /* ============================================
     COMPONENTE 1B — Carrusel de cards del hero
     (Entretenimiento / Fútbol / Cultura / Gastronomía)
     ============================================ */
  initDragCarousel({
    track: document.getElementById('heroCardsTrack'),
    itemSelector: '.card',
    btnPrev: document.getElementById('heroCardsPrev'),
    btnNext: document.getElementById('heroCardsNext'),
    gap: 4,
  });


  /* ============================================
     COMPONENTE 2 — Carrusel de experiencias
     ============================================ */
  const expCarousel = initDragCarousel({
    track: document.getElementById('expTrack'),
    itemSelector: '.event-card',
    btnPrev: document.getElementById('expPrev'),
    btnNext: document.getElementById('expNext'),
    gap: 20,
  });

  /* ------------------------------------------------------------
     Expansión de tarjeta (hover en desktop / click en touch)
     El crecimiento de ancho (1.5x) ya lo hace el CSS con
     ".event-card:hover" y ".event-card--active" — acá solo:
     1) Manejamos el click/tap para dispositivos táctiles
        (donde no existe :hover).
     2) Re-medimos los límites del carrusel una vez termina
        la transición, porque el ancho total del track cambió.
     ------------------------------------------------------------ */
  const eventCards = document.querySelectorAll('#expTrack .event-card');
  const EXPAND_TRANSITION_MS = 780; // debe ser >= a la duración del transition en CSS (0.75s)

  eventCards.forEach(card => {
    // Click / tap: activa esta tarjeta y desactiva las demás
    card.addEventListener('click', (e) => {
      // Si el click fue sobre el link "Explorar experiencia", lo dejamos navegar normal
      if (e.target.closest('.event-card__link')) return;

      const wasActive = card.classList.contains('event-card--active');
      eventCards.forEach(c => c.classList.remove('event-card--active'));
      if (!wasActive) card.classList.add('event-card--active');

      setTimeout(() => expCarousel.measure(), EXPAND_TRANSITION_MS);
    });

    // Hover (desktop con mouse): recalcula límites del drag al terminar la transición
    card.addEventListener('mouseenter', () => setTimeout(() => expCarousel.measure(), EXPAND_TRANSITION_MS));
    card.addEventListener('mouseleave', () => setTimeout(() => expCarousel.measure(), EXPAND_TRANSITION_MS));
  });


  /* ============================================
     COMPONENTE 3 — Marquee infinito de aliados
     ============================================ */
  const aliadosTrack = document.getElementById('aliadosTrack');
  // Duplicamos el contenido una vez para lograr el loop perfecto
  aliadosTrack.innerHTML += aliadosTrack.innerHTML;

  function startMarquee() {
    const totalWidth = aliadosTrack.scrollWidth / 2;
    gsap.to(aliadosTrack, {
      x: -totalWidth,
      duration: totalWidth / 45, // controla la velocidad (px por segundo aprox.)
      ease: 'none',
      repeat: -1,
    });
  }
  // Esperamos a que las fuentes/layout estén listos para medir bien el ancho
  requestAnimationFrame(() => requestAnimationFrame(startMarquee));

  // Pausa el marquee al pasar el mouse
  const marqueeWrap = document.querySelector('.aliados__marquee');
  marqueeWrap.addEventListener('mouseenter', () => gsap.globalTimeline.getTweensOf(aliadosTrack).forEach(t => t.pause()));
  marqueeWrap.addEventListener('mouseleave', () => gsap.globalTimeline.getTweensOf(aliadosTrack).forEach(t => t.resume()));


  /* ============================================
     COMPONENTE 4 — Formulario de newsletter (footer)
     ============================================ */
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterMsg = document.getElementById('newsletterMsg');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('.footer-sencia__input');
      const email = input.value.trim();
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!isValid) {
        newsletterMsg.textContent = 'Ingresa un correo electrónico válido.';
        gsap.fromTo(newsletterForm, { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.4)' });
        return;
      }

      // TODO: aquí conecta tu endpoint real (Power Automate, API, etc.)
      // fetch('TU_ENDPOINT', { method: 'POST', body: JSON.stringify({ email }) })

      newsletterMsg.style.color = '#8fd694';
      newsletterMsg.textContent = '¡Listo! Te avisaremos apenas haya novedades.';
      input.value = '';
    });
  }

});