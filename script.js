/**
 * USUI LAB - Immersive CRT TV Experience
 * 完全没入型ブラウン管テレビ体験
 *
 * Web Audio API による音声合成
 * 物理シミュレーション電源ON/OFF
 * チャンネル切り替えアニメーション
 */

// =====================================================
// AUDIO CONTEXT & SOUND SYNTHESIS
// =====================================================

class CRTAudio {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.humOsc = null;
        this.humGain = null;
        this.flybackOsc = null;
        this.flybackGain = null;
        this.isInitialized = false;
        this.noiseSource = null;
        this.noiseGain = null;
    }

    init() {
        if (this.isInitialized) return;

        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3; // Master volume
            this.masterGain.connect(this.ctx.destination);
            this.isInitialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    // Physical switch click sound
    playClick() {
        if (!this.ctx) return;

        const clickOsc = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();
        const clickFilter = this.ctx.createBiquadFilter();

        clickFilter.type = 'bandpass';
        clickFilter.frequency.value = 2000;
        clickFilter.Q.value = 1;

        clickOsc.type = 'square';
        clickOsc.frequency.value = 150;

        clickGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        clickGain.gain.exponentialDecayTo = 0.01;
        clickGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.02);

        clickOsc.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(this.masterGain);

        clickOsc.start(this.ctx.currentTime);
        clickOsc.stop(this.ctx.currentTime + 0.05);
    }

    // CRT power-on sound (短い起動音のみ、常時ハム音なし)
    playPowerOn() {
        if (!this.ctx) return;

        // 短い起動音（ブーン→フェードアウト）
        const startOsc = this.ctx.createOscillator();
        const startGain = this.ctx.createGain();

        startOsc.type = 'sawtooth';
        startOsc.frequency.value = 60;

        startGain.gain.setValueAtTime(0, this.ctx.currentTime);
        startGain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.1);
        startGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

        startOsc.connect(startGain);
        startGain.connect(this.masterGain);

        startOsc.start();
        startOsc.stop(this.ctx.currentTime + 0.7);

        // 高周波の「チリッ」という音
        const highOsc = this.ctx.createOscillator();
        const highGain = this.ctx.createGain();

        highOsc.type = 'sine';
        highOsc.frequency.value = 8000;

        highGain.gain.setValueAtTime(0.05, this.ctx.currentTime + 0.05);
        highGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

        highOsc.connect(highGain);
        highGain.connect(this.masterGain);

        highOsc.start(this.ctx.currentTime + 0.05);
        highOsc.stop(this.ctx.currentTime + 0.25);
    }

    // Static noise for channel switching
    playStatic(duration = 150) {
        if (!this.ctx) return;

        const bufferSize = this.ctx.sampleRate * (duration / 1000);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Generate white noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noiseSource = this.ctx.createBufferSource();
        const noiseGain = this.ctx.createGain();
        const noiseFilter = this.ctx.createBiquadFilter();

        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 3000;
        noiseFilter.Q.value = 0.5;

        noiseSource.buffer = buffer;
        noiseGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        noiseGain.gain.exponentialDecayTo = 0.01;
        noiseGain.gain.setTargetAtTime(0.01, this.ctx.currentTime + duration / 2000, 0.05);

        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        noiseSource.start();
        noiseSource.stop(this.ctx.currentTime + duration / 1000);
    }

    // Power off "pop" sound
    playPowerOff() {
        if (!this.ctx) return;

        const popOsc = this.ctx.createOscillator();
        const popGain = this.ctx.createGain();

        popOsc.type = 'sine';
        popOsc.frequency.setValueAtTime(200, this.ctx.currentTime);
        popOsc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.1);

        popGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        popGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

        popOsc.connect(popGain);
        popGain.connect(this.masterGain);

        popOsc.start();
        popOsc.stop(this.ctx.currentTime + 0.15);
    }

    // Key type sound (remote button click)
    playKeyType() {
        if (!this.ctx) return;

        const clickOsc = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();

        clickOsc.type = 'square';
        clickOsc.frequency.value = 800 + Math.random() * 400;

        clickGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        clickGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

        clickOsc.connect(clickGain);
        clickGain.connect(this.masterGain);

        clickOsc.start();
        clickOsc.stop(this.ctx.currentTime + 0.03);
    }

    // Continuous white noise for CH0 standby
    startWhiteNoise(volume = 0.15) {
        if (!this.ctx) return;
        this.stopWhiteNoise();

        // Create 2 second noise buffer for looping
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        this.noiseSource = this.ctx.createBufferSource();
        this.noiseGain = this.ctx.createGain();
        const noiseFilter = this.ctx.createBiquadFilter();

        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 2000;
        noiseFilter.Q.value = 0.3;

        this.noiseSource.buffer = buffer;
        this.noiseSource.loop = true;
        this.noiseGain.gain.value = volume * (state.volume / 5);

        this.noiseSource.connect(noiseFilter);
        noiseFilter.connect(this.noiseGain);
        this.noiseGain.connect(this.masterGain);

        this.noiseSource.start();
    }

    stopWhiteNoise() {
        if (this.noiseSource) {
            this.noiseSource.stop();
            this.noiseSource.disconnect();
            this.noiseSource = null;
        }
        if (this.noiseGain) {
            this.noiseGain.disconnect();
            this.noiseGain = null;
        }
    }

    updateNoiseVolume(volume = 0.15) {
        if (this.noiseGain) {
            this.noiseGain.gain.value = volume * (state.volume / 5);
        }
    }
}

// =====================================================
// TV STATE
// =====================================================

const state = {
    tvOn: false,
    currentChannel: 0,
    maxChannel: 4,
    currentProject: 0,
    maxProjects: 3,
    currentContact: 0,
    maxContacts: 2,
    currentNews: 0,
    maxNews: 2,
    currentSlide: 0,
    maxSlides: 8,
    vhsSeconds: 0,
    demoScore: 0,
    volume: 3,
    currentProfileDesign: 0,
    maxProfileDesigns: 3,  // 0, 1, 2 (not counting secret)
    secretDesignActive: false,
    lang: 'ja'
};

const audio = new CRTAudio();

// =====================================================
// BGM SYSTEM
// =====================================================

const bgmTracks = {
    ch1: 'assets/bgm/game.mp3',      // CH1 全番組
    ch2: 'assets/bgm/profile.mp3',   // CH2
    ch3: 'assets/bgm/koukoku.mp3',   // CH3 全番組
    ch4_0: 'assets/bgm/news.mp3',    // CH4 Program 0 (キャスター)
    ch4_1: 'assets/bgm/news2.mp3'    // CH4 Program 1 (スライドショー)
};

