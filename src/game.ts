/* eslint-disable */
// @ts-nocheck -- legacy monolith, to be split into typed modules
import * as THREE from "three";

const $=id=>document.getElementById(id),cv=$('c');
const R=.4,H=1.8,EYE=1.62,STEP=1/120,SENS=.0021,FOV=75;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xc3d6e2);scene.fog=new THREE.Fog(0xc3d6e2,25,95);
const cam=new THREE.PerspectiveCamera(FOV,1,.05,200);cam.rotation.order='YXZ';scene.add(cam);
const ren=new THREE.WebGLRenderer({canvas:cv,antialias:true});ren.setPixelRatio(Math.min(devicePixelRatio,2));
// Canvas-drawn textures hold sRGB colors.
function srgbTex(t){t.colorSpace=THREE.SRGBColorSpace;return t}
function rs(){ren.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}
addEventListener('resize',rs);rs();
// Physically based light values, fitted against renders of the original r128 (gamma-space) lighting.
scene.add(new THREE.HemisphereLight(0xffffff,0x2c2418,3.7));
const sun=new THREE.DirectionalLight(0xfff0d0,5.7);sun.position.set(30,50,20);scene.add(sun);

/* ---------- Map ---------- */
let WPTS=[],SPAWN=[0,26],TSP=[[0,-26]],WATERS=[],SURF=[],DSURF='dust',MM=null,TERR=null;const WLV=0,GC=16,EMPTY=[],DR=[],GL=[],shards=[];let GR=new Map(),qid=0,HB=null;const MMS=190;const waterMs=[];
const boxes=[],mapG=new THREE.Group();scene.add(mapG);
const pend=[];let useInst=false;
function box(x,z,w,d,h,col,y=0,nc){
  if(!nc)boxes.push({min:[x-w/2,y,z-d/2],max:[x+w/2,y+h,z+d/2]});
  if(useInst){pend.push([x,y+h/2,z,w,h,d,col]);return}
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:col}));
  m.position.set(x,y+h/2,z);mapG.add(m);
}
function flushBoxes(){if(!pend.length)return;const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial({color:0xffffff}),pend.length),M=new THREE.Matrix4(),C=new THREE.Color();
  pend.forEach((q,i)=>{M.makeScale(q[3],q[4],q[5]);M.setPosition(q[0],q[1],q[2]);im.setMatrixAt(i,M);im.setColorAt(i,C.setHex(q[6]))});
  im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;im.frustumCulled=false;mapG.add(im);pend.length=0}
function floorY(x,z){if(TERR)return TERR.h(x,z);for(const l of WATERS){const e=Math.min(l.w/2-Math.abs(x-l.x),l.d/2-Math.abs(z-l.z));if(e>0)return e<4?-.25:e<8?-.5:-.8}return 0}
function waterF(x,z,y){if(TERR){const e=WLV-y;return e>0?Math.min(1,e/.6):0}for(const l of WATERS)if(Math.min(l.w/2-Math.abs(x-l.x),l.d/2-Math.abs(z-l.z))>0)return Math.max(0,Math.min(1,(-.12-y)/.6));return 0}
function floorGeo(m){const w=m.fw||m.size||62,d=m.fd||m.size||62;if(!m.lakes||!m.lakes.length)return new THREE.PlaneGeometry(w,d);
  const sh=new THREE.Shape();sh.moveTo(-w/2,-d/2);sh.lineTo(w/2,-d/2);sh.lineTo(w/2,d/2);sh.lineTo(-w/2,d/2);sh.lineTo(-w/2,-d/2);
  for(const l of m.lakes){const q=new THREE.Path(),x0=l.x-(m.cx||0)-l.w/2,x1=x0+l.w,y0=-l.z-l.d/2,y1=y0+l.d;q.moveTo(x0,y0);q.lineTo(x1,y0);q.lineTo(x1,y1);q.lineTo(x0,y1);q.lineTo(x0,y0);sh.holes.push(q)}
  return new THREE.ShapeGeometry(sh)}
function lakeBox(l){const {x,z,w,d}=l,cols=[0xb9a77a,0x9c8a62,0x7d6f50],tops=[-.25,-.5,-.8];
  for(let k=0;k<3;k++){const a=w-k*8,b=d-k*8,y=-.9,h=tops[k]-y;
    if(k<2){box(x,z-(b/2-2),a,4,h,cols[k],y,true);box(x,z+(b/2-2),a,4,h,cols[k],y,true);box(x-(a/2-2),z,4,b-8,h,cols[k],y,true);box(x+(a/2-2),z,4,b-8,h,cols[k],y,true)}
    else box(x,z,a,b,h,cols[k],y,true)}
  const wm=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshPhongMaterial({color:0x3f88c8,transparent:true,opacity:.72,shininess:90,specular:0x99ccff}));
  wm.rotation.x=-Math.PI/2;wm.position.set(x,-.12,z);mapG.add(wm);waterMs.push(wm)}
const SURFC={0xc9b27c:'dust',0xb59a63:'dust',0xa9a47a:'dust',0xdfe6ea:'snow',0x6f8f55:'grass',0x7b9a5a:'grass',0x7a7a74:'dust'};
const cW=0xb8a173,cD=0x9c8660,cC=0x8b5a2b,cR=0xe4dac3,cT=0x8a7a5e,cH=0x4f7a3a,cK=0x6e4a2a,cF=0x7a5a3a;
const out=c=>[[0,-30.5,62,1,7,c],[0,30.5,62,1,7,c],[-30.5,0,1,62,7,c],[30.5,0,1,62,7,c]];
const cK2=0x7a6a50,cG=0x5a6a3a;
const sg=(ax,c,a,b,h,y,col=cR)=>{const m=(a+b)/2,l=b-a;return ax==='x'?[m,c,l,1,h,col,y]:[c,m,1,l,h,col,y]};
const wl=(ax,c,a,b,wins,y,col)=>{const o=[];let q=a;for(const [m,w] of wins){o.push(sg(ax,c,q,m-w/2,3,y,col),sg(ax,c,m-w/2,m+w/2,.9,y,col),sg(ax,c,m-w/2,m+w/2,.7,y+2.3,col));q=m+w/2}o.push(sg(ax,c,q,b,3,y,col));return o};
const fw=(y,g)=>[...(g?[[-9,-24,14,1,3,cR,y],[9,-24,14,1,3,cR,y],[-16,-20.5,1,7,3,cR,y],[-16,-9.5,1,7,3,cR,y],[16,-20.5,1,7,3,cR,y],[16,-9.5,1,7,3,cR,y]]:[]),
 [-4,-22,1,4,3,cR,y],[-4,-14,1,4,3,cR,y],[-4,-7,1,2,3,cR,y],[4,-22,1,4,3,cR,y],[4,-14,1,4,3,cR,y],[4,-7,1,2,3,cR,y]];
const stairs=Array.from({length:8},(_,i)=>[0,-10.5-i,2.5,1,.4125*(i+1),cT]);
// Dust 2x2 (A-site section) primitive data: position = box centre [x,y,z], scale = full extents [w,h,d]
const DUST_2X2_MAP=[
{name:"Boundary_North",primitive_type:"Box",position:[0,3.5,-30.5],scale:[62,7,1],hex_color:"#D3B785"},
{name:"Boundary_South",primitive_type:"Box",position:[0,3.5,30.5],scale:[62,7,1],hex_color:"#D3B785"},
{name:"Boundary_West",primitive_type:"Box",position:[-30.5,3.5,0],scale:[1,7,62],hex_color:"#D3B785"},
{name:"Boundary_East",primitive_type:"Box",position:[30.5,3.5,0],scale:[1,7,62],hex_color:"#D3B785"},
{name:"Boundary_WestBlock",primitive_type:"Box",position:[-15,2.5,10],scale:[30,5,40],hex_color:"#D3B785"},
{name:"Long_EastBlock",primitive_type:"Box",position:[27,2.5,12],scale:[6,5,36],hex_color:"#D3B785"},
{name:"CT_Roof",primitive_type:"Box",position:[-20,4.65,-20],scale:[20,0.3,20],hex_color:"#BBA072"},
{name:"CT_Pillar",primitive_type:"Box",position:[-18,2.5,-20],scale:[1.5,5,1.5],hex_color:"#D3B785"},
{name:"CT_Crate_1",primitive_type:"Box",position:[-25,0.75,-14],scale:[2,1.5,2],hex_color:"#A0784E"},
{name:"CT_Crate_2",primitive_type:"Box",position:[-14,0.5,-26],scale:[3,1,2],hex_color:"#A0784E"},
{name:"CT_Dumpster",primitive_type:"Box",position:[-27,1,-24],scale:[3,2,2],hex_color:"#A0784E"},
{name:"RampWall_North",primitive_type:"Box",position:[-5,2.5,-27],scale:[10,5,6],hex_color:"#BBA072"},
{name:"RampWall_South",primitive_type:"Box",position:[-5,2.5,-12],scale:[10,5,4],hex_color:"#BBA072"},
{name:"Ramp_Step_1",primitive_type:"Box",position:[-5,0.125,-19],scale:[2,0.25,10],hex_color:"#BBA072"},
{name:"Ramp_Step_2",primitive_type:"Box",position:[-3,0.25,-19],scale:[2,0.5,10],hex_color:"#BBA072"},
{name:"Ramp_Step_3",primitive_type:"Box",position:[-1,0.375,-19],scale:[2,0.75,10],hex_color:"#BBA072"},
{name:"A_SitePlatform",primitive_type:"Box",position:[15,0.5,-18],scale:[30,1,24],hex_color:"#E2C99D"},
{name:"A_PlantZone",primitive_type:"Box",position:[16,1.05,-16],scale:[8,0.1,8],hex_color:"#BBA072"},
{name:"A_DefaultBox",primitive_type:"Box",position:[18,1.75,-20],scale:[2,1.5,2],hex_color:"#A0784E"},
{name:"A_TripleBox_1",primitive_type:"Box",position:[5,1.75,-10],scale:[2,1.5,2],hex_color:"#A0784E"},
{name:"A_TripleBox_2",primitive_type:"Box",position:[7.2,1.75,-10],scale:[2,1.5,2],hex_color:"#A0784E"},
{name:"A_TripleBox_3",primitive_type:"Box",position:[5,1.75,-12.2],scale:[2,1.5,2],hex_color:"#A0784E"},
{name:"A_Goose",primitive_type:"Box",position:[27,1.75,-27],scale:[4,1.5,4],hex_color:"#A0784E"},
{name:"A_Car",primitive_type:"Box",position:[20,1.6,-8.5],scale:[4,1.2,2],hex_color:"#A0784E"},
{name:"Long_Step_1",primitive_type:"Box",position:[18,0.125,-1],scale:[12,0.25,2],hex_color:"#BBA072"},
{name:"Long_Step_2",primitive_type:"Box",position:[18,0.25,-3],scale:[12,0.5,2],hex_color:"#BBA072"},
{name:"Long_Step_3",primitive_type:"Box",position:[18,0.375,-5],scale:[12,0.75,2],hex_color:"#BBA072"},
{name:"Long_WestWall",primitive_type:"Box",position:[11.5,2.5,8.25],scale:[1,5,28.5],hex_color:"#D3B785"},
{name:"Long_Corner",primitive_type:"Box",position:[14,2.5,6.5],scale:[4,5,5],hex_color:"#BBA072"},
{name:"Long_CrateStack",primitive_type:"Box",position:[19,0.75,10],scale:[1.5,1.5,1.5],hex_color:"#A0784E"},
{name:"Long_BlueContainer",primitive_type:"Box",position:[21,1.25,14],scale:[3,2.5,7],hex_color:"#A0784E"},
{name:"Long_Car",primitive_type:"Box",position:[14,0.8,18],scale:[2.2,1.6,4.5],hex_color:"#A0784E"},
{name:"LongDoors_Left",primitive_type:"Box",position:[13.25,2.5,22.5],scale:[2.5,5,1],hex_color:"#D3B785"},
{name:"LongDoors_Pillar",primitive_type:"Box",position:[18,2.5,22.5],scale:[2,5,1],hex_color:"#D3B785"},
{name:"LongDoors_Right",primitive_type:"Box",position:[23,2.5,22.5],scale:[2,5,1],hex_color:"#D3B785"},
{name:"Outside_Car",primitive_type:"Box",position:[20,0.8,26],scale:[4.5,1.6,2.2],hex_color:"#A0784E"},
{name:"Catwalk_Deck",primitive_type:"Box",position:[5.5,1,4],scale:[11,2,20],hex_color:"#D3B785"},
{name:"Catwalk_Rail_Left",primitive_type:"Box",position:[2.5,2.6,-6],scale:[5,1.2,0.4],hex_color:"#BBA072"},
{name:"Catwalk_Rail_Right",primitive_type:"Box",position:[9.5,2.6,-6],scale:[3,1.2,0.4],hex_color:"#BBA072"},
{name:"Catwalk_DropStep",primitive_type:"Box",position:[6.5,1.25,-7],scale:[3,0.5,2],hex_color:"#BBA072"},
{name:"Catwalk_Crate_1",primitive_type:"Box",position:[9.5,2.75,2],scale:[1.5,1.5,1.5],hex_color:"#A0784E"},
{name:"Catwalk_Crate_2",primitive_type:"Box",position:[2.5,2.75,8],scale:[1.5,1.5,1.5],hex_color:"#A0784E"},
...[1,2,3,4,5,6,7,8].map(i=>({name:"Short_Stair_"+i,primitive_type:"Box",position:[5.5,0.125*i,22.5-i],scale:[11,0.25*i,1],hex_color:"#BBA072"}))
];
const D2X2A_BOXES=DUST_2X2_MAP.filter(q=>q.primitive_type==='Box').map(q=>[q.position[0],q.position[2],q.scale[0],q.scale[2],q.scale[1],parseInt(q.hex_color.slice(1),16),q.position[1]-q.scale[1]/2]);

/* ---------- Battle Royale world: terrain, water, mountains, roads ---------- */
const BRH=450,BRST=4,BRN=Math.round(2*BRH/BRST)+1;
const MTN=[{x:-170,z:-200,R:170,H:84,n:'Mount Karst'},{x:235,z:-135,R:130,H:60,n:'Redback Ridge'},{x:-265,z:165,R:120,H:46,n:'Grey Teeth'},{x:135,z:245,R:85,H:28,n:'Hogback'}];
const LKS=[{x:-135,z:30,r:44,n:'Mirror Lake'},{x:62,z:-200,r:28,n:'Eagle Pond'}];
const RIV=[[[-70,-125],[-10,-150],[50,-152],[110,-118],[150,-70],[165,-10],[185,50],[235,105],[275,170],[290,240],[300,330]]];
const SITES=[
 {n:'Central Mall',x:40,z:75,r:56,t:'mall'},{n:'Aurora',x:-25,z:-55,r:50,t:'downtown'},{n:'Maple Heights',x:138,z:152,r:44,t:'suburb'},
 {n:'Pinecrest',x:-55,z:-245,r:44,t:'village'},{n:'Frostpeak Lodge',x:-118,z:-152,r:24,t:'lodge'},{n:'Fort Redstone',x:150,z:-225,r:48,t:'fort'},
 {n:'Ironworks',x:300,z:30,r:46,t:'industrial'},{n:'Port Calder',x:240,z:245,r:48,t:'port'},{n:'Meadowbrook Farm',x:-105,z:220,r:52,t:'farm'},
 {n:'Dusty Gulch',x:-225,z:80,r:36,t:'hamlet'},{n:'Skyfield Airstrip',x:-300,z:-30,r:28,t:'airfield'},{n:'Cape Light',x:330,z:-95,r:22,t:'lighthouse'}];
const BRG=[{x:20,z:-151,ax:'z',len:44},{x:158,z:-40,ax:'x',len:44}];
const ROADS=[[[-55,-245],[0,-200],[20,-172],[20,-130],[-25,-55]],[[-25,-55],[20,0],[40,75]],[[40,75],[85,115],[138,152]],[[138,152],[215,110],[300,30]],[[138,152],[195,205],[240,245]],
 [[40,75],[-30,150],[-105,220]],[[-25,-55],[-110,-40],[-200,-30],[-300,-30]],[[-300,-30],[-250,40],[-225,80]],[[40,75],[100,20],[158,-40],[150,-130],[150,-225]],[[-25,-55],[-80,-100],[-118,-152]],[[300,30],[320,-30],[330,-95]]];
const REGX=[{n:'Whispering Pines',x:60,z:-120,w:1.3},{n:'Golden Plains',x:200,z:20,w:1.2},{n:'Sunset Beach',x:-330,z:-170,w:1.2},{n:'Driftwood Cove',x:0,z:350,w:1.2},{n:'Salt Flats',x:-20,z:200,w:1.1}];
const SURFK=['water','dust','grass','grass','dust','snow','dust','grass','grass','grass'];
const KCOL=[[.52,.58,.55],[.86,.79,.58],[.40,.62,.31],[.64,.63,.36],[.52,.50,.47],[.95,.96,.98],[.47,.46,.44],[.74,.64,.30],[.33,.52,.24],[.28,.42,.22]];
function mkNoise(seed){const hs=(i,j)=>{let h=Math.imul(i,374761393)^Math.imul(j,668265263)^Math.imul(seed,1274126177);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
  const sm=t=>t*t*(3-2*t),n2=(x,y)=>{const i=Math.floor(x),j=Math.floor(y),u=sm(x-i),v=sm(y-j),a=hs(i,j),b=hs(i+1,j),c=hs(i,j+1),d=hs(i+1,j+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v};
  const fbm=(x,y,o)=>{let s=0,a=.5,f=1,t=0;for(let k=0;k<o;k++){s+=a*n2(x*f,y*f);t+=a;a*=.5;f*=2.03}return s/t};return{n2,fbm}}
function catmull(pts,seg){const o=[];for(let i=0;i<pts.length-1;i++){const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)];
  for(let k=0;k<seg;k++){const t=k/seg,t2=t*t,t3=t2*t;o.push([.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)])}}o.push(pts[pts.length-1]);return o}
function genTerrain(){const {n2,fbm}=mkNoise(777),N=BRN,ST=BRST,HF=new Float32Array(N*N),SL=new Float32Array(N*N),KD=new Uint8Array(N*N),RM=new Uint8Array(N*N),COL=new Float32Array(N*N*3);
  const ss=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
  const segd=(px,pz,ax,az,bx,bz)=>{const dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz||1;let t=((px-ax)*dx+(pz-az)*dz)/l2;t=Math.max(0,Math.min(1,t));return Math.hypot(px-ax-dx*t,pz-az-dz*t)};
  const base=(x,z)=>{const r=Math.hypot(x,z)/BRH,w=(fbm(x*.003+7,z*.003+3,3)-.5)*.5,rr=r+w*(.35+r),land=1-ss(.56,.9,rr);let h=-7+land*(8.5+8*fbm(x*.006,z*.006,4));
    for(const m of MTN){const d=Math.hypot(x-m.x,z-m.z)/m.R;if(d<1){const k=1-d,s=k*k*(3-2*k),rg=1-Math.abs(2*fbm(x*.012+m.x,z*.012+m.z,4)-1);h+=m.H*s*(.45+.75*rg)}}return h};
  const rivs=RIV.map(r=>catmull(r,6));
  const carve=(x,z,h)=>{let k=0;for(const rv of rivs)for(let i=0;i<rv.length-1;i++){const d=segd(x,z,rv[i][0],rv[i][1],rv[i+1][0],rv[i+1][1]);if(d<11)k=Math.max(k,1-ss(4,11,d))}
    for(const l of LKS){const d=Math.hypot(x-l.x,z-l.z);if(d<l.r*1.25)k=Math.max(k,1-ss(l.r*.55,l.r*1.25,d))}
    k*=1-ss(9,20,h);return k>0?h+((WLV-1.05)-h)*k:h};
  const flat=[];for(const s of SITES){s.h=Math.max(WLV+2.6,base(s.x,s.z));flat.push({x:s.x,z:s.z,r:s.r,h:s.h})}
  const ah=Math.max(WLV+2.6,base(-300,-30));for(const z of [-120,-90,-60,0,30,60])flat.push({x:-300,z,r:26,h:ah});SITES[10].h=ah;
  const YB=WLV+2;for(const b of BRG){const e=b.ax==='z'?[[b.x,b.z-b.len/2],[b.x,b.z+b.len/2]]:[[b.x-b.len/2,b.z],[b.x+b.len/2,b.z]];for(const q of e)flat.push({x:q[0],z:q[1],r:9,h:YB});b.y=YB}
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=-BRH+i*ST,z=-BRH+j*ST;let h=carve(x,z,base(x,z));for(const f of flat){const d=Math.hypot(x-f.x,z-f.z);if(d<f.r*1.6)h+=(f.h-h)*(1-ss(f.r,f.r*1.6,d))}for(const b of BRG){const ux=b.ax==='z'?0:1,uz=b.ax==='z'?1:0,al=(x-b.x)*ux+(z-b.z)*uz,pp=Math.abs((x-b.x)*uz-(z-b.z)*ux);
      if(Math.abs(al)<b.len/2-3){const k=1-ss(7,12,pp),lim=YB-1.25;if(k>0&&h>lim)h+=(lim-h)*k}}
    HF[j*N+i]=h}
  let maxH=0;for(let j=0;j<N;j++)for(let i=0;i<N;i++){const k=j*N+i,a=HF[j*N+Math.max(0,i-1)],b=HF[j*N+Math.min(N-1,i+1)],c=HF[Math.max(0,j-1)*N+i],d=HF[Math.min(N-1,j+1)*N+i];SL[k]=Math.hypot((b-a)/(2*ST),(d-c)/(2*ST));if(HF[k]>maxH)maxH=HF[k]}
  const roads=ROADS.map(r=>catmull(r,10));
  for(const rd of roads)for(const [px,pz] of rd){const i0=Math.round((px+BRH)/ST),j0=Math.round((pz+BRH)/ST);for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const i=i0+di,j=j0+dj;if(i<0||j<0||i>=N||j>=N)continue;if(Math.hypot(-BRH+i*ST-px,-BRH+j*ST-pz)<3.6&&HF[j*N+i]>WLV+.3)RM[j*N+i]=1}}
  const farm=SITES[8],FR=[[farm.x+62,farm.z-18,46,34],[farm.x+62,farm.z+30,46,28],[farm.x-60,farm.z+52,40,30],[farm.x+6,farm.z+66,50,24]];
  const fieldAt=(x,z)=>{for(const f of FR)if(Math.abs(x-f[0])<f[2]/2&&Math.abs(z-f[1])<f[3]/2)return (Math.floor((x+z)/7)&1)?7:8;return 0};
  const regs=[...SITES.map(s=>({n:s.n,x:s.x,z:s.z,w:1})),...MTN.map(m=>({n:m.n,x:m.x,z:m.z,w:1.7})),...LKS.map(l=>({n:l.n,x:l.x,z:l.z,w:1.3})),...REGX];
  const RG=new Uint8Array(N*N);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const k=j*N+i,x=-BRH+i*ST,z=-BRH+j*ST,h=HF[k],sl=SL[k],bio=n2(x*.008+50,z*.008),fd=n2(x*.011+9,z*.011+4);
    let kd;if(h<WLV-.25)kd=0;else if(h<WLV+1.1)kd=1;else if(RM[k])kd=6;else{const f=fieldAt(x,z);if(f)kd=f;else if(sl>.8||(h>22&&sl>.55))kd=4;else if(h>40-n2(x*.05,z*.05)*7)kd=5;else kd=bio>.56?3:(fd>.62?9:2)}
    KD[k]=kd;const c=KCOL[kd],v=.9+.2*n2(x*.35,z*.35),rk=kd===4?.88+.24*n2(x*.9,z*.12):1;COL[k*3]=c[0]*v*rk;COL[k*3+1]=c[1]*v*rk;COL[k*3+2]=c[2]*v*rk;
    let bi=255,bd=1e9;if(h>WLV-1.2||Math.hypot(x,z)<BRH*.78){for(let q=0;q<regs.length;q++){const d=Math.hypot(x-regs[q].x,z-regs[q].z)/regs[q].w;if(d<bd){bd=d;bi=q}}}RG[k]=bi}
  const idx=(x,z)=>{let i=Math.round((x+BRH)/ST),j=Math.round((z+BRH)/ST);i=i<0?0:i>N-1?N-1:i;j=j<0?0:j>N-1?N-1:j;return j*N+i};
  const T={half:BRH,N,ST,HF,SL,KD,COL,RG,regs,maxH,roads,rivs,
    h(x,z){let fx=(x+BRH)/ST,fz=(z+BRH)/ST;if(fx<0)fx=0;if(fz<0)fz=0;if(fx>N-1.001)fx=N-1.001;if(fz>N-1.001)fz=N-1.001;const i=fx|0,j=fz|0,u=fx-i,v=fz-j,a=HF[j*N+i],b=HF[j*N+i+1],c=HF[(j+1)*N+i],d=HF[(j+1)*N+i+1];return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v},
    slope:(x,z)=>SL[idx(x,z)],kind:(x,z)=>KD[idx(x,z)],reg:(x,z)=>RG[idx(x,z)],surf:(x,z)=>SURFK[KD[idx(x,z)]]};
  return T}
