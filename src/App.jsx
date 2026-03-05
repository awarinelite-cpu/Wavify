import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

// ─── Firebase Config ─────────────────────────────────────────────────────────
// Replace with your Firebase project config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ─── Icons ────────────────────────────────────────────────────────────────────
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);
const NextIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
  </svg>
);
const PrevIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
  </svg>
);
const VolumeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);
const MusicNoteIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
  </svg>
);
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
  </svg>
);
const ShuffleIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" opacity={active ? 1 : 0.4}>
    <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
  </svg>
);
const RepeatIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" opacity={active ? 1 : 0.4}>
    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
  </svg>
);
const WifiOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M22.99 9C19.15 5.16 13.8 3.76 8.84 4.78L11 6.94c3.5-.16 7.02 1.09 9.63 3.7L22.99 9zM13 16.94V19h-2v-2.06C8.52 16.6 6.32 15.15 4.77 13L3.34 14.43C5.13 16.7 7.66 18.3 10.56 18.82L13 16.94zM1.41 1.18L0 2.59l2.05 2.05C.81 5.49.21 6.67 0 8l2 2c.28-1.4.93-2.67 1.88-3.73L4.76 7.15C3.77 8.22 3 9.56 3 11c0 2.22.89 4.23 2.34 5.68L1 21h2.5l17 17 1.41-1.41L1.41 1.18zM12 20c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(s) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function getCachedKey(id) {
  return `cached_track_${id}`;
}

