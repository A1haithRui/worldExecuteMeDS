"""Local affine study of the existing side fins; no generated character art.

Manual triangles were selected after inspecting the actual v3 image. A whole-fin
affine transform fixes both root vertices; face and accessory are not warped.
"""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'out/p1-polish/fin-study'
OUT.mkdir(parents=True,exist_ok=True)
src=ROOT/'assets/character/deepseek_bust_v3.png'
im=Image.open(src).convert('RGBA')
fins=[
    {'name':'left','polygon':[(288,620),(331,603),(384,573),(417,556),(439,570),(455,615),(436,642),(406,656),(357,655),(319,641)],'root_a':[438,570],'root_b':[452,624],'tip':[288,620],'new_tip':[332,475]},
    {'name':'right','polygon':[(887,544),(909,530),(930,546),(967,565),(1018,579),(1056,592),(1022,613),(976,638),(931,640),(898,612)],'root_a':[897,548],'root_b':[903,620],'tip':[1056,592],'new_tip':[1040,460]},
]
mask=Image.new('L',im.size)
layers={}
for f in fins:
    m=Image.new('L',im.size);ImageDraw.Draw(m).polygon(f['polygon'],fill=255)
    alpha=ImageChops.multiply(im.getchannel('A'),m)
    cut=im.copy();cut.putalpha(alpha)
    a,b,c=f['root_a'],f['root_b'],f['tip']
    source=np.array([[*a,1],[*b,1],[*c,1]],float)
    dest=np.array([a,b,f['new_tip']],float)
    forward=np.linalg.solve(source,dest).T
    matrix=np.vstack([forward,[0,0,1]])
    inverse=np.linalg.inv(matrix)
    warped=cut.transform(im.size,Image.Transform.AFFINE,tuple(inverse[:2].flatten()),Image.Resampling.BICUBIC)
    # Original headpiece/hair must occlude any fin moved behind it.
    protection=Image.new('L',im.size);ImageDraw.Draw(protection).rectangle([753,338,998,528],fill=255)
    warped.putalpha(ImageChops.subtract(warped.getchannel('A'),protection))
    cut.save(OUT/f'fin-{f["name"]}-original.png');warped.save(OUT/f'fin-{f["name"]}-pointed.png')
    layers[f['name']]=warped
    mask=ImageChops.lighter(mask,alpha)
    f['forward_affine']=forward.tolist()
base=im.copy();base.putalpha(ImageChops.subtract(im.getchannel('A'),mask));base.save(OUT/'bust-fin-base.png')
mask.save(OUT/'fin-removal-mask.png')
comp=base.copy()
for layer in layers.values():comp=Image.alpha_composite(comp,layer)
comp.save(OUT/'bust-pointed-study.png')
metadata={'source':'../deepseek_bust_v3.png','source_sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'canvas':list(im.size),'coordinate_system':'source pixel x right y down; manual anchors are visual estimates, not skeletal joints','method':'extract manual polygon intersect actual Alpha; triangle affine fixes two root vertices; face and hair untouched outside local polygons; headpiece ROI protected','status':'local_motion_study_requires_frame_review','image_generation_used':False,'fins':fins,'source_landmarks':{'eye':[596,526],'headpiece':[875,430],'neck_knot':[686,827]},'existing_source_hashes':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'assets/character').rglob('*.png') if 'p1-derived' not in p.parts},'alpha_outputs':{p.name:Image.open(p).getextrema()[-1] for p in OUT.glob('*.png') if p.name!='fin-removal-mask.png'}}
(OUT/'provenance.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
# Local QA background is never packaged as a transparent production asset.
qa=Image.new('RGB',(1342*2,1704),'#06131f');qa.paste(im,(0,0),im);qa.paste(comp,(1342,0),comp)
folder=ROOT/'out/p1-polish';folder.mkdir(parents=True,exist_ok=True);qa.save(folder/'fin-study-review.jpg')
print('Created transparent local fin study and provenance; original files unchanged.')