// Terrain colors are authored in sRGB (the minimap canvas uses them as-is); vertex colors must be linear.
function srgbToLinear(a){const o=new Float32Array(a.length);for(let i=0;i<a.length;i++){const c=a[i];o[i]=c<.04045?c*.0773993808:Math.pow(c*.9478672986+.0521327014,2.4)};return o}
function terrMesh(T){const N=T.N,ST=T.ST,pos=new Float32Array(N*N*3),idx=new Uint16Array((N-1)*(N-1)*6);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const k=j*N+i;pos[k*3]=-T.half+i*ST;pos[k*3+1]=T.HF[k];pos[k*3+2]=-T.half+j*ST}
  let q=0;for(let j=0;j<N-1;j++)for(let i=0;i<N-1;i++){const a=j*N+i,b=a+1,c=a+N,d=c+1;idx[q++]=a;idx[q++]=c;idx[q++]=b;idx[q++]=b;idx[q++]=c;idx[q++]=d}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(srgbToLinear(T.COL),3));g.setIndex(new THREE.BufferAttribute(idx,1));g.computeVertexNormals();
  return new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true}))}
function terrT(o,d,maxT){if(!TERR)return Infinity;const lim=Math.min(maxT,1500);if(d[1]>=0&&o[1]>TERR.maxH+2)return Infinity;let t=0,step=1.2;
  if(o[1]-TERR.h(o[0],o[2])<-.6)return 0;
  while(t<lim){t+=step;const x=o[0]+d[0]*t,z=o[2]+d[2]*t;if((Math.abs(x)>TERR.half||Math.abs(z)>TERR.half)&&d[1]>=0)return Infinity;
    if(o[1]+d[1]*t-TERR.h(x,z)<0){let a=t-step,b=t;for(let k=0;k<7;k++){const m=(a+b)/2;if(o[1]+d[1]*m-TERR.h(o[0]+d[0]*m,o[2]+d[2]*m)<0)b=m;else a=m}return b}
    if(d[1]>=0&&o[1]+d[1]*t>TERR.maxH+2)return Infinity;step=Math.min(6,step*1.05+.03)}return Infinity}

/* ---------- Battle Royale world: buildings, landmarks, trees, loot ---------- */
function genWorld(){const T=genTerrain();let sd=4242;const rnd=()=>{sd=(Math.imul(sd,1664525)+1013904223)>>>0;return sd/4294967296},R=(a,b)=>a+rnd()*(b-a),pick=a=>a[(rnd()*a.length)|0],RI=(a,b)=>Math.floor(R(a,b+1));
  const B=[],G=[],D=[],LOOT=[],FP=[],ST=[],STR=[];
  const wb=(x,z,w,d,h,c,y,nc)=>B.push([x,z,w,d,h,c,y,nc]);
  const glass=(ax,c,m,w,y,h)=>G.push(ax==='x'?[m,c,w,.1,h,y]:[c,m,.1,w,h,y]);
  const door=(ax,c,m,w,y,h,col)=>D.push({ax,c,m,w,y,h,col:col||0x6b4a2a});
  const loot=(x,z,y,t)=>LOOT.push([x,z,y,t||1]);
  const wall=(ax,c,a,b,Y,h,col,ops,th)=>{th=th||.4;ops=(ops||[]).slice().sort((p,q)=>p.m-q.m);let q=a;
    const seg=(u,v,yy,hh)=>{if(v-u<.06||hh<.05)return;const m=(u+v)/2,l=v-u;if(ax==='x')wb(m,c,l,th,hh,col,yy);else wb(c,m,th,l,hh,col,yy)};
    for(const o of ops){const u=o.m-o.w/2,v=o.m+o.w/2;seg(q,u,Y,h);
      if(o.t==='w'){const s=o.s??.9,tp=o.top??2.3;seg(u,v,Y,s);seg(u,v,Y+tp,h-tp);glass(ax,c,o.m,o.w,Y+s,tp-s)}
      else{const dh=o.dh??2.3;seg(u,v,Y+dh,h-dh);if(o.t==='d')door(ax,c,o.m,o.w,Y,dh,o.col)}
      q=v}seg(q,b,Y,h)};
  const fp=(x,z,w,d,n)=>FP.push([x,z,w,d,n||'']);
  const insideFP=(x,z,m)=>FP.some(f=>Math.abs(x-f[0])<f[2]/2+m&&Math.abs(z-f[1])<f[3]/2+m);
  const gap=(a,c)=>Math.abs(a-c);
  const clearOf=(ops,keep)=>ops.filter(q=>q.t==='d'||keep||ops.every(o=>o===q||o.t!=='d'||gap(o.m,q.m)>(o.w+q.w)/2+.15));
  const roof=(cx,cz,w,d,Y,rc)=>{wb(cx,cz,w+.8,d+.8,.3,rc,Y);wb(cx,cz,w-1.5,d+.8,.45,rc,Y+.3)};
  const tbl=(x,z,Y,w,d)=>{wb(x,z,w||1.6,d||1,.8,0x6e4a2a,Y)};
  const carAt=(x,z,Y,al)=>{const c=pick([0xb03a2e,0x2e6db0,0xd9d9d9,0x2e2e2e,0xc9a227,0x3a8a4a]),w=al==='x'?4.4:1.9,d=al==='x'?1.9:4.4;wb(x,z,w,d,.9,c,Y+.35);wb(x,z,al==='x'?2.4:1.7,al==='x'?1.7:2.4,.7,0x9fb7c8,Y+1.25)};
  /* ----- house (1 floor) ----- */
  const house=(cx,cz,w,d,Y,o)=>{o=o||{};const h=3.2,col=o.col||pick([0xe4dac3,0xd9c8a8,0xcfd6c2,0xe8c8a0,0xc9d3d9]),rc=o.roof||pick([0x8a4a3a,0x6b6358,0x4a5a6a,0x7a5a3a]);
    const x0=cx-w/2,x1=cx+w/2,z0=cz-d/2,z1=cz+d/2,dm=cx+R(-w/6,w/6),pz=cz-d/6;
    wall('x',z1,x0,x1,Y,h,col,clearOf([{m:dm,w:1.4,t:'d'},{m:cx-w/2+1.6,w:1.6,t:'w'},{m:cx+w/2-1.6,w:1.6,t:'w'}]));
    wall('x',z0,x0,x1,Y,h,col,clearOf([...(rnd()<.5?[{m:cx,w:1.3,t:'d'}]:[]),{m:cx-w/3,w:1.6,t:'w'},{m:cx+w/3,w:1.6,t:'w'}]));
    wall('z',x0,z0,z1,Y,h,col,[{m:cz,w:1.6,t:'w'}]);wall('z',x1,z0,z1,Y,h,col,[{m:cz,w:1.6,t:'w'}]);
    wall('x',pz,x0,x1,Y,h,col,[{m:cx+R(-w/4,w/4),w:1.2,t:'d'}]);
    roof(cx,cz,w,d,Y+h,rc);wb(x1-1.4,cz+1,1,1,1.6,0x7a5a4a,Y+h+.4);
    tbl(cx+R(-1.5,1.5),(pz+z1)/2+.4,Y);wb(x0+1.2,(pz+z1)/2+1,.9,2.4,.9,pick([0x8a4a3a,0x4a5a6a]),Y);
    wb(cx+w/4,(z0+pz)/2-.8,2,1,.6,0xd8d2c4,Y);wb(x1-.8,(z0+pz)/2,.5,2.6,1.8,0x6e4a2a,Y);
    loot(x0+1.5,z1-1.6,Y,1);loot(x1-1.6,z0+1.6,Y,o.tier||1);fp(cx,cz,w+1,d+1,'house');return{x0,x1,z0,z1}};
  /* ----- villa / apartment block (2 floors, stairs) ----- */
  const villa=(cx,cz,w,d,Y,o)=>{o=o||{};const h=3.2,col=o.col||pick([0xe8dcc0,0xd8c9ad,0xc9d3d9,0xd7b9a4]),rc=o.roof||0x6b6358;
    const x0=cx-w/2,x1=cx+w/2,z0=cz-d/2,z1=cz+d/2,Y2=Y+3.5,dm=cx+R(1,w/5),pz=cz+d/6;
    wall('x',z1,x0,x1,Y,h,col,clearOf([{m:dm,w:1.6,t:'d',col:0x4a3a2a},{m:cx-w/3,w:1.8,t:'w'},{m:cx+w/2-2,w:1.8,t:'w'},{m:cx-w/2+1.8,w:1.4,t:'w'}]));
    wall('x',z0,x0,x1,Y,h,col,[{m:cx+w/4,w:1.4,t:'d'},{m:cx,w:1.8,t:'w'},{m:cx-w/3,w:1.8,t:'w'}]);
    wall('z',x0,z0,z1,Y,h,col,[{m:cz+1,w:1.8,t:'w'}]);wall('z',x1,z0,z1,Y,h,col,[{m:cz-1,w:1.8,t:'w'}]);
    wall('x',pz,x0+9,x1,Y,h,col,[{m:cx+R(2,w/4),w:1.3,t:'d'}]);
    for(let i=1;i<=8;i++)wb(x0+1.4+(i-.5),z0+1.5,1,2.3,.4375*i,0x8a6a4a,Y);
    // upper slab: everything except the stairwell hole (x0..x0+9.4, z0..z0+3)
    wb((x0+9.4+x1)/2,(z0+z1)/2,x1-x0-9.4,d,.3,0xa89b84,Y+3.2);wb(x0+4.7,(z0+3+z1)/2,9.4,z1-z0-3,.3,0xa89b84,Y+3.2);
    wall('x',z1,x0,x1,Y2,h,col,[{m:cx-w/3,w:1.8,t:'w'},{m:cx,w:1.8,t:'w'},{m:cx+w/4,w:1.8,t:'w'}]);
    wall('x',z0,x0,x1,Y2,h,col,[{m:cx-w/4,w:1.8,t:'w'},{m:cx+w/4,w:1.8,t:'w'}]);
    wall('z',x0,z0,z1,Y2,h,col,[{m:cz,w:1.8,t:'w'}]);wall('z',x1,z0,z1,Y2,h,col,[{m:cz,w:1.8,t:'w'}]);
    wall('z',cx+w/6,z0+3,z1,Y2,h,col,[{m:cz+d/6,w:1.2,t:'d'}]);
    roof(cx,cz,w,d,Y2+h,rc);
    wb(cx+w/4,pz+2,2.2,1,.8,0x6e4a2a,Y);wb(cx-w/3,cz+d/4,2,1,.6,0xd8d2c4,Y2);
    loot(x1-1.6,z0+2,Y,o.tier||1);loot(x0+1.6,z1-1.6,Y,1);loot(x1-1.6,z1-1.6,Y2,o.tier||1);loot(x0+1.8,z0+4.2,Y2,1);fp(cx,cz,w+1,d+1,'villa')};
  /* ----- shop ----- */
  const shop=(cx,cz,w,d,Y,o)=>{o=o||{};const h=3.8,col=o.col||pick([0xd8c9ad,0xc9a77a,0xb9c9d3,0xe0b9a4]),sign=pick([0xd9342b,0x2b7bd9,0xe0b02b,0x2bb36b,0x9b3ad9]);
    const x0=cx-w/2,x1=cx+w/2,z0=cz-d/2,z1=cz+d/2,ops=[{m:cx,w:1.8,t:'d',col:0x3a3a3a}];
    for(let x=x0+2.4;x<x1-2;x+=4.2)if(gap(x,cx)>2.9)ops.push({m:x,w:3.2,t:'w',s:.35,top:2.9});
    wall('x',z1,x0,x1,Y,h,col,ops);wall('x',z0,x0,x1,Y,h,col,[{m:x1-3,w:1.3,t:'d'},{m:x0+3,w:1.6,t:'w',s:1.6,top:2.7}]);
    wall('z',x0,z0,z1,Y,h,col,[{m:cz+1,w:1.6,t:'w'}]);wall('z',x1,z0,z1,Y,h,col,[]);
    wall('x',z0+3.4,x0,x1,Y,h,col,[{m:x1-3,w:1.2,t:'d'}]);
    roof(cx,cz,w,d,Y+h,0x5a5a60);wb(cx,z1+.35,5,.3,.8,sign,Y+3.95);
    wb(cx,z0+5.4,w*.55,.8,1.1,0x7a5a3a,Y);wb(cx-w/4,cz+1,w*.28,.5,2,0x8a7a6a,Y);wb(cx+w/4,cz+1,w*.28,.5,2,0x8a7a6a,Y);
    loot(x0+1.6,z0+1.8,Y,o.tier||1);loot(cx+w/4,z0+5,Y,o.tier||1);fp(cx,cz,w+1,d+1.4,'shop')};
  /* ----- mall (landmark) ----- */
  const mall=(cx,cz,Y)=>{const w=56,d=34,h=5.5,x0=cx-28,x1=cx+28,z0=cz-17,z1=cz+17,col=0xd8d2c4,az0=cz-5,az1=cz+5;
    const fr=[];for(const xx of [-24,-17,-3.5,3.5,17,24])fr.push({m:cx+xx,w:4,t:'w',s:.5,top:4.4});
    for(const xx of [-10,10]){fr.push({m:cx+xx-.9,w:1.7,t:'d',dh:3.4,col:0x4a5a6a});fr.push({m:cx+xx+.9,w:1.7,t:'d',dh:3.4,col:0x4a5a6a})}
    wall('x',z1,x0,x1,Y,h,col,fr);
    wall('x',z0,x0,x1,Y,h,col,[{m:cx+20,w:1.8,t:'d',dh:3},{m:cx-15,w:3,t:'w',s:3.6,top:4.8},{m:cx+3,w:3,t:'w',s:3.6,top:4.8},{m:cx+12,w:3,t:'w',s:3.6,top:4.8}]);
    wall('z',x0,z0,z1,Y,h,col,[{m:cz,w:1.8,t:'d',dh:3},{m:cz-9,w:3,t:'w',s:1.2,top:3.6},{m:cz+9,w:3,t:'w',s:1.2,top:3.6}]);
    wall('z',x1,z0,z1,Y,h,col,[{m:cz,w:1.8,t:'d',dh:3},{m:cz-9,w:3,t:'w',s:1.2,top:3.6},{m:cz+9,w:3,t:'w',s:1.2,top:3.6}]);
    wb(cx,cz,w+1,d+1,.4,0x77787a,Y+h);wb(cx,z1+.4,w,.5,.9,0xc9342b,Y+h+.2);
    // north row: six shops (8.67 m wide, 12 deep) facing the atrium
    for(let i=0;i<6;i++){const sx0=x0+2+i*(w-4)/6,sx1=sx0+(w-4)/6,sm=(sx0+sx1)/2;
      wall('z',sx0,z0,az0,Y,h,col,[]);wall('x',az0,sx0,sx1,Y,h,col,[{m:sm-1.5,w:1.6,t:'d',col:0x3a3a3a},{m:sm+1.7,w:3,t:'w',s:.4,top:3}]);
      wb(sm,z0+2,sx1-sx0-2,.8,1.1,0x7a5a3a,Y);wb(sm,z0+6,sx1-sx0-3,.5,2,0x8a7a6a,Y);loot(sm-2.5,z0+4,Y,2)}
    wall('z',x1-2,z0,az0,Y,h,col,[]);
    // south row: shops either side of the two entrance bays
    for(const [a,b] of [[-26,-13.5],[-6.5,6.5],[13.5,26]]){const sx0=cx+a,sx1=cx+b,sm=(sx0+sx1)/2;
      wall('x',az1,sx0,sx1,Y,h,col,[{m:sm-1.2,w:1.6,t:'d',col:0x3a3a3a},{m:sm+Math.min(2.6,(b-a)/2-1.8),w:3,t:'w',s:.4,top:3}]);
      wb(sm,z1-2,sx1-sx0-2,.8,1.1,0x7a5a3a,Y);wb(sm,z1-6,sx1-sx0-3,.5,2,0x8a7a6a,Y);loot(sm-2.5,z1-4,Y,2)}
    for(const xx of [-26,-13.5,-6.5,6.5,13.5,26])wall('z',cx+xx,az1,z1,Y,h,col,[]);
    for(const xx of [-18,-6,6,18]){wb(cx+xx,cz,1,1,h-.2,0xbfb8a8,Y);wb(cx+xx+3,cz+2.5,2.2,1.4,.5,0x4a7a3a,Y);tbl(cx+xx-3,cz-2.5,Y,1.4,1.4)}
    loot(cx,cz-2.5,Y,2);loot(cx-12,cz+2.5,Y,2);loot(cx+12,cz-2.5,Y,2);fp(cx,cz,w+2,d+2,'mall');
    // car park south of the mall
    wb(cx,z1+17,w+6,26,.02,0x55585a,Y+.03,true);for(let r=0;r<3;r++)for(let c=-4;c<=4;c++)if(rnd()<.55)carAt(cx+c*6,z1+10+r*8,Y,'z');
    for(const xx of [-24,0,24])wb(cx+xx,z1+22,.5,.5,7,0x666,Y);fp(cx,z1+17,w+6,26,'carpark')};
  /* ----- warehouse / hangar ----- */
  const warehouse=(cx,cz,w,d,Y,o)=>{o=o||{};const h=o.h||6.5,col=o.col||0x9aa4ab,x0=cx-w/2,x1=cx+w/2,z0=cz-d/2,z1=cz+d/2,gw=o.gate||6;
    wall('x',z1,x0,x1,Y,h,col,[{m:cx,w:gw,t:'g',dh:o.gh||4.5},{m:x1-3,w:1.4,t:'d'}]);wall('x',z0,x0,x1,Y,h,col,[{m:cx-w/3,w:2,t:'w',s:3.8,top:5.4},{m:cx+w/3,w:2,t:'w',s:3.8,top:5.4},{m:cx,w:1.4,t:'d'}]);
    wall('z',x0,z0,z1,Y,h,col,[{m:cz,w:1.4,t:'d'},{m:cz-d/4,w:2,t:'w',s:3.8,top:5.4},{m:cz+d/4,w:2,t:'w',s:3.8,top:5.4}]);wall('z',x1,z0,z1,Y,h,col,[{m:cz-d/4,w:2,t:'w',s:3.8,top:5.4},{m:cz+d/4,w:2,t:'w',s:3.8,top:5.4}]);
    wb(cx,cz,w+.8,d+.8,.4,0x6a7077,Y+h);
    const rows=Math.max(2,Math.floor((w-10)/6));for(let i=0;i<rows;i++){const sx=x0+5+i*((w-10)/Math.max(1,rows-1));wb(sx,cz-d/6,1.2,d*.45,2.8,0x7a6a5a,Y)}
    for(let i=0;i<4;i++)wb(x0+3+rnd()*(w-6),z1-3-rnd()*3,1.4,1.4,1.3,0x9a7448,Y);
    wb(x0+3.6,z0+3.6,7,.4,3,col,Y);wall('z',x0+7,z0,z0+7,Y,3,col,[{m:z0+4,w:1.2,t:'d'}]);wb(x0+3.5,z0+3.5,6,6,.3,0x6a7077,Y+3,true);
    loot(x0+2.5,z0+2.5,Y,o.tier||1);loot(cx+w/4,cz,Y,o.tier||1);loot(x1-2,z1-3,Y,1);fp(cx,cz,w+1,d+1,'warehouse')};
  const hangar=(cx,cz,Y)=>{const w=22,d=30,h=9;warehouse(cx,cz,w,d,Y,{h,gate:14,gh:7,col:0xb7bcc2,tier:2});
    wb(cx,cz+2,3,12,3,0xd9d9d9,Y);wb(cx,cz-1,18,3,.3,0xd9d9d9,Y+2);wb(cx,cz-6.5,1,5,.2,0xd9d9d9,Y+3.4);wb(cx,cz-7,6,.3,1.8,0xd9d9d9,Y+3.4)};
  /* ----- enterable structures: hollow shells with a door, stair towers with a glazed lookout, silos ----- */
  const rot=(f,lx,lz)=>f==='s'?[lx,lz]:f==='n'?[-lx,-lz]:f==='e'?[lz,-lx]:[-lz,lx];
  const rrect=(f,lx,lz,sx,sz)=>{const[a,b]=rot(f,lx,lz);return f==='e'||f==='w'?[a,b,sz,sx]:[a,b,sx,sz]};
  const shell=(cx,cz,Y,out,h,col,face,win)=>{const x0=cx-out/2,x1=cx+out/2,z0=cz-out/2,z1=cz+out/2,dd=m=>[{m,w:1.4,t:'d',col:0x4a4036}],ww=m=>win&&h>=3.2?[{m,w:win.w,t:'w',s:win.s,top:win.top}]:[],op=(sd,m)=>face===sd?dd(m):ww(m);
    wall('x',z1,x0-.2,x1+.2,Y,h,col,op('s',cx));wall('x',z0,x0-.2,x1+.2,Y,h,col,op('n',cx));wall('z',x1,z0,z1,Y,h,col,op('e',cz));wall('z',x0,z0,z1,Y,h,col,op('w',cz))};
  const stairTower=(cx,cz,Y,o)=>{o=o||{};const out=o.out||6.4,f=o.face||'s',col=o.col||0xbfc4c8,RISE=.45,sw=1.2,inn=out-.4,hi=inn/2,TD=.8;
    // one loop of stair cells around the inside of the shaft (local frame, door on +z): up the west wall, across the north wall, down the east wall, back along the south wall
    const n1=Math.floor((inn-1-sw)/TD),n2=Math.floor((inn-2*sw)/TD),t1=(inn-1-sw)/n1,t2=(inn-2*sw)/n2,C=[];
    for(let j=0;j<n1;j++)C.push([-hi+sw/2,hi-1-t1*(j+.5),sw,t1]);C.push([-hi+sw/2,-hi+sw/2,sw,sw]);
    for(let j=0;j<n2;j++)C.push([-hi+sw+t2*(j+.5),-hi+sw/2,t2,sw]);C.push([hi-sw/2,-hi+sw/2,sw,sw]);
    for(let j=0;j<n2;j++)C.push([hi-sw/2,-hi+sw+t2*(j+.5),sw,t2]);C.push([hi-sw/2,hi-sw/2,sw,sw]);
    for(let j=0;j<n2;j++)C.push([hi-sw-t2*(j+.5),hi-sw/2,t2,sw]);
    const N=Math.max(C.length,Math.round((o.h||14)/RISE)-1),hf=(N+1)*RISE,rec={cx,cz,Y,hf,face:f,tr:[]},last=[];
    for(let k=1;k<=N;k++){const c=C[(k-1)%C.length],[a,b,w,d]=rrect(f,c[0],c[1],c[2],c[3]);wb(cx+a,cz+b,w,d,.45,0x8a6a4a,Y+k*RISE-.45);rec.tr.push([cx+a,cz+b,Y+k*RISE]);if(k*RISE>hf-2.3)last.push(c)}
    for(let y=0;y<hf-.01;y+=4){const hh=Math.min(4,hf-y);shell(cx,cz,Y+y,out,hh,col,y===0?f:'-',y===0?{w:1.2,s:1,top:2.4}:{w:.9,s:1,top:2.6})}
    // lookout floor: a grid of cells, minus the ones above the last few treads (headroom)
    {const G=Math.round(inn/.4),cs=inn/G;for(let r=0;r<G;r++){let run=-1;for(let q=0;q<=G;q++){const x0=-hi+q*cs,z0=-hi+r*cs;let free=q<G;if(free)for(const c of last)if(x0<c[0]+c[2]/2+.05&&x0+cs>c[0]-c[2]/2-.05&&z0<c[1]+c[3]/2+.05&&z0+cs>c[1]-c[3]/2-.05){free=false;break}
      if(free&&run<0)run=q;if(!free&&run>=0){const xa=-hi+run*cs,xb=-hi+q*cs,[a,b,w,d]=rrect(f,(xa+xb)/2,-hi+(r+.5)*cs,xb-xa,cs);wb(cx+a,cz+b,w+.02,d+.02,.3,0xa89b84,Y+hf-.3);run=-1}}}}
    shell(cx,cz,Y+hf,out,3.2,col,'-',{w:3.2,s:.9,top:2.5});wb(cx,cz,out+.9,out+.9,.4,o.roof||0x444a50,Y+hf+3.2);
    {const[a,b]=rot(f,.2,-1.4);loot(cx+a,cz+b,Y+hf,2)}{const[a,b]=rot(f,-.6,hi-1.5);loot(cx+a,cz+b,Y,1)}
    rec.door=rot(f,0,out/2).map((v,i)=>(i?cz:cx)+v);STR.push(rec);fp(cx,cz,out+1,out+1,o.fpn||'tower');return rec};
  const silo=(cx,cz,Y,out,h,col,o)=>{o=o||{};const f=o.face||'s',h1=Math.min(h,4.4);shell(cx,cz,Y,out,h1,col,f,{w:1,s:1,top:2.4});if(h>h1+.05)shell(cx,cz,Y+h1,out,h-h1,col,'-',h-h1>=3.2?{w:.9,s:1.2,top:2.8}:null);
    wb(cx,cz,out+.8,out+.8,.5,o.roof||0x666b70,Y+h);wb(cx+out/4,cz-out/4,1.3,1.3,1.1,0x9a7448,Y);const[a,b]=rot(f,-out/4,out/2-1.6);loot(cx+a,cz+b,Y,o.tier||1)};
  const tower=(cx,cz,Y,h)=>stairTower(cx,cz,Y,{out:h>14?7.2:6.4,h});
  const containers=(x,z,Y,nx,nz,hi)=>{const cols=[0xb03a2e,0x2e6db0,0x3a8a4a,0xd9822b,0x7a7f85,0xc9a227];for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){if(rnd()<.2)continue;const c=pick(cols),cx=x+i*14.5,cz=z+j*6;wb(cx,cz,12,2.6,2.6,c,Y);if(hi&&rnd()<.4)wb(cx,cz,12,2.6,2.6,pick(cols),Y+2.6)}fp(x+(nx-1)*7.25,z+(nz-1)*3,nx*14.5,nz*6+2.6,'containers')};
  /* ----- bridge: thin deck on pillars, so the river can still be waded underneath ----- */
  const bridge=b=>{const Y=b.y+.2,z=b.ax==='z';wb(b.x,b.z,z?6:b.len,z?b.len:6,.4,0x8a6a4a,Y-.4);
    wb(b.x+(z?-2.8:0),b.z+(z?0:-2.8),z?.4:b.len,z?b.len:.4,1.1,0x6b4a2a,Y);wb(b.x+(z?2.8:0),b.z+(z?0:2.8),z?.4:b.len,z?b.len:.4,1.1,0x6b4a2a,Y);
    for(const k of [-b.len/4,b.len/4])wb(b.x+(z?0:k),b.z+(z?k:0),z?5.6:1,z?1:5.6,Y+.3,0x77695a,-1.2)};
  const S=n=>SITES.find(s=>s.n===n);
  /* ===== landmarks ===== */
  {const s=S('Central Mall');mall(s.x,s.z-10,s.h)}
  {const s=S('Aurora'),Y=s.h,types=['villa','shop','house','villa','warehouse','house','shop','villa'];let k=0;
    for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const x=s.x+i*30,z=s.z+j*28;if(!i&&!j){wb(x,z,3,3,4,0x9a9a9a,Y);wb(x,z,10,10,.5,0x8a8a8a,Y);for(const q of [[-5,0],[5,0],[0,5],[0,-5]])wb(x+q[0],z+q[1],q[0]?.8:2,q[0]?2:.8,.6,0x6e4a2a,Y);fp(x,z,12,12,'plaza');loot(x+3,z+3,Y,1);continue}
      const t=types[k++%types.length];if(t==='villa')villa(x,z,14,11,Y);else if(t==='shop')shop(x,z,16,9,Y);else if(t==='house')house(x,z,10,9,Y);else warehouse(x,z,18,12,Y,{h:5,gate:4,gh:3.6})}
    for(let q=0;q<10;q++){const x=s.x+(rnd()<.5?-15:15)+R(-2,2),z=s.z+R(-40,40);if(!insideFP(x,z,5))carAt(x,z,Y,'z')}}
  {const s=S('Maple Heights'),Y=s.h;for(const rz of [-16,16])for(const rx of [-30,-10,10,30]){house(s.x+rx,s.z+rz,10,9,Y);if(rnd()<.6)carAt(s.x+rx+7.5,s.z+rz+8,Y,'z')}
    villa(s.x,s.z-36,14,11,Y);shop(s.x+14,s.z+29,14,8,Y)}
  {const s=S('Pinecrest'),Y=s.h;for(const q of [[-28,-8],[-14,-26],[8,-30],[28,-12],[30,12],[-30,14],[-12,26]])house(s.x+q[0],s.z+q[1],RI(9,11),RI(8,9),Y,{roof:0x5a4a3a,col:pick([0xc9a77a,0xb89a6a,0xd6c3a0])});
    warehouse(s.x-2,s.z+2,10,18,Y,{h:6,gate:3,gh:3.2,col:0xc9c4b8,tier:1});tower(s.x+11,s.z-6,Y,14);shop(s.x+14,s.z+28,14,8,Y);
    for(let q=0;q<5;q++){const x=s.x+R(-34,34),z=s.z+R(-34,34);if(Math.hypot(x-s.x,z-s.z)<38&&!insideFP(x,z,4.5))wb(x,z,2.4,1.2,1.1,0x7a5a3a,Y)}}
  {const s=S('Frostpeak Lodge'),Y=s.h;villa(s.x,s.z-2,20,13,Y,{col:0x9a7448,roof:0xe8eef2,tier:2});house(s.x-14,s.z+9,9,8,Y,{col:0x9a7448,roof:0xe8eef2});house(s.x+14,s.z+9,9,8,Y,{col:0x9a7448,roof:0xe8eef2});stairTower(s.x-15,s.z-12,Y,{out:6.4,h:9,col:0x7a6a50,roof:0x6b3a2a,face:'e',fpn:'lookout'})}
  {const s=S('Fort Redstone'),Y=s.h,hh=26,c=0x8a8f94,th=1.2;
    wall('x',s.z-hh,s.x-hh,s.x+hh,Y,5,c,[{m:s.x,w:8,t:'g',dh:4.2}],th);wall('x',s.z+hh,s.x-hh,s.x+hh,Y,5,c,[{m:s.x,w:8,t:'g',dh:4.2}],th);wall('z',s.x-hh,s.z-hh,s.z+hh,Y,5,c,[],th);wall('z',s.x+hh,s.z-hh,s.z+hh,Y,5,c,[],th);
    for(const q of [[-1,-1],[1,-1],[-1,1],[1,1]]){const x=s.x+q[0]*(hh-4),z=s.z+q[1]*(hh-4);stairTower(x,z,Y,{out:6.4,h:13,col:0x7a7f84,roof:0x555a60,face:q[0]<0?'e':'w',fpn:'fortTower'})}
    house(s.x-8,s.z-14,24,9,Y,{col:0x9aa08c,roof:0x555a50,tier:2});house(s.x-8,s.z+14,24,9,Y,{col:0x9aa08c,roof:0x555a50,tier:2});house(s.x+15,s.z+2,10,9,Y,{col:0x7a7f84,roof:0x44484c,tier:2});tower(s.x+14,s.z-16,Y,14);
    wb(s.x+15,s.z+19,12,12,.05,0x55585a,Y+.03,true);for(let q=0;q<14;q++){const x=s.x+R(-22,22),z=s.z+R(-22,22);if(!insideFP(x,z,4.5))wb(x,z,3,1,1.1,0x9a8a6a,Y)}}
  {const s=S('Ironworks'),Y=s.h;warehouse(s.x-20,s.z-18,30,18,Y,{tier:1});warehouse(s.x+14,s.z-20,24,16,Y,{tier:1});warehouse(s.x+8,s.z+16,28,14,Y,{h:8,gate:6,gh:5.5,col:0x8a8f94,tier:2});
    wb(s.x+26,s.z+16,4,4,34,0x7a7468,Y);fp(s.x+26,s.z+16,5,5,'stack');for(const q of [[-30,10],[-30,24],[-18,32]]){silo(s.x+q[0],s.z+q[1],Y,8,7,0x8a9098,{face:q[0]<-20?'e':'n'});fp(s.x+q[0],s.z+q[1],9,9,'tank')}
    containers(s.x+4,s.z+38,Y,2,1,false);for(let q=0;q<5;q++)wb(s.x-12+q*7,s.z-2,1,1,3,0x666b70,Y)}
  {const s=S('Port Calder'),Y=s.h;warehouse(s.x-24,s.z-20,26,14,Y,{tier:1});warehouse(s.x-26,s.z+14,22,12,Y,{tier:1,gate:5});shop(s.x+4,s.z+30,13,9,Y,{tier:2});containers(s.x-10,s.z-38,Y,3,2,true);
    for(const pz of [-14,10]){wb(s.x+52,s.z+pz,64,5,.5,0x7a6a58,Y-.3);for(let k=24;k<=84;k+=12)wb(s.x+k,s.z+pz-2.2,.6,.6,1,0x333,Y+.2)}
    for(const q of [-4,4]){wb(s.x+34,s.z-14+q,1.4,1.4,18,0xd9822b,Y);wb(s.x+34+0,s.z-14,2.2,10,2.2,0xd9822b,Y+18)}loot(s.x+60,s.z-14,Y+.2,2);loot(s.x+60,s.z+10,Y+.2,2)}
  {const s=S('Meadowbrook Farm'),Y=s.h;warehouse(s.x-18,s.z-10,22,14,Y,{h:6.5,gate:6,gh:4.6,col:0x8a3a2e,tier:1});house(s.x+14,s.z-18,12,9,Y);
    for(const q of [[22,8],[22,16],[30,12]]){silo(s.x+q[0],s.z+q[1],Y,6,14,0xc9ccd0,{roof:0x888888,face:q[0]>25?'e':'w'});fp(s.x+q[0],s.z+q[1],7,7,'silo')}
    for(let k=0;k<=24;k+=2){wb(s.x-30+k,s.z+14,.3,.3,1.1,0x6b4a2a,Y);wb(s.x-30+k,s.z+40,.3,.3,1.1,0x6b4a2a,Y)}wb(s.x-18,s.z+14,24,.2,.3,0x6b4a2a,Y+.8);wb(s.x-18,s.z+40,24,.2,.3,0x6b4a2a,Y+.8);fp(s.x-18,s.z+27,26,28,'paddock');
    for(let q=0;q<8;q++)wb(s.x-30+R(0,24),s.z+16+R(0,22),1.6,1.6,1.4,0xd6b84a,Y);silo(s.x-34,s.z-30,Y,6,7,0xe0e0e0,{roof:0xe0e0e0,face:'s',tier:1});wb(s.x-34,s.z-30,3.6,3.6,8,0xe0e0e0,Y+7.5);wb(s.x-34,s.z-27.9,.4,.3,10,0x5a4a3a,Y+11);wb(s.x-34,s.z-27.9,10,.3,.4,0x5a4a3a,Y+15.8);fp(s.x-34,s.z-30,7,7,'mill');
    wb(s.x+4,s.z-4,3.6,2.2,1.6,0x2e8a3a,Y);wb(s.x+4,s.z-5,2,1.6,1,0x3a3a3a,Y+1.6);loot(s.x+4,s.z+2,Y,1)}
  {const s=S('Dusty Gulch'),Y=s.h;for(const q of [[-22,-14],[-4,-24],[16,-14],[22,8],[-20,12]])house(s.x+q[0],s.z+q[1],RI(9,11),RI(8,9),Y,{col:pick([0xd8b98a,0xcaa878,0xe0c8a0]),roof:0xb08a5a});shop(s.x,s.z+22,16,9,Y,{col:0xc9a77a});
    for(const q of [[-3,-3],[3,-3],[-3,3],[3,3]])wb(s.x+q[0],s.z+q[1],.6,.6,6,0x6b4a2a,Y);wb(s.x,s.z,6,6,2.2,0x8a6a4a,Y+6);fp(s.x,s.z,7,7,'wtower');wb(s.x+8,s.z+8,2,2,1,0x888,Y);fp(s.x+8,s.z+8,3,3,'well')}
  {const s=S('Skyfield Airstrip'),Y=s.h,rx=-312;wb(rx,-30,16,190,.02,0x4a4d50,Y+.03,true);for(let z=-115;z<=55;z+=14)wb(rx,z,.5,6,.02,0xeeeeee,Y+.06,true);fp(rx,-30,18,192,'runway');
    hangar(-285,-70,Y);hangar(-285,-25,Y);tower(-285,20,Y,16);shop(-285,45,22,10,Y,{col:0xbfc4c8,tier:2});silo(-285,66,Y,6,5,0x8a9098,{face:'n'});fp(-285,66,7,7,'tank');wb(rx+10,-60,.3,.3,5,0xcc3322,Y)}
  {const s=S('Cape Light'),Y=s.h;stairTower(s.x,s.z,Y,{out:7.2,h:17,col:0xf0f0f0,roof:0xc9342b,fpn:'lighthouse'});for(const q of [5,10])wb(s.x,s.z,7.9,7.9,1.3,0xc9342b,Y+q,true);house(s.x-13,s.z+6,10,8,Y,{col:0xf0f0f0,roof:0xc9342b,tier:1})}
  for(const b of BRG)bridge(b);
  /* ===== wilderness: cabins, gas stations, forests, rocks ===== */
  const nearSite=(x,z,m)=>SITES.some(s=>Math.hypot(x-s.x,z-s.z)<s.r+m)||BRG.some(b=>Math.hypot(x-b.x,z-b.z)<b.len/2+16);
  const flatAt=(x,z,w,d)=>{let mn=1e9,mx=-1e9;for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const h=T.h(x+a*w/2,z+b*d/2);mn=Math.min(mn,h);mx=Math.max(mx,h)}return[mn,mx]};
  const roadNear=(x,z)=>T.kind(x,z)===6||T.kind(x+4,z)===6||T.kind(x-4,z)===6||T.kind(x,z+4)===6||T.kind(x,z-4)===6;
  const siteNear2=(x,z,k)=>SITES.some(s=>Math.hypot(x-s.x,z-s.z)<s.r*k)||(x<-270&&Math.abs(z+30)<110);
  const cabins=[];for(let n=0;n<1500&&cabins.length<16;n++){const x=R(-330,330),z=R(-330,330);if(Math.hypot(x,z)>340)continue;const[mn,mx]=flatAt(x,z,12,11),k=T.kind(x,z);
    if(mn<WLV+1.6||mx-mn>.5||nearSite(x,z,26)||siteNear2(x,z,1)||k===6||k===0||k===4||k===5||roadNear(x,z)||cabins.some(c=>Math.hypot(c[0]-x,c[1]-z)<70))continue;cabins.push([x,z]);
    wb(x,z,12,11,mx-mn+.8,0x7a7468,mn-.8);house(x,z,9+2*(n%2),8,mx,{tier:1,col:pick([0x9a7448,0xb89a6a,0xc9c4b8])})}
  let gs=0;for(const rd of T.roads){if(gs>=4)break;for(let tries=0;tries<12;tries++){const p=rd[Math.floor(R(.2,.8)*rd.length)];const x=p[0]+R(10,16)*(rnd()<.5?-1:1),z=p[1]+R(10,16)*(rnd()<.5?-1:1);
    const[mn,mx]=flatAt(x,z,16,22);if(mn<WLV+1.6||mx-mn>.5||nearSite(x,z,24)||insideFP(x,z,12)||roadNear(x,z))continue;
    wb(x,z,18,24,mx-mn+.8,0x6a6e72,mn-.8);shop(x,z,12,8,mx,{tier:1,col:0xe0e0e0});wb(x,z+12,10,6,.4,0xc9342b,mx+4.2);for(const q of[-4,4])wb(x+q,z+9.5,.6,.6,4.2,0x666,mx);for(const q of[-2.5,2.5])wb(x+q,z+12,1,.8,1.6,0x2a2a2a,mx);fp(x,z+6,14,22,'gas');gs++;break}}
  const{n2}=mkNoise(31);
  let nt=0;for(let x=-345;x<345;x+=9)for(let z=-345;z<345;z+=9){const px=x+R(-3,3),pz=z+R(-3,3),k=T.kind(px,pz);if(k!==2&&k!==3&&k!==9)continue;const sl=T.slope(px,pz),h=T.h(px,pz);if(sl>.5||h<WLV+1.4)continue;
    const fd=n2(px*.011+9,pz*.011+4);if(fd<(k===9?.5:.67)||rnd()<.12||siteNear2(px,pz,.95)||roadNear(px,pz)||insideFP(px,pz,3)||nearSite(px,pz,-2))continue;
    const pine=h>16||rnd()<.35,gc=pick([0x2f6b2f,0x3a7a38,0x2a5a2a]);wb(px,pz,.9,.9,5,0x6b4a2a,h-.6);
    if(pine){wb(px,pz,4.6,4.6,2.2,gc,h+2.4,true);wb(px,pz,2.8,2.8,2.2,gc,h+4.4,true);wb(px,pz,1.2,1.2,1.4,gc,h+6.4,true)}else wb(px,pz,5.2,5.2,3,gc,h+3.4,true);nt++;if(nt>1300)break}
  let nr=0;for(let x=-345;x<345;x+=13)for(let z=-345;z<345;z+=13){const px=x+R(-5,5),pz=z+R(-5,5),k=T.kind(px,pz);if(k!==4&&k!==5)continue;if(T.slope(px,pz)<.3||rnd()<.7||siteNear2(px,pz,.95))continue;
    const h=T.h(px,pz),n=RI(1,3);for(let q=0;q<n;q++){const sz=R(2.2,6),hh=R(1.6,4.5),rx=px+R(-3,3),rz=pz+R(-3,3);wb(rx,rz,sz,sz*R(.7,1.3),hh,pick([0x8a867c,0x77736a,0x9a968c]),T.h(rx,rz)-1.4);if(h>38)wb(rx,rz,sz*.8,sz*.8,.5,0xf1f4f6,T.h(rx,rz)-1.4+hh)}nr++}
  for(let n=0;n<600&&LOOT.length<LOOT.length+1;n++){if(n>=40)break;const x=R(-330,330),z=R(-330,330),h=T.h(x,z);if(h<WLV+2||T.slope(x,z)>.3||insideFP(x,z,2)||T.kind(x,z)===0)continue;LOOT.push([x,z,h,1])}
  return{terrain:T,mesh:terrMesh(T),b:B,glass:G,doors:D,loot:LOOT,fp:FP,stairs:STR,pois:SITES,counts:{trees:nt,rocks:nr,cabins:cabins.length,gas:gs}}}