let currentBgm = null;
let currentBgmKey = null;

function getBgmKey(channel, program) {
    if (channel === 0) return null;
    if (channel === 1) return 'ch1';
    if (channel === 2) return 'ch2';
    if (channel === 3) return 'ch3';
    if (channel === 4) return program === 0 ? 'ch4_0' : 'ch4_1';
    return null;
}

function playBgm(channel, program = 0) {
    const key = getBgmKey(channel, program);

    // 同じBGMなら何もしない
    if (key === currentBgmKey && currentBgm && !currentBgm.paused) return;

    // 現在のBGMを停止
    stopBgm();

    if (!key || !bgmTracks[key]) return;

    currentBgm = new Audio(bgmTracks[key]);
    currentBgm.loop = true;
    currentBgmKey = key;
    currentBgm.volume = (state.volume / 5) * 0.35;
    currentBgm.play().catch(() => {});
}

function stopBgm() {
    if (currentBgm) {
        currentBgm.pause();
        currentBgm.currentTime = 0;
        currentBgm = null;
        currentBgmKey = null;
    }
}

function updateBgmVolume() {
    if (currentBgm) {
        currentBgm.volume = (state.volume / 5) * 0.35;
    }
}

function getCurrentProgram(channel) {
    if (channel === 1) return state.currentProject;
    if (channel === 3) return state.currentContact;
    if (channel === 4) return state.currentNews;
    return 0;
}

// =====================================================
// VOICE SYSTEM
// =====================================================

const voiceTracks = {
    ch1: 'assets/voice/game.wav',      // CH1 全番組
    ch2: 'assets/voice/profile.wav',   // CH2
    ch3: 'assets/voice/koukoku.wav',   // CH3 全番組
    ch4_0: 'assets/voice/news.wav'     // CH4 Program 0 (キャスター)
};

let currentVoice = null;
let currentVoiceKey = null;

function getVoiceKey(channel, program) {
    if (channel === 0) return null;
    if (channel === 1) return 'ch1';
    if (channel === 2) return 'ch2';
    if (channel === 3) return 'ch3';
    if (channel === 4 && program === 0) return 'ch4_0';
    return null;
}

function playVoice(channel, program = 0) {
    const key = getVoiceKey(channel, program);

    // 同じボイスなら何もしない
    if (key === currentVoiceKey && currentVoice && !currentVoice.paused) return;

    // 現在のボイスを停止
    stopVoice();

    if (!key || !voiceTracks[key]) return;

    currentVoice = new Audio(voiceTracks[key]);
    currentVoice.loop = true;
    currentVoiceKey = key;
    currentVoice.volume = (state.volume / 5) * 0.15;
    currentVoice.play().catch(() => {});
}

function stopVoice() {
    if (currentVoice) {
        currentVoice.pause();
        currentVoice.currentTime = 0;
        currentVoice = null;
        currentVoiceKey = null;
    }
}

function updateVoiceVolume() {
    if (currentVoice) {
        currentVoice.volume = (state.volume / 5) * 0.15;
    }
}

// =====================================================
// DOM ELEMENTS
// =====================================================

let elements = {};

function cacheElements() {
    elements = {
        powerBtn: document.getElementById('power-btn'),
        chUp: document.getElementById('ch-up'),
        chDown: document.getElementById('ch-down'),
        progPrev: document.getElementById('prog-prev'),
        progNext: document.getElementById('prog-next'),
        powerSequence: document.getElementById('power-sequence'),
        screenOff: document.getElementById('screen-off'),
        staticNoise: document.getElementById('static-noise'),
        vhsCounter: document.getElementById('vhs-counter'),
        vhsChannel: document.getElementById('vhs-channel'),
        channels: document.querySelectorAll('.channel'),
        projectSlides: document.querySelectorAll('.project-slide'),
        carouselDots: document.querySelectorAll('#carousel-dots .dot'),
        contactSlides: document.querySelectorAll('.contact-slide'),
        contactDots: document.querySelectorAll('#contact-dots .dot'),
        newsSlides: document.querySelectorAll('.news-slide'),
        newsDots: document.querySelectorAll('#news-dots .dot'),
        newsTime: document.getElementById('news-time'),
        slideshowPhotos: document.querySelectorAll('.slideshow-photo'),
        slideshowCurrent: document.getElementById('slideshow-current'),
        slideshowProgressBar: document.getElementById('slideshow-progress-bar'),
        terminalInput: document.getElementById('terminal-input'),
        terminalOutput: document.getElementById('terminal-output'),
        p5TerminalInput: document.getElementById('p5-terminal-input'),
        p5TerminalOutput: document.getElementById('p5-terminal-output'),
        demoScore: document.getElementById('demo-score'),
        volUp: document.getElementById('vol-up'),
        volDown: document.getElementById('vol-down'),
        volumeOsd: document.getElementById('volume-osd'),
        volumeBar: document.getElementById('volume-bar'),
        volumeLevel: document.getElementById('volume-level'),
        winTime: document.getElementById('win-time'),
        winTerminalInput: document.getElementById('win-terminal-input'),
        winTerminalOutput: document.getElementById('win-terminal-output'),
        cafeTerminalInput: document.getElementById('cafe-terminal-input'),
        cafeTerminalOutput: document.getElementById('cafe-terminal-output'),
        fglTerminalInput: document.getElementById('fgl-terminal-input'),
        fglTerminalOutput: document.getElementById('fgl-terminal-output'),
        langBtn: document.getElementById('lang-btn')
    };
}

// =====================================================
// POWER ON/OFF SEQUENCE
// =====================================================

async function powerOn() {
    if (state.tvOn) return;

    // Initialize audio on first user interaction
    audio.init();

    // Click sound
    audio.playClick();

    const powerSeq = elements.powerSequence;
    const powerLine = powerSeq.querySelector('.power-line');

    // Phase 1: Show power sequence layer
    powerSeq.classList.add('active');

    // Phase 2: White line appears (300ms)
    await sleep(100);
    audio.playPowerOn();
    powerSeq.classList.add('expanding');

    // Phase 3: Line expands to fill screen (400ms)
    await sleep(300);
    powerSeq.classList.remove('expanding');
    powerSeq.classList.add('filling');

    // Phase 4: Content fades in
    await sleep(400);
    document.body.classList.remove('tv-off');
    document.body.classList.add('tv-on');
    state.tvOn = true;

    // Cleanup
    await sleep(100);
    powerSeq.classList.remove('active', 'filling');
    powerLine.style.transform = '';

    // Start VHS counter
    startVHSCounter();

    // Start clocks (news time + win time)
    startNewsTime();

    // Start demo score
    startDemoScore();
}

