import Header from "./Header";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation as useRouterLocation } from "react-router-dom";

const TOTAL_BUDGET = 1000000;
const fmtINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
    .format(n)
    .replace("INR", "₹");

export default function AdminDashboard({
  user,
  logout,
  forwardedSubmissions,
  setForwardedSubmissions,
}) {
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();

  // Always add dummy entry upon entering dashboard route
  useEffect(() => {
    if (routerLocation.pathname !== "/") {
      window.history.pushState(null, "", window.location.pathname);
    }
  }, [routerLocation.pathname]);

  // Intercept back navigation reliably
  useEffect(() => {
    const handler = (event) => {
      if (routerLocation.pathname !== "/") {
        const confirmed = window.confirm("Are you sure you want to logout?");
        if (confirmed) {
          logout();
          navigate("/", { replace: true });
        } else {
          window.history.pushState(null, "", window.location.pathname);
        }
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [routerLocation.pathname, logout, navigate]);

  // Extra: Intercept navigation to '/' with a prompt, not just popstate
  useEffect(() => {
    if (
      routerLocation.pathname === "/" &&
      window.history.state &&
      // Only if we are not forced by code (navigate or redirect)
      document.referrer && !document.referrer.includes("/login")
    ) {
      const confirmed = window.confirm("Are you sure you want to logout?");
      if (!confirmed) {
        // Block navigation by pushing back to the last dashboard route (customize as needed)
        window.history.go(1);
      } else {
        logout();
      }
    }
  }, [routerLocation.pathname, logout]);

  // filter selection state
  const [selection, setSelection] = useState({
    year: "",
    installment: "",
    grantType: "",
    program: "",
  });

  // form fields
  const [workType, setWorkType] = useState("");
  const [proposalName, setProposalName] = useState("");
  const [location, setLocation] = useState("");
  const [latlong, setLatlong] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [prioritization, setPrioritization] = useState("");

  // CR related
  const [crStatus, setCrStatus] = useState(""); // "CR" or "IA"
  const [crNumber, setCrNumber] = useState("");
  const [crDate, setCrDate] = useState("");
  const [numberOfWorks, setNumberOfWorks] = useState("");

  // files
  const [workImage, setWorkImage] = useState(null);
  const [detailedReport, setDetailedReport] = useState(null);
  const [committeeFile, setCommitteeFile] = useState(null);
  const [councilFile, setCouncilFile] = useState(null);

  // local admin submissions (not forwarded yet)
  const [submissions, setSubmissions] = useState([]);
  const totalSubmittedCost = useMemo(() => submissions.reduce((s, it) => s + Number(it.cost || 0), 0), [submissions]);

  // UI
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // active CR cycle tracking (null when none)
  const [activeCR, setActiveCR] = useState(null);
  // The activeCR shape: { targetCount: number, crNumber, crDate, submittedCount }

  // Derived states
  const isSelectionReady = selection.year && selection.installment && selection.grantType && selection.program;
  const showProgramForm = isSelectionReady && selection.grantType === "Untied Grant" && (selection.program === "RADP" || selection.program === "ADP");
  const remainingBudget = Math.max(0, TOTAL_BUDGET - totalSubmittedCost);

  useEffect(() => {
    // If CR selected with valid numberOfWorks and no activeCR, create it
    if (crStatus === "CR" && Number.isInteger(Number(numberOfWorks)) && Number(numberOfWorks) > 0) {
      // If there's already an activeCR, ensure it matches entered numbers (do not overwrite if exists)
      if (!activeCR) {
        setActiveCR({
          targetCount: Number(numberOfWorks),
          crNumber: crNumber || "",
          crDate: crDate || "",
          submittedCount: 0,
        });
      } else {
        // if admin changed numberOfWorks/crNumber/crDate intentionally while activeCR present, update activeCR target only if activeCR.submittedCount === 0
        if (activeCR.submittedCount === 0) {
          setActiveCR((a) => ({ ...a, targetCount: Number(numberOfWorks), crNumber: crNumber || a.crNumber, crDate: crDate || a.crDate }));
        }
      }
    }
    // If CR deselected, we do not remove activeCR immediately (preserve state until cycle completes)
    // If activeCR exists but targetCount is 0 or NaN, clear it
    if (activeCR && (!Number.isInteger(activeCR.targetCount) || activeCR.targetCount < 1)) {
      setActiveCR(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crStatus, numberOfWorks]);

  useEffect(() => {
    // If activeCR completed
    if (activeCR && activeCR.submittedCount >= activeCR.targetCount) {
      setActiveCR(null);
      // unlock fields handled by using activeCR for disabled attributes
    }
  }, [activeCR]);

  // Helper: reset the form (optionally keep numberOfWorks when activeCR present)
  function resetForm(keepNumberOfWorks = false) {
    setWorkType("");
    setProposalName("");
    setLocation("");
    setLatlong("");
    setEstimatedCost("");
    setPrioritization("");
    setWorkImage(null);
    setDetailedReport(null);
    setCrStatus((s) => (activeCR ? "CR" : "")); // keep CR checked if activeCR exists
    if (!keepNumberOfWorks) setNumberOfWorks("");
    // Do not clear activeCR here
  }

  // When submitting a proposal
  function handleSubmitProposal() {
    setFormError("");
    if (!isSelectionReady) {
      setFormError("Please choose Year, Installment, Grant Type and Program.");
      return;
    }
    if (!workType || !proposalName || !location || !estimatedCost || !prioritization) {
      setFormError("Please fill all required proposal fields.");
      return;
    }
    // If CR selected and activeCR exists and has a targetCount, ensure we don't exceed target
    if (crStatus === "CR" && activeCR) {
      if (activeCR.submittedCount >= activeCR.targetCount) {
        setFormError("CR target already completed; please reset CR or start a new cycle.");
        return;
      }
    }

    const newSub = {
      id: Date.now() + Math.random(),
      sector: workType,
      proposal: proposalName,
      locality: location,
      latlong,
      cost: Number(estimatedCost),
      priority: Number(prioritization),
      crNumber: crStatus === "CR" ? crNumber : "",
      crDate: crStatus === "CR" ? crDate : "",
      workImage,
      detailedReport,
    };

    setSubmissions((s) => {
      const next = [...s, newSub];
      return next;
    });

    // Update activeCR counters when CR is selected
    if (crStatus === "CR") {
      setActiveCR((a) => (a ? { ...a, submittedCount: (a.submittedCount || 0) + 1 } : a));
    }

    setSuccessMsg("Submitted successfully.");
    setTimeout(() => setSuccessMsg(""), 3000);

    // if activeCR exists, keep numberOfWorks; else clear
    resetForm(Boolean(activeCR));
  }

  // Edit an existing submission
  function handleEdit(index) {
    const s = submissions[index];
    if (!s) return;
    // restore fields
    setWorkType(s.sector);
    setProposalName(s.proposal);
    setLocation(s.locality);
    setLatlong(s.latlong || "");
    setEstimatedCost(String(s.cost));
    setPrioritization(String(s.priority));
    setWorkImage(s.workImage || null);
    setDetailedReport(s.detailedReport || null);
    setCrNumber(s.crNumber || "");
    setCrDate(s.crDate || "");
    setCrStatus(s.crNumber ? "CR" : "IA");
    // remove from submissions
    setSubmissions((arr) => arr.filter((_, i) => i !== index));
  }

  // Group submissions by sector for merged rows (preserve stable order)
  const groupedSubmissions = useMemo(() => {
    const groups = {};
    submissions.forEach((s, idx) => {
      if (!groups[s.sector]) groups[s.sector] = [];
      groups[s.sector].push({ ...s, __idx: idx });
    });
    return groups;
  }, [submissions]);

  // Return flat grouped rows for rendering while allowing merged cells via rowSpan
  const groupedKeys = useMemo(() => Object.keys(groupedSubmissions), [groupedSubmissions]);

  // Forward to commissioner
  function handleForwardToCommissioner() {
    const reqCount = Number(numberOfWorks || 0);
    if (!Number.isInteger(reqCount) || reqCount < 1) {
      alert("Please enter valid Number of Works (>=1).");
      return;
    }
    if (submissions.length < reqCount) {
      alert(`Please submit ${reqCount - submissions.length} more work(s) before forwarding.`);
      return;
    }
    if (!committeeFile || !councilFile) {
      alert("Please upload committee and council files before forwarding.");
      return;
    }
  
    const now = new Date().toISOString();
    const forwarded = submissions.map((s) => ({
      ...s,
      id: Date.now() + Math.random(),
      status: "Pending Review",
      forwardedDate: now,
      committeeReport: committeeFile,
      councilResolution: councilFile,
      remarks: "",
    }));
  
    setForwardedSubmissions((fs) => [...forwarded, ...fs]);
  
    // ✅ CLEAR ALL FORM DATA (but keep form visible)
    // IMPORTANT: Clear in correct order to prevent useEffect from repopulating
    setSubmissions([]);
    setSelection({ year: "", installment: "", grantType: "", program: "" });
    setWorkType("");
    setProposalName("");
    setLocation("");
    setLatlong("");
    setEstimatedCost("");
    setPrioritization("");
    setWorkImage(null);
    setDetailedReport(null);
    setCommitteeFile(null);
    setCouncilFile(null);
    setFormError("");
    // Clear CR fields FIRST to prevent useEffect from recreating activeCR
    setCrStatus("");
    setNumberOfWorks("");
    setCrNumber("");
    setCrDate("");
    setActiveCR(null);
    setSuccessMsg("Forwarded to Commissioner");
  
    // Optional: small delay before clearing message
    setTimeout(() => setSuccessMsg(""), 2000);
  }
  

  // UI helpers for disabled state
  const disableCRFields = Boolean(activeCR); // lock CR fields when activeCR exists
  const submittedCount = submissions.length + (activeCR ? activeCR.submittedCount : 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        
       {/* <img src="/ap-logo.jpeg" alt="AP Logo" className="h-12 w-auto" /> */}
        <Header
       
          title="15th Finance Commission"
          user={user}
          onLogout={() => {
            logout();
            navigate("/");
          }}
        />

        {/* selection chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          {selection.year && <div className="px-3 py-1 rounded-full bg-gray-100 text-sm">{selection.year}</div>}
          {selection.installment && <div className="px-3 py-1 rounded-full bg-gray-100 text-sm">{selection.installment}</div>}
          {selection.grantType && <div className="px-3 py-1 rounded-full bg-gray-100 text-sm">{selection.grantType}</div>}
          {selection.program && <div className="px-3 py-1 rounded-full bg-gray-100 text-sm">{selection.program}</div>}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-6 border mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600 font-medium">Filters</div>
            <div />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <select
              value={selection.year}
              onChange={(e) => {
                setSelection({ ...selection, year: e.target.value });
              }}
              className="border p-2 rounded"
            >
              <option value="">Select year</option>
              <option>2021-22</option>
              <option>2022-23</option>
              <option>2023-24</option>
              <option>2024-25</option>
              <option>2025-26</option>
            </select>

            <select
              value={selection.installment}
              onChange={(e) => setSelection({ ...selection, installment: e.target.value })}
              disabled={!selection.year}
              className="border p-2 rounded"
            >
              <option value="">Select installment</option>
              <option>First Installment</option>
              <option>Second Installment</option>
            </select>

            <select
              value={selection.grantType}
              onChange={(e) => setSelection({ ...selection, grantType: e.target.value })}
              disabled={!selection.installment}
              className="border p-2 rounded"
            >
              <option value="">Select grant type</option>
              <option>Untied Grant</option>
              <option>Tied Grant</option>
            </select>

            <select
              value={selection.program}
              onChange={(e) => setSelection({ ...selection, program: e.target.value })}
              disabled={!selection.grantType}
              className="border p-2 rounded"
            >
              <option value="">Select program</option>
              <option>ADP</option>
              <option>RADP</option>
            </select>
          </div>
        </div>

        {/* Summary & form show only when selection is ready */}
        {showProgramForm && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-xl shadow p-6 border">
              <div className="flex justify-between items-center">
                <div className="flex gap-3 items-center">
                  <div className="text-sm text-gray-600">Budget</div>
                  <div className="font-bold text-lg text-green-500">{fmtINR(TOTAL_BUDGET)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Remaining</div>
                  <div className={`font-bold text-lg ${remainingBudget === 0 ? "text-red-500" : "text-green-500"}`}>
                    {fmtINR(remainingBudget)}
                  </div>
                </div>
              </div>
            </div>

            {/* RADP/ADP Form */}
            <div className="bg-white rounded-xl shadow p-6 border">
              <div className="text-sm font-medium mb-4">{selection.program} Details</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">CR Status</label>
                  <div className="flex gap-4 mt-2">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="crStatus"
                        checked={crStatus === "CR"}
                        onChange={() => setCrStatus("CR")}
                      />
                      <span>CR</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name="crStatus" checked={crStatus === "IA"} onChange={() => setCrStatus("IA")} />
                      <span>In anticipation</span>
                    </label>
                  </div>
                </div>

                {crStatus === "CR" && (
                  <>
                    <div>
                      <label className="text-sm text-gray-600">CR Number</label>
                      <input
                        value={crNumber}
                        onChange={(e) => setCrNumber(e.target.value)}
                        disabled={disableCRFields}
                        className="mt-1 w-full border p-2 rounded"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-600">CR Date</label>
                      <input
                        type="date"
                        value={crDate}
                        onChange={(e) => setCrDate(e.target.value)}
                        disabled={disableCRFields}
                        max={new Date().toISOString().split('T')[0]}
                        className="mt-1 w-full border p-2 rounded"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-600">Number of Works</label>
                      <input
                        type="number"
                        min="1"
                        value={numberOfWorks}
                        onChange={(e) => setNumberOfWorks(e.target.value)}
                        disabled={disableCRFields}
                        className={`mt-1 w-full border p-2 rounded ${submittedCount < Number(numberOfWorks || 0) && numberOfWorks ? "border-red-500 bg-red-50" : ""}`}
                      />
                      {activeCR && (
                        <div className="text-xs text-gray-500 mt-1">Active CR: {activeCR.submittedCount}/{activeCR.targetCount} submitted</div>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <label className="text-sm text-gray-600">Name of the Sector</label>
                  <select value={workType} onChange={(e) => setWorkType(e.target.value)} className="mt-1 w-full border p-2 rounded">
                    <option value="">Select type of work</option>
                    <option>SWM/LQM</option>
                    <option>Water Supply</option>
                    <option>UGD Drains</option>
                    <option>CC Roads</option>
                    <option>BT Roads</option>
                    <option>Development of Parks</option>
                    <option>Street Lighting</option>
                    <option>Solar Panels</option>
                    <option>IEC</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Name of the Proposals</label>
                  <input value={proposalName} onChange={(e) => setProposalName(e.target.value)} className="mt-1 w-full border p-2 rounded" />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Locality</label>
                  <textarea value={location} onChange={(e) => setLocation(e.target.value)}  rows={1} className="mt-1 w-full border p-2 rounded" />
                </div>

                <div>
                  <label className="text-sm text-gray-600">Latitude/Longitude or Google Maps URL</label>
                  <textarea value={latlong} onChange={(e) => setLatlong(e.target.value)} className="mt-1 w-full border p-2 rounded" />
                </div>

                <div>
                  <label className="text-sm text-gray-600">Estimated Cost</label>
                  <input type="number" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} className="mt-1 w-full border p-2 rounded" />
                </div>

                <div>
                  <label className="text-sm text-gray-600">Prioritization</label>
                  <input type="number" value={prioritization} onChange={(e) => setPrioritization(e.target.value)} className="mt-1 w-full border p-2 rounded" />
                </div>

                <div>
                  <label className="text-sm text-gray-600">Upload work Image</label>
                  <input type="file" accept="image/*" onChange={(e) => setWorkImage(e.target.files?.[0] || null)} className="mt-1" />
                </div>

                {crStatus === "CR" && (
                  <div>
                    <label className="text-sm text-gray-600">Detailed Estimation Report</label>
                    <input type="file" accept=".pdf,image/*" onChange={(e) => setDetailedReport(e.target.files?.[0] || null)} className="mt-1" />
                  </div>
                )}
              </div>

              {formError && <div className="mt-4 text-red-600">{formError}</div>}

              <div className="flex justify-end gap-3 mt-4">
                <button onClick={handleSubmitProposal} className="px-4 py-2 bg-blue-600 text-white rounded">Submit</button>
              </div>

              {successMsg && <div className="mt-3 p-2 bg-green-100 text-green-700 rounded text-sm">{successMsg}</div>}
            </div>

            {/* Post submit + signatures + merged table */}
            <div className="bg-white rounded-xl shadow p-6 border">
              <div className="text-sm font-medium mb-3">Signatures and Submission</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm text-gray-600">Committee Report</label>
                  <input type="file" onChange={(e) => setCommitteeFile(e.target.files?.[0] || null)} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Council Resolution Report</label>
                  <input type="file" onChange={(e) => setCouncilFile(e.target.files?.[0] || null)} className="mt-1" />
                </div>
              </div>

              <div className="overflow-auto max-h-72">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-left text-sm border-b">
                      <th className="p-2">S.No</th>
                      <th className="p-2">Sector</th>
                      <th className="p-2">Proposal</th>
                      <th className="p-2 text-right">Estimated cost</th>
                      <th className="p-2">Locality</th>
                      <th className="p-2">Priority</th>
                      <th className="p-2">Image</th>
                      <th className="p-2">Report</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedKeys.length === 0 ? (
                      <tr><td className="p-4 text-sm text-gray-500" colSpan={9}>No submissions yet.</td></tr>
                    ) : (
                      groupedKeys.map((sector, groupIdx) => {
                        const group = groupedSubmissions[sector];
                        return group.map((item, idxInGroup) => {
                          const isFirst = idxInGroup === 0;
                          return (
                            <tr key={item.__idx} className="border-b align-top">
                              {/* S.No and sector only on first row of group */}
                              <td className="p-2 align-top">
                                {isFirst ? groupIdx + 1 : null}
                              </td>
                              <td className="p-2 align-top">
                                {isFirst ? sector : null}
                              </td>

                              <td className="p-2 align-top">{item.proposal}</td>
                              <td className="p-2 align-top text-right">{fmtINR(Math.round(item.cost))}</td>
                              <td className="p-2 align-top">{item.locality}</td>
                              <td className="p-2 align-top text-center">{item.priority}</td>
                              <td className="p-2 align-top">
                                {item.workImage ? (
                                  <img src={URL.createObjectURL(item.workImage)} alt="" className="w-12 h-12 object-cover rounded cursor-pointer" />
                                ) : <span className="text-gray-400 text-sm">No image</span>}
                              </td>
                              <td className="p-2 align-top">
                                {item.detailedReport ? (
                                  <a href={URL.createObjectURL(item.detailedReport)} target="_blank" rel="noreferrer" className="text-blue-600 text-sm">View</a>
                                ) : (<span className="text-gray-400 text-sm">No report</span>)}
                              </td>
                              <td className="p-2 align-top">
                                <div className="flex gap-2">
                                  <button onClick={() => handleEdit(item.__idx)} className="px-2 py-1 bg-indigo-600 text-white text-sm rounded">Edit</button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={handleForwardToCommissioner}
                  disabled={!numberOfWorks || submissions.length < Number(numberOfWorks) || !committeeFile || !councilFile}
                  className={`px-4 py-2 rounded ${(!numberOfWorks || submissions.length < Number(numberOfWorks) || !committeeFile || !councilFile) ? "bg-gray-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"}`}
                >
                  Forward to Commissioner
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Rejected by Commissioner */}
        {forwardedSubmissions && forwardedSubmissions.filter((s) => s.status === "Rejected").length > 0 && (
          <div className="bg-white rounded-xl shadow p-6 border mt-6">
            <div className="text-sm font-medium mb-3">Rejected by Commissioner</div>
            <div className="overflow-auto max-h-72">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left text-sm border-b">
                    <th className="p-2">S.No</th>
                    <th className="p-2">Sector</th>
                    <th className="p-2">Proposal</th>
                    <th className="p-2 text-right">Estimated cost</th>
                    <th className="p-2">Locality</th>
                    <th className="p-2">Priority</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {forwardedSubmissions
                    .filter((s) => s.status === "Rejected")
                    .map((s, i) => (
                      <tr key={s.id} className="border-b">
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2">{s.sector}</td>
                        <td className="p-2">{s.proposal}</td>
                        <td className="p-2 text-right">{fmtINR(Math.round(s.cost || 0))}</td>
                        <td className="p-2">{s.locality}</td>
                        <td className="p-2">{s.priority}</td>
                        <td className="p-2 text-red-600">Rejected</td>
                        <td className="p-2 text-gray-600">{s.remarks || "-"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
