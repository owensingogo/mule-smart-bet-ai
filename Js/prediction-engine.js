// Statistical baseline, not a guarantee. Uses only available fixture metadata; upgrade with richer statistics.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function marketCandidates(f,approach){
 const h=f.home||"Home",a=f.away||"Away",odds=f.odds||{};
 const picks=[];
 const add=(market,price,prob,reason)=>{if(price&&price>1&&prob>0)picks.push({match:`${h} vs ${a}`,market,odds:Number(price),probability:clamp(prob,.03,.97),reason,fixtureId:f.id})};
 if(approach==="goals"||approach==="balanced"||approach==="conservative"){
  add("Over 1.5 Goals",odds.over15||1.35,.68,"Common goal market; verify team scoring data before using.");
  add("Under 4.5 Goals",odds.under45||1.22,.82,"Wide goal band; estimate needs league/team data.");
  add("Over 0.5 Goals",odds.over05||1.12,.87,"At least one goal; estimate is a generic prior.");
 }
 if(approach==="double"||approach==="balanced"||approach==="conservative"){
  add("Double Chance 1X",odds.homeOrDraw||1.35,.67,"Home-or-draw; generic prior, not fixture-specific.");
  add("Double Chance X2",odds.awayOrDraw||1.35,.66,"Away-or-draw; generic prior, not fixture-specific.");
 }
 if(approach==="balanced")add("Both Teams To Score — Yes",odds.bttsYes||1.75,.53,"Generic prior only; no team form data available.");
 return picks;
}
export function buildTicket(fixtures,target=15,approach="balanced"){
 const all=fixtures.flatMap(f=>marketCandidates(f,approach));
 // Conservative combination selection: avoid using multiple markets from same match; greedy by probability/price score.
 all.sort((x,y)=>(y.probability/Math.log(y.odds+1))-(x.probability/Math.log(x.odds+1)));
 const selected=[],used=new Set(),combined=1;
 let total=1;
 for(const p of all){if(used.has(p.fixtureId))continue;if(total*p.odds>target*1.12&&selected.length>0)continue;selected.push(p);used.add(p.fixtureId);total*=p.odds;if(total>=target)break}
 const probability=selected.reduce((acc,s)=>acc*s.probability,1);
 return {target,combinedOdds:total,selections:selected,estimatedProbability:probability,warning:"These probabilities are illustrative priors, not trained or fixture-specific forecasts. The app must not claim high confidence without verified data and calibration.",generatedAt:new Date().toISOString()};
}
export function renderTicket(t,bookmaker){
 if(!t.selections.length)return `<div class="notice">No ticket could be constructed from available fixtures. Please load current data.</div>`;
 const rows=t.selections.map((s,i)=>`<div class="ticket-row"><b>${i+1}. ${esc(s.match)}</b><div>${esc(s.market)}</div><div class="ticket-meta"><span>Odds ${s.odds.toFixed(2)}</span><span>Model estimate ${(s.probability*100).toFixed(0)}%*</span></div><small class="muted">${esc(s.reason)}</small></div>`).join("");
 return `<div class="ticket"><div class="panel-heading"><h3>Generated ticket</h3><span class="tag">${esc(bookmaker)}</span></div>${rows}<div class="ticket-meta"><b>Combined odds: ${t.combinedOdds.toFixed(2)}</b><b>Estimated combined probability*: ${(t.estimatedProbability*100).toFixed(2)}%</b></div><p class="muted">${esc(t.warning)}</p><div class="ticket-actions"><button class="primary" id="copyTicket">Copy selections</button><button class="secondary" id="saveTicketCopy">Copy formatted ticket</button></div></div>`;
 constTicketWire(t);
 function constTicketWire(ticket){setTimeout(()=>{const text=ticket.selections.map((s,i)=>`${i+1}. ${s.match} — ${s.market} @ ${s.odds.toFixed(2)}`).join("\n")+`\nCombined odds: ${ticket.combinedOdds.toFixed(2)}\nEstimated probability: ${(ticket.estimatedProbability*100).toFixed(2)}% (illustrative)`;
 document.getElementById("copyTicket")?.addEventListener("click",()=>navigator.clipboard.writeText(ticket.selections.map(s=>`${s.match} — ${s.market}`).join("\n")).then(()=>alert("Selections copied")));
 document.getElementById("saveTicketCopy")?.addEventListener("click",()=>navigator.clipboard.writeText(text).then(()=>alert("Ticket copied")));},0)}
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
