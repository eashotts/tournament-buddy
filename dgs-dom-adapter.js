// Local browser-only DOM adapter prototype. Run only on pages you are authorized to process.
// No network calls, no credentials, no contact info, and no automatic submission.
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.DGSPageAdapter=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const DIV=/\b(MPO|FPO|MP\d{2}|FP\d{2}|MA\d{1,2}|FA\d{1,2}|MJ\d{2}|FJ\d{2}|RAH|RAD|RAE|RAF|RAG|RPA)\b/i;
function extract(doc){if(!doc||!doc.querySelectorAll)throw Error("Document required");const players=[],seen=new Set();let division="",ignored=0;
const headings=[...doc.querySelectorAll("h1,h2,h3,h4,h5,h6,th,strong,b")];
const candidates=[...doc.querySelectorAll('a[href*="/player/"]')];
for(const a of candidates){const href=a.getAttribute("href")||"";const match=href.match(/(?:^|\/)player\/([1-9]\d*)(?:[/?#]|$)/);if(!match)continue;
const row=a.closest("tr,li")||a.parentElement?.parentElement||a.parentElement;if(!row){ignored++;continue;}
const raw=(row.textContent||"").replace(/\s+/g," ").trim();const name=(row.querySelector("a[href*='/profile/']")?.textContent||"").trim()||raw.replace(/\b\d{3,9}\b/g,"").replace(/\bWL\s*#?\d+\b/ig,"").trim();
let code="";for(const h of headings){if(h.compareDocumentPosition(a)&Node.DOCUMENT_POSITION_FOLLOWING){const found=(h.textContent||"").match(DIV);if(found)code=found[1].toUpperCase();}}
if(!code){const found=(row.closest("section,table,div")?.textContent||"").slice(0,120).match(DIV);if(found)code=found[1].toUpperCase();}
const id=match[1];if(!code||!name||seen.has(id)){ignored++;continue;}seen.add(id);
players.push({name,pdgaNumber:id,division:code,status:/\bWL\s*#?\d+\b|waitlist/i.test(raw)?"waitlist":"registered"});}
return {players,ignored,registered:players.filter(p=>p.status==="registered").length,waitlisted:players.filter(p=>p.status==="waitlist").length};}
return {extract};
});
