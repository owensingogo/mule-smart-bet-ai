import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
const app=express();
app.use(cors({origin:process.env.ALLOWED_ORIGIN||"*"}));
app.use(express.json());
const KEY=process.env.API_FOOTBALL_KEY;
const API="https://v3.football.api-sports.io";
async function api(path){if(!KEY)throw new Error("API key missing in backend .env");const r=await fetch(API+path,{headers:{"x-apisports-key":KEY}});if(!r.ok)throw new Error(`API provider HTTP ${r.status}`);return r.json()}
app.get("/health",(req,res)=>res.json({ok:true,service:"Mule Smart Bet API"}));
app.get("/api/fixtures",async(req,res)=>{try{const date=req.query.date;if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(date||""))return res.status(400).json({error:"date must be YYYY-MM-DD"});const raw=await api(`/fixtures?date=${date}`);const fixtures=(raw.response||[]).map(x=>({id:x.fixture?.id,home:x.teams?.home?.name,away:x.teams?.away?.name,league:x.league?.name,date:x.fixture?.date,status:x.fixture?.status?.short,homeId:x.teams?.home?.id,awayId:x.teams?.away?.id}));res.json({fixtures,providerErrors:raw.errors||{},count:fixtures.length})}catch(e){res.status(502).json({error:e.message})}});
app.get("/api/leagues",async(req,res)=>{try{const raw=await api("/leagues?season=2026");res.json({leagues:raw.response||[],errors:raw.errors||{}})}catch(e){res.status(502).json({error:e.message})}});
app.get("/api/fixture/:id/statistics",async(req,res)=>{try{res.json(await api(`/fixtures/statistics?fixture=${encodeURIComponent(req.params.id)}`))}catch(e){res.status(502).json({error:e.message})}});
app.get("/api/fixture/:id/odds",async(req,res)=>{try{res.json(await api(`/odds?fixture=${encodeURIComponent(req.params.id)}`))}catch(e){res.status(502).json({error:e.message})}});
const port=process.env.PORT||3000;app.listen(port,()=>console.log(`Mule Smart Bet API listening on ${port}`));