const MAPS={
 blockout:{name:'Blockout',sky:0xc3d6e2,floor:0xd8c498,spawn:[0,26],ts:[[-12,-26],[-4,-26],[4,-26],[12,-26],[0,-24]],
  wp:[[-24,-22],[0,-22],[24,-12],[-24,-12],[-26,24],[26,24],[0,-14],[0,-4],[-12,0],[12,0],[0,24],[-12,12],[12,22]],
  b:[...out(cW),[-10,-8,16,1,4,cW],[10,-8,16,1,4,cW],[-20,8,1,14,4,cD],[20,8,1,14,4,cD],[0,16,14,1,4,cD],[-12,-18,6,1,3,cD],[12,-18,6,1,3,cD],[-5,-2,2,2,2,cC],[-3.2,-2.9,1.4,1.4,1,cC],[6,-3,2,2,2,cC],[0,8,3,3,1,cC],[-24,-15,2,2,2,cC],[24,-15,2,2,2,cC],[14,10,2,2,2,cC],[24,-24,8,8,1,cD],[18.5,-24,2,4,.5,cD]]},
 mansion:{name:'Mansion',surf:'grass',sky:0xaec3d8,floor:0x93a87a,spawn:[0,26],ts:[[-11,-21],[11,-21],[-11,-10],[11,-10],[0,-22]],
  wp:[[-11,-21],[11,-21],[-11,-10],[11,-10],[0,-22],[0,-8],[-24,-12],[24,-12],[-20,4],[20,4],[0,4],[0,16],[-22,18],[22,18]],
  b:[...out(0x8f9a7a),
   ...fw(0,true),...fw(3.3,false),...wl('x',-6,-16,16,[[-7.5,3],[0,4],[7.5,3]],3.3),...wl('x',-24,-16,16,[[-8,3],[0,3],[8,3]],3.3),...wl('z',-16,-24,-6,[[-20,3],[-15,3],[-10,3]],3.3),...wl('z',16,-24,-6,[[-20,3],[-15,3],[-10,3]],3.3),
   [-12.5,-6,7,1,3,cR],[-7.5,-6,3,1,1,cR],[-7.5,-6,3,1,.8,cR,2.2],[-4,-6,4,1,3,cR],[4,-6,4,1,3,cR],[7.5,-6,3,1,1,cR],[7.5,-6,3,1,.8,cR,2.2],[12.5,-6,7,1,3,cR],
   ...stairs,
   [-8.8,-15,14.4,18,.3,cF,3],[8.8,-15,14.4,18,.3,cF,3],[0,-21,3.2,6,.3,cF,3],[0,-8,3.2,4,.3,cF,3],[0,-15,34,20,.4,cT,6.3],
   [-10,-16,3,1.5,1,cK],[10,-16,3,1.5,1,cK],[-12,-8.5,2,2,.8,cK],[12,-8.5,2,2,.8,cK],[-12,-21,3,2,.8,cK,3.3],[12,-21,3,2,.8,cK,3.3],
   [-20,0,10,1,1.6,cH],[20,0,10,1,1.6,cH],[-20,20,10,1,1.6,cH],[20,20,10,1,1.6,cH],[0,10,3,3,1.2,0x9aa8b0],[24,10,6,6,3,cR],
   [-26,10,1.4,1.4,4.5,cK],[-26,-10,1.4,1.4,4.5,cK],[26,-10,1.4,1.4,4.5,cK],[-8,18,2,2,2,cC],[8,18,2,2,2,cC]]},
 dust2x2:{name:'Dust 2 (B half)',sky:0xe3d3a8,floor:0xd5bf8a,spawn:[10,-18],ts:[[8,24],[3,26],[-2,26],[12,26],[5,20]],
  wp:[[-27,8],[-27,-6],[-27,-14],[-20,-23],[-18,-12],[-18,0],[-12,6],[-5,6],[3,8],[-4,-2],[4,-2],[0,-5],[-6,-14],[-4,-22],[2,-12],[10,-20],[10,-12],[-8,-18],[-8,22],[-20,18],[0,16]],
  b:[[0,-30.5,62,1,7,cW],[0,30.5,62,1,7,cW],[-30.5,0,1,62,7,cW],[14.5,0,1,62,7,cW],
   [-24,-4,1,12,5,cD],[-24,10,1,8,5,cD],[-24,4,1,4,.5,cD],[-16,-5,16,1,5,cD],[-8,-6.5,1,3,5,cD],[-8,4.5,1,11,5,cD],
   [10.5,2,8,20,5,cD],[-9.75,-8,5.5,1,5,cD],[-2,-8,3,1,5,cD],[4.75,-8,3.5,1,5,cD],
   [6.5,-27,1,6,5,cK2],[6.5,-10,1,4,5,cK2],[10.5,-19,8,22,.4,cK2,4.6],
   [-18.25,-10,11.5,1,5,cD],[-12.5,-26.25,1,7.5,5,cD],[-12.5,-19,1,1,5,cD],...wl('z',-12.5,-15.5,-8,[[-12.25,3]],0,cD),
   [-27,-25,6,6,1.2,cD],[-22.5,-24,3,3,.6,cD],[-19,-18,3,3,2,cC],[-21,-13,3,2,1.5,cG],[-15,-14,2,2,1,cC],[-26,-17,2,2,1,cC],
   [0,2,3,3,1.8,cC],[-3,8,1.5,1.5,1.2,cC],[-4,-14,2,2,1.5,cC],[2,-20,3,2,1,cC],
   [-26,20,2,2,2,cC],[-22,24,2,2,1.5,cC],[-16,18,3,1,1.2,cC],[6,22,3,2,1.5,cG],[10,17,2,2,2,cC],[-4,24,2,2,1.2,cC]]},
 dust2x2a:{name:'Dust 2x2',sky:0xAEC1D4,floor:0xE2C99D,spawn:[-20,-16],ts:[[2,27],[6,25],[10,27],[14,27],[16,25]],
  wp:[[-20,-24],[-14,-18],[-26,-20],[-8,-19],[8,-20],[14,-12],[24,-14],[22,-24],[6,-24],[18,-3],[18,2],[20,7],[16,12],[22,19],[16,20],[20,28.5],[5,18],[5,6],[5,-2],[3,25],[8,25]],
  b:D2X2A_BOXES},
 br:{name:'Battle Royale',hidden:true,inst:true,half:BRH,size:900,sky:0x9cc3e6,floor:0x86a266,fogN:160,fogF:820,far:1500,spawn:[0,0],ts:[[0,0]],wp:[[0,0]],surf:'grass',gen:genWorld}
};
MAPS.dust2=(()=>{const A=MAPS.dust2x2a,B=MAPS.dust2x2,sh=a=>[a[0]-45,...a.slice(1)];
  const Ab=A.b.filter(a=>!(a[2]===62&&a[3]===1)&&!(a[2]===1&&a[3]===62)&&!(a[0]===-15&&a[1]===10&&a[2]===30));
  return{name:'Dust 2',sky:0xAEC1D4,floor:0xE2C99D,fw:107,fd:62,cx:-22.5,spawn:A.spawn,ts:[[2,27],[10,27],[16,25],[-37,24],[-42,26]],
   wp:[...A.wp,...B.wp.map(([x,z])=>[x-45,z]),[-31,22],[-31,-20],[-15,22]],
   b:[[-22.5,-30.5,107,1,7,cW],[-22.5,30.5,107,1,7,cW],[-75.5,0,1,62,7,cW],[30.5,0,1,62,7,cW],[-30.5,-29,1,4,7,cW],[-30.5,1,1,28,7,cW],[-30.5,30,1,2,7,cW],
    [-15,2,30,24,5,0xD3B785,0],...Ab,...B.b.slice(4).map(sh)]}})();
