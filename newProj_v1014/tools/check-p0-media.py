"""Check the actual encoded file: decode, count, compare audio, inspect luminance.

Requires NumPy. Outputs remain under ignored out/, never include lyric text.
"""
import argparse
import json
import re
import subprocess
import wave
from pathlib import Path
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--ffmpeg',default=str(ROOT.parent/'world-execute-me-lyric-mv/node_modules/ffmpeg-static/ffmpeg.exe'))
parser.add_argument('--video',default=str(ROOT/'out/p0-polished-59.223-74.045-1080p60.mp4'))
parser.add_argument('--folder',default=str(ROOT/'out/p0-polish'))
parser.add_argument('--times',default=None,help='Absolute song seconds to extract')
args=parser.parse_args()
folder=Path(args.folder)
manifest=json.loads((folder/'export-manifest.json').read_text())
def run(cmd):
    return subprocess.run([args.ffmpeg,'-hide_banner',*cmd],capture_output=True,check=True)

count=run(['-i',args.video,'-map','0:v:0','-an','-progress','pipe:1','-f','null','-'])
info=count.stderr.decode(errors='replace')
frames=int(re.findall(r'frame=(\d+)',count.stdout.decode())[-1])
assert frames==manifest['frames'],(frames,manifest['frames'])
assert '1920x1080' in info and '60 fps' in info and 'yuv420p' in info
assert 'Audio: aac' in info and '44100 Hz' in info and 'Video: h264' in info
pcm=run(['-loglevel','error','-i',args.video,'-map','0:a:0','-ac','1','-ar','44100','-f','f32le','-'])
decoded=np.frombuffer(pcm.stdout,dtype='<f4')
with wave.open(str(ROOT/'audio/song.wav'),'rb') as w:
    assert w.getframerate()==44100 and w.getsampwidth()==2
    w.setpos(manifest['audioStartSample'])
    original=np.frombuffer(w.readframes(manifest['audioSamples']),dtype='<i2').reshape(-1,w.getnchannels()).astype(np.float64).mean(axis=1)/32768
windows=[]
duration=manifest['audioDuration']
checks=[.15,duration/2,duration-1.2]
join=74.045-manifest['start']
if 1<join<duration-1.5: checks.extend([join-1.1,join-.5,join+.1])
for start in checks:
    i=round(start*44100);n=44100
    a=original[i:i+n];b=decoded[i:i+n]
    fftn=1<<(2*n-1).bit_length()
    corr=np.fft.irfft(np.fft.rfft(b,fftn)*np.conj(np.fft.rfft(a,fftn)),fftn)
    lags=np.arange(-2205,2206)
    lag=int(lags[np.argmax(corr[lags%fftn])])
    if lag>=0: aa,bb=a[:n-lag],b[lag:]
    else: aa,bb=a[-lag:],b[:n+lag]
    r=float(np.corrcoef(aa,bb)[0,1])
    windows.append({'video_time':start,'offset_samples':lag,'offset_ms':1000*lag/44100,'correlation':r})
assert all(abs(w['offset_samples'])<=2 and w['correlation']>.97 for w in windows),windows
small=run(['-loglevel','error','-i',args.video,'-an','-vf','scale=96:54','-f','rawvideo','-pix_fmt','rgb24','-'])
rgb=np.frombuffer(small.stdout,dtype=np.uint8).reshape(-1,54,96,3).astype(np.float32)/255
means=(rgb@np.array([.2126,.7152,.0722],dtype=np.float32)).mean(axis=(1,2))
steps=np.diff(means)
large=np.flatnonzero(np.abs(steps)>.10)
# PNGs extracted from the actual H.264, not only the renderer output.
times=[float(t) for t in args.times.split(',')] if args.times else ([60.1,64,67.1,68.3,68.8,72,74.028] if manifest['end']<75 else [75.1,78.9,82.65,83.5,87.922,89.6,91.4,94.93])
for song_time in times:
    video_time=song_time-manifest['start']
    run(['-loglevel','error','-ss',f'{video_time:.6f}','-i',args.video,'-frames:v','1','-y',str(folder/f'decoded-{song_time:.3f}.png')])
report={'video':args.video,'frames':frames,'format_assertions':{'h264':True,'size':'1920x1080','fps':60,'pixel_format':'yuv420p','audio':'AAC stereo 44.1kHz'},'nominal_video_seconds':frames/60,'source_audio_samples':len(original),'decoded_audio_samples':len(decoded),'audio_windows':windows,'audio_note':'Offsets compare decoded AAC mono waveform with the sample-trimmed original WAV. They verify mux synchronization, not the artistic placement of cues; AAC decoding may expose final padding samples.','luminance':{'method':'Actual MP4 decoded to 96x54 RGB, Rec.709 weighted code-value mean. This is a coarse global check, not a certified flash assessment.','min_mean':float(means.min()),'max_mean':float(means.max()),'max_adjacent_mean_change':float(np.abs(steps).max()),'adjacent_mean_changes_above_0_1':len(large)},'ffmpeg_media_info':info,'manual_listening':'not_performed_pending_user_review'}
(folder/'media-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='ffmpeg_media_info'},ensure_ascii=False,indent=2))
