import React, { useEffect, useMemo, useState } from "react";
import {
  onValue, orderByChild, push, ref, set, update, query
} from "firebase/database";
import {
  createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "firebase/auth";
import { auth, db } from "./firebase";
import {
  Activity, BarChart3, CheckCircle2, Copy, Download, FileText, IndianRupee,
  Languages, Link2, LogIn, LogOut, Plus, QrCode, RefreshCw, Search,
  ShieldCheck, Smartphone, Wallet, X
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const PAYEE_NAME = "Mohammed Riyash B.";
const UPI_ID = "mohdriyash10-3@okhdfcbank";
const DEFAULT_AMOUNT = 349;
const money = n => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(n || 0));
const appUrl = () => window.location.origin + window.location.pathname;
const shareUrl = id => appUrl() + "?request=" + encodeURIComponent(id);
const makeUpiLink = (amount, note) => "upi://pay?" + new URLSearchParams({pa:UPI_ID,pn:PAYEE_NAME,am:Number(amount).toFixed(2),cu:"INR",tn:note || "Riyash Pay"}).toString();
const copy = async text => { try { await navigator.clipboard.writeText(text); alert("Copied to clipboard"); } catch { window.prompt("Copy this text", text); } };
const safeCsv = value => '"' + String(value ?? "").replace(/"/g,'""').replace(/^[=+\-@]/,'\'$&') + '"';
const dateText = value => value ? new Date(Number(value)).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}) : "—";

const words = {
 en: {overview:"Payment overview",subtitle:"Create requests, share links and verify incoming credits yourself.",create:"Create payment request",amount:"Amount (INR)",description:"Payment description",generate:"Generate payment link",creating:"Creating…",requests:"Payment requests",total:"Total requests",awaiting:"Awaiting verification",received:"Confirmed received",how:"How verification works",share:"Share",paySubmit:"Pay & submit UTR",verify:"You verify",search:"Search payer, UTR, description or ID",all:"All statuses",pending:"Pending",submitted:"Submitted",paid:"Paid",noRequests:"No payment requests yet.",export:"Export CSV",analytics:"Analytics",language:"தமிழ்",install:"Install app",signout:"Sign out",admin:"Admin dashboard",pay:"Pay using UPI",scan:"Scan to pay",copyUpi:"Copy UPI ID",downloadQr:"Download QR",submitUtr:"Submit payment reference",payerName:"Your name (optional)",utr:"UPI transaction ID / UTR",note:"Note (optional)",confirmed:"Payment confirmed",notFound:"Payment request not found",loading:"Loading payment request…",receipt:"Download / print receipt",verified:"Verified payment receipt",security:"A UTR or screenshot is not proof of payment. Approve only after matching credit appears in your own bank/UPI app.",emptySearch:"No requests match your search.",installHint:"Use your browser menu → Add to Home screen if install is unavailable."},
 ta: {overview:"பணம் செலுத்தல் மேலோட்டம்",subtitle:"கோரிக்கைகளை உருவாக்கி இணைப்பைப் பகிர்ந்து, வரவு வந்ததை நீங்களே சரிபார்க்கவும்.",create:"பணம் கோரிக்கையை உருவாக்கு",amount:"தொகை (INR)",description:"கட்டண விவரம்",generate:"கட்டண இணைப்பை உருவாக்கு",creating:"உருவாக்கப்படுகிறது…",requests:"கட்டண கோரிக்கைகள்",total:"மொத்த கோரிக்கைகள்",awaiting:"சரிபார்ப்புக்காக காத்திருக்கிறது",received:"உறுதிசெய்யப்பட்ட வரவு",how:"சரிபார்ப்பு முறை",share:"பகிர்",paySubmit:"பணம் செலுத்தி UTR அனுப்பு",verify:"நீங்கள் சரிபார்க்கவும்",search:"பெயர், UTR, விவரம் அல்லது ID தேடவும்",all:"அனைத்து நிலைகள்",pending:"நிலுவை",submitted:"சமர்ப்பிக்கப்பட்டது",paid:"செலுத்தப்பட்டது",noRequests:"இன்னும் கட்டண கோரிக்கைகள் இல்லை.",export:"CSV பதிவிறக்கு",analytics:"புள்ளிவிவரங்கள்",language:"English",install:"செயலியை நிறுவு",signout:"வெளியேறு",admin:"நிர்வாக பலகை",pay:"UPI மூலம் செலுத்து",scan:"ஸ்கேன் செய்து செலுத்தவும்",copyUpi:"UPI ID நகலெடு",downloadQr:"QR பதிவிறக்கு",submitUtr:"கட்டண குறிப்பு எண்ணை அனுப்பு",payerName:"உங்கள் பெயர் (விருப்பம்)",utr:"UPI பரிவர்த்தனை ID / UTR",note:"குறிப்பு (விருப்பம்)",confirmed:"கட்டணம் உறுதிசெய்யப்பட்டது",notFound:"கட்டண கோரிக்கை கிடைக்கவில்லை",loading:"கட்டண கோரிக்கை ஏற்றப்படுகிறது…",receipt:"ரசீதை பதிவிறக்கு / அச்சிடு",verified:"உறுதிசெய்யப்பட்ட கட்டண ரசீது",security:"UTR அல்லது screenshot மட்டும் கட்டணச் சான்று அல்ல. உங்கள் வங்கி/UPI செயலியில் வரவு வந்ததை உறுதிசெய்த பிறகே ஒப்புதல் அளிக்கவும்.",emptySearch:"தேடலுக்கு பொருத்தமான கோரிக்கைகள் இல்லை.",installHint:"நிறுவ முடியாவிட்டால் உலாவி மெனுவில் Add to Home screen தேர்வு செய்யவும்."}
};