delete MAPS.dust2x2;delete MAPS.dust2x2a;
const glassMat=new THREE.MeshPhongMaterial({color:0x9fd8ff,transparent:true,opacity:.3,shininess:100,specular:0xffffff,depthWrite:false}),doorMats={},unitGeo=new THREE.BoxGeometry(1,1,1);
function addGlass(g){const[x,z,w,d,h,y]=g,b={min:[x-w/2,y,z-d/2],max:[x+w/2,y+h,z+d/2],glass:true,gi:GL.length};boxes.push(b);const m=new THREE.Mesh(unitGeo,glassMat);m.scale.set(w,h,d);m.position.set(x,y+h/2,z);mapG.add(m);GL.push({b,m})}
function addDoor(o){const{ax,c,m,w,y,h}=o,x=ax==='x'?m:c,z=ax==='x'?c:m,b={min:ax==='x'?[m-w/2,y,c-.07]:[c-.07,y,m-w/2],max:ax==='x'?[m+w/2,y+h,c+.07]:[c+.07,y+h,m+w/2],door:true};boxes.push(b);
  const grp=new THREE.Group();grp.position.set(ax==='x'?m-w/2:c,y,ax==='x'?c:m-w/2);const th0=ax==='x'?0:-Math.PI/2;grp.rotation.y=th0;
  const mat=doorMats[o.col]||(doorMats[o.col]=new THREE.MeshLambertMaterial({color:o.col})),mesh=new THREE.Mesh(unitGeo,mat);mesh.scale.set(w,h,.12);mesh.position.set(w/2,h/2,0);grp.add(mesh);
  const kn=new THREE.Mesh(unitGeo,doorMats.k||(doorMats.k=new THREE.MeshLambertMaterial({color:0xc9a227})));kn.scale.set(.1,.1,.2);kn.position.set(w-.2,h*.45,0);grp.add(kn);
  mapG.add(grp);DR.push({b,g:grp,th0,ax,sgn:1,a:0,tgt:0,t:0,x,z,y,r2:(w/2+1.5)*(w/2+1.5)})}
let dTick=0;
let doorFocus=null;
// the door you are facing (or standing right next to), for the E key and the on-screen prompt
function findDoor(){if(dead)return null;let best=null,bs=0;const cp=Math.cos(pitch),fx=-Math.sin(yaw)*cp,fz=-Math.cos(yaw)*cp,fl=Math.hypot(fx,fz)||1;
  for(const d of DR){const dx=d.x-P.x,dz=d.z-P.z,dist=Math.hypot(dx,dz);if(dist>2.6||Math.abs(P.y-d.y)>2.4)continue;const dot=dist>.01?(dx*fx+dz*fz)/(dist*fl):1;if(dist>1.3&&dot<.3)continue;const sc=dist-dot;if(!best||sc<bs){best=d;bs=sc}}return best}
// a door will not shut on somebody standing in the doorway
function doorBlocked(d){const k=d.b,m=.45,hit=a=>(a===P||a.hp>0)&&Math.abs(a.y-d.y)<2.8&&a.x>k.min[0]-m&&a.x<k.max[0]+m&&a.z>k.min[2]-m&&a.z<k.max[2]+m;return hit(P)||bots.some(b=>b.hp>0&&hit(b))}
function useDoor(){const d=findDoor();if(!d)return;
  if(d.tgt){if(doorBlocked(d))return;d.tgt=0;d.lockP=true}
  else{if(d.a<.02){const side=d.ax==='x'?Math.sign(P.z-d.z)||1:Math.sign(P.x-d.x)||1;d.sgn=d.ax==='x'?side:-side}d.tgt=1;d.lockP=false}
  doorSnd()}
function doorsTick(dt){if(!DR.length){doorFocus=null;return}dTick+=dt;if(dTick<.05)return;const st=dTick;dTick=0;const acts=bots.filter(b=>b.hp>0);if(!dead)acts.push(P);doorFocus=findDoor();
  for(const d of DR){
    if(d.lockP&&Math.hypot(P.x-d.x,P.z-d.z)>Math.sqrt(d.r2)+.8)d.lockP=false;
    if(d.tgt===0){let who=null,bd=d.r2;for(const a of acts){if(a===P&&d.lockP)continue;const dx=a.x-d.x,dz=a.z-d.z,q=dx*dx+dz*dz;if(q<bd&&Math.abs(a.y-d.y)<2.8){bd=q;who=a}}
      if(who){if(d.a<.02){const side=d.ax==='x'?Math.sign(who.z-d.z)||1:Math.sign(who.x-d.x)||1;d.sgn=d.ax==='x'?side:-side}d.tgt=1;if(dx2(d))doorSnd()}}
    if(d.a!==d.tgt){d.a+=Math.sign(d.tgt-d.a)*Math.min(Math.abs(d.tgt-d.a),st*3.2);d.g.rotation.y=d.th0+d.sgn*d.a*1.5708;d.b.off=d.a>.5}}}
function dx2(d){return Math.hypot(d.x-P.x,d.z-P.z)<30}
function doorSnd(){stepThump(110,70,.12,.12*stepVol)}
function glassSnd(){stepNoise(.26*Math.max(.3,stepVol+.4),.22,3200,.003);stepNoise(.16,.18,2200,.005,.04);stepThump(900,500,.06,.04)}
function breakGlass(b){if(b.off)return;b.off=true;const g=GL[b.gi];g.m.visible=false;glassSnd();
  const cx=(b.min[0]+b.max[0])/2,cy=(b.min[1]+b.max[1])/2,cz=(b.min[2]+b.max[2])/2;
  for(let i=0;i<8;i++){const m=new THREE.Mesh(unitGeo,glassMat);m.scale.set(.14,.14,.02);m.position.set(cx+(Math.random()-.5)*(b.max[0]-b.min[0]),cy+(Math.random()-.5)*(b.max[1]-b.min[1]),cz+(Math.random()-.5)*(b.max[2]-b.min[2]));scene.add(m);shards.push({m,vx:(Math.random()-.5)*3,vy:Math.random()*2,vz:(Math.random()-.5)*3,t:1.1})}}
function shatter(o,d,len){let gb=0;for(let i=0;i<4;i++){const q=[o[0]+d[0]*gb,o[1]+d[1]*gb,o[2]+d[2]*gb],t=wallT(q,d,len-gb);if(HB&&HB.glass&&t<len-gb){breakGlass(HB);gb+=t+.06}else break}}
function loadMap(n,reset){const m=MAPS[n];if(m.gen&&!m.b)Object.assign(m,m.gen());
  while(mapG.children.length)mapG.remove(mapG.children[0]);for(const q of shards)scene.remove(q.m);shards.length=0;boxes.length=0;waterMs.length=0;DR.length=0;GL.length=0;
  TERR=m.terrain||null;WATERS=m.lakes||[];DSURF=m.surf||'dust';
  SURF=m.b.filter(a=>a[7]&&a[4]<=.02&&SURFC[a[5]]).map(a=>({x0:a[0]-a[2]/2,x1:a[0]+a[2]/2,z0:a[1]-a[3]/2,z1:a[1]+a[3]/2,y:a[6],s:SURFC[a[5]]})).sort((u,v)=>v.y-u.y);
  scene.background.set(m.sky);scene.fog.color.set(m.sky);scene.fog.near=m.fogN||25;scene.fog.far=m.fogF||95;cam.far=m.far||200;cam.updateProjectionMatrix();
  if(TERR){mapG.add(m.mesh);const wm=new THREE.Mesh(new THREE.PlaneGeometry(2*BRH+1200,2*BRH+1200),new THREE.MeshPhongMaterial({color:0x3f88c8,transparent:true,opacity:.74,shininess:90,specular:0x99ccff}));wm.rotation.x=-Math.PI/2;wm.position.y=-.05;wm.userData.y0=-.05;mapG.add(wm);waterMs.push(wm)}
  else{const f=new THREE.Mesh(floorGeo(m),new THREE.MeshLambertMaterial({color:m.floor}));f.rotation.x=-Math.PI/2;f.position.x=m.cx||0;mapG.add(f);
    const g=new THREE.GridHelper(m.fw||m.size||62,(m.fw||m.size||62)/2,0x8f8a70,0xa9a487);g.position.y=.01;g.position.x=m.cx||0;g.scale.z=(m.fd||m.size||62)/(m.fw||m.size||62);mapG.add(g)}
  useInst=!!m.inst&&!!(THREE.InstancedMesh&&THREE.InstancedMesh.prototype.setColorAt);for(const a of m.b)box(...a);
  if(m.glass)for(const g of m.glass)addGlass(g);if(m.doors)for(const d of m.doors)addDoor(d);if(m.lakes)for(const l of m.lakes)lakeBox(l);flushBoxes();useInst=false;gridBuild();
  MM=m.terrain?buildMini(m):null;WPTS=m.wp;SPAWN=m.spawn;TSP=m.ts;
  if(reset){round=0;rw=rl=kills=deaths=0;money=800;dead=true;newRound()}}
loadMap('blockout');

/* ---------- Math helpers ---------- */
function rayBox(o,d,mn,mx){let t0=0,t1=1e9;
  for(let i=0;i<3;i++){const inv=1/(d[i]||1e-9);let a=(mn[i]-o[i])*inv,b=(mx[i]-o[i])*inv;
    if(a>b){const t=a;a=b;b=t}if(a>t0)t0=a;if(b<t1)t1=b;if(t0>t1)return Infinity}
  return t0}
function gkey(i,j){return (i+2048)*4096+(j+2048)}
function gridBuild(){GR=new Map();for(const b of boxes){b.s=0;const i0=Math.floor(b.min[0]/GC),i1=Math.floor(b.max[0]/GC),j0=Math.floor(b.min[2]/GC),j1=Math.floor(b.max[2]/GC);
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const k=gkey(i,j);let a=GR.get(k);if(!a){a=[];GR.set(k,a)}a.push(b)}}}
function near(x,z,r){const i0=Math.floor((x-r)/GC),i1=Math.floor((x+r)/GC),j0=Math.floor((z-r)/GC),j1=Math.floor((z+r)/GC);
  if(i0===i1&&j0===j1)return GR.get(gkey(i0,j0))||EMPTY;const out=[];for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const a=GR.get(gkey(i,j));if(a)for(const b of a)out.push(b)}return out}
function wallT(o,d,maxT,noGlass){maxT=maxT||1e4;let t=Infinity;HB=null;
  if(TERR){const f=terrT(o,d,Math.min(maxT,1500));if(f<t)t=f}else if(d[1]<0){const f=-o[1]/d[1];if(f<t)t=f}
  const qi=++qid,dx=d[0],dz=d[2],ax=Math.abs(dx)<1e-9,az=Math.abs(dz)<1e-9;let i=Math.floor(o[0]/GC),j=Math.floor(o[2]/GC);
  const sx=dx>0?1:-1,sz=dz>0?1:-1,tdx=ax?1e9:GC/Math.abs(dx),tdz=az?1e9:GC/Math.abs(dz);
  let tx=ax?1e9:(dx>0?((i+1)*GC-o[0]):(i*GC-o[0]))/dx,tz=az?1e9:(dz>0?((j+1)*GC-o[2]):(j*GC-o[2]))/dz;
  for(let n=0;n<4000;n++){const a=GR.get(gkey(i,j));
    if(a)for(const b of a){if(b.s===qi)continue;b.s=qi;if(b.off||(noGlass&&b.glass))continue;const r=rayBox(o,d,b.min,b.max);if(r<t){t=r;HB=b}}
    const nx=tx<tz?tx:tz;if(t<=nx||nx>maxT)break;if(tx<tz){i+=sx;tx+=tdx}else{j+=sz;tz+=tdz}}
  return t}
function hitBox(p,b){return !b.off&&p.x+R>b.min[0]&&p.x-R<b.max[0]&&p.y+(p.h||H)>b.min[1]&&p.y<b.max[1]&&p.z+R>b.min[2]&&p.z-R<b.max[2]}
function move(p,v,dt){const g0=p.g,half=TERR?TERR.half-3:1e9;
  let ox=p.x;p.x+=v.x*dt;for(const b of near(p.x,p.z,R+.6))if(hitBox(p,b)){if(p.g&&b.max[1]-p.y<=.55){const y0=p.y;p.y=b.max[1]+1e-4;if(!near(p.x,p.z,R+.6).some(q=>hitBox(p,q)))continue;p.y=y0}p.x=v.x>0?b.min[0]-R-1e-4:b.max[0]+R+1e-4;v.x=0}
  if(TERR){if(Math.abs(p.x)>half)p.x=Math.max(-half,Math.min(half,p.x));const nf=TERR.h(p.x,p.z);if(nf-p.y>Math.abs(p.x-ox)*1.2+.12||(nf<WLV-1.4&&nf<TERR.h(ox,p.z))){p.x=ox;v.x=0}}
  let oz=p.z;p.z+=v.z*dt;for(const b of near(p.x,p.z,R+.6))if(hitBox(p,b)){if(p.g&&b.max[1]-p.y<=.55){const y0=p.y;p.y=b.max[1]+1e-4;if(!near(p.x,p.z,R+.6).some(q=>hitBox(p,q)))continue;p.y=y0}p.z=v.z>0?b.min[2]-R-1e-4:b.max[2]+R+1e-4;v.z=0}
  if(TERR){if(Math.abs(p.z)>half)p.z=Math.max(-half,Math.min(half,p.z));const nf=TERR.h(p.x,p.z);if(nf-p.y>Math.abs(p.z-oz)*1.2+.12||(nf<WLV-1.4&&nf<TERR.h(p.x,oz))){p.z=oz;v.z=0}}
  p.g=false;p.y+=v.y*dt;
  for(const b of near(p.x,p.z,R+.6))if(hitBox(p,b)){if(v.y<=0){p.y=b.max[1]+1e-4;p.g=true}else p.y=b.min[1]-(p.h||H)-1e-4;v.y=0}
  const fy=floorY(p.x,p.z);if(p.y<=fy){p.y=fy;if(v.y<0)v.y=0;p.g=true}else if(g0&&!p.g&&v.y<=0&&p.y-fy<.45){p.y=fy;v.y=0;p.g=true}
}
function accel(v,wx,wz,cap,rate,dt){const add=cap-(v.x*wx+v.z*wz);if(add<=0)return;const a=Math.min(rate*dt,add);v.x+=a*wx;v.z+=a*wz}

/* ---------- Audio ---------- */
let AC;function initAudio(){if(!AC)try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}
function snd(vol,dur,freq){if(!AC)return;const n=AC.sampleRate*dur|0,b=AC.createBuffer(1,n,AC.sampleRate),d=b.getChannelData(0);
  for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);
  const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=b;f.type='lowpass';f.frequency.value=freq;g.gain.value=vol;
  s.connect(f);f.connect(g);g.connect(AC.destination);s.start()}

/* ---------- Effects ---------- */
const fx=[];
function tracer(a,b,col){const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]);
  const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:col,transparent:true}));scene.add(l);fx.push({m:l,t:.07,max:.07})}
function mark(p){const m=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,.12),new THREE.MeshBasicMaterial({color:0x2b2418}));
  m.position.set(...p);scene.add(m);fx.push({m,t:4,max:0});if(fx.length>120){const o=fx.shift();scene.remove(o.m)}}

/* ---------- Viewmodel ---------- */
const gun=new THREE.Group();
const mt=c=>new THREE.MeshLambertMaterial({color:c}),gm=mt(0x3a3f44),wm=mt(0x7a4a22),dm=mt(0x1d2024),om=mt(0x3d4a36);
const glass=new THREE.MeshPhongMaterial({color:0x7fd0ff,transparent:true,opacity:.4,shininess:120,specular:0xffffff});
function bx(g,w,h,d,x,y,z,m,rx){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);if(rx)o.rotation.x=rx;g.add(o);return o}
function cy(g,r,l,x,y,z,m){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,l,16),m);o.rotation.x=Math.PI/2;o.position.set(x,y,z);g.add(o);return o}
const VM={pistol:new THREE.Group(),rifle:new THREE.Group(),awp:new THREE.Group()},FZ={pistol:-.2,rifle:-.62,awp:-.9},MG={},BOLTS={},BULS={},VMO={};let BOLT,BUL;
{const g=VM.pistol;bx(g,.045,.065,.24,0,0,-.04,gm);bx(g,.04,.11,.055,0,-.075,.05,dm,.25);bx(g,.02,.02,.05,0,-.045,-.01,dm);cy(g,.01,.1,0,.005,-.2,dm);MG.pistol=bx(g,.034,.05,.04,0,-.125,.065,mt(0x8a8d90),.25);MG.pistol.userData.y=-.125}
{const g=VM.rifle;bx(g,.06,.085,.36,0,0,-.05,gm);bx(g,.068,.06,.3,0,-.005,-.35,wm);cy(g,.011,.34,0,.02,-.52,dm);MG.rifle=bx(g,.038,.15,.07,0,-.11,-.1,dm,.3);MG.rifle.userData.y=-.11;bx(g,.05,.1,.26,0,-.015,.28,wm);bx(g,.04,.1,.05,0,-.085,.1,wm,.3);bx(g,.01,.04,.01,0,.05,-.62,dm)}
{const g=VM.awp;bx(g,.06,.09,.5,0,0,0,om);cy(g,.014,.62,0,.015,-.56,dm);cy(g,.022,.06,0,.015,-.9,dm);bx(g,.05,.12,.38,0,-.025,.4,om);bx(g,.035,.12,.05,0,-.08,.14,om,.2);BOLT=bx(g,.07,.015,.015,.05,.02,.1,dm);
  bx(g,.02,.04,.03,0,.065,-.1,dm);bx(g,.02,.04,.03,0,.065,.06,dm);cy(g,.028,.3,0,.105,-.02,dm);cy(g,.038,.07,0,.105,-.19,dm);cy(g,.034,.004,0,.105,-.227,glass);cy(g,.024,.004,0,.105,.132,glass)}
BUL=new THREE.Group();cy(BUL,.008,.05,0,0,0,mt(0xc9a227));cy(BUL,.006,.03,0,0,-.04,mt(0xb87333));BUL.visible=false;VM.awp.add(BUL);MG.awp=bx(VM.awp,.035,.11,.07,0,-.1,.12,dm,.1);MG.awp.userData.y=-.1;
gun.add(VM.pistol,VM.rifle,VM.awp);
function clone(id,base,sc,col){const g=VM[base].clone(true);g.scale.setScalar(sc);if(col)g.traverse(o=>{if(o.isMesh&&(o.material===wm||o.material===om))o.material=mt(col)});VM[id]=g;gun.add(g);MG[id]=g.children[VM[base].children.indexOf(MG[base])];FZ[id]=FZ[base]*sc;if(base==='awp'){BOLTS[id]=g.children[VM.awp.children.indexOf(BOLT)];BULS[id]=g.children[VM.awp.children.indexOf(BUL)]}}
const OPT={rd:{n:'Red dot sight',s:'Red dot',fov:60,sens:.85},ho:{n:'Holographic sight',s:'Holo',fov:56,sens:.8},x2:{n:'2x scope',s:'2x',fov:38,sens:.6},x4:{n:'4x ACOG scope',s:'4x',fov:22,sens:.4}},OPTK=['rd','ho','x2','x4'];
{const bk=mt(0x151719),lens=t=>new THREE.MeshBasicMaterial({color:t==='rd'?0xff4030:t==='ho'?0xff6a50:0x7fb8ff,transparent:true,opacity:.8});
  window.mkOptic=t=>{const g=new THREE.Group(),l=lens(t);
    if(t==='rd'){bx(g,.03,.012,.08,0,.006,0,bk);bx(g,.036,.045,.016,0,.034,.03,bk);bx(g,.036,.012,.07,0,.06,0,bk);bx(g,.026,.034,.004,0,.036,-.03,l)}
    else if(t==='ho'){bx(g,.04,.012,.09,0,.006,0,bk);bx(g,.006,.05,.07,-.02,.037,0,bk);bx(g,.006,.05,.07,.02,.037,0,bk);bx(g,.046,.008,.07,0,.066,0,bk);bx(g,.034,.04,.004,0,.04,-.034,l)}
    else if(t==='x2'){bx(g,.03,.02,.08,0,.012,0,bk);cy(g,.02,.14,0,.045,0,bk);cy(g,.026,.03,0,.045,-.08,bk);cy(g,.017,.003,0,.045,-.097,l);cy(g,.015,.003,0,.045,.071,l)}
    else{bx(g,.04,.03,.1,0,.018,0,bk);cy(g,.026,.17,0,.052,0,bk);cy(g,.034,.04,0,.052,-.1,bk);cy(g,.02,.04,0,.052,.1,bk);cy(g,.03,.003,0,.052,-.121,l);cy(g,.014,.003,0,.052,.121,l);cy(g,.006,.12,0,.088,0,mt(0xff9a2a))}
    return g};
  for(const t of OPTK){const g=window.mkOptic(t);g.name='opt_'+t;g.position.set(0,.045,-.12);g.visible=false;VM.rifle.add(g)}}
