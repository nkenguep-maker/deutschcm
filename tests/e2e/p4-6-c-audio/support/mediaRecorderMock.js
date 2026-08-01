// P4.6-C.3 · MediaRecorder + getUserMedia mock pour Playwright.
//
// Injecté via context.addInitScript AVANT le chargement de la page.
// Simule un enregistrement audio réel qui produit un Blob WAV valide
// (magic bytes + durée ~1s + 8kHz mono 16-bit) accepté par la
// validation serveur P4.6-C.1 (magic bytes + music-metadata).
//
// AUCUN enregistrement vocal humain. AUCUN accès au vrai microphone.
// Activé uniquement dans le contexte Playwright · le code Production
// utilise le vrai MediaRecorder navigateur.

(() => {
  if (typeof window === "undefined") return;

  // Génère un WAV silencieux 1s / 8kHz / mono / 16-bit (16 044 bytes).
  function makeWavBlob() {
    const sampleRate = 8000;
    const seconds = 1;
    const numSamples = sampleRate * seconds;
    const dataSize = numSamples * 2;
    const buf = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buf);
    // "RIFF"
    view.setUint8(0, 0x52); view.setUint8(1, 0x49); view.setUint8(2, 0x46); view.setUint8(3, 0x46);
    view.setUint32(4, 36 + dataSize, true);
    // "WAVE"
    view.setUint8(8, 0x57); view.setUint8(9, 0x41); view.setUint8(10, 0x56); view.setUint8(11, 0x45);
    // "fmt "
    view.setUint8(12, 0x66); view.setUint8(13, 0x6d); view.setUint8(14, 0x74); view.setUint8(15, 0x20);
    view.setUint32(16, 16, true);         // fmt chunk size
    view.setUint16(20, 1, true);          // PCM
    view.setUint16(22, 1, true);          // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    // "data"
    view.setUint8(36, 0x64); view.setUint8(37, 0x61); view.setUint8(38, 0x74); view.setUint8(39, 0x61);
    view.setUint32(40, dataSize, true);
    // PCM silence (déjà 0).
    return new Blob([buf], { type: "audio/wav" });
  }

  // Mock getUserMedia · retourne un MediaStream avec un track factice
  // dont stop() est appelable et enregistré.
  const trackStops = [];
  function makeFakeTrack() {
    const listeners = new Map();
    const track = {
      kind: "audio",
      id: "yema-e2e-track-" + Math.random().toString(36).slice(2, 10),
      label: "yema-e2e-mock",
      enabled: true,
      muted: false,
      readyState: "live",
      stop() {
        this.readyState = "ended";
        trackStops.push(this.id);
      },
      addEventListener(type, cb) { listeners.set(type, cb); },
      removeEventListener(type) { listeners.delete(type); },
      dispatchEvent(evt) { const cb = listeners.get(evt.type); if (cb) cb(evt); return true; },
    };
    return track;
  }

  function makeFakeStream() {
    const tracks = [makeFakeTrack()];
    const listeners = new Map();
    return {
      id: "yema-e2e-stream-" + Math.random().toString(36).slice(2, 10),
      active: true,
      getTracks: () => tracks.slice(),
      getAudioTracks: () => tracks.slice(),
      getVideoTracks: () => [],
      addEventListener(type, cb) { listeners.set(type, cb); },
      removeEventListener(type) { listeners.delete(type); },
      dispatchEvent(evt) { const cb = listeners.get(evt.type); if (cb) cb(evt); return true; },
    };
  }

  // Setup navigator.mediaDevices.getUserMedia
  if (!navigator.mediaDevices) {
    Object.defineProperty(navigator, "mediaDevices", { value: {}, configurable: true, writable: true });
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  navigator.mediaDevices.getUserMedia = async function (_constraints) {
    // Signal debug pour tests (queryable via window.__yemaE2E).
    window.__yemaE2E = window.__yemaE2E || { calls: {} };
    window.__yemaE2E.calls.getUserMedia = (window.__yemaE2E.calls.getUserMedia || 0) + 1;
    // Simuler NotAllowedError si demandé.
    if (window.__yemaE2E_denyMic) {
      const e = new Error("Permission denied");
      e.name = "NotAllowedError";
      throw e;
    }
    return makeFakeStream();
  };

  // Mock MediaRecorder.
  class FakeMediaRecorder {
    constructor(stream, opts) {
      this._stream = stream;
      this.mimeType = (opts && opts.mimeType) || "audio/wav";
      this.state = "inactive";
      this._handlers = { dataavailable: null, stop: null, start: null, error: null };
      window.__yemaE2E = window.__yemaE2E || { calls: {} };
      window.__yemaE2E.calls.MediaRecorderCtor = (window.__yemaE2E.calls.MediaRecorderCtor || 0) + 1;
    }
    static isTypeSupported(mime) {
      // Whitelist alignée avec le serveur + composer.
      return ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg", "audio/wav"].some((m) => mime.startsWith(m));
    }
    set ondataavailable(fn) { this._handlers.dataavailable = fn; }
    set onstop(fn) { this._handlers.stop = fn; }
    set onstart(fn) { this._handlers.start = fn; }
    set onerror(fn) { this._handlers.error = fn; }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    start(_timesliceMs) {
      this.state = "recording";
      if (this._handlers.start) setTimeout(() => this._handlers.start(new Event("start")), 0);
    }
    stop() {
      if (this.state !== "recording") return;
      this.state = "inactive";
      const blob = makeWavBlob();
      // Le serveur revalide via magic bytes · WAV accepté quel que soit
      // le mimeType annoncé par l'app.
      setTimeout(() => {
        if (this._handlers.dataavailable) this._handlers.dataavailable({ data: blob });
        if (this._handlers.stop) this._handlers.stop(new Event("stop"));
      }, 50);
    }
    pause() { this.state = "paused"; }
    resume() { this.state = "recording"; }
  }
  window.MediaRecorder = FakeMediaRecorder;

  // Signal ready pour les tests.
  window.__yemaE2E = window.__yemaE2E || { calls: {} };
  window.__yemaE2E.trackStops = trackStops;
  window.__yemaE2E.ready = true;
})();
