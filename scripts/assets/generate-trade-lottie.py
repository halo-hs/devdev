"""Generate an original, editable Lottie guide. No external fonts or assets."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
COLORS={'paper':'#ffffff','border':'#dbe4f0','muted':'#e8eef7','blue':'#4965ef','navy':'#172d55','green':'#28a57c','pale':'#eef2ff'}
def color(key):
 h=COLORS.get(key,key).lstrip('#'); return [int(h[i:i+2],16)/255 for i in (0,2,4)]+[1]
def prop(v): return {'a':0,'k':v}
def keys(values):
 return {'a':1,'k':[{'t':t,'s':v if isinstance(v,list) else [v],'i':{'x':[.65],'y':[1]},'o':{'x':[.35],'y':[0]}} for t,v in values]}
layers=[]
def rect(name,x,y,w,h,fill='paper',radius=12,stroke=None,opacity=None,position=None):
 shapes=[{'ty':'rc','d':1,'s':prop([w,h]),'p':prop([0,0]),'r':prop(radius)}]
 if fill: shapes.append({'ty':'fl','c':prop(color(fill)),'o':prop(100),'r':1})
 if stroke: shapes.append({'ty':'st','c':prop(color(stroke)),'o':prop(100),'w':prop(1.5),'lc':2,'lj':2})
 layers.append({'ddd':0,'ind':len(layers)+1,'ty':4,'nm':name,'sr':1,'ks':{'o':opacity or prop(100),'r':prop(0),'p':position or prop([x,y,0]),'a':prop([0,0,0]),'s':prop([100,100,100])},'ao':0,'shapes':shapes,'ip':0,'op':270,'st':0,'bm':0})
def reveal(start): return keys([(0,18),(start,18),(start+18,100),(240,100),(269,18)])
# Lottie layers are painted from back to front: add fine content before its paper.
for idx,(x,start) in enumerate([(130,12),(390,90),(650,170)]):
 rect('Document mark '+str(idx),x-52,120,26,30,'blue',5)
 rect('Document title '+str(idx),x+12,114,78,7,'navy',3)
 rect('Document subtitle '+str(idx),x+3,129,60,5,'muted',2)
 for row,width in enumerate([126,108,126,84]):
  rect('Field skeleton '+str(idx)+' '+str(row),x-10+(width-126)/2,160+row*20,width,7,'muted',3)
  rect('AI field '+str(idx)+' '+str(row),x-10+(width-126)/2,160+row*20,width,7,'blue',3,opacity=reveal(start+row*7))
 rect('Status '+str(idx),x,260,140,24,'pale',6)
 rect('Panel '+str(idx),x,190,200,220,'paper',16,'border')
# Connecting tokens travel through the guide.
for idx,start in [(0,45),(1,135)]:
 rect('Transfer '+str(idx),0,190,10,10,'blue',5,position=keys([(0,[250+260*idx,190,0]),(start,[250+260*idx,190,0]),(start+40,[270+260*idx,190,0]),(269,[270+260*idx,190,0])]))
 rect('Connection '+str(idx),260+260*idx,190,50,2,'border',1)
# Scan bar moves across the document, then clears for the next loop.
rect('AI scan',390,150,174,3,'green',1,position=keys([(0,[390,150,0]),(90,[390,150,0]),(145,[390,240,0]),(180,[390,240,0]),(269,[390,150,0])]),opacity=keys([(0,0),(85,0),(95,100),(145,100),(155,0),(269,0)]))
# Put highlighted fields above the skeletons.
layers.sort(key=lambda layer: 0 if layer["nm"].startswith("AI field") else 1)
# Move scan to the first layer to render above cards.
layers.insert(0,layers.pop())
for idx,l in enumerate(layers): l['ind']=idx+1
out={'v':'5.12.2','fr':30,'ip':0,'op':270,'w':780,'h':340,'nm':'ECOYA · document to deal guide','ddd':0,'assets':[],'layers':layers,'markers':[{'tm':0,'cm':'receive','dr':90},{'tm':90,'cm':'review','dr':90},{'tm':180,'cm':'connect','dr':90}]}
(ROOT/'public/lottie/trade-workflow.json').write_text(json.dumps(out,separators=(',',':'))+'\n')
