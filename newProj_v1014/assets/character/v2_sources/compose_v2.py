from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib
P=Path(__file__).parent; ROOT=P.parent
# Generated-image native pixel coordinates. Official whale is uniformly scaled,
# never mirrored, warped or recolored. A frontal rigid brooch remains legible.
SPECS={'bust':{'badge_center':[561,749],'mark_width':88},'profile':{'badge_center':[407,791],'mark_width':76},'reach':{'badge_center':[622,737],'mark_width':88},'eye':{'badge_center':[692,1129],'mark_width':116}}
def compose(pose,spec):
    source=P/f'deepseek_{pose}_v2_cleaned.png'
    if not source.exists(): source=P/f'deepseek_{pose}_v2_generated.png'
    im=Image.open(source).convert('RGBA')
    # Preserve generation alpha; add genuinely transparent safe padding.
    margin=128
    canvas=Image.new('RGBA',(im.width+margin*2,im.height+margin*2))
    canvas.alpha_composite(im,(margin,margin))
    canvas.save(P/f'deepseek_{pose}_v2_base.png')
    records={}
    for name,markfile in [('official','deepseek_official_whale.png'),('original','original_whale.png')]:
        result=canvas.copy(); layer=Image.new('RGBA',canvas.size)
        if spec.get('badge_center'):
            logo=Image.open(P/markfile).convert('RGBA')
            scale=spec['mark_width']/logo.width
            logo=logo.resize((spec['mark_width'],round(logo.height*scale)),Image.Resampling.LANCZOS)
            x=round(spec['badge_center'][0]+margin-logo.width/2); y=round(spec['badge_center'][1]+margin-logo.height/2)
            layer.alpha_composite(logo,(x,y)); result.alpha_composite(layer)
            records[name]={'asset':markfile,'top_left_px':[x,y],'size_px':list(logo.size),'center_normalized':[(x+logo.width/2)/canvas.width,(y+logo.height/2)/canvas.height],'uniform_scale':scale,'rotation_degrees':0,'source_quad':None,'independent_layer':f'v2_sources/deepseek_{pose}_v2_{name}_logo_layer.png'}
            layer.save(P/f'deepseek_{pose}_v2_{name}_logo_layer.png')
        result.save(ROOT/(f'deepseek_{pose}_v2'+('.png' if name=='official' else '_original.png')))
    return {'canvas_size':list(canvas.size),'generated_size':list(im.size),'generation_source':source.name,'safe_padding_px':margin,'base':f'v2_sources/deepseek_{pose}_v2_base.png','marks':records}
if __name__=='__main__':
    result={pose:compose(pose,spec) for pose,spec in SPECS.items()}
    (P/'logo_placement_v2.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
