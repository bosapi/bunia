import { safeJsonStringify } from "../../html.ts";

export interface OverlayConfig {
	aiEndpoint?: string;
	endpoint: string;
}

export function getOverlayScript(config: OverlayConfig): string {
	const cfg = safeJsonStringify(config);
	return (
		`<script>window.__BOSIA_INSPECTOR__=${cfg};</script>\n` + `<script>${OVERLAY_IIFE}</script>`
	);
}

const OVERLAY_IIFE = `(function(){
var CFG=window.__BOSIA_INSPECTOR__||{};
var EP=CFG.endpoint||"/__bosia/locate";
var AI=CFG.aiEndpoint||null;
var altDown=false,outline=null,tip=null,form=null;

function ensureOutline(){
  if(outline)return;
  outline=document.createElement("div");
  outline.style.cssText="position:fixed;pointer-events:none;border:2px solid #f73b27;background:rgba(247,59,39,.08);z-index:2147483646;border-radius:2px;transition:all .05s linear;display:none";
  document.body.appendChild(outline);
  tip=document.createElement("div");
  tip.style.cssText="position:fixed;pointer-events:none;background:#111;color:#fff;font:11px/1.4 ui-monospace,monospace;padding:3px 6px;border-radius:3px;z-index:2147483647;display:none;white-space:nowrap";
  document.body.appendChild(tip);
}
function hideOutline(){if(outline)outline.style.display="none";if(tip)tip.style.display="none"}
function showOutline(el,loc){
  ensureOutline();
  var r=el.getBoundingClientRect();
  outline.style.display="block";
  outline.style.left=r.left+"px";outline.style.top=r.top+"px";
  outline.style.width=r.width+"px";outline.style.height=r.height+"px";
  tip.style.display="block";tip.textContent=loc;
  var ty=r.top-22;if(ty<0)ty=r.bottom+4;
  tip.style.left=r.left+"px";tip.style.top=ty+"px";
}
function parseLoc(s){var m=/^(.+):(\\d+):(\\d+)$/.exec(s);if(!m)return null;return{file:m[1],line:+m[2],col:+m[3]}}
function findTarget(e){var n=e.target;while(n&&n.nodeType===1){if(n.hasAttribute&&n.hasAttribute("data-bosia-loc"))return n;n=n.parentNode}return null}

function toast(msg,err){
  var t=document.createElement("div");
  t.textContent=msg;
  t.style.cssText="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:"+(err?"#dc2626":"#111")+";color:#fff;padding:8px 14px;border-radius:6px;font:13px ui-sans-serif,system-ui,sans-serif;z-index:2147483647;box-shadow:0 4px 12px rgba(0,0,0,.2);opacity:0;transition:opacity .15s";
  document.body.appendChild(t);
  requestAnimationFrame(function(){t.style.opacity="1"});
  setTimeout(function(){t.style.opacity="0";setTimeout(function(){t.remove()},200)},2200);
}

function send(payload,onOk){
  fetch(EP,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)})
    .then(function(r){return r.json().catch(function(){return{}})})
    .then(function(j){if(j&&j.ok){onOk&&onOk(j)}else{toast("Inspector: request failed",true)}})
    .catch(function(){toast("Inspector: network error",true)});
}

function closeForm(){if(form){form.remove();form=null}}
function openForm(loc,el){
  closeForm();
  var r=el.getBoundingClientRect();
  form=document.createElement("div");
  form.style.cssText="position:fixed;left:"+r.left+"px;top:"+(r.bottom+6)+"px;background:#fff;color:#111;border:1px solid #d4d4d8;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.18);padding:10px;width:340px;z-index:2147483647;font:13px ui-sans-serif,system-ui,sans-serif";
  form.innerHTML='<div style="font-size:11px;color:#71717a;margin-bottom:6px;font-family:ui-monospace,monospace">'+loc.file+":"+loc.line+'</div>'+
    '<textarea placeholder="Describe a fix (Enter to send, Esc to cancel, empty = open in editor)" style="width:100%;min-height:64px;border:1px solid #e4e4e7;border-radius:4px;padding:6px;font:13px ui-sans-serif,system-ui,sans-serif;resize:vertical;box-sizing:border-box;outline:none"></textarea>'+
    '<div style="margin-top:8px;display:flex;gap:6px;justify-content:flex-end">'+
    '<button data-cancel style="padding:4px 10px;border:1px solid #e4e4e7;background:#fff;border-radius:4px;cursor:pointer;font-size:12px">Cancel</button>'+
    '<button data-send style="padding:4px 10px;border:0;background:#111;color:#fff;border-radius:4px;cursor:pointer;font-size:12px">Send</button>'+
    '</div>';
  document.body.appendChild(form);
  var ta=form.querySelector("textarea");
  ta.focus();
  function submit(){
    var comment=ta.value.trim();
    var payload={file:loc.file,line:loc.line,col:loc.col};
    if(comment)payload.comment=comment;
    send(payload,function(j){toast(j.mode==="ai"?"sent to AI":"opened "+loc.file+":"+loc.line)});
    closeForm();
  }
  form.querySelector("[data-send]").addEventListener("click",submit);
  form.querySelector("[data-cancel]").addEventListener("click",closeForm);
  ta.addEventListener("keydown",function(e){
    if(e.key==="Escape"){e.preventDefault();closeForm()}
    else if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit()}
  });
}

window.addEventListener("keydown",function(e){
  if(e.key==="Alt"||e.altKey)altDown=true;
  if(e.key==="Escape")closeForm();
},true);
window.addEventListener("keyup",function(e){if(e.key==="Alt"){altDown=false;hideOutline()}},true);
window.addEventListener("blur",function(){altDown=false;hideOutline()});

window.addEventListener("mousemove",function(e){
  if(!altDown||form){hideOutline();return}
  var el=findTarget(e);
  if(!el){hideOutline();return}
  showOutline(el,el.getAttribute("data-bosia-loc"));
},true);

window.addEventListener("click",function(e){
  if(!altDown)return;
  if(form&&form.contains(e.target))return;
  var el=findTarget(e);
  if(!el)return;
  e.preventDefault();e.stopPropagation();
  var loc=parseLoc(el.getAttribute("data-bosia-loc"));
  if(!loc)return;
  hideOutline();
  if(AI)openForm(loc,el);
  else send(loc,function(){toast("opened "+loc.file+":"+loc.line)});
},true);
})();`;
