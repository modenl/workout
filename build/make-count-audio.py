"""Regenerate the count recordings (一二三四 / one-two-three-four) on a CosyVoice 3 server.

Model: Fun-CosyVoice3-0.5B-2512 (Apache-2.0). Voice: "demo_female", the demo speaker shipped with
CosyVoice. The server is the LAN one (POST /tts -> a 24 kHz mono WAV file); set COSYVOICE_URL to use
another. Requests go through /usr/bin/curl because macOS local-network privacy can block other
programs from LAN hosts. Needs numpy, soundfile and ffmpeg.
Run: python3 build/make-count-audio.py public/audio
Output: 16 kHz mono 16-bit, 4 s, one count at the start of each second.
"""
import itertools, json, os, subprocess, sys, tempfile, wave
import numpy as np, soundfile as sf

URL = os.environ.get("COSYVOICE_URL", "http://192.168.86.249:8080")
VOICE = "demo_female"
# Each count is spoken on its own, so every word is complete and nothing is cut out of a phrase. A single
# word comes out differently each time: sometimes drawn out, sometimes rising like a question. So each word
# is spoken TAKES times and the takes are chosen by their pitch contour (see contour()). Chinese words are
# written as CosyVoice pinyin tags so each gets its tone; this gave far more properly falling 二 and 四.
# English uses a plain-statement instruction, which made the words fall naturally; for Chinese it did not help.
TAKES = 10
CALM = "Say this number plainly and calmly, as a statement, not a question or an exclamation."
# (text, tone shape, instruction): "level" keeps end/start pitch within 0.85-1.04, "fall" within 0.5-0.95.
WORDS = {
    "count-cycle.wav": [("[y][ī]。", "level", None), ("[èr]。", "fall", None), ("[s][ān]。", "level", None), ("[s][ì]。", "fall", None)],
    "count-cycle-en.wav": [(w, "fall", CALM) for w in ("One.", "Two.", "Three.", "Four.")],
}
SHAPES = {"level": (.85, 1.04), "fall": (.5, .95)}
TARGET = .28  # seconds of voice: a crisp count

def speak(text, tmp, instructions=None):
    req, reply, wav16 = (os.path.join(tmp, n) for n in ("req.json", "reply.wav", "out.wav"))
    with open(req, "w") as f:
        body = {"text": text, "voice": VOICE, "speed": 1.0}
        if instructions: body.update(mode="instruct", instructions=instructions)
        json.dump(body, f, ensure_ascii=False)
    # The server sometimes answers 500 to a very short line; asking again works.
    for attempt in range(4):
        r = subprocess.run(["/usr/bin/curl", "-sS", "--fail-with-body", "-m", "300", "-H", "content-type: application/json",
                            "--data-binary", "@" + req, "-o", reply, URL + "/tts"])
        if r.returncode == 0: break
    else: raise SystemExit("CosyVoice server kept failing on: " + text)
    # The reply is a whole WAV file (header and a LIST chunk included); read as raw PCM, its header was a click.
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", reply, "-ar", "16000", "-ac", "1", wav16], check=True)
    return sf.read(wav16, dtype="float32")[0]

def trim(a, win=160):
    """The voiced part of one spoken word, with 10 ms before and 20 ms after."""
    env = np.array([np.sqrt(np.mean(a[i:i + win] ** 2)) for i in range(0, len(a) - win, win)])
    v = np.nonzero(env > env.max() * .1)[0]
    if not len(v): raise SystemExit("no voice in a reply")
    return a[max(0, v[0] * win - 160): (v[-1] + 1) * win + 320]

def contour(a, sr=16000):
    """Voiced length (s) and pitch (Hz) at the start and the end, by autocorrelation every 10 ms."""
    w, hop = int(.04 * sr), int(.01 * sr); starts = range(0, len(a) - w, hop)
    env = np.array([np.sqrt(np.mean(a[i:i + w] ** 2)) for i in starts]); on = env > env.max() * .15; f0 = []
    for k, i in enumerate(starts):
        if not on[k]: continue
        x = a[i:i + w] - a[i:i + w].mean(); c = np.correlate(x, x, "full")[w - 1:]; lo, hi = sr // 400, sr // 75
        lag = lo + int(np.argmax(c[lo:hi])); f0.append(sr / lag if c[lag] > .3 * c[0] else np.nan)
    v = np.array(f0); v = v[~np.isnan(v)]
    if len(v) < 4: return None
    n = max(2, len(v) // 3)
    return on.sum() * hop / sr, float(np.median(v[:n])), float(np.median(v[-n:]))

def choose(takes):
    """takes[word] = [(reply, shape)], measured untrimmed (a cut-off tail misreads the last pitch): of the takes with the right tone shape, the set of four whose
    starting pitches agree best (one steady voice) and whose lengths are closest to TARGET."""
    ok = []
    for word in takes:
        good = []
        for clip, shape in word:
            c = contour(clip); lo, hi = SHAPES[shape]
            if c and .15 <= c[0] <= .45 and lo <= c[2] / c[1] <= hi: good.append((clip, c))
        if not good: raise SystemExit("no take had a steady tone; run again")
        ok.append(good)
    best = min(itertools.product(*ok), key=lambda set4: np.ptp([np.log(c[1]) for _, c in set4]) * 4 + sum(abs(c[0] - TARGET) for _, c in set4))
    return [trim(clip) for clip, _ in best]

def place(clips, path):
    """One count per beat, 50 ms in, the same peak level, a 20 ms fade in so no word starts with a pop."""
    buf = np.zeros(64000, np.float32)
    for beat, d in enumerate(clips):
        d = d.copy() * (12000 / 32768) / np.abs(d).max(); fade = min(480, len(d) // 3)
        d[-fade:] *= np.linspace(1, 0, fade); d[:320] *= np.sin(np.linspace(0, np.pi / 2, 320)) ** 2; d = d[:16000 - 1200]
        buf[beat * 16000 + 800: beat * 16000 + 800 + len(d)] = d
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(16000); w.writeframes((buf * 32767).astype("<i2").tobytes())

with tempfile.TemporaryDirectory() as tmp:
    for name, words in WORDS.items():
        takes = [[(speak(text, tmp, instr), shape) for _ in range(TAKES)] for text, shape, instr in words]
        place(choose(takes), os.path.join(sys.argv[1], name))
        print("wrote", name)
