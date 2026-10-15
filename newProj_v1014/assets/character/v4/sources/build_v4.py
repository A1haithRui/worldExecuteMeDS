from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
import json, hashlib, shutil

V4=Path(__file__).resolve().parent.parent
CHAR=V4.parent
SOURCE=V4/'sources'
META=V4/'metadata'
PREVIEW=V4/'previews'
POSES=['bust','profile','reach','eye']

def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def save_json(p,obj): p.write_text(json.dumps(obj,ensure_ascii=False,indent=2),encoding='utf-8')

def hand_mask(im):
    # Source-space ROI isolates the reaching hand, not the chest-side hand.
    box=(100,900,700,1480)
    rgb=np.asarray(im.crop(box))[:,:,:3].astype(np.int16)
    pale=(rgb[:,:,0]>150)&(rgb[:,:,1]>180)&(rgb[:,:,2]>180)&((rgb.max(axis=2)-rgb.min(axis=2))<80)
    component=Image.fromarray((pale*255).astype('uint8')).copy()
    seed=(440-box[0],1100-box[1])
    assert component.getpixel(seed)==255,'Hand seed must lie on pale skin'
    ImageDraw.floodfill(component,seed,128,thresh=0)
    connected=np.asarray(component)==128
    assert int(connected.sum())>35000,'Unexpected hand component size'
    exterior=Image.fromarray((~connected*255).astype('uint8')).copy()
    ImageDraw.floodfill(exterior,(0,0),128,thresh=0)
    filled=np.asarray(exterior)!=128
    # Restore enclosed navy palm-crease shapes from the original pixels.
    # Subpixel matte feathering avoids importing navy hair/cuff edge pixels.
    # Source RGB is retained; only the extraction alpha is softened.
    matte=Image.fromarray((filled*255).astype('uint8')).filter(ImageFilter.GaussianBlur(.6))
    full=Image.new('L',im.size); full.paste(matte,box[:2])
    full.save(SOURCE/'reach_hand_mask_v4.png')
    return full,box,seed,int(connected.sum())

def put_rgba(path,rgb,alpha):
    out=Image.fromarray(np.dstack((rgb,alpha)).astype('uint8'),'RGBA')
    out.save(path); return out