clone('scout','awp',.85,0x4a3a28);clone('svd','awp',.95,0x6a4a28);clone('g3','awp',1,0x2a2c2e);clone('kar','awp',1,0x5a3a20);clone('m82','awp',1.25,0x55584f);BOLTS.awp=BOLT;BULS.awp=BUL;
clone('glock','pistol',.95,0);clone('deagle','pistol',1.3,0);clone('m3','rifle',1.05,0x2a1c10);clone('mp5','rifle',.75,0x1c1e20);clone('p90','rifle',.7,0x1c1e20);clone('m4','rifle',1,0x25282b);
// iron sights are part of the guns: aiming without an optic raises the gun until the tip of the front sight sits on the aim point (TIP = its height above the gun origin)
const TIP={};
{const dk=mt(0x0e0e0e),arcM=(g,r,t,y,z,arc)=>{const m=new THREE.Mesh(new THREE.TorusGeometry(r,t,6,18,arc||Math.PI*2),dk);m.position.set(0,y,z);if(arc)m.rotation.z=Math.PI;g.add(m)};
  for(const id of ['rifle','m4','mp5','p90','m3'])TIP[id]=.07*VM[id].scale.x;
  for(const id of ['pistol','glock','deagle']){TIP[id]=.0455*VM[id].scale.x;const g=VM[id];bx(g,.006,.013,.008,0,.039,-.15,dk);bx(g,.009,.014,.01,-.012,.039,.07,dk);bx(g,.009,.014,.01,.012,.039,.07,dk)}
  // AK-47: the front post alone.  M4A1: rear peep ring round the post.  MP5: half-circle rear sight with the post standing in it.  P90: ring sight.  M3: bead.
  arcM(VM.m4,.016,.004,.07,.08);bx(VM.m4,.008,.012,.01,0,.048,.08,dk);
  arcM(VM.mp5,.018,.0035,.07,.06,Math.PI);bx(VM.mp5,.008,.008,.01,0,.0457,.06,dk);
  arcM(VM.p90,.02,.0025,.07,.03);bx(VM.p90,.005,.005,.005,0,.07,.03,dk);bx(VM.p90,.006,.005,.008,0,.045,.03,dk);
  {const b=new THREE.Mesh(new THREE.SphereGeometry(.0065,8,6),dk);b.position.set(0,.0735,-.62);VM.m3.add(b)}}
{const g=VM.knife=new THREE.Group(),steel=mt(0xb9c0c6);bx(g,.022,.075,.34,0,.012,-.2,steel);bx(g,.02,.05,.1,0,.0,-.42,steel);bx(g,.09,.03,.03,0,-.012,-.03,dm);bx(g,.035,.045,.16,0,-.016,.07,mt(0x2a2420));gun.add(g);FZ.knife=-.1}
for(const id of ['rifle','m3','mp5','p90','m4']){VMO[id]={};for(const t of OPTK)VMO[id][t]=VM[id].children.find(c=>c.name==='opt_'+t)}
let lob=false,grenHeld=false;const AIM_N=70,aimPos=new Float32Array(AIM_N*3),aimV=new Float32Array(AIM_N*6),aimGeo=new THREE.BufferGeometry(),aimVA=new THREE.BufferAttribute(aimV,3),aimIdx=[];let aimN=0;
for(let i=0;i<AIM_N-1;i++){const q=i*2;aimIdx.push(q,q+1,q+2,q+1,q+3,q+2)}
aimGeo.setAttribute('position',aimVA);aimGeo.setIndex(aimIdx);
const aimMesh=new THREE.Mesh(aimGeo,new THREE.MeshBasicMaterial({color:0xffe27a,depthTest:false,transparent:true,opacity:.92,side:THREE.DoubleSide}));aimMesh.frustumCulled=false;aimMesh.renderOrder=6;aimMesh.visible=false;scene.add(aimMesh);
const NC={he:0x3c5a3a,fl:0xd8d8d8,sm:0x7a8288},NV=new THREE.Mesh(new THREE.SphereGeometry(.05,12,10),new THREE.MeshLambertMaterial({color:0x3c5a3a}));NV.position.set(0,-.05,-.15);NV.visible=false;gun.add(NV);
let cycEnd=0,slashEnd=0;
const ss=(a,b,u)=>{const x=Math.min(1,Math.max(0,(u-a)/(b-a)));return x*x*(3-2*x)};
function boltPose(l,b){BOLT.rotation.z=.9*l;BOLT.position.set(.05,.02+.035*l,.1+.12*b)}
function animVM(){
  if(BOLTS[cw]){BOLT=BOLTS[cw];BUL=BULS[cw]}
  for(const k in VM){VM[k].position.set(0,0,0);VM[k].rotation.set(0,0,0)}
  for(const k in MG)MG[k].position.y=MG[k].userData.y;
  boltPose(0,0);BUL.visible=false;
  const vg=VM[cw];
  if(cw==='knife'){vg.rotation.set(.12,-.3,.5);vg.position.set(.02,.04,-.08);if(T<slashEnd){const u=1-(slashEnd-T)/.3,sn=Math.sin(u*Math.PI);vg.rotation.set(.12-1.0*sn,-.3+.9*sn,.5-1.6*sn);vg.position.set(.02-.16*sn,.04-.06*sn,-.08-.18*sn)}}
  if(reloading){
    const u=1-(reloadEnd-T)/WP.rt,o=ss(0,.18,u)-ss(.85,1,u);
    if(WP.bolt){
      vg.position.set(-.04*o,-.05*o,0);vg.rotation.set(.2*o,0,-.45*o);
      const op=ss(.12,.22,u)-ss(.85,.93,u);boltPose(op,op);
      const k=(u-.25)/.55;
      if(k>0&&k<1){const f=(k*3)%1;BUL.visible=true;BUL.position.set(.12*(1-f),.14-.085*f,.14);BUL.rotation.z=.6*(1-f)}
    }else{
      const p=cw==='pistol'?.7:1,m=MG[cw];
      vg.position.set(-.05*o,-.05*o-.015*Math.sin(Math.PI*ss(.65,.72,u)),.03*o);vg.rotation.set(.25*o,.2*o,-.55*o*p);
      m.position.y=m.userData.y-.28*(ss(.25,.4,u)-ss(.5,.65,u));
    }
  }else if(WP.bolt&&T<cycEnd){
    const u=1-(cycEnd-T)/WP.rate,lift=ss(.15,.28,u)-ss(.8,.92,u),back=ss(.3,.45,u)-ss(.65,.78,u),bf=ss(.42,.62,u);
    boltPose(lift,back);vg.rotation.z=-.05*lift;
    if(u>.42&&u<.66){BUL.visible=true;BUL.position.set(.12*(1-bf),.14-.085*bf,.14);BUL.rotation.z=.6*(1-bf)}
  }
}
function tone(f0,f1,dur,vol,type){if(!AC)return;const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime;o.type=type||'sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+dur)}
function fireSnd(){
  if(WP.snp){const big=cw==='m82';snd(big?1:.8,big?.7:.55,big?800:1100);snd(.5,.08,6000);tone(big?52:70,28,.5,.9,'sine');if(WP.bolt)for(const [ms,f] of [[350,700],[650,450],[1050,1000],[1300,300]])setTimeout(()=>tone(f,f*.5,.05,.3,'square'),ms)}
  else if(WP.pel){snd(.9,.3,1500);tone(90,35,.3,.8,'sine');setTimeout(()=>{tone(400,200,.05,.3,'square');tone(300,150,.06,.3,'square')},450)}
  else if(WP.sl===2){if(cw==='deagle'){snd(.7,.22,2500);tone(160,40,.2,.8,'triangle')}else{snd(.4,.09,4200);tone(260,70,.1,.35,'triangle')}}
  else if(WP.rate<.1){snd(.4,.07,5000);tone(300,120,.07,.3,'square')}
  else{snd(.5,.16,cw==='m4'?2800:2200);tone(cw==='m4'?160:130,45,.16,.5,'triangle')}
}
let stepD=0,wasW=false;const ripples=[];
function surfAt(x,z,y){if(TERR){if(waterF(x,z,y)>0)return'water';return TERR.surf(x,z)}if(y>10.5)return'snow';if(waterF(x,z,y)>0)return'water';for(const r of SURF)if(x>r.x0&&x<r.x1&&z>r.z0&&z<r.z1)return r.s;return DSURF}
let stepVol=.6,stepBus=null,stepBusFor=null;
function stepOut(){if(!stepBus||stepBusFor!==AC){stepBusFor=AC;stepBus=AC.createGain();stepBus.gain.value=1;
    if(AC.createDynamicsCompressor){const c=AC.createDynamicsCompressor();c.threshold.value=-26;c.knee.value=12;c.ratio.value=6;c.attack.value=.003;c.release.value=.15;stepBus.connect(c);c.connect(AC.destination)}else stepBus.connect(AC.destination)}
  return stepBus}
function stepNoise(vol,dur,f,att,at){if(!AC||vol<=0)return;const t=AC.currentTime+(at||0),n=Math.max(8,AC.sampleRate*dur|0),b=AC.createBuffer(1,n,AC.sampleRate),d=b.getChannelData(0);
  for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2);
  const src=AC.createBufferSource(),f1=AC.createBiquadFilter(),f2=AC.createBiquadFilter(),g=AC.createGain();src.buffer=b;
  f1.type=f2.type='lowpass';f1.frequency.value=f2.frequency.value=f;if(f1.Q)f1.Q.value=f2.Q.value=.5;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+att);g.gain.exponentialRampToValueAtTime(.0008,t+dur);
  src.connect(f1);f1.connect(f2);f2.connect(g);g.connect(stepOut());src.start(t)}
function stepThump(f0,f1,dur,vol,at){if(!AC||vol<=0)return;const t=AC.currentTime+(at||0),o=AC.createOscillator(),g=AC.createGain();
  o.type='sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.0008,t+dur);o.connect(g);g.connect(stepOut());o.start(t);o.stop(t+dur+.02)}
function stepSnd(s,v){if(!AC||v<=0)return;v=Math.min(v,1.2)*stepVol;const r=.85+Math.random()*.3;
  if(s==='dust'){stepNoise(.30*v,.10,1100*r,.006);stepThump(120*r,65,.09,.20*v)}
  else if(s==='grass'){stepNoise(.22*v,.14,720*r,.012)}
  else if(s==='snow'){stepNoise(.20*v,.07,1900*r,.008);stepNoise(.15*v,.07,1500*r,.008,.05);stepThump(95*r,60,.10,.10*v)}
  else if(s==='water'){stepNoise(.30*v,.26,650*r,.012);stepThump(230*r,110,.13,.13*v);stepNoise(.12*v,.12,900*r,.01,.09);stepThump(320*r,190,.10,.06*v,.11)}}
function ripple(x,z){if(ripples.length>30)return;const m=new THREE.Mesh(new THREE.RingGeometry(.15,.25,24),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.7,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.set(x,-.03,z);scene.add(m);ripples.push({m,t:0})}
function rclick(k){if(k==='out'){snd(.5,.07,1800);tone(220,90,.07,.5,'triangle')}else if(k==='in'){snd(.7,.06,3000);tone(420,160,.08,.6,'square')}else if(k==='slap'){snd(.6,.05,4500);tone(700,300,.05,.4,'square')}
  else if(k==='bolt'){tone(300,120,.09,.5,'sawtooth');snd(.5,.1,2500)}else if(k==='shell'){snd(.4,.04,3500);tone(900,500,.04,.4,'square')}else if(k==='pump'){snd(.7,.12,1500);tone(180,70,.12,.6,'triangle')}}
function reloadSeq(){const k=WP.rt/2.4,a=WP.bolt?[[500,'bolt'],[1000,'in'],[1500,'in'],[2000,'in'],[2800,'bolt']]:WP.pel?[[500,'shell'],[900,'shell'],[1300,'shell'],[1700,'shell'],[2100,'shell'],[2400,'pump']]:WP.sl===2?[[600,'out'],[1250,'in'],[1600,'slap']]:[[600,'out'],[1400,'in'],[1750,'slap'],[2050,'bolt']];return a.map(([ms,t])=>[ms*k,t])}
function rsnd(list){const w=cw;for(const [ms,t] of list)setTimeout(()=>{if(reloading&&cw===w)rclick(t)},ms)}
const flash=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,.08),new THREE.MeshBasicMaterial({color:0xffc94d}));
flash.position.z=-.34;flash.visible=false;gun.add(flash);
gun.position.set(.2,-.2,-.45);cam.add(gun);

/* ---------- State ---------- */
const P={x:0,y:0,z:26,g:true,h:1.8},V={x:0,y:0,z:0};
const WPN={pistol:{name:'USP',cost:0,mag:12,res:36,rate:.17,dmg:34,rec:.8,auto:false,rt:1.9,sl:2},glock:{name:'Glock 18',cost:400,mag:20,res:40,rate:.12,dmg:26,rec:.7,auto:false,rt:2.2,sl:2},deagle:{name:'Desert Eagle',cost:650,mag:7,res:35,rate:.3,dmg:62,rec:2.2,auto:false,rt:2.2,sl:2},m3:{name:'M3 Shotgun',cost:1700,mag:8,res:32,rate:.9,dmg:16,pel:8,rec:2,auto:false,rt:2.6,sl:1},mp5:{name:'MP5',cost:1500,mag:30,res:120,rate:.075,dmg:20,rec:.7,auto:true,rt:2.3,sl:1},p90:{name:'P90',cost:2350,mag:50,res:100,rate:.07,dmg:21,rec:.7,auto:true,rt:3,sl:1},rifle:{name:'AK-47',cost:2500,mag:30,res:90,rate:.1,dmg:28,rec:1,auto:true,rt:2.4,sl:1},m4:{name:'M4A1',cost:3100,mag:30,res:90,rate:.09,dmg:25,rec:.8,auto:true,rt:2.4,sl:1},awp:{name:'AWP',cost:4750,mag:10,res:30,rate:1.45,dmg:115,rec:2,auto:false,rt:3.2,sl:1}};
for(const [k,t] of Object.entries({pistol:'pst',glock:'pst',deagle:'pst',m3:'shl',mp5:'smg',p90:'smg',rifle:'rif',m4:'rif',awp:'snp'}))WPN[k].at=t;
const DIFF={easy:{n:'Easy',acc:.7,react:1.2,dmg:.7,spd:.9,hp:1,cool:1.3,fov:.8,mem:1,hunt:.25},normal:{n:'Normal',acc:1.5,react:.8,dmg:1.1,spd:1.05,hp:1,cool:.85,fov:1.2,mem:1.5,hunt:.45},hard:{n:'Hard',acc:2.2,react:.5,dmg:1.4,spd:1.2,hp:1.3,cool:.7,fov:1.8,mem:2.2,hunt:.65},insane:{n:'Insane',acc:3,react:.25,dmg:1.8,spd:1.35,hp:1.6,cool:.55,fov:4,mem:3,hunt:.85}};let D=DIFF.normal;
Object.assign(WPN,{scout:{name:'Scout',cost:2750,mag:10,res:30,rate:1.25,dmg:80,rec:1.4,auto:false,rt:2.8,sl:1},svd:{name:'SVD Dragunov',cost:3500,mag:10,res:30,rate:.5,dmg:70,rec:1.6,auto:false,rt:3,sl:1},g3:{name:'G3SG1',cost:5000,mag:20,res:40,rate:.28,dmg:58,rec:1.3,auto:false,rt:3.4,sl:1},kar:{name:'Kar98k',cost:3000,mag:5,res:25,rate:1.3,dmg:105,rec:1.8,auto:false,rt:3.6,sl:1},m82:{name:'Barrett M82',cost:6500,mag:5,res:15,rate:.95,dmg:150,rec:3,auto:false,rt:4.2,sl:1}});
Object.assign(WPN.awp,{bolt:true,zoom:20});Object.assign(WPN.scout,{bolt:true,zoom:28});Object.assign(WPN.svd,{zoom:24});Object.assign(WPN.g3,{zoom:22});Object.assign(WPN.kar,{bolt:true,zoom:26});Object.assign(WPN.m82,{zoom:14});
for(const k of ['awp','scout','svd','g3','kar','m82']){WPN[k].snp=true;WPN[k].at='snp'}
WPN.knife={name:'Knife',cost:0,mag:1,res:0,rate:.5,dmg:55,rec:0,auto:true,rt:0,sl:3,melee:true,at:'none'};
let armor=0,eye=1.62,shop=null,cg=null,fbang=0;let mode='casual',botN=5,lastMap='blockout',plv=0,brT0=0,sensMul=1;const nade={he:0,fl:0,sm:0},nades=[],smokes=[];
let cw='pistol',WP=WPN.pistol,owned={pistol:{mag:12,res:36},knife:{mag:1,res:0}},scoped=false,phase='buy',phaseEnd=10,round=1,money=800,rw=0,rl=0;
let yaw=0,pitch=0,punchP=0,punchY=0,hp=100,mag=12,res=36,reloading=false,reloadEnd=0;
let T=0,nextFire=0,lastShot=-9,shotIdx=0,dead=false,respawnAt=0,kills=0,deaths=0;
let mouse=false,playing=false,kick=0,flashT=0,bob=0,dmgFlash=0,hmT=0;
let wasCr=false,slideEnd=0,slideT0=0,slideCd=0,slideDir=[0,1],slideSp=8,runK=0,slK=0,adsK=0,slR=0;
const K={};
const PAL=[0x6b5a3a,0x3b3f45,0x5a3a32,0x39503f,0x4a4a2e],BW=['rifle','rifle','m4','m4','mp5','p90','awp','scout','svd','m3','glock','deagle','pistol'];
function mkBot(b){
  const g=b.mesh,mat=c=>new THREE.MeshLambertMaterial({color:c}),c=PAL[b.id%5],skin=0xd9a77d,dk=0x24262a,vest=0x2e3a33;
  const U=new THREE.Group();g.add(U);b.up=U;
  const add=(p,w,h,d,x,y,z,col)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(col));m.position.set(x,y,z);p.add(m);return m};
  add(U,.5,.2,.28,0,.92,0,dk);add(U,.5,.5,.3,0,1.2,0,c);add(U,.52,.38,.12,0,1.22,.13,vest);add(U,.52,.3,.1,0,1.25,-.13,vest);
  add(U,.1,.1,.08,-.15,1.08,.2,dk);add(U,.1,.1,.08,.15,1.08,.2,dk);add(U,.12,.08,.12,0,1.47,0,skin);
  add(U,.24,.26,.24,0,1.62,0,dk);add(U,.2,.06,.02,0,1.64,.125,skin);add(U,.27,.07,.27,0,1.77,0,c);add(U,.27,.04,.1,0,1.74,.17,c);
  for(const s of[-1,1]){
    const L=new THREE.Group();L.position.set(s*.13,.88,0);g.add(L);add(L,.18,.44,.21,0,-.22,0,c);
    const K=new THREE.Group();K.position.y=-.44;L.add(K);add(K,.15,.4,.18,0,-.2,0,c);add(K,.17,.1,.27,0,-.42,.04,dk);add(K,.19,.06,.2,0,-.12,.02,vest);
    b.legs.push(L);b.knees.push(K);
    const A=new THREE.Group();A.position.set(s*.32,1.4,0);A.rotation.set(-1.15,0,-s*.25);U.add(A);add(A,.13,.3,.15,0,-.15,0,c);
    const F=new THREE.Group();F.position.y=-.3;F.rotation.x=-.3;A.add(F);add(F,.11,.28,.13,0,-.14,0,c);add(F,.11,.09,.11,0,-.31,0,dk)}
  b.gunG=new THREE.Group();b.gunG.position.set(0,1.18,.3);U.add(b.gunG);
  b.cv=document.createElement('canvas');b.cv.width=256;b.cv.height=64;b.tex=srgbTex(new THREE.CanvasTexture(b.cv));
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:b.tex,transparent:true}));sp.scale.set(1.6,.4,1);sp.position.set(0,2.15,0);b.sp=sp;sp.visible=false;U.add(sp)}
function botGun(b){const G=b.gunG;while(G.children.length)G.remove(G.children[0]);const w=b.w,W=WPN[w];
  const add=(sx,sy,sz,z,y,c)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),new THREE.MeshLambertMaterial({color:c}));m.position.set(0,y,z);G.add(m)};
  if(W.snp){const L=w==='m82'?.95:w==='scout'?.6:.75;add(.07,.1,L,0,0,0x3d4a36);add(.03,.03,L*.7,L*.8,.02,0x1d2024);add(.06,.06,.3,0,.09,0x1d2024)}
  else if(W.pel){add(.07,.09,.6,.1,0,0x2a1c10);add(.04,.04,.35,.5,.02,0x1d2024)}
  else if(W.melee){add(.025,.07,.3,.2,0,0xb9c0c6);add(.03,.04,.1,.02,0,0x2a2420)}
  else if(W.sl===2){add(.05,.08,.22,.05,0,0x3a3f44)}
  else if(W.rate<.1){add(.06,.09,.4,.05,0,0x1c1e20);add(.04,.12,.05,0,-.1,0x1c1e20)}
  else{add(.06,.09,.5,.1,0,w==='rifle'?0x3a3f44:0x25282b);add(.07,.07,.25,.4,0,0x6b4a2a);add(.04,.14,.07,.05,-.1,0x1d2024)}}
function drawLabel(b){const x=b.cv.getContext('2d');x.clearRect(0,0,256,64);x.font='bold 30px sans-serif';x.textAlign='center';x.lineWidth=5;x.strokeStyle='#000';
  const t=b.name+' · '+WPN[b.w].name;x.strokeText(t,128,40);x.fillStyle='#ffcf5a';x.fillText(t,128,40);b.tex.needsUpdate=true}
function aimLabels(){if(dead)return;const cp=Math.cos(pitch),d=[-Math.sin(yaw)*cp,Math.sin(pitch),-Math.cos(yaw)*cp],o=[P.x,P.y+eye,P.z],wt=wallT(o,d);
  for(const b of bots){if(b.hp>0&&rayBox(o,d,[b.x-.35,b.y,b.z-.35],[b.x+.35,b.y+1.9,b.z+.35])<wt)b.lab=T+.6;b.sp.visible=b.hp>0&&T<b.lab}}
function setBotWeapon(b,w){b.w=w;botGun(b);drawLabel(b)}
const bots=[];
function addBot(i){
  const g=new THREE.Group();scene.add(g);
  const b={id:i,name:'Bot '+(i+1),mesh:g,x:0,y:0,z:0,g:true,v:{x:0,y:0,z:0},hp:100,tx:0,tz:0,alert:0,cool:0,react:0,stuck:0,respawn:0,legs:[],knees:[],ph:0,w:'rifle',lab:0,cr:0,cs:0,crT:0};
  mkBot(b);bots.push(b);respawnBot(b)}
for(let i=0;i<5;i++)addBot(i);
function pickWP(b){if(mode==='br'&&TERR&&brZ.length){const zt=ZN.next||ZN;for(let k=0;k<14;k++){const a=Math.random()*6.283,r=Math.sqrt(Math.random())*zt.r*.8;b.tx=zt.cx+Math.cos(a)*r;b.tz=zt.cz+Math.sin(a)*r;if(TERR.h(b.tx,b.tz)>1.5)break}
    if(!b.run&&Math.random()<.35&&Math.hypot(P.x-b.x,P.z-b.z)<120){b.tx=P.x+(Math.random()-.5)*12;b.tz=P.z+(Math.random()-.5)*12}return}
  const w=WPTS[Math.random()*WPTS.length|0];const hn=Math.random()<D.hunt;b.tx=hn?P.x+(Math.random()-.5)*6:w[0];b.tz=hn?P.z+(Math.random()-.5)*6:w[1]}
function respawnBot(b,idx){const w=mode==='br'&&TERR&&brZ.length?brSpot():TSP[(idx!==undefined?idx:b.id)%TSP.length];
  b.x=w[0]+(Math.random()-.5)*.6;b.z=w[1];b.y=floorY(b.x,b.z);b.hp=100*D.hp;b.mesh.position.set(b.x,b.y,b.z);b.mesh.rotation.x=0;b.corpse=false;b.mesh.visible=true;b.alert=0;b.cr=0;b.cs=0;b.h=H;b.crT=0;b.lab=0;
  setBotWeapon(b,mode==='sniper'?'awp':mode==='arms'?LADDER[Math.min(b.lv|0,LADDER.length-1)]:BW[Math.random()*BW.length|0]);pickWP(b)}

