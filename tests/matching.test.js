// Run: node tests/matching.test.js
const assert=require("node:assert/strict");
const {matchBuddies,normalizeHistory}=require("../matching.js");
const me=[{eventId:123,name:"Open",date:"2025-01-01",division:"MA2"},{eventId:"123",division:"MA2"},{eventId:456,name:"Classic",date:"2024-01-01",division:"MA1"}];
const data={playerId:1,registrants:[{pdgaNumber:1,name:"Self"},{pdgaNumber:2,name:"Other",division:"MA3"},{pdgaNumber:2,name:"Duplicate"},{pdgaNumber:3,name:"No overlap"},{pdgaNumber:4,name:"Missing history"}],historyByPlayer:{"1":me,"2":[{eventId:"123",division:"MA3"},{eventId:456,division:"MA1"}],"3":[{eventId:789,division:"MA1"}]}};
const out=matchBuddies(data);
assert.equal(out.matches.length,1);assert.equal(out.matches[0].sharedCount,2);assert.equal(out.matches[0].sameDivisionCount,1);assert.equal(out.matches[0].sharedEvents.find(e=>e.eventId==="123").sameDivision,false);assert.equal(out.skippedMissingHistory,1);assert.equal(normalizeHistory(me).size,2);
assert.equal(matchBuddies({...data,historyByPlayer:{"1":[],"2":[],"3":[]}}).matches.length,0);
assert.throws(()=>matchBuddies({...data,playerId:"bad"}));
assert.equal(matchBuddies({playerId:"1",registrants:[{pdgaNumber:"2",name:"A"}],historyByPlayer:{"1":[{eventId:"55",division:"MA1"},{eventId:"55",division:"MA2"}],"2":[{eventId:"55",division:"MA2"}]}}).matches[0].sameDivisionCount,1);
console.log("All matching engine tests passed");
