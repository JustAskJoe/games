// ─── Canvas & pixel renderer ───
// Pixel-art scenes draw onto a small offscreen canvas (one unit = one art pixel)
// and are blown up by a whole number at the end of the frame, so every pixel is
// the same size on screen. Scenes not converted yet draw straight to the screen.
const canvas = document.getElementById('game');
const screenCtx = canvas.getContext('2d');
const pix = document.createElement('canvas');
const pixCtx = pix.getContext('2d');
let ctx = screenCtx;
let PIXEL_SCALE = 3;     // screen pixels per art pixel (art-direction.md); 2 on short screens (phones), see resize()
let touchMode = false, lastPointer = 'mouse';   // touch.js: on after the first touch; the last pointer's kind
const TC_COL = 104;      // touch: screen px kept free on the right for the menu key column
let SCALE = 1;           // scale of the scene being drawn this frame
const $ = id => document.getElementById(id);
const COL = { cyan:'#66ccaa', cyanDark:'#448866', red:'#cc4444', redDark:'#883322', gold:'#ffcc44', green:'#66bb44', purple:'#8866aa', purpleDark:'#554477', blue:'#5588cc' };

function resize() { PIXEL_SCALE = Math.min(innerWidth, innerHeight) < 600 ? 2 : 3; document.documentElement.style.setProperty('--hz', Math.max(0.5, Math.min(1, Math.min(innerWidth / 1280, innerHeight / 800) * 1.25))); canvas.width=innerWidth*devicePixelRatio; canvas.height=innerHeight*devicePixelRatio; screenCtx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); screenCtx.imageSmoothingEnabled=false; }
addEventListener('resize', resize); resize();
// Width/height of the scene in its own units (art pixels when SCALE > 1).
const W=()=>Math.ceil(innerWidth/SCALE), H=()=>Math.ceil(innerHeight/SCALE);
function beginFrame(scale){
  SCALE=scale;
  if(scale===1){ctx=screenCtx;return;}
  const w=W(),h=H();
  if(pix.width!==w||pix.height!==h){pix.width=w;pix.height=h;}
  ctx=pixCtx;ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;
}
function endFrame(){
  if(SCALE===1)return;
  screenCtx.imageSmoothingEnabled=false;
  screenCtx.drawImage(pix,0,0,pix.width*SCALE,pix.height*SCALE);
}
// Top-down camera: world x/y map straight onto the screen.
function toScreen(wx,wy){return{x:wx,y:wy}}
function toWorld(sx,sy){return{x:sx,y:sy}}
function dist(a,b){const dx=a.x-b.x,dy=a.y-b.y;return Math.sqrt(dx*dx+dy*dy)}
function angleBetween(a,b){return Math.atan2(b.y-a.y,b.x-a.x)}

