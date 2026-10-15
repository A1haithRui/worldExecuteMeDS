from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,json

V4=Path(__file__).resolve().parent.parent; S=V4/'sources'; M=V4/'metadata'; P=V4/'previews'
fontpath='C:/Windows/Fonts/msyh.ttc'
font=ImageFont.truetype(fontpath,25); small=ImageFont.truetype(fontpath,20); title=ImageFont.truetype(fontpath,34)
def save_json(name,value): (M/name).write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf-8')
def paste_contain(board,im,box):
    x,y,w,h=box; im=im.copy(); im.thumbnail((w,h),Image.Resampling.LANCZOS)
    board.paste(im,(x+(w-im.width)//2,y+(h-im.height)//2),im)

def main():
    sheet=Image.new('RGB',(1800,1450),'#06111D'); d=ImageDraw.Draw(sheet)
    d.text((28,20),'DeepSeek 角色 v4 · 复用评估与可用增补素材',font=title,fill='#DFF6F1')
    cards=[('v3 正面参考',Image.open(S/'deepseek_bust_v3.png')),
           ('v4 低亮细节 · 同画布配准',Image.open(V4/'deepseek_bust_v4_lowlight.png')),
           ('v4 纯剪影 · 隐去表情细节',Image.open(V4/'deepseek_bust_v4_silhouette.png')),
           ('独立手部 · 原生内容 501 × 476',Image.open(V4/'deepseek_palm_v4_closeup_native.png')),
           ('人物底层 · 手后遮挡区尚未补画',Image.open(V4/'deepseek_reach_v4_body_layer.png')),
           ('两层原位重合 · 精确还原 v3',Image.open(P/'reach_layer_reconstruction.png'))]
    for n,(label,im) in enumerate(cards):
        x=(n%3)*600; y=85+(n//3)*655
        d.text((x+24,y),label,font=font,fill='#CDECF0')
        paste_contain(sheet,im,(x+20,y+42,560,570))
    d.text((28,1405),'本轮无新增生图；猫化与性别形态仅提出方案，等待全曲分镜。',font=small,fill='#8EB9C5')
    sheet.save(P/'v4_review_board.jpg',quality=95)

    hand=Image.open(V4/'deepseek_palm_v4_closeup_native.png').convert('RGBA')
    crop=hand.crop(hand.getchannel('A').getbbox())
    # Deliberate display-size test, not a new high-resolution source asset.
    target_width=650; scale=target_width/crop.width
    shown=crop.resize((target_width,round(crop.height*scale)),Image.Resampling.LANCZOS)
    for label,bg,ink in [('dark','#06111D','#DFF6F1'),('light','#DDE9EA','#103449')]:
        frame=Image.new('RGB',(1920,1080),bg); dr=ImageDraw.Draw(frame)
        dr.text((110,120),'手心互动 / 1080p 构图评估',font=title,fill=ink)
        lines=['原生手部内容：501 × 476 px','本图手部显示宽：650 px（约 1.30 倍）','适合短暂停留、触碰点、手心图形互动。','不增加原图细节；全屏极近特写另审。']
        for n,line in enumerate(lines): dr.text((110,205+n*48),line,font=font,fill=ink)
        frame.paste(shown,(1100,240),shown)
        # Palm interaction point derived from the source-space anchor [440,1128].
        px=round(1100+(440-136)*scale); py=round(240+(1128-960)*scale)
        dr.ellipse((px-25,py-25,px+25,py+25),outline='#1FAAB9',width=3)
        dr.line((px-40,py,px+40,py),fill='#1FAAB9',width=1)
        dr.line((px,py-40,px,py+40),fill='#1FAAB9',width=1)
        dr.text((110,970),'审阅图有背景与定位辅助线；可用 PNG 本身透明且不含文字。',font=small,fill=ink)
        frame.save(P/f'palm_1080p_review_{label}.jpg',quality=96)

    qa=json.loads((V4.parent/'v3_sources'/'qa_report_v3.json').read_text(encoding='utf-8'))
    rois={entry['file'].split('_')[1]:[v+128 for v in entry['headpiece_detail_native_bbox']] for entry in qa['assets']}
    points={
        'bust':{'visible_eye':[596,526],'neck_knot':[686,827],'headpiece_anchor':[875,430]},
        'profile':{'visible_eye':[389,598],'neck_knot':[554,864],'headpiece_anchor':[651,436]},
        'reach':{'visible_eye':[611,527],'neck_knot':[733,806],'headpiece_anchor':[875,413],'palm_interaction':[440,1128],'wrist':[520,1110],'thumb_tip':[287,965],'index_tip':[142,1245],'middle_tip':[249,1407],'ring_tip':[425,1425],'little_tip':[631,1345]},
        'eye':{'visible_eye':[820,643],'neck_knot':[830,1114],'headpiece_anchor':[1167,533]}}
    records={}
    for pose,ps in points.items():
        im=Image.open(S/f'deepseek_{pose}_v3.png'); w,h=im.size
        records[pose]={'source':f'sources/deepseek_{pose}_v3.png','source_canvas':[w,h],'manual_landmarks':{k:{'xy_px':xy,'normalized':[xy[0]/w,xy[1]/h]} for k,xy in ps.items()},'headpiece_reference_roi':rois[pose],'roi_note':'Inspection crop including adjacent hair, not a segmented accessory bbox.','landmark_note':'Manual shot-alignment estimates; visually checked, approx. 10–20px tolerance, not skeletal joints.'}
    operations=json.loads((M/'operations.json').read_text(encoding='utf-8'))
    translation=operations['closeup_mapping']['source_to_output_translation_px']
    records['hand_closeup']={'canvas':[hand.width,hand.height],'source_hand_bbox':[136,960,637,1436],'source_to_closeup_translation':translation,'scale':1,'landmarks':{k:[xy[0]+translation[0],xy[1]+translation[1]] for k,xy in points['reach'].items() if k in ['palm_interaction','wrist','thumb_tip','index_tip','middle_tip','ring_tip','little_tip']},'palm_anchor_note':'Artwork interaction anchor; not a palm-crease anatomical measurement.'}
    save_json('landmarks_v4.json',{'coordinate_convention':'Top-left origin; pixel x right, y down; ROI [left,top,right,bottom], right/bottom exclusive.','same_canvas_registration':'Lowlight and silhouette use v3 bust canvas without crop/scale/rotation. Hand and body use v3 reach canvas without crop/scale/rotation.','records':records})
    diagram=Image.new('RGB',(1600,760),'#0A2032'); dr=ImageDraw.Draw(diagram)
    dr.text((24,18),'v3 配准记录 · E 眼睛 / N 领结 / H 发饰 / P 手心 / W 手腕',font=font,fill='#DFF6F1')
    for n,(pose,ps) in enumerate(points.items()):
        im=Image.open(S/f'deepseek_{pose}_v3.png').convert('RGBA'); ratio=min(360/im.width,600/im.height)
        th=im.resize((round(im.width*ratio),round(im.height*ratio)),Image.Resampling.LANCZOS)
        x=n*400+(400-th.width)//2; y=90
        diagram.paste(th,(x,y),th)
        for k,symbol in [('visible_eye','E'),('neck_knot','N'),('headpiece_anchor','H'),('palm_interaction','P'),('wrist','W')]:
            if k in ps:
                px=x+round(ps[k][0]*ratio); py=y+round(ps[k][1]*ratio)
                dr.ellipse((px-4,py-4,px+4,py+4),fill='#FFB65C'); dr.text((px+7,py-18),symbol,font=small,fill='#FFB65C')
        dr.text((n*400+24,700),pose,font=font,fill='#21BBD6')
    diagram.save(P/'landmark_review.jpg',quality=95)

    lyrics=json.loads((CHAR_PROJECT:=V4.parents[2]/'data'/'lyrics.json').read_text(encoding='utf-8'))
    relevant=[{'index':x['index'],'start':x['start'],'end':x['end']} for x in lyrics['lines'] if x['index'] in [50,51,52,56,57]]
    save_json('storyboard_candidates.json',{'status':'Proposals only; full-song shot list is not final. No variant images generated.','timing_source':'local data/lyrics.json (not committed)','lyric_cues':relevant,'gender_form':{'window_seconds':[88.587,92.015],'identity_lock':'Same face, eye/nose/mouth proportions, hair part/length, loop ahoge, fins, tail, hair ornament and collar; only subtly altered neck/shoulder silhouette and tailoring.','required_if_used':'One alternate-form bust aligned to v3 neck-knot and head anchor. Adult/faint echo derives from that form with silhouette/scale/opacity, not a separate illustration.'},'cat_ear_transition':{'window_seconds':[81.351,82.833],'identity_lock':'Same v3 face and hair. Existing lateral fin silhouette temporarily rises into pointed feline ear-like fins; no extra pair of ears. Keep whale tail and hair clip.','required_if_used':'Local ear/fin edit only for a readable held closeup; no whole new character.'},'cat_paw_action':{'window_seconds':[82.833,85.078],'identity_lock':'Same sailor cuffs and palette, short navy/seafoam paw forms with cyan pads; no new costume or feline tail.','required_if_used':'New local curled-paw/hand pose, as existing spread palm cannot produce bent joints by simple cropping. Produce only together with confirmed cat-ear shot.'}})
    print('Saved review boards, source-space landmarks, and storyboard candidates.')

if __name__=='__main__': main()