/* ---------- Combat ---------- */
function feed(t){const d=document.createElement('div');d.textContent=t;$('kf').appendChild(d);setTimeout(()=>d.remove(),4000)}
function hurt(d,by,raw){if(dead)return;const ab=raw?0:Math.min(armor,d*.5);armor-=ab;hp-=d-ab;dmgFlash=raw?Math.max(dmgFlash,.3):1;if(by&&by.x!==undefined){ddT=1.4;$('dd').style.transform='translate(-50%,-50%) rotate('+((Math.atan2(by.x-P.x,-(by.z-P.z))+yaw)*57.2958)+'deg)'}
  if(hp<=0){hp=0;dead=true;deaths++;respawnAt=T+2.5;mouse=false;$('msg').textContent='You were eliminated';if(by&&mode==='arms')bumpBot(by)}}
function spawn(){P.x=SPAWN[0]+(Math.random()-.5)*5;P.z=SPAWN[1];P.y=floorY(P.x,P.z);P.h=H;V.x=V.y=V.z=0;yaw=0;pitch=0;punchP=punchY=0;hp=100;if(mode!=='br')for(const k in owned)owned[k]={mag:WPN[k].mag,res:WPN[k].res};({mag,res}=owned[cw]);reloading=false;dead=false;$('msg').textContent=''}
function reload(){if(reloading||mag===WP.mag||res<=0)return;reloading=true;scoped=false;reloadEnd=T+WP.rt;rsnd(reloadSeq())}
function switchW(id){if(!owned[id]||id===cw||dead)return;owned[cw]=Object.assign(owned[cw]||{},{mag,res});cw=id;WP=WPN[id];({mag,res}=owned[id]);cg=null;reloading=false;scoped=false;nextFire=Math.max(T+.4,WPN[id].bolt?cycEnd:0)}
const SHOP=[['Pistols',['glock','deagle']],['Shotguns',['m3']],['Sub-machine guns',['mp5','p90']],['Rifles',['rifle','m4','awp']],['Equipment',['kev','he','fl','sm']]];
const EQ={kev:{name:'Kevlar vest',cost:650},he:{name:'HE grenade',cost:300},fl:{name:'Flashbang',cost:200},sm:{name:'Smoke grenade',cost:300}};
function shopText(){if(phase!=='buy'||dead||mode!=='casual'){shop=null;return mode==='br'&&!dead?(cg?({he:'HE grenade',fl:'Flashbang',sm:'Smoke grenade'}[cg])+' ready – hold click to aim, release to throw · Right-click: '+(lob?'far throw':'short toss'):brPrompt):''}
  if(shop===null)return'Buy phase – press B for shop';
  if(shop==='m')return'BUY MENU<br>1 Pistols<br>2 Shotguns<br>3 Sub-machine guns<br>4 Rifles<br>5 Equipment<br>6 Primary ammo $60<br>7 Secondary ammo $60<br>0 Close';
  return SHOP[shop][0]+'<br>'+SHOP[shop][1].map((id,i)=>(i+1)+' '+(WPN[id]||EQ[id]).name+' $'+(WPN[id]||EQ[id]).cost).join('<br>')+'<br>0 Back'}
function shopKey(n){
  if(shop==='m'){if(n===0)shop=null;else if(n<=5)shop=n-1;else if(n<=7){buyAmmo(n-5);shop=null}return}
  if(n===0){shop='m';return}
  const id=SHOP[shop][1][n-1];if(id){buyItem(id);shop=null}}
function buyAmmo(sl){const k=Object.keys(owned).find(k=>WPN[k].sl===sl);if(!k||money<60)return;money-=60;if(k===cw)res+=WPN[k].mag;else owned[k].res+=WPN[k].mag}
function buyItem(id){const e=EQ[id];if(!e){buy(id);return}if(money<e.cost)return;
  if(id==='kev'){if(armor>=100)return;armor=100}else{if(nade[id]>=(id==='fl'?2:1))return;nade[id]++}money-=e.cost}
function buy(id){const w=WPN[id];if(dead||owned[id]||money<w.cost)return;owned[cw]={mag,res};
  for(const k in owned)if(WPN[k].sl===w.sl)delete owned[k];
  money-=w.cost;owned[id]={mag:w.mag,res:w.res};cw=id;WP=w;({mag,res}=owned[id]);reloading=false;scoped=false;cg=null}
const LADDER=['m3','mp5','p90','rifle','m4','awp','glock','deagle','pistol','knife'];
const ZN={cx:0,cz:0,r:999},BRS=[[75,70,.55],[55,60,.36],[45,50,.22],[35,40,.12],[30,35,.05]];
let brZ=[],brNear=null,brPrompt='';const pickups=[];
const zoneM=new THREE.Mesh(new THREE.CylinderGeometry(1,1,420,64,1,true),new THREE.MeshBasicMaterial({color:0x3a7bff,transparent:true,opacity:.2,side:THREE.DoubleSide,depthWrite:false}));zoneM.visible=false;scene.add(zoneM);
function setLoad(id){owned={};owned[id]={mag:WPN[id].mag,res:WPN[id].res};if(id!=='knife')owned.knife={mag:1,res:0};cw=id;WP=WPN[id];({mag,res}=owned[id]);reloading=false;scoped=false;cg=null;shotIdx=0}
const gunKeys=()=>Object.keys(owned).filter(k=>k!=='knife');
const canOpt=id=>{const a=WPN[id].at;return a==='smg'||a==='rif'||a==='shl'};
const curOpt=()=>{const o=owned[cw];return o&&o.opt&&canOpt(cw)?OPT[o.opt]:null};
const canScope=()=>!!(WP.snp||!WP.melee);
const scopeFov=()=>WP.snp?WP.zoom:curOpt()?curOpt().fov:(WP.sl===2?66:62);
function optTarget(){const ks=gunKeys().filter(canOpt);if(!ks.length)return null;const cur=ks.includes(cw)?cw:null,free=ks.filter(k=>!owned[k].opt);return cur&&!owned[cur].opt?cur:free[0]||cur||ks[0]}
function swapOpt(k){const tg=optTarget();if(!tg)return;const old=owned[tg].opt;owned[tg].opt=k.id;if(old)mkPick(k.x,k.z,'o',old,undefined,k.y);scene.remove(k.m);pickups.splice(pickups.indexOf(k),1);brNear=null;feed('Attached '+OPT[k.id].n+' to '+WPN[tg].name)}
function giveW(id,st,drop){const w=WPN[id];owned[cw]=Object.assign(owned[cw]||{},{mag,res});if(mode==='br'){if(owned[id]){owned[id].res+=w.mag;if(st&&st.opt&&!owned[id].opt)owned[id].opt=st.opt}else{if(gunKeys().length>=2)delete owned[drop||(cw!=='knife'?cw:gunKeys()[1])];owned[id]=st?{mag:st.mag,res:st.res,opt:st.opt}:{mag:w.mag,res:w.mag}}}else{for(const q in owned)if(WPN[q].sl===w.sl)delete owned[q];owned[id]={mag:w.mag,res:w.res}}cw=id;WP=w;({mag,res}=owned[id]);reloading=false;scoped=false;cg=null}
function modeInfo(){const tm='Time '+Math.max(0,Math.ceil(phaseEnd-T));
  if(mode==='arms')return'Level '+(Math.min(plv,LADDER.length-1)+1)+'/'+LADDER.length+' · '+WPN[LADDER[Math.min(plv,LADDER.length-1)]].name+'<br>Leading bot: level '+(Math.max(...bots.map(b=>b.lv|0))+1);
  if(mode==='br'){const al=bots.filter(b=>b.hp>0).length+(dead?0:1);return'Weapons: '+Object.keys(owned).map((k,i)=>(i+1)+' '+WPN[k].name+(k===cw?' ◀':'')).join(' · ')+'<br>Alive '+al+' &nbsp; Zone radius '+Math.round(ZN.r)+' m'+(!dead&&Math.hypot(P.x-ZN.cx,P.z-ZN.cz)>ZN.r?'<br><b style="color:var(--hp)">OUTSIDE THE ZONE</b>':'')}
  const base='Round '+round+' &nbsp; Score '+rw+'–'+rl;
  return mode==='casual'?base+' &nbsp; <span style="color:var(--amber)">$'+money+'</span><br>'+tm:base+'<br>'+tm}
function arenaWin(n){phase='over';phaseEnd=T+5;mouse=false;const m=$('msg');m.style.color='var(--xh)';m.textContent=n+(n==='You'?' win!':' wins!')}
function armsKill(){plv++;if(plv>=LADDER.length){plv=LADDER.length-1;arenaWin('You');return}setLoad(LADDER[plv]);feed('Level '+(plv+1)+': '+WPN[LADDER[plv]].name)}
function bumpBot(b){b.lv=(b.lv|0)+1;if(b.lv>=LADDER.length){b.lv=LADDER.length-1;arenaWin(b.name);return}setBotWeapon(b,LADDER[b.lv])}
function respawnArms(){setLoad(LADDER[plv]);spawn()}
function freeSpot(x,z){if(TERR){if(TERR.h(x,z)<WLV+.4||TERR.slope(x,z)>.55)return false}else if(floorY(x,z)!==0)return false;const y=floorY(x,z);return!near(x,z,R+1).some(q=>hitBox({x,y,z,h:H},q))}
function mkLabel(text,col){const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');x.font='bold 30px sans-serif';x.textAlign='center';x.lineWidth=5;x.strokeStyle='#000';x.strokeText(text,128,40);x.fillStyle=col;x.fillText(text,128,40);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:srgbTex(new THREE.CanvasTexture(c)),transparent:true}));sp.scale.set(2.4,.6,1);return sp}
const AMN={pst:'Pistol ammo',smg:'SMG ammo',rif:'Rifle ammo',shl:'Shotgun shells',snp:'Sniper ammo'};
const GN={he:'HE grenade',fl:'Flashbang',sm:'Smoke grenade'};
function mkPick(x,z,t,id,st,y0){const col=t==='w'?0xf2a23a:t==='a'?0x4a8cff:t==='m'?0xd9d046:t==='g'?0xe05a3a:t==='o'?0xb98cff:0x4ad66a,g=new THREE.Group(),it=new THREE.Group(),n=t==='w'?WPN[id].name+(st&&st.opt?' + '+OPT[st.opt].s:''):t==='a'?'Kevlar vest':t==='m'?AMN[id]:t==='g'?GN[id]:t==='o'?OPT[id].n:'Medkit';
  if(t==='w'){const m=VM[id].clone(true);m.visible=true;m.position.set(0,0,0);m.rotation.set(0,0,0);m.scale.setScalar(WPN[id].sl===2?2.4:1.4);it.add(m);it.position.y=.95}
  else if(t==='a'){const b=mt(0x2f5fb8);bx(it,.5,.6,.3,0,0,0,b);bx(it,.38,.4,.05,0,0,.17,mt(0x1c2a44));bx(it,.12,.2,.32,-.17,.38,0,b);bx(it,.12,.2,.32,.17,.38,0,b);it.position.y=.7}
  else if(t==='m'){bx(it,.55,.28,.36,0,0,0,mt(0x55603a));for(const i of[-1,0,1])cy(it,.05,.22,i*.14,.2,0,mt(0xc9a227));it.position.y=.45}
  else if(t==='o'){const m=window.mkOptic(id);m.scale.setScalar(4.2);m.visible=true;it.add(m);it.position.y=.5}
  else if(t==='g'){it.add(new THREE.Mesh(new THREE.SphereGeometry(.14,12,10),new THREE.MeshLambertMaterial({color:NC[id]})));cy(it,.05,.12,0,.17,0,mt(0x444));it.position.y=.55}
  else{bx(it,.55,.36,.38,0,0,0,mt(0xeeeeee));bx(it,.3,.03,.08,0,.19,0,mt(0xd22222));bx(it,.08,.03,.3,0,.19,0,mt(0xd22222));it.position.y=.55}
  g.add(it);const bm=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,12,6),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.35}));bm.position.y=6;g.add(bm);
  const lab=mkLabel(n,t==='w'?'#ffcf5a':t==='a'?'#8fb8ff':t==='m'?'#ffe27a':t==='g'?'#ff9a7a':t==='o'?'#d3b2ff':'#8fffa8');lab.position.y=2.1;lab.visible=false;g.add(lab);
  const gy=y0===undefined?floorY(x,z):y0;g.position.set(x,gy,z);scene.add(g);pickups.push({m:g,lab,x,z,y:gy,t,id,n,st})}
function swapPick(k){if(k.t==='o'){swapOpt(k);return}if(gunKeys().length<2||owned[k.id])return;const drop=cw!=='knife'?cw:gunKeys()[1],st=drop===cw?{mag,res,opt:owned[cw]&&owned[cw].opt}:{mag:owned[drop].mag,res:owned[drop].res,opt:owned[drop].opt};mkPick(k.x,k.z,'w',drop,st,k.y);giveW(k.id,k.st,drop);scene.remove(k.m);pickups.splice(pickups.indexOf(k),1);brNear=null}
function wslot(n){return mode==='br'?gunKeys()[n-1]:(Object.keys(owned).find(k=>WPN[k].sl===n)||'pistol')}
function clearPicks(){for(const k of pickups)scene.remove(k.m);pickups.length=0}
function landSpot(minD,fromP){for(let i=0;i<300;i++){const a=Math.random()*6.283,r=Math.sqrt(Math.random())*330,x=Math.cos(a)*r,z=Math.sin(a)*r;
    if(TERR.h(x,z)>2&&TERR.slope(x,z)<.35&&[[0,0],[3,0],[-3,0],[0,3],[0,-3]].every(([p,q])=>freeSpot(x+p,z+q))&&(!fromP||Math.hypot(x-P.x,z-P.z)>minD))return[x,z]}return[0,0]}
function brSpot(){return landSpot(110,true)}
const LW1=['pistol','glock','mp5','m3','rifle','deagle','mp5','scout'],LW2=['m4','rifle','p90','awp','mp5','m3','deagle','m4','svd','kar','g3','m82','scout'];
function brStart(){clearPicks();SPAWN=landSpot(0,false);const R0=MAPS.br.half*1.5;brZ=[];let pv={cx:0,cz:0,r:R0};
  for(const [hold,shrink,f] of BRS){const r=R0*f;let to=null;for(let k=0;k<60;k++){const a=Math.random()*6.283,dd=Math.random()*(pv.r-r)*.85,cx=pv.cx+Math.cos(a)*dd,cz=pv.cz+Math.sin(a)*dd;if(k===59||TERR.h(cx,cz)>1.5){to={cx,cz,r};break}}brZ.push({hold,shrink,from:pv,to});pv=to}
  ZN.cx=0;ZN.cz=0;ZN.r=R0;brT0=0;{const zp=zonePhase(0);ZN.ph=zp.ph;ZN.stage=zp.st;ZN.left=zp.left;ZN.next=zp.next}
  const AT=['pst','smg','rif','shl','snp'],GI=['he','fl','sm'];
  for(const [x,z,y,tier] of MAPS.br.loot){if(Math.random()>.74)continue;const r=Math.random(),t2=tier>=2;
    const t=r<(t2?.40:.26)?'w':r<(t2?.58:.50)?'m':r<(t2?.68:.58)?'a':r<(t2?.76:.70)?'h':r<(t2?.90:.82)?'o':'g';
    mkPick(x,z,t,t==='w'?(t2?LW2:LW1)[Math.random()*(t2?LW2:LW1).length|0]:t==='m'?AT[Math.random()*AT.length|0]:t==='g'?GI[Math.random()*3|0]:t==='o'?['rd','rd','rd','ho','ho','x2','x2','x4'][Math.random()*8|0]:null,undefined,y)}}
function take(k){if(k.t==='w')giveW(k.id,k.st);else if(k.t==='a')armor=100;else if(k.t==='g'){nade[k.id]++}else if(k.t==='o'){const tg=optTarget();if(tg){owned[tg].opt=k.id;feed('Attached '+k.n+' to '+WPN[tg].name)}return}else if(k.t==='m'){let add=0;for(const q in owned)if(WPN[q].at===k.id){add=WPN[q].mag*2;if(q===cw)res+=add;else owned[q].res+=add}feed('Picked up '+k.n+' (+'+add+' rounds)');return}else hp=Math.min(100,hp+50);feed('Picked up '+k.n)}
function mapBg(m,S,labels){const T=m.terrain,half=T.half,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d'),img=x.createImageData?x.createImageData(S,S):null,out={c,k:S/(2*half),o:half,S};if(!img||!img.data)return out;
  const sc=2*half/S,d=img.data,reg=new Uint8Array(S*S),sea=new Uint8Array(S*S);
  for(let j=0;j<S;j++)for(let i=0;i<S;i++){const wx=-half+(i+.5)*sc,wz=-half+(j+.5)*sc,kd=T.kind(wx,wz),h=T.h(wx,wz);let r,g2,b2;
    if(kd===0){const dp=Math.max(0,Math.min(1,-h/7));r=.32-.22*dp;g2=.6-.34*dp;b2=.78-.3*dp}
    else{const c0=KCOL[kd],v=1+Math.max(-.4,Math.min(.4,(T.h(wx-sc,wz-sc)-T.h(wx+sc,wz+sc))*.014));r=c0[0]*v;g2=c0[1]*v;b2=c0[2]*v}
    const q=(j*S+i)*4;d[q]=r*255;d[q+1]=g2*255;d[q+2]=b2*255;d[q+3]=255;reg[j*S+i]=T.reg(wx,wz);if(kd===0)sea[j*S+i]=1}
  for(let j=0;j<S-1;j++)for(let i=0;i<S-1;i++){const a=reg[j*S+i];if(a!==255&&!sea[j*S+i]&&(a!==reg[j*S+i+1]&&reg[j*S+i+1]!==255||a!==reg[(j+1)*S+i]&&reg[(j+1)*S+i]!==255)){const q=(j*S+i)*4;d[q]=d[q]*.55+255*.45;d[q+1]=d[q+1]*.55+255*.45;d[q+2]=d[q+2]*.55+255*.45}}
  x.putImageData(img,0,0);
  const px=v=>(v+half)/sc;x.fillStyle='#5b4a3a';for(const f of m.fp)if(f[4]!=='carpark'&&f[4]!=='runway'&&f[4]!=='plaza'&&f[4]!=='paddock'&&f[4]!=='containers'&&f[4]!=='gas'){x.fillRect(px(f[0]-f[2]/2),px(f[1]-f[3]/2),Math.max(1.5,f[2]/sc),Math.max(1.5,f[3]/sc))}
  if(labels){const sx=new Float64Array(T.regs.length),sz=new Float64Array(T.regs.length),n=new Float64Array(T.regs.length);for(let j=0;j<S;j++)for(let i=0;i<S;i++){const r=reg[j*S+i];if(r!==255&&T.kind(-half+(i+.5)*sc,-half+(j+.5)*sc)!==0){sx[r]+=i;sz[r]+=j;n[r]++}}
    x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';x.font='bold '+Math.round(S/46)+'px Rajdhani, Arial Narrow, sans-serif';x.lineWidth=Math.max(3,S/200);
    for(let r=0;r<T.regs.length;r++)if(n[r]>20){const nm=T.regs[r].n.toUpperCase(),cx=sx[r]/n[r],cz=sz[r]/n[r];x.strokeStyle='rgba(0,0,0,.75)';x.strokeText(nm,cx,cz);x.fillStyle='#fff';x.fillText(nm,cx,cz)}}
  return out}
function buildMini(m){return mapBg(m,Math.round(MMS*Math.min(devicePixelRatio||1,2)),false)}
let bigOpen=false,MMB=null;
function drawMapOn(x,Sd,bg){const half=TERR.half,k=Sd/(2*half),px=v=>(v+half)*k,sc=Sd/190;
  if(bg)x.drawImage(bg.c,0,0,Sd,Sd);
  x.beginPath();x.rect(0,0,Sd,Sd);x.arc(px(ZN.cx),px(ZN.cz),ZN.r*k,0,6.2832,true);x.fillStyle='rgba(91,70,224,.4)';x.fill();
  if(ZN.next){x.beginPath();x.arc(px(ZN.next.cx),px(ZN.next.cz),ZN.next.r*k,0,6.2832);x.setLineDash([5*sc,4*sc]);x.lineWidth=2*sc;x.strokeStyle='#ffd24a';x.stroke();x.setLineDash([])}
  x.beginPath();x.arc(px(ZN.cx),px(ZN.cz),ZN.r*k,0,6.2832);x.lineWidth=2*sc;x.strokeStyle='#ffffff';x.stroke();
  const mx=px(P.x),my=px(P.z),an=Math.atan2(-Math.cos(yaw),-Math.sin(yaw));
  x.beginPath();x.moveTo(mx,my);x.arc(mx,my,30*sc,an-.8,an+.8);x.closePath();x.fillStyle='rgba(90,209,255,.32)';x.fill();
  x.beginPath();x.moveTo(mx+Math.cos(an)*8*sc,my+Math.sin(an)*8*sc);x.lineTo(mx+Math.cos(an+2.5)*6*sc,my+Math.sin(an+2.5)*6*sc);x.lineTo(mx+Math.cos(an-2.5)*6*sc,my+Math.sin(an-2.5)*6*sc);x.closePath();x.fillStyle='#5ad1ff';x.fill();x.lineWidth=1.5*sc;x.strokeStyle='#000';x.stroke()}
function openBig(v){bigOpen=v&&mode==='br';$('bigmap').style.display=bigOpen?'block':'none';if(bigOpen&&!MMB){const S=Math.max(360,Math.min(780,Math.floor(Math.min(innerWidth,innerHeight)*.84)));MMB=mapBg(MAPS.br,S,true)}}
function zonePhase(t){let acc=0;for(let i=0;i<brZ.length;i++){const q=brZ[i];if(t<acc+q.hold)return{ph:'hold',st:i+1,left:acc+q.hold-t,next:q.to};if(t<acc+q.hold+q.shrink)return{ph:'shrink',st:i+1,left:acc+q.hold+q.shrink-t,next:q.to};acc+=q.hold+q.shrink}
  return{ph:'final',st:brZ.length,left:0,next:null}}
const PIC='<svg width="22" height="22" viewBox="0 0 20 20"><circle cx="10" cy="6" r="4" fill="currentColor"/><path d="M2 19c0-5 3-8 8-8s8 3 8 8z" fill="currentColor"/></svg>',CARD=['N','NE','E','SE','S','SW','W','NW'];
let mmx=null;
function fmtT(v){v=Math.max(0,Math.ceil(v));return Math.floor(v/60)+':'+('0'+v%60).slice(-2)}
const ICO={p:'M10 12h62v9H60l-3 14H46l3-14H34l-3 5H10z',s:'M6 14h74v8H66l-2 14h-9l2-14H44l-2 12h-8l2-12H6z M80 16h30v4H80z',r:'M4 16h40l6-4h30l4 3h30v5H84l-4 3H58l-2 12h-9l1-12H20l-6 7H4z',g:'M4 18h100v5H60v4H40v-4H4z M50 23h14v8H50z',n:'M2 20h104v4H70l-6 4H44l-4 10h-8l3-10H18l-4 3H2z M40 12h30v4H40z',k:'M18 29L76 13l8 2-6 7-58 9z M12 29h10v6H12z'},WCLS={pistol:'p',glock:'p',deagle:'p',mp5:'s',p90:'s',rifle:'r',m4:'r',m3:'g',awp:'n',scout:'n',svd:'n',g3:'n',kar:'n',m82:'n',knife:'k'};
let lastW=null,lastChips='',cmx=null,ddT=0;
function hudUpdate(){
  $('hpf').style.width=Math.max(0,Math.min(100,hp))+'%';$('hpn').textContent=Math.ceil(hp);$('arf').style.width=Math.max(0,Math.min(100,armor))+'%';$('arn').textContent=Math.ceil(armor);$('hp').classList.toggle('low',hp<30&&!dead);
  const wk=cw+(curOpt()?owned[cw].opt:'');if(lastW!==wk){lastW=wk;$('wname').textContent=WP.name+(curOpt()?' · '+OPT[owned[cw].opt].s:'');$('wicop').setAttribute('d',ICO[WCLS[cw]||'r'])}
  const mel=!!WP.melee;$('mag').textContent=mel?'—':mag;$('rsv').textContent=mel?'':'/ '+res;$('rlt').textContent=reloading?'RELOADING':(WP.bolt&&T<cycEnd?'CHAMBERING':'');
  const gk=gunKeys();let h='';
  for(const k of gk)h+='<span class="chip'+(k===cw&&!cg?' on':'')+'"><i>'+(mode==='br'?gk.indexOf(k)+1:WPN[k].sl)+'</i>'+WPN[k].name+'</span>';
  if(owned.knife)h+='<span class="chip'+(cw==='knife'&&!cg?' on':'')+'"><i>3</i>Knife</span>';
  [['he','HE',4],['fl','FL',5],['sm','SM',6]].forEach(([k,n,i])=>{if(nade[k]>0)h+='<span class="chip'+(cg===k?' on':'')+'"><i>'+i+'</i>'+n+' ×'+nade[k]+'</span>'});
  if(h!==lastChips){$('chips').innerHTML=h;lastChips=h}}