async function powerOff() {
    if (!state.tvOn) return;

    audio.playClick();
    await sleep(50);
    audio.playPowerOff();

    // Quick flash and off
    document.body.classList.remove('tv-on');
    document.body.classList.add('tv-off');
    state.tvOn = false;

    // Reset
    state.vhsSeconds = 0;
    state.currentChannel = 0;
    switchChannelInstant(0);
    stopBgm();
    stopVoice();
}

// =====================================================
// CHANNEL SWITCHING
// =====================================================

async function switchChannel(newChannel) {
    if (!state.tvOn) return;
    if (newChannel === state.currentChannel) return;
    if (newChannel < 0 || newChannel > state.maxChannel) return;

    // Show static noise
    elements.staticNoise.classList.add('active');
    audio.playStatic(150);

    // Show channel number
    elements.vhsChannel.textContent = `CH-${newChannel}`;
    elements.vhsChannel.classList.add('show');

    // Wait for static
    await sleep(150);

    // Switch channel
    elements.channels.forEach(ch => ch.classList.remove('active'));
    const targetChannel = document.querySelector(`.channel[data-channel="${newChannel}"]`);
    if (targetChannel) {
        targetChannel.classList.add('active');
    }

    state.currentChannel = newChannel;
    updateProgramButtons();

    // Play BGM and voice for this channel
    if (newChannel === 0) {
        stopBgm();
        stopVoice();
    } else {
        const program = getCurrentProgram(newChannel);
        playBgm(newChannel, program);
        playVoice(newChannel, program);
    }

    // Start/stop profile design rotation
    if (newChannel === 2) {
        startProfileDesignRotation();
        initCafeRain();
    } else {
        stopProfileDesignRotation();
    }

    // Remove static
    elements.staticNoise.classList.remove('active');

    // Hide channel number after delay
    await sleep(1500);
    elements.vhsChannel.classList.remove('show');
}

function switchChannelInstant(channel) {
    elements.channels.forEach(ch => ch.classList.remove('active'));
    const targetChannel = document.querySelector(`.channel[data-channel="${channel}"]`);
    if (targetChannel) {
        targetChannel.classList.add('active');
    }
    state.currentChannel = channel;
    updateProgramButtons();
}

function nextChannel() {
    const next = state.currentChannel < state.maxChannel ? state.currentChannel + 1 : 0;
    switchChannel(next);
}

function prevChannel() {
    const prev = state.currentChannel > 0 ? state.currentChannel - 1 : state.maxChannel;
    switchChannel(prev);
}

// =====================================================
// PROJECT CAROUSEL
// =====================================================

function switchProject(index) {
    if (index < 0 || index >= state.maxProjects) return;

    elements.projectSlides.forEach(slide => slide.classList.remove('active'));
    elements.carouselDots.forEach(dot => dot.classList.remove('active'));

    const targetSlide = document.querySelector(`.project-slide[data-project="${index}"]`);
    if (targetSlide) {
        targetSlide.classList.add('active');
    }

    if (elements.carouselDots[index]) {
        elements.carouselDots[index].classList.add('active');
    }

    state.currentProject = index;
}

function nextProject() {
    const next = (state.currentProject + 1) % state.maxProjects;
    switchProject(next);
}

function prevProject() {
    const prev = state.currentProject > 0 ? state.currentProject - 1 : state.maxProjects - 1;
    switchProject(prev);
}

// =====================================================
// CONTACT CAROUSEL
// =====================================================

function switchContact(index) {
    if (index < 0 || index >= state.maxContacts) return;

    elements.contactSlides.forEach(slide => slide.classList.remove('active'));
    elements.contactDots.forEach(dot => dot.classList.remove('active'));

    const targetSlide = document.querySelector(`.contact-slide[data-contact="${index}"]`);
    if (targetSlide) {
        targetSlide.classList.add('active');
    }

    if (elements.contactDots[index]) {
        elements.contactDots[index].classList.add('active');
    }

    state.currentContact = index;
}

function nextContact() {
    const next = (state.currentContact + 1) % state.maxContacts;
    switchContact(next);
}

function prevContact() {
    const prev = state.currentContact > 0 ? state.currentContact - 1 : state.maxContacts - 1;
    switchContact(prev);
}

// =====================================================
// NEWS CAROUSEL
// =====================================================

function switchNews(index) {
    if (index < 0 || index >= state.maxNews) return;

    elements.newsSlides.forEach(slide => slide.classList.remove('active'));
    elements.newsDots.forEach(dot => dot.classList.remove('active'));

    const targetSlide = document.querySelector(`.news-slide[data-news="${index}"]`);
    if (targetSlide) {
        targetSlide.classList.add('active');
    }

    if (elements.newsDots[index]) {
        elements.newsDots[index].classList.add('active');
    }

    state.currentNews = index;

    // Start/stop slideshow based on which program is active
    if (index === 1) {
        startSlideshow();
    } else {
        stopSlideshow();
    }

    // CH4は番組ごとにBGM/ボイスが違う
    playBgm(4, index);
    playVoice(4, index);
}

function nextNews() {
    const next = (state.currentNews + 1) % state.maxNews;
    switchNews(next);
}

function prevNews() {
    const prev = state.currentNews > 0 ? state.currentNews - 1 : state.maxNews - 1;
    switchNews(prev);
}

// =====================================================
// PHOTO SLIDESHOW
// =====================================================

let slideshowInterval = null;
let progressInterval = null;
const SLIDE_DURATION = 4000; // 4 seconds per photo

function startSlideshow() {
    if (slideshowInterval) return;

    state.currentSlide = 0;
    updateSlide();
    startProgress();

    slideshowInterval = setInterval(() => {
        state.currentSlide = (state.currentSlide + 1) % state.maxSlides;
        updateSlide();
        resetProgress();
    }, SLIDE_DURATION);
}

function stopSlideshow() {
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
        slideshowInterval = null;
    }
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
    // Reset to first slide
    state.currentSlide = 0;
    updateSlide();
    if (elements.slideshowProgressBar) {
        elements.slideshowProgressBar.style.width = '0%';
    }
}

function updateSlide() {
    elements.slideshowPhotos.forEach((photo, index) => {
        if (index === state.currentSlide) {
            photo.classList.add('active');
        } else {
            photo.classList.remove('active');
        }
    });

    if (elements.slideshowCurrent) {
        elements.slideshowCurrent.textContent = state.currentSlide + 1;
    }
}

