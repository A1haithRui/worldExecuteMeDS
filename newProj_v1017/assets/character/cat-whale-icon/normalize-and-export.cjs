
const fs=require('fs'),path=require('path');
const sharp=require('C:/Users/28291/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const P=__dirname, blue=[77,107,254],mag=[255,0,255];
const stats=[];
(async()=>{
for(const key of ['complete','parts']){
 const {data,info}=await sharp(path.join(P,'sources',key+'_generated.png')).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const w=info.width,h=info.height,n=w*h; const mask=new Uint8Array(n); let l=w,t=h,r=0,b=0;
 for(let i=0;i<n;i++){let db=0,dm=0;for(let c=0;c<3;c++){db+=(data[i*3+c]-blue[c])**2;dm+=(data[i*3+c]-mag[c])**2;}if(db<dm){mask[i]=1;const x=i%w,y=Math.floor(i/w);l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}}
 const rgba=Buffer.alloc(n*4); for(let i=0;i<n;i++){rgba[i*4]=77;rgba[i*4+1]=107;rgba[i*4+2]=254;rgba[i*4+3]=mask[i]?255:0;}
 const cw=r-l+1,ch=b-t+1, scale=key==='complete'?Math.min(w*.70/cw,h*.70/ch):1;
 let foreground=await sharp(rgba,{raw:{width:w,height:h,channels:4}}).extract({left:l,top:t,width:cw,height:ch}).resize(Math.round(cw*scale),Math.round(ch*scale),{kernel:'nearest'}).png().toBuffer();
 const fw=Math.round(cw*scale),fh=Math.round(ch*scale);
 const left=Math.floor((w-fw)/2),top=Math.floor((h-fh)/2);
 for(const alpha of [false,true]){
 await sharp({create:{width:w,height:h,channels:4,background:alpha?{r:0,g:0,b:0,alpha:0}:{r:255,g:0,b:255,alpha:1}}}).composite([{input:foreground,left,top}]).png().toFile(path.join(P,'cat_whale_'+key+(alpha?'_transparent':'')+'.png'));
 }
 const parts=[];
 if(key==='parts'){
 const seen=new Uint8Array(n); const comps=[];
 for(let i=0;i<n;i++){if(!mask[i]||seen[i])continue;let q=[i],head=0,x0=w,y0=h,x1=0,y1=0;seen[i]=1;while(head<q.length){let j=q[head++],x=j%w,y=Math.floor(j/w);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);for(const k of [x>0?j-1:-1,x<w-1?j+1:-1,y>0?j-w:-1,y<h-1?j+w:-1])if(k>=0&&mask[k]&&!seen[k]){seen[k]=1;q.push(k);}}if(q.length>100)comps.push({x0,y0,x1,y1,pixels:q.length});}
 comps.sort((a,b)=>a.x0-b.x0);
 for(let i=0;i<comps.length;i++){const c=comps[i],name=['left_ear','right_ear','cat_tail'][i]||('piece_'+i),width=c.x1-c.x0+1,height=c.y1-c.y0+1;
 await sharp(rgba,{raw:{width:w,height:h,channels:4}}).extract({left:c.x0,top:c.y0,width,height}).extend({top:32,bottom:32,left:32,right:32,background:{r:0,g:0,b:0,alpha:0}}).png().toFile(path.join(P,name+'.png'));
 parts.push({name,source_bbox:[c.x0,c.y0,c.x1+1,c.y1+1],padding:32});
 }
 }
 const final=await sharp(path.join(P,'cat_whale_'+key+'.png')).raw().toBuffer({resolveWithObject:true});const colors=new Set();for(let i=0;i<final.data.length;i+=final.info.channels)colors.add(Array.from(final.data.subarray(i,i+3)).join(','));
 stats.push({key,dimensions:[w,h],actual_colors:[...colors],source_bbox:[l,t,r+1,b+1],output_bbox:[left,top,left+fw,top+fh],scale,parts});
}
fs.writeFileSync(path.join(P,'qa_and_placements.json'),JSON.stringify(stats,null,2));console.log(JSON.stringify(stats));
})().catch(e=>{console.error(e);process.exit(1)});

