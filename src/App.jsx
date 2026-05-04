import { useState, useEffect, useCallback } from "react";
import { DELEGATIONS, DELEGATES, AGENDA, COMMITTEES } from "./data.js";

const SHEET_ID   = "1rvdCaAGLHtI9NOM_0yL2HkBmtMIDWZTKKNKg7UP4Jg4";
const API_KEY    = "AIzaSyB0VeVou9LDbMlhAfmB5EGhbjy01yXRldo";
const SHEET_NAME = "Delegates";
const BASE       = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;

// ── Google Sheets helpers ────────────────────────────────────────────────────
async function sheetsGet(range) {
  const url = `${BASE}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function sheetsUpdate(range, values) {
  const url = `${BASE}/values/${encodeURIComponent(range)}?valueInputOption=RAW&key=${API_KEY}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ range, majorDimension: "ROWS", values }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function seedSheet(delegates) {
  // Check if sheet already has data
  try {
    const data = await sheetsGet(`${SHEET_NAME}!A1:A2`);
    if (data.values && data.values.length > 1) return "already_seeded";
  } catch { /* sheet may not exist yet */ }

  // Write header row + all delegates
  const header = ["id","name","country","group","designation","gender","email","phone",
    "arrivalFlight","arrivalDate","arrivalTime","arrivalFrom","terminal",
    "departureFlight","departureDate","departureTime",
    "hotel","roomType","confirmation","checkin","checkout",
    "vehicle","vehicleNo","lo","so","passport","passportType",
    "status","remarks"];

  const rows = [header, ...delegates.map(d => header.map(k => {
    const val = d[k];
    return val === undefined || val === null ? "" : String(val);
  }))];

  await sheetsUpdate(`${SHEET_NAME}!A1`, rows);
  return "seeded";
}

async function loadStatuses() {
  const data = await sheetsGet(`${SHEET_NAME}!A2:B1000`);
  if (!data.values) return {};
  return Object.fromEntries(data.values.map(r => [Number(r[0]), r[1] || "Expected"]));
}

async function updateStatusInSheet(id, status, allDelegates) {
  // Find the row number (row 1 = header, row 2 = first delegate)
  const rowNum = allDelegates.findIndex(d => d.id === id) + 2;
  if (rowNum < 2) throw new Error("Delegate not found");
  // Column X = status (index 27, 0-based → column AB)
  await sheetsUpdate(`${SHEET_NAME}!AB${rowNum}`, [[status]]);
}

// ── UI helpers ───────────────────────────────────────────────────────────────
const statusColors = s => {
  if (s === "Arrived")    return { bg:"#eaf4ec", text:"#1e7a34" };
  if (s === "In Transit") return { bg:"#fff8e6", text:"#a05c00" };
  return { bg:"#f1f3f5", text:"#6b7585" };
};

const Badge = ({ label, bg, text, cls }) => (
  <span className={`badge ${cls||""}`} style={bg ? {background:bg,color:text} : {}}>
    {label}
  </span>
);

const MetricCard = ({ label, value, sub, color }) => (
  <div className="metric-card">
    <div className="metric-label">{label}</div>
    <div className={`metric-value ${color||""}`}>{value}</div>
    {sub && <div className="metric-sub">{sub}</div>}
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="detail-row">
    <span className="detail-key">{label}</span>
    <span className="detail-val">{value || "—"}</span>
  </div>
);

