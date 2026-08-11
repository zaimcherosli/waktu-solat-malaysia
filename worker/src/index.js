/* ==========================================================================
   WAKTU SOLAT PUSH NOTIFICATION WORKER
   Cloudflare Worker with Cron Trigger for Web Push Notifications
   ========================================================================== */

// --- WEB PUSH CRYPTO UTILITIES ---

function base64UrlToUint8Array(base64Url) {
  const padding = '='.repeat((4 - base64Url.length % 4) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function uint8ArrayToBase64Url(uint8Array) {
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function concatUint8Arrays(...arrays) {
  const totalLen = arrays.reduce((acc, arr) => acc + arr.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// HKDF (RFC 5869) using Web Crypto
async function hkdf(salt, ikm, info, length) {
  const key = await crypto.subtle.importKey('raw', ikm, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  
  // Extract
  const saltKey = await crypto.subtle.importKey('raw', salt.length ? salt : new Uint8Array(32), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const prk = new Uint8Array(await crypto.subtle.sign('HMAC', saltKey, ikm));
  
  // Expand
  const prkKey = await crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const infoAndOne = concatUint8Arrays(info, new Uint8Array([1]));
  const okm = new Uint8Array(await crypto.subtle.sign('HMAC', prkKey, infoAndOne));
  
  return okm.slice(0, length);
}

async function createVapidJwt(endpoint, vapidSubject, vapidPrivateKeyBase64) {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  
  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: vapidSubject
  };
  
  const encoder = new TextEncoder();
  const headerB64 = uint8ArrayToBase64Url(encoder.encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64Url(encoder.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;
  
  // Import VAPID private key
  const privateKeyBytes = base64UrlToUint8Array(vapidPrivateKeyBase64);
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d: uint8ArrayToBase64Url(privateKeyBytes),
    x: '', // Will be derived
    y: ''
  };
  
  // We need to derive x,y from the private key. Use a JWK import with the full key.
  // Actually, for signing we need to import the private key properly.
  const keyData = await crypto.subtle.importKey(
    'raw',
    privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  ).catch(async () => {
    // Fallback: generate key pair and import as JWK
    const keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const exported = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
    exported.d = uint8ArrayToBase64Url(privateKeyBytes);
    return crypto.subtle.importKey('jwk', exported, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  });
  
  const signature = new Uint8Array(await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    keyData,
    encoder.encode(unsignedToken)
  ));
  
  // Convert DER signature to raw r||s format if needed
  const signatureB64 = uint8ArrayToBase64Url(signature);
  
  return `${unsignedToken}.${signatureB64}`;
}

// --- SIMPLIFIED WEB PUSH SEND ---
async function sendWebPush(subscription, payload, env) {
  const vapidSubject = env.VAPID_SUBJECT;
  const vapidPublicKey = env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = env.VAPID_PRIVATE_KEY;
  
  if (!subscription || !subscription.endpoint) {
    console.log('[Push] Invalid subscription, skipping');
    return { success: false, reason: 'invalid_subscription' };
  }

  try {
    // For simplicity, send without encryption (most push services accept this)
    // The payload will be in the request body
    const payloadStr = JSON.stringify(payload);
    const payloadBytes = new TextEncoder().encode(payloadStr);
    
    // Generate VAPID authorization
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    
    // Create JWT manually
    const header = { typ: 'JWT', alg: 'ES256' };
    const jwtPayload = {
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
      sub: vapidSubject
    };
    
    const encoder = new TextEncoder();
    const headerB64 = uint8ArrayToBase64Url(encoder.encode(JSON.stringify(header)));
    const payloadB64 = uint8ArrayToBase64Url(encoder.encode(JSON.stringify(jwtPayload)));
    const unsignedToken = `${headerB64}.${payloadB64}`;
    
    // Import ECDSA private key for VAPID signing
    const privateKeyRaw = base64UrlToUint8Array(vapidPrivateKey);
    
    // Build JWK for import
    // We need to derive the public key x,y from the public key
    const publicKeyRaw = base64UrlToUint8Array(vapidPublicKey);
    // publicKeyRaw is 65 bytes: 0x04 || x (32 bytes) || y (32 bytes)
    const x = uint8ArrayToBase64Url(publicKeyRaw.slice(1, 33));
    const y = uint8ArrayToBase64Url(publicKeyRaw.slice(33, 65));
    const d = uint8ArrayToBase64Url(privateKeyRaw);
    
    const jwk = { kty: 'EC', crv: 'P-256', x, y, d, ext: true };
    
    const signingKey = await crypto.subtle.importKey(
      'jwk', jwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false, ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      signingKey,
      encoder.encode(unsignedToken)
    );
    
    // Convert from DER to raw r||s if signature is DER encoded
    let sigBytes = new Uint8Array(signatureBuffer);
    if (sigBytes.length !== 64) {
      // DER encoded, need to extract r and s
      sigBytes = derToRaw(sigBytes);
    }
    
    const jwt = `${unsignedToken}.${uint8ArrayToBase64Url(sigBytes)}`;
    const vapidAuth = `vapid t=${jwt}, k=${vapidPublicKey}`;
    
    // --- PAYLOAD ENCRYPTION (RFC 8291 - aes128gcm) ---
    // Generate local ECDH key pair
    const localKeyPair = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true, ['deriveBits']
    );
    const localPublicKeyRaw = new Uint8Array(
      await crypto.subtle.exportKey('raw', localKeyPair.publicKey)
    );
    
    // Import subscriber's public key
    const subP256dh = base64UrlToUint8Array(subscription.keys.p256dh);
    const subscriberKey = await crypto.subtle.importKey(
      'raw', subP256dh,
      { name: 'ECDH', namedCurve: 'P-256' },
      false, []
    );
    
    // ECDH shared secret
    const sharedSecret = new Uint8Array(
      await crypto.subtle.deriveBits(
        { name: 'ECDH', public: subscriberKey },
        localKeyPair.privateKey, 256
      )
    );
    
    // Auth secret from subscription
    const authSecret = base64UrlToUint8Array(subscription.keys.auth);
    
    // HKDF for IKM
    const ikm_info = concatUint8Arrays(
      encoder.encode('WebPush: info\0'),
      subP256dh,
      localPublicKeyRaw
    );
    const ikm = await hkdf(authSecret, sharedSecret, ikm_info, 32);
    
    // Generate salt (16 bytes random)
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Derive Content Encryption Key (CEK) and nonce
    const cek_info = encoder.encode('Content-Encoding: aes128gcm\0');
    const nonce_info = encoder.encode('Content-Encoding: nonce\0');
    const cek = await hkdf(salt, ikm, cek_info, 16);
    const nonce = await hkdf(salt, ikm, nonce_info, 12);
    
    // Pad the plaintext (add 0x02 delimiter for aes128gcm)
    const paddedPayload = concatUint8Arrays(payloadBytes, new Uint8Array([2]));
    
    // Encrypt with AES-128-GCM
    const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
    const encrypted = new Uint8Array(
      await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, paddedPayload)
    );
    
    // Build aes128gcm header: salt (16) || rs (4) || idlen (1) || keyid (65)
    const rs = new Uint8Array(4);
    new DataView(rs.buffer).setUint32(0, 4096, false);
    const idlen = new Uint8Array([65]); // length of localPublicKeyRaw
    
    const body = concatUint8Arrays(salt, rs, idlen, localPublicKeyRaw, encrypted);
    
    // Send the push message
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': vapidAuth,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
        'Urgency': 'high'
      },
      body: body
    });
    
    if (response.status === 201 || response.status === 200) {
      return { success: true };
    } else if (response.status === 404 || response.status === 410) {
      return { success: false, reason: 'expired', status: response.status };
    } else {
      const text = await response.text();
      console.log(`[Push] Failed: ${response.status} ${text}`);
      return { success: false, reason: 'error', status: response.status, body: text };
    }
  } catch (err) {
    console.log(`[Push] Error: ${err.message}`);
    return { success: false, reason: 'exception', error: err.message };
  }
}

function derToRaw(der) {
  // DER: 0x30 len 0x02 rLen r 0x02 sLen s
  let offset = 2; // skip 0x30 and total length
  if (der[0] !== 0x30) return der; // not DER
  
  offset++; // skip 0x02
  const rLen = der[offset++];
  const r = der.slice(offset, offset + rLen);
  offset += rLen;
  
  offset++; // skip 0x02
  const sLen = der[offset++];
  const s = der.slice(offset, offset + sLen);
  
  // Pad/trim r and s to 32 bytes each
  const rPadded = new Uint8Array(32);
  const sPadded = new Uint8Array(32);
  rPadded.set(r.length > 32 ? r.slice(r.length - 32) : r, 32 - Math.min(r.length, 32));
  sPadded.set(s.length > 32 ? s.slice(s.length - 32) : s, 32 - Math.min(s.length, 32));
  
  return concatUint8Arrays(rPadded, sPadded);
}

// --- PRAYER TIME FETCHING ---
async function fetchPrayerTimes(zoneCode) {
  try {
    const response = await fetch(
      `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=today&zone=${zoneCode}`,
      { headers: { 'Accept': 'application/json' } }
    );
    const data = await response.json();
    
    if (data && data.prayerTime && data.prayerTime.length > 0) {
      const p = data.prayerTime[0];
      return {
        fajr: formatTimeStr(p.fajr),
        syuruk: formatTimeStr(p.syuruk),
        dhuhr: formatTimeStr(p.dhuhr),
        asr: formatTimeStr(p.asr),
        maghrib: formatTimeStr(p.maghrib),
        isha: formatTimeStr(p.isha)
      };
    }
  } catch (err) {
    console.log(`[Fetch] Error fetching prayer times for ${zoneCode}: ${err.message}`);
  }
  return null;
}

function formatTimeStr(timeStr) {
  if (!timeStr) return null;
  // Remove any AM/PM and extra spaces, return HH:MM:SS in 24h format
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

function getMalaysiaDateTime() {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(new Date());
  const map = {};
  parts.forEach(p => { if (p.type !== 'literal') map[p.type] = p.value; });
  
  let hour = parseInt(map.hour, 10);
  if (hour === 24) hour = 0;
  const hourStr = String(hour).padStart(2, '0');
  
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: hourStr,
    minute: map.minute,
    second: map.second,
    dateStr: `${map.year}-${map.month}-${map.day}`,
    timeStr: `${hourStr}:${map.minute}`,
    totalMinutes: hour * 60 + parseInt(map.minute, 10)
  };
}

function parseMinutesFromTimeStr(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  let h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  if (/pm/i.test(timeStr) && h < 12) h += 12;
  if (/am/i.test(timeStr) && h === 12) h = 0;
  return h * 60 + m;
}

// --- CORS HEADERS ---
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// --- MAIN WORKER ---
export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }
    
    const url = new URL(request.url);
    
    // POST /api/subscribe
    if (url.pathname === '/api/subscribe' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { subscription, zone } = body;
        
        if (!subscription || !subscription.endpoint || !zone) {
          return new Response(JSON.stringify({ error: 'Missing subscription or zone' }), {
            status: 400, headers: CORS_HEADERS
          });
        }
        
        const subKey = `sub_${await hashEndpoint(subscription.endpoint)}`;
        
        await env.PUSH_SUBS.put(subKey, JSON.stringify({
          subscription,
          zone,
          subscribedAt: new Date().toISOString()
        }));
        
        const zoneIndexKey = `zone_${zone}`;
        let zoneIndex = await env.PUSH_SUBS.get(zoneIndexKey, 'json') || [];
        if (!zoneIndex.includes(subKey)) {
          zoneIndex.push(subKey);
          await env.PUSH_SUBS.put(zoneIndexKey, JSON.stringify(zoneIndex));
        }
        
        let allZones = await env.PUSH_SUBS.get('all_zones', 'json') || [];
        if (!allZones.includes(zone)) {
          allZones.push(zone);
          await env.PUSH_SUBS.put('all_zones', JSON.stringify(allZones));
        }
        
        console.log(`[Subscribe] New subscription for zone ${zone}: ${subKey}`);
        
        return new Response(JSON.stringify({ success: true, key: subKey }), {
          headers: CORS_HEADERS
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500, headers: CORS_HEADERS
        });
      }
    }

    // POST /api/test-push (Test Web Push dari Server ke Telefon)
    if (url.pathname === '/api/test-push' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { endpoint, zone } = body;

        let targetSubData = null;
        if (endpoint) {
          const subKey = `sub_${await hashEndpoint(endpoint)}`;
          targetSubData = await env.PUSH_SUBS.get(subKey, 'json');
        }

        if (!targetSubData && zone) {
          const zoneIndexKey = `zone_${zone}`;
          const subKeys = await env.PUSH_SUBS.get(zoneIndexKey, 'json') || [];
          if (subKeys.length > 0) {
            targetSubData = await env.PUSH_SUBS.get(subKeys[subKeys.length - 1], 'json');
          }
        }

        if (!targetSubData) {
          return new Response(JSON.stringify({ error: 'No subscription found to send test push' }), {
            status: 404, headers: CORS_HEADERS
          });
        }

        const result = await sendWebPush(targetSubData.subscription, {
          title: '✈ Ujian Push Server Cloudflare',
          body: `Web Push dari server Cloudflare ke zon ${targetSubData.zone} berfungsi 100% sempurna!`,
          type: 'test',
          zone: targetSubData.zone
        }, env);

        return new Response(JSON.stringify({ success: result.success, result }), {
          headers: CORS_HEADERS
        });
      } catch(err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500, headers: CORS_HEADERS
        });
      }
    }
    
    // POST /api/unsubscribe
    if (url.pathname === '/api/unsubscribe' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { endpoint } = body;
        
        if (!endpoint) {
          return new Response(JSON.stringify({ error: 'Missing endpoint' }), {
            status: 400, headers: CORS_HEADERS
          });
        }
        
        const subKey = `sub_${await hashEndpoint(endpoint)}`;
        const subData = await env.PUSH_SUBS.get(subKey, 'json');
        
        if (subData) {
          const zoneIndexKey = `zone_${subData.zone}`;
          let zoneIndex = await env.PUSH_SUBS.get(zoneIndexKey, 'json') || [];
          zoneIndex = zoneIndex.filter(k => k !== subKey);
          await env.PUSH_SUBS.put(zoneIndexKey, JSON.stringify(zoneIndex));
          
          await env.PUSH_SUBS.delete(subKey);
        }
        
        return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500, headers: CORS_HEADERS
        });
      }
    }
    
    // GET /api/status
    if (url.pathname === '/api/status') {
      const allZones = await env.PUSH_SUBS.get('all_zones', 'json') || [];
      const myDt = getMalaysiaDateTime();
      return new Response(JSON.stringify({
        status: 'active',
        zones: allZones,
        time: myDt.timeStr,
        date: myDt.dateStr
      }), { headers: CORS_HEADERS });
    }
    
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404, headers: CORS_HEADERS
    });
  },
  
  // --- CRON TRIGGER: RUNS EVERY MINUTE ---
  async scheduled(event, env, ctx) {
    const myDt = getMalaysiaDateTime();
    const currentTime = myDt.timeStr;
    const currentTotalMin = myDt.totalMinutes;
    const todayStr = myDt.dateStr;
    
    console.log(`[Cron] Running at ${currentTime} MYT (${todayStr})`);
    
    const allZones = await env.PUSH_SUBS.get('all_zones', 'json') || [];
    if (allZones.length === 0) {
      console.log('[Cron] No subscriptions found, skipping');
      return;
    }
    
    for (const zone of allZones) {
      const cacheKey = `cache_${zone}_${todayStr}`;
      let prayerTimes = await env.PUSH_SUBS.get(cacheKey, 'json');
      
      if (!prayerTimes) {
        prayerTimes = await fetchPrayerTimes(zone);
        if (prayerTimes) {
          await env.PUSH_SUBS.put(cacheKey, JSON.stringify(prayerTimes), {
            expirationTtl: 86400
          });
        } else {
          console.log(`[Cron] Failed to fetch prayer times for ${zone}, skipping`);
          continue;
        }
      }
      
      const triggers = [];
      
      const prayerNames = {
        fajr: 'Subuh',
        dhuhr: 'Zohor',
        asr: 'Asar',
        maghrib: 'Maghrib',
        isha: 'Isyak'
      };
      
      for (const [key, name] of Object.entries(prayerNames)) {
        if (!prayerTimes[key]) continue;
        const pMin = parseMinutesFromTimeStr(prayerTimes[key]);
        if (pMin !== null) {
          const diffMin = currentTotalMin - pMin;
          // Trigger jika masa berada dalam tetingkap 0 hingga 5 minit
          if (diffMin >= 0 && diffMin <= 5) {
            triggers.push({
              type: 'prayer',
              key: `${key}_${todayStr}`,
              title: `🕌 Telah Masuk Waktu Solat ${name}`,
              body: `Telah masuk waktu solat ${name} bagi zon ${zone}. Mari mendirikan solat!`
            });
          }
        }
      }
      
      // Surah Al-Waqiah (30 min selepas Subuh)
      if (prayerTimes.fajr) {
        const fajrMin = parseMinutesFromTimeStr(prayerTimes.fajr);
        if (fajrMin !== null) {
          const waqiahMin = fajrMin + 30;
          const diffMinW = currentTotalMin - waqiahMin;
          if (diffMinW >= 0 && diffMinW <= 5) {
            triggers.push({
              type: 'surah',
              key: `waqiah_${todayStr}`,
              title: '📖 Surah Al-Waqiah (Masa Pagi)',
              body: 'Waktu 30 minit selepas Subuh. Mari membaca Surah Al-Waqiah pembuka rezeki!'
            });
          }
        }
      }
      
      // Surah Al-Mulk (30 min selepas Isyak)
      if (prayerTimes.isha) {
        const ishaMin = parseMinutesFromTimeStr(prayerTimes.isha);
        if (ishaMin !== null) {
          const mulkMin = ishaMin + 30;
          const diffMinM = currentTotalMin - mulkMin;
          if (diffMinM >= 0 && diffMinM <= 5) {
            triggers.push({
              type: 'surah',
              key: `mulk_${todayStr}`,
              title: '🌙 Surah Al-Mulk (Masa Malam)',
              body: 'Amalan sebelum tidur 30 minit selepas Isyak. Mari membaca Surah Al-Mulk pelindung alam kubur!'
            });
          }
        }
      }
      
      if (triggers.length === 0) continue;
      
      console.log(`[Cron] Zone ${zone}: ${triggers.length} trigger(s) found at ${currentTime}`);
      
      // Get all subscriptions for this zone
      const zoneIndexKey = `zone_${zone}`;
      const subKeys = await env.PUSH_SUBS.get(zoneIndexKey, 'json') || [];
      
      for (const subKey of subKeys) {
        const subData = await env.PUSH_SUBS.get(subKey, 'json');
        if (!subData || !subData.subscription) continue;
        
        for (const trigger of triggers) {
          // Dedup: check if already sent
          const sentKey = `sent_${subKey}_${trigger.key}`;
          const alreadySent = await env.PUSH_SUBS.get(sentKey);
          if (alreadySent) continue;
          
          const result = await sendWebPush(subData.subscription, {
            title: trigger.title,
            body: trigger.body,
            type: trigger.type,
            zone: zone
          }, env);
          
          if (result.success) {
            // Mark as sent (expires after 24h)
            await env.PUSH_SUBS.put(sentKey, '1', { expirationTtl: 86400 });
            console.log(`[Cron] ✅ Sent to ${subKey}: ${trigger.title}`);
          } else if (result.reason === 'expired') {
            // Remove expired subscription
            await env.PUSH_SUBS.delete(subKey);
            let zoneIndex = await env.PUSH_SUBS.get(zoneIndexKey, 'json') || [];
            zoneIndex = zoneIndex.filter(k => k !== subKey);
            await env.PUSH_SUBS.put(zoneIndexKey, JSON.stringify(zoneIndex));
            console.log(`[Cron] 🗑️ Removed expired subscription: ${subKey}`);
          } else {
            console.log(`[Cron] ❌ Failed for ${subKey}: ${JSON.stringify(result)}`);
          }
        }
      }
    }
  }
};

async function hashEndpoint(endpoint) {
  const encoder = new TextEncoder();
  const data = encoder.encode(endpoint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return uint8ArrayToBase64Url(hashArray).substring(0, 16);
}