// ─── Service Worker Registration ──────────────────────────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadMeta, setUploadMeta] = useState({ title: "", artist: "", album: "" });
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedIds, setCachedIds] = useState({});
  const [view, setView] = useState("player"); // player | admin
  const [isLoading, setIsLoading] = useState(true);
  const [coverColor, setCoverColor] = useState("#1a1a2e");

  const audioRef = useRef(null);

  // ── Online/offline detection ──
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // ── Auth listener ──
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAdmin(!!u); // any signed-in user is admin for now
    });
  }, []);

  // ── Load tracks ──
  useEffect(() => {
    loadTracks();
  }, []);

  async function loadTracks() {
    setIsLoading(true);
    try {
      const q = query(collection(db, "tracks"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTracks(data);
      // Check which are cached locally
      const cached = {};
      for (const t of data) {
        const key = getCachedKey(t.id);
        if (localStorage.getItem(key)) cached[t.id] = true;
      }
      setCachedIds(cached);
    } catch (e) {
      console.error("Error loading tracks:", e);
    }
    setIsLoading(false);
  }

  // ── Audio controls ──
  const currentTrack = currentIdx !== null ? tracks[currentIdx] : null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    // Try cached URL first
    const cached = localStorage.getItem(getCachedKey(currentTrack.id));
    audio.src = cached || currentTrack.url;
    audio.volume = volume;
    if (isPlaying) audio.play().catch(() => {});

    // Cache for offline
    if (!cached && currentTrack.url) {
      fetch(currentTrack.url)
        .then((r) => r.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            try {
              localStorage.setItem(getCachedKey(currentTrack.id), reader.result);
              setCachedIds((prev) => ({ ...prev, [currentTrack.id]: true }));
            } catch (e) {
              // Storage quota exceeded
            }
          };
          reader.readAsDataURL(blob);
        })
        .catch(() => {});
    }

    // Generate accent color from track index
    const colors = ["#e63946","#f4a261","#2a9d8f","#457b9d","#9b5de5","#f72585","#4cc9f0","#fb8500"];
    setCoverColor(colors[currentIdx % colors.length]);
  }, [currentTrack]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }

  function selectTrack(idx) {
    setCurrentIdx(idx);
    setIsPlaying(true);
    setProgress(0);
  }

  function playNext() {
    if (tracks.length === 0) return;
    if (shuffle) {
      setCurrentIdx(Math.floor(Math.random() * tracks.length));
    } else {
      setCurrentIdx((prev) => (prev === null ? 0 : (prev + 1) % tracks.length));
    }
    setIsPlaying(true);
  }

  function playPrev() {
    if (tracks.length === 0) return;
    setCurrentIdx((prev) => (prev === null ? 0 : (prev - 1 + tracks.length) % tracks.length));
    setIsPlaying(true);
  }

  function onTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) return;
    setProgress(audio.currentTime);
    setDuration(audio.duration || 0);
  }

  function onEnded() {
    if (repeat) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      playNext();
    }
  }

  function seekTo(e) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
  }

  // ── Admin: upload ──
  async function handleUpload() {
    if (!uploadFile || !uploadMeta.title) return;
    const storageRef = ref(storage, `tracks/${Date.now()}_${uploadFile.name}`);
    const task = uploadBytesResumable(storageRef, uploadFile);
    setUploadProgress(0);
    task.on(
      "state_changed",
      (snap) => setUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100),
      (err) => { alert("Upload error: " + err.message); setUploadProgress(null); },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        await addDoc(collection(db, "tracks"), {
          ...uploadMeta,
          url,
          storagePath: storageRef.fullPath,
          createdAt: serverTimestamp(),
        });
        setUploadProgress(null);
        setUploadFile(null);
        setUploadMeta({ title: "", artist: "", album: "" });
        loadTracks();
      }
    );
  }

  async function handleDelete(track) {
    if (!confirm(`Delete "${track.title}"?`)) return;
    try {
      if (track.storagePath) {
        await deleteObject(ref(storage, track.storagePath));
      }
      await deleteDoc(doc(db, "tracks", track.id));
      localStorage.removeItem(getCachedKey(track.id));
      loadTracks();
    } catch (e) {
      alert("Error deleting: " + e.message);
    }
  }

  // ── Admin: login ──
  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      setShowLogin(false);
    } catch (err) {
      setLoginError("Invalid credentials");
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={styles.root}>
      <audio
        ref={audioRef}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>◈ WAVIFY</span>
          {!isOnline && (
            <span style={styles.offlineBadge}>
              <WifiOffIcon /> offline
            </span>
          )}
        </div>
        <nav style={styles.nav}>
          <button style={view === "player" ? styles.navBtnActive : styles.navBtn} onClick={() => setView("player")}>
            Library
          </button>
          {isAdmin && (
            <button style={view === "admin" ? styles.navBtnActive : styles.navBtn} onClick={() => setView("admin")}>
              Admin
            </button>
          )}
          {!user ? (
            <button style={styles.loginBtn} onClick={() => setShowLogin(true)}>Admin Login</button>
          ) : (
            <button style={styles.loginBtn} onClick={() => signOut(auth)}>Sign Out</button>
          )}
        </nav>
      </header>

      {/* Login Modal */}
      {showLogin && (
        <div style={styles.modalOverlay} onClick={() => setShowLogin(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Admin Login</h2>
            {loginError && <p style={styles.errorText}>{loginError}</p>}
            <input style={styles.input} type="email" placeholder="Email" value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)} />
            <input style={styles.input} type="password" placeholder="Password" value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin(e)} />
            <button style={styles.primaryBtn} onClick={handleLogin}>Login</button>
          </div>
        </div>
      )}

      <main style={styles.main}>
        {/* ── PLAYER VIEW ── */}
        {view === "player" && (
          <div style={styles.playerLayout}>
            {/* Now Playing */}
            <div style={styles.nowPlaying}>
              <div style={{ ...styles.coverArt, background: currentTrack ? coverColor : "#1a1a2e" }}>
                {currentTrack ? (
                  <div style={styles.coverInner}>
                    <div style={styles.vinylRing}>
                      <MusicNoteIcon />
                    </div>
                    <p style={styles.coverTitle}>{currentTrack.title}</p>
                    <p style={styles.coverArtist}>{currentTrack.artist || "Unknown Artist"}</p>
                  </div>
                ) : (
                  <div style={styles.coverInner}>
                    <MusicNoteIcon />
                    <p style={{ color: "#555", marginTop: 12, fontSize: 14 }}>Select a track</p>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div style={styles.progressWrap} onClick={seekTo}>
                <div style={styles.progressBg}>
                  <div style={{ ...styles.progressFill, width: duration ? `${(progress / duration) * 100}%` : "0%" }} />
                  <div style={{ ...styles.progressThumb, left: duration ? `${(progress / duration) * 100}%` : "0%" }} />
                </div>
                <div style={styles.timeRow}>
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div style={styles.controls}>
                <button style={styles.iconBtn} onClick={() => setShuffle(!shuffle)}><ShuffleIcon active={shuffle} /></button>
                <button style={styles.iconBtn} onClick={playPrev}><PrevIcon /></button>
                <button style={styles.playBtn} onClick={togglePlay}>
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
                <button style={styles.iconBtn} onClick={playNext}><NextIcon /></button>
                <button style={styles.iconBtn} onClick={() => setRepeat(!repeat)}><RepeatIcon active={repeat} /></button>
              </div>

              {/* Volume */}
              <div style={styles.volumeRow}>
                <VolumeIcon />
                <input type="range" min={0} max={1} step={0.01} value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  style={styles.volumeSlider} />
              </div>
            </div>

            {/* Track List */}
            <div style={styles.trackList}>
              <h2 style={styles.sectionTitle}>Library <span style={styles.trackCount}>{tracks.length}</span></h2>
              {isLoading ? (
                <div style={styles.loadingText}>Loading tracks…</div>
              ) : tracks.length === 0 ? (
                <div style={styles.emptyText}>No tracks yet. Ask the admin to upload some.</div>
              ) : (
                <div style={styles.trackScroll}>
                  {tracks.map((t, i) => (
                    <div
                      key={t.id}
                      style={{ ...styles.trackRow, ...(i === currentIdx ? styles.trackRowActive : {}) }}
                      onClick={() => selectTrack(i)}
                    >
                      <div style={{ ...styles.trackNum, color: i === currentIdx ? coverColor : "#555" }}>
                        {i === currentIdx && isPlaying ? (
                          <span style={styles.playingDots}>▶</span>
                        ) : (
                          String(i + 1).padStart(2, "0")
                        )}
                      </div>
                      <div style={styles.trackInfo}>
                        <p style={styles.trackTitle}>{t.title}</p>
                        <p style={styles.trackMeta}>{t.artist || "Unknown"}{t.album ? ` · ${t.album}` : ""}</p>
                      </div>
                      {cachedIds[t.id] && <span style={styles.cachedBadge}>↓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ADMIN VIEW ── */}
        {view === "admin" && isAdmin && (
          <div style={styles.adminLayout}>
            <h2 style={styles.sectionTitle}>Upload Track</h2>
            <div style={styles.uploadCard}>
              <div style={styles.uploadGrid}>
                <input style={styles.input} placeholder="Title *" value={uploadMeta.title}
                  onChange={(e) => setUploadMeta({ ...uploadMeta, title: e.target.value })} />
                <input style={styles.input} placeholder="Artist" value={uploadMeta.artist}
                  onChange={(e) => setUploadMeta({ ...uploadMeta, artist: e.target.value })} />
                <input style={styles.input} placeholder="Album" value={uploadMeta.album}
                  onChange={(e) => setUploadMeta({ ...uploadMeta, album: e.target.value })} />
                <label style={styles.fileLabel}>
                  <UploadIcon />
                  {uploadFile ? uploadFile.name : "Choose audio file"}
                  <input type="file" accept="audio/*" style={{ display: "none" }}
                    onChange={(e) => setUploadFile(e.target.files[0])} />
                </label>
              </div>
              {uploadProgress !== null && (
                <div style={styles.uploadProgressWrap}>
                  <div style={{ ...styles.uploadProgressFill, width: `${uploadProgress}%` }} />
                  <span style={styles.uploadProgressText}>{Math.round(uploadProgress)}%</span>
                </div>
              )}
              <button style={styles.primaryBtn} onClick={handleUpload}
                disabled={!uploadFile || !uploadMeta.title || uploadProgress !== null}>
                <UploadIcon /> Upload Track
              </button>
            </div>

            <h2 style={{ ...styles.sectionTitle, marginTop: 32 }}>
              Manage Tracks <span style={styles.trackCount}>{tracks.length}</span>
            </h2>
            <div style={styles.adminTrackList}>
              {tracks.map((t, i) => (
                <div key={t.id} style={styles.adminTrackRow}>
                  <span style={styles.adminTrackNum}>{String(i + 1).padStart(2, "0")}</span>
                  <div style={styles.trackInfo}>
                    <p style={styles.trackTitle}>{t.title}</p>
                    <p style={styles.trackMeta}>{t.artist}{t.album ? ` · ${t.album}` : ""}</p>
                  </div>
                  <button style={styles.deleteBtn} onClick={() => handleDelete(t)}><TrashIcon /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  root: {
    minHeight: "100vh",
    background: "#0d0d0d",
    color: "#e8e8e8",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 28px",
    borderBottom: "1px solid #1e1e1e",
    position: "sticky",
    top: 0,
    background: "#0d0d0d",
    zIndex: 100,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  logo: {
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: "0.15em",
    color: "#fff",
    fontFamily: "'Space Grotesk', sans-serif",
  },
  offlineBadge: {
    display: "flex", alignItems: "center", gap: 4,
    background: "#2a1515", color: "#e07070",
    fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
    padding: "3px 10px", borderRadius: 20,
    border: "1px solid #3a2020",
  },
  nav: { display: "flex", alignItems: "center", gap: 8 },
  navBtn: {
    background: "none", border: "none", color: "#666",
    cursor: "pointer", fontSize: 14, fontWeight: 500,
    padding: "6px 14px", borderRadius: 8,
    transition: "color 0.2s",
  },
  navBtnActive: {
    background: "#1e1e1e", border: "none", color: "#fff",
    cursor: "pointer", fontSize: 14, fontWeight: 600,
    padding: "6px 14px", borderRadius: 8,
  },
  loginBtn: {
    background: "#1e1e1e", border: "1px solid #2e2e2e",
    color: "#ccc", cursor: "pointer", fontSize: 13,
    padding: "6px 16px", borderRadius: 8, fontWeight: 500,
  },
  main: { flex: 1, padding: "32px 28px", maxWidth: 1100, margin: "0 auto", width: "100%" },
  playerLayout: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: 32,
    alignItems: "start",
  },
  nowPlaying: {
    background: "#111",
    borderRadius: 20,
    padding: 24,
    border: "1px solid #1e1e1e",
    position: "sticky",
    top: 80,
  },
  coverArt: {
    width: "100%",
    aspectRatio: "1",
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    transition: "background 0.8s ease",
    position: "relative",
    overflow: "hidden",
  },
  coverInner: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    textAlign: "center", padding: 16,
    position: "relative", zIndex: 1,
  },
  vinylRing: {
    width: 80, height: 80, borderRadius: "50%",
    border: "3px solid rgba(255,255,255,0.15)",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 16,
    animation: "spin 8s linear infinite",
  },
  coverTitle: { fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 4px 0" },
  coverArtist: { fontSize: 13, color: "rgba(255,255,255,0.6)", margin: 0 },
  progressWrap: {
    marginBottom: 20,
    cursor: "pointer",
    userSelect: "none",
  },
  progressBg: {
    height: 4, background: "#2a2a2a", borderRadius: 4,
    position: "relative", marginBottom: 8,
  },
  progressFill: {
    height: "100%", background: "#fff", borderRadius: 4,
    transition: "width 0.1s linear",
  },
  progressThumb: {
    position: "absolute", top: "50%", transform: "translate(-50%, -50%)",
    width: 12, height: 12, background: "#fff", borderRadius: "50%",
    transition: "left 0.1s linear",
  },
  timeRow: {
    display: "flex", justifyContent: "space-between",
    fontSize: 11, color: "#555",
  },
  controls: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 12, marginBottom: 20,
  },
  iconBtn: {
    background: "none", border: "none", color: "#aaa",
    cursor: "pointer", padding: 8, display: "flex",
    alignItems: "center", borderRadius: 8,
    transition: "color 0.2s",
  },
  playBtn: {
    width: 52, height: 52, borderRadius: "50%",
    background: "#fff", border: "none", color: "#000",
    cursor: "pointer", display: "flex", alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.15s",
  },
  volumeRow: {
    display: "flex", alignItems: "center", gap: 10, color: "#555",
  },
  volumeSlider: {
    flex: 1, accentColor: "#fff", cursor: "pointer",
  },
  trackList: {},
  sectionTitle: {
    fontSize: 18, fontWeight: 700, margin: "0 0 16px 0",
    display: "flex", alignItems: "center", gap: 10,
  },
  trackCount: {
    fontSize: 12, background: "#1e1e1e", color: "#555",
    padding: "2px 8px", borderRadius: 20, fontWeight: 500,
  },
  trackScroll: { display: "flex", flexDirection: "column", gap: 2 },
  trackRow: {
    display: "flex", alignItems: "center", gap: 14,
    padding: "12px 14px", borderRadius: 10, cursor: "pointer",
    transition: "background 0.15s",
    border: "1px solid transparent",
  },
  trackRowActive: {
    background: "#161616", borderColor: "#2a2a2a",
  },
  trackNum: { fontSize: 12, fontWeight: 700, minWidth: 28, textAlign: "center" },
  playingDots: { fontSize: 14 },
  trackInfo: { flex: 1, minWidth: 0 },
  trackTitle: { margin: 0, fontSize: 14, fontWeight: 600, color: "#e8e8e8",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  trackMeta: { margin: "2px 0 0 0", fontSize: 12, color: "#555",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  cachedBadge: {
    fontSize: 11, color: "#2a9d8f", fontWeight: 700,
    background: "#0d2420", padding: "2px 6px", borderRadius: 6,
  },
  loadingText: { color: "#555", fontSize: 14, textAlign: "center", padding: 40 },
  emptyText: { color: "#444", fontSize: 14, textAlign: "center", padding: 60 },
  // Admin
  adminLayout: {},
  uploadCard: {
    background: "#111", border: "1px solid #1e1e1e",
    borderRadius: 16, padding: 24, marginBottom: 8,
  },
  uploadGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: 12, marginBottom: 16,
  },
  input: {
    background: "#1a1a1a", border: "1px solid #2a2a2a",
    borderRadius: 10, color: "#e8e8e8", fontSize: 14,
    padding: "10px 14px", outline: "none",
    fontFamily: "inherit", width: "100%", boxSizing: "border-box",
  },
  fileLabel: {
    display: "flex", alignItems: "center", gap: 8,
    background: "#1a1a1a", border: "1px dashed #333",
    borderRadius: 10, color: "#888", fontSize: 13,
    padding: "10px 14px", cursor: "pointer",
    gridColumn: "1 / -1",
  },
  uploadProgressWrap: {
    height: 6, background: "#1e1e1e", borderRadius: 6,
    marginBottom: 12, position: "relative", overflow: "hidden",
  },
  uploadProgressFill: {
    height: "100%", background: "#2a9d8f",
    borderRadius: 6, transition: "width 0.2s",
  },
  uploadProgressText: {
    position: "absolute", right: 0, top: -18,
    fontSize: 11, color: "#2a9d8f",
  },
  primaryBtn: {
    display: "flex", alignItems: "center", gap: 8,
    background: "#fff", color: "#000", border: "none",
    borderRadius: 10, padding: "10px 20px",
    fontWeight: 700, fontSize: 14, cursor: "pointer",
    fontFamily: "inherit", opacity: 1,
    transition: "opacity 0.2s",
  },
  adminTrackList: { display: "flex", flexDirection: "column", gap: 2 },
  adminTrackRow: {
    display: "flex", alignItems: "center", gap: 14,
    padding: "12px 14px", borderRadius: 10,
    background: "#111", border: "1px solid #1a1a1a",
  },
  adminTrackNum: { fontSize: 12, color: "#444", fontWeight: 700, minWidth: 28 },
  deleteBtn: {
    background: "#1a0a0a", border: "1px solid #2a1515",
    color: "#e07070", borderRadius: 8, cursor: "pointer",
    padding: "6px 8px", display: "flex", alignItems: "center",
    transition: "background 0.2s",
  },
  // Modal
  modalOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, backdropFilter: "blur(4px)",
  },
  modal: {
    background: "#111", border: "1px solid #2a2a2a",
    borderRadius: 20, padding: 32, minWidth: 340,
    display: "flex", flexDirection: "column", gap: 12,
  },
  modalTitle: { margin: "0 0 8px 0", fontSize: 20, fontWeight: 700 },
  errorText: { color: "#e07070", fontSize: 13, margin: 0 },
};