function drawCompass(){const c=$('cmp'),dpr=Math.min(devicePixelRatio||1,2),W=460,Hh=34;if(!cmx||c.width!==W*dpr){c.width=W*dpr;c.height=Hh*dpr;cmx=c.getContext('2d')}
  const x=cmx;x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,W,Hh);x.fillStyle='rgba(12,16,20,.7)';x.fillRect(0,0,W,Hh);
  const hdg=((-yaw*180/Math.PI)%360+360)%360,span=100,ppd=W/span,NAMES={0:'N',45:'NE',90:'E',135:'SE',180:'S',225:'SW',270:'W',315:'NW'};
  x.textAlign='center';x.textBaseline='middle';
  for(let d=Math.ceil((hdg-span/2)/5)*5;d<=hdg+span/2;d+=5){const px=W/2+(d-hdg)*ppd,dg=((d%360)+360)%360;
    if(dg%45===0){x.fillStyle=dg===0?'#ff6a5a':'#fff';x.font='700 17px Rajdhani, Arial Narrow, sans-serif';x.fillText(NAMES[dg],px,15)}
    else if(dg%15===0){x.fillStyle='rgba(255,255,255,.75)';x.font='600 12px Rajdhani, Arial Narrow, sans-serif';x.fillText(dg,px,12);x.fillRect(px-.5,23,1,6)}
    else{x.fillStyle='rgba(255,255,255,.4)';x.fillRect(px-.5,25,1,4)}}
  if(mode==='br'&&TERR&&ZN.r<900){const bz=Math.atan2(ZN.cx-P.x,-(ZN.cz-P.z))*180/Math.PI,rel=((bz-hdg+540)%360)-180,mx=W/2+Math.max(-span/2+2,Math.min(span/2-2,rel))*ppd,edge=Math.abs(rel)>span/2-2;
    x.fillStyle=Math.hypot(ZN.cx-P.x,ZN.cz-P.z)>ZN.r?'#ff7a6a':'#ffd24a';x.beginPath();x.moveTo(mx,edge?17:21);x.lineTo(mx+6,edge?23:27);x.lineTo(mx,edge?29:33);x.lineTo(mx-6,edge?23:27);x.closePath();x.fill()}
  x.fillStyle='rgba(12,16,20,.9)';x.fillRect(0,0,22,Hh);x.fillRect(W-22,0,22,Hh);x.fillStyle='rgba(12,16,20,.5)';x.fillRect(22,0,16,Hh);x.fillRect(W-38,0,16,Hh);
  x.fillStyle='#f2b134';x.beginPath();x.moveTo(W/2-6,0);x.lineTo(W/2+6,0);x.lineTo(W/2,8);x.closePath();x.fill()}
function brHud(){document.body.classList.toggle('br',mode==='br');if(mode!=='br'){if(bigOpen)openBig(false);return}
  const alive=bots.filter(b=>b.hp>0).length+(dead?0:1);$('pcount').innerHTML=PIC+alive+' / '+(botN+1);
  const hdr=phase==='buy'?'Match starts in '+Math.max(0,Math.ceil(phaseEnd-T))+' s':ZN.ph==='hold'?'Zone '+ZN.stage+'/'+BRS.length+' · shrinks in '+fmtT(ZN.left):ZN.ph==='shrink'?'Zone '+ZN.stage+'/'+BRS.length+' · shrinking, '+fmtT(ZN.left)+' left':'Final zone';$('mmh').textContent=hdr;
  // ----- mini map
  const c=$('mmc'),dpr=Math.min(devicePixelRatio||1,2);if(!mmx||c.width!==MMS*dpr){c.width=c.height=MMS*dpr;mmx=c.getContext('2d')}
  mmx.setTransform(dpr,0,0,dpr,0,0);mmx.clearRect(0,0,MMS,MMS);drawMapOn(mmx,MMS,MM);
  const rg=TERR.reg(P.x,P.z);
  if(bigOpen&&MMB){const bc=$('bmc'),S=MMB.S;if(bc.width!==S){bc.width=S;bc.height=S}const bx=bc.getContext('2d');bx.setTransform(1,0,0,1,0,0);bx.clearRect(0,0,S,S);drawMapOn(bx,S,MMB);$('bmt').textContent=hdr+'   ·   You are in: '+(rg===255?'open sea':TERR.regs[rg].n)+'   ·   M to close'}
  // ----- zone strip (one line): time left, the safe area along the line from you to its centre, and the distance to its edge
  {const ph=phase==='buy'?'buy':ZN.ph,tl=ph==='buy'?Math.max(0,phaseEnd-T):ZN.left,ti=Math.max(0,Math.ceil(tl)),p2=n=>('0'+n).slice(-2);
   $('ztv').textContent=ph==='final'?'--:--':p2(Math.floor(ti/60))+':'+p2(ti%60);$('ztv').style.color=ph==='shrink'?'#ff7a6a':'#fff'}
  const dx=ZN.cx-P.x,dz=ZN.cz-P.z,dC=Math.hypot(dx,dz),lo=dC-ZN.r,hi=dC+ZN.r;
  const pad=Math.max(25,(hi-Math.min(lo,0))*.12),a=Math.min(0,lo)-pad,b=Math.max(0,hi)+pad,W=b-a,pc=t=>Math.max(0,Math.min(100,(t-a)/W*100));
  const mw=6;let sl=pc(lo),sw=pc(hi)-sl;if(sw<mw){sl=Math.max(0,Math.min(100-mw,sl+sw/2-mw/2));sw=mw}
  $('zsafe').style.left=sl+'%';$('zsafe').style.width=sw+'%';$('zrun').style.left=pc(0)+'%';
  {const out=dC>ZN.r,d=Math.round(Math.abs(dC-ZN.r)),zd=$('zdist');zd.textContent=d+'m';zd.style.color=out?'#ff8a7a':'#fff'}}
function brTick(dt){if(!brT0)brT0=T;const t=T-brT0;let acc=0,z=null,st=0;
  for(let i=0;i<brZ.length;i++){const q=brZ[i];st=i;if(t<acc+q.hold){z=q.from;break}
    if(t<acc+q.hold+q.shrink){const u=(t-acc-q.hold)/q.shrink;z={cx:q.from.cx+(q.to.cx-q.from.cx)*u,cz:q.from.cz+(q.to.cz-q.from.cz)*u,r:q.from.r+(q.to.r-q.from.r)*u};break}acc+=q.hold+q.shrink}
  if(!z)z=brZ[brZ.length-1].to;ZN.cx=z.cx;ZN.cz=z.cz;ZN.r=z.r;{const zp=zonePhase(t);ZN.ph=zp.ph;ZN.stage=zp.st;ZN.left=zp.left;ZN.next=zp.next}zoneM.position.set(z.cx,150,z.cz);zoneM.scale.set(z.r,1,z.r);
  const dps=1.5+st*1.5;
  if(!dead&&Math.hypot(P.x-z.cx,P.z-z.cz)>z.r)hurt(dps*dt,null,true);
  for(const b of bots)if(b.hp>0&&Math.hypot(b.x-z.cx,b.z-z.cz)>z.r){b.hp-=dps*dt*.5;if(b.hp<=0&&!b.corpse)bodyDown(b)}
  brPrompt='';brNear=null;let nd=2.2,hint='';
  for(let i=pickups.length-1;i>=0;i--){const k=pickups[i];k.m.rotation.y+=dt*2;const d=Math.hypot(P.x-k.x,P.z-k.z);k.lab.visible=d<18;k.m.visible=d<170;
    if(dead||d>2.2||Math.abs(P.y-k.y)>2)continue;let ok=false;
    if(k.t==='w'){if(gunKeys().length<2||owned[k.id])ok=true;else if(d<nd){brNear=k;nd=d}}else if(k.t==='o'){const tg=optTarget();if(!tg)hint='Optics fit rifles, SMGs and shotguns – not pistols or snipers';else if(!owned[tg].opt)ok=true;else if(d<nd){brNear=k;nd=d}}else if(k.t==='a')ok=armor<100;else if(k.t==='m')ok=Object.keys(owned).some(q=>WPN[q].at===k.id);else if(k.t==='g')ok=nade[k.id]<2;else ok=hp<100;
    if(ok){take(k);scene.remove(k.m);pickups.splice(i,1)}}
  if(brNear)brPrompt=brNear.t==='o'?'Press E to swap '+OPT[owned[optTarget()].opt].n+' for '+brNear.n:'Press E to swap '+WPN[cw!=='knife'?cw:gunKeys()[1]].name+' for '+brNear.n;else if(hint)brPrompt=hint;else if(doorFocus&&!cg)brPrompt='Press E to '+(doorFocus.tgt?'close':'open')+' the door';
  if(dead)endRound(false,'Eliminated');else if(bots.every(b=>b.hp<=0))endRound(true)}
function setMode(m){mode=m;botN=m==='arms'?6:m==='br'?19:5;while(bots.length<botN)addBot(bots.length);
  zoneM.visible=m==='br';if(m!=='br')clearPicks();
  loadMap(m==='br'?'br':lastMap,true)}
// the surface under a point: the terrain, or the top of a floor, roof or crate no higher than y0
function groundAt(x,z,y0){let g=floorY(x,z);for(const q of near(x,z,.5))if(!q.off&&!q.glass&&!q.door&&x+.3>q.min[0]&&x-.3<q.max[0]&&z+.3>q.min[2]&&z-.3<q.max[2]&&q.max[1]<=y0&&q.max[1]>g)g=q.max[1];return g}
function dropLoot(b){const w=b.w,W=WPN[w],items=[];
  if(!W.melee)items.push(['w',w,{mag:Math.max(4,Math.round(W.mag*(.35+Math.random()*.65))),res:W.mag*(1+Math.floor(Math.random()*2)),opt:canOpt(w)&&Math.random()<.3?OPTK[Math.random()*3|0]:undefined}]);
  if(!W.melee&&Math.random()<.75)items.push(['m',W.at]);if(Math.random()<.4)items.push(['a']);if(Math.random()<.4)items.push(['h']);
  if(Math.random()<.4)items.push(['g',['he','fl','sm'][Math.random()*3|0]]);if(Math.random()<.22)items.push(['o',OPTK[Math.random()*4|0]]);
  const n=items.length,a0=Math.random()*6.283;items.forEach((it,i)=>{const a=a0+i/n*6.283,r=1.0+Math.random()*.4;let x=b.x+Math.cos(a)*r,z=b.z+Math.sin(a)*r;if(!freeSpot(x,z)){x=b.x;z=b.z}mkPick(x,z,it[0],it[1],it[2],groundAt(x,z,b.y+.6))})}
// the body stays where it fell (lying down) with its gear dropped around it
function bodyDown(b){if(mode!=='br'){b.mesh.visible=false;return}b.corpse=true;b.corpseT=T+150;b.mesh.rotation.order='YXZ';b.mesh.rotation.x=-Math.PI/2;b.fy=b.y;b.fv=0;b.y=groundAt(b.x,b.z,b.y+.6);if(b.fy<b.y)b.fy=b.y;b.mesh.position.set(b.x,b.fy+.2,b.z);b.sp.visible=false;dropLoot(b)}
function killBot(b,hs){bodyDown(b);b.respawn=T+3;kills++;if(mode==='arms')armsKill();money=Math.min(16000,money+300);feed('You eliminated '+b.name+' ['+WPN[b.w].name+']'+(hs?' (headshot)':''))}
function inB(x,y,z){return near(x,z,1).some(b=>!b.off&&x>b.min[0]-.06&&x<b.max[0]+.06&&y>b.min[1]-.06&&y<b.max[1]+.06&&z>b.min[2]-.06&&z<b.max[2]+.06)}
function segSph(o,p,s){const dx=p[0]-o[0],dy=p[1]-o[1],dz=p[2]-o[2],l2=dx*dx+dy*dy+dz*dz||1;let t=((s.x-o[0])*dx+(s.y-o[1])*dy+(s.z-o[2])*dz)/l2;t=Math.max(0,Math.min(1,t));return Math.hypot(o[0]+dx*t-s.x,o[1]+dy*t-s.y,o[2]+dz*t-s.z)<s.r}
function nadeFuse(t){return t==='sm'?1.3:1.6}
function nadeStep(n,dt){let fl=false;n.vy-=18*dt;
  let nx=n.x+n.vx*dt;if(inB(nx,n.y,n.z)){n.vx*=-.45;nx=n.x;fl=true}n.x=nx;
  let nz=n.z+n.vz*dt;if(inB(n.x,n.y,nz)){n.vz*=-.45;nz=n.z;fl=true}n.z=nz;
  let ny=n.y+n.vy*dt;if(ny<floorY(n.x,n.z)+.07||inB(n.x,ny,n.z)){n.vy*=-.4;n.vx*=.8;n.vz*=.8;ny=Math.max(n.y,floorY(n.x,n.z)+.07);if(Math.abs(n.vy)<.5)n.vy=0;fl=true}n.y=ny;return fl}
// the throw starts at the hand (a little to the right and low, where the grenade is held) and does not depend on how you are moving, so the preview is steady while you strafe
function nadeStart(){const sp=lob?8:15,cp=Math.cos(pitch),sy=Math.sin(yaw),cy=Math.cos(yaw),d=[-sy*cp,Math.sin(pitch)+.2,-cy*cp];
  return{x:P.x-sy*cp*.35+cy*.22,y:P.y+eye-.17+Math.sin(pitch)*.3,z:P.z-cy*cp*.35-sy*.22,vx:d[0]*sp,vy:d[1]*sp,vz:d[2]*sp}}
function throwNade(){const t=cg;if(!t||!nade[t])return;nade[t]--;cg=null;mouse=false;grenHeld=false;
  const m=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),new THREE.MeshLambertMaterial({color:NC[t]}));scene.add(m);
  nades.push(Object.assign(nadeStart(),{t,m,f:T+nadeFuse(t)}));snd(.15,.05,3000);kick=-.05}
// the path the grenade will take: a line to where it will be when the fuse runs out, and a ring on the spot
function aimUpdate(){if(!cg||dead||!nade[cg]||!grenHeld){aimMesh.visible=false;aimN=0;return}
  const n=nadeStart(),dt=1/120,steps=Math.round(nadeFuse(cg)/dt),every=Math.max(1,Math.ceil(steps/(AIM_N-2)));let k=1,px,py,pz;aimPos[0]=n.x;aimPos[1]=n.y;aimPos[2]=n.z;
  for(let i=1;i<=steps;i++){px=n.x;py=n.y;pz=n.z;const hit=nadeStep(n,dt);
    if(hit){if(k<AIM_N&&Math.hypot(px-aimPos[k*3-3],py-aimPos[k*3-2],pz-aimPos[k*3-1])>.02){aimPos[k*3]=px;aimPos[k*3+1]=py;aimPos[k*3+2]=pz;k++}break}   // the path ends where the grenade first touches something
    if((i%every===0||i===steps)&&k<AIM_N){aimPos[k*3]=n.x;aimPos[k*3+1]=n.y;aimPos[k*3+2]=n.z;k++}}
  // a flat ribbon that always faces the camera and keeps the same width on screen
  const cx=cam.position.x,cy=cam.position.y,cz=cam.position.z,wpp=2*Math.tan(cam.fov*Math.PI/360)/Math.max(300,innerHeight)*3;
  for(let i=0;i<k;i++){const a0=aimPos[Math.max(0,i-1)*3],a1=aimPos[Math.max(0,i-1)*3+1],a2=aimPos[Math.max(0,i-1)*3+2],b0=aimPos[Math.min(k-1,i+1)*3],b1=aimPos[Math.min(k-1,i+1)*3+1],b2=aimPos[Math.min(k-1,i+1)*3+2],
      tx=b0-a0,ty=b1-a1,tz=b2-a2,vx=aimPos[i*3]-cx,vy=aimPos[i*3+1]-cy,vz=aimPos[i*3+2]-cz,dist=Math.hypot(vx,vy,vz)||1;
    let sx=ty*vz-tz*vy,sy=tz*vx-tx*vz,sz=tx*vy-ty*vx;const sl=Math.hypot(sx,sy,sz)||1,hw=Math.max(.004,dist*wpp)/sl;sx*=hw;sy*=hw;sz*=hw;
    aimV[i*6]=aimPos[i*3]+sx;aimV[i*6+1]=aimPos[i*3+1]+sy;aimV[i*6+2]=aimPos[i*3+2]+sz;aimV[i*6+3]=aimPos[i*3]-sx;aimV[i*6+4]=aimPos[i*3+1]-sy;aimV[i*6+5]=aimPos[i*3+2]-sz}
  aimVA.needsUpdate=true;aimGeo.setDrawRange(0,Math.max(0,(k-1)*6));aimMesh.visible=k>1;aimN=k-1}
function nadesTick(dt){
  for(let i=nades.length-1;i>=0;i--){const n=nades[i];nadeStep(n,dt);
    n.m.position.set(n.x,n.y,n.z);
    if(T>=n.f){scene.remove(n.m);nades.splice(i,1);boom(n)}}
  for(let i=smokes.length-1;i>=0;i--)if(T>=smokes[i].t){scene.remove(smokes[i].m);smokes.splice(i,1)}}
function boom(n){const o=[n.x,n.y+.2,n.z];
  if(n.t==='sm'){const y=Math.max(n.y,.1)+1.6,m=new THREE.Mesh(new THREE.SphereGeometry(3.6,16,12),new THREE.MeshLambertMaterial({color:0xb9bec2,transparent:true,opacity:.95,side:THREE.DoubleSide}));m.position.set(n.x,y,n.z);scene.add(m);smokes.push({x:n.x,y,z:n.z,r:3.6,t:T+15,m});snd(.2,.4,900);return}
  const pd=Math.hypot(P.x-o[0],P.y+1-o[1],P.z-o[2]);
  if(n.t==='fl'){snd(.6,.25,6000);const m=new THREE.Mesh(new THREE.SphereGeometry(.6,10,8),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true}));m.position.set(...o);scene.add(m);fx.push({m,t:.3,max:.3});
    if(!dead&&pd<30&&clear(o,[P.x,P.y+eye,P.z])){const cp=Math.cos(pitch),f=[-Math.sin(yaw)*cp,Math.sin(pitch),-Math.cos(yaw)*cp],dot=(f[0]*(o[0]-P.x)+f[1]*(o[1]-P.y-eye)+f[2]*(o[2]-P.z))/pd;fbang=Math.min(1.3,(1-pd/30)*(dot>0?1.4:.5)+.2)}
    for(const b of bots)if(b.hp>0&&Math.hypot(b.x-o[0],b.z-o[2])<30&&clear(o,[b.x,1.4,b.z]))b.blind=T+4;return}
  snd(1,.6,700);tone(60,25,.5,1,'sine');for(const q of GL)if(!q.b.off&&Math.hypot((q.b.min[0]+q.b.max[0])/2-o[0],(q.b.min[2]+q.b.max[2])/2-o[2])<11)breakGlass(q.b);const m=new THREE.Mesh(new THREE.SphereGeometry(2.2,14,10),new THREE.MeshBasicMaterial({color:0xff9a3c,transparent:true}));m.position.set(...o);scene.add(m);fx.push({m,t:.45,max:.45});
  for(const b of bots){if(b.hp<=0)continue;const bd=Math.hypot(b.x-o[0],1-o[1],b.z-o[2]);if(bd<9&&clear(o,[b.x,b.y+.9,b.z])){b.hp-=Math.round(160*(1-bd/9));b.alert=1.5;if(b.hp<=0)killBot(b,false)}}
  if(!dead&&pd<9&&clear(o,[P.x,P.y+1,P.z]))hurt(Math.round(110*(1-pd/9)))}
function endRound(w,why){phase='over';phaseEnd=T+4;mouse=false;const m=$('msg');
  if(w){rw++;money=Math.min(16000,money+2700);m.style.color='var(--xh)';m.textContent=mode==='br'?'VICTORY ROYALE!':'Round won'+(mode==='casual'?'  +$2700':'')}
  else{rl++;money=Math.min(16000,money+1400);m.style.color='var(--hp)';m.textContent=(why||'Round lost')+(mode==='casual'?'  +$1400':'')}}
function newRound(){round++;
  if(dead||mode==='br'){owned={pistol:{mag:12,res:mode==='br'?12:36},knife:{mag:1,res:0}};cw='pistol';WP=WPN.pistol;scoped=false;armor=0;nade.he=nade.fl=nade.sm=0}
  cg=null;shop=null;nades.forEach(n=>scene.remove(n.m));nades.length=0;smokes.forEach(q=>scene.remove(q.m));smokes.length=0;fbang=0;
  if(mode==='arms'){plv=0;bots.forEach(b=>b.lv=0)}
  if(mode==='br')brStart();
  spawn();if(mode==='sniper')setLoad('awp');else if(mode==='arms')setLoad(LADDER[plv]);
  bots.forEach((b,i)=>{if(i<botN){respawnBot(b);b.blind=0}else{b.hp=0;b.mesh.visible=false;b.respawn=1e9}});
  phase='buy';phaseEnd=T+(mode==='casual'?10:mode==='br'?5:3)}
function knifeHit(){nextFire=T+WP.rate;slashEnd=T+.3;stepNoise(.22,.18,1500,.03);
  const cp=Math.cos(pitch),d=[-Math.sin(yaw)*cp,Math.sin(pitch),-Math.cos(yaw)*cp],o=[P.x,P.y+eye,P.z];let best=wallT(o,d,2.6),tgt=null;
  if(HB&&HB.glass&&best<2.6){breakGlass(HB);best=2.6}
  for(const b of bots){if(b.hp<=0)continue;const t=rayBox(o,d,[b.x-.45,b.y,b.z-.45],[b.x+.45,b.y+1.9,b.z+.45]);if(t<Math.min(best,2.4)){best=t;tgt=b}}
  if(tgt){tgt.hp-=WP.dmg;tgt.alert=1.5;tgt.react=T+.15;hmT=1;stepNoise(.4,.08,900,.004);stepThump(140,70,.1,.25);if(tgt.hp<=0)killBot(tgt,false)}}
function fire(){
  if(WP.melee){knifeHit();return}
  mag--;nextFire=T+WP.rate;if(T-lastShot>.4)shotIdx=0;lastShot=T;
  const i=shotIdx++,sp=Math.hypot(V.x,V.z),bP=punchP,bY=punchY;
  punchP+=Math.min(1.25,.5+i*.12)*.0175*WP.rec;punchY+=Math.sin(i*.65)*Math.min(1,i*.12)*.0175*WP.rec;
  kick=WP.snp?(cw==='m82'?.2:.14):WP.sl===2?.05:.07;flashT=.04;fireSnd();if(WP.bolt)cycEnd=T+WP.rate;
  const Y=yaw+bY,Pp=pitch+bP,sY=Math.sin(Y),cY=Math.cos(Y),sP=Math.sin(Pp),cP=Math.cos(Pp),o=[P.x,P.y+eye,P.z];
  for(let n=0;n<(WP.pel||1);n++){
    const spr=WP.pel?.04:spread(sp),a=Math.random()*6.283,r=Math.sqrt(Math.random())*spr,sx=Math.cos(a)*r,sy=Math.sin(a)*r;
    let d=[-sY*cP+cY*sx+sY*sP*sy,sP+cP*sy,-cY*cP-sY*sx+cY*sP*sy];const l=Math.hypot(...d);d=d.map(v=>v/l);
    let best=wallT(o,d),tgt=null,mult=1,gb=0;for(let gi=0;gi<4&&HB&&HB.glass&&best<1e8;gi++){breakGlass(HB);gb+=best+.06;best=gb+wallT([o[0]+d[0]*gb,o[1]+d[1]*gb,o[2]+d[2]*gb],d)}
    for(const b of bots){if(b.hp<=0)continue;
      const yo=b.y-.5*b.cs,tb=rayBox(o,d,[b.x-.3,b.y,b.z-.3],[b.x+.3,yo+1.45,b.z+.3]),th=rayBox(o,d,[b.x-.17,yo+1.45,b.z-.17],[b.x+.17,yo+1.85,b.z+.17]);
      const t=Math.min(tb,th);if(t<best){best=t;tgt=b;const y=o[1]+d[1]*t;mult=th<tb?4:(y<b.y+.7?.75:1)}}
    const e=[o[0]+d[0]*best,o[1]+d[1]*best,o[2]+d[2]*best];
    tracer([o[0]+cY*.2-sY*.6,o[1]-.15,o[2]-cY*.6-sY*.2],e,0xffe08a);
    if(tgt){tgt.hp-=WP.dmg*mult;tgt.alert=1.5;tgt.react=T+.15;hmT=1;if(tgt.hp<=0)killBot(tgt,mult>=4)}
    else if(best<1e8)mark([e[0]-d[0]*.03,e[1]-d[1]*.03,e[2]-d[2]*.03]);
  }
}
function spread(sp){if(WP.snp)return scoped&&sp<1&&P.g?(WP.bolt?.0004:.0016):.06;const b=.0015+sp*.0012+(P.g?0:.035)+Math.min(shotIdx,10)*.0003;return scoped?b*.6:b}