function startProgress() {
    let progress = 0;
    const step = 100 / (SLIDE_DURATION / 50); // Update every 50ms

    if (progressInterval) clearInterval(progressInterval);

    progressInterval = setInterval(() => {
        progress += step;
        if (elements.slideshowProgressBar) {
            elements.slideshowProgressBar.style.width = `${Math.min(progress, 100)}%`;
        }
    }, 50);
}

function resetProgress() {
    if (progressInterval) {
        clearInterval(progressInterval);
    }
    if (elements.slideshowProgressBar) {
        elements.slideshowProgressBar.style.width = '0%';
    }
    startProgress();
}

function nextSlide() {
    if (!slideshowInterval) return; // スライドショーが動いてない時は無視
    state.currentSlide = (state.currentSlide + 1) % state.maxSlides;
    updateSlide();
    resetProgress();
    // タイマーをリセット
    clearInterval(slideshowInterval);
    slideshowInterval = setInterval(() => {
        state.currentSlide = (state.currentSlide + 1) % state.maxSlides;
        updateSlide();
        resetProgress();
    }, SLIDE_DURATION);
}

function prevSlide() {
    if (!slideshowInterval) return;
    state.currentSlide = state.currentSlide > 0 ? state.currentSlide - 1 : state.maxSlides - 1;
    updateSlide();
    resetProgress();
    // タイマーをリセット
    clearInterval(slideshowInterval);
    slideshowInterval = setInterval(() => {
        state.currentSlide = (state.currentSlide + 1) % state.maxSlides;
        updateSlide();
        resetProgress();
    }, SLIDE_DURATION);
}

// =====================================================
// NEWS TIME DISPLAY
// =====================================================

let newsTimeInterval = null;

function startNewsTime() {
    if (newsTimeInterval) clearInterval(newsTimeInterval);

    updateNewsTime();
    newsTimeInterval = setInterval(updateNewsTime, 1000);
}

function stopNewsTime() {
    if (newsTimeInterval) {
        clearInterval(newsTimeInterval);
        newsTimeInterval = null;
    }
}

function updateNewsTime() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const timeStr = `${h}:${m}`;

    if (elements.newsTime) {
        elements.newsTime.textContent = timeStr;
    }
    if (elements.winTime) {
        elements.winTime.textContent = timeStr;
    }
}

// 現在のチャンネルに応じた番組切り替え
function nextProgram() {
    if (state.currentChannel === 1) {
        nextProject();
    } else if (state.currentChannel === 3) {
        nextContact();
    } else if (state.currentChannel === 4) {
        // スライドショー中は写真を進める
        if (state.currentNews === 1 && slideshowInterval) {
            nextSlide();
        } else {
            nextNews();
        }
    }
}

function prevProgram() {
    if (state.currentChannel === 1) {
        prevProject();
    } else if (state.currentChannel === 3) {
        prevContact();
    } else if (state.currentChannel === 4) {
        // スライドショー中は写真を戻る
        if (state.currentNews === 1 && slideshowInterval) {
            prevSlide();
        } else {
            prevNews();
        }
    }
}

// 番組ボタンの状態を更新
function updateProgramButtons() {
    // CH1(Projects), CH3(Contact), CH4(News)に番組がある
    const hasPrograms = state.currentChannel === 1 || state.currentChannel === 3 || state.currentChannel === 4;

    if (elements.progPrev) {
        elements.progPrev.disabled = !hasPrograms;
    }
    if (elements.progNext) {
        elements.progNext.disabled = !hasPrograms;
    }

    // CH4に入ったらニュース時計を開始、離れたら停止
    if (state.currentChannel === 4) {
        startNewsTime();
    } else {
        stopNewsTime();
        stopSlideshow();
    }
}

// =====================================================
// VHS COUNTER
// =====================================================

let vhsInterval = null;

