// ============================================
// Un Petit Coeur Qui Bat - Main Script
// ============================================

// Global State
const state = {
    config: null,
    video: null,
    sounds: {},
    activeSounds: new Set(),
    virtualScroll: 0,
    currentTime: 0,
    videoDuration: 0,
    isReady: false
};

// DOM Elements
const dom = {
    preloader: null,
    progressFill: null,
    progressText: null,
    playScreen: null,
    playButton: null,
    mainContent: null,
    video: null,
    debugTime: null,
    debugSpeed: null
};

// ============================================
// INITIALIZATION
// ============================================

async function init() {
    // Get DOM elements
    dom.preloader = document.getElementById('preloader');
    dom.progressFill = document.getElementById('progress-fill');
    dom.progressText = document.getElementById('progress-text');
    dom.playScreen = document.getElementById('play-screen');
    dom.playButton = document.getElementById('play-button');
    dom.mainContent = document.getElementById('main-content');
    dom.video = document.getElementById('main-video');
    dom.debugTime = document.getElementById('debug-time');
    dom.debugSpeed = document.getElementById('debug-speed');

    state.video = dom.video;

    // Load configuration
    await loadConfig();

    // Preload all media
    await preloadMedia();

    // Show play button
    showPlayButton();
}

// ============================================
// CONFIGURATION
// ============================================

async function loadConfig() {
    try {
        const response = await fetch('events.json');
        state.config = await response.json();
        console.log('Configuration loaded:', state.config);
    } catch (error) {
        console.error('Error loading configuration:', error);
    }
}

// ============================================
// PRELOADER
// ============================================

async function preloadMedia() {
    const mediaToLoad = [];
    let loadedCount = 0;

    // Video
    mediaToLoad.push(loadVideo());

    // Sounds
    const soundFiles = state.config.events
        .filter(event => event.type === 'sound')
        .map(event => event.file);

    const uniqueSounds = [...new Set(soundFiles)];
    uniqueSounds.forEach(file => {
        mediaToLoad.push(loadSound(file));
    });

    const totalMedia = mediaToLoad.length;

    // Load all media with progress tracking
    for (const promise of mediaToLoad) {
        await promise;
        loadedCount++;
        updateProgress((loadedCount / totalMedia) * 100);
    }
}

function loadVideo() {
    return new Promise((resolve, reject) => {
        const video = dom.video;

        const onCanPlay = () => {
            state.videoDuration = video.duration;
            console.log('Video loaded, duration:', state.videoDuration);
            video.removeEventListener('canplaythrough', onCanPlay);
            resolve();
        };

        video.addEventListener('canplaythrough', onCanPlay);
        video.addEventListener('error', reject);
        video.load();
    });
}

function loadSound(filename) {
    return new Promise((resolve, reject) => {
        const audio = new Audio(`assets/${filename}`);

        const onCanPlay = () => {
            console.log('Sound loaded:', filename);
            state.sounds[filename] = audio;
            audio.removeEventListener('canplaythrough', onCanPlay);
            resolve();
        };

        audio.addEventListener('canplaythrough', onCanPlay);
        audio.addEventListener('error', reject);
        audio.load();
    });
}

function updateProgress(percent) {
    dom.progressFill.style.width = percent + '%';
    dom.progressText.textContent = Math.round(percent) + '%';
}

// ============================================
// PLAY BUTTON
// ============================================

function showPlayButton() {
    dom.preloader.classList.add('hidden');
    dom.playScreen.classList.remove('hidden');

    dom.playButton.addEventListener('click', startExperience);
}

function startExperience() {
    dom.playScreen.classList.add('hidden');
    dom.mainContent.classList.remove('hidden');
    state.isReady = true;

    // Initialize scroll system
    initVirtualScroll();

    console.log('Experience started!');
}

// ============================================
// VIRTUAL SCROLL SYSTEM
// ============================================

function initVirtualScroll() {
    let scrollAccumulator = 0;

    window.addEventListener('wheel', (e) => {
        e.preventDefault();

        // Get current speed multiplier
        const speed = getCurrentSpeed();

        // Accumulate scroll delta
        const delta = e.deltaY * 0.01 * speed;
        scrollAccumulator += delta;

        // Update current time
        state.currentTime = Math.max(0, Math.min(state.videoDuration, state.currentTime + delta));

        // Update video
        state.video.currentTime = state.currentTime;

        // Update events
        updateEvents();

        // Update debug info
        updateDebugInfo(speed);

    }, { passive: false });
}

// ============================================
// SPEED ROADMAP
// ============================================

function getCurrentSpeed() {
    const roadmap = state.config.speedRoadmap;
    const time = state.currentTime;

    for (let segment of roadmap) {
        if (time >= segment.timeStart && time < segment.timeEnd) {
            return segment.speed;
        }
    }

    // Default speed if not found
    return 1.0;
}

// ============================================
// EVENT SYSTEM
// ============================================

function updateEvents() {
    const time = state.currentTime;

    state.config.events.forEach(event => {
        if (event.type === 'element') {
            updateElement(event, time);
        } else if (event.type === 'sound') {
            updateSound(event, time);
        }
    });
}

// ============================================
// ELEMENT VISIBILITY
// ============================================

function updateElement(event, time) {
    const element = document.getElementById(event.elementId);
    if (!element) return;

    const isInRange = time >= event.timeIn && time <= event.timeOut;

    if (isInRange) {
        element.classList.remove('hidden');
    } else {
        element.classList.add('hidden');
    }
}

// ============================================
// SOUND MANAGEMENT
// ============================================

function updateSound(event, time) {
    const soundKey = event.file;
    const isInRange = time >= event.timeIn && time <= event.timeOut;
    const isActive = state.activeSounds.has(soundKey);

    if (event.loop) {
        // Looping sound behavior
        if (isInRange && !isActive) {
            playLoopingSound(event);
        } else if (!isInRange && isActive) {
            stopSound(event);
        }
    } else {
        // Non-looping sound behavior
        if (isInRange && !isActive) {
            // Check if we haven't already passed the sound
            const soundAudio = state.sounds[soundKey];
            if (soundAudio && soundAudio.currentTime === 0) {
                playNonLoopingSound(event);
            }
        } else if (!isInRange && isActive) {
            stopSound(event);
        }
    }
}

function playLoopingSound(event) {
    const soundKey = event.file;
    const audio = state.sounds[soundKey];

    if (!audio) return;

    audio.loop = true;
    audio.currentTime = 0;
    audio.play().catch(err => console.error('Error playing sound:', err));
    state.activeSounds.add(soundKey);

    console.log('Playing loop sound:', soundKey);
}

function playNonLoopingSound(event) {
    const soundKey = event.file;
    const audio = state.sounds[soundKey];

    if (!audio) return;

    audio.loop = false;
    audio.currentTime = 0;
    audio.play().catch(err => console.error('Error playing sound:', err));
    state.activeSounds.add(soundKey);

    // Remove from active sounds when finished
    audio.onended = () => {
        state.activeSounds.delete(soundKey);
    };

    console.log('Playing non-loop sound:', soundKey);
}

function stopSound(event) {
    const soundKey = event.file;
    const audio = state.sounds[soundKey];

    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    state.activeSounds.delete(soundKey);

    console.log('Stopping sound:', soundKey);
}

// ============================================
// DEBUG INFO
// ============================================

function updateDebugInfo(speed) {
    if (dom.debugTime) {
        dom.debugTime.textContent = state.currentTime.toFixed(2);
    }
    if (dom.debugSpeed) {
        dom.debugSpeed.textContent = speed.toFixed(1);
    }
}

// ============================================
// START
// ============================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
