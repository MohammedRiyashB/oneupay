import React, { useEffect, useMemo, useState } from "react";
import {
  onValue, orderByChild, push, ref, set, update, query
} from "firebase/database";
import {
  createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { auth, db } from "./firebase";
import { Copy, IndianRupee, Link2, LogIn, LogOut, Plus, RefreshCw, ShieldCheck, Wallet } from "lucide-react";

const PAYEE_NAME = "Mohammed Riyash B.";
const UPI_ID = "mohdriyash10-3@okhdfcbank";
const DEFAULT_AMOUNT = 349;
const money = n => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(n || 0));
const appUrl = () => window.location.origin + window.location.pathname;

function makeUpiLink(amount, note) {
  const p = new URLSearchParams({ pa: UPI_ID, pn: PAYEE_NAME, am: Number(amount).toFixed(2), cu: "INR", tn: note || "Riyash Pay" });
  return `upi://pay?${p.toString()}`;
}
function shareUrl(id) { return `${appUrl()}?request=${encodeURIComponent(id)}`; }
function copy(text) { navigator.clipboard?.writeText(text).then(() => alert("Copied!")).catch(() => alert(text)); }

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [page, setPage] = useState("home");
  const [requestId, setRequestId] = useState(new URLSearchParams(location.search).get("request"));
  const [request, setRequest] = useState(null);
  const [requestLoading, setRequestLoading] = useState(Boolean(new URLSearchParams(location.search).get("request")));
  const [requests, setRequests] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [amount, setAmount] = useState(String(DEFAULT_AMOUNT));
  const [description, setDescription] = useState("Payment");
  const [payerName, setPayerName] = useState("");
  const [utr, setUtr] = useState("");
  const [payerNote, setPayerNote] = useState("");

  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setAuthReady(true); }), []);
  useEffect(() => {
    if (!requestId) {
      setRequest(null);
      setRequestLoading(false);
      return;
    }
    setRequest(null);
    setRequestLoading(true);
    setError("");
    return onValue(ref(db, `paymentRequests/${requestId}`), snap => {
      const value = snap.val();
      setRequest(value ? { id: requestId, ...value } : null);
      setRequestLoading(false);
    }, e => {
      setError(e.message);
      setRequestLoading(false);
    });
  }, [requestId]);
  useEffect(() => {
    if (!user) { setRequests([]); return; }
    const q = query(ref(db, "paymentRequests"), orderByChild("createdAt"));
    return onValue(q, snap => {
      const value = snap.val() || {};
      const rows = Object.entries(value).map(([id, data]) => ({ id, ...data }));
      rows.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
      setRequests(rows);
    }, e => setError(e.message));
  }, [user]);

  const totals = useMemo(() => ({
    count: requests.length,
    pending: requests.filter(r => r.status !== "paid").reduce((s, r) => s + Number(r.amount || 0), 0),
    paid: requests.filter(r => r.status === "paid").reduce((s, r) => s + Number(r.amount || 0), 0)
  }), [requests]);

  async function createRequest(e) {
    e.preventDefault(); setError("");
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || value > 100000) return setError("Enter an amount between ₹1 and ₹1,00,000.");
    setBusy(true);
    try {
      const newRequestRef = push(ref(db, "paymentRequests"));
      await set(newRequestRef, {
        amount: value, description: description.trim() || "Payment",
        payeeName: PAYEE_NAME, upiId: UPI_ID, status: "pending",
        utr: "", payerName: "", payerNote: "", createdAt: Date.now(),
        createdBy: user.uid, submittedAt: null, verifiedAt: null
      });
      setRequestId(newRequestRef.key);
      history.replaceState({}, "", `?request=${encodeURIComponent(newRequestRef.key)}`);
      setAmount(String(DEFAULT_AMOUNT)); setDescription("Payment");
      setPage("home");
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function submitUtr(e) {
    e.preventDefault(); setError("");
    if (!request || request.status === "paid") return;
    const clean = utr.trim().replace(/\s+/g, "");
    if (clean.length < 8 || clean.length > 30) return setError("Enter the UPI transaction reference/UTR from your payment app.");
    setBusy(true);
    try {
      await update(ref(db, `paymentRequests/${request.id}`), {
        utr: clean, payerName: payerName.trim().slice(0, 80),
        payerNote: payerNote.trim().slice(0, 200), status: "submitted",
        submittedAt: Date.now()
      });
      setUtr(""); setPayerNote("");
      setError("");
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function approve(r) {
    if (!confirm(`Mark ${money(r.amount)} as PAID? First verify this credit in your own bank/UPI app.`)) return;
    try {
      await update(ref(db, `paymentRequests/${r.id}`), { status: "paid", verifiedAt: Date.now() });
    } catch (e) { setError(e.message); }
  }
  async function reject(r) {
    if (!confirm("Reject this submitted payment claim?")) return;
    try { await update(ref(db, `paymentRequests/${r.id}`), { status: "pending", utr: "", payerName: "", payerNote: "", submittedAt: null }); }
    catch (e) { setError(e.message); }
  }

  if (!authReady) return <main className="center">Loading Riyash Pay…</main>;
  if (requestId && !user) return <PublicRequest request={request} loading={requestLoading} error={error} busy={busy}
    utr={utr} setUtr={setUtr} payerName={payerName} setPayerName={setPayerName}
    payerNote={payerNote} setPayerNote={setPayerNote} submitUtr={submitUtr} />;
  return <div className="shell">
    <header className="topbar">
      <a className="brand" href={appUrl()} onClick={e => { e.preventDefault(); setRequestId(null); history.replaceState({}, "", appUrl()); setPage("home"); }}>
        <span className="brand-icon"><Wallet size={21}/></span><span>RIYASH <b>PAY</b><small>PERSONAL PAYMENT REQUESTS</small></span>
      </a>
      {user ? <button className="ghost small" onClick={() => signOut(auth)}><LogOut size={16}/> Sign out</button> : null}
    </header>
    {error && <div className="alert">{error}</div>}
    {!user ? <Login email={email} setEmail={setEmail} password={password} setPassword={setPassword} setError={setError}/> :
      <main>
        <section className="welcome"><div><div className="eyebrow">ADMIN DASHBOARD</div><h1>Your payment overview</h1><p>Create a request, share the link, then verify the incoming credit yourself.</p></div><span className="secure"><ShieldCheck size={17}/> Admin signed in</span></section>
        <section className="stats">
          <Stat label="Total requests" value={totals.count} icon={<Link2/>}/>
          <Stat label="Awaiting verification" value={money(totals.pending)} icon={<RefreshCw/>}/>
          <Stat label="Confirmed received" value={money(totals.paid)} icon={<ShieldCheck/>}/>
        </section>
        <div className="columns">
          <section className="panel">
            <div className="panel-title"><h2><Plus size={19}/> Create payment request</h2><span>New link</span></div>
            <form onSubmit={createRequest} className="form">
              <label>Amount (INR)<div className="amount-input"><IndianRupee size={19}/><input type="number" min="1" max="100000" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} required/></div></label>
              <label>Payment description<input value={description} onChange={e=>setDescription(e.target.value)} maxLength="80" placeholder="e.g. Shared dinner"/></label>
              <div className="payee"><small>PAYMENT WILL GO TO</small><b>{PAYEE_NAME}</b><span>{UPI_ID}</span></div>
              <button className="primary" disabled={busy}><Plus size={17}/> {busy ? "Creating…" : "Generate payment link"}</button>
            </form>
          </section>
          <section className="panel how">
            <h2>How verification works</h2>
            <ol><li><b>Share</b><span>Friend opens their unique request link.</span></li><li><b>Pay & submit UTR</b><span>They pay in their UPI app and submit the transaction reference.</span></li><li><b>You verify</b><span>Check your own bank/UPI transaction history, then approve.</span></li></ol>
            <div className="warning"><ShieldCheck size={18}/><span>Submitting a UTR or screenshot does not prove payment. Only approve after the money is credited to your account.</span></div>
          </section>
        </div>
        <section className="panel requests">
          <div className="panel-title"><h2>Payment requests</h2><button className="ghost small" onClick={()=>location.reload()}><RefreshCw size={15}/> Refresh</button></div>
          {!requests.length ? <div className="empty">No payment requests yet. Create your first request above.</div> :
          <div className="request-list">{requests.map(r=><RequestRow key={r.id} r={r} approve={approve} reject={reject}/>)}</div>}
        </section>
      </main>}
    <footer>Riyash Pay · Personal UPI reminder tool · Not a bank or payment gateway</footer>
  </div>;
}

function Login({email,setEmail,password,setPassword,setError}) {
  const [mode,setMode] = useState("signin");
  const [busy,setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      if (mode === "signup") await createUserWithEmailAndPassword(auth,email.trim(),password);
      else await signInWithEmailAndPassword(auth,email.trim(),password);
    } catch(e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <main className="login-wrap"><section className="panel login">
    <div className="login-logo"><Wallet size={27}/></div><div className="eyebrow">PRIVATE ADMIN ACCESS</div><h1>{mode === "signup" ? "Create your admin account" : "Welcome back"}</h1>
    <p>Only your authenticated account can create requests or approve payments.</p>
    <form className="form" onSubmit={submit}>
      <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/></label>
      <label>Password<input type="password" minLength="6" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete={mode==="signup"?"new-password":"current-password"}/></label>
      <button className="primary" disabled={busy}><LogIn size={17}/>{busy?"Please wait…":mode==="signup"?"Create admin account":"Sign in"}</button>
    </form>
    <button className="text-button" onClick={()=>setMode(mode==="signup"?"signin":"signup")}>{mode==="signup"?"Already registered? Sign in":"First time? Create your admin account"}</button>
    <div className="warning"><ShieldCheck size={18}/><span>Sign-up is open in this starter. Create your account once, then secure account creation in Firebase Authentication before sharing the site.</span></div>
  </section></main>;
}

function PublicRequest({request,loading,error,busy,utr,setUtr,payerName,setPayerName,payerNote,setPayerNote,submitUtr}) {
  if (loading) return <main className="public-wrap"><section className="panel"><h1>Loading payment request…</h1><p>Please wait while we securely retrieve the request.</p></section></main>;
  if (!request) return <main className="public-wrap"><section className="panel"><h1>Payment request not found</h1><p>{error || "This link may be invalid or the request may have been removed."}</p></section></main>;
  const paid = request.status === "paid";
  return <main className="public-wrap">
    <section className="panel public-card">
      <div className="public-brand"><span className="brand-icon"><Wallet size={21}/></span><b>RIYASH PAY</b></div>
      <div className="eyebrow">PAYMENT REQUEST</div>
      <h1 className="big-amount">{money(request.amount)}</h1>
      <p className="muted">{request.description}</p>
      <div className="payee"><small>PAY TO</small><b>{request.payeeName || PAYEE_NAME}</b><span>{request.upiId || UPI_ID}</span></div>
      <div className={`status ${paid?"paid":request.status==="submitted"?"submitted":"pending"}`}>{paid?"Payment confirmed":request.status==="submitted"?"UTR submitted · Awaiting verification":"Awaiting payment"}</div>
      {paid ? <div className="success-box"><ShieldCheck size={23}/> The receiver has confirmed this payment.</div> :
      <><a className="primary pay-button" href={makeUpiLink(request.amount,request.description)}><IndianRupee size={18}/> Pay {money(request.amount)} using UPI</a>
      <div className="divider-text">AFTER YOU PAY</div>
      <form className="form" onSubmit={submitUtr}>
        <label>Your name (optional)<input value={payerName} onChange={e=>setPayerName(e.target.value)} maxLength="80" placeholder="Name"/></label>
        <label>UPI transaction ID / UTR<input value={utr} onChange={e=>setUtr(e.target.value)} required minLength="8" maxLength="30" placeholder="Enter reference number"/></label>
        <label>Note (optional)<input value={payerNote} onChange={e=>setPayerNote(e.target.value)} maxLength="200" placeholder="Any note"/></label>
        <button className="primary" disabled={busy}>{busy?"Submitting…":"Submit payment reference"}</button>
      </form>
      {request.status==="submitted" && <div className="warning"><RefreshCw size={18}/><span>Your reference has been submitted. The receiver must independently verify the credit before this page shows Paid.</span></div>}
      </>}
      {error && <div className="alert">{error}</div>}
      <p className="fineprint">Never share your UPI PIN or OTP. Do not submit a reference unless you have actually made the payment. A submitted reference is a claim, not proof of payment.</p>
    </section>
  </main>;
}

function RequestRow({r,approve,reject}) {
  const status = r.status || "pending";
  return <article className="request-row">
    <div className="request-main"><b>{money(r.amount)} · {r.description}</b><small>Request ID: {r.id}</small>{r.payerName && <small>From: {r.payerName}</small>}{r.utr && <small>UTR: <strong>{r.utr}</strong></small>}</div>
    <div className="row-actions"><span className={`status ${status}`}>{status==="paid"?"Paid":status==="submitted"?"UTR submitted":"Pending"}</span><button className="icon-btn" title="Copy share link" onClick={()=>copy(shareUrl(r.id))}><Copy size={16}/></button>{status==="submitted" && <><button className="approve" onClick={()=>approve(r)}>Verify & approve</button><button className="reject" onClick={()=>reject(r)}>Reject</button></>}</div>
  </article>;
}
function Stat({label,value,icon}) { return <div className="stat"><span className="stat-icon">{icon}</span><div><b>{value}</b><small>{label}</small></div></div>; }
