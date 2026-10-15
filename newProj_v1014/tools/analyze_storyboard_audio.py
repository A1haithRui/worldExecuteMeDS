"""Local PCM/FFT evidence for storyboard v1. No lyric text is exported."""
import hashlib
import json
import wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data' / 'audio-analysis-v1.json'

def analyze():
    path = ROOT / 'audio' / 'song.wav'
    with wave.open(str(path), 'rb') as w:
        sr, channels, width, count = w.getframerate(), w.getnchannels(), w.getsampwidth(), w.getnframes()
        raw = w.readframes(count)
    if width != 2:
        raise ValueError('Expected 16-bit PCM')
    x = np.frombuffer(raw, dtype='<i2').reshape(-1, channels).astype(np.float32).mean(axis=1) / 32768
    taps = np.arange(129)-64
    kernel = 2*5000/sr*np.sinc(2*5000/sr*taps)*np.hanning(129)
    kernel /= kernel.sum()
    x = np.convolve(x,kernel,mode='same')[::4]
    fs = sr / 4
    size, hop = 1024, 110
    frames = np.lib.stride_tricks.sliding_window_view(x, size)[::hop]
    spec = np.abs(np.fft.rfft(frames * np.hanning(size), axis=1))
    t = (np.arange(len(spec)) * hop + size / 2) / fs
    freq = np.fft.rfftfreq(size, 1 / fs)
    bands = {}
    for name, lo, hi in [('low',40,180),('voice_band',300,3400),('wide',40,5000)]:
        s = spec[:, (freq >= lo) & (freq < hi)]
        flux = np.r_[0, np.maximum(np.diff(s, axis=0), 0).mean(axis=1)]
        energy = np.sqrt((s*s).mean(axis=1))
        inds = np.where((flux[1:-1] > flux[:-2]) & (flux[1:-1] >= flux[2:]))[0]+1
        order = inds[np.argsort(flux[inds])[::-1]]
        chosen = []
        for k in order:
            if flux[k] < np.percentile(flux, 65): break
            if all(abs(t[k]-t[j]) >= .09 for j in chosen): chosen.append(int(k))
        bands[name] = {'flux':flux,'energy':energy,'peaks':sorted(chosen)}
    flux = bands['low']['flux']
    mask = ((t>20)&(t<74))|((t>104)&(t<118))|((t>148)&(t<192))
    z = np.minimum(flux, np.percentile(flux,98))*mask
    tempos = np.arange(120,141,.01)
    scores = []
    for bpm in tempos:
        lag = round(60/bpm*fs/hop)
        scores.append(float(np.dot(z[lag:],z[:-lag])))
    best = float(tempos[np.argmax(scores)])
    best_lag = round(60/best*fs/hop)
    plateau = [float(tempos[k]) for k,v in enumerate(scores) if abs(v-max(scores))<1e-9]
    coherent = [abs(np.sum(z*np.exp(-2j*np.pi*t*bpm/60))) for bpm in tempos]
    coherent_best = float(tempos[np.argmax(coherent)])
    # A grid prior from reference is tested against local low-band attacks.
    period = 60/130
    phases = np.arange(0,period,.001)
    phase_scores = []
    for phase in phases:
        dist = np.abs((t-phase+period/2)%period-period/2)
        phase_scores.append(float(np.sum(z*np.exp(-.5*(dist/.025)**2))))
    phase = float(phases[np.argmax(phase_scores)])
    ranges = [(0,15),(15,29.709),(29.709,44.452),(44.452,59.223),(59.223,74.045),(74.045,88.587),(88.587,103.489),(103.489,110.9),(110.9,125.708),(125.708,135.224),(135.224,147.66),(147.66,158.9),(158.9,162.632),(162.632,177.246),(177.246,192.344),(192.344,195.356),(195.356,205.811),(205.811,207.5),(207.5,count/sr)]
    rms=[]
    for a,b in ranges:
        v=x[int(a*fs):int(b*fs)]
        rms.append({'start':a,'end':round(b,6),'rms_dbfs':round(float(20*np.log10(np.sqrt(np.mean(v*v))+1e-12)),2)})
    blocks = x[:len(x)//int(fs*.02)*int(fs*.02)].reshape(-1,int(fs*.02))
    blockdb=20*np.log10(np.sqrt(np.mean(blocks*blocks,axis=1))+1e-12)
    tail={str(th):round(float((np.where(blockdb>th)[0][-1]+1)*len(blocks[0])/fs),4) for th in [-40,-50,-60]}
    result={'schema_version':1,'audio':{'path':'audio/song.wav','sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'sample_rate':sr,'channels':channels,'sample_width_bytes':width,'frames':count,'duration':count/sr},'method':{'algorithm':'numpy FFT positive spectral flux; mono 129-tap Hann-windowed sinc lowpass 5kHz then decimated by 4; 1024 Hann window, 110 hop; band peaks >= global p65, 90ms suppression','limitations':'Mixture only; voice_band is not separated vocals. Peaks are candidates, not phoneme or perceptual beat confirmation. Hop ~10ms, window ~93ms; inspect +/-80ms. No listening approval performed.','tempo_autocorrelation_search_bpm':[120,141],'tempo_best_quantized_bpm':round(best,2),'tempo_lag_resolution_warning':'Integer lag gives BPM plateaus; do not interpret hundredths as accuracy.','grid_test_bpm':130,'grid_phase_best_seconds':round(phase,3),'reference_phase_seconds':.344},'segments':rms,'tail_last_above_dbfs_seconds':tail,'peaks':{name:[{'time':round(float(t[k]),4),'strength':round(float(b['flux'][k]/(np.percentile(b['flux'],95)+1e-12)),3)} for k in b['peaks']] for name,b in bands.items()}}
    result['method']['tempo_best_lag_frames']=best_lag
    result['method']['tempo_autocorrelation_plateau_bpm']=[round(min(plateau),2),round(max(plateau),2)]
    result['method']['tempo_coherent_flux_bpm']=round(coherent_best,2)
    result['method']['tempo_coherent_flux_note']='Best complex phase-coherence magnitude over 120–141 BPM, 0.01 step, on stable-region low-band flux. Numerical estimate, not listening approval.'
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k!='peaks'},ensure_ascii=False,indent=2))

if __name__ == '__main__': analyze()