const typeColor = t => {
  if (t==="keynote")      return "#185FA5";
  if (t==="session")      return "#1a4fa3";
  if (t==="presentation") return "#3B6D11";
  if (t==="social")       return "#854F0B";
  return "#9ba5b5";
};

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]                   = useState("dashboard");
  const [delegates, setDelegates]       = useState(DELEGATES);
  const [selectedDelegate, setSelected] = useState(null);
  const [filterCountry, setFCountry]    = useState("All");
  const [filterStatus,  setFStatus]     = useState("All");
  const [filterGroup,   setFGroup]      = useState("All");
  const [searchTerm,    setSearch]      = useState("");
  const [activeDay,     setActiveDay]   = useState("7 May 2026");
  const [dbStatus,      setDbStatus]    = useState("connecting");
  const [savingId,      setSavingId]    = useState(null);
  const [lastSync,      setLastSync]    = useState(null);

  const applyStatuses = useCallback((statuses) => {
    setDelegates(prev => prev.map(d => statuses[d.id] ? {...d, status: statuses[d.id]} : d));
    setSelected(prev => prev && statuses[prev.id] ? {...prev, status: statuses[prev.id]} : prev);
    setLastSync(new Date());
  }, []);

  // On mount: seed if needed, then load statuses
  useEffect(() => {
    (async () => {
      try {
        setDbStatus("connecting");
        await seedSheet(DELEGATES);
        const statuses = await loadStatuses();
        applyStatuses(statuses);
        setDbStatus("live");
      } catch (e) {
        console.error("Sheet error:", e);
        setDbStatus("offline");
      }
    })();
  }, [applyStatuses]);

  // Manual refresh handler
  const refreshStatuses = async () => {
    try {
      setDbStatus("connecting");
      const statuses = await loadStatuses();
      applyStatuses(statuses);
      setDbStatus("live");
    } catch {
      setDbStatus("offline");
    }
  };

  // Update status
  const updateStatus = async (id, newStatus) => {
    const prev = delegates.find(d => d.id === id)?.status;
    // Optimistic
    setDelegates(ds => ds.map(d => d.id===id ? {...d, status:newStatus} : d));
    setSelected(s => s?.id===id ? {...s, status:newStatus} : s);
    setSavingId(id);
    try {
      await updateStatusInSheet(id, newStatus, DELEGATES);
    } catch {
      // Revert
      setDelegates(ds => ds.map(d => d.id===id ? {...d, status:prev} : d));
      setSelected(s => s?.id===id ? {...s, status:prev} : s);
    }
    setSavingId(null);
  };

  // Derived counts
  const arrived   = delegates.filter(d => d.status==="Arrived").length;
  const inTransit = delegates.filter(d => d.status==="In Transit").length;
  const expected  = delegates.filter(d => d.status==="Expected").length;
  const total     = delegates.length;

  const countries = ["All", ...Array.from(new Set(delegates.map(d => d.country))).sort()];
  const groups    = ["All", ...Array.from(new Set(delegates.map(d => d.group).filter(Boolean))).sort()];

  const filtered = delegates.filter(d => {
    const mc = filterCountry==="All" || d.country===filterCountry;
    const ms = filterStatus==="All"  || d.status===filterStatus;
    const mg = filterGroup==="All"   || d.group===filterGroup;
    const mq = d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               (d.designation||"").toLowerCase().includes(searchTerm.toLowerCase());
    return mc && ms && mg && mq;
  });

  const getFlag = c => DELEGATIONS.find(d => d.country===c)?.flag || "🌐";

  const flightGroups = delegates.reduce((acc, d) => {
    if (!d.arrivalFlight) return acc;
    const key = `${d.arrivalFlight}__${d.arrivalDate}__${d.arrivalTime||""}`;
    if (!acc[key]) acc[key] = { flight:d.arrivalFlight, date:d.arrivalDate, time:d.arrivalTime, terminal:d.terminal, list:[] };
    acc[key].list.push(d);
    return acc;
  }, {});

  const navItems = [
    {id:"dashboard",  label:"Dashboard"},
    {id:"delegates",  label:`Delegates (${total})`},
    {id:"transport",  label:"Transport"},
    {id:"hotels",     label:"Hotels"},
    {id:"agenda",     label:"Agenda"},
    {id:"committees", label:"Committees"},
  ];

  const dbDot   = dbStatus==="live" ? "#22c55e" : dbStatus==="connecting" ? "#f59e0b" : "#ef4444";
  const dbLabel = dbStatus==="live" ? "Live" : dbStatus==="connecting" ? "Syncing…" : "Offline";

  return (
    <div className="app">
      {/* ── Header ── */}
      <div className="header">
        <div className="header-top">
          <div>
            <div className="header-title">5th BRICS SAI Leaders' Summit 2026</div>
            <div className="header-sub">Bengaluru · 7–8 May 2026 · The Leela Palace</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <button onClick={refreshStatuses}
              style={{background:"none",border:"1px solid rgba(255,255,255,0.3)",borderRadius:6,
                      color:"rgba(255,255,255,0.8)",fontSize:11,padding:"3px 10px",cursor:"pointer",fontFamily:"inherit"}}>
              ↻ Refresh
            </button>
            <span style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"rgba(255,255,255,0.7)"}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:dbDot,display:"inline-block"}}/>
              {dbLabel}
              {lastSync && <span>· {lastSync.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</span>}
            </span>
            <Badge label={`${arrived} Arrived`}    bg="#eaf4ec" text="#1e7a34"/>
            <Badge label={`${inTransit} In Transit`} bg="#fff8e6" text="#a05c00"/>
            <Badge label={`${expected} Expected`}  bg="#f1f3f5" text="#6b7585"/>
          </div>
        </div>
        <nav className="header-nav">
          {navItems.map(n => (
            <button key={n.id} className={`nav-btn ${tab===n.id?"active":""}`}
              onClick={() => {setTab(n.id); setSelected(null);}}>
              {n.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="content">

        {/* ══ DASHBOARD ══ */}
        {tab==="dashboard" && (<>
          <div className="metrics-grid">
            <MetricCard label="Total Delegates" value={total}     sub="All groups"/>
            <MetricCard label="Arrived"          value={arrived}   sub={`${Math.round(arrived/total*100)}% of total`} color="green"/>
            <MetricCard label="In Transit"       value={inTransit} sub="En route"      color="amber"/>
            <MetricCard label="Expected"         value={expected}  sub="Yet to arrive"/>
            <MetricCard label="Countries"        value={10}        sub="BRICS + India"/>
            <MetricCard label="Summit Days"      value={2}         sub="7–8 May 2026"/>
          </div>

          <div className="grid-2 gap">
            <div className="card card-body">
              <div className="card-title">Arrival status by country</div>
              {DELEGATIONS.map(del => {
                const dlist = delegates.filter(d => d.country===del.country);
                const arr   = dlist.filter(d => d.status==="Arrived").length;
                const pct   = dlist.length ? Math.round(arr/dlist.length*100) : 0;
                return (
                  <div key={del.id} style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:3}}>
                      <span>{del.flag} {del.country}</span>
                      <span style={{color:"var(--text-muted)"}}>{arr}/{dlist.length}</span>
                    </div>
                    <div className="progress-wrap">
                      <div className={`progress-bar ${pct===100?"pb-full":pct>0?"pb-partial":"pb-empty"}`} style={{width:`${pct}%`}}/>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
              <div className="card card-body">
                <div className="card-title">Hotel occupancy</div>
                {["The Leela Palace","Hilton Embassy GolfLinks","Sterlings Mac Hotel","Greenwood","Kumara Krupa"].map(h => {
                  const n = delegates.filter(d => d.hotel===h).length;
                  return (
                    <div key={h} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid var(--border)"}}>
                      <div style={{fontSize:13,fontWeight:500}}>{h}</div>
                      <Badge label={`${n} delegates`} cls="badge-info"/>
                    </div>
                  );
                })}
              </div>

              <div className="card card-body">
                <div className="card-title">Today's arrivals – 6 May</div>
                {delegates.filter(d => d.arrivalDate==="06 May 2026").slice(0,8).map(d => (
                  <div key={d.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"4px 0",borderBottom:"1px solid var(--border)"}}>
                    <span>{d.name.length>30 ? d.name.slice(0,30)+"…" : d.name}</span>
                    <span style={{color:"var(--text-muted)",whiteSpace:"nowrap",marginLeft:8}}>{d.arrivalFlight} {d.arrivalTime}</span>
                  </div>
                ))}
                <div style={{fontSize:11,color:"var(--text-muted)",marginTop:6}}>
                  + {Math.max(0,delegates.filter(d=>d.arrivalDate==="06 May 2026").length-8)} more
                </div>
              </div>
            </div>
          </div>

          <div className="card card-body">
            <div className="card-title">Committees at a glance</div>
            <div className="grid-3">
              {COMMITTEES.map(c => (
                <div key={c.name} style={{background:"var(--bg)",borderRadius:"var(--radius-sm)",padding:"10px 12px"}}>
                  <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{c.name}</div>
                  <div style={{fontSize:12,color:"var(--text-muted)"}}>Head: {c.head}</div>
                </div>
              ))}
            </div>
          </div>
        </>)}

        {/* ══ DELEGATES LIST ══ */}
        {tab==="delegates" && !selectedDelegate && (<>
          <div className="search-bar">
            <input placeholder="Search name or designation…" value={searchTerm}
              onChange={e=>setSearch(e.target.value)} style={{flex:1,minWidth:180}}/>
            <select value={filterCountry} onChange={e=>setFCountry(e.target.value)}>
              {countries.map(c=><option key={c}>{c}</option>)}
            </select>
            <select value={filterGroup} onChange={e=>setFGroup(e.target.value)}>
              {groups.map(g=><option key={g}>{g}</option>)}
            </select>
            <select value={filterStatus} onChange={e=>setFStatus(e.target.value)}>
              {["All","Arrived","In Transit","Expected"].map(s=><option key={s}>{s}</option>)}
            </select>
            <span style={{fontSize:12,color:"var(--text-muted)",whiteSpace:"nowrap"}}>{filtered.length}/{total}</span>
          </div>
          <div className="card table-wrap">
            <table>
              <thead><tr>
                {["Name","Country","Designation","Flight","Date","Hotel","Vehicle","Status",""].map(h=><th key={h}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filtered.map(d => {
                  const sc = statusColors(d.status);
                  return (
                    <tr key={d.id}>
                      <td style={{fontWeight:500}}>{d.name.length>24?d.name.slice(0,24)+"…":d.name}</td>
                      <td>{getFlag(d.country)} {d.country}</td>
                      <td style={{color:"var(--text-muted)",fontSize:12}}>{(d.designation||"").length>22?d.designation.slice(0,22)+"…":d.designation||"—"}</td>
                      <td>{d.arrivalFlight||"—"}</td>
                      <td style={{whiteSpace:"nowrap"}}>{d.arrivalDate||"—"}</td>
                      <td>{d.hotel?(d.hotel.length>10?d.hotel.slice(0,10)+"…":d.hotel):"—"}</td>
                      <td style={{fontSize:12,color:"var(--text-muted)"}}>{d.vehicle||"—"}</td>
                      <td><Badge label={d.status} bg={sc.bg} text={sc.text}/></td>
                      <td><button className="btn btn-outline btn-sm" onClick={()=>setSelected(d)}>View</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>)}

        {/* ══ DELEGATE DETAIL ══ */}
        {tab==="delegates" && selectedDelegate && (() => {
          const d  = selectedDelegate;
          const sc = statusColors(d.status);
          const del = DELEGATIONS.find(x=>x.country===d.country);
          const initials = d.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
          return (<>
            <button className="back-btn" onClick={()=>setSelected(null)}>← Back to delegates</button>
            <div className="grid-2">
              <div className="card card-body">
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                  <div className="avatar">{initials}</div>
                  <div>
                    <div style={{fontWeight:600,fontSize:15}}>{d.name}</div>
                    <div style={{fontSize:13,color:"var(--text-muted)"}}>{d.designation}</div>
                    <Badge label={d.status} bg={sc.bg} text={sc.text}/>
                  </div>
                </div>
                <DetailRow label="Country"       value={`${getFlag(d.country)} ${d.country}`}/>
                <DetailRow label="Group"         value={d.group}/>
                <DetailRow label="Gender"        value={d.gender}/>
                <DetailRow label="Email"         value={d.email}/>
                <DetailRow label="Phone"         value={d.phone}/>
                <DetailRow label="Passport No."  value={d.passport}/>
                <DetailRow label="Passport Type" value={d.passportType}/>
                {d.remarks && <DetailRow label="Remarks" value={d.remarks}/>}
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
                <div className="card card-body">
                  <div className="card-title">Travel details</div>
                  <DetailRow label="Arrival flight"   value={d.arrivalFlight}/>
                  <DetailRow label="Arrival date"     value={d.arrivalDate}/>
                  <DetailRow label="Arrival time"     value={d.arrivalTime}/>
                  <DetailRow label="Arriving from"    value={d.arrivalFrom}/>
                  <DetailRow label="Terminal"         value={d.terminal}/>
                  <DetailRow label="Departure flight" value={d.departureFlight}/>
                  <DetailRow label="Departure date"   value={d.departureDate}/>
                  <DetailRow label="Departure time"   value={d.departureTime}/>
                </div>

                <div className="card card-body">
                  <div className="card-title">Hotel & transport</div>
                  <DetailRow label="Hotel"        value={d.hotel}/>
                  <DetailRow label="Room type"    value={d.roomType}/>
                  <DetailRow label="Confirmation" value={d.confirmation}/>
                  <DetailRow label="Check-in"     value={d.checkin}/>
                  <DetailRow label="Check-out"    value={d.checkout}/>
                  <DetailRow label="Vehicle"      value={d.vehicle}/>
                  <DetailRow label="Vehicle No."  value={d.vehicleNo}/>
                  <DetailRow label="LO"           value={d.lo || del?.liaison}/>
                  <DetailRow label="Support LO"   value={d.so || del?.support}/>
                </div>

                <div className="card card-body">
                  <div className="card-title">
                    Update arrival status
                    {savingId===d.id && <span style={{fontSize:11,color:"var(--text-muted)",marginLeft:8,fontWeight:400}}>Saving to Google Sheets…</span>}
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {["Expected","In Transit","Arrived"].map(s=>(
                      <button key={s} className={`btn-status ${d.status===s?"active":""}`}
                        onClick={()=>updateStatus(d.id,s)}>{s}</button>
                    ))}
                  </div>
                  <div style={{fontSize:11,color:"var(--text-muted)",marginTop:8}}>
                    Status saves directly to your Google Sheet. Press ↻ Refresh on any device to sync.
                  </div>
                </div>
              </div>
            </div>
          </>);
        })()}

        {/* ══ TRANSPORT ══ */}
        {tab==="transport" && (<>
          <div className="metrics-grid">
            <MetricCard label="Arrivals – 6 May" value={delegates.filter(d=>d.arrivalDate==="06 May 2026").length}/>
            <MetricCard label="Pickups Done"  value={arrived}            color="green"/>
            <MetricCard label="Pending"       value={expected+inTransit}/>
            <MetricCard label="In Transit"    value={inTransit}          color="amber"/>
          </div>

          <div className="card card-body gap">
            <div className="card-title">Flight-grouped pickups</div>
            {Object.entries(flightGroups)
              .sort(([,a],[,b])=>(a.date+(a.time||"")).localeCompare(b.date+(b.time||"")))
              .map(([key,g]) => (
              <div key={key} className="flight-group">
                <div className="flight-group-header">
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontWeight:600,fontSize:14}}>{g.flight}</span>
                    <span style={{color:"var(--text-muted)",fontSize:13}}>{g.date} {g.time||""}</span>
                    {g.terminal && <Badge label={`Terminal ${g.terminal}`} cls="badge-neutral"/>}
                  </div>
                  <Badge label={`${g.list.length} pax`} cls="badge-info"/>
                </div>
                {g.list.map(d => {
                  const sc = statusColors(d.status);
                  return (
                    <div key={d.id} style={{padding:"8px 14px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13}}>
                      <div>
                        <div style={{fontWeight:500}}>{d.name.length>34?d.name.slice(0,34)+"…":d.name}</div>
                        <div style={{color:"var(--text-muted)",fontSize:12}}>
                          {d.country} · LO: {d.lo||DELEGATIONS.find(x=>x.country===d.country)?.liaison||"—"} · {d.vehicle||"—"} {d.vehicleNo?`(${d.vehicleNo})`:""}
                        </div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                        <Badge label={d.status} bg={sc.bg} text={sc.text}/>
                        <span style={{fontSize:11,color:"var(--text-muted)"}}>{d.hotel||"—"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="card card-body">
            <div className="card-title">Pickup workflow tracker</div>
            <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:12}}>Showing delegates not yet arrived</div>
            {delegates.filter(d=>d.status!=="Arrived").slice(0,12).map(d => {
              const stageIdx = d.status==="In Transit" ? 2 : 0;
              const stages = ["LO departed","LO at airport","Met delegate","Boarded vehicle","Departed airport","Reached hotel","Checked in"];
              return (
                <div key={d.id} style={{border:"1px solid var(--border)",borderRadius:"var(--radius-sm)",padding:"10px 12px",marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:4}}>
                    <span style={{fontWeight:500,fontSize:13}}>{d.name.length>34?d.name.slice(0,34)+"…":d.name}</span>
                    <div style={{display:"flex",gap:6}}>
                      <Badge label={d.arrivalFlight||"—"} cls="badge-neutral"/>
                      <Badge label={d.arrivalTime||"—"} cls="badge-neutral"/>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {stages.map((s,i) => (
                      <div key={s} title={s} className="stage-dot"
                        style={{background:i<stageIdx?"#1e7a34":i===stageIdx?"#e6a817":"var(--bg)",
                                color:i<=stageIdx?"white":"var(--text-muted)",
                                border:"1px solid var(--border)"}}>
                        {i+1}
                      </div>
                    ))}
                  </div>
                  <div style={{fontSize:11,color:"var(--text-muted)",marginTop:5}}>Stage {stageIdx+1}: {stages[stageIdx]}</div>
                </div>
              );
            })}
          </div>
        </>)}

        {/* ══ HOTELS ══ */}
        {tab==="hotels" && (
          <div className="grid-4">
            {["The Leela Palace","Hilton Embassy GolfLinks","Sterlings Mac Hotel","Greenwood","Kumara Krupa"].map(h => {
              const list = delegates.filter(d=>d.hotel===h);
              return (
                <div key={h} className="card card-body">
                  <div style={{fontWeight:600,fontSize:14,marginBottom:4}}>{h}</div>
                  <div style={{fontSize:28,fontWeight:700,color:"var(--navy)",margin:"8px 0 2px"}}>{list.length}</div>
                  <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:12}}>delegates assigned</div>
                  {list.map(d => {
                    const sc = statusColors(d.status);
                    return (
                      <div key={d.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid var(--border)",fontSize:12}}>
                        <span style={{maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.name}</span>
                        <Badge label={d.status} bg={sc.bg} text={sc.text}/>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ AGENDA ══ */}
        {tab==="agenda" && (<>
          <div style={{marginBottom:4,fontWeight:600}}>Theme: 'Ease of Living with focus on Urban Mobility'</div>
          <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:14}}>
            Sub-themes: (i) Audit of Urban Sector · (ii) Audit of Urban Mobility · AI
          </div>
          <div className="day-tabs">
            {Object.keys(AGENDA).map(day => (
              <button key={day} className={`day-tab ${activeDay===day?"active":""}`}
                onClick={()=>setActiveDay(day)}>{day}</button>
            ))}
          </div>
          <div className="card card-body">
            {AGENDA[activeDay].map((item,i,arr) => (
              <div key={i} className="agenda-item">
                <div className="agenda-time">{item.time}</div>
                <div className="agenda-bar" style={{background:typeColor(item.type)}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:item.type==="session"||item.type==="keynote"?600:400}}>{item.item}</div>
                  {item.resp && <div className="agenda-resp">{item.resp}</div>}
                </div>
                <Badge label={item.type} cls="badge-neutral"/>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:12,marginTop:10,flexWrap:"wrap"}}>
            {[["keynote","#185FA5","Keynote"],["session","#1a4fa3","Session"],["presentation","#3B6D11","SAI Presentation"],["social","#854F0B","Social/Visit"],["break","#9ba5b5","Break"]].map(([t,c,l])=>(
              <span key={t} style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:"var(--text-muted)"}}>
                <span style={{width:10,height:10,borderRadius:2,background:c,display:"inline-block"}}/>
                {l}
              </span>
            ))}
          </div>
        </>)}

        {/* ══ COMMITTEES ══ */}
        {tab==="committees" && (<>
          <div className="grid-3 gap">
            {COMMITTEES.map(c => (
              <div key={c.name} className="card card-body">
                <div style={{fontWeight:600,fontSize:14,marginBottom:6}}>{c.name}</div>
                <div style={{fontSize:13,marginBottom:10}}>
                  <span style={{color:"var(--text-muted)"}}>Head: </span>
                  <span style={{fontWeight:500}}>{c.head}</span>
                </div>
                {c.members.map(m=>(
                  <div key={m} style={{fontSize:12,color:"var(--text-muted)",padding:"3px 0",borderBottom:"1px solid var(--border)"}}>{m}</div>
                ))}
              </div>
            ))}
          </div>

          <div className="card card-body">
            <div className="card-title">Liaison officer assignments</div>
            <div className="table-wrap">
              <table>
                <thead><tr>
                  {["Country","SAI","Liaison Officer","Support Officer"].map(h=><th key={h}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {DELEGATIONS.filter(d=>d.liaison!=="—").map(d=>(
                    <tr key={d.id}>
                      <td>{d.flag} {d.country}</td>
                      <td style={{color:"var(--text-muted)",fontSize:12}}>{d.sai}</td>
                      <td style={{fontWeight:500}}>{d.liaison}</td>
                      <td>{d.support}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>)}

      </div>
    </div>
  );
}
