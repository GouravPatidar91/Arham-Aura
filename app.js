/**
 * ARHAM AURÀ — High Performance Canvas Image Sequence Scrubbing Engine
 * 299 High-Definition Frames @ 30fps
 */

(function () {
  'use strict';

  // --- Configuration ---
  const TOTAL_FRAMES = 299;
  const FRAME_PREFIX = './Images/ezgif-frame-';
  const FRAME_EXT = '.png';

  // --- DOM Elements ---
  const canvas = document.getElementById('scrub-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const scrubSection = document.querySelector('.scrub-section');
  const preloader = document.getElementById('preloader');
  const progressBar = document.getElementById('progress-bar');
  const progressPercent = document.getElementById('progress-percent');
  const progressText = document.getElementById('progress-text');
  const rotationAngleEl = document.getElementById('rotation-angle');
  const scrubProgressIndicator = document.getElementById('scrub-progress-indicator');
  const storyCards = document.querySelectorAll('.story-card');
  const hudHintText = document.getElementById('hud-hint-text');

  // Mode toggles
  const modeScrollBtn = document.getElementById('mode-scroll');
  const modeDragBtn = document.getElementById('mode-drag');

  // Sound toggle
  const audioToggleBtn = document.getElementById('audio-toggle');

  // --- Engine State ---
  const images = new Array(TOTAL_FRAMES);
  const loadedFlags = new Array(TOTAL_FRAMES).fill(false);
  let loadedCount = 0;
  let totalAssets = TOTAL_FRAMES;
  let targetFrameIndex = 0;
  let currentFrameIndex = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartFrame = 0;
  let activeMode = 'scroll'; // 'scroll' | 'drag'
  let audioContext = null;
  let isAudioPlaying = false;
  let ambientGainNode = null;

  // Format frame number with leading zeros (e.g. 1 -> "001")
  function getFrameUrl(index) {
    const padded = String(index + 1).padStart(3, '0');
    return `${FRAME_PREFIX}${padded}${FRAME_EXT}`;
  }

  // Find nearest loaded frame index to prevent canvas flickering during async stream
  function getNearestLoadedFrame(index) {
    if (loadedFlags[index]) return index;

    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      if (index - offset >= 0 && loadedFlags[index - offset]) {
        return index - offset;
      }
      if (index + offset < TOTAL_FRAMES && loadedFlags[index + offset]) {
        return index + offset;
      }
    }
    return 0;
  }

  // --- High Performance Progressive Frame Streaming Engine ---
  const loadingFlags = new Array(TOTAL_FRAMES).fill(false);

  // Load a single frame by index safely
  function loadSingleFrame(idx, onLoaded) {
    if (idx < 0 || idx >= TOTAL_FRAMES) return;
    if (loadedFlags[idx]) {
      if (onLoaded) onLoaded();
      return;
    }
    if (loadingFlags[idx]) return;

    loadingFlags[idx] = true;
    const img = new Image();
    img.src = getFrameUrl(idx);
    img.onload = () => {
      images[idx] = img;
      loadedFlags[idx] = true;
      loadingFlags[idx] = false;
      loadedCount++;
      updateProgress();

      if (onLoaded) onLoaded();

      // If this frame corresponds to our current render position, redraw immediately
      if (Math.abs(Math.round(currentFrameIndex) - idx) <= 1) {
        renderFrame(currentFrameIndex);
      }
    };
    img.onerror = () => {
      loadingFlags[idx] = false;
      if (onLoaded) onLoaded();
    };
  }

  // Request frames around active scrubbing position on-demand
  function requestFramesAround(centerIdx, range = 4) {
    const center = Math.round(centerIdx);
    loadSingleFrame(center);
    for (let i = 1; i <= range; i++) {
      if (center + i < TOTAL_FRAMES) loadSingleFrame(center + i);
      if (center - i >= 0) loadSingleFrame(center - i);
    }
  }

  // --- Collect & Preload ALL Website Assets (Products, Scent Notes, Craft, Founder, Brand) ---
  function getStaticAssetUrls() {
    const urls = new Set();
    document.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src');
      if (src && !src.includes('ezgif-frame')) {
        urls.add(src);
      }
    });
    return Array.from(urls);
  }

  function preloadStaticAssets(urls) {
    return new Promise((resolve) => {
      if (!urls || urls.length === 0) {
        resolve();
        return;
      }

      let done = 0;
      urls.forEach((url) => {
        const img = new Image();
        const onFinish = () => {
          loadedCount++;
          done++;
          updateProgress();
          if (done >= urls.length) resolve();
        };

        img.onload = onFinish;
        img.onerror = onFinish;
        img.src = url;
      });
    });
  }

  // Multi-Stage High Performance 3D Frame Sequence Preloader
  function preload3DSequence() {
    return new Promise((resolve) => {
      // 1. First priority: Load Frame 0 immediately for initial Canvas Paint
      const heroImg = new Image();
      heroImg.src = getFrameUrl(0);
      heroImg.onload = () => {
        images[0] = heroImg;
        loadedFlags[0] = true;
        loadedCount++;
        renderFrame(0);
        updateProgress();

        // 2. Load keyframes first (every 5 frames = 60 frames)
        loadKeyframes(() => {
          // 3. Load remaining frames to reach 100% full quality
          loadRemainingFrames(() => {
            resolve();
          });
        });
      };
      heroImg.onerror = () => {
        console.warn('Initial frame failed to load:', heroImg.src);
        loadRemainingFrames(resolve);
      };
    });
  }

  // --- Complete Site Preloader (3D Frames + All Product & Static Assets) ---
  function preloadAllWebsiteAssets() {
    return new Promise((resolve) => {
      const staticUrls = getStaticAssetUrls();
      totalAssets = TOTAL_FRAMES + staticUrls.length;

      // Safety safeguard: Never keep user stuck on preloader if network drops
      const safetyTimer = setTimeout(() => {
        finishLoading(resolve);
      }, 9000);

      let framesDone = false;
      let staticDone = false;

      function checkAllFinished() {
        if (framesDone && staticDone) {
          clearTimeout(safetyTimer);
          finishLoading(resolve);
        }
      }

      // 1. Preload static website assets (Product photos, notes artwork, logos, avatars)
      preloadStaticAssets(staticUrls).then(() => {
        staticDone = true;
        checkAllFinished();
      });

      // 2. Preload 3D Sequence Frames
      preload3DSequence().then(() => {
        framesDone = true;
        checkAllFinished();
      });
    });
  }

  function loadKeyframes(onKeyframesLoaded) {
    const step = 5;
    const keyframes = [];
    for (let i = step; i < TOTAL_FRAMES; i += step) {
      keyframes.push(i);
    }

    if (keyframes.length === 0) {
      onKeyframesLoaded();
      return;
    }

    let keyframesLoaded = 0;
    keyframes.forEach((idx) => {
      const img = new Image();
      img.src = getFrameUrl(idx);
      img.onload = () => {
        images[idx] = img;
        loadedFlags[idx] = true;
        loadedCount++;
        keyframesLoaded++;
        updateProgress();

        if (keyframesLoaded >= keyframes.length) {
          onKeyframesLoaded();
        }
      };
      img.onerror = () => {
        keyframesLoaded++;
        if (keyframesLoaded >= keyframes.length) onKeyframesLoaded();
      };
    });
  }

  function loadRemainingFrames(onComplete) {
    const pendingIndices = [];
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      if (!loadedFlags[i]) pendingIndices.push(i);
    }

    if (pendingIndices.length === 0) {
      onComplete();
      return;
    }

    let remainingDone = 0;
    const batchSize = 16;
    let nextIndex = 0;

    function loadNextBatch() {
      if (nextIndex >= pendingIndices.length) return;

      const currentBatch = pendingIndices.slice(nextIndex, nextIndex + batchSize);
      nextIndex += batchSize;

      currentBatch.forEach((idx) => {
        const img = new Image();
        img.src = getFrameUrl(idx);
        img.onload = () => {
          images[idx] = img;
          loadedFlags[idx] = true;
          loadedCount++;
          remainingDone++;
          updateProgress();

          if (remainingDone >= pendingIndices.length) {
            onComplete();
          } else {
            loadNextBatch();
          }
        };
        img.onerror = () => {
          remainingDone++;
          if (remainingDone >= pendingIndices.length) {
            onComplete();
          } else {
            loadNextBatch();
          }
        };
      });
    }

    // Launch concurrent batches for fast parallel download
    for (let b = 0; b < 4; b++) {
      loadNextBatch();
    }
  }

  function updateProgress() {
    const percent = Math.min(100, Math.round((loadedCount / totalAssets) * 100));
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressPercent) progressPercent.textContent = `${percent}%`;

    if (progressText) {
      if (percent < 25) {
        progressText.textContent = 'Initializing 3D Botanical Sanctuary...';
      } else if (percent < 60) {
        progressText.textContent = 'Preloading Product Catalog & Scent Notes...';
      } else if (percent < 90) {
        progressText.textContent = 'Sculpting 360° Candle Sequence...';
      } else if (percent < 100) {
        progressText.textContent = 'Calibrating Atelier Studio Lighting...';
      } else {
        progressText.textContent = 'Welcome to Arham Aurà';
      }
    }
  }

  function finishLoading(onComplete) {
    if (progressBar) progressBar.style.width = '100%';
    if (progressPercent) progressPercent.textContent = '100%';
    if (progressText) progressText.textContent = 'Welcome to Arham Aurà';

    setTimeout(() => {
      dismissPreloader();
      if (onComplete) onComplete();
    }, 350);
  }

  function dismissPreloader() {
    if (preloader && !preloader.classList.contains('hidden')) {
      preloader.classList.add('hidden');
      setTimeout(() => {
        if (preloader) preloader.style.display = 'none';
      }, 700);
    }
  }

  // --- High-DPI Canvas Rendering Engine ---
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for stellar performance
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Draw current frame with correct dimensions
    renderFrame(currentFrameIndex);
  }

  function renderFrame(frameIdx) {
    const safeIdx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(frameIdx)));
    // Request target frame and immediate neighbors on-demand
    requestFramesAround(safeIdx, 4);

    const renderIdx = getNearestLoadedFrame(safeIdx);
    const img = images[renderIdx];

    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const isPortrait = ch > cw;

    // In portrait mode, scale up by 1.18x so bouquet can be elevated without exposing any canvas gap
    const extraScale = isPortrait ? 1.18 : 1.0;
    const baseRatio = Math.max(cw / iw, ch / ih);
    const ratio = baseRatio * extraScale;

    const renderW = iw * ratio;
    const renderH = ih * ratio;
    const renderX = (cw - renderW) / 2;

    // Upward bias in portrait, strictly clamped so bottom never reveals empty background
    const desiredYOffset = isPortrait ? -ch * 0.05 : 0;
    let renderY = (ch - renderH) / 2 + desiredYOffset;

    // Airtight boundary clamps
    if (renderY + renderH < ch) {
      renderY = ch - renderH;
    }
    if (renderY > 0) {
      renderY = 0;
    }

    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, renderX, renderY, renderW, renderH);

    // Update rotation readout (0° to 360°)
    const angle = Math.round((safeIdx / (TOTAL_FRAMES - 1)) * 360);
    rotationAngleEl.textContent = `${angle}° ROTATION`;

    // Update timeline indicator
    const progressFrac = safeIdx / (TOTAL_FRAMES - 1);
    scrubProgressIndicator.style.height = `${progressFrac * 100}%`;
  }

  // --- Render Loop (Smooth Lerp Physics) ---
  function updateAnimationLoop() {
    // Lerp towards target frame for silky smooth inertia
    const diff = targetFrameIndex - currentFrameIndex;

    if (Math.abs(diff) > 0.01) {
      currentFrameIndex += diff * 0.15; // Responsive 60fps interpolation
      renderFrame(currentFrameIndex);
    }

    requestAnimationFrame(updateAnimationLoop);
  }

  // --- Scroll Tracking & Narrative Overlays ---
  function onWindowScroll() {
    if (activeMode !== 'scroll') return;

    const rect = scrubSection.getBoundingClientRect();
    const scrollDistance = -rect.top;
    const totalScrollable = scrubSection.offsetHeight - window.innerHeight;

    if (totalScrollable <= 0) return;

    const progress = Math.max(0, Math.min(1, scrollDistance / totalScrollable));
    targetFrameIndex = progress * (TOTAL_FRAMES - 1);

    updateStoryPhase(progress);
  }

  function updateStoryPhase(progress) {
    // Determine active storytelling card based on rotation percentage
    let activePhase = 1;

    if (progress < 0.22) {
      activePhase = 1;
    } else if (progress >= 0.22 && progress < 0.50) {
      activePhase = 2;
    } else if (progress >= 0.50 && progress < 0.74) {
      activePhase = 3;
    } else {
      activePhase = 4;
    }

    storyCards.forEach((card) => {
      const phaseNum = parseInt(card.getAttribute('data-phase'), 10);
      if (phaseNum === activePhase) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  // --- Interactive 360° Drag & Touch Controls ---
  function setupDragInteractions() {
    canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        onPointerDown(e.touches[0]);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches.length === 1) {
        onPointerMove(e.touches[0]);
      }
    }, { passive: true });

    window.addEventListener('touchend', onPointerUp);
  }

  function onPointerDown(e) {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartFrame = currentFrameIndex;
    canvas.style.cursor = 'grabbing';
  }

  function onPointerMove(e) {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartX;
    // Map screen movement to rotation frames
    const sensitivity = (TOTAL_FRAMES / window.innerWidth) * 1.8;
    let newFrame = (dragStartFrame - deltaX * sensitivity) % TOTAL_FRAMES;

    if (newFrame < 0) newFrame += TOTAL_FRAMES;

    targetFrameIndex = newFrame;

    if (activeMode === 'drag') {
      updateStoryPhase(targetFrameIndex / (TOTAL_FRAMES - 1));
    }
  }

  function onPointerUp() {
    isDragging = false;
    canvas.style.cursor = 'grab';
  }

  // --- Mode Switching ---
  function setupModeToggles() {
    modeScrollBtn.addEventListener('click', () => {
      activeMode = 'scroll';
      modeScrollBtn.classList.add('active');
      modeDragBtn.classList.remove('active');
      hudHintText.textContent = 'Scroll down slowly to explore the 360° craftsmanship';
      onWindowScroll();
    });

    modeDragBtn.addEventListener('click', () => {
      activeMode = 'drag';
      modeDragBtn.classList.add('active');
      modeScrollBtn.classList.remove('active');
      hudHintText.textContent = 'Click & drag horizontally to freely spin the bouquet';
    });
  }

  // --- Generative Ambient Audio (Wax Flame Atmosphere) ---
  function toggleAmbientSound() {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioCtx();
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    if (!isAudioPlaying) {
      startAmbientSynth();
      isAudioPlaying = true;
      audioToggleBtn.classList.add('playing');
      audioToggleBtn.querySelector('.audio-label').textContent = 'Sound On';
    } else {
      stopAmbientSynth();
      isAudioPlaying = false;
      audioToggleBtn.classList.remove('playing');
      audioToggleBtn.querySelector('.audio-label').textContent = 'Sound';
    }
  }

  function startAmbientSynth() {
    try {
      ambientGainNode = audioContext.createGain();
      ambientGainNode.gain.setValueAtTime(0.01, audioContext.currentTime);
      ambientGainNode.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 2);
      ambientGainNode.connect(audioContext.destination);

      // Warm harmonic sine waves reminiscent of calm temple bells / candle glow
      const freqs = [220, 330, 440, 554.37];
      freqs.forEach((freq, idx) => {
        const osc = audioContext.createOscillator();
        const oscGain = audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioContext.currentTime);

        // Gentle soothing detuning
        osc.detune.setValueAtTime((idx - 1.5) * 4, audioContext.currentTime);
        oscGain.gain.setValueAtTime(0.05 / (idx + 1), audioContext.currentTime);

        osc.connect(oscGain);
        oscGain.connect(ambientGainNode);
        osc.start();
      });
    } catch (err) {
      console.warn('Audio synthesis initialized with browser policy:', err);
    }
  }

  function stopAmbientSynth() {
    if (ambientGainNode && audioContext) {
      ambientGainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.8);
      setTimeout(() => {
        if (ambientGainNode) {
          ambientGainNode.disconnect();
          ambientGainNode = null;
        }
      }, 900);
    }
  }

  // --- Interactive Catalog Subsystems ---
  // --- Interactive Infinite Carousel Subsystem ---
  function setupInfiniteCarousel() {
    const wrapper = document.getElementById('carousel-wrapper');
    const viewport = document.getElementById('carousel-viewport');
    const track = document.getElementById('collections-grid');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    const dotsContainer = document.getElementById('carousel-dots');
    const filterButtons = document.querySelectorAll('.filter-btn');

    if (!wrapper || !viewport || !track) return;

    // Original collection cards
    const originalCards = Array.from(track.querySelectorAll('.collection-card:not(.carousel-clone)'));
    let activeCards = [...originalCards];
    let currentIndex = 0;
    let cloneCount = 3;
    let autoPlayTimer = null;
    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let dragDistance = 0;
    let isTransitioning = false;
    let justDragged = false;

    function getCardStep() {
      const card = track.querySelector('.collection-card');
      if (!card) return 348;
      const cardWidth = card.getBoundingClientRect().width || 320;
      const style = window.getComputedStyle(track);
      const gap = parseFloat(style.columnGap || style.gap || 28);
      return cardWidth + gap;
    }

    function buildCarousel() {
      stopAutoPlay();

      // Remove any existing clones
      track.querySelectorAll('.carousel-clone').forEach(el => el.remove());

      if (activeCards.length === 0) return;

      // Show active cards and hide non-active cards
      originalCards.forEach(card => {
        if (activeCards.includes(card)) {
          card.style.display = 'flex';
          card.classList.remove('hidden', 'fade-out');
        } else {
          card.style.display = 'none';
          card.classList.add('hidden');
        }
      });

      // Number of clones on each edge for seamless infinite loop
      cloneCount = Math.min(3, activeCards.length);

      // Prepend clones of the last few cards
      for (let i = activeCards.length - 1; i >= activeCards.length - cloneCount; i--) {
        const clone = activeCards[i].cloneNode(true);
        clone.classList.add('carousel-clone');
        track.insertBefore(clone, track.firstElementChild);
      }

      // Append clones of the first few cards
      for (let i = 0; i < cloneCount; i++) {
        const clone = activeCards[i].cloneNode(true);
        clone.classList.add('carousel-clone');
        track.appendChild(clone);
      }

      // Build pagination dots matching active card count
      buildDots();

      // Start position at first real slide
      currentIndex = cloneCount;
      setTrackPosition(false);
      updateDots();
      startAutoPlay();
    }

    function buildDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      activeCards.forEach((_, idx) => {
        const dot = document.createElement('button');
        dot.className = `carousel-dot ${idx === 0 ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Navigate to creation ${idx + 1}`);
        dot.addEventListener('click', () => {
          stopAutoPlay();
          slideTo(cloneCount + idx);
          startAutoPlay();
        });
        dotsContainer.appendChild(dot);
      });
    }

    function updateDots() {
      if (!dotsContainer) return;
      const dots = dotsContainer.querySelectorAll('.carousel-dot');
      if (!dots.length) return;
      const realIndex = ((currentIndex - cloneCount) % activeCards.length + activeCards.length) % activeCards.length;
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === realIndex);
      });
    }

    function getCenterOffset() {
      const card = track.querySelector('.collection-card');
      if (!card) return 0;
      const cardWidth = card.getBoundingClientRect().width;
      const viewportWidth = viewport.clientWidth;
      return (viewportWidth - cardWidth) / 2;
    }

    function setTrackPosition(animate = true) {
      const step = getCardStep();
      const centerOffset = getCenterOffset();
      const targetX = Math.round(centerOffset - (currentIndex * step));
      currentTranslate = targetX;
      prevTranslate = targetX;

      if (!animate) {
        track.classList.add('no-transition');
        track.style.transform = `translateX(${targetX}px)`;
        void track.offsetWidth; // Force synchronous reflow
        track.classList.remove('no-transition');
      } else {
        track.classList.remove('no-transition');
        track.style.transform = `translateX(${targetX}px)`;
      }
    }

    function slideTo(index, animate = true) {
      if (isTransitioning) return;
      isTransitioning = true;
      currentIndex = index;
      setTrackPosition(animate);
      updateDots();
    }

    function slideNext() {
      slideTo(currentIndex + 1);
    }

    function slidePrev() {
      slideTo(currentIndex - 1);
    }

    // Infinite loop wrap check on CSS transitionend
    track.addEventListener('transitionend', () => {
      isTransitioning = false;
      const totalActive = activeCards.length;

      if (currentIndex >= cloneCount + totalActive) {
        // Reached cloned tail -> seamlessly snap back to head without jump
        currentIndex = cloneCount;
        setTrackPosition(false);
      } else if (currentIndex < cloneCount) {
        // Reached cloned head -> seamlessly snap back to tail without jump
        currentIndex = cloneCount + totalActive - 1;
        setTrackPosition(false);
      }
      updateDots();
    });

    // Auto Advance (glides forward gently every 4.2s)
    function startAutoPlay() {
      stopAutoPlay();
      autoPlayTimer = setInterval(() => {
        if (!isDragging && !isTransitioning) {
          slideNext();
        }
      }, 4200);
    }

    function stopAutoPlay() {
      if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
      }
    }

    // Drag / Touch Swipe Mechanics
    function onPointerDown(e) {
      if (isTransitioning) return;
      if (e.target.closest('.quick-view-trigger') || e.target.closest('.card-btn')) return;

      isDragging = true;
      justDragged = false;
      startX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
      dragDistance = 0;
      prevTranslate = currentTranslate;
      stopAutoPlay();

      viewport.classList.add('is-dragging');
      track.classList.add('no-transition');
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      const currentX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
      dragDistance = currentX - startX;
      if (Math.abs(dragDistance) > 8) {
        justDragged = true;
      }
      currentTranslate = prevTranslate + dragDistance;
      track.style.transform = `translateX(${currentTranslate}px)`;
    }

    function onPointerUp() {
      if (!isDragging) return;
      isDragging = false;
      viewport.classList.remove('is-dragging');
      track.classList.remove('no-transition');

      const step = getCardStep();
      const threshold = Math.min(step * 0.2, 60);

      if (dragDistance < -threshold) {
        slideNext();
      } else if (dragDistance > threshold) {
        slidePrev();
      } else {
        slideTo(currentIndex);
      }

      startAutoPlay();
      setTimeout(() => { justDragged = false; }, 150);
    }

    // Suppress accidental card clicks when dragging
    track.addEventListener('click', (e) => {
      if (justDragged) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    // Attach pointer & touch interactions
    viewport.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    viewport.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
    window.addEventListener('touchcancel', onPointerUp);

    // Pause on hover
    viewport.addEventListener('mouseenter', stopAutoPlay);
    viewport.addEventListener('mouseleave', startAutoPlay);

    // Navigation buttons
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        stopAutoPlay();
        slidePrev();
        startAutoPlay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        stopAutoPlay();
        slideNext();
        startAutoPlay();
      });
    }

    // Window resize recalibration
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setTrackPosition(false);
      }, 100);
    });

    // Category Filter Buttons
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.getAttribute('data-category');
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (category === 'all') {
          activeCards = [...originalCards];
        } else {
          activeCards = originalCards.filter(c => c.getAttribute('data-category') === category);
        }

        buildCarousel();
      });
    });

    // Initial build
    buildCarousel();
  }

  // --- Dynamic 3D Card Tilt with Event Delegation ---
  function setupCard3DTilt() {
    if (window.matchMedia('(hover: none)').matches) return;

    document.addEventListener('mousemove', (e) => {
      const card = e.target.closest('.collection-card');
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -6.5;
      const rotateY = ((x - centerX) / centerX) * 6.5;

      card.style.transform = `perspective(1000px) translateY(-8px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    document.addEventListener('mouseout', (e) => {
      const card = e.target.closest('.collection-card');
      if (card && (!e.relatedTarget || !card.contains(e.relatedTarget))) {
        card.style.transform = '';
      }
    });
  }

  // --- Quick View Modal with Delegation ---
  function setupQuickViewModal() {
    const modal = document.getElementById('quick-view-modal');
    if (!modal) return;

    const closeBtn = document.getElementById('modal-close-btn');
    const backdrop = document.getElementById('modal-backdrop');
    const modalImg = document.getElementById('modal-img');
    const modalTitle = document.getElementById('modal-title');
    const modalCategory = document.getElementById('modal-category');
    const modalScent = document.getElementById('modal-scent');
    const modalBurn = document.getElementById('modal-burn');
    const modalDesc = document.getElementById('modal-desc');
    const modalOrderBtn = document.getElementById('modal-order-btn');

    function openModal(card) {
      const name = card.getAttribute('data-name');
      const scent = card.getAttribute('data-scent');
      const burn = card.getAttribute('data-burn');
      const desc = card.getAttribute('data-desc');
      const category = card.querySelector('.card-category')?.textContent || 'Signature Candle';
      const imgSrc = card.querySelector('.card-img')?.getAttribute('src');

      if (!name || !imgSrc) return;

      modalImg.src = imgSrc;
      modalImg.alt = name;
      modalTitle.textContent = name;
      modalCategory.textContent = category;
      modalScent.textContent = `🌸 ${scent || 'Botanical Fine Fragrance'}`;
      modalBurn.textContent = `🕯️ ${burn || 'Slow Clean Burn'}`;
      modalDesc.textContent = desc || 'Hand-crafted with pure natural soy blend and cotton wick.';
      
      const inquiryText = encodeURIComponent(`Hi! I would like to order the ${name} from Arham Aurà.`);
      modalOrderBtn.href = `https://ig.me/m/arham_auraa?text=${inquiryText}`;

      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    // Delegated click handler to work on both original and cloned cards
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.quick-view-trigger');
      if (btn && btn.tagName.toLowerCase() === 'button') {
        const card = btn.closest('.collection-card');
        if (card) {
          e.preventDefault();
          e.stopPropagation();
          openModal(card);
        }
      }
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }

  // --- Reviews / Testimonials Mobile Carousel Subsystem ---
  function setupReviewsCarousel() {
    const wrapper = document.getElementById('reviews-carousel-wrapper');
    const viewport = document.getElementById('reviews-viewport');
    const track = document.getElementById('reviews-grid');
    const prevBtn = document.getElementById('reviews-prev');
    const nextBtn = document.getElementById('reviews-next');
    const dotsContainer = document.getElementById('reviews-dots');

    if (!wrapper || !viewport || !track) return;

    const cards = Array.from(track.querySelectorAll('.review-card'));
    if (!cards.length) return;

    let currentIndex = 0;
    let autoPlayTimer = null;
    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let dragDistance = 0;

    function isMobile() {
      return window.innerWidth <= 768;
    }

    function getCardStep() {
      const card = track.querySelector('.review-card');
      if (!card) return 260;
      const cardWidth = card.getBoundingClientRect().width || 250;
      const style = window.getComputedStyle(track);
      const gap = parseFloat(style.columnGap || style.gap || 18);
      return cardWidth + gap;
    }

    function buildDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      cards.forEach((_, idx) => {
        const dot = document.createElement('button');
        dot.className = `carousel-dot ${idx === 0 ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Navigate to testimonial ${idx + 1}`);
        dot.addEventListener('click', () => {
          stopAutoPlay();
          slideTo(idx);
          startAutoPlay();
        });
        dotsContainer.appendChild(dot);
      });
    }

    function updateDots() {
      if (!dotsContainer) return;
      const dots = dotsContainer.querySelectorAll('.carousel-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentIndex);
      });
    }

    function getCenterOffset() {
      const card = track.querySelector('.review-card');
      if (!card) return 0;
      const cardWidth = card.getBoundingClientRect().width;
      const viewportWidth = viewport.clientWidth;
      return (viewportWidth - cardWidth) / 2;
    }

    function setTrackPosition(animate = true) {
      if (!isMobile()) {
        track.style.transform = '';
        return;
      }
      const step = getCardStep();
      const centerOffset = getCenterOffset();
      const targetX = Math.round(centerOffset - (currentIndex * step));
      currentTranslate = targetX;
      prevTranslate = targetX;

      if (!animate) {
        track.classList.add('no-transition');
        track.style.transform = `translateX(${targetX}px)`;
        void track.offsetWidth;
        track.classList.remove('no-transition');
      } else {
        track.classList.remove('no-transition');
        track.style.transform = `translateX(${targetX}px)`;
      }
    }

    function slideTo(index, animate = true) {
      currentIndex = Math.max(0, Math.min(index, cards.length - 1));
      setTrackPosition(animate);
      updateDots();
    }

    function slideNext() {
      if (currentIndex >= cards.length - 1) {
        slideTo(0);
      } else {
        slideTo(currentIndex + 1);
      }
    }

    function slidePrev() {
      if (currentIndex <= 0) {
        slideTo(cards.length - 1);
      } else {
        slideTo(currentIndex - 1);
      }
    }

    function startAutoPlay() {
      stopAutoPlay();
      if (!isMobile()) return;
      autoPlayTimer = setInterval(() => {
        if (!isDragging) {
          slideNext();
        }
      }, 5000);
    }

    function stopAutoPlay() {
      if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
      }
    }

    function onPointerDown(e) {
      if (!isMobile()) return;
      isDragging = true;
      startX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
      dragDistance = 0;
      prevTranslate = currentTranslate;
      stopAutoPlay();

      viewport.classList.add('is-dragging');
      track.classList.add('no-transition');
    }

    function onPointerMove(e) {
      if (!isDragging || !isMobile()) return;
      const currentX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
      dragDistance = currentX - startX;
      currentTranslate = prevTranslate + dragDistance;
      track.style.transform = `translateX(${currentTranslate}px)`;
    }

    function onPointerUp() {
      if (!isDragging || !isMobile()) return;
      isDragging = false;
      viewport.classList.remove('is-dragging');
      track.classList.remove('no-transition');

      const step = getCardStep();
      const threshold = Math.min(step * 0.2, 50);

      if (dragDistance < -threshold) {
        slideNext();
      } else if (dragDistance > threshold) {
        slidePrev();
      } else {
        slideTo(currentIndex);
      }

      startAutoPlay();
    }

    viewport.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    viewport.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
    window.addEventListener('touchcancel', onPointerUp);

    viewport.addEventListener('mouseenter', stopAutoPlay);
    viewport.addEventListener('mouseleave', startAutoPlay);

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        stopAutoPlay();
        slidePrev();
        startAutoPlay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        stopAutoPlay();
        slideNext();
        startAutoPlay();
      });
    }

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!isMobile()) {
          track.style.transform = '';
          stopAutoPlay();
        } else {
          setTrackPosition(false);
          startAutoPlay();
        }
      }, 100);
    });

    buildDots();
    if (isMobile()) {
      setTrackPosition(false);
      startAutoPlay();
    }
  }

  // --- Initialize All Subsystems ---
  function init() {
    canvas.style.cursor = 'grab';

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', onWindowScroll, { passive: true });

    setupDragInteractions();
    setupModeToggles();
    setupInfiniteCarousel();
    setupReviewsCarousel();
    setupCard3DTilt();
    setupQuickViewModal();

    if (audioToggleBtn) {
      audioToggleBtn.addEventListener('click', toggleAmbientSound);
    }

    // Initial canvas sizing
    resizeCanvas();

    // Start complete site asset preloading (3D frames + products + notes + branding)
    preloadAllWebsiteAssets().then(() => {
      console.log('Arham Aurà: All 3D sequence frames and product assets loaded successfully.');
    });

    requestAnimationFrame(updateAnimationLoop);
    onWindowScroll();
  }

  // Start upon DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
