import { Router } from "express";
import axios from "axios";
import { randomUUID } from "node:crypto";
import { pool } from "../db/pool.js";
import { validatePublicUrl } from "../lib/network.js";
const router = Router();
const TYPES = new Set(["collections", "history", "environments"]);
async function all(type) { const q=await pool.query("SELECT payload FROM relay_store WHERE resource_type=$1 ORDER BY updated_at DESC",[type]); return q.rows.map(x=>x.payload); }
async function put(type,id,payload) { await pool.query(`INSERT INTO relay_store(resource_type,resource_id,payload) VALUES($1,$2,$3) ON CONFLICT(resource_type,resource_id) DO UPDATE SET payload=EXCLUDED.payload,updated_at=NOW()`,[type,id,JSON.stringify(payload)]); }
router.get("/collections", async(_req,res)=>res.json(await all("collections")));
router.post("/collections", async(req,res)=>{const x=req.body||{}; if(!x.name)return res.status(400).json({error:"Collection name is required"}); const item={...x,id:x.id||randomUUID(),folders:x.folders||[],requests:x.requests||[],createdAt:x.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()}; await put("collections",item.id,item);res.status(201).json(item)});
router.put("/collections/:id",async(req,res)=>{const item={...req.body,id:req.params.id,updatedAt:new Date().toISOString()};await put("collections",req.params.id,item);res.json(item)});
router.delete("/collections/:id",async(req,res)=>{await pool.query("DELETE FROM relay_store WHERE resource_type='collections' AND resource_id=$1",[req.params.id]);res.status(204).end()});
router.get("/history",async(_req,res)=>res.json(await all("history")));
router.post("/history",async(req,res)=>{const x={...req.body,id:req.body?.id||randomUUID()};await put("history",x.id,x);res.status(201).json(x)});
router.delete("/history",async(_req,res)=>{await pool.query("DELETE FROM relay_store WHERE resource_type='history'");res.status(204).end()});
router.get("/environments",async(_req,res)=>res.json(await all("environments")));
router.put("/environments/:id",async(req,res)=>{const x={...req.body,id:req.params.id,updatedAt:new Date().toISOString()};await put("environments",x.id,x);res.json(x)});
router.delete("/environments/:id",async(req,res)=>{await pool.query("DELETE FROM relay_store WHERE resource_type='environments' AND resource_id=$1",[req.params.id]);res.status(204).end()});
router.post("/requests/execute",async(req,res)=>{const b=req.body||{};let target;try{target=await validatePublicUrl(b.url)}catch(e){return res.status(400).json({error:e.message})}const method=String(b.method||"GET").toUpperCase();if(!["GET","POST","PUT","PATCH","DELETE"].includes(method))return res.status(400).json({error:"Unsupported HTTP method"});for(const [k,v] of Object.entries(b.params||{}))target.searchParams.set(k,String(v));const headers={};for(const [k,v] of Object.entries(b.headers||{})){if(!["host","content-length","connection","cookie","set-cookie"].includes(k.toLowerCase()))headers[k]=v}const start=Date.now();try{const r=await axios({url:target.toString(),method,headers,data:["POST","PUT","PATCH"].includes(method)?b.body:undefined,timeout:Math.min(Number(b.timeoutMs)||20000,60000),maxRedirects:0,validateStatus:()=>true,responseType:"text",transformResponse:[v=>v]});let body=r.data;try{body=JSON.parse(r.data)}catch{};const raw=typeof r.data==="string"?r.data:JSON.stringify(r.data??"");res.json({status:r.status,statusText:r.statusText,durationMs:Date.now()-start,sizeBytes:Buffer.byteLength(raw),headers:r.headers,data:body,body})}catch(e){res.json({status:e.code==="ECONNABORTED"?408:502,statusText:e.code==="ECONNABORTED"?"Request Timeout":"Network Error",durationMs:Date.now()-start,sizeBytes:0,headers:{},body:{error:e.message},data:{error:e.message}})}});
router.post("/requests/validate",async(req,res)=>{const request=req.body?.request||{};const issues=[];if(!String(request.url||"").trim())issues.push({id:randomUUID(),field:"url",severity:"error",title:"Missing Request URL",message:"The endpoint URL cannot be empty."});else{try{new URL(request.url)}catch{issues.push({id:randomUUID(),field:"url",severity:"error",title:"Invalid URL",message:"Enter a valid absolute URL."})}}if(["POST","PUT","PATCH"].includes(request.method)&&request.bodyType==="json"&&request.body){try{JSON.parse(request.body)}catch{issues.push({id:randomUUID(),field:"body",severity:"error",title:"Invalid JSON",message:"Request body is not valid JSON."})}}res.json({status:issues.some(x=>x.severity==="error")?"invalid":"valid",scoreLabel:issues.length?"Needs attention":"Ready to send",issues,checkedAt:new Date().toISOString(),evaluatedBy:"backend"})});
router.post("/security/check",async(req,res)=>{let allowed=true,reason="The URL passed basic security checks.";try{await validatePublicUrl(req.body?.url||"")}catch(e){allowed=false;reason=e.message}res.json({verdict:allowed?"safe":"blocked",allowed,targetUrl:req.body?.url||"",reason,ssrfRiskLevel:allowed?"none":"critical",checks:[{id:"public-url",rule:"Public HTTP(S) destination",status:allowed?"safe":"blocked",detail:reason}],evaluatedBy:"backend",checkedAt:new Date().toISOString()})});
router.post("/errors/explain",async(req,res)=>{const s=Number(req.body?.statusCode)||0;const server=s>=500;res.json({statusCode:s,title:s===0?"Network / Connection Error":`${server?"Server":"Client"} Error (${s})`,category:s===0?"Network / Transport":server?"Server Error (5xx)":"Client Error (4xx)",summary:s===0?"The request could not reach the server.":server?"The server failed to complete the request.":"The request was rejected.",beginnerExplanation:"Inspect the request URL, method, headers, payload and response body.",possibleCauses:["Invalid request configuration","Server or network issue"],practicalSolutions:["Verify the endpoint and request data","Inspect server logs and retry"],troubleshootingSteps:["Review response headers and body","Run the Smart Request Validator"]})});
router.post("/collections/:id/run", async (req, res) => {
  try {
    const items = await all("collections");
    const collection = items.find(
      x => x.id === req.params.id
    );

    if (!collection) {
      return res.status(404).json({
        error: "Collection not found"
      });
    }

    const requests = [
      ...(collection.requests || []),
      ...(collection.folders || []).flatMap(
        folder => folder.requests || []
      )
    ];

    if (!requests.length) {
      return res.status(400).json({
        error: "No requests found in collection"
      });
    }

    const results = [];

    for (const request of requests) {
      const start = Date.now();

      try {
        const method = String(
          request.method || "GET"
        ).toUpperCase();

        const target = await validatePublicUrl(
          request.url
        );

        const response = await axios({
          method,
          url: target.toString(),
          headers: request.headers || {},
          data: ["POST", "PUT", "PATCH"].includes(method)
            ? request.body
            : undefined,
          timeout: 20000,
          maxRedirects: 0,
          validateStatus: () => true
        });

        results.push({
          requestId: request.id,
          requestName: request.name,
          method,
          status: response.status < 400
            ? "passed"
            : "failed",
          statusCode: response.status,
          duration: Date.now() - start
        });

      } catch (error) {
        results.push({
          requestId: request.id,
          requestName: request.name,
          status: "failed",
          errorMessage: error.message,
          duration: Date.now() - start
        });
      }
    }

    res.json({
      collectionId: collection.id,
      total: results.length,
      passed: results.filter(
        r => r.status === "passed"
      ).length,
      failed: results.filter(
        r => r.status === "failed"
      ).length,
      results
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Collection execution failed"
    });
  }
});
export default router;