/* ---------- Simulation ---------- */
function tick(dt){
  T+=dt;
  if(phase==='live'&&mode==='arms'){phaseEnd=T+999;if(dead&&T>=respawnAt)respawnArms()}
  else if(phase==='live'&&mode==='br')brTick(dt);
  else if(phase==='buy'){if(T>=phaseEnd){phase='live';phaseEnd=T+100}}
  else if(phase==='live'){if(dead)endRound(false);else if(bots.every(b=>b.hp<=0))endRound(true);else if(T>=phaseEnd)endRound(false,'Time’s up')}
  else if(T>=phaseEnd)newRound();
  if(!dead){
    const cr=K.ControlLeft||K.KeyC;
    if(cr&&!wasCr&&P.g&&K.ShiftLeft&&T>=slideCd&&P.h>=H&&Math.hypot(V.x,V.z)>4.6&&waterF(P.x,P.z,P.y)<.2){const s0=Math.hypot(V.x,V.z);slideT0=T;slideEnd=T+.95;slideCd=T+1.9;slideDir=[V.x/s0,V.z/s0];slideSp=Math.max(s0,6.6)*1.3;stepNoise(.3*Math.max(.3,stepVol),.7,800,.05)}
    wasCr=cr;if(!cr)slideEnd=0;
    if(cr)P.h=1.2;else if(P.h<H){P.h=H;if(near(P.x,P.z,1).some(b=>hitBox(P,b)))P.h=1.2}
    {const tr=((K.ArrowLeft?1:0)-(K.ArrowRight?1:0))*2.2*dt,tp=((K.ArrowUp?1:0)-(K.ArrowDown?1:0))*1.6*dt;yaw+=tr;pitch=Math.max(-1.5,Math.min(1.5,pitch+tp))}
    const f=(K.KeyW|0)-(K.KeyS|0),s=(K.KeyD|0)-(K.KeyA|0),sy=Math.sin(yaw),cy=Math.cos(yaw);
    let wx=-sy*f+cy*s,wz=-cy*f-sy*s;const wl=Math.hypot(wx,wz);if(wl>0){wx/=wl;wz/=wl}
    const wf=waterF(P.x,P.z,P.y),ws=(wl>0?(P.h<H?2.4:K.ShiftLeft?6.6:3.9):0)*(1-.5*wf);
    if(P.g&&K.Space){V.y=7-3*wf;P.g=false;slideEnd=0}
    const sliding=T<slideEnd&&P.g;
    if(sliding){const u=Math.min(1,(T-slideT0)/.95),spd=1.2+(slideSp-1.2)*(1-u)*(1-u);V.x=slideDir[0]*spd;V.z=slideDir[1]*spd}
    else if(P.g){const sp=Math.hypot(V.x,V.z);if(sp>0){const k=Math.max(sp-Math.max(sp,1.5)*5*dt,0)/sp;V.x*=k;V.z*=k}accel(V,wx,wz,ws,10*ws,dt)}
    else if(wl>0)accel(V,wx,wz,Math.min(ws,.9),62,dt);
    V.y-=20*dt;move(P,V,dt);if(sliding&&Math.hypot(V.x,V.z)<.6)slideEnd=0;
    {const w2=waterF(P.x,P.z,P.y);if(w2>0&&!wasW){ripple(P.x,P.z);ripple(P.x,P.z);stepSnd('water',1.6)}wasW=w2>0;
     if(P.g){const sp=Math.hypot(V.x,V.z);stepD+=sp*dt;if(stepD>1.9){stepD=0;if(sp>1.2&&P.h>=H){stepSnd(surfAt(P.x,P.z,P.y),K.ShiftLeft?1:.45);if(w2>0)ripple(P.x,P.z)}}}}
    const dk=Math.exp(-2.4*dt);punchP*=dk;punchY*=dk;
    if(T<cycEnd)scoped=false;if(reloading&&T>=reloadEnd){const n=Math.min(WP.mag-mag,res);mag+=n;res-=n;reloading=false}
    if(mouse&&!cg&&!reloading&&T>=nextFire){if(mag>0){fire();if(!WP.auto)mouse=false}else reload()}
  }
  nadesTick(dt);doorsTick(dt);phase!=='buy'&&botsTick(dt);
}
function clear(o,p){const dx=p[0]-o[0],dy=p[1]-o[1],dz=p[2]-o[2],l=Math.hypot(dx,dy,dz);return wallT(o,[dx/l,dy/l,dz/l],l,true)>l&&!smokes.some(s=>segSph(o,p,s))}
function botsTick(dt){
  for(const b of bots){
    if(b.hp<=0){if(b.corpse&&b.fy>b.y+.005){b.fv-=20*dt;b.fy=Math.max(b.y,b.fy+b.fv*dt);b.mesh.position.set(b.x,b.fy+.2,b.z)}   // a body that dies in mid-air falls to the ground
      if(b.corpse&&T>b.corpseT){b.mesh.visible=false;b.corpse=false}if(mode==='arms'&&phase==='live'&&T>=b.respawn)respawnBot(b);continue}
    let run=false;if(mode==='br'&&phase==='live'){const zt=ZN.next||ZN,dn=Math.hypot(b.x-zt.cx,b.z-zt.cz)-zt.r,d0=Math.hypot(b.x-ZN.cx,b.z-ZN.cz)-ZN.r;run=d0>-10||(ZN.ph==='shrink'&&dn>-6)||(ZN.ph==='hold'&&ZN.left<45&&dn>-12)}b.run=run;
    const ey=b.y+1.6-.5*b.cs,o=[b.x,ey,b.z],dx=P.x-b.x,dy=P.y+1.2-ey,dz=P.z-b.z,dist=Math.hypot(dx,dy,dz);
    let sees=false;if(!dead&&dist<50&&T>=(b.blind||0)){
      const da=Math.atan2(dx,dz)-b.mesh.rotation.y,ang=Math.abs(((da+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI);
      sees=(b.alert>0||dist<8||ang<D.fov)&&clear(o,[P.x,P.y+eye,P.z])&&clear(o,[P.x,P.y+eye*.65,P.z])}
    if(sees){if(b.alert<=0)b.react=T+(.35+Math.random()*.3)*D.react;b.alert=1.2*D.mem}else b.alert-=dt;
    const px=b.x,pz=b.z;
    if(b.alert>0&&!dead&&!(b.run&&dist>14)){
      b.mesh.rotation.y=Math.atan2(dx,dz);
      const st=Math.sin(T*1.7+b.id*2)*2,rx=Math.cos(b.mesh.rotation.y),rz=-Math.sin(b.mesh.rotation.y);
      const sm=b.cr?.25:1;b.v.x=rx*st*sm;b.v.z=rz*st*sm;
      if(WPN[b.w].melee&&dist>1.6){const hd=Math.hypot(dx,dz)||1;b.v.x=dx/hd*4.2*D.spd;b.v.z=dz/hd*4.2*D.spd}
      if(!b.cr&&b.g&&dist>5&&Math.random()<dt*.4)b.v.y=7;
      if(T>=b.crT){b.crT=T+1+Math.random()*2.5;b.cr=sees&&Math.random()<.4?1:0}
      if(sees&&T>=b.react&&T>=b.cool&&(!WPN[b.w].melee||dist<2.8)){
        b.cool=T+Math.max(.1,WPN[b.w].rate*1.6*D.cool)+Math.random()*.15*D.cool;
        const hc=D.acc*Math.max(.12,.7-dist*.012)*(Math.hypot(V.x,V.z)>3?.6:1)*(P.h<H?.8:1)*(b.g?1:.7),hit=Math.random()<Math.min(.95,hc),m=hit?0:1.8;
        const tp=[P.x+(Math.random()-.5)*m,P.y+1.1+(Math.random()-.5)*m,P.z+(Math.random()-.5)*m],o2=[b.x,b.y+1.3,b.z],ex=tp[0]-o2[0],ey=tp[1]-o2[1],ez=tp[2]-o2[2],el=Math.hypot(ex,ey,ez),wt=Math.min(el,wallT(o2,[ex/el,ey/el,ez/el],el));shatter(o2,[ex/el,ey/el,ez/el],el);
        tracer(o2,[o2[0]+ex/el*wt,o2[1]+ey/el*wt,o2[2]+ez/el*wt],0xff7a55);
        snd((WPN[b.w].snp?.6:.22)/(1+dist*.12),WPN[b.w].snp?.4:.12,WPN[b.w].snp?900:1500);if(hit)hurt(Math.min(60,WPN[b.w].dmg*.3*D.dmg)*(.8+Math.random()*.4)*(WPN[b.w].pel?2:1),b);
      }
    }else{
      b.cr=0;const wx=b.tx-b.x,wz=b.tz-b.z,wd=Math.hypot(wx,wz);
      const zt2=ZN.next||ZN,badT=mode==='br'&&(Math.hypot(b.tx-ZN.cx,b.tz-ZN.cz)>ZN.r||(b.run&&Math.hypot(b.tx-zt2.cx,b.tz-zt2.cz)>zt2.r));
      if(wd<1.5||badT){pickWP(b);b.stuck=0}else if(b.stuck>.45){if(mode==='br'){b.detour=T+1.5;b.dsg=Math.random()<.5?-1:1;if(Math.random()<.3)pickWP(b)}else pickWP(b);b.stuck=0}
      else{if(b.stuck>.12&&b.g)b.v.y=7;let ux=wx/wd,uz=wz/wd;if(T<(b.detour||0)){const a=b.dsg*1.1,c=Math.cos(a),s2=Math.sin(a),tx=ux*c-uz*s2;uz=ux*s2+uz*c;ux=tx}const sp=3.4*D.spd*(b.run?1.7:1);b.v.x=ux*sp;b.v.z=uz*sp;b.mesh.rotation.y=Math.atan2(ux,uz)}
    }
    b.v.y-=20*dt;{const wf=waterF(b.x,b.z,b.y);if(wf>0){b.v.x*=1-.45*wf;b.v.z*=1-.45*wf}}move(b,b.v,dt);
    if(b.g&&!b.cr){b.sd=(b.sd||0)+Math.hypot(b.v.x,b.v.z)*dt;if(b.sd>1.9){b.sd=0;const d0=Math.hypot(b.x-P.x,b.z-P.z);if(d0<35){stepSnd(surfAt(b.x,b.z,b.y),Math.max(0,1-d0/35)*.9);if(waterF(b.x,b.z,b.y)>0)ripple(b.x,b.z)}}}
    {const spd=Math.hypot(b.v.x,b.v.z);b.cs+=((b.cr?1:0)-b.cs)*Math.min(1,dt*10);const c=b.cs;b.h=c>.5?1.2:H;b.ph+=spd*dt*2.4;
    const sw=Math.sin(b.ph)*Math.min(1,spd/3)*.7*(b.g?1:.3)*(1-c);b.up.position.y=-.46*c;
    b.legs.forEach((L,i)=>{L.position.y=.88-.46*c;L.rotation.x=(i?-sw:sw)-1.0*c});b.knees.forEach((K,i)=>{K.rotation.x=Math.max(0,i?sw:-sw)*.9+1.9*c})}
    if(b.alert<=0){if(Math.hypot(b.x-px,b.z-pz)<.3*3.4*dt)b.stuck+=dt;else b.stuck=0}
    b.mesh.position.set(b.x,b.y,b.z);
  }
}

/* ---------- Render loop ---------- */
let last=performance.now(),acc=0;
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min((now-last)/1000,.1);last=now;
  if(playing){acc+=dt;while(acc>=STEP){tick(STEP);acc-=STEP}}
  const sp=Math.hypot(V.x,V.z);
  const isSl=T<slideEnd&&!dead;eye+=((isSl?.78:P.h<H?1.1:1.62)-eye)*Math.min(1,dt*14);cam.position.set(P.x,P.y+eye-(dead?1.2:0),P.z);
  slR+=((isSl?.06:0)-slR)*Math.min(1,dt*9);cam.rotation.set(pitch+punchP,yaw+punchY,dead?.9:slR);
  const runNow=!!(K.ShiftLeft&&sp>4.8&&P.g&&P.h>=H&&!dead&&!reloading&&!cg&&!scoped&&T-lastShot>.3&&!isSl);runK+=((runNow?1:0)-runK)*Math.min(1,dt*7);slK+=((isSl?1:0)-slK)*Math.min(1,dt*9);
  const adsT=scoped&&!WP.snp&&!reloading?1:0;adsK+=(adsT-adsK)*Math.min(1,dt*12);
  if(scoped&&(!canScope()||cg||dead))scoped=false;aimLabels();const tf=scoped?scopeFov():FOV+4*runK+3*slK;if(Math.abs(cam.fov-tf)>.01){cam.fov=tf;cam.updateProjectionMatrix()}gun.visible=!(scoped&&(WP.snp||(curOpt()&&adsK>.4)));for(const k in VM)VM[k].visible=k===cw&&!cg;NV.visible=!!cg;if(cg){NV.material.color.set(NC[cg]);NV.position.set(grenHeld?.02:0,grenHeld?-.02:-.05,grenHeld?-.05:-.15)}aimUpdate();animVM();flash.position.z=FZ[cw];
  const sc=scoped&&!dead&&WP.snp,ads=scoped&&!dead&&!WP.snp&&adsK>.4,so=ads&&!!curOpt(),oc=so?owned[cw].opt:'',mg=oc==='x2'||oc==='x4';
  {const sk=$('scope');sk.style.display=sc||mg?'block':'none';if(mg){sk.className='op';sk.style.setProperty('--sr',oc==='x4'?'27vmin':'33vmin')}else if(sk.className){sk.className='';sk.style.removeProperty('--sr')}}
  $('xh').style.display=sc||ads?'none':'';{const r=$('reti'),cl=so?'hud '+oc:'hud';if(r.className!==cl){r.className=cl;r.style.display=so?'block':'none'}}
  kick=Math.max(0,kick-dt*.5);flashT=Math.max(0,flashT-dt);
  {const o=owned[cw],t=curOpt()&&o.opt,vo=VMO[cw];if(vo)for(const k of OPTK)if(vo[k])vo[k].visible=k===t&&adsK<.4}
  if(P.g)bob+=sp*dt*(1.35+.75*runK);
  {const wk=Math.min(1,sp/4)*(P.g?1:0)*(1-runK)*(1-adsK),bs=Math.sin(bob*2),bc=Math.cos(bob);
   // walk: a small, slow sway.  run: the gun is lowered and angled across the body and bounces harder.  slide: tilted and dropped.
   gun.position.set(.2*(1-adsK)-.075*runK+bc*(.0045*wk+.013*runK)+.03*slK,-.2*(1-adsK)-(TIP[cw]||.1)*adsK-.055*runK-.07*slK+bs*(.006*wk+.016*runK),-.45+kick+.03*runK-.02*adsK);
   gun.rotation.set(-.42*runK+bs*.012*runK-.1*slK,.5*runK+bc*.02*runK,-.3*runK+bc*.02*runK+.3*slK+bs*.004*wk)}
  flash.visible=flashT>0;
  for(let i=fx.length-1;i>=0;i--){const f=fx[i];f.t-=dt;if(f.max)f.m.material.opacity=Math.max(0,f.t/f.max);
    if(f.t<=0){scene.remove(f.m);fx.splice(i,1)}}
  for(let i=ripples.length-1;i>=0;i--){const q=ripples[i];q.t+=dt;const k=q.t/.9;q.m.scale.setScalar(1+k*6);q.m.material.opacity=.7*(1-k);if(k>=1){scene.remove(q.m);ripples.splice(i,1)}}
  waterMs.forEach((w,i)=>{w.position.y=(w.userData.y0===undefined?-.12:w.userData.y0)+Math.sin(T*1.3+i*2)*.02});
  for(let i=shards.length-1;i>=0;i--){const q=shards[i];q.t-=dt;q.vy-=14*dt;q.m.position.x+=q.vx*dt;q.m.position.y+=q.vy*dt;q.m.position.z+=q.vz*dt;q.m.rotation.x+=dt*6;if(q.t<=0){scene.remove(q.m);shards.splice(i,1)}}
  dmgFlash=Math.max(0,dmgFlash-dt*1.6);hmT=Math.max(0,hmT-dt*4);
  $('vg').style.opacity=dmgFlash*.8;fbang=Math.max(0,fbang-dt*.3);$('fb').style.opacity=Math.min(1,fbang*1.4);$('hm').className='hud'+(hmT>.7?' on':'');$('hm').style.opacity=hmT>.7?1:hmT;
  const ppr=(innerHeight/2)/Math.tan(cam.fov*Math.PI/360);$('xh').style.setProperty('--g',(spread(sp)*ppr*.9+3).toFixed(1)+'px');
  hudUpdate();drawCompass();ddT=Math.max(0,ddT-dt);$('dd').style.opacity=Math.min(1,ddT*1.4);
  $('info').innerHTML=mode==='br'?'':modeInfo()+' &nbsp; Eliminations '+kills+'<br>HE '+nade.he+' &nbsp; FL '+nade.fl+' &nbsp; SM '+nade.sm+(cg?' &nbsp; ▶ '+cg.toUpperCase():'')+'<br>Speed '+sp.toFixed(1)+' m/s';brHud();
  $('buy').innerHTML=shopText();
  ren.render(scene,cam);
}
requestAnimationFrame(frame);

/* ---------- Input ---------- */
// The game only runs while the mouse is locked (pointerlockchange -> setPlay). If the browser refuses the lock
// (e.g. re-clicking right after Esc), the pause overlay stays up and the next click retries.
function lockMouse(){const fail=e=>{console.warn('Pointer lock refused:',e&&e.message||e);if(!inMenu)setPlay(false)};try{const p=cv.requestPointerLock();if(p&&p.catch)p.catch(fail)}catch(e){fail(e)}}
function setPlay(v){playing=v;if(!v)grenHeld=false;$('start').style.display=(v||inMenu)?'none':'flex';if(!v){mouse=false;for(const k in K)K[k]=false}}
$('start').addEventListener('click',()=>{
  initAudio();if(AC&&AC.state==='suspended')AC.resume();
  lockMouse();
});
document.addEventListener('pointerlockchange',()=>setPlay(document.pointerLockElement===cv));
addEventListener('mousemove',e=>{if(!playing||dead||document.pointerLockElement!==cv)return;const s=SENS*sensMul*(scoped?(WP.snp?.3:(curOpt()?curOpt().sens:.85)):1);yaw-=e.movementX*s;pitch=Math.max(-1.5,Math.min(1.5,pitch-e.movementY*s))});
addEventListener('mousedown',e=>{if(playing&&e.button===0){mouse=true;if(cg&&!dead)grenHeld=true}if(playing&&e.button===2&&cg&&!dead)lob=!lob;else if(playing&&e.button===2&&canScope()&&!dead&&(scoped||(T>=cycEnd&&!reloading)))scoped=!scoped});
addEventListener('mouseup',e=>{if(e.button===0){mouse=false;if(grenHeld&&cg&&!dead&&playing)throwNade();grenHeld=false}});
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{
  if(e.code==='Escape'){if(playing&&!document.pointerLockElement)setPlay(false);return}
  if(!playing)return;K[e.code]=true;if(e.code==='Space'||e.ctrlKey||e.code.startsWith('Arrow'))e.preventDefault();
  if(e.code==='KeyM'&&mode==='br'){openBig(!bigOpen);return}
  if(e.code==='KeyB'&&phase==='buy'&&!dead&&mode==='casual')shop=shop===null?'m':null;
  else if(shop!==null&&/^Digit\d$/.test(e.code))shopKey(+e.code[5]);
  else{
    if(e.code==='KeyR')reload();
    if(e.code==='Digit1'){cg=null;switchW(wslot(1))}
    if(e.code==='Digit2'){cg=null;switchW(wslot(2))}
    if(e.code==='KeyE'&&!dead){if(mode==='br'&&brNear)swapPick(brNear);else useDoor()}
    if(e.code==='Digit3'){cg=null;switchW('knife')}
    const gk={Digit4:'he',Digit5:'fl',Digit6:'sm'}[e.code];if(gk&&nade[gk]>0&&!dead&&!reloading)cg=cg===gk?null:gk}});
addEventListener('keyup',e=>{K[e.code]=false});
addEventListener('blur',()=>{mouse=false;grenHeld=false;for(const k in K)K[k]=false});
let inMenu=true,menuMode=null,wheelT=0;
const MD={blockout:'Open arena with crates and walls',mansion:'Two-floor house with a garden',dust2:'Both bombsites: A long and short, B tunnels, mid, CT spawn',br:'900 m island: mountains, rivers, a mall, a port, an airfield and more'};
const MODES=[['casual','Casual','Buy phase, shop, grenades and money. Win rounds by eliminating all bots.'],['sniper','Only Sniper','Everyone carries only an AWP. Every shot counts.'],['arms','Arms Race','Every kill upgrades your weapon. Finish the ladder first.'],['br','Battle Royale','Huge island, loot, shrinking zone. Last one alive wins.']];
const MMAPS={casual:['blockout','mansion','dust2'],sniper:['blockout','dust2'],arms:['blockout','mansion','dust2'],br:['br']};
function card(t,d,f){const b=document.createElement('button');b.className='card';b.innerHTML='<b>'+t+'</b>'+d;b.onclick=f;$('cards').appendChild(b)}
function showMenu(){inMenu=true;setPlay(false);$('menu').style.display='flex';$('cards').innerHTML='';$('mback').style.display='none';
  card('Drop in','900 m island with mountains, rivers, towns, a mall, a port and an airfield. Loot weapons, optics and armor, stay inside the shrinking zone, and be the last one alive.',()=>startGame('br','br'))}
function startGame(m,k){lastMap=k;setMode(m);inMenu=false;$('menu').style.display='none';initAudio();if(AC&&AC.state==='suspended')AC.resume();
  lockMouse()}
$('mback').onclick=()=>showMenu();
$('tomenu').onclick=e=>{e.stopPropagation();if(document.pointerLockElement)document.exitPointerLock();showMenu()};
{const dd=$('mdiff');for(const k in DIFF){const b=document.createElement('button');b.textContent=DIFF[k].n;b.className='dbtn'+(k==='normal'?' on':'');b.onclick=()=>{D=DIFF[k];[...dd.children].forEach(c=>c.classList.toggle('on',c===b))};dd.appendChild(b)}}
$('sens').oninput=e=>{sensMul=+e.target.value};
$('fvol').oninput=e=>{stepVol=+e.target.value/100};
addEventListener('wheel',e=>{if(!playing||dead)return;const n=performance.now();if(n-wheelT<140)return;wheelT=n;if(cg){cg=null;return}
  const ks=Object.keys(owned);if(mode!=='br')ks.sort((a,b)=>WPN[a].sl-WPN[b].sl);if(ks.length<2)return;switchW(ks[(ks.indexOf(cw)+(e.deltaY>0?1:-1)+ks.length)%ks.length])},{passive:true});
showMenu();
