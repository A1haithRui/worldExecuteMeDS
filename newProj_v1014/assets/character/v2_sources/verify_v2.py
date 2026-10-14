from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,xml.etree.ElementTree as ET
import numpy as np
P=Path(__file__).parent; ROOT=P.parent
placement=json.loads((P/'logo_placement_v2.json').read_text(encoding='utf-8'))
checks=[]
for pose,spec in placement.items():
    for suffix in ['', '_original']:
        f=ROOT/f'deepseek_{pose}_v2{suffix}.png'; im=Image.open(f); a=np.asarray(im.getchannel('A'))
        box=im.getchannel('A').getbbox(); borders=[int(a[0].max()),int(a[-1].max()),int(a[:,0].max()),int(a[:,-1].max())]
        gaps=[box[0],box[1],im.width-box[2],im.height-box[3]]
        checks.append({'file':f.name,'size':list(im.size),'mode':im.mode,'alpha_range':[int(a.min()),int(a.max())],'transparent_pixels':int((a==0).sum()),'partial_alpha_pixels':int(((a>0)&(a<255)).sum()),'bbox':list(box),'edge_max_alpha':borders,'safety_margin_px':gaps,'passed_alpha_and_margin':im.mode=='RGBA' and min(gaps)>=128 and max(borders)==0})
        base=Image.open(P/f'deepseek_{pose}_v2_base.png').convert('RGBA')
        key='official' if suffix=='' else 'original'
        layer=Image.open(P/f'deepseek_{pose}_v2_{key}_logo_layer.png').convert('RGBA')
        base.alpha_composite(layer)
        assert np.array_equal(np.asarray(base),np.asarray(im)),f'Layer mismatch {f}'
ns={'s':'http://www.w3.org/2000/svg'}
original=list(ET.parse(P/'deepseek_official_original.svg').getroot())[-1]
extracted=ET.parse(P/'deepseek_official_whale.svg').getroot().find('s:path',ns)
assert original.attrib==extracted.attrib
report={'official_svg_path_and_attributes_identical':True,'independent_logo_layer_rebuild_pixel_exact':True,'checks':checks,'limitations':['Generated character body remains a single layer; anatomical rigging and hidden-parts reconstruction are not included.','Fine hair edge antialiasing and a few inherited cyan fringe pixels remain; inspect on MV background.','Posture-dependent clothing folds and hair lock shapes are not exact mechanical turnarounds.']}
(P/'qa_report_v2.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
fontpath='C:/Windows/Fonts/msyh.ttc'
font=ImageFont.truetype(fontpath,22); small=ImageFont.truetype(fontpath,17)
sheet=Image.new('RGB',(1600,1060),'#071728'); draw=ImageDraw.Draw(sheet)
draw.text((32,20),'鲸鱼娘 v2 · 深海领航 / 官方标识设计预览',font=font,fill='#E7F6F1')
for n,pose in enumerate(placement):
    im=Image.open(ROOT/f'deepseek_{pose}_v2.png').convert('RGBA'); im.thumbnail((380,790),Image.Resampling.LANCZOS)
    x=n*400+(400-im.width)//2; y=100+(790-im.height)//2
    sheet.paste(im,(x,y),im); draw.text((n*400+24,70),pose,font=font,fill='#20C2DF')
    draw.text((n*400+24,900),str(placement[pose]['canvas_size']),font=small,fill='#D2EAE6')
draw.text((32,975),'独立社区二创 · 非官方作品 · 官方标识公开使用许可尚需确认',font=font,fill='#C4D8DF')
sheet.save(ROOT/'deepseek_v2_contact_sheet.jpg',quality=95)
details=Image.new('RGB',(1600,650),'#E9EEF0'); d=ImageDraw.Draw(details)
d.text((24,16),'胸口标识 · 官方原色 / 原创替代 / 明暗背景边缘检查',font=font,fill='#103449')
for n,(pose,spec) in enumerate(placement.items()):
    cx,cy=spec['marks']['official']['top_left_px']; w,h=spec['marks']['official']['size_px']
    for row,suffix in enumerate(['','_original']):
        im=Image.open(ROOT/f'deepseek_{pose}_v2{suffix}.png').convert('RGBA')
        crop=im.crop((cx-35,cy-30,cx+w+35,cy+h+30)); crop.thumbnail((340,220),Image.Resampling.LANCZOS)
        x=n*400+30; y=100+row*260
        details.paste(crop,(x,y),crop)
        d.text((x,y-30),pose+(' / official' if row==0 else ' / original'),font=small,fill='#103449')
details.save(ROOT/'deepseek_v2_logo_details.jpg',quality=95)
print(json.dumps(report,ensure_ascii=False,indent=2))
