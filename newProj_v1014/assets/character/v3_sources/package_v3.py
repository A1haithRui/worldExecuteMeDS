from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib
import numpy as np

S=Path(__file__).parent; P=S.parent
# Fill after visual inspection: native-generation pixel bounds of the hair clip.
DETAILS={'bust':[625,210,870,400],'profile':[410,210,650,400],'reach':[640,190,860,380],'eye':[890,295,1170,530]}
def run():
    poses=['bust','profile','reach','eye']; report=[]
    font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',23)
    sheet=Image.new('RGB',(1600,1120),'#0A2032'); draw=ImageDraw.Draw(sheet)
    draw.text((24,22),'鲸鱼娘 v3 · 海沫白鲸鱼立体发饰',font=font,fill='#E6F5F1')
    detail=Image.new('RGB',(1600,600),'#0A2032'); dd=ImageDraw.Draw(detail)
    dd.text((24,22),'v3 发饰近景 · 配色 / 厚度 / 透视 / 发束遮挡',font=font,fill='#E6F5F1')
    for n,pose in enumerate(poses):
        source=S/f'deepseek_{pose}_v3_refined.png'
        if not source.exists(): source=S/f'deepseek_{pose}_v3_generated.png'
        raw=Image.open(source)
        assert raw.mode=='RGBA',f'No true alpha: {source}'
        im=raw.convert('RGBA'); margin=128
        result=Image.new('RGBA',(im.width+2*margin,im.height+2*margin))
        result.alpha_composite(im,(margin,margin))
        destination=P/f'deepseek_{pose}_v3.png'; result.save(destination)
        a=np.asarray(result.getchannel('A')); box=result.getchannel('A').getbbox()
        gaps=[box[0],box[1],result.width-box[2],result.height-box[3]]
        entry={'file':destination.name,'source':source.name,'size':list(result.size),'mode':result.mode,'alpha_extrema':[int(a.min()),int(a.max())],'transparent_pixels':int((a==0).sum()),'safety_margin_px':gaps,'passed_alpha_and_margin':bool(min(gaps)>=128 and a.min()==0),'headpiece_detail_native_bbox':DETAILS.get(pose)}
        assert entry['passed_alpha_and_margin']
        report.append(entry)
        thumb=result.copy(); thumb.thumbnail((390,760),Image.Resampling.LANCZOS)
        sheet.paste(thumb,(n*400+(400-thumb.width)//2,100+(760-thumb.height)//2),thumb)
        draw.text((n*400+24,72),pose,font=font,fill='#21BBD6')
        draw.text((n*400+24,900),f'{result.width} × {result.height} / RGBA',font=font,fill='#D4E8EB')
        if pose in DETAILS:
            crop=im.crop(tuple(DETAILS[pose])); crop.thumbnail((360,400),Image.Resampling.LANCZOS)
            ratio=min(360/crop.width,400/crop.height)
            crop=crop.resize((round(crop.width*ratio),round(crop.height*ratio)),Image.Resampling.LANCZOS)
            detail.paste(crop,(n*400+(400-crop.width)//2,125),crop)
            dd.text((n*400+24,82),pose,font=font,fill='#21BBD6')
    draw.text((24,1015),'独立社区二创 · 鲸鱼头饰为配色与立体造型改编 · 非官方制作或授权',font=font,fill='#D4E8EB')
    sheet.save(P/'deepseek_v3_contact_sheet.jpg',quality=95)
    detail.save(P/'deepseek_v3_headpiece_details.jpg',quality=95)
    (S/'qa_report_v3.json').write_text(json.dumps({'tool':'built-in image_gen','headpiece':'Generated within each character image, with pose-dependent perspective and cel-shaded thickness; not a pixel-exact official vector layer.','padding_only':'128px transparent padding; generated alpha and all subject pixels preserved.','assets':report},ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False))
if __name__=='__main__': run()
