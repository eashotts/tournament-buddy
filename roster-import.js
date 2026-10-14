// Import explicitly provided registration rows; no automated collection or network access.
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.BuddyRoster=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
function parse(text){if(typeof text!=="string")throw Error("Paste a roster first");const lines=text.split(/\r?\n/);let division="",invalid=0;const players=[],seen=new Set();
for(const raw of lines){const line=raw.trim();if(!line)continue;const heading=line.match(/^([A-Z]{2,4}[0-9]{0,2})\s*(?:[·:—-]|$)/);if(heading&&line.length<100){division=heading[1];continue;}
let parts=line.includes("\t")?line.split("\t"):line.includes("|")?line.split("|"):line.split(",");parts=parts.map(s=>s.trim()).filter(Boolean);
let div=division,name="",number="",status="registered",city="",state="";
if(parts.length>=3&&/^[A-Z]{2,4}[0-9]{0,2}$/.test(parts[0])){div=parts.shift();}
if(parts.length>=2){name=parts[0];const candidate=parts[1].match(/(?:#|PDGA\s*#?)?\s*([1-9][0-9]{2,8})\b/i);if(candidate)number=candidate[1];if(parts[2]&&/^[A-Z]{2,4}[0-9]{0,2}$/.test(parts[2]))div=parts[2];const remaining=parts.slice(2);for(const p of remaining){if(/^(?:WL\s*#?\d+|waitlist(?:ed)?|registered)$/i.test(p))status=/^registered$/i.test(p)?"registered":"waitlist";else if(/^[A-Z]{2}$/.test(p))state=p;else if(!/^[A-Z]{2,4}[0-9]{0,2}$/.test(p)&&!city)city=p;}}
if(!number||!name||!div){invalid++;continue;}if(seen.has(number))continue;seen.add(number);players.push({name,pdgaNumber:number,division:div,status,city,state});}
return {players,invalid,registered:players.filter(p=>p.status==="registered").length,waitlisted:players.filter(p=>p.status==="waitlist").length};}
return {parse};
});