function startVHSCounter() {
    if (vhsInterval) clearInterval(vhsInterval);

    vhsInterval = setInterval(() => {
        if (!state.tvOn) {
            clearInterval(vhsInterval);
            return;
        }

        state.vhsSeconds++;
        const h = Math.floor(state.vhsSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((state.vhsSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (state.vhsSeconds % 60).toString().padStart(2, '0');

        if (elements.vhsCounter) {
            elements.vhsCounter.textContent = `${h}:${m}:${s}`;
        }
    }, 1000);
}

// =====================================================
// TERMINAL COMMAND SYSTEM
// =====================================================

function getDefaultMessage() {
    return state.lang === 'en' ? 'Welcome to my lab.' : 'ようこそ、我がラボへ。';
}

function getSecretResponse(cmd) {
    const responses = {
        ja: {
            'sg': 'エル・プサイ・コングルゥ',
            'steinsgate': 'エル・プサイ・コングルゥ',
            'elpsykongroo': 'エル・プサイ・コングルゥ',
            'tuturu': 'トゥットゥルー♪',
            'help': 'COMMANDS: sg, tuturu, clear'
        },
        en: {
            'sg': 'El Psy Kongroo',
            'steinsgate': 'El Psy Kongroo',
            'elpsykongroo': 'El Psy Kongroo',
            'tuturu': 'Tuturu~!',
            'help': 'COMMANDS: sg, tuturu, clear'
        }
    };
    return responses[state.lang][cmd] || null;
}

const secretCommands = {
    'sg': true,
    'steinsgate': true,
    'elpsykongroo': true,
    'tuturu': true,
    'help': true
};

function handleTerminalCommand(command) {
    const cmd = command.toLowerCase().trim();

    if (cmd === '') {
        return getDefaultMessage();
    }

    if (cmd === 'clear') {
        return getDefaultMessage();
    }

    if (secretCommands[cmd]) {
        // 効果音を鳴らす
        audio.playClick();
        return getSecretResponse(cmd);
    }

    return 'Unknown command...';
}

function initTerminal() {
    // P5 Terminal
    const p5Input = elements.p5TerminalInput;
    const p5Output = elements.p5TerminalOutput;
    const p5InputRow = p5Input?.parentElement;

    if (p5Input && p5Output) {
        // Focus/blur for visual feedback
        p5Input.addEventListener('focus', () => {
            if (p5InputRow) p5InputRow.classList.add('focused');
        });
        p5Input.addEventListener('blur', () => {
            if (p5InputRow) p5InputRow.classList.remove('focused');
        });

        // Key type sound
        p5Input.addEventListener('keydown', (e) => {
            // Play click sound for typing (not for Enter)
            if (e.key !== 'Enter' && e.key.length === 1) {
                audio.playKeyType();
            }

            if (e.key === 'Enter') {
                audio.playClick(); // Enter sound
                const command = p5Input.value.toLowerCase().trim();
                const response = handleTerminalCommand(command);
                p5Output.textContent = response;
                p5Input.value = '';

                // 特殊コマンドの場合、出力にエフェクト追加
                if (secretCommands[command]) {
                    p5Output.classList.add('secret-active');
                    setTimeout(() => p5Output.classList.remove('secret-active'), 500);
                }

                // 秘密デザイン発動
                if (command === 'elpsykongroo' || command === 'sg' || command === 'エルプサイコングルゥ') {
                    activateSecretDesign();
                }

                // 通常に戻す
                if (command === 'clear' || command === 'reset') {
                    deactivateSecretDesign();
                }
            }
        });
    }

    // Windows Run terminal
    const winInput = elements.winTerminalInput;
    const winOutput = elements.winTerminalOutput;

    if (winInput && winOutput) {
        winInput.addEventListener('focus', () => {
            winInput.parentElement.classList.add('focused');
        });
        winInput.addEventListener('blur', () => {
            winInput.parentElement.classList.remove('focused');
        });

        winInput.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key.length === 1) {
                audio.playKeyType();
            }

            if (e.key === 'Enter') {
                audio.playClick();
                const command = winInput.value.toLowerCase().trim();
                const response = handleTerminalCommand(command);
                winOutput.textContent = response;
                winInput.value = '';

                if (secretCommands[command]) {
                    winOutput.classList.add('secret-active');
                    setTimeout(() => winOutput.classList.remove('secret-active'), 500);
                }

                if (command === 'elpsykongroo' || command === 'sg' || command === 'エルプサイコングルゥ') {
                    activateSecretDesign();
                }

                if (command === 'clear' || command === 'reset') {
                    deactivateSecretDesign();
                }
            }
        });
    }

    // Cafe terminal
    const cafeInput = elements.cafeTerminalInput;
    const cafeOutput = elements.cafeTerminalOutput;

    if (cafeInput && cafeOutput) {
        const cafeInputRow = cafeInput.parentElement;
        cafeInput.addEventListener('focus', () => {
            if (cafeInputRow) cafeInputRow.classList.add('focused');
        });
        cafeInput.addEventListener('blur', () => {
            if (cafeInputRow) cafeInputRow.classList.remove('focused');
        });

        cafeInput.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key.length === 1) {
                audio.playKeyType();
            }

            if (e.key === 'Enter') {
                audio.playClick();
                const command = cafeInput.value.toLowerCase().trim();
                const response = handleTerminalCommand(command);
                cafeOutput.textContent = response;
                cafeInput.value = '';

                if (secretCommands[command]) {
                    cafeOutput.classList.add('secret-active');
                    setTimeout(() => cafeOutput.classList.remove('secret-active'), 500);
                }

                if (command === 'elpsykongroo' || command === 'sg' || command === 'エルプサイコングルゥ') {
                    activateSecretDesign();
                }

                if (command === 'clear' || command === 'reset') {
                    deactivateSecretDesign();
                }
            }
        });
    }

    // FGL terminal (D-Mail送信端末)
    const fglInput = elements.fglTerminalInput;
    const fglOutput = elements.fglTerminalOutput;

    if (fglInput && fglOutput) {
        const fglInputRow = fglInput.parentElement;
        fglInput.addEventListener('focus', () => {
            if (fglInputRow) fglInputRow.classList.add('focused');
        });
        fglInput.addEventListener('blur', () => {
            if (fglInputRow) fglInputRow.classList.remove('focused');
        });

        fglInput.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key.length === 1) {
                audio.playKeyType();
            }

            if (e.key === 'Enter') {
                audio.playClick();
                const command = fglInput.value.toLowerCase().trim();
                const response = handleTerminalCommand(command);
                fglOutput.textContent = response;
                fglInput.value = '';

                if (secretCommands[command]) {
                    fglOutput.classList.add('secret-active');
                    setTimeout(() => fglOutput.classList.remove('secret-active'), 500);
                }

                if (command === 'elpsykongroo' || command === 'sg' || command === 'エルプサイコングルゥ') {
                    activateSecretDesign();
                }

                if (command === 'clear' || command === 'reset') {
                    deactivateSecretDesign();
                }
            }
        });
    }

    // Legacy terminal (for other designs)
    const input = elements.terminalInput;
    const output = elements.terminalOutput;

    if (input && output) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = input.value.toLowerCase().trim();
                const response = handleTerminalCommand(command);
                output.textContent = response;
                input.value = '';

                if (secretCommands[command]) {
                    output.classList.add('secret-active');
                    setTimeout(() => output.classList.remove('secret-active'), 500);
                }

                if (command === 'elpsykongroo' || command === 'sg' || command === 'エルプサイコングルゥ') {
                    activateSecretDesign();
                }

                if (command === 'clear' || command === 'reset') {
                    deactivateSecretDesign();
                }
            }
        });
    }
}

// =====================================================
// PROFILE DESIGN SHOWCASE
// =====================================================

// Generate rain drops for cafe design
function initCafeRain() {
    const rainContainer = document.getElementById('cafe-rain');
    if (!rainContainer || rainContainer.children.length > 0) return;

    for (let i = 0; i < 50; i++) {
        const drop = document.createElement('div');
        drop.className = 'rain-drop';
        const x = Math.random() * 120;
        drop.style.setProperty('--x', x + '%');
        drop.style.left = x + '%';
        drop.style.animationDuration = (0.6 + Math.random() * 0.4) + 's';
        drop.style.animationDelay = Math.random() * 3 + 's';
        rainContainer.appendChild(drop);
    }
}

let profileDesignInterval = null;
const PROFILE_DESIGN_DURATION = 20000; // 20 seconds

function startProfileDesignRotation() {
    if (profileDesignInterval) clearInterval(profileDesignInterval);

    profileDesignInterval = setInterval(() => {
        if (!state.tvOn || state.currentChannel !== 2 || state.secretDesignActive) return;

        // Advance to next design
        const nextDesign = (state.currentProfileDesign + 1) % state.maxProfileDesigns;
        switchProfileDesign(nextDesign);
    }, PROFILE_DESIGN_DURATION);
}

function stopProfileDesignRotation() {
    if (profileDesignInterval) {
        clearInterval(profileDesignInterval);
        profileDesignInterval = null;
    }
}

