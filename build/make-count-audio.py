"""Regenerate the count recordings (一二三四 / one-two-three-four) with Kokoro-82M (Apache-2.0).

Setup (outside the repo):
  python3 -m venv kvenv && kvenv/bin/pip install kokoro-onnx soundfile "misaki[zh]"
  curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
  curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
Run from that folder: kvenv/bin/python /path/to/build/make-count-audio.py /path/to/public/audio
Needs ffmpeg. Output: 16 kHz mono 16-bit, 4 s, one count at the start of each second.
"""
import subprocess, sys, wave
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

out = sys.argv[1]
kokoro = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")

def to16k(audio, rate, name):
    sf.write(name + ".24k.wav", audio, rate)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", name + ".24k.wav", "-ar", "16000", "-ac", "1", name + ".16k.wav"], check=True)
    return sf.read(name + ".16k.wav", dtype="float32")[0]

def voiced_runs(a, count, win=160):
    """Split speech into `count` runs on silence; split the longest run at its quietest point if needed."""
    env = np.array([np.sqrt(np.mean(a[i:i + win] ** 2)) for i in range(0, len(a) - win, win)])
    voiced, runs, i = env > env.max() * .05, [], 0
    while i < len(voiced):
        if voiced[i]:
            j = i
            while j < len(voiced) and voiced[j:j + 4].any(): j += 1
            if j - i > 10: runs.append([i, j])
            i = j
        else: i += 1
    while len(runs) < count:
        k = max(range(len(runs)), key=lambda n: runs[n][1] - runs[n][0]); x, y = runs[k]; lo, hi = x + (y - x) // 5, y - (y - x) // 5
        cut = lo + int(np.argmin(env[lo:hi])); runs[k:k + 1] = [[x, cut], [cut, y]]
    return [(x * win, y * win) for x, y in runs[:count]]

def place(clips, path):
    """One clip per beat, 50 ms in, the same peak level, short fades so nothing clicks."""
    buf = np.zeros(64000, np.float32)
    for beat, d in enumerate(clips):
        d = d.copy() * (12000 / 32768) / np.abs(d).max(); fade = min(480, len(d) // 3)
        d[-fade:] *= np.linspace(1, 0, fade); d[:80] *= np.linspace(0, 1, 80); d = d[:16000 - 1200]
        buf[beat * 16000 + 800: beat * 16000 + 800 + len(d)] = d
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(16000); w.writeframes((buf * 32767).astype("<i2").tobytes())

# Chinese reads more naturally as one phrase, then cut into syllables.
zh = to16k(*kokoro.create("i→. ɚ↘. sa→n. sɨ↘.", voice="zf_xiaoxiao", speed=.9, is_phonemes=True), "zh")
place([zh[max(0, x - 80): y + 320] for x, y in voiced_runs(zh, 4)], out + "/count-cycle.wav")
# English words are clean on their own (phonemes given directly, so no espeak is needed).
english = []
for i, ph in enumerate(["wˈʌn.", "tˈu.", "θɹˈi.", "fˈɔɹ."]):
    a = to16k(*kokoro.create(ph, voice="af_heart", speed=1.0, is_phonemes=True), "en%d" % i)
    (x, y), = voiced_runs(a, 1); english.append(a[max(0, x - 80): y + 320])
place(english, out + "/count-cycle-en.wav")
