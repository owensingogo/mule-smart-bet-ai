import {auth,db} from "./firebase.js";
import {onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import {collection,addDoc,getDocs,query,where,orderBy,serverTimestamp} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";
import {fetchFixtures,fetchLeagues} from "./football-api.js";
import {buildTicket,renderTicket} from "./prediction-engine.js";
const $=id=>document.getElementById(id);
let user=null, fixtures=[], activeTicket=null;
const backend=()=>localStorage.getItem("muleBackend")||"";
function toast(msg){$("toast").textContent=msg;$("toast").style.display="block";setTimeout(()=>{$("toast").style.display="none"},3000)}
function authMsg(m){$("authMessage").textContent=m}
$("loginBtn").onclick=async()=>{try{await signInWithEmailAndPassword(auth,$("email").value,$("password").value)}catch(e){authMsg(e.message)}};
$("signupBtn").onclick=async()=>{try{await createUserWithEmailAndPassword(auth,$("email").value,$("password").value)}catch(e){authMsg(e.message)}};
$("logoutBtn").onclick=()=>signOut(auth);
onAuthStateChanged(auth,async u=>{user=u;$("authView").classList.toggle("hidden",!!u);$("appView").classList.toggle("hidden",!u);if(u){$("userLabel").textContent=u.email;await refreshHistoryCount();loadToday()}});
document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
function showPage(p){document.querySelectorAll(".page").forEach(x=>x.classList.add("hidden"));$(p+"Page").classList.remove("hidden");document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===p));$("pageTitle").textContent=({dashboard:"Dashboard",fixtures:"Fixtures",builder:"Ticket Builder",history:"History",settings:"Settings"})[p];if(p==="history")loadHistory()}
$("refreshBtn").onclick=loadToday;$("fixturesLoad").onclick=loadDateFixtures;
$("dateInput").value=new Date().toISOString().slice(0,10);
$("commandBtn").onclick=command;$("commandInput").onkeydown=e=>{if(e.key==="Enter")command()};
document.querySelectorAll("[data-command]").forEach(b=>b.onclick=()=>{$("commandInput").value=b.dataset.command;command()});
$("dailyBtn").onclick=()=>generate(15,"balanced");$("buildBtn").onclick=()=>generate(Number($("targetOdds").value),$("approach").value);
$("historyRefresh").onclick=loadHistory;
$("saveBackend").onclick=()=>{localStorage.setItem("muleBackend",$("backendUrl").value.trim().replace(/\/$/,""));$("settingsMessage").textContent="Backend URL saved on this device.";};
$("backendUrl").value=backend();
async function loadToday(){await loadDateFixtures(new Date().toISOString().slice(0,10),true)}
async function loadDateFixtures(date,home=false){const container=home?$("todayFixtures"):$("fixtureResults");container.innerHTML='<div class="empty">Loading fixtures…</div>';try{fixtures=await fetchFixtures(date,backend());container.innerHTML=fixtures.length?fixtures.map(fixtureHTML).join(""):'<div class="empty">No fixtures returned, or API/backend not configured. Check Settings and backend setup.</div>';if(home) $("fixtureResults").innerHTML=container.innerHTML;}catch(e){container.innerHTML=`<div class="empty">${escapeHTML(e.message)}</div>`}}
function fixtureHTML(f){return `<div class="fixture"><div><b>${escapeHTML(f.home||"Home")} vs ${escapeHTML(f.away||"Away")}</b><small>${escapeHTML(f.league||"Fixture")} · ${escapeHTML(f.date||"")}</small></div><span class="tag">${escapeHTML(f.status||"Scheduled")}</span></div>`}
async function command(){const cmd=$("commandInput").value.trim();if(!cmd)return;let n=15;if(/\b(\d+(?:\.\d+)?)\s*odds\b/i.test(cmd))n=Number(cmd.match(/\b(\d+(?:\.\d+)?)\s*odds\b/i)[1]);if(/safe|strongest|low risk/i.test(cmd))n=3;await generate(n,/goals/i.test(cmd)?"goals":/double/i.test(cmd)?"double":"balanced")}
async function generate(target,approach){if(!fixtures.length)await loadToday();if(!fixtures.length){toast("Load real fixtures first.");return}const ticket=buildTicket(fixtures,target,approach);activeTicket=ticket;$("ticketOutput").innerHTML=renderTicket(ticket,$("bookmaker")?.value||"SportyBet");showPage("builder");if(user){try{await addDoc(collection(db,"users",user.uid,"tickets"),{target,ticket:ticket.selections,combinedOdds:ticket.combinedOdds,estimatedProbability:ticket.estimatedProbability,createdAt:serverTimestamp(),status:"pending",bookmaker:$("bookmaker")?.value||"SportyBet"}) ;await refreshHistoryCount()}catch(e){console.warn(e)}}}
async function refreshHistoryCount(){try{const s=await getDocs(collection(db,"users",user.uid,"tickets"));$("savedCount").textContent=s.size}catch{}}
async function loadHistory(){if(!user)return;const el=$("historyList");el.innerHTML="Loading…";try{const s=await getDocs(query(collection(db,"users",user.uid,"tickets"),orderBy("createdAt","desc")));el.innerHTML=s.empty?'<div class="empty">No saved tickets yet.</div>':s.docs.map(d=>{const x=d.data();return `<div class="fixture"><div><b>Target ${x.target} · ${escapeHTML(x.bookmaker||"")}</b><small>${x.ticket?.length||0} selections · Combined ${Number(x.combinedOdds||0).toFixed(2)} · ${x.createdAt?.toDate?.().toLocaleString()||"Recently"}</small></div><button class="secondary" data-copy="${d.id}">View/Copy</button></div>`}).join("");el.querySelectorAll("[data-copy]").forEach(b=>b.onclick=async()=>{const d=await getDocs(query(collection(db,"users",user.uid,"tickets"),where("__name__","==",b.dataset.copy)));const x=d.docs[0]?.data();if(x)navigator.clipboard.writeText(x.ticket.map(s=>`${s.match} — ${s.market} (${s.odds})`).join("\n")+`\nCombined odds: ${x.combinedOdds}`);toast("Ticket copied")})}catch(e){el.innerHTML=`<div class="empty">${escapeHTML(e.message)}</div>`}}
function escapeHTML(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