function switchProfileDesign(designIndex, isSecret = false) {
    const glitch = document.getElementById('profile-glitch');
    const designs = document.querySelectorAll('.profile-design');

    if (!designs.length) return;

    // Trigger glitch effect
    if (glitch) {
        glitch.classList.add('active');
        setTimeout(() => glitch.classList.remove('active'), 300);
    }

    // Switch design after brief delay
    setTimeout(() => {
        designs.forEach(d => d.classList.remove('active'));

        const targetDesign = document.querySelector(`.profile-design[data-design="${designIndex}"]`);
        if (targetDesign) {
            targetDesign.classList.add('active');
        }

        if (!isSecret) {
            state.currentProfileDesign = designIndex;
        }
    }, 150);
}

function activateSecretDesign() {
    state.secretDesignActive = true;
    switchProfileDesign(3, true); // Design 3 is secret FGL style
}

function deactivateSecretDesign() {
    state.secretDesignActive = false;
    switchProfileDesign(state.currentProfileDesign, false);
}

// =====================================================
// DEMO SCORE ANIMATION
// =====================================================

let scoreInterval = null;
let demoTimeout = null;

function startDemoScore() {
    if (scoreInterval) clearInterval(scoreInterval);
    if (demoTimeout) clearTimeout(demoTimeout);

    const demoGame = document.getElementById('demo-game');
    const demoPlayer = document.getElementById('demo-player');

    function runDemo() {
        if (!state.tvOn || state.currentChannel !== 1) {
            demoTimeout = setTimeout(runDemo, 1000);
            return;
        }

        // Reset state
        state.demoScore = 0;
        if (elements.demoScore) elements.demoScore.textContent = '0';
        if (demoGame) {
            demoGame.classList.remove('gameover', 'hit');
        }
        if (demoPlayer) {
            demoPlayer.style.bottom = '50%';
        }

        // Score counting phase
        let dodgeCount = 0;
        const maxDodges = 3 + Math.floor(Math.random() * 3); // 3-5 dodges before game over

        scoreInterval = setInterval(() => {
            if (!state.tvOn || state.currentChannel !== 1) return;

            state.demoScore += Math.floor(Math.random() * 200) + 100;
            if (elements.demoScore) {
                elements.demoScore.textContent = state.demoScore;
            }

            // Move player to "dodge" (up/down)
            dodgeCount++;
            if (demoPlayer) {
                const pos = 20 + Math.random() * 60;
                demoPlayer.style.bottom = pos + '%';
            }

            // Game over after some dodges
            if (dodgeCount >= maxDodges) {
                clearInterval(scoreInterval);

                // Hit effect
                if (demoGame) demoGame.classList.add('hit');

                setTimeout(() => {
                    if (demoGame) {
                        demoGame.classList.remove('hit');
                        demoGame.classList.add('gameover');
                    }

                    // Restart after showing game over
                    demoTimeout = setTimeout(runDemo, 2500);
                }, 300);
            }
        }, 800);
    }

    runDemo();
}

// =====================================================
// VOLUME CONTROLS
// =====================================================

let volumeOsdTimer = null;

function volumeUp() {
    if (state.volume < 5) {
        state.volume = Math.min(5, state.volume + 1);
        updateVolumeDisplay();
        audio.playClick();
    }
}

function volumeDown() {
    if (state.volume > 0) {
        state.volume = Math.max(0, state.volume - 1);
        updateVolumeDisplay();
        audio.playClick();
    }
}

function updateVolumeDisplay() {
    const lvl = state.volume;
    const filled = '█'.repeat(lvl);
    const empty = '░'.repeat(5 - lvl);
    if (elements.volumeBar) elements.volumeBar.textContent = filled + empty;
    if (elements.volumeLevel) elements.volumeLevel.textContent = lvl;
    if (audio.masterGain) {
        audio.masterGain.gain.value = lvl / 5 * 0.5;
    }
    updateBgmVolume();
    updateVoiceVolume();
    showVolumeOsd();
}

function showVolumeOsd() {
    if (!elements.volumeOsd) return;
    elements.volumeOsd.classList.add('show');
    clearTimeout(volumeOsdTimer);
    volumeOsdTimer = setTimeout(() => {
        elements.volumeOsd.classList.remove('show');
    }, 1500);
}

// =====================================================
// KEYBOARD CONTROLS
// =====================================================

function handleKeyboard(e) {
    // 入力フィールドにフォーカスがある場合は無視
    if (document.activeElement.tagName === 'INPUT') {
        return;
    }

    // Space or Enter to toggle power
    if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (state.tvOn) {
            powerOff();
        } else {
            powerOn();
        }
        return;
    }

    // ESC to power off
    if (e.key === 'Escape' && state.tvOn) {
        powerOff();
        return;
    }

    // Arrow keys for channel switching (only when TV is on)
    if (!state.tvOn) return;

    switch (e.key) {
        case 'ArrowLeft':
            if (state.currentChannel === 1) {
                prevProject();
            } else if (state.currentChannel === 3) {
                prevContact();
            } else if (state.currentChannel === 4) {
                prevNews();
            } else {
                prevChannel();
            }
            break;
        case 'ArrowRight':
            if (state.currentChannel === 1) {
                nextProject();
            } else if (state.currentChannel === 3) {
                nextContact();
            } else if (state.currentChannel === 4) {
                nextNews();
            } else {
                nextChannel();
            }
            break;
        case 'ArrowUp':
            nextChannel();
            break;
        case 'ArrowDown':
            prevChannel();
            break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
            switchChannel(parseInt(e.key));
            break;
    }
}

// =====================================================
// KONAMI CODE EASTER EGG
// =====================================================

const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiIndex = 0;

function checkKonami(key) {
    if (key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            activateSecretMode();
            konamiIndex = 0;
        }
    } else {
        konamiIndex = 0;
    }
}

