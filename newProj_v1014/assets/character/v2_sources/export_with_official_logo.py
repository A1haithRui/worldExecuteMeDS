from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json
import numpy as np

S=Path(__file__).parent; P=S.parent
placements=json.loads((S/'logo_placement_v2.json').read_text(encoding='utf-8'))
logo=Image.open(S/'deepseek_official_whale.png').convert('RGBA')
sheet=Image.new('RGB',(1600,1140),'#0B2132')
draw=ImageDraw.Draw(sheet)
font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',24)
draw.text((24,22),'鲸鱼娘 v2 · 已合成官方鲸鱼 Logo · 胸章放大核对',font=font,fill='#E9F7F3')
records={}
for n,(pose,entry) in enumerate(placements.items()):
    base=Image.open(P/entry['base']).convert('RGBA')
    mark=entry['marks']['official']
    resized=logo.resize(tuple(mark['size_px']),Image.Resampling.LANCZOS)
    layer=Image.new('RGBA',base.size)
    layer.alpha_composite(resized,tuple(mark['top_left_px']))
    result=base.copy(); result.alpha_composite(layer)
    filename=f'deepseek_{pose}_v2_with_official_logo.png'
    result.save(P/filename)
    assert np.array_equal(np.asarray(result),np.asarray(Image.open(P/filename)))
    assert result.getchannel('A').getextrema()==(0,255)
    assert np.any(np.asarray(result)!=np.asarray(base))
    records[pose]={'output':filename,'source_png':'v2_sources/deepseek_official_whale.png','base':entry['base'],'placement':mark,'canvas_size':list(result.size)}
    preview=result.copy(); preview.thumbnail((390,710),Image.Resampling.LANCZOS)
    sheet.paste(preview,(n*400+(400-preview.width)//2,95+(710-preview.height)//2),preview)
    draw.text((n*400+28,67),pose,font=font,fill='#23BCD7')
    x,y=mark['top_left_px']; w,h=mark['size_px']
    crop=result.crop((x-32,y-24,x+w+32,y+h+24))
    crop.thumbnail((340,235),Image.Resampling.LANCZOS)
    crop=crop.resize((round(crop.width*min(340/crop.width,235/crop.height)),round(crop.height*min(340/crop.width,235/crop.height))),Image.Resampling.LANCZOS)
    sheet.paste(crop,(n*400+(400-crop.width)//2,825),crop)
draw.text((24,1080),'独立社区二创 · 非官方制作或授权作品',font=font,fill='#D6E5EB')
sheet.save(P/'deepseek_v2_with_official_logo_preview.jpg',quality=95)
(S/'with_official_logo_manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({pose:{'file':v['output'],'size':v['canvas_size'],'logo_position':v['placement']['top_left_px']} for pose,v in records.items()},ensure_ascii=False))
