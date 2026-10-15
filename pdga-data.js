// PDGA Live integration: public CORS-enabled endpoints; historical results endpoint requires validation.
// This file intentionally contains no private documentation or credentials.
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.PDGAData=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const base="https://www.pdga.com/apps/tournament/live-api";
async function json(url){const r=await fetch(url,{headers:{Accept:"application/json"}});if(!r.ok)throw Error("PDGA returned HTTP "+r.status);const body=await r.json();return Object.prototype.hasOwnProperty.call(body,"data")?body.data:body;}
function eventId(input){const raw=String(input).trim();if(/^[1-9][0-9]*$/.test(raw))return raw;const m=raw.match(/^https?:\/\/(?:www\.)?pdga\.com\/(?:tour\/event\/|live\/event\/)([1-9][0-9]*)(?:[/?#]|$)/i);if(!m)throw Error("Enter a PDGA event URL or event ID.");return m[1];}
function resolveEventUrl(input){const raw=String(input||"").trim();const id=/^[1-9]\d*$/.test(raw)?raw:eventId(raw);return Promise.resolve("https://www.pdga.com/tour/event/"+id);}
function searchEvents(query){return json(base+"/live_results_fetch_events_by_query?Query="+encodeURIComponent(query));}
function recentEvents(){return json(base+"/live_results_fetch_recent_events_grouped");}
function divisionCodes(event){const raw=event?.Divisions||event?.divisions||[];const rows=Array.isArray(raw)?raw:Object.entries(raw).map(([code,val])=>({code,...(val&&typeof val==="object"?val:{})}));return [...new Set(rows.map(d=>String(d.Division||d.division||d.code||d.DivisionCode||d.Code||"").toUpperCase()).filter(x=>/^[A-Z]{2,4}\d{0,2}$/.test(x)))];}
function extractRows(payload,code){const blocks=Array.isArray(payload)?payload:[payload];const result=[];for(const block of blocks){if(!block||typeof block!=="object")continue;for(const row of block.scores||block.Scores||[]){const number=Number(row.PDGANum);if(!Number.isSafeInteger(number)||number<=0)continue;result.push({pdgaNumber:String(number),name:String(row.Name||"PDGA #"+number),division:String(row.Division||block.division||code),city:String(row.City||""),state:String(row.StateProv||""),country:String(row.Country||"USA"),status:"registered"});}}return result;}
async function registration(event){
 const id=eventId(event);
 const rows=await json("https://www.pdga.com/api/v1/live-tournaments/"+id+"/live-results");
 if(!Array.isArray(rows))throw Error("PDGA registration endpoint returned an unexpected response.");
 const seen=new Set(),players=[],divisions=new Set();
 for(const row of rows){
  const number=String(row.pdgaNum??"").trim();
  if(!/^[1-9][0-9]*$/.test(number)||seen.has(number))continue;
  seen.add(number);
  const division=String(row.division??"").trim().toUpperCase();
  if(division)divisions.add(division);
  players.push({pdgaNumber:number,name:[row.firstName,row.lastName].filter(Boolean).join(" ").trim()||"PDGA #"+number,division,city:"",state:"",country:"",status:"registered"});
 }
 let metadata={};try{metadata=await json(base+"/live_results_fetch_event?TournID="+id);}catch{}
 return {eventId:id,players,divisions:[...divisions],failed:[],metadata,complete:true,source:"PDGA Live event player records"};
}
function historyRows(payload){
 const data=payload?.data??payload;
 function collect(value,depth=0){
  if(depth>6||value==null||typeof value!=="object")return [];
  if(Array.isArray(value))return value.flatMap(v=>collect(v,depth+1));
  const rows=[];
  if(value.liveResult&&typeof value.liveResult==="object")rows.push(value.liveResult);
  if(value.tournId||value.TournID||value.eventId||value.event_id)rows.push(value);
  if(rows.length)return rows;
  return Object.values(value).flatMap(v=>collect(v,depth+1));
 }
 const raw=collect(data),seen=new Set(),out=[];
 for(const row of raw){
  const id=String(row.tournId??row.TournID??row.eventId??row.event_id??"").trim();
  if(!/^[1-9][0-9]*$/.test(id))continue;
  const tournament=row.tournament&&typeof row.tournament==="object"?row.tournament:{};
  const name=String((typeof row.tournament==="string"&&row.tournament.trim()?row.tournament:null)??tournament.name??tournament.tournName??tournament.eventName??tournament.tournamentName??tournament.title??tournament.event_name??row.eventName??row.name??"Event #"+id);
  const date=String(tournament.startDate??tournament.start_date??row.startDate??row.date??"");
  const division=String(row.division?.code??row.division?.division??row.division??"");
  const key=id+"|"+division;if(seen.has(key))continue;seen.add(key);
  out.push({eventId:id,name,date,division});
 }
 if(!out.length)throw Error("No valid tournId values found inside PDGA liveResult records. No matches were calculated.");
 return out;
}
const titleCache=new Map();let activeTitles=0;const titleQueue=[];
function titleFrom(value,depth=0){if(depth>3||!value||typeof value!=="object")return null;const names=["Name","TournName","TournamentName","EventName","name","tournName","tournamentName","eventName","title","Title"];for(const key of names){if(typeof value[key]==="string"&&value[key].trim())return value[key].trim();}for(const key of ["event","Event","tournament","Tournament","data"]){const found=titleFrom(value[key],depth+1);if(found)return found;}return null;}
function pumpTitles(){while(activeTitles<3&&titleQueue.length){const job=titleQueue.shift();activeTitles++;json(base+"/live_results_fetch_event?TournID="+encodeURIComponent(job.id)).then(payload=>job.resolve(titleFrom(payload))).catch(()=>job.resolve(null)).finally(()=>{activeTitles--;pumpTitles();});}}
function eventTitle(id){const key=String(id);if(!/^[1-9][0-9]*$/.test(key))return Promise.resolve(null);if(!titleCache.has(key))titleCache.set(key,new Promise(resolve=>{titleQueue.push({id:key,resolve});pumpTitles();}));return titleCache.get(key);}
async function history(playerId){if(!/^[1-9]\d*$/.test(String(playerId)))throw Error("Invalid PDGA number");return historyRows(await json("https://www.pdga.com/api/v1/feat/members/"+playerId+"/results"));}
return {eventId,resolveEventUrl,searchEvents,recentEvents,divisionCodes,extractRows,registration,historyRows,history,eventTitle};
});