function activateSecretMode() {
    const isEn = state.lang === 'en';
    const secretMsg = document.createElement('div');
    secretMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #0a0a0a;
        border: 4px solid #ffd000;
        padding: 50px;
        z-index: 100000;
        text-align: center;
        font-family: 'VT323', monospace;
        box-shadow: 0 0 50px rgba(255, 208, 0, 0.5);
    `;
    secretMsg.innerHTML = `
        <h3 style="color: #ffd000; font-size: 2rem; margin-bottom: 20px;">SECRET CHANNEL</h3>
        <p style="color: #00ff41; font-size: 1.5rem;">${isEn ? 'El Psy Kongroo' : 'エル・プサイ・コングルゥ'}</p>
        <p style="color: #888; font-size: 1rem; margin-top: 30px;">${isEn ? 'Click to close' : 'Click to close'}</p>
    `;

    document.body.appendChild(secretMsg);

    secretMsg.addEventListener('click', () => secretMsg.remove());
    setTimeout(() => secretMsg.remove(), 5000);
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// =====================================================
// LANGUAGE / TRANSLATION SYSTEM
// =====================================================

const translations = {
    // CH0 - Welcome
    '.logo-welcome': { ja: 'ようこそ', en: 'WELCOME' },
    '.logo-sub': { ja: 'ウスイ研究所', en: 'USUI LABORATORY' },

    // CH1 - Projects
    '.project-slide[data-project="0"] .project-desc': {
        ja: 'YouTubeのコメントが弾幕になって襲いかかる！<br>避けて撃って、コメントを制圧せよ。',
        en: 'YouTube comments become bullet hell!<br>Dodge, shoot, and conquer the comments.',
        html: true
    },
    '.project-slide[data-project="0"] .project-btn.primary': { ja: '▶ PLAY / 詳細', en: '▶ PLAY / Details' },
    '.project-slide[data-project="1"] .project-desc': {
        ja: '脳が溶ける何か。<br>詳細は不明。',
        en: 'Something that melts your brain.<br>Details unknown.',
        html: true
    },
    '.project-slide[data-project="2"] .project-desc': { ja: '次なる実験は何になるのか...？', en: 'What will the next experiment be...?' },
    '.demo-bullets': { items: [
        { ja: 'すごい！', en: 'Amazing!' },
        { ja: '面白い', en: 'Fun!' },
        { ja: '最高www', en: 'LOL best' }
    ]},

    // CH2 - P5 Design
    '.p5-name-sub': { ja: 'ウスイ', en: 'USUI' },
    '.p5-terminal-hint': { ja: 'ここに入力 ↓', en: 'Type here ↓' },
    '.p5-services .service-text': { items: [
        { ja: 'AI / 生成AI', en: 'AI / Generative AI' },
        { ja: 'AI講師', en: 'AI Instructor' },
        { ja: 'アプリ開発', en: 'App Development' },
        { ja: 'Web Design', en: 'Web Design' }
    ]},

    // CH2 - Windows Design
    '.run-window .win-title': { ja: '▸ Run - ここに入力', en: '▸ Run - Type here' },
    '.tips-window .win-title': { ja: '💡 Tips - 豆知識', en: '💡 Tips - Fun Facts' },
    '.error-msg': {
        ja: '才能が見つかりません<br>やる気で補いますか？',
        en: 'Talent not found.<br>Compensate with willpower?',
        html: true
    },
    '.tips-q': { ja: '▸ 知ってた？', en: '▸ Did you know?' },
    '.tips-a': {
        ja: 'シロナガスクジラより大きいクラゲがおり、名前は<strong>キタユウレイクラゲ</strong>という',
        en: 'There is a jellyfish larger than a blue whale, called the <strong>Lion\'s Mane Jellyfish</strong>',
        html: true
    },
    '.win-services .win-service': { items: [
        { ja: '▸ AI / 生成AI', en: '▸ AI / Generative AI' },
        { ja: '▸ AI講師', en: '▸ AI Instructor' },
        { ja: '▸ アプリ開発', en: '▸ App Development' },
        { ja: '▸ Web Design', en: '▸ Web Design' }
    ]},
    '.memo-window .notepad': {
        ja: '<p>■ 買い物リスト</p><p>☑ 人参</p><p>☑ じゃがいも</p><p>☑ アスパラ</p><p>☑ シチュールー</p><p>☑ カレールー</p>',
        en: '<p>■ Shopping List</p><p>☑ Carrots</p><p>☑ Potatoes</p><p>☑ Asparagus</p><p>☑ Stew roux</p><p>☑ Curry roux</p>',
        html: true
    },
    '.error-btn': { items: [
        { ja: 'はい', en: 'Yes' },
        { ja: 'はい', en: 'Yes' }
    ]},

    // CH2 - Cafe Design
    '.cafe-section:first-child .section-title': { ja: '- 本日のおすすめ -', en: '- Today\'s Specials -' },
    '.cafe-hours': { ja: 'OPEN : いつでもご相談ください', en: 'OPEN : Feel free to reach out' },
    '.cafe-terminal-header': { ja: 'ご注文は？', en: 'Your order?' },
    '.cafe-menu .item-name': { items: [
        { ja: 'AI / 生成AI', en: 'AI / Generative AI' },
        { ja: 'AI講師', en: 'AI Instructor' },
        { ja: 'アプリ開発', en: 'App Development' },
        { ja: 'Web Design', en: 'Web Design' }
    ]},

    // CH2 - FGL Secret Design
    '.fgl-welcome': { ja: '☆★☆ ようこそ！！ ☆★☆', en: '☆★☆ WELCOME!! ☆★☆' },
    '.fgl-title': { ja: 'ウスイラボのホームページ', en: 'Usui Lab Homepage' },
    '.fgl-est': {
        ja: 'Since 2024 // 管理人：ウスイ // <span class="fgl-new">NEW!</span>',
        en: 'Since 2024 // Admin: Usui // <span class="fgl-new">NEW!</span>',
        html: true
    },
    '.fgl-notice-title': { ja: '◆ おしらせ ◆', en: '◆ NOTICE ◆' },
    '.fgl-notice-text': {
        ja: '・HP開設しました！！（工事中）<br>・無断リンク禁止です<br>・IE5.0推奨 800x600以上',
        en: '・Website launched!! (Under construction)<br>・No hotlinking!<br>・IE5.0 recommended, 800x600+',
        html: true
    },
    '.fgl-left .fgl-section-title': { ja: '◆ 管理人プロフ ◆', en: '◆ Admin Profile ◆' },
    '.fgl-right .fgl-section-title': { ja: '◆ コンテンツ ◆', en: '◆ CONTENTS ◆' },
    '.fgl-hitokoto-text': { ja: '「世界は欺瞞に満ちている」', en: '"The world is full of deception"' },
    '.fgl-terminal-header span:first-child': { ja: '秘密の端末', en: 'Secret Terminal' },
    '.fgl-terminal-hint': { ja: '「reset」で戻る', en: 'Type "reset" to return' },
    '.fgl-counter marquee': {
        ja: '★☆★ あなたは<span id="fgl-visitor">000198</span>人目の訪問者です ★☆★ ｷﾘ番ｹﾞｯﾄした人はBBSに報告してね！ ★☆★',
        en: '★☆★ You are visitor #<span id="fgl-visitor">000198</span> ★☆★ Got a round number? Post on BBS! ★☆★',
        html: true
    },
    '.fgl-table .fgl-label': { items: [
        { ja: '名前', en: 'Name' },
        { ja: '所属', en: 'Org' },
        { ja: '研究', en: 'Research' },
        { ja: '機材', en: 'Tools' },
        { ja: '状態', en: 'Status' }
    ]},
    '.fgl-table tr:nth-child(2) td:last-child': { ja: 'USUI LAB 主任研究員', en: 'USUI LAB Chief Researcher' },
    '.fgl-table tr:nth-child(3) td:last-child': {
        ja: 'AI / 生成AI / AI講師<br>アプリ開発 / Web Design',
        en: 'AI / Gen AI / AI Instructor<br>App Dev / Web Design',
        html: true
    },
    '.fgl-table tr:nth-child(5) .fgl-blink': { ja: '■ 実験中', en: '■ Experimenting' },
    '.fgl-links .fgl-link': { items: [
        { ja: '▶ トップページ', en: '▶ Top Page' },
        { ja: '▶ 実験記録（日記） <span class="fgl-new">NEW!</span>', en: '▶ Lab Log (Diary) <span class="fgl-new">NEW!</span>', html: true },
        { ja: '▶ 作品集', en: '▶ Portfolio' },
        { ja: '▶ ゲストブック', en: '▶ Guestbook' },
        { ja: '▶ 管理人にメール', en: '▶ Email Admin' },
        { ja: '▶ リンク集', en: '▶ Link Collection' }
    ]},

    // CH3 - Contact
    '.ad-header-text': { ja: 'こんなことにお困りではありませんか？', en: 'Having any of these problems?' },
    '.solution-text': { ja: 'そんなあなたに！', en: 'Just for you!' },
    '.cta-sub': { ja: 'お気軽にご連絡ください', en: 'Feel free to contact me' },
    '.cta-hint': { ja: 'PROG ▶ で連絡先へ', en: 'PROG ▶ for contacts' },
    '.ad-disclaimer': { ja: '※個人の趣味です。返信は気まぐれです。', en: '*This is a hobby. Replies may vary.' },
    '.footer-note': { ja: '個人の趣味で運営しています', en: 'Run as a personal hobby' },
    '.ad-problems .problem-text': { items: [
        { ja: 'ちょっとしたツールが欲しい...', en: 'I need a small tool...' },
        { ja: 'こんな機能あったらいいのに...', en: 'If only this feature existed...' },
        { ja: '誰かにアイデア聞いてほしい...', en: 'I want someone to hear my idea...' }
    ]},

    // CH4 - News
    '.telop-category': { ja: '特集', en: 'SPECIAL' },
    '.telop-headline': { ja: '美しい写真の数々　狙いは無しか？', en: 'A beautiful photo collection \u2014 any hidden agenda?' },
    '.telop-sub': { ja: 'USUI LAB が届ける至高のフォトギャラリー', en: 'The ultimate photo gallery by USUI LAB' },
    '.news-hint': { ja: 'PROG ▶ でスライドショーへ', en: 'PROG ▶ for slideshow' }
};

const placeholderTranslations = {
    '#cafe-terminal-input': { ja: 'ここに入力', en: 'type here' },
    '#fgl-terminal-input': { ja: 'ここに入力', en: 'type here' }
};

const terminalDefaults = {
    'cafe-terminal-output': { ja: 'ごゆっくりどうぞ。', en: 'Take your time.' },
    'fgl-terminal-output': { ja: 'ようこそ、我がラボへ。', en: 'Welcome to my lab.' }
};

// =====================================================
// LANGUAGE SWITCHING
// =====================================================

function switchLanguage() {
    const newLang = state.lang === 'ja' ? 'en' : 'ja';
    state.lang = newLang;

    // Static text
    for (const [selector, data] of Object.entries(translations)) {
        if (data.items) {
            // Array mapping for multiple elements
            const els = document.querySelectorAll(selector);
            els.forEach((el, i) => {
                if (i < data.items.length) {
                    const item = data.items[i];
                    if (item.html) {
                        el.innerHTML = item[newLang];
                    } else {
                        el.textContent = item[newLang];
                    }
                }
            });
        } else {
            const els = document.querySelectorAll(selector);
            els.forEach(el => {
                if (data.html) {
                    el.innerHTML = data[newLang];
                } else {
                    el.textContent = data[newLang];
                }
            });
        }
    }

    // Placeholders
    for (const [selector, data] of Object.entries(placeholderTranslations)) {
        const el = document.querySelector(selector);
        if (el) el.placeholder = data[newLang];
    }

    // Terminal defaults
    for (const [id, data] of Object.entries(terminalDefaults)) {
        const el = document.getElementById(id);
        if (el) el.textContent = data[newLang];
    }

    // Update button
    const langBtn = document.getElementById('lang-btn');
    if (langBtn) langBtn.textContent = newLang === 'ja' ? 'EN' : 'JA';

    audio.playClick();
}

// =====================================================
// INITIALIZATION
// =====================================================

function init() {
    cacheElements();

    // Initialize terminal
    initTerminal();

    // Power button
    if (elements.powerBtn) {
        elements.powerBtn.addEventListener('click', () => {
            if (state.tvOn) {
                powerOff();
            } else {
                powerOn();
            }
        });
    }

    // Channel buttons
    if (elements.chUp) {
        elements.chUp.addEventListener('click', nextChannel);
    }
    if (elements.chDown) {
        elements.chDown.addEventListener('click', prevChannel);
    }

    // Program buttons (external)
    if (elements.progPrev) {
        elements.progPrev.addEventListener('click', prevProgram);
    }
    if (elements.progNext) {
        elements.progNext.addEventListener('click', nextProgram);
    }

    if (elements.volUp) {
        elements.volUp.addEventListener('click', volumeUp);
    }
    if (elements.volDown) {
        elements.volDown.addEventListener('click', volumeDown);
    }

    // Language toggle button
    if (elements.langBtn) {
        elements.langBtn.addEventListener('click', switchLanguage);
    }

    // 初期状態で番組ボタンを更新
    updateProgramButtons();

    // Keyboard
    document.addEventListener('keydown', (e) => {
        checkKonami(e.key);
        handleKeyboard(e);
    });

    // Prevent default spacebar scroll
    document.addEventListener('keydown', (e) => {
        if (e.key === ' ') {
            e.preventDefault();
        }
    });

    // Console message
    console.log('%c USUI LAB', 'color: #ffd000; font-size: 24px; font-weight: bold; font-family: monospace; background: #0a0a0a; padding: 10px;');
    console.log('%c ウスイ研究所へようこそ', 'color: #00ff41; font-size: 14px; font-family: monospace;');
    console.log('%c ↑↑↓↓←→←→BA で隠しチャンネル', 'color: #888; font-size: 12px; font-family: monospace;');
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