function printReceipt(r) {
  const html = '<!doctype html><html><head><meta charset="utf-8"><title>Riyash Pay Receipt</title><style>body{font:16px Arial,sans-serif;padding:32px;color:#172033;max-width:620px;margin:auto}.card{border:1px solid #dce5e1;border-radius:16px;padding:28px}.green{color:#10845b}.muted{color:#667085}.line{border-top:1px solid #e5e7eb;margin:20px 0}.row{display:flex;justify-content:space-between;gap:15px;padding:9px 0}h1{font-size:26px}.amount{font-size:32px;font-weight:bold}.stamp{background:#e9f8ef;color:#087647;padding:10px;border-radius:8px}@media print{button{display:none}}</style></head><body><div class="card"><h2 class="green">RIYASH PAY</h2><p class="muted">Personal UPI payment receipt</p><div class="stamp">✓ PAYMENT VERIFIED BY RECEIVER</div><h1>Payment receipt</h1><div class="amount">' + money(r.amount) + '</div><div class="line"></div><div class="row"><span>Description</span><b>' + esc(r.description) + '</b></div><div class="row"><span>Paid by</span><b>' + esc(r.payerName || "Payer") + '</b></div><div class="row"><span>UPI reference</span><b>' + esc(r.utr || "—") + '</b></div><div class="row"><span>Verified at</span><b>' + esc(dateText(r.verifiedAt)) + '</b></div><div class="row"><span>Receipt / request ID</span><b>' + esc(r.id) + '</b></div><div class="line"></div><p class="muted">Payee: ' + esc(r.payeeName || PAYEE_NAME) + '<br>UPI ID: ' + esc(r.upiId || UPI_ID) + '</p><p class="muted">This receipt reflects manual confirmation by the receiver. It is not a bank-issued receipt.</p><button onclick="window.print()">Print / Save as PDF</button></div><script>setTimeout(()=>window.print(),400)</script></body></html>';
  const w = window.open("", "_blank");
  if (!w) { alert("Allow pop-ups to print the receipt."); return; }
  w.document.open(); w.document.write(html); w.document.close();
}
function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

