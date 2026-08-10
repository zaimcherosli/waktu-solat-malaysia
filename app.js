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
        tasbihIndex: 0
    };

    // SENARAI ZIKIR TASBIH
    const TASBIH_PHRASES = [
        { arabic: 'سُبْحَانَ اللَّهِ', translation: 'Subhanallah (Maha Suci Allah)' },
        { arabic: 'الْحَمْدُ لِلَّهِ', translation: 'Alhamdulillah (Segala Puji Bagi Allah)' },
        { arabic: 'اللَّهُ أَكْبَرُ', translation: 'Allahu Akbar (Allah Maha Besar)' },
        { arabic: 'أَسْتَغْفِرُ اللَّهَ', translation: 'Astaghfirullah (Aku Memohon Ampun Kepada Allah)' },
        { arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ', translation: 'La ilaha illallah (Tiada Tuhan Melainkan Allah)' }
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

    // --- INIT APP ---
    function init() {
        applyTheme(state.theme);
        updateAudioButton();
        checkNotificationStatus();
        checkFirstTimeInstallGuide();
        renderZoneList();
        loadPrayerData(state.currentZone);
        setupEventListeners();
        startLiveClock();
        updateTasbihUI();
        registerServiceWorker();
    }

    function checkFirstTimeInstallGuide() {
        const hasSeen = localStorage.getItem('hasSeenPwaInstallGuide_v1');
        if (!hasSeen) {
            setTimeout(() => {
                openModal(dom.modalInstallGuide);
            }, 600);
        }
    }

    // --- 1. TEMA VISUAL ---
    function applyTheme(themeName) {
        state.theme = themeName;
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('app_theme', themeName);

        dom.themeCards.forEach(card => {
            if (card.dataset.themeVal === themeName) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }

    // --- 2. AZAN AUDIO & NOTIFIKASI PUSH ---
    function updateAudioButton() {
        if (state.audioEnabled) {
            dom.audioIcon.className = 'fa-solid fa-volume-high';
            dom.btnToggleAudio.style.color = 'var(--accent-gold)';
        } else {
            dom.audioIcon.className = 'fa-solid fa-volume-xmark';
            dom.btnToggleAudio.style.color = 'var(--text-muted)';
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
        if (dom.azanAudio) {
            try {
                dom.azanAudio.pause();
                dom.azanAudio.currentTime = 0;
            } catch (e) {}
        }
        if (dom.btnTestAzanAudio) {
            dom.btnTestAzanAudio.innerHTML = '<i class="fa-solid fa-play"></i> Mainkan Azan';
            dom.btnTestAzanAudio.classList.remove('btn-stop-active');
        }
    }

    function toggleAzanPlayback() {
        if (dom.azanAudio && !dom.azanAudio.paused) {
            stopAzanAudio();
        } else {
            playAzanAudio();
        }
    }

    function playAzanAudio() {
        if (!dom.azanAudio) {
            playSynthesizedAzanChime();
            return;
        }
        try {
            dom.azanAudio.currentTime = 0;
            const playPromise = dom.azanAudio.play();
            
            if (dom.btnTestAzanAudio) {
                dom.btnTestAzanAudio.innerHTML = '<i class="fa-solid fa-square"></i> Hentikan Azan';
                dom.btnTestAzanAudio.classList.add('btn-stop-active');
            }

            if (dom.azanAudio) {
                dom.azanAudio.onended = stopAzanAudio;
            }

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
            }
        });
    }

    function sendPushNotification(title, body) {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                    body: body,
                    icon: 'icons/icon-192.png',
                    badge: 'icons/icon-192.png',
                    vibrate: [300, 100, 300, 100, 500]
                });
            }).catch(() => {
                try {
                    new Notification(title, {
                        body: body,
                        icon: 'icons/icon-192.png'
                    });
                } catch(e){}
            });
        } else {
            try {
                new Notification(title, {
                    body: body,
                    icon: 'icons/icon-192.png'
                });
            } catch(e){}
        }
    }

    function playAzanAudio() {
        if (!dom.azanAudio) {
            playSynthesizedAzanChime();
            return;
        }
        try {
            dom.azanAudio.currentTime = 0;
            const playPromise = dom.azanAudio.play();
            
            if (dom.btnTestAzanAudio) {
                dom.btnTestAzanAudio.innerHTML = '<i class="fa-solid fa-volume-high fa-spin"></i> Dimainkan...';
                setTimeout(() => {
                    if (dom.btnTestAzanAudio) dom.btnTestAzanAudio.innerHTML = '<i class="fa-solid fa-play"></i> Mainkan Azan';
                }, 6000);
            }

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
            const pDate = new Date(`${todayStr}T${list[i].timeStr}`);
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
            const tomorrowStr = getLocalDateString(tomorrow);
            nextPrayer.targetDate = new Date(`${tomorrowStr}T${nextPrayer.timeStr}`);
        } else {
            nextPrayer.targetDate = new Date(`${todayStr}T${nextPrayer.timeStr}`);
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

        // Pemicu Notifikasi & Azan apabila masuk waktu solat (toleransi 0 hingga 2000ms)
        const notifKey = `${nextPrayer.name}_${getLocalDateString(nextPrayer.targetDate)}_${nextPrayer.timeStr}`;
        if (diffMs <= 2000 && diffMs >= 0 && state.lastNotificationKey !== notifKey) {
            state.lastNotificationKey = notifKey;
            playAzanNotification(nextPrayer.key, nextPrayer.name);
        }

        const totalSec = Math.max(0, Math.floor(diffMs / 1000));
        const hours = Math.floor(totalSec / 3600);
        const minutes = Math.floor((totalSec % 3600) / 60);
        const seconds = totalSec % 60;

        dom.cdHours.textContent = String(hours).padStart(2, '0');
        dom.cdMinutes.textContent = String(minutes).padStart(2, '0');
        dom.cdSeconds.textContent = String(seconds).padStart(2, '0');
    }

    // --- 6. JAM DIGITAL REALTIME ---
    function startLiveClock() {
        setInterval(() => {
            const now = new Date();
            dom.liveTimeDisplay.textContent = now.toLocaleTimeString('ms-MY', { hour12: false });
            updateNextPrayerCountdown();
        }, 1000);
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
        dom.tasbihCounter.textContent = 0;
    }

    function switchTasbihPhrase() {
        state.tasbihIndex = (state.tasbihIndex + 1) % TASBIH_PHRASES.length;
        updateTasbihUI();
    }

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
        modal.classList.add('active');
    }

    function closeModal(modal) {
        modal.classList.remove('active');
    }

    // --- 11. EVENT LISTENERS ---
    function setupEventListeners() {
        // Tab Navigation
        dom.navItems.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                dom.navItems.forEach(b => b.classList.remove('active'));
                dom.tabContents.forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
            });
        });

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
        if (dom.btnRequestNotif) dom.btnRequestNotif.addEventListener('click', () => openModal(dom.modalSettings));
        if (dom.btnOpenSettings) dom.btnOpenSettings.addEventListener('click', () => openModal(dom.modalSettings));
        if (dom.btnCloseSettings) dom.btnCloseSettings.addEventListener('click', () => closeModal(dom.modalSettings));

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
            dom.btnTestPushNotif.addEventListener('click', () => {
                playAzanAudio();
                sendPushNotification(
                    `Ujian: Masuk Waktu Solat`,
                    `Alunan Azan Makkah dan Push Notification waktu solat bagi zon ${state.currentZone} berfungsi dengan cemerlang!`
                );
            });
        }

        // Modal Panduan Install PWA
        if (dom.btnOpenInstallGuide) dom.btnOpenInstallGuide.addEventListener('click', () => openModal(dom.modalInstallGuide));
        if (dom.btnCloseInstallGuide) {
            dom.btnCloseInstallGuide.addEventListener('click', () => {
                closeModal(dom.modalInstallGuide);
                localStorage.setItem('hasSeenPwaInstallGuide_v1', 'true');
            });
        }
        if (dom.btnDismissInstallGuide) {
            dom.btnDismissInstallGuide.addEventListener('click', () => {
                closeModal(dom.modalInstallGuide);
                localStorage.setItem('hasSeenPwaInstallGuide_v1', 'true');
            });
        }

        // Close Modals on Overlay Click
        window.addEventListener('click', (e) => {
            if (e.target === dom.modalZone) closeModal(dom.modalZone);
            if (e.target === dom.modalTheme) closeModal(dom.modalTheme);
            if (e.target === dom.modalSettings) closeModal(dom.modalSettings);
            if (e.target === dom.modalInstallGuide) {
                closeModal(dom.modalInstallGuide);
                localStorage.setItem('hasSeenPwaInstallGuide_v1', 'true');
            }
        });

        // PWA Install Prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            state.deferredInstallPrompt = e;
            dom.pwaBanner.classList.add('active');
        });

        dom.btnInstallPwa.addEventListener('click', () => {
            if (state.deferredInstallPrompt) {
                state.deferredInstallPrompt.prompt();
                state.deferredInstallPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        dom.pwaBanner.classList.remove('active');
                    }
                    state.deferredInstallPrompt = null;
                });
            }
        });
    }

    // --- 12. REGISTER SERVICE WORKER (PWA) ---
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('ServiceWorker registered:', reg.scope))
                .catch(err => console.log('ServiceWorker registration failed:', err));
        }
    }

    // MULA APLIKASI
    init();
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
