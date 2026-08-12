/* ==========================================================================
   PWA WAKTU SOLAT MALAYSIA - ENGINE & LOGIC (JAKIM API)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- STATE UTAMA ---
    const state = {
        currentZone: localStorage.getItem('jakim_zone') || 'WLY01',
        theme: localStorage.getItem('app_theme') || 'emerald',
        audioEnabled: localStorage.getItem('audio_enabled') !== 'false',
        prayerNotifs: JSON.parse(localStorage.getItem('prayer_notifs') || '{"fajr":true,"syuruk":false,"dhuhr":true,"asr":true,"maghrib":true,"isha":true}'),
        prayerData: null,
        userLocation: null,
        deferredInstallPrompt: null,
        tasbihCount: parseInt(localStorage.getItem('tasbih_count') || '0', 10),
        tasbihIndex: 0,
        lastNotificationKey: localStorage.getItem('last_notif_key') || null,
        audioUnlocked: false
    };

    // SENARAI ZIKIR TASBIH
    const TASBIH_PHRASES = [
        { arabic: 'سُبْحَانَ اللَّهِ', translation: 'Subhanallah (Maha Suci Allah)' },
        { arabic: 'الْحَمْدُ لِلَّهِ', translation: 'Alhamdulillah (Segala Puji Bagi Allah)' },
        { arabic: 'اللَّهُ أَكْبَرُ', translation: 'Allahu Akbar (Allah Maha Besar)' },
        { arabic: 'أَسْتَغْفِرُ اللَّهَ', translation: 'Astaghfirullah (Aku Memohon Ampun Kepada Allah)' },
        { arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ', translation: 'La ilaha illallah (Tiada Tuhan Melainkan Allah)' },
        { arabic: 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ', translation: 'Allahumma Salli \'Ala Muhammad (Ya Allah, Cucurilah Rahmat Ke Atas Nabi Muhammad ﷺ)' },
        { arabic: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَىٰ نَبِيِّنَا مُحَمَّدٍ', translation: 'Allahumma Salli Wasallim \'Ala Nabiyyina Muhammad (Ya Allah, Cucurilah Rahmat & Sejahtera Ke Atas Nabi ﷺ)' }
    ];

    // --- ELEMENTS DOM ---
    const dom = {
        zoneCodeDisplay: document.getElementById('display-zone-code'),
        zoneNameDisplay: document.getElementById('display-zone-name'),
        liveTimeDisplay: document.getElementById('current-live-time'),
        gregorianDateDisplay: document.getElementById('display-gregorian-date'),
        hijriDateDisplay: document.getElementById('display-hijri-date'),
        nextPrayerNameDisplay: document.getElementById('display-next-prayer-name'),
        nextPrayerTimeDisplay: document.getElementById('display-next-prayer-time'),
        cdHours: document.getElementById('cd-hours'),
        cdMinutes: document.getElementById('cd-minutes'),
        cdSeconds: document.getElementById('cd-seconds'),
        cards: {
            fajr: document.getElementById('card-fajr'),
            syuruk: document.getElementById('card-syuruk'),
            dhuhr: document.getElementById('card-dhuhr'),
            asr: document.getElementById('card-asr'),
            maghrib: document.getElementById('card-maghrib'),
            isha: document.getElementById('card-isha')
        },
        times: {
            fajr: document.getElementById('time-fajr'),
            syuruk: document.getElementById('time-syuruk'),
            dhuhr: document.getElementById('time-dhuhr'),
            asr: document.getElementById('time-asr'),
            maghrib: document.getElementById('time-maghrib'),
            isha: document.getElementById('time-isha')
        },
        btnGps: document.getElementById('btn-auto-gps'),
        btnOpenZoneModal: document.getElementById('display-zone-code'),
        btnCloseZoneModal: document.getElementById('btn-close-zone'),
        modalZone: document.getElementById('modal-zone'),
        zoneSearchInput: document.getElementById('zone-search'),
        zoneListContainer: document.getElementById('zone-list-container'),
        btnOpenThemeModal: document.getElementById('btn-open-theme'),
        btnCloseThemeModal: document.getElementById('btn-close-theme'),
        modalTheme: document.getElementById('modal-theme'),
        themeCards: document.querySelectorAll('.theme-card'),
        btnOpenInstallGuide: document.getElementById('btn-open-install-guide'),
        btnCloseInstallGuide: document.getElementById('btn-close-install-guide'),
        btnDismissInstallGuide: document.getElementById('btn-dismiss-install-guide'),
        modalInstallGuide: document.getElementById('modal-install-guide'),
        btnToggleAudio: document.getElementById('btn-toggle-audio'),
        audioIcon: document.getElementById('audio-icon'),
        azanAudio: document.getElementById('azan-audio'),
        navItems: document.querySelectorAll('.nav-item'),
        tabContents: document.querySelectorAll('.tab-content'),
        // Notifications & Settings
        btnRequestNotif: document.getElementById('btn-request-notif'),
        notifIcon: document.getElementById('notif-icon'),
        notifBanner: document.getElementById('notif-banner'),
        btnEnableNotifBanner: document.getElementById('btn-enable-notif-banner'),
        btnOpenSettings: document.getElementById('btn-open-settings'),
        btnCloseSettings: document.getElementById('btn-close-settings'),
        modalSettings: document.getElementById('modal-settings'),
        notifStatusText: document.getElementById('notif-status-text'),
        btnToggleNotifPerm: document.getElementById('btn-toggle-notif-perm'),
        btnTestAzanAudio: document.getElementById('btn-test-azan-audio'),
        btnTestPushNotif: document.getElementById('btn-test-push-notif'),
        toggles: {
            fajr: document.getElementById('toggle-notif-fajr'),
            syuruk: document.getElementById('toggle-notif-syuruk'),
            dhuhr: document.getElementById('toggle-notif-dhuhr'),
            asr: document.getElementById('toggle-notif-asr'),
            maghrib: document.getElementById('toggle-notif-maghrib'),
            isha: document.getElementById('toggle-notif-isha')
        },
        // Compass
        compassNeedle: document.getElementById('compass-needle'),
        compassDial: document.getElementById('compass-dial'),
        qiblaDegree: document.getElementById('qibla-degree'),
        qiblaAlignedBadge: document.getElementById('qibla-aligned-badge'),
        compassStatus: document.getElementById('compass-status'),
        btnRequestCompass: document.getElementById('btn-request-compass'),
        // Tasbih
        tasbihPhrase: document.getElementById('tasbih-phrase'),
        tasbihTranslation: document.getElementById('tasbih-translation'),
        tasbihCounter: document.getElementById('tasbih-counter'),
        btnTasbihCount: document.getElementById('btn-tasbih-count'),
        btnTasbihReset: document.getElementById('btn-tasbih-reset'),
        btnTasbihSwitch: document.getElementById('btn-tasbih-switch'),
        // PWA
        pwaBanner: document.getElementById('pwa-banner'),
        btnInstallPwa: document.getElementById('btn-install-pwa')
    };

    function refreshDomElements() {
        dom.zoneCodeDisplay = document.getElementById('display-zone-code');
        dom.zoneNameDisplay = document.getElementById('display-zone-name');
        dom.liveTimeDisplay = document.getElementById('current-live-time');
        dom.gregorianDateDisplay = document.getElementById('display-gregorian-date');
        dom.hijriDateDisplay = document.getElementById('display-hijri-date');
        dom.nextPrayerNameDisplay = document.getElementById('display-next-prayer-name');
        dom.nextPrayerTimeDisplay = document.getElementById('display-next-prayer-time');
        dom.cdHours = document.getElementById('cd-hours');
        dom.cdMinutes = document.getElementById('cd-minutes');
        dom.cdSeconds = document.getElementById('cd-seconds');
        dom.cards = {
            fajr: document.getElementById('card-fajr'),
            syuruk: document.getElementById('card-syuruk'),
            dhuhr: document.getElementById('card-dhuhr'),
            asr: document.getElementById('card-asr'),
            maghrib: document.getElementById('card-maghrib'),
            isha: document.getElementById('card-isha')
        };
        dom.times = {
            fajr: document.getElementById('time-fajr'),
            syuruk: document.getElementById('time-syuruk'),
            dhuhr: document.getElementById('time-dhuhr'),
            asr: document.getElementById('time-asr'),
            maghrib: document.getElementById('time-maghrib'),
            isha: document.getElementById('time-isha')
        };
        dom.btnGps = document.getElementById('btn-auto-gps');
        dom.btnOpenZoneModal = document.getElementById('display-zone-code');
        dom.btnCloseZoneModal = document.getElementById('btn-close-zone');
        dom.modalZone = document.getElementById('modal-zone');
        dom.zoneSearchInput = document.getElementById('zone-search');
        dom.zoneListContainer = document.getElementById('zone-list-container');
        dom.btnOpenThemeModal = document.getElementById('btn-open-theme');
        dom.btnCloseThemeModal = document.getElementById('btn-close-theme');
        dom.modalTheme = document.getElementById('modal-theme');
        dom.themeCards = document.querySelectorAll('.theme-card');
        dom.btnOpenInstallGuide = document.getElementById('btn-open-install-guide');
        dom.btnCloseInstallGuide = document.getElementById('btn-close-install-guide');
        dom.btnDismissInstallGuide = document.getElementById('btn-dismiss-install-guide');
        dom.modalInstallGuide = document.getElementById('modal-install-guide');
        dom.btnToggleAudio = document.getElementById('btn-toggle-audio');
        dom.audioIcon = document.getElementById('audio-icon');
        dom.azanAudio = document.getElementById('azan-audio');
        dom.navItems = document.querySelectorAll('.nav-item');
        dom.tabContents = document.querySelectorAll('.tab-content');
        dom.btnRequestNotif = document.getElementById('btn-request-notif');
        dom.notifIcon = document.getElementById('notif-icon');
        dom.notifBanner = document.getElementById('notif-banner');
        dom.btnEnableNotifBanner = document.getElementById('btn-enable-notif-banner');
        dom.btnOpenSettings = document.getElementById('btn-open-settings');
        dom.btnCloseSettings = document.getElementById('btn-close-settings');
        dom.modalSettings = document.getElementById('modal-settings');
        dom.notifStatusText = document.getElementById('notif-status-text');
        dom.btnToggleNotifPerm = document.getElementById('btn-toggle-notif-perm');
        dom.btnTestAzanAudio = document.getElementById('btn-test-azan-audio');
        dom.btnTestPushNotif = document.getElementById('btn-test-push-notif');
        dom.toggles = {
            fajr: document.getElementById('toggle-notif-fajr'),
            syuruk: document.getElementById('toggle-notif-syuruk'),
            dhuhr: document.getElementById('toggle-notif-dhuhr'),
            asr: document.getElementById('toggle-notif-asr'),
            maghrib: document.getElementById('toggle-notif-maghrib'),
            isha: document.getElementById('toggle-notif-isha')
        };
        dom.compassNeedle = document.getElementById('compass-needle');
        dom.compassDial = document.getElementById('compass-dial');
        dom.qiblaDegree = document.getElementById('qibla-degree');
        dom.qiblaAlignedBadge = document.getElementById('qibla-aligned-badge');
        dom.compassStatus = document.getElementById('compass-status');
        dom.btnRequestCompass = document.getElementById('btn-request-compass');
        dom.tasbihPhrase = document.getElementById('tasbih-phrase');
        dom.tasbihTranslation = document.getElementById('tasbih-translation');
        dom.tasbihCounter = document.getElementById('tasbih-counter');
        dom.btnTasbihCount = document.getElementById('btn-tasbih-count');
        dom.btnTasbihReset = document.getElementById('btn-tasbih-reset');
        dom.btnTasbihSwitch = document.getElementById('btn-tasbih-switch');
        dom.pwaBanner = document.getElementById('pwa-banner');
        dom.btnInstallPwa = document.getElementById('btn-install-pwa');
    }

    // --- INIT APP ---
    function init() {
        try { refreshDomElements(); } catch (e) { console.error('refreshDomElements:', e); }
        try { applyTheme(state.theme); } catch (e) { console.error('applyTheme:', e); }
        try { updateAudioButton(); } catch (e) { console.error('updateAudioButton:', e); }
        try { checkNotificationStatus(); } catch (e) { console.error('checkNotificationStatus:', e); }
        try { checkFirstTimeInstallGuide(); } catch (e) { console.error('checkFirstTimeInstallGuide:', e); }
        try { renderZoneList(); } catch (e) { console.error('renderZoneList:', e); }
        try { loadPrayerData(state.currentZone); } catch (e) { console.error('loadPrayerData:', e); }
        try { setupEventListeners(); } catch (e) { console.error('setupEventListeners:', e); }
        try { startLiveClock(); } catch (e) { console.error('startLiveClock:', e); }
        try { updateTasbihUI(); } catch (e) { console.error('updateTasbihUI:', e); }
        try { loadQuranSurah(localStorage.getItem('last_selected_surah') || '67'); } catch (e) { console.error('loadQuranSurah:', e); }
        try { registerServiceWorker(); } catch (e) { console.error('registerServiceWorker:', e); }
    }

    function checkFirstTimeInstallGuide() {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        if (isStandalone) {
            localStorage.setItem('pwa_installed', 'true');
        }
        const isInstalled = localStorage.getItem('pwa_installed') === 'true';
        const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding_v1') === 'true';
        
        // Popup onboarding HANYA dibuka untuk pelawat kali pertama dalam browser biasa (bukan PWA & belum pernah buka)
        if (!isStandalone && !isInstalled && !hasSeenOnboarding) {
            setTimeout(() => {
                openOnboarding();
            }, 700);
        }
    }

    // --- ONBOARDING WELCOME MODAL ---
    function openOnboarding() {
        const modal = document.getElementById('modal-onboarding');
        if (!modal) return;
        modal.classList.add('active');

        // Update notif status jika sudah dibenarkan
        if ('Notification' in window && Notification.permission === 'granted') {
            _onboardingMarkNotifDone();
        }
    }

    function closeOnboarding() {
        const modal = document.getElementById('modal-onboarding');
        if (!modal) return;
        modal.classList.remove('active');
        localStorage.setItem('hasSeenOnboarding_v1', 'true');
    }
    window.closeOnboarding = closeOnboarding;

    function _onboardingMarkNotifDone() {
        const badge = document.querySelector('#notif-step-status .step-badge');
        const step = document.getElementById('onboarding-step-notif');
        const btn = document.getElementById('onboarding-btn-notif');
        if (badge) { badge.textContent = '✓ Aktif'; badge.className = 'step-badge step-badge-done'; }
        if (step) step.classList.add('step-done');
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Notifikasi Diaktifkan';
            btn.style.opacity = '0.65';
            btn.disabled = true;
        }
        // Show PWA step & btn after notif done
        const pwaBtnRow = document.getElementById('onboarding-step-pwa');
        const pwaBtnAction = document.getElementById('onboarding-btn-pwa');
        if (state.deferredInstallPrompt) {
            if (pwaBtnRow) pwaBtnRow.style.display = 'flex';
            if (pwaBtnAction) pwaBtnAction.style.display = 'flex';
        }
        // Update finish button label
        const finishBtn = document.getElementById('onboarding-btn-finish');
        if (finishBtn) finishBtn.textContent = 'Mulakan Aplikasi →';
    }

    function _onboardingMarkPwaDone() {
        const badge = document.querySelector('#pwa-step-status .step-badge');
        const step = document.getElementById('onboarding-step-pwa');
        const btn = document.getElementById('onboarding-btn-pwa');
        if (badge) { badge.textContent = '✓ Dipasang'; badge.className = 'step-badge step-badge-done'; }
        if (step) step.classList.add('step-done');
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Aplikasi Dipasang';
            btn.style.opacity = '0.65';
            btn.disabled = true;
        }
    }

    window.onboardingRequestNotif = function() {
        if (!('Notification' in window)) {
            alert('Notifikasi tidak disokong pada peranti ini.');
            return;
        }
        if (Notification.permission === 'granted') {
            _onboardingMarkNotifDone();
            return;
        }
        Notification.requestPermission().then(permission => {
            checkNotificationStatus();
            if (permission === 'granted') {
                sendPushNotification('Notifikasi Solat Diaktifkan! 🕌', 'Anda akan menerima alunan azan apabila masuk waktu solat. Alhamdulillah!');
                _onboardingMarkNotifDone();
            } else {
                const badge = document.querySelector('#notif-step-status .step-badge');
                if (badge) { badge.textContent = 'Dihalang'; badge.className = 'step-badge step-badge-skip'; }
                const btn = document.getElementById('onboarding-btn-notif');
                if (btn) { btn.innerHTML = '<i class="fa-solid fa-bell-slash"></i> Notifikasi Dihalang'; btn.style.opacity = '0.65'; btn.disabled = true; }
                // Still show PWA step
                const pwaBtnRow = document.getElementById('onboarding-step-pwa');
                const pwaBtnAction = document.getElementById('onboarding-btn-pwa');
                if (state.deferredInstallPrompt) {
                    if (pwaBtnRow) pwaBtnRow.style.display = 'flex';
                    if (pwaBtnAction) pwaBtnAction.style.display = 'flex';
                }
            }
        });
    };

    window.onboardingInstallPwa = function() {
        if (!state.deferredInstallPrompt) {
            const modal = document.getElementById('modal-install-guide');
            if (modal) modal.classList.add('active');
            closeOnboarding();
            return;
        }
        state.deferredInstallPrompt.prompt();
        state.deferredInstallPrompt.userChoice.then(result => {
            if (result.outcome === 'accepted') {
                _onboardingMarkPwaDone();
                state.deferredInstallPrompt = null;
                setTimeout(() => closeOnboarding(), 1200);
            }
        });
    };

    // --- 1. TEMA VISUAL ---
    const THEME_PALETTES = {
        emerald: {
            '--bg-main': '#05140d',
            '--bg-card': 'rgba(12, 34, 23, 0.85)',
            '--bg-card-hover': 'rgba(18, 48, 33, 0.9)',
            '--accent-gold': '#e5b95f',
            '--accent-emerald': '#10b981',
            '--text-primary': '#f8fafc',
            '--text-secondary': '#94a3b8',
            '--border-color': 'rgba(229, 185, 95, 0.2)'
        },
        midnight: {
            '--bg-main': '#090d16',
            '--bg-card': 'rgba(15, 23, 42, 0.85)',
            '--bg-card-hover': 'rgba(30, 41, 59, 0.9)',
            '--accent-gold': '#38bdf8',
            '--accent-emerald': '#818cf8',
            '--text-primary': '#f8fafc',
            '--text-secondary': '#94a3b8',
            '--border-color': 'rgba(56, 189, 248, 0.25)'
        },
        desert: {
            '--bg-main': '#16120e',
            '--bg-card': 'rgba(35, 26, 20, 0.85)',
            '--bg-card-hover': 'rgba(50, 38, 30, 0.9)',
            '--accent-gold': '#e0a96d',
            '--accent-emerald': '#f43f5e',
            '--text-primary': '#f8fafc',
            '--text-secondary': '#a8a29e',
            '--border-color': 'rgba(224, 169, 109, 0.25)'
        },
        suci: {
            '--bg-main': '#f8fafc',
            '--bg-card': '#ffffff',
            '--bg-card-hover': '#f1f5f9',
            '--accent-gold': '#0d9488',
            '--accent-emerald': '#059669',
            '--text-primary': '#0f172a',
            '--text-secondary': '#475569',
            '--border-color': '#e2e8f0'
        }
    };

    function applyTheme(themeName) {
        state.theme = themeName;
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('app_theme', themeName);

        const selectedTheme = THEME_PALETTES[themeName] || THEME_PALETTES.emerald;
        Object.keys(selectedTheme).forEach(prop => {
            document.documentElement.style.setProperty(prop, selectedTheme[prop]);
        });

        if (dom && dom.themeCards) {
            dom.themeCards.forEach(card => {
                if (card.dataset.themeVal === themeName) {
                    card.classList.add('selected');
                } else {
                    card.classList.remove('selected');
                }
            });
        }
    }
    window.applyTheme = applyTheme;

    // --- 2. AZAN AUDIO & NOTIFIKASI PUSH ---
    function updateAudioButton() {
        const audioIcon = document.getElementById('audio-icon') || (dom && dom.audioIcon);
        const btnToggleAudio = document.getElementById('btn-toggle-audio') || (dom && dom.btnToggleAudio);

        if (audioIcon) {
            audioIcon.className = state.audioEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
        }
        if (btnToggleAudio) {
            btnToggleAudio.style.color = state.audioEnabled ? 'var(--accent-gold)' : 'var(--text-muted)';
        }
    }

    function toggleAudio() {
        state.audioEnabled = !state.audioEnabled;
        localStorage.setItem('audio_enabled', state.audioEnabled);
        updateAudioButton();
        if (!state.audioEnabled) {
            stopAzanAudio();
        } else {
            requestNotificationPermission();
        }
    }

    function stopAzanAudio() {
        const audioEl = document.getElementById('azan-audio') || (dom && dom.azanAudio);
        if (audioEl) {
            try {
                audioEl.pause();
                audioEl.currentTime = 0;
            } catch (e) {}
        }
        const btnHeader = document.getElementById('btn-test-azan-header');
        if (btnHeader) {
            btnHeader.style.color = '#ffffff';
        }
        if (dom && dom.btnTestAzanAudio) {
            dom.btnTestAzanAudio.innerHTML = '<i class="fa-solid fa-play"></i> Mainkan Azan';
            dom.btnTestAzanAudio.classList.remove('btn-stop-active');
        }
    }
    window.stopAzanAudio = stopAzanAudio;

    function unlockAudioOnUserGesture() {
        const audioEl = document.getElementById('azan-audio') || (dom && dom.azanAudio);
        if (audioEl) {
            try {
                audioEl.load();
                audioEl.play().then(() => {
                    audioEl.pause();
                    audioEl.currentTime = 0;
                    console.log('Audio Azan sedia dimainkan.');
                }).catch(() => {});
            } catch(e){}
        }
    }
    window.addEventListener('click', unlockAudioOnUserGesture, { once: true });
    window.addEventListener('touchstart', unlockAudioOnUserGesture, { once: true });

    function toggleAzanPlayback() {
        const audioEl = document.getElementById('azan-audio') || (dom && dom.azanAudio);
        if (audioEl && !audioEl.paused) {
            stopAzanAudio();
        } else {
            playAzanAudio('Ujian');
        }
    }

    function playAzanAudio(prayerName = 'Solat') {
        const audioEl = document.getElementById('azan-audio') || (dom && dom.azanAudio);
        if (!audioEl) {
            playSynthesizedAzanChime();
            return;
        }
        try {
            if ('mediaSession' in navigator) {
                try {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: `Azan Waktu Solat ${prayerName}`,
                        artist: `Waktu Solat Malaysia (Zon ${state.currentZone})`,
                        album: 'JAKIM Malaysia',
                        artwork: [
                            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }
                        ]
                    });
                    navigator.mediaSession.setActionHandler('play', () => { if (audioEl) audioEl.play(); });
                    navigator.mediaSession.setActionHandler('pause', () => { stopAzanAudio(); });
                    navigator.mediaSession.setActionHandler('stop', () => { stopAzanAudio(); });
                } catch(e) {}
            }

            audioEl.currentTime = 0;
            const playPromise = audioEl.play();
            
            const btnHeader = document.getElementById('btn-test-azan-header');
            if (btnHeader) {
                btnHeader.style.color = 'var(--accent-gold)';
            }

            if (dom && dom.btnTestAzanAudio) {
                dom.btnTestAzanAudio.innerHTML = '<i class="fa-solid fa-volume-high fa-spin"></i> Dimainkan...';
                setTimeout(() => {
                    if (dom && dom.btnTestAzanAudio) dom.btnTestAzanAudio.innerHTML = '<i class="fa-solid fa-play"></i> Mainkan Azan';
                }, 6000);
            }

            audioEl.onended = () => {
                stopAzanAudio();
            };

            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    console.log('Audio playback info:', err);
                    playSynthesizedAzanChime();
                });
            }
        } catch (e) {
            playSynthesizedAzanChime();
        }
    }
    window.playAzanAudio = playAzanAudio;

    function testAzanHeader() {
        const audioEl = document.getElementById('azan-audio') || (dom && dom.azanAudio);
        if (audioEl && !audioEl.paused) {
            stopAzanAudio();
        } else {
            playAzanAudio('Makkah');
        }
    }
    window.testAzanHeader = testAzanHeader;

    function unlockAudioOnUserGesture() {
        if (state.audioUnlocked) return;
        const audioEl = document.getElementById('azan-audio') || (dom && dom.azanAudio);
        if (!audioEl) return;

        try {
            const playPromise = audioEl.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    audioEl.pause();
                    audioEl.currentTime = 0;
                    state.audioUnlocked = true;
                    console.log('Mobile audio element successfully UNLOCKED for background Azan playback!');
                }).catch(err => {
                    console.log('Mobile audio unlock waiting for user touch:', err);
                });
            }
        } catch(e) {}
    }
    window.unlockAudioOnUserGesture = unlockAudioOnUserGesture;

    ['touchstart', 'touchend', 'click', 'pointerdown'].forEach(evt => {
        document.addEventListener(evt, unlockAudioOnUserGesture, { once: true });
    });

    function playSynthesizedAzanChime() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const notes = [440, 554.37, 659.25, 880];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.35);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.35 + 1.0);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + idx * 0.35);
                osc.stop(ctx.currentTime + idx * 0.35 + 1.0);
            });
        } catch(e){}
    }

    function checkNotificationStatus() {
        if (!('Notification' in window)) {
            if (dom.notifStatusText) dom.notifStatusText.textContent = 'Notifikasi tidak disokong pada pelayar ini.';
            return;
        }

        if (Notification.permission === 'granted') {
            if (dom.notifStatusText) dom.notifStatusText.textContent = 'Aktif (Dibenarkan)';
            if (dom.notifIcon) dom.notifIcon.style.color = 'var(--accent-gold)';
            if (dom.notifBanner) dom.notifBanner.classList.remove('active');
        } else if (Notification.permission === 'denied') {
            if (dom.notifStatusText) dom.notifStatusText.textContent = 'Dihalang di tetapan browser';
            if (dom.notifIcon) dom.notifIcon.style.color = 'var(--text-muted)';
            if (dom.notifBanner) dom.notifBanner.classList.remove('active');
        } else {
            if (dom.notifStatusText) dom.notifStatusText.textContent = 'Belum Diaktifkan';
            if (dom.notifIcon) dom.notifIcon.style.color = 'var(--text-muted)';
            if (dom.notifBanner) dom.notifBanner.classList.add('active');
        }
    }

    function requestNotificationPermission() {
        if (!('Notification' in window)) {
            alert('Notifikasi tidak disokong pada peranti ini.');
            return;
        }

        Notification.requestPermission().then(permission => {
            checkNotificationStatus();
            if (permission === 'granted') {
                sendPushNotification('Notifikasi Solat Diaktifkan', 'Anda akan menerima pemberitahuan & alunan azan apabila masuk waktu solat.');
                // Subscribe ke backend push server
                subscribeToPushBackend();
            }
        });
    }

    // --- WEB PUSH BACKEND SUBSCRIPTION ---
    const PUSH_WORKER_URL = 'https://waktu-solat-push.huzaimrosli.workers.dev';
    const VAPID_PUBLIC_KEY = 'BASJ8OMhJFQbaFMuH84DrMVTbRuJus2_I5HcuiHRtHSsVbjwLQ5uJqqtmoauWg4637-tPrtygyuSJ33FF5Fu5-Y';

    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    async function subscribeToPushBackend(forceRenew = false) {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('[PushBackend] PushManager tidak disokong');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Check if already subscribed
            let subscription = await registration.pushManager.getSubscription();
            
            // Force renew: unsubscribe lama dan buat subscription baru
            if (subscription && forceRenew) {
                console.log('[PushBackend] Force renew: unsubscribe subscription lama...');
                await subscription.unsubscribe();
                subscription = null;
                localStorage.removeItem('push_backend_subscribed');
            }
            
            if (!subscription) {
                // Subscribe with VAPID key (fresh)
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });
                console.log('[PushBackend] ✅ Fresh subscription berjaya:', subscription.endpoint);
            } else {
                console.log('[PushBackend] Subscription sedia ada:', subscription.endpoint);
            }

            // Send subscription + zone to backend
            const response = await fetch(`${PUSH_WORKER_URL}/api/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: subscription.toJSON(),
                    zone: state.currentZone
                })
            });

            const result = await response.json();
            if (result.success) {
                console.log('[PushBackend] ✅ Subscription berjaya didaftarkan ke server');
                localStorage.setItem('push_backend_subscribed', 'true');
                localStorage.setItem('push_backend_zone', state.currentZone);
            } else {
                console.log('[PushBackend] ❌ Gagal daftar:', result.error);
            }
        } catch (err) {
            console.log('[PushBackend] Error:', err.message);
        }
    }

    // Auto re-subscribe when zone changes
    function resubscribePushIfNeeded() {
        const lastZone = localStorage.getItem('push_backend_zone');
        if (lastZone && lastZone !== state.currentZone && localStorage.getItem('push_backend_subscribed') === 'true') {
            console.log(`[PushBackend] Zone bertukar ${lastZone} → ${state.currentZone}, re-subscribe...`);
            subscribeToPushBackend();
        }
    }

    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => {
                    console.log('Service Worker didaftarkan:', reg.scope);
                    // Auto subscribe if already granted
                    if (Notification.permission === 'granted') {
                        subscribeToPushBackend();
                    }
                })
                .catch(err => console.log('Service Worker gagal:', err));

            // Pendengar mesej daripada Service Worker apabila notifikasi ditekan di notification bar
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.action === 'play_azan') {
                    console.log('[App] Menerima arahan play_azan daripada notifikasi telefon!');
                    let pName = 'Solat';
                    if (event.data.title && event.data.title.includes('Solat')) {
                        pName = event.data.title.replace(/.*Solat\s*/, '').trim() || 'Solat';
                    }
                    playAzanAudio(pName);
                }
            });
        }

        if (window.location.search.includes('play_azan=true')) {
            setTimeout(() => {
                playAzanAudio('Solat');
            }, 800);
        }
    }

    function showAppNotificationToast(title, body) {
        const existing = document.getElementById('app-notification-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'app-notification-toast';
        toast.className = 'app-notification-toast';
        toast.innerHTML = `
            <div style="display:flex; align-items:flex-start; gap:12px;">
                <div style="width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg, #064e3b, #059669); color:#fbbf24; display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0; box-shadow:0 4px 12px rgba(6,78,59,0.3);">
                    <i class="fa-solid fa-bell fa-bounce"></i>
                </div>
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:800; font-size:0.92rem; color:#0f172a;">${title}</div>
                    <div style="font-size:0.78rem; color:#475569; margin-top:2px; line-height:1.35;">${body}</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="background:none; border:none; color:#94a3b8; font-size:1rem; cursor:pointer; padding:2px;">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('active'), 80);
        setTimeout(() => {
            if (toast && toast.parentNode) {
                toast.classList.remove('active');
                setTimeout(() => toast.remove(), 400);
            }
        }, 6000);
    }
    window.showAppNotificationToast = showAppNotificationToast;

    function sendPushNotification(title, body) {
        // Paparkan sentiasa In-App Visual Banner Toast
        showAppNotificationToast(title, body);

        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            const options = {
                body: body,
                icon: 'icons/icon-192.png',
                badge: 'icons/icon-192.png',
                vibrate: [500, 200, 500, 200, 1000],
                tag: 'waktu-solat-notif-' + Date.now(),
                renotify: true,
                requireInteraction: true
            };

            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(title, options).catch(err => {
                        console.log('SW showNotification fallback:', err);
                        try { new Notification(title, options); } catch(e) {}
                    });
                }).catch(() => {
                    try { new Notification(title, options); } catch(e) {}
                });
            } else {
                try { new Notification(title, options); } catch(e) {}
            }
        }
    }
    window.sendPushNotification = sendPushNotification;

    function playAzanNotification(prayerKey, prayerName) {
        if (state.prayerNotifs && state.prayerNotifs[prayerKey] === false) {
            console.log(`Pemberitahuan bagi ${prayerName} (${prayerKey}) telah dinyahaktifkan oleh pengguna.`);
            return;
        }

        if (state.audioEnabled) {
            playAzanAudio();
        }

        sendPushNotification(
            `Telah Masuk Waktu Solat ${prayerName}`,
            `Telah masuk waktu solat ${prayerName} bagi zon ${state.currentZone}. Mari mendirikan solat!`
        );

        if (navigator.vibrate) {
            navigator.vibrate([300, 100, 300, 100, 500]);
        }
    }

    function getLocalDateString(d = new Date()) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // --- 3. FETCH API JAKIM E-SOLAT (WITH FALLBACK ENGINE) ---
    async function loadPrayerData(zoneCode) {
        const zoneInfo = JAKIM_ZONES.find(z => z.code === zoneCode) || JAKIM_ZONES[0];
        const headerZoneText = document.getElementById('header-zone-text');
        const modalZoneCode = document.getElementById('modal-display-zone-code');
        if (headerZoneText) headerZoneText.textContent = zoneInfo.code;
        if (modalZoneCode) modalZoneCode.textContent = `${zoneInfo.code} - ${zoneInfo.state}`;
        if (dom.zoneCodeDisplay) dom.zoneCodeDisplay.innerHTML = `${zoneInfo.code} <i class="fa-solid fa-chevron-down" style="font-size:0.65rem;"></i>`;
        if (dom.zoneNameDisplay) dom.zoneNameDisplay.textContent = `${zoneInfo.state} - ${zoneInfo.name}`;

        // Pengiraan Arah Kiblat Dinamik Mengikut Koordinat Zon JAKIM
        if (zoneInfo && zoneInfo.lat && zoneInfo.lng) {
            calculateQiblaDirection(zoneInfo.lat, zoneInfo.lng);
        }

        // Semak LocalStorage Cache dahulu
        const cacheKey = `prayer_cache_${zoneCode}_${getLocalDateString()}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
            try {
                const parsed = JSON.parse(cachedData);
                state.prayerData = parsed;
                updatePrayerUI(parsed);
                return;
            } catch (e) {}
        }

        // Endpoint 1: e-Solat Official JAKIM
        const officialUrl = `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=today&zone=${zoneCode}`;
        // Endpoint 2: Fallback Waktu Solat App Proxy
        const fallbackUrl = `https://api.waktusolat.app/v2/solat/${zoneCode}`;

        try {
            let res = await fetch(officialUrl).catch(() => null);
            let data = null;

            if (res && res.ok) {
                data = await res.json();
            }

            if (!data || !data.prayerTime || data.prayerTime.length === 0) {
                // Gunakan Fallback API
                console.log('Utilizing secondary Waktu Solat CORS API fallback...');
                const resFallback = await fetch(fallbackUrl);
                if (resFallback.ok) {
                    const fallbackJson = await resFallback.json();
                    data = formatFallbackData(fallbackJson, zoneCode);
                }
            }

            if (data && data.prayerTime && data.prayerTime.length > 0) {
                const todayPrayer = data.prayerTime[0];
                state.prayerData = todayPrayer;
                localStorage.setItem(cacheKey, JSON.stringify(todayPrayer));
                updatePrayerUI(todayPrayer);
            } else {
                throw new Error('Gagal mengambil data dari API JAKIM.');
            }

        } catch (error) {
            console.error('API Error:', error);
            // Guna fallback waktu lalai tempatan jika offline tanpa cache
            const mockToday = generateMockPrayerTimes();
            state.prayerData = mockToday;
            updatePrayerUI(mockToday);
        }
    }

    function formatFallbackData(fallbackJson, zoneCode) {
        if (fallbackJson.prayers && fallbackJson.prayers.length > 0) {
            const p = fallbackJson.prayers[0];
            return {
                prayerTime: [{
                    hijri: fallbackJson.hijri || '',
                    date: p.date || getLocalDateString(),
                    fajr: formatTimeString(p.fajr),
                    syuruk: formatTimeString(p.syuruk),
                    dhuhr: formatTimeString(p.dhuhr),
                    asr: formatTimeString(p.asr),
                    maghrib: formatTimeString(p.maghrib),
                    isha: formatTimeString(p.isha)
                }]
            };
        }
        return null;
    }

    function formatTimeString(ts) {
        if (typeof ts === 'number') {
            const d = new Date(ts * 1000);
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;
        }
        return ts || '00:00:00';
    }

    function generateMockPrayerTimes() {
        return {
            hijri: '1447-02-25',
            date: getLocalDateString(),
            fajr: '05:54:00',
            syuruk: '07:12:00',
            dhuhr: '13:22:00',
            asr: '16:42:00',
            maghrib: '19:28:00',
            isha: '20:39:00'
        };
    }

    const HIJRI_MONTHS = [
        'Muharram', 'Safar', 'Rabiulawal', 'Rabiulakhir',
        'Jamadilawal', 'Jamadilakhir', 'Rejab', 'Syaaban',
        'Ramadan', 'Syawal', 'Zulkaedah', 'Zulhijjah'
    ];

    function parseHijriDate(hijriInput) {
        if (!hijriInput) return 'Tarikh Hijriah';

        // Jika bentuk YYYY-MM-DD atau DD-MM-YYYY (cth: "1448-02-25" atau "25-02-1448")
        if (typeof hijriInput === 'string' && hijriInput.includes('-')) {
            const parts = hijriInput.split('-');
            if (parts.length === 3) {
                let year, monthIdx, day;
                if (parts[0].length === 4) {
                    // YYYY-MM-DD
                    year = parts[0];
                    monthIdx = parseInt(parts[1], 10) - 1;
                    day = parseInt(parts[2], 10);
                } else {
                    // DD-MM-YYYY
                    day = parseInt(parts[0], 10);
                    monthIdx = parseInt(parts[1], 10) - 1;
                    year = parts[2];
                }

                if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
                    return `${day} ${HIJRI_MONTHS[monthIdx]} ${year}H`;
                }
            }
        }

        // Jika string biasa yang tiada 'H' di belakang
        if (typeof hijriInput === 'string') {
            return hijriInput.trim().endsWith('H') ? hijriInput : `${hijriInput}H`;
        }

        return String(hijriInput);
    }

    // --- 4. KEMAS KINI DISPLAY WAKTU SOLAT ---
    function updatePrayerUI(today) {
        // Tarikh
        const dateObj = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        if (dom.gregorianDateDisplay) dom.gregorianDateDisplay.textContent = dateObj.toLocaleDateString('ms-MY', options);
        if (dom.hijriDateDisplay) dom.hijriDateDisplay.textContent = parseHijriDate(today.hijri);

        // Waktu
        if (dom.times.fajr) dom.times.fajr.innerHTML = formatTime12h(today.fajr);
        if (dom.times.syuruk) dom.times.syuruk.innerHTML = formatTime12h(today.syuruk);
        if (dom.times.dhuhr) dom.times.dhuhr.innerHTML = formatTime12h(today.dhuhr);
        if (dom.times.asr) dom.times.asr.innerHTML = formatTime12h(today.asr);
        if (dom.times.maghrib) dom.times.maghrib.innerHTML = formatTime12h(today.maghrib);
        if (dom.times.isha) dom.times.isha.innerHTML = formatTime12h(today.isha);

        updateNextPrayerCountdown();
    }

    function formatTime12h(timeStr) {
        if (!timeStr) return '--:--';
        const parts = timeStr.split(':');
        let hours = parseInt(parts[0], 10);
        const minutes = parts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours.toString().padStart(2, '0')}:${minutes} <span class="ampm">${ampm}</span>`;
    }

    function parseTimeTo24h(timeStr) {
        if (!timeStr) return '00:00:00';
        let clean = String(timeStr).trim();
        const isPM = /pm/i.test(clean);
        const isAM = /am/i.test(clean);
        clean = clean.replace(/(am|pm)/i, '').trim();

        const parts = clean.split(':');
        let hours = parseInt(parts[0], 10) || 0;
        const minutes = parseInt(parts[1], 10) || 0;
        const seconds = parts[2] ? parseInt(parts[2], 10) : 0;

        if (isPM && hours < 12) hours += 12;
        if (isAM && hours === 12) hours = 0;

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function createDateObject(baseDate, timeStr) {
        const d = baseDate instanceof Date ? baseDate : new Date();
        const year = d.getFullYear();
        const month = d.getMonth();
        const day = d.getDate();

        const t24 = parseTimeTo24h(timeStr);
        const tp = t24.split(':');
        const hours = parseInt(tp[0], 10) || 0;
        const minutes = parseInt(tp[1], 10) || 0;
        const seconds = parseInt(tp[2], 10) || 0;

        return new Date(year, month, day, hours, minutes, seconds);
    }

    // --- 5. ENGIN COUNTDOWN & SOLAT SETERUSNYA ---

    function updateNextPrayerCountdown() {
        if (!state.prayerData) return;

        const now = new Date();
        const todayStr = getLocalDateString(now);

        const list = [
            { key: 'fajr', name: 'Subuh', timeStr: state.prayerData.fajr, card: dom.cards.fajr },
            { key: 'syuruk', name: 'Syuruk', timeStr: state.prayerData.syuruk, card: dom.cards.syuruk },
            { key: 'dhuhr', name: 'Zohor', timeStr: state.prayerData.dhuhr, card: dom.cards.dhuhr },
            { key: 'asr', name: 'Asar', timeStr: state.prayerData.asr, card: dom.cards.asr },
            { key: 'maghrib', name: 'Maghrib', timeStr: state.prayerData.maghrib, card: dom.cards.maghrib },
            { key: 'isha', name: 'Isyak', timeStr: state.prayerData.isha, card: dom.cards.isha }
        ];

        // Susun senarai mengikut kronologi masa
        list.sort((a, b) => {
            if (!a.timeStr) return 1;
            if (!b.timeStr) return -1;
            return createDateObject(now, a.timeStr) - createDateObject(now, b.timeStr);
        });

        // Buang highlight aktif & lencana SEKARANG terdahulu
        Object.values(dom.cards).forEach(c => {
            if (!c) return;
            c.classList.remove('active');
            const badge = c.querySelector('.active-now-badge');
            if (badge) badge.remove();
        });

        let nextPrayer = null;
        let currentActivePrayer = null;

        for (let i = 0; i < list.length; i++) {
            if (!list[i].timeStr) continue;
            const pDate = createDateObject(now, list[i].timeStr);
            if (now >= pDate) {
                currentActivePrayer = list[i];
            } else {
                nextPrayer = list[i];
                break;
            }
        }

        // Jika melepasi Isyak malam ini, solat seterusnya ialah Subuh esok
        if (!nextPrayer) {
            nextPrayer = list[0];
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            nextPrayer.targetDate = createDateObject(tomorrow, nextPrayer.timeStr);
        } else {
            nextPrayer.targetDate = createDateObject(now, nextPrayer.timeStr);
        }

        if (currentActivePrayer && currentActivePrayer.card) {
            currentActivePrayer.card.classList.add('active');
            if (!currentActivePrayer.card.querySelector('.active-now-badge')) {
                const badge = document.createElement('span');
                badge.className = 'active-now-badge';
                badge.textContent = 'SEKARANG';
                currentActivePrayer.card.appendChild(badge);
            }
        }

        // Kemas kini Teks
        if (dom.nextPrayerNameDisplay) dom.nextPrayerNameDisplay.textContent = nextPrayer.name;
        if (dom.nextPrayerTimeDisplay) dom.nextPrayerTimeDisplay.innerHTML = formatTime12h(nextPrayer.timeStr);

        // Pengiraan Perbezaan Masa (Countdown)
        const diffMs = nextPrayer.targetDate - now;

        // Pemicu Notifikasi & Azan untuk SEMUA waktu solat (window 0 hingga 300 saat / 5 minit)
        list.forEach(p => {
            if (!p.timeStr) return;
            const pDate = createDateObject(now, p.timeStr);
            const diffSec = Math.floor((now - pDate) / 1000);
            const notifKey = `${p.key}_${todayStr}_${p.timeStr}`;

            if (diffSec >= 0 && diffSec <= 300 && localStorage.getItem('last_notif_key') !== notifKey) {
                state.lastNotificationKey = notifKey;
                localStorage.setItem('last_notif_key', notifKey);
                playAzanNotification(p.key, p.name);
            }
        });

        // Pemicu Notifikasi Surah Al-Waqiah (30 minit selepas Subuh) & Surah Al-Mulk (30 minit selepas Isyak)
        if (state.prayerData && state.prayerData.fajr && state.prayerData.isha) {
            const fajrDate = createDateObject(now, state.prayerData.fajr);
            const ishaDate = createDateObject(now, state.prayerData.isha);

            // 30 minit selepas Subuh (+30 minit)
            const waqiahTarget = new Date(fajrDate.getTime() + 30 * 60 * 1000);
            const diffSecWaqiah = Math.floor((now - waqiahTarget) / 1000);
            const waqiahNotifKey = `waqiah_${todayStr}`;

            if (diffSecWaqiah >= 0 && diffSecWaqiah <= 300 && localStorage.getItem('last_notif_waqiah') !== waqiahNotifKey) {
                localStorage.setItem('last_notif_waqiah', waqiahNotifKey);
                sendPushNotification(
                    'Surah Al-Waqiah 📖 (Masa Pagi)',
                    'Waktu 30 minit selepas Subuh. Mari membaca Surah Al-Waqiah pembuka rezeki!'
                );
                showQuranReminderBanner('56', 'Surah Al-Waqiah 📖', '30 minit selepas Subuh. Tekan untuk membaca Surah Al-Waqiah.');
            }

            // 30 minit selepas Isyak (+30 minit)
            const mulkTarget = new Date(ishaDate.getTime() + 30 * 60 * 1000);
            const diffSecMulk = Math.floor((now - mulkTarget) / 1000);
            const mulkNotifKey = `mulk_${todayStr}`;

            if (diffSecMulk >= 0 && diffSecMulk <= 300 && localStorage.getItem('last_notif_mulk') !== mulkNotifKey) {
                localStorage.setItem('last_notif_mulk', mulkNotifKey);
                sendPushNotification(
                    'Surah Al-Mulk 🌙 (Masa Malam)',
                    'Amalan sebelum tidur 30 minit selepas Isyak. Mari membaca Surah Al-Mulk pelindung alam kubur!'
                );
                showQuranReminderBanner('67', 'Surah Al-Mulk 🌙', '30 minit selepas Isyak. Tekan untuk membaca Surah Al-Mulk.');
            }
        }


        const totalSec = Math.max(0, Math.floor(diffMs / 1000));
        const hours = Math.floor(totalSec / 3600);
        const minutes = Math.floor((totalSec % 3600) / 60);
        const seconds = totalSec % 60;

        if (dom.cdHours) dom.cdHours.textContent = String(hours).padStart(2, '0');
        if (dom.cdMinutes) dom.cdMinutes.textContent = String(minutes).padStart(2, '0');
        if (dom.cdSeconds) dom.cdSeconds.textContent = String(seconds).padStart(2, '0');
    }

    // --- 5B. JADUAL TIMER TEPAT UNTUK SETIAP WAKTU SOLAT ---
    let scheduledPrayerTimers = [];

    function schedulePrayerTimers() {
        // Bersihkan semua timer lama
        scheduledPrayerTimers.forEach(t => clearTimeout(t));
        scheduledPrayerTimers = [];

        if (!state.prayerData) return;

        const now = new Date();
        const todayStr = getLocalDateString(now);
        const prayers = [
            { key: 'fajr', name: 'Subuh', timeStr: state.prayerData.fajr },
            { key: 'dhuhr', name: 'Zohor', timeStr: state.prayerData.dhuhr },
            { key: 'asr', name: 'Asar', timeStr: state.prayerData.asr },
            { key: 'maghrib', name: 'Maghrib', timeStr: state.prayerData.maghrib },
            { key: 'isha', name: 'Isyak', timeStr: state.prayerData.isha }
        ];

        prayers.forEach(p => {
            if (!p.timeStr) return;
            const pDate = createDateObject(now, p.timeStr);
            const msUntil = pDate - now;

            // Hanya jadualkan jika waktu solat belum tiba (masa depan)
            if (msUntil > 0 && msUntil < 24 * 60 * 60 * 1000) {
                const timerId = setTimeout(() => {
                    const notifKey = `${p.key}_${todayStr}_${p.timeStr}`;
                    if (localStorage.getItem('last_notif_key') !== notifKey) {
                        state.lastNotificationKey = notifKey;
                        localStorage.setItem('last_notif_key', notifKey);
                        playAzanNotification(p.key, p.name);
                        console.log(`[ScheduledTimer] Azan dicetuskan untuk ${p.name} pada masa tepat!`);
                    }
                }, msUntil);
                scheduledPrayerTimers.push(timerId);
                console.log(`[ScheduledTimer] ${p.name} dijadualkan dalam ${Math.round(msUntil / 60000)} minit`);
            }
        });

        // Jadualkan juga Surah Al-Waqiah (30 min selepas Subuh) & Al-Mulk (30 min selepas Isyak)
        if (state.prayerData.fajr) {
            const fajrDate = createDateObject(now, state.prayerData.fajr);
            const waqiahMs = (fajrDate.getTime() + 30 * 60 * 1000) - now.getTime();
            if (waqiahMs > 0 && waqiahMs < 24 * 60 * 60 * 1000) {
                const tid = setTimeout(() => {
                    const wKey = `waqiah_${todayStr}`;
                    if (localStorage.getItem('last_notif_waqiah') !== wKey) {
                        localStorage.setItem('last_notif_waqiah', wKey);
                        sendPushNotification('Surah Al-Waqiah 📖 (Masa Pagi)', 'Waktu 30 minit selepas Subuh. Mari membaca Surah Al-Waqiah pembuka rezeki!');
                        showQuranReminderBanner('56', 'Surah Al-Waqiah 📖', '30 minit selepas Subuh. Tekan untuk membaca Surah Al-Waqiah.');
                    }
                }, waqiahMs);
                scheduledPrayerTimers.push(tid);
            }
        }
        if (state.prayerData.isha) {
            const ishaDate = createDateObject(now, state.prayerData.isha);
            const mulkMs = (ishaDate.getTime() + 30 * 60 * 1000) - now.getTime();
            if (mulkMs > 0 && mulkMs < 24 * 60 * 60 * 1000) {
                const tid = setTimeout(() => {
                    const mKey = `mulk_${todayStr}`;
                    if (localStorage.getItem('last_notif_mulk') !== mKey) {
                        localStorage.setItem('last_notif_mulk', mKey);
                        sendPushNotification('Surah Al-Mulk 🌙 (Masa Malam)', 'Amalan sebelum tidur 30 minit selepas Isyak. Mari membaca Surah Al-Mulk pelindung alam kubur!');
                        showQuranReminderBanner('67', 'Surah Al-Mulk 🌙', '30 minit selepas Isyak. Tekan untuk membaca Surah Al-Mulk.');
                    }
                }, mulkMs);
                scheduledPrayerTimers.push(tid);
            }
        }
    }

    // --- 5C. VISIBILITY API CATCH-UP (BUKA SEMULA APP) ---
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            console.log('[VisibilityAPI] App kembali aktif — semak waktu solat terlepas...');
            // Bila buka semula app, semak semua waktu solat dalam 30 minit terakhir
            catchUpMissedPrayers();
            // Jadualkan semula timer untuk waktu solat akan datang
            schedulePrayerTimers();
            // Kemas kini jam & countdown segera
            updateNextPrayerCountdown();
        }
    });

    function catchUpMissedPrayers() {
        if (!state.prayerData) return;

        const now = new Date();
        const todayStr = getLocalDateString(now);
        const CATCHUP_WINDOW = 30 * 60; // 30 minit dalam saat

        const prayers = [
            { key: 'fajr', name: 'Subuh', timeStr: state.prayerData.fajr },
            { key: 'dhuhr', name: 'Zohor', timeStr: state.prayerData.dhuhr },
            { key: 'asr', name: 'Asar', timeStr: state.prayerData.asr },
            { key: 'maghrib', name: 'Maghrib', timeStr: state.prayerData.maghrib },
            { key: 'isha', name: 'Isyak', timeStr: state.prayerData.isha }
        ];

        prayers.forEach(p => {
            if (!p.timeStr) return;
            const pDate = createDateObject(now, p.timeStr);
            const diffSec = Math.floor((now - pDate) / 1000);
            const notifKey = `${p.key}_${todayStr}_${p.timeStr}`;

            // Jika waktu solat baru berlalu (0–30 minit) dan belum di-trigger
            if (diffSec >= 0 && diffSec <= CATCHUP_WINDOW && localStorage.getItem('last_notif_key') !== notifKey) {
                state.lastNotificationKey = notifKey;
                localStorage.setItem('last_notif_key', notifKey);
                playAzanNotification(p.key, p.name);
                console.log(`[CatchUp] Azan terlepas untuk ${p.name} (${diffSec}s lalu) — ditrigger sekarang!`);
            }
        });

        // Catch-up Surah Al-Waqiah & Al-Mulk
        if (state.prayerData.fajr) {
            const fajrDate = createDateObject(now, state.prayerData.fajr);
            const waqiahTarget = new Date(fajrDate.getTime() + 30 * 60 * 1000);
            const diffW = Math.floor((now - waqiahTarget) / 1000);
            const wKey = `waqiah_${todayStr}`;
            if (diffW >= 0 && diffW <= CATCHUP_WINDOW && localStorage.getItem('last_notif_waqiah') !== wKey) {
                localStorage.setItem('last_notif_waqiah', wKey);
                sendPushNotification('Surah Al-Waqiah 📖 (Masa Pagi)', 'Waktu 30 minit selepas Subuh. Mari membaca Surah Al-Waqiah pembuka rezeki!');
                showQuranReminderBanner('56', 'Surah Al-Waqiah 📖', '30 minit selepas Subuh. Tekan untuk membaca Surah Al-Waqiah.');
            }
        }
        if (state.prayerData.isha) {
            const ishaDate = createDateObject(now, state.prayerData.isha);
            const mulkTarget = new Date(ishaDate.getTime() + 30 * 60 * 1000);
            const diffM = Math.floor((now - mulkTarget) / 1000);
            const mKey = `mulk_${todayStr}`;
            if (diffM >= 0 && diffM <= CATCHUP_WINDOW && localStorage.getItem('last_notif_mulk') !== mKey) {
                localStorage.setItem('last_notif_mulk', mKey);
                sendPushNotification('Surah Al-Mulk 🌙 (Masa Malam)', 'Amalan sebelum tidur 30 minit selepas Isyak. Mari membaca Surah Al-Mulk pelindung alam kubur!');
                showQuranReminderBanner('67', 'Surah Al-Mulk 🌙', '30 minit selepas Isyak. Tekan untuk membaca Surah Al-Mulk.');
            }
        }
    }

    // --- 6. JAM DIGITAL REALTIME ---
    function startLiveClock() {
        const updateClock = () => {
            const now = new Date();
            let hours = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            const timeStr = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;

            const liveEl = document.getElementById('current-live-time') || (dom && dom.liveTimeDisplay);
            if (liveEl) liveEl.textContent = timeStr;

            updateNextPrayerCountdown();
        };

        updateClock();
        setInterval(updateClock, 1000);

        // Jadualkan timer tepat untuk setiap waktu solat
        schedulePrayerTimers();
    }

    // --- 7. AUTO GPS LOCATION TO JAKIM ZONE ---
    function detectGPSLocation() {
        if (!navigator.geolocation) {
            alert('Geolokasi tidak disokong pada peranti anda.');
            return;
        }

        dom.btnGps.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memuatkan...';

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const userLat = pos.coords.latitude;
                const userLng = pos.coords.longitude;
                state.userLocation = { lat: userLat, lng: userLng };

                // Cari zon JAKIM terdekat menggunakan Haversine Formula
                let closestZone = JAKIM_ZONES[0];
                let minDistance = Infinity;

                JAKIM_ZONES.forEach(z => {
                    const dist = haversineDistance(userLat, userLng, z.lat, z.lng);
                    if (dist < minDistance) {
                        minDistance = dist;
                        closestZone = z;
                    }
                });

                state.currentZone = closestZone.code;
                localStorage.setItem('jakim_zone', closestZone.code);
                loadPrayerData(closestZone.code);
                calculateQiblaDirection(userLat, userLng);
                resubscribePushIfNeeded();

                dom.btnGps.innerHTML = '<i class="fa-solid fa-check"></i> Berjaya!';
                setTimeout(() => {
                    dom.btnGps.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> GPS Auto';
                }, 2000);
            },
            (err) => {
                console.error('GPS Error:', err);
                alert('Gagal mendapatkan lokasi GPS. Sila pilih zon secara manual.');
                dom.btnGps.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> GPS Auto';
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    function haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // --- 8. ARAH KIBLAT (GOOGLE AR FINDER & DEGREE) ---
    let currentQiblaAngle = 292.5; // Anggaran umum Malaysia (~292.5°)

    function calculateQiblaDirection(lat, lng) {
        // Koordinat Kaabah Makkah: 21.4225° N, 39.8262° E
        const kaabaLat = 21.4225 * Math.PI / 180;
        const kaabaLng = 39.8262 * Math.PI / 180;
        const userLatRad = lat * Math.PI / 180;
        const userLngRad = lng * Math.PI / 180;

        const dLng = kaabaLng - userLngRad;
        const y = Math.sin(dLng);
        const x = Math.cos(userLatRad) * Math.tan(kaabaLat) - Math.sin(userLatRad) * Math.cos(dLng);

        let qiblaAngle = Math.atan2(y, x) * 180 / Math.PI;
        qiblaAngle = (qiblaAngle + 360) % 360;

        currentQiblaAngle = qiblaAngle;
        if (dom.qiblaDegree) dom.qiblaDegree.textContent = `${qiblaAngle.toFixed(1)}° Barat Laut`;
        return qiblaAngle;
    }

    // --- 9. TASBIH DIGITAL ---
    function updateTasbihUI() {
        const item = TASBIH_PHRASES[state.tasbihIndex];
        dom.tasbihPhrase.textContent = item.arabic;
        dom.tasbihTranslation.textContent = item.translation;
        dom.tasbihCounter.textContent = state.tasbihCount;
    }

    function incrementTasbih() {
        state.tasbihCount++;
        localStorage.setItem('tasbih_count', state.tasbihCount);
        dom.tasbihCounter.textContent = state.tasbihCount;

        if (navigator.vibrate) {
            navigator.vibrate(40);
        }
    }

    function resetTasbih() {
        state.tasbihCount = 0;
        localStorage.setItem('tasbih_count', 0);
        if (dom.tasbihCounter) dom.tasbihCounter.textContent = 0;
    }
    window.resetTasbih = resetTasbih;

    function switchTasbihPhrase() {
        state.tasbihIndex = (state.tasbihIndex + 1) % TASBIH_PHRASES.length;
        updateTasbihUI();
    }
    window.switchTasbihPhrase = switchTasbihPhrase;

    // --- 10. MODAL ZON & TEMA ---
    function renderZoneList(filter = '') {
        dom.zoneListContainer.innerHTML = '';
        const search = filter.toLowerCase().trim();

        JAKIM_ZONES.forEach(z => {
            if (!search || z.name.toLowerCase().includes(search) || z.state.toLowerCase().includes(search) || z.code.toLowerCase().includes(search)) {
                const item = document.createElement('div');
                item.className = `zone-item ${z.code === state.currentZone ? 'selected' : ''}`;
                item.innerHTML = `
                    <div>
                        <div class="zone-item-code">${z.code} - ${z.state}</div>
                        <div class="zone-item-desc">${z.name}</div>
                    </div>
                    <i class="fa-solid fa-chevron-right" style="font-size:0.75rem; color:var(--text-muted);"></i>
                `;
                item.addEventListener('click', () => {
                    state.currentZone = z.code;
                    localStorage.setItem('jakim_zone', z.code);
                    loadPrayerData(z.code);
                    closeModal(dom.modalZone);
                });
                dom.zoneListContainer.appendChild(item);
            }
        });
    }

    function openModal(modal) {
        if (!modal) return;
        modal.classList.add('active');
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.remove('active');
    }

    // --- 11. EVENT LISTENERS ---
    function setupEventListeners() {
        // Tab Navigation
        if (dom.navItems) {
            dom.navItems.forEach(btn => {
                btn.addEventListener('click', () => {
                    const targetTab = btn.dataset.tab;
                    dom.navItems.forEach(b => b.classList.remove('active'));
                    dom.tabContents.forEach(t => t.classList.remove('active'));
                    btn.classList.add('active');
                    const targetEl = document.getElementById(targetTab);
                    if (targetEl) targetEl.classList.add('active');
                });
            });
        }

        // GPS Button
        if (dom.btnGps) dom.btnGps.addEventListener('click', detectGPSLocation);

        // Zone Modal
        if (dom.btnOpenZoneModal) {
            dom.btnOpenZoneModal.addEventListener('click', () => {
                renderZoneList();
                openModal(dom.modalZone);
            });
        }
        if (dom.btnCloseZoneModal) dom.btnCloseZoneModal.addEventListener('click', () => closeModal(dom.modalZone));
        if (dom.zoneSearchInput) dom.zoneSearchInput.addEventListener('input', (e) => renderZoneList(e.target.value));

        // Theme Modal
        if (dom.btnOpenThemeModal) dom.btnOpenThemeModal.addEventListener('click', () => openModal(dom.modalTheme));
        if (dom.btnCloseThemeModal) dom.btnCloseThemeModal.addEventListener('click', () => closeModal(dom.modalTheme));
        if (dom.themeCards) {
            dom.themeCards.forEach(card => {
                card.addEventListener('click', () => {
                    applyTheme(card.dataset.themeVal);
                    closeModal(dom.modalTheme);
                });
            });
        }

        // Audio Button
        if (dom.btnToggleAudio) dom.btnToggleAudio.addEventListener('click', toggleAudio);

        // Tasbih
        if (dom.btnTasbihCount) dom.btnTasbihCount.addEventListener('click', incrementTasbih);
        if (dom.btnTasbihReset) dom.btnTasbihReset.addEventListener('click', resetTasbih);
        if (dom.btnTasbihSwitch) dom.btnTasbihSwitch.addEventListener('click', switchTasbihPhrase);

        // Notification & Settings Modal
        function openSettingsModal() {
            openModal(dom.modalSettings);
            checkNotificationStatus();
        }
        window.openSettingsModal = openSettingsModal;

        function closeSettingsModal() {
            closeModal(dom.modalSettings);
        }
        window.closeSettingsModal = closeSettingsModal;

        if (dom.btnRequestNotif) dom.btnRequestNotif.addEventListener('click', openSettingsModal);
        if (dom.btnOpenSettings) dom.btnOpenSettings.addEventListener('click', openSettingsModal);
        if (dom.btnCloseSettings) dom.btnCloseSettings.addEventListener('click', closeSettingsModal);

        // Toggle Notifikasi Solat Individu
        if (dom.toggles) {
            Object.keys(dom.toggles).forEach(key => {
                const el = dom.toggles[key];
                if (el) {
                    el.checked = state.prayerNotifs[key] !== false;
                    el.addEventListener('change', (e) => {
                        state.prayerNotifs[key] = e.target.checked;
                        localStorage.setItem('prayer_notifs', JSON.stringify(state.prayerNotifs));
                    });
                }
            });
        }
        
        const btnModalOpenZone = document.getElementById('btn-modal-open-zone');
        if (btnModalOpenZone) {
            btnModalOpenZone.addEventListener('click', () => {
                closeModal(dom.modalSettings);
                renderZoneList();
                openModal(dom.modalZone);
            });
        }

        if (dom.btnEnableNotifBanner) dom.btnEnableNotifBanner.addEventListener('click', requestNotificationPermission);
        if (dom.btnToggleNotifPerm) dom.btnToggleNotifPerm.addEventListener('click', requestNotificationPermission);
        
        if (dom.btnTestAzanAudio) dom.btnTestAzanAudio.addEventListener('click', toggleAzanPlayback);
        if (dom.btnTestPushNotif) {
            dom.btnTestPushNotif.addEventListener('click', async () => {
                playAzanAudio('Ujian');
                sendPushNotification(
                    `Ujian: Masuk Waktu Solat`,
                    `Alunan Azan Makkah dan Push Notification waktu solat bagi zon ${state.currentZone} berfungsi dengan cemerlang!`
                );
                // Hantar Ujian Web Push dari Cloudflare Worker Server ke peranti telefon
                try {
                    // Pastikan subscription didaftarkan segar
                    await subscribeToPushBackend(true);
                    if ('serviceWorker' in navigator) {
                        const reg = await navigator.serviceWorker.ready;
                        const sub = await reg.pushManager.getSubscription();
                        if (sub) {
                            const res = await fetch(`${PUSH_WORKER_URL}/api/test-push`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ endpoint: sub.endpoint, zone: state.currentZone })
                            });
                            const data = await res.json();
                            if (data && data.result && data.result.reason === 'expired') {
                                console.log('[TestPush] Subscription expired, renewing now...');
                                await subscribeToPushBackend(true);
                            }
                        }
                    }
                } catch(e){ console.error('[TestPush] Error:', e); }
            });
        }

        // Modal Panduan Install PWA
        if (dom.btnOpenInstallGuide) {
            dom.btnOpenInstallGuide.addEventListener('click', (e) => {
                e.preventDefault();
                openModal(dom.modalInstallGuide);
            });
        }
        if (dom.btnCloseInstallGuide) {
            dom.btnCloseInstallGuide.addEventListener('click', () => {
                closeModal(dom.modalInstallGuide);
                localStorage.setItem('hasSeenPwaInstallGuide_v2', 'true');
            });
        }
        if (dom.btnDismissInstallGuide) {
            dom.btnDismissInstallGuide.addEventListener('click', () => {
                closeModal(dom.modalInstallGuide);
                localStorage.setItem('hasSeenPwaInstallGuide_v2', 'true');
            });
        }

        // Close Modals on Overlay Click
        window.addEventListener('click', (e) => {
            if (e.target === dom.modalZone) closeModal(dom.modalZone);
            if (e.target === dom.modalTheme) closeModal(dom.modalTheme);
            if (e.target === dom.modalSettings) closeModal(dom.modalSettings);
            if (e.target === dom.modalInstallGuide) {
                closeModal(dom.modalInstallGuide);
                localStorage.setItem('hasSeenPwaInstallGuide_v2', 'true');
            }
        });

        // PWA Install Prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            state.deferredInstallPrompt = e;
            if (dom.pwaBanner) dom.pwaBanner.classList.add('active');
        });

        if (dom.btnInstallPwa) {
            dom.btnInstallPwa.addEventListener('click', () => {
                if (state.deferredInstallPrompt) {
                    state.deferredInstallPrompt.prompt();
                    state.deferredInstallPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            if (dom.pwaBanner) dom.pwaBanner.classList.remove('active');
                        }
                        state.deferredInstallPrompt = null;
                    });
                }
            });
        }
    }

    // --- 13. AL-QURAN DIGITAL READER (SURAH AL-MULK & AL-WAQIAH) ---
    async function loadQuranSurah(surahNum = '67') {
        const container = document.getElementById('quran-reader-container');
        if (!container) return;

        const num = String(surahNum);
        localStorage.setItem('last_selected_surah', num);

        const selectEl = document.getElementById('quran-surah-select');
        if (selectEl) selectEl.value = num;

        container.innerHTML = `
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; padding: 40px 0; color:var(--accent-emerald); gap:12px;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem;"></i>
                <span style="font-size:0.85rem; color:var(--text-secondary); font-weight:600;">Memuatkan Surah...</span>
            </div>
        `;

        try {
            let fileName = 'al-mulk.json';
            if (num === '56') fileName = 'al-waqiah.json';

            const response = await fetch(`./data/${fileName}`);
            if (!response.ok) throw new Error("Gagal mengambil data surah tempatan");
            const data = await response.json();

            if (!state.quranFontSizeScale) {
                state.quranFontSizeScale = parseInt(localStorage.getItem('quran_font_size_scale')) || 22;
            }
            const scalePct = Math.round((state.quranFontSizeScale / 22) * 100);
            const indicatorEl = document.getElementById('quran-font-size-indicator');
            if (indicatorEl) indicatorEl.textContent = `${scalePct}%`;

            container.innerHTML = `
                <div class="quran-surah-header-card">
                    <div class="quran-header-arabic">${data.name}</div>
                    <div class="quran-header-title">${data.englishName}</div>
                    <div class="quran-header-sub">
                        ${data.englishNameTranslation} • ${data.numberOfAyahs} Ayat • ${data.revelationType === 'Meccan' ? 'Makkiyah' : 'Madaniyah'}
                    </div>
                </div>

                <div class="quran-bismillah">
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                </div>

                <div class="quran-verses-list">
                    ${data.verses.map(v => `
                        <div class="quran-verse-card">
                            <div class="quran-verse-top">
                                <span class="quran-verse-number">${v.number}</span>
                                <button class="btn-copy-verse" onclick="copyVerseText(this, '${data.englishName}', ${v.number})">
                                    <i class="fa-regular fa-copy"></i> Salin
                                </button>
                            </div>
                            <div class="quran-verse-arabic" style="font-size:${state.quranFontSizeScale}px;">
                                ${v.text}
                            </div>
                            <div class="quran-verse-translation">
                                ${v.translation}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (e) {
            console.error('Quran loading error:', e);
            container.innerHTML = `
                <div style="text-align:center; padding:30px; color:var(--text-secondary);">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size:2rem; color:var(--accent-gold); margin-bottom:10px;"></i>
                    <p style="font-size:0.9rem;">Gagal memuatkan Surah. Sila pastikan sambungan internet aktif.</p>
                    <button class="btn-tasbih-action btn-reset" onclick="loadQuranSurah('${num}')" style="margin:14px auto 0 auto;">
                        <i class="fa-solid fa-rotate-right"></i> Cuba Lagi
                    </button>
                </div>
            `;
        }
    }
    window.loadQuranSurah = loadQuranSurah;

    function adjustQuranFontSize(diff) {
        if (!state.quranFontSizeScale) state.quranFontSizeScale = 22;
        state.quranFontSizeScale = Math.max(16, Math.min(36, state.quranFontSizeScale + diff));
        localStorage.setItem('quran_font_size_scale', state.quranFontSizeScale);

        const scalePct = Math.round((state.quranFontSizeScale / 22) * 100);
        const indicatorEl = document.getElementById('quran-font-size-indicator');
        if (indicatorEl) indicatorEl.textContent = `${scalePct}%`;

        document.querySelectorAll('.quran-verse-arabic').forEach(el => {
            el.style.fontSize = `${state.quranFontSizeScale}px`;
        });
    }
    window.adjustQuranFontSize = adjustQuranFontSize;

    function copyVerseText(btn, surahName, verseNum) {
        const card = btn.closest('.quran-verse-card');
        if (!card) return;
        const arabic = card.querySelector('.quran-verse-arabic').textContent.trim();
        const translation = card.querySelector('.quran-verse-translation').textContent.trim();
        const fullText = `${arabic}\n\n"${translation}"\n- Surah ${surahName} (${verseNum})`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(fullText).then(() => {
                const orig = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Disalin!';
                btn.style.color = 'var(--accent-emerald)';
                btn.style.borderColor = 'var(--accent-emerald)';
                setTimeout(() => {
                    btn.innerHTML = orig;
                    btn.style.color = '';
                    btn.style.borderColor = '';
                }, 1800);
            });
        }
    }
    window.copyVerseText = copyVerseText;

    function openPwaInstallGuide() {
        if (dom.modalInstallGuide) openModal(dom.modalInstallGuide);
    }
    window.openPwaInstallGuide = openPwaInstallGuide;

    function closePwaInstallGuide() {
        if (dom.modalInstallGuide) closeModal(dom.modalInstallGuide);
        localStorage.setItem('hasSeenPwaInstallGuide_v2', 'true');
    }
    window.closePwaInstallGuide = closePwaInstallGuide;

    function triggerPwaInstallPrompt() {
        if (state.deferredInstallPrompt) {
            state.deferredInstallPrompt.prompt();
            state.deferredInstallPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    if (dom.pwaBanner) dom.pwaBanner.classList.remove('active');
                }
                state.deferredInstallPrompt = null;
            });
        } else {
            alert('Petunjuk: Sila tekan menu tiga titik (⋮) di sudut atas kanan browser Chrome anda, kemudian pilih "Add to Home screen" atau "Install App".');
        }
    }
    window.triggerPwaInstallPrompt = triggerPwaInstallPrompt;

    function switchTab(targetTab) {
        if (!targetTab) return;
        const navItems = document.querySelectorAll('.nav-item');
        const tabContents = document.querySelectorAll('.tab-content');

        navItems.forEach(btn => {
            if (btn.dataset.tab === targetTab) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        tabContents.forEach(content => {
            if (content.id === targetTab) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        if (targetTab === 'tab-quran') {
            loadQuranSurah(localStorage.getItem('last_selected_surah') || '67');
        }
    }
    window.switchTab = switchTab;

    function openQuranSurahDirect(surahNumber) {
        switchTab('tab-quran');
        const sel = document.getElementById('quran-surah-select');
        if (sel) {
            sel.value = String(surahNumber);
            loadQuranSurah(surahNumber);
        }
        const toast = document.getElementById('quran-reminder-toast');
        if (toast) toast.remove();
    }
    window.openQuranSurahDirect = openQuranSurahDirect;

    function showQuranReminderBanner(surahNum, title, desc) {
        const existing = document.getElementById('quran-reminder-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'quran-reminder-toast';
        toast.className = 'quran-reminder-toast';
        toast.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <div style="width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg, #d97706, #f59e0b); color:#fff; display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0;">
                    <i class="fa-solid fa-book-quran"></i>
                </div>
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:800; font-size:0.88rem; color:#0f172a; line-height:1.2;">${title}</div>
                    <div style="font-size:0.72rem; color:#64748b; margin-top:2px;">${desc}</div>
                </div>
                <button onclick="openQuranSurahDirect('${surahNum}')" style="background:linear-gradient(135deg, #064e3b, #059669); color:#fff; border:none; padding:6px 12px; border-radius:10px; font-weight:700; font-size:0.78rem; cursor:pointer; flex-shrink:0;">
                    Baca
                </button>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('active'), 100);
    }
    window.showQuranReminderBanner = showQuranReminderBanner;

    // MULA APLIKASI
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
});

// GLOBAL HELPER UNTUK SALIN DOA
window.copyDoaText = function(btn) {
    const card = btn.closest('.doa-card');
    const title = card.querySelector('.doa-title') ? card.querySelector('.doa-title').textContent : '';
    const arabic = card.querySelector('.doa-arabic') ? card.querySelector('.doa-arabic').textContent : '';
    const translation = card.querySelector('.doa-translation') ? card.querySelector('.doa-translation').textContent : '';
    
    const fullText = `${title}\n\n${arabic}\n\nMaksud: ${translation.replace(/\s+/g, ' ').trim()}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullText).then(() => {
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Disalin!';
            btn.style.color = 'var(--accent-emerald)';
            setTimeout(() => {
                btn.innerHTML = '<i class="fa-regular fa-copy"></i> Salin';
                btn.style.color = 'var(--text-muted)';
            }, 2000);
        });
    } else {
        alert('Teks disalin:\n' + fullText);
    }
};