function downloadQr() {
  const svg = document.querySelector("#payment-qr svg");
  if (!svg) return;
  const blob = new Blob([new XMLSerializer().serializeToString(svg)],{type:"image/svg+xml"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download="riyash-pay-qr.svg"; a.click(); URL.revokeObjectURL(url);
}
function exportCsv(rows) {
  const cols = ["Request ID","Amount INR","Description","Status","Payer","UTR","Created At","Submitted At","Verified At"];
  const lines = [cols.map(safeCsv).join(","), ...rows.map(r=>[r.id,r.amount,r.description,r.status,r.payerName,r.utr,dateText(r.createdAt),dateText(r.submittedAt),dateText(r.verifiedAt)].map(safeCsv).join(","))];
  const blob = new Blob(["\ufeff"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="riyash-pay-transactions.csv"; a.click(); URL.revokeObjectURL(url);
}

export default function App() {
  const [user,setUser]=useState(null), [authReady,setAuthReady]=useState(false);
  const [page,setPage]=useState("home"), [lang,setLang]=useState(localStorage.getItem("riyash-lang") || "en");
  const [requestId,setRequestId]=useState(new URLSearchParams(location.search).get("request"));
  const [request,setRequest]=useState(null), [requestLoading,setRequestLoading]=useState(Boolean(new URLSearchParams(location.search).get("request")));
  const [requests,setRequests]=useState([]), [busy,setBusy]=useState(false), [error,setError]=useState("");
  const [email,setEmail]=useState(""), [password,setPassword]=useState("");
  const [amount,setAmount]=useState(String(DEFAULT_AMOUNT)), [description,setDescription]=useState("Payment");
  const [payerName,setPayerName]=useState(""), [utr,setUtr]=useState(""), [payerNote,setPayerNote]=useState("");
  const [search,setSearch]=useState(""), [filter,setFilter]=useState("all"), [installPrompt,setInstallPrompt]=useState(null);
  const t=words[lang];
  useEffect(()=>onAuthStateChanged(auth,u=>{setUser(u);setAuthReady(true);}),[]);
  useEffect(()=>{
    const handler=e=>{e.preventDefault();setInstallPrompt(e);};
    window.addEventListener("beforeinstallprompt",handler);
    return ()=>window.removeEventListener("beforeinstallprompt",handler);
  },[]);
  useEffect(()=>{
    if(!requestId){setRequest(null);setRequestLoading(false);return;}
    setRequest(null);setRequestLoading(true);setError("");
    return onValue(ref(db,"paymentRequests/"+requestId),snap=>{const value=snap.val();setRequest(value?{id:requestId,...value}:null);setRequestLoading(false);},e=>{setError(e.message);setRequestLoading(false);});
  },[requestId]);
  useEffect(()=>{
    if(!user){setRequests([]);return;}
    const q=query(ref(db,"paymentRequests"),orderByChild("createdAt"));
    return onValue(q,snap=>{const value=snap.val()||{};const rows=Object.entries(value).map(([id,data])=>({id,...data}));rows.sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0));setRequests(rows);},e=>setError(e.message));
  },[user]);
  useEffect(()=>{localStorage.setItem("riyash-lang",lang);document.documentElement.lang=lang==="ta"?"ta":"en";},[lang]);
  const totals=useMemo(()=>({count:requests.length,pending:requests.filter(r=>r.status!=="paid").reduce((s,r)=>s+Number(r.amount||0),0),paid:requests.filter(r=>r.status==="paid").reduce((s,r)=>s+Number(r.amount||0),0)}),[requests]);
  const filtered=useMemo(()=>requests.filter(r=>(filter==="all"||r.status===filter)&&[r.id,r.description,r.payerName,r.utr].join(" ").toLowerCase().includes(search.toLowerCase())),[requests,filter,search]);
  const chart=useMemo(()=>Array.from({length:7},(_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-(6-i));const next=d.getTime()+86400000;const day= requests.filter(r=>r.status==="paid"&&Number(r.verifiedAt)>=d.getTime()&&Number(r.verifiedAt)<next).reduce((s,r)=>s+Number(r.amount||0),0);return {label:d.toLocaleDateString("en-IN",{weekday:"short"}),value:day};}),[requests]);
  const maxChart=Math.max(1,...chart.map(x=>x.value));
  async function createRequest(e){e.preventDefault();setError("");const value=Number(amount);if(!Number.isFinite(value)||value<=0||value>100000)return setError("Enter an amount between ₹1 and ₹1,00,000.");setBusy(true);try{const newRef=push(ref(db,"paymentRequests"));await set(newRef,{amount:value,description:description.trim()||"Payment",payeeName:PAYEE_NAME,upiId:UPI_ID,status:"pending",utr:"",payerName:"",payerNote:"",createdAt:Date.now(),createdBy:user.uid,submittedAt:null,verifiedAt:null});setRequestId(newRef.key);history.replaceState({},"","?request="+encodeURIComponent(newRef.key));setAmount(String(DEFAULT_AMOUNT));setDescription("Payment");setPage("home");}catch(e){setError(e.message);}finally{setBusy(false);}}
  async function submitUtr(e){e.preventDefault();setError("");if(!request||request.status==="paid")return;const clean=utr.trim().replace(/\s+/g,"");if(clean.length<8||clean.length>30)return setError("Enter the UPI transaction reference/UTR from your payment app.");setBusy(true);try{await update(ref(db,"paymentRequests/"+request.id),{utr:clean,payerName:payerName.trim().slice(0,80),payerNote:payerNote.trim().slice(0,200),status:"submitted",submittedAt:Date.now()});setUtr("");setPayerNote("");}catch(e){setError(e.message);}finally{setBusy(false);}}
  async function approve(r){if(!confirm("Mark "+money(r.amount)+" as PAID? First verify this credit in your own bank/UPI app."))return;try{await update(ref(db,"paymentRequests/"+r.id),{status:"paid",verifiedAt:Date.now()});}catch(e){setError(e.message);}}
  async function reject(r){if(!confirm("Reject this submitted payment claim?"))return;try{await update(ref(db,"paymentRequests/"+r.id),{status:"pending",utr:"",payerName:"",payerNote:"",submittedAt:null});}catch(e){setError(e.message);}}
  async function install(){if(!installPrompt){alert(t.installHint);return;}installPrompt.prompt();await installPrompt.userChoice;setInstallPrompt(null);}
  if(!authReady)return <main className="center">Loading Riyash Pay…</main>;
  if(requestId&&!user)return <PublicRequest request={request} loading={requestLoading} error={error} busy={busy} utr={utr} setUtr={setUtr} payerName={payerName} setPayerName={setPayerName} payerNote={payerNote} setPayerNote={setPayerNote} submitUtr={submitUtr} t={t}/>;
  return <div className="shell">
    <header className="topbar"><a className="brand" href={appUrl()} onClick={e=>{e.preventDefault();setRequestId(null);history.replaceState({},"",appUrl());setPage("home");}}><span className="brand-icon"><Wallet size={21}/></span><span>RIYASH <b>PAY</b><small>PERSONAL PAYMENT REQUESTS</small></span></a>
      <div className="top-actions"><button className="ghost small" onClick={()=>setLang(lang==="en"?"ta":"en")}><Languages size={15}/>{t.language}</button>{installPrompt&&<button className="ghost small" onClick={install}><Smartphone size={15}/>{t.install}</button>}{user&&<button className="ghost small" onClick={()=>signOut(auth)}><LogOut size={15}/>{t.signout}</button>}</div>
    </header>
    {error&&<div className="alert">{error}</div>}
    {!user?<Login email={email} setEmail={setEmail} password={password} setPassword={setPassword} setError={setError}/>:<main>
      <section className="welcome"><div><div className="eyebrow">{t.admin}</div><h1>{t.overview}</h1><p>{t.subtitle}</p></div><span className="secure"><ShieldCheck size={17}/> Admin signed in</span></section>
      <section className="stats"><Stat label={t.total} value={totals.count} icon={<Link2/>}/><Stat label={t.awaiting} value={money(totals.pending)} icon={<RefreshCw/>}/><Stat label={t.received} value={money(totals.paid)} icon={<ShieldCheck/>}/></section>
      <div className="columns">
        <section className="panel"><div className="panel-title"><h2><Plus size={19}/>{t.create}</h2><span>New link</span></div><form onSubmit={createRequest} className="form">
          <label>{t.amount}<div className="amount-input"><IndianRupee size={19}/><input type="number" min="1" max="100000" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} required/></div></label>
          <label>{t.description}<input value={description} onChange={e=>setDescription(e.target.value)} maxLength="80" placeholder="e.g. Shared dinner"/></label>
          <div className="payee"><small>PAYMENT WILL GO TO</small><b>{PAYEE_NAME}</b><span>{UPI_ID}</span></div><button className="primary" disabled={busy}><Plus size={17}/>{busy?t.creating:t.generate}</button>
        </form></section>
        <section className="panel how"><h2>{t.how}</h2><ol><li><b>{t.share}</b><span>Friend opens their unique request link.</span></li><li><b>{t.paySubmit}</b><span>They pay in their UPI app and submit the transaction reference.</span></li><li><b>{t.verify}</b><span>Check your own bank/UPI transaction history, then approve.</span></li></ol><div className="warning"><ShieldCheck size={18}/><span>{t.security}</span></div></section>
      </div>
      <section className="panel analytics"><div className="panel-title"><h2><BarChart3 size={19}/>{t.analytics} · Last 7 days</h2><span>{money(totals.paid)} total paid</span></div><div className="chart">{chart.map((d,i)=><div className="bar-col" key={d.label+i}><b>{d.value?money(d.value):"—"}</b><div className="bar-track"><i style={{height:(d.value/maxChart*100)+"%"}}/></div><small>{d.label}</small></div>)}</div><p className="chart-note">Verified receipts only · based on the receiver's manual approval time</p></section>
      <section className="panel requests"><div className="panel-title"><h2>{t.requests}</h2><div className="list-tools"><button className="ghost small" onClick={()=>exportCsv(filtered)}><Download size={15}/>{t.export}</button><button className="ghost small" onClick={()=>location.reload()}><RefreshCw size={15}/> Refresh</button></div></div>
        <div className="filters"><div className="searchbox"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search}/></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">{t.all}</option><option value="pending">{t.pending}</option><option value="submitted">{t.submitted}</option><option value="paid">{t.paid}</option></select></div>
        {!filtered.length?<div className="empty">{requests.length?t.emptySearch:t.noRequests}</div>:<div className="request-list">{filtered.map(r=><RequestRow key={r.id} r={r} approve={approve} reject={reject} t={t}/>)}</div>}
      </section>
    </main>}
    <footer>Riyash Pay · Personal UPI reminder tool · Not a bank or payment gateway</footer>
  </div>;
}