def build():
    for d in [SOURCE,META,PREVIEW]: d.mkdir(parents=True,exist_ok=True)
    provenance={}
    for pose in POSES:
        original=CHAR/f'deepseek_{pose}_v3.png'
        snapshot=SOURCE/original.name
        if not snapshot.exists(): shutil.copy2(original,snapshot)
        assert digest(original)==digest(snapshot),'V3 changed since snapshot; review before rebuilding'
        provenance[pose]={'original':original.as_posix(),'snapshot':f'sources/{snapshot.name}','sha256':digest(original),'size':list(Image.open(original).size)}
    prior_prompts=CHAR/'v3_sources'/'imagegen_prompts_v3.json'
    if prior_prompts.exists(): shutil.copy2(prior_prompts,SOURCE/'v3_imagegen_prompts_reference.json')
    bust=Image.open(SOURCE/'deepseek_bust_v3.png').convert('RGBA'); ba=np.asarray(bust)
    rgb=ba[:,:,:3].astype('float32'); alpha=ba[:,:,3]
    luma=(rgb@np.array([.2126,.7152,.0722],dtype='float32'))/255
    low=np.array([4,15,25]); high=np.array([24,49,63])
    remapped=np.rint(low+(high-low)*luma[:,:,None])
    put_rgba(V4/'deepseek_bust_v4_lowlight.png',remapped,alpha)
    solid=np.zeros_like(rgb)+np.array([23,55,73])
    put_rgba(V4/'deepseek_bust_v4_silhouette.png',solid,alpha)

    reach=Image.open(SOURCE/'deepseek_reach_v3.png').convert('RGBA'); ra=np.asarray(reach)
    matte,roi,seed,count=hand_mask(reach)
    m=np.asarray(matte).astype('float64')/255
    original_a=ra[:,:,3].astype('float64')/255
    hand_a=np.rint(original_a*m*255).astype('uint8')
    hand=put_rgba(V4/'deepseek_reach_v4_hand_layer.png',ra[:,:,:3],hand_a)
    # Solve alpha-over so hand + body reconstructs the source even at soft edges.
    ah=hand_a.astype('float64')/255
    remaining=np.divide(original_a-ah,1-ah,out=np.zeros_like(ah),where=(1-ah)>1e-8)
    remaining_a=np.rint(np.clip(remaining,0,1)*255).astype('uint8')
    body=put_rgba(V4/'deepseek_reach_v4_body_layer.png',ra[:,:,:3],remaining_a)
    bbox=hand.getchannel('A').getbbox()
    cut=hand.crop(bbox); margin=128
    closeup=Image.new('RGBA',(cut.width+2*margin,cut.height+2*margin))
    closeup.alpha_composite(cut,(margin,margin))
    closeup.save(V4/'deepseek_palm_v4_closeup_native.png')
    reconstruction=Image.alpha_composite(body,hand)
    dif=np.abs(np.asarray(reconstruction).astype('int16')-ra.astype('int16'))
    # Compare rendered contribution: RGB under zero alpha has no visible meaning.
    premul=lambda a: a[:,:,:3].astype('float64')*a[:,:,3:4].astype('float64')/255
    premul_error=float(np.abs(premul(np.asarray(reconstruction))-premul(ra)).max())
    reconstruction.save(PREVIEW/'reach_layer_reconstruction.png')
    checks=[]
    for f in sorted(V4.glob('*.png')):
        i=Image.open(f); a=np.asarray(i.getchannel('A')); b=i.getchannel('A').getbbox()
        gaps=[b[0],b[1],i.width-b[2],i.height-b[3]]
        checks.append({'file':f.name,'size':list(i.size),'mode':i.mode,'alpha_extrema':[int(a.min()),int(a.max())],'content_bbox':list(b),'transparent_margins_px':gaps,'passed':bool(i.mode=='RGBA' and a.min()==0 and min(gaps)>=128)})
    assert all(x['passed'] for x in checks)
    assert premul_error<=1.1
    assert np.array_equal(np.asarray(Image.open(V4/'deepseek_bust_v4_lowlight.png'))[:,:,3],alpha)
    assert np.array_equal(np.asarray(Image.open(V4/'deepseek_bust_v4_silhouette.png'))[:,:,3],alpha)
    assert all(digest(CHAR/f'deepseek_{p}_v3.png')==provenance[p]['sha256'] for p in POSES)
    save_json(META/'source_provenance.json',provenance)
    save_json(META/'operations.json',{'image_generation_used':False,'generation_prompts':[],'reason':'Existing v3 supports silhouette/lowlight recoloring and the original open-hand pose; no confirmed new pose or extreme magnification requires redraw yet.','recipe':{'lowlight':'sRGB weighted luma 0.2126 R + 0.7152 G + 0.0722 B; map 0..255 to #040F19..#18313F; preserve alpha','silhouette':'Uniform #173749; preserve alpha','hand':'Pale-skin connected component in source ROI; fill closed crease holes, 0.6px alpha feather, copy original RGB. Body is complementary alpha-over layer.','native_closeup':'Crop isolated hand bbox and add 128px clear padding, no resampling'},'hand_mask':{'source_roi':roi,'seed_in_roi':seed,'skin_component_pixels':count,'source_hand_bbox':bbox},'closeup_mapping':{'source_to_output_translation_px':[margin-bbox[0],margin-bbox[1]],'scale':1,'rotation_deg':0,'padding_px':margin}})
    save_json(META/'qa_report_v4.json',{'v3_unchanged':True,'silhouette_alpha_identical_to_v3':True,'lowlight_alpha_identical_to_v3':True,'layer_reconstruction_max_premultiplied_error_255':premul_error,'layer_reconstruction_max_alpha_error':int(dif[:,:,3].max()),'assets':checks,'limits':['Hand layers retain existing pose and original native detail; no unseen wrist, palm side or occluded sleeve has been painted.','Body layer has a transparent hand-shaped gap, not a reconstructed background.','Native closeup is not a new high-resolution drawing. Large magnification needs a storyboard-specific review.']})
    print(json.dumps({'hand_bbox':bbox,'hand_content_native_size':[cut.width,cut.height],'closeup_size':list(closeup.size),'reconstruction_error':premul_error,'qa':checks},ensure_ascii=False))

if __name__=='__main__': build()
