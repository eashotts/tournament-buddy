"use strict";
(function(){
const section=document.getElementById("lodging"),destination=document.getElementById("lodging-destination"),start=document.getElementById("lodging-checkin"),end=document.getElementById("lodging-checkout"),guests=document.getElementById("lodging-guests"),notice=document.getElementById("lodging-note"),eventLink=document.getElementById("lodging-event-link");
function field(obj,names){for(const name of names){const v=obj?.[name];if(typeof v==="string"&&v.trim())return v.trim();}return "";}
function info(meta){if(!meta||typeof meta!=="object")return {};
 const m=meta.event&&typeof meta.event==="object"?meta.event:meta;
 const city=field(m,["City","city","TournCity","tournCity","EventCity","eventCity","LocationCity"]);
 const state=field(m,["State","state","StateProv","stateProv","TournState","tournState","EventState"]);
 const date=field(m,["StartDate","startDate","start_date","TournDate","tournDate","Date"]);
 const endDate=field(m,["EndDate","endDate","end_date"]);
 return {city,state,date,endDate};
}
function day(v){const m=String(v||"").match(/^(\d{4})-(\d{2})-(\d{2})/);return m?m[0]:"";}
function addDays(value,n){const d=new Date(value+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
function setEvent(url,meta){let id;try{id=PDGAData.eventId(url);}catch{return;}
 eventLink.href="https://www.pdga.com/tour/event/"+id;eventLink.hidden=false;
 const details=info(meta);if(details.city)destination.value=[details.city,details.state].filter(Boolean).join(", ");
 const date=day(details.date),last=day(details.endDate);
 if(date){start.value=date;end.value=last?addDays(last,1):addDays(date,2);}
 notice.textContent=details.city?"Destination suggested from PDGA event metadata. Confirm the tournament venue and travel dates before searching.":"Enter the tournament city or venue below. Event location was not available in the PDGA Live data.";
}
document.getElementById("lodging-form").addEventListener("submit",e=>{
 e.preventDefault();const where=destination.value.trim(),type=document.getElementById("lodging-type").value;
 if(!where){notice.textContent="Enter the event city or venue to search nearby stays.";destination.focus();return;}
 if(start.value&&end.value&&end.value<=start.value){notice.textContent="Check-out must be after check-in.";return;}
 const count=Math.max(1,Math.min(20,Number(guests.value)||1));
 let url;
 if(type==="hotel"){const q=new URLSearchParams({ss:where,group_adults:String(count),no_rooms:"1"});if(start.value)q.set("checkin",start.value);if(end.value)q.set("checkout",end.value);url="https://www.booking.com/searchresults.html?"+q.toString();}
 else if(type==="rv"){url="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent("RV parks and campgrounds near "+where);}
 else if(type==="cabin"){url="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent("cabins and vacation rentals near "+where);}
 else{url="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent("lodging near "+where);}
 const a=document.createElement("a");a.href=url;a.target="_blank";a.rel="noopener noreferrer";a.click();
 notice.textContent=type==="hotel"?"Booking.com opened with your destination and dates. Availability and prices are confirmed there.":"A nearby-stays search opened in a new tab. Verify dates, amenities, and availability on the property's booking site.";
});
window.BuddyLodging={setEvent};
})();