function Login({email,setEmail,password,setPassword,setError}){const [mode,setMode]=useState("signin"),[busy,setBusy]=useState(false);async function submit(e){e.preventDefault();setBusy(true);setError("");try{if(mode==="signup")await createUserWithEmailAndPassword(auth,email.trim(),password);else await signInWithEmailAndPassword(auth,email.trim(),password);}catch(e){setError(e.message);}finally{setBusy(false);}}return <main className="login-wrap"><section className="panel login"><div className="login-logo"><Wallet size={27}/></div><div className="eyebrow">PRIVATE ADMIN ACCESS</div><h1>{mode==="signup"?"Create your admin account":"Welcome back"}</h1><p>Only your authenticated account can create requests or approve payments.</p><form className="form" onSubmit={submit}><label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/></label><label>Password<input type="password" minLength="6" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete={mode==="signup"?"new-password":"current-password"}/></label><button className="primary" disabled={busy}><LogIn size={17}/>{busy?"Please wait…":mode==="signup"?"Create admin account":"Sign in"}</button></form><button className="text-button" onClick={()=>setMode(mode==="signup"?"signin":"signup")}>{mode==="signup"?"Already registered? Sign in":"First time? Create your admin account"}</button><div className="warning"><ShieldCheck size={18}/><span>Keep account creation restricted after creating your admin account. Never share your password.</span></div></section></main>;}

