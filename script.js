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
    volume: 3
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
        demoScore: document.getElementById('demo-score'),
        volUp: document.getElementById('vol-up'),
        volDown: document.getElementById('vol-down'),
        volumeOsd: document.getElementById('volume-osd'),
        volumeBar: document.getElementById('volume-bar'),
        volumeLevel: document.getElementById('volume-level')
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

    // Start demo score
    startDemoScore();

    // Start white noise for CH0
    audio.startWhiteNoise(0.15);
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
    audio.stopWhiteNoise();
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

    // Play BGM and voice for this channel (or white noise for CH0)
    if (newChannel === 0) {
        stopBgm();
        stopVoice();
        audio.startWhiteNoise(0.15);
    } else {
        audio.stopWhiteNoise();
        const program = getCurrentProgram(newChannel);
        playBgm(newChannel, program);
        playVoice(newChannel, program);
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
    if (!elements.newsTime) return;
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    elements.newsTime.textContent = `${h}:${m}`;
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

const secretCommands = {
    'sg': 'エル・プサイ・コングルゥ',
    'steinsgate': 'エル・プサイ・コングルゥ',
    'elpsykongroo': 'エル・プサイ・コングルゥ',
    'tuturu': 'トゥットゥルー♪',
    'help': 'COMMANDS: sg, tuturu, clear'
};

const defaultMessage = 'ようこそ、我がラボへ。';

function handleTerminalCommand(command) {
    const cmd = command.toLowerCase().trim();

    if (cmd === '') {
        return defaultMessage;
    }

    if (cmd === 'clear') {
        return defaultMessage;
    }

    if (secretCommands[cmd]) {
        // 効果音を鳴らす
        audio.playClick();
        return secretCommands[cmd];
    }

    return 'Unknown command...';
}

function initTerminal() {
    const input = elements.terminalInput;
    const output = elements.terminalOutput;

    if (!input || !output) return;

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const command = input.value;
            const response = handleTerminalCommand(command);
            output.textContent = response;
            input.value = '';

            // 特殊コマンドの場合、出力にエフェクト追加
            if (secretCommands[command.toLowerCase().trim()]) {
                output.classList.add('secret-active');
                setTimeout(() => output.classList.remove('secret-active'), 500);
            }
        }
    });
}

// =====================================================
// DEMO SCORE ANIMATION
// =====================================================

let scoreInterval = null;

function startDemoScore() {
    if (scoreInterval) clearInterval(scoreInterval);

    scoreInterval = setInterval(() => {
        if (!state.tvOn || state.currentChannel !== 1) {
            return;
        }

        state.demoScore += Math.floor(Math.random() * 200) + 50;
        if (state.demoScore > 99999) state.demoScore = 0;

        if (elements.demoScore) {
            elements.demoScore.textContent = state.demoScore;
        }
    }, 300);
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
    audio.updateNoiseVolume(0.15);
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
        <p style="color: #00ff41; font-size: 1.5rem;">エル・プサイ・コングルゥ</p>
        <p style="color: #888; font-size: 1rem; margin-top: 30px;">Click to close</p>
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