function PublicRequest({request,loading,error,busy,utr,setUtr,payerName,setPayerName,payerNote,setPayerNote,submitUtr,t}) {
 if(loading)return <main className="public-wrap"><section className="panel"><h1>{t.loading}</h1><p>Please wait while we securely retrieve the request.</p></section></main>;
 if(!request)return <main className="public-wrap"><section className="panel"><h1>{t.notFound}</h1><p>{error||"This link may be invalid or the request may have been removed."}</p></section></main>;
 const paid=request.status==="paid", upi=makeUpiLink(request.amount,request.description);
 return <main className="public-wrap"><section className="panel public-card"><div className="public-brand"><span className="brand-icon"><Wallet size={21}/></span><b>RIYASH PAY</b></div><div className="eyebrow">PAYMENT REQUEST</div><h1 className="big-amount">{money(request.amount)}</h1><p className="muted">{request.description}</p>
 <div className="payee"><small>PAY TO</small><b>{request.payeeName||PAYEE_NAME}</b><span>{request.upiId||UPI_ID}</span><button className="text-button" onClick={()=>copy(request.upiId||UPI_ID)}><Copy size={14}/> {t.copyUpi}</button></div>
 <div className={"status "+(paid?"paid":request.status==="submitted"?"submitted":"pending")}>{paid?t.confirmed:request.status==="submitted"?"UTR submitted · Awaiting verification":"Awaiting payment"}</div>
 {paid?<><div className="success-box"><ShieldCheck size={23}/> {t.confirmed}</div><button className="primary receipt-button" onClick={()=>printReceipt(request)}><FileText size={17}/>{t.receipt}</button></>:<>
 <div className="qr-panel"><b>{t.scan}</b><div id="payment-qr"><QRCodeSVG value={upi} size={190} level="H" includeMargin/></div><button className="ghost small" onClick={downloadQr}><Download size={15}/>{t.downloadQr}</button></div>
 <a className="primary pay-button" href={upi}><IndianRupee size={18}/>{t.pay} {money(request.amount)}</a><div className="divider-text">AFTER YOU PAY</div>
 <form className="form" onSubmit={submitUtr}><label>{t.payerName}<input value={payerName} onChange={e=>setPayerName(e.target.value)} maxLength="80" placeholder="Name"/></label><label>{t.utr}<input value={utr} onChange={e=>setUtr(e.target.value)} required minLength="8" maxLength="30" placeholder="Enter reference number"/></label><label>{t.note}<input value={payerNote} onChange={e=>setPayerNote(e.target.value)} maxLength="200" placeholder="Any note"/></label><button className="primary" disabled={busy}>{busy?"Submitting…":t.submitUtr}</button></form>
 {request.status==="submitted"&&<div className="warning"><RefreshCw size={18}/><span>Your reference has been submitted. The receiver must independently verify the credit before this page shows Paid.</span></div>}</>}
 {error&&<div className="alert">{error}</div>}<p className="fineprint">Never share your UPI PIN or OTP. A submitted reference is a claim, not proof of payment.</p></section></main>;
}

function RequestRow({r,approve,reject,t}){const status=r.status||"pending";return <article className="request-row"><div className="request-main"><b>{money(r.amount)} · {r.description}</b><small>Request ID: {r.id}</small><small>Created: {dateText(r.createdAt)}</small>{r.payerName&&<small>From: {r.payerName}</small>}{r.utr&&<small>UTR: <strong>{r.utr}</strong></small>}</div><div className="row-actions"><span className={"status "+status}>{t[status]||status}</span><button className="icon-btn" title="Copy share link" onClick={()=>copy(shareUrl(r.id))}><Copy size={16}/></button>{status==="paid"&&<button className="ghost small" onClick={()=>printReceipt(r)}><FileText size={15}/>{t.receipt}</button>}{status==="submitted"&&<><button className="approve" onClick={()=>approve(r)}>Verify & approve</button><button className="reject" onClick={()=>reject(r)}>Reject</button></>}</div></article>;}
function Stat({label,value,icon}){return <div className="stat"><span className="stat-icon">{icon}</span><div><b>{value}</b><small>{label}</small></div></div>;}
