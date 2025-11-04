import Header from "./Header";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useLocation as useRouterLocation } from "react-router-dom";

const TOTAL_BUDGET = 1000000;
const fmtINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
    .format(n)
    .replace("INR", "₹");

// Helper function to get file URL (handles both File objects and URL strings)
const getFileUrl = (file) => {
  if (!file) return null;
  if (file instanceof File) {
    return URL.createObjectURL(file);
  }
  if (typeof file === 'string') {
    return file;
  }
  return null;
};

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

  // Refs for file inputs to reset them
  const workImageInputRef = useRef(null);
  const detailedReportInputRef = useRef(null);
  const committeeFileInputRef = useRef(null);
  const councilFileInputRef = useRef(null);

  // local admin submissions (not forwarded yet)
  const [submissions, setSubmissions] = useState([]);
  const totalSubmittedCost = useMemo(() => submissions.reduce((s, it) => s + Number(it.cost || 0), 0), [submissions]);

  // UI
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // active CR cycle tracking (null when none)
  const [activeCR, setActiveCR] = useState(null);
  // The activeCR shape: { targetCount: number, crNumber, crDate, submittedCount }

  // Key to force file input reset
  const [fileInputKey, setFileInputKey] = useState(0);

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

  // Track if we're editing (to count it in submissions length for Forward button)
  const [isEditing, setIsEditing] = useState(false);

  // Card-based navigation state - default to "forwarded"
  const [selectedView, setSelectedView] = useState("forwarded");

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
    // Reset file input elements by changing key to force re-render
    setFileInputKey(prev => prev + 1);
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

    // Clear editing state AFTER adding submission back
    // This ensures the button check accounts for the restored submission
    setIsEditing(false);

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
    // Mark as editing instead of removing from submissions
    setIsEditing(true);
    // remove from submissions (but we'll count it separately for the button)
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

  // Helper function to get the list for selected view
  const getListForView = (view) => {
    let list = [];
    switch (view) {
      case "noOfCrs":
        list = [...submissions, ...(forwardedSubmissions || [])];
        break;
      case "allWorks":
        list = [...submissions, ...(forwardedSubmissions || []).filter(s => 
          s.status === "Pending Review" || s.status?.startsWith("Forwarded to") || 
          s.status === "Approved" || s.status === "CDMA Approved" || s.status === "Rejected"
        )];
        break;
      case "forwarded":
        list = (forwardedSubmissions || []).filter(s => 
          s.status === "Pending Review" || s.status?.startsWith("Forwarded to") || s.status === "Approved"
        );
        break;
      case "cdmaApproved":
        list = (forwardedSubmissions || []).filter(s => s.status === "CDMA Approved");
        break;
      case "rejected":
        list = (forwardedSubmissions || []).filter(s => s.status === "Rejected" && s.rejectedBy === "Commissioner");
        break;
      default:
        list = [];
    }
    // Sort by priority in ascending order
    return [...list].sort((a, b) => {
      const priorityA = Number(a.priority) || 0;
      const priorityB = Number(b.priority) || 0;
      return priorityA - priorityB;
    });
  };

  const getViewTitle = (view) => {
    switch (view) {
      case "noOfCrs":
        return "All Works (by CR Number)";
      case "allWorks":
        return "All Works";
      case "forwarded":
        return "Forwarded Tasks";
      case "cdmaApproved":
        return "CDMA Approved Tasks";
      case "rejected":
        return "Sent back REJECTED LIST";
      default:
        return "Forwarded Tasks";
    }
  };

  // Helper function to convert File to Base64 data URL
  const fileToBase64 = (file) => {
    return new Promise((resolve) => {
      if (!file) {
        resolve(null);
        return;
      }
      // If it's already a string (URL or data URL), return it
      if (typeof file === 'string') {
        resolve(file);
        return;
      }
      // If it's a File object, convert to base64 data URL
      if (file instanceof File) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      } else {
        resolve(null);
      }
    });
  };

  // Forward to commissioner
  async function handleForwardToCommissioner() {
    const reqCount = Number(numberOfWorks || 0);
    const totalSubmissions = submissions.length + (isEditing ? 1 : 0);
    
    if (!Number.isInteger(reqCount) || reqCount < 1) {
      alert("Please enter valid Number of Works (>=1).");
      return;
    }
    if (totalSubmissions < reqCount) {
      alert(`Please submit ${reqCount - totalSubmissions} more work(s) before forwarding.`);
      return;
    }
    if (!committeeFile || !councilFile) {
      alert("Please upload committee and council files before forwarding.");
      return;
    }
  
    const now = new Date().toISOString();
    
    // Build the list of submissions to forward
    let submissionsToForward = [...submissions];
    
    // If editing, include the current form data as a submission
    if (isEditing) {
      const editedSub = {
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
      submissionsToForward.push(editedSub);
    }
    
    // Convert all File objects to Base64 data URLs before forwarding
    const forwarded = await Promise.all(
      submissionsToForward.map(async (s) => {
        const converted = {
      ...s,
      id: Date.now() + Math.random(),
      status: "Pending Review",
      forwardedDate: now,
      remarks: "",
        };
        
        // Convert File objects to Base64 data URLs
        converted.workImage = await fileToBase64(s.workImage);
        converted.detailedReport = await fileToBase64(s.detailedReport);
        converted.committeeReport = await fileToBase64(committeeFile);
        converted.councilResolution = await fileToBase64(councilFile);
        
        return converted;
      })
    );
  
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
    setIsEditing(false); // Clear editing state after forwarding
    
    // Show alert
    alert("Forwarded successfully!");
    
    // Set banner message
    setSuccessMsg("✅ Successfully Forwarded to Commissioner!");
  
    // Clear message after 5 seconds
    setTimeout(() => setSuccessMsg(""), 5000);
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
            const confirmed = window.confirm("Are you sure you want to logout?");
            if (confirmed) {
              logout();
              navigate("/");
            }
          }}
        />

        {/* Forwarding Success Banner */}
        {successMsg && (
          <div className="mb-4 p-4 bg-green-500 text-white rounded-lg shadow-lg text-center font-semibold text-base animate-pulse">
            {successMsg}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="bg-white rounded-xl shadow p-6 border mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* No. of CR's */}
            <div 
              onClick={() => setSelectedView("noOfCrs")}
              className={`bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-pointer hover:bg-blue-100 transition ${selectedView === "noOfCrs" ? "ring-2 ring-blue-500" : ""}`}
            >
              <div className="text-xs text-blue-600 font-medium mb-1">No. of CR's</div>
              <div className="text-xl font-bold text-blue-700">
                {(() => {
                  const groupedByCR = {};
                  [...submissions, ...(forwardedSubmissions || [])].forEach((s) => {
                    const crKey = (s.crNumber || "").trim().toUpperCase() || "__NO_CR__";
                    if (!groupedByCR[crKey]) groupedByCR[crKey] = [];
                    groupedByCR[crKey].push(s);
                  });
                  // Exclude "__NO_CR__" from count
                  return Object.keys(groupedByCR).filter(key => key !== "__NO_CR__").length;
                })()}
              </div>
            </div>

            {/* No. of Works */}
            <div 
              onClick={() => setSelectedView("allWorks")}
              className={`bg-purple-50 border border-purple-200 rounded-lg p-3 cursor-pointer hover:bg-purple-100 transition ${selectedView === "allWorks" ? "ring-2 ring-purple-500" : ""}`}
            >
              <div className="text-xs text-purple-600 font-medium mb-1">No. of Works</div>
              <div className="text-xl font-bold text-purple-700">
                {submissions.length + 
                 (forwardedSubmissions || []).filter(s => 
                   s.status === "Pending Review" || s.status?.startsWith("Forwarded to") || 
                   s.status === "Approved" || s.status === "CDMA Approved" || s.status === "Rejected"
                 ).length}
              </div>
            </div>

            {/* No. of Forwarded */}
            <div 
              onClick={() => setSelectedView("forwarded")}
              className={`bg-indigo-50 border border-indigo-200 rounded-lg p-3 cursor-pointer hover:bg-indigo-100 transition ${selectedView === "forwarded" ? "ring-2 ring-indigo-500" : ""}`}
            >
              <div className="text-xs text-indigo-600 font-medium mb-1">No. of Forwarded</div>
              <div className="text-xl font-bold text-indigo-700">
                {(forwardedSubmissions || []).filter(s => s.status === "Pending Review" || s.status?.startsWith("Forwarded to") || s.status === "Approved").length}
              </div>
            </div>

            {/* No. of Approved */}
            <div 
              onClick={() => setSelectedView("cdmaApproved")}
              className={`bg-green-50 border border-green-200 rounded-lg p-3 cursor-pointer hover:bg-green-100 transition ${selectedView === "cdmaApproved" ? "ring-2 ring-green-500" : ""}`}
            >
              <div className="text-xs text-green-600 font-medium mb-1">No. of Approved</div>
              <div className="text-xl font-bold text-green-700">
                {(forwardedSubmissions || []).filter(s => s.status === "CDMA Approved").length}
              </div>
            </div>

            {/* Sent back REJECTED LIST */}
            <div 
              onClick={() => setSelectedView("rejected")}
              className={`bg-orange-50 border border-orange-200 rounded-lg p-3 cursor-pointer hover:bg-orange-100 transition ${selectedView === "rejected" ? "ring-2 ring-orange-500" : ""}`}
            >
              <div className="text-xs text-orange-600 font-medium mb-1">Sent back REJECTED LIST</div>
              <div className="text-xl font-bold text-orange-700">
                {(forwardedSubmissions || []).filter(s => s.status === "Rejected" && s.rejectedBy === "Commissioner").length}
              </div>
            </div>
          </div>
        </div>

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
                  <div className="font-bold text-lg text-red-500">
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
                  <label className="block text-sm text-gray-600">CR Status</label>
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
                      <label className="block text-sm text-gray-600">CR Number</label>
                      <input
                        value={crNumber}
                        onChange={(e) => setCrNumber(e.target.value)}
                        disabled={disableCRFields}
                        className="mt-1 w-full border p-2 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600">CR Date</label>
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
                      <label className="block text-sm text-gray-600">Number of Works</label>
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
                  <label className="block text-sm text-gray-600">Name of the Sector</label>
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
                  <label className="block text-sm text-gray-600">Name of the Proposals</label>
                  <input value={proposalName} onChange={(e) => setProposalName(e.target.value)} className="mt-1 w-full border p-2 rounded" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600">Locality</label>
                  <textarea value={location} onChange={(e) => setLocation(e.target.value)}  rows={1} className="mt-1 w-full border p-2 rounded" />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">Latitude/Longitude or Google Maps URL</label>
                  <textarea value={latlong} onChange={(e) => setLatlong(e.target.value)} className="mt-1 w-full border p-2 rounded" />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">Estimated Cost</label>
                  <input type="number" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} className="mt-1 w-full border p-2 rounded" />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">Prioritization</label>
                  <input type="number" value={prioritization} onChange={(e) => setPrioritization(e.target.value)} className="mt-1 w-full border p-2 rounded" />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">Upload work Image</label>
                  {workImage && (
                    <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                      <span className="text-green-700">✓ File selected: {workImage.name || "Image"}</span>
                      {workImage instanceof File && (
                        <div className="mt-2">
                          <img 
                            src={URL.createObjectURL(workImage)} 
                            alt="Preview" 
                            className="max-w-full h-32 object-contain rounded border"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  <input 
                    key={`workImage-${fileInputKey}`}
                    type="file" 
                    accept="image/*" 
                    ref={workImageInputRef}
                    onChange={(e) => setWorkImage(e.target.files?.[0] || null)} 
                    className="mt-1 w-full border p-2 rounded" 
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">Detailed Estimation Report</label>
                  {detailedReport && (
                    <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                      <span className="text-green-700">✓ File selected: {detailedReport.name || "Report"}</span>
                      {detailedReport instanceof File && (
                        <div className="mt-2">
                          <a 
                            href={URL.createObjectURL(detailedReport)} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Report
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                  <input 
                    key={`detailedReport-${fileInputKey}`}
                    type="file" 
                    accept=".pdf,image/*" 
                    ref={detailedReportInputRef}
                    onChange={(e) => setDetailedReport(e.target.files?.[0] || null)} 
                    className="mt-1 w-full border p-2 rounded" 
                  />
                </div>
              </div>

              {formError && <div className="mt-4 text-red-600">{formError}</div>}

              <div className="flex justify-center gap-3 mt-4">
                <button onClick={handleSubmitProposal} className="px-4 py-2 bg-blue-600 text-white rounded">Submit</button>
              </div>

              <div className="border-b border-gray-300 mt-4"></div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm text-gray-600">Committee Report</label>
                  <input type="file" onChange={(e) => setCommitteeFile(e.target.files?.[0] || null)} className="mt-1 w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Council Resolution Report</label>
                  <input type="file" onChange={(e) => setCouncilFile(e.target.files?.[0] || null)} className="mt-1 w-full border p-2 rounded" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={handleForwardToCommissioner}
                  disabled={!numberOfWorks || (submissions.length + (isEditing ? 1 : 0)) < Number(numberOfWorks) || !committeeFile || !councilFile}
                  className={`px-4 py-2 rounded ${(!numberOfWorks || (submissions.length + (isEditing ? 1 : 0)) < Number(numberOfWorks) || !committeeFile || !councilFile) ? "bg-gray-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"}`}
                >
                  Forward to Commissioner
                </button>
              </div>
            </div>

            {/* Post submit + signatures + merged table */}
            <div className="bg-white rounded-xl shadow p-6 border">
              <div className="text-sm font-medium mb-3">Signatures and Submission</div>

              <div className="overflow-auto max-h-96">
                <table className="w-full border-collapse text-xs">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr className="text-left text-xs border-b font-semibold">
                      <th className="p-2 whitespace-nowrap">S.No</th>
                      <th className="p-2 whitespace-nowrap">CR Number</th>
                      <th className="p-2 whitespace-nowrap">CR Date</th>
                      <th className="p-2 whitespace-nowrap">Sector</th>
                      <th className="p-2 whitespace-nowrap">Proposal</th>
                      <th className="p-2 whitespace-nowrap text-right">Estimated Cost</th>
                      <th className="p-2 whitespace-nowrap">Locality</th>
                      <th className="p-2 whitespace-nowrap">Lat/Long</th>
                      <th className="p-2 whitespace-nowrap text-center">Priority</th>
                      <th className="p-2 whitespace-nowrap">Work Image</th>
                      <th className="p-2 whitespace-nowrap">Estimation Report</th>
                      <th className="p-2 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedKeys.length === 0 ? (
                      <tr><td className="p-4 text-sm text-gray-500" colSpan={12}>No submissions yet.</td></tr>
                    ) : (
                      groupedKeys.map((sector, groupIdx) => {
                        const group = groupedSubmissions[sector];
                        return group.map((item, idxInGroup) => {
                          const isFirst = idxInGroup === 0;
                          return (
                            <tr key={item.__idx} className="border-b align-top hover:bg-gray-50">
                              {/* S.No and sector only on first row of group */}
                              <td className="p-2 align-top">
                                {isFirst ? groupIdx + 1 : null}
                              </td>
                              <td className="p-2 align-top">
                                {isFirst ? (item.crNumber || "-") : null}
                              </td>
                              <td className="p-2 align-top">
                                {isFirst ? (item.crDate || "-") : null}
                              </td>
                              <td className="p-2 align-top">
                                {isFirst ? sector : null}
                              </td>
                              <td className="p-2 align-top max-w-xs truncate" title={item.proposal}>
                                {item.proposal}
                              </td>
                              <td className="p-2 align-top text-right">{fmtINR(Math.round(item.cost))}</td>
                              <td className="p-2 align-top max-w-xs truncate" title={item.locality}>
                                {item.locality}
                              </td>
                              <td className="p-2 align-top max-w-xs truncate" title={item.latlong || "-"}>
                                {item.latlong ? (item.latlong.length > 20 ? item.latlong.substring(0, 20) + "..." : item.latlong) : "-"}
                              </td>
                              <td className="p-2 align-top text-center">{item.priority}</td>
                              <td className="p-2 align-top">
                                {item.workImage ? (
                                  <a href={getFileUrl(item.workImage)} target="_blank" rel="noreferrer" className="text-blue-600 text-xs hover:underline">View</a>
                                ) : (<span className="text-gray-400 text-xs">No image</span>)}
                              </td>
                              <td className="p-2 align-top">
                                {item.detailedReport ? (
                                  <a href={getFileUrl(item.detailedReport)} target="_blank" rel="noreferrer" className="text-blue-600 text-xs hover:underline">View</a>
                                ) : (<span className="text-gray-400 text-xs">No report</span>)}
                              </td>
                              <td className="p-2 align-top">
                                <div className="flex gap-1">
                                  <button onClick={() => handleEdit(item.__idx)} className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700">Edit</button>
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
            </div>
          </div>
        )}
        {/* Dynamic Table based on selected view */}
        {(() => {
          const currentList = getListForView(selectedView);
          const viewTitle = getViewTitle(selectedView);
          
          // Show CDMA Approved view separately if selected
          if (selectedView === "cdmaApproved") {
            const cdmaList = getListForView("cdmaApproved");
            if (cdmaList.length === 0) {
              return (
          <div className="bg-white rounded-xl shadow p-6 border mt-6">
                  <h3 className="text-sm text-gray-600 mb-2">{viewTitle}</h3>
                  <p className="text-gray-500 text-sm">No items to display.</p>
                </div>
              );
            }
            return (
              <div className="bg-white rounded-xl shadow p-6 border mt-6">
                <h3 className="text-sm text-gray-600 mb-2">{viewTitle}</h3>
                <div className="overflow-auto max-h-96">
                  <table className="w-full border-collapse text-xs">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr className="text-left text-xs border-b font-semibold">
                        <th className="p-2 whitespace-nowrap">S.No</th>
                        <th className="p-2 whitespace-nowrap">CR Number</th>
                        <th className="p-2 whitespace-nowrap">CR Date</th>
                        <th className="p-2 whitespace-nowrap">Sector</th>
                        <th className="p-2 whitespace-nowrap">Proposal</th>
                        <th className="p-2 whitespace-nowrap text-right">Estimated Cost</th>
                        <th className="p-2 whitespace-nowrap">Locality</th>
                        <th className="p-2 whitespace-nowrap">Lat/Long</th>
                        <th className="p-2 whitespace-nowrap">Priority</th>
                        <th className="p-2 whitespace-nowrap">Work Image</th>
                        <th className="p-2 whitespace-nowrap">Estimation Report</th>
                        <th className="p-2 whitespace-nowrap">Status</th>
                        <th className="p-2 whitespace-nowrap">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                      {cdmaList.map((s, i) => (
                        <tr key={s.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{i + 1}</td>
                          <td className="p-2">{s.crNumber || "-"}</td>
                          <td className="p-2">{s.crDate || "-"}</td>
                        <td className="p-2">{s.sector}</td>
                          <td className="p-2 max-w-xs truncate" title={s.proposal}>{s.proposal}</td>
                        <td className="p-2 text-right">{fmtINR(Math.round(s.cost || 0))}</td>
                          <td className="p-2 max-w-xs truncate" title={s.locality}>{s.locality}</td>
                          <td className="p-2 max-w-xs truncate" title={s.latlong || "-"}>
                            {s.latlong ? (s.latlong.length > 20 ? s.latlong.substring(0, 20) + "..." : s.latlong) : "-"}
                          </td>
                          <td className="p-2 text-center">{s.priority}</td>
                          <td className="p-2">
                            {s.workImage ? (
                              <a href={getFileUrl(s.workImage)} target="_blank" rel="noreferrer" className="text-blue-600 text-xs hover:underline">View</a>
                            ) : (<span className="text-gray-400 text-xs">No image</span>)}
                          </td>
                          <td className="p-2">
                            {s.detailedReport ? (
                              <a href={getFileUrl(s.detailedReport)} target="_blank" rel="noreferrer" className="text-blue-600 text-xs hover:underline">View</a>
                            ) : (<span className="text-gray-400 text-xs">No report</span>)}
                          </td>
                          <td className="p-2 text-green-600">CDMA Approved</td>
                          <td className="p-2 text-gray-600 max-w-xs truncate" title={s.remarks || "-"}>{s.remarks || "-"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
            );
          }

          if (currentList.length === 0) {
            return (
              <div className="bg-white rounded-xl shadow p-6 border mt-6">
                <h3 className="text-sm text-gray-600 mb-2">{viewTitle}</h3>
                <p className="text-gray-500 text-sm">No items to display.</p>
              </div>
            );
          }

          return (
            <div className="bg-white rounded-xl shadow p-6 border mt-6">
              <h3 className="text-sm text-gray-600 mb-2">{viewTitle}</h3>
              <div className="overflow-auto max-h-96">
                <table className="w-full border-collapse text-xs">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr className="text-left text-xs border-b font-semibold">
                      <th className="p-2 whitespace-nowrap">S.No</th>
                      <th className="p-2 whitespace-nowrap">CR Number</th>
                      <th className="p-2 whitespace-nowrap">CR Date</th>
                      <th className="p-2 whitespace-nowrap">Sector</th>
                      <th className="p-2 whitespace-nowrap">Proposal</th>
                      <th className="p-2 whitespace-nowrap text-right">Estimated Cost</th>
                      <th className="p-2 whitespace-nowrap">Locality</th>
                      <th className="p-2 whitespace-nowrap">Lat/Long</th>
                      <th className="p-2 whitespace-nowrap">Priority</th>
                      <th className="p-2 whitespace-nowrap">Work Image</th>
                      <th className="p-2 whitespace-nowrap">Estimation Report</th>
                      <th className="p-2 whitespace-nowrap">Status</th>
                      {(selectedView === "forwarded") && <th className="p-2 whitespace-nowrap">Forwarded Date</th>}
                      {(selectedView === "rejected") && <th className="p-2 whitespace-nowrap">Remarks</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      if (selectedView === "noOfCrs") {
                        // Group by CR number for CR view
                        const groupedByCR = {};
                        currentList.forEach((s) => {
                          const crKey = (s.crNumber || "").trim().toUpperCase() || "__NO_CR__";
                          if (!groupedByCR[crKey]) {
                            groupedByCR[crKey] = [];
                          }
                          groupedByCR[crKey].push(s);
                        });
                        
                        const crGroups = Object.values(groupedByCR).filter(group => {
                          // Filter out groups with __NO_CR__ key
                          const firstItem = group[0];
                          const crKey = (firstItem.crNumber || "").trim().toUpperCase() || "__NO_CR__";
                          return crKey !== "__NO_CR__";
                        });
                        
                        let globalSerial = 0;
                        
                        return crGroups.map((group) => {
                          return group.map((s, idxInGroup) => {
                            const isFirstInGroup = idxInGroup === 0;
                            if (isFirstInGroup) globalSerial++;
                            return (
                              <tr key={s.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 align-top">{isFirstInGroup ? globalSerial : ""}</td>
                                <td className="p-2 align-top">{isFirstInGroup ? (s.crNumber || "-") : ""}</td>
                                <td className="p-2 align-top">{isFirstInGroup ? (s.crDate || "-") : ""}</td>
                                <td className="p-2 align-top">{isFirstInGroup ? s.sector : ""}</td>
                                <td className="p-2 max-w-xs truncate align-top" title={s.proposal}>{s.proposal}</td>
                                <td className="p-2 text-right align-top">{fmtINR(Math.round(s.cost || 0))}</td>
                                <td className="p-2 max-w-xs truncate align-top" title={s.locality}>{s.locality}</td>
                                <td className="p-2 max-w-xs truncate align-top" title={s.latlong || "-"}>
                                  {s.latlong ? (s.latlong.length > 20 ? s.latlong.substring(0, 20) + "..." : s.latlong) : "-"}
                                </td>
                                <td className="p-2 text-center align-top">{s.priority}</td>
                                <td className="p-2 align-top">
                                  {s.workImage ? (
                                    <a href={getFileUrl(s.workImage)} target="_blank" rel="noreferrer" className="text-blue-600 text-xs hover:underline">View</a>
                                  ) : (<span className="text-gray-400 text-xs">No image</span>)}
                                </td>
                                <td className="p-2 align-top">
                                  {s.detailedReport ? (
                                    <a href={getFileUrl(s.detailedReport)} target="_blank" rel="noreferrer" className="text-blue-600 text-xs hover:underline">View</a>
                                  ) : (<span className="text-gray-400 text-xs">No report</span>)}
                                </td>
                                <td className="p-2 align-top">
                                  {s.status === "Pending Review" ? (
                                    <span className="text-yellow-600">Pending Review</span>
                                  ) : s.status === "Approved" ? (
                                    <span className="text-green-600">Approved</span>
                                  ) : s.status === "CDMA Approved" ? (
                                    <span className="text-green-600">CDMA Approved</span>
                                  ) : s.status === "Rejected" ? (
                                    <span className="text-red-600">Rejected</span>
                                  ) : (
                                    <span className="text-blue-600">{s.status}</span>
                                  )}
                                </td>
                              </tr>
                            );
                          });
                        }).flat();
                      } else {
                        // For other views, show serial number for every row
                        return currentList.map((s, i) => (
                          <tr key={s.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">{i + 1}</td>
                            <td className="p-2">{s.crNumber || "-"}</td>
                            <td className="p-2">{s.crDate || "-"}</td>
                            <td className="p-2">{s.sector}</td>
                            <td className="p-2 max-w-xs truncate" title={s.proposal}>{s.proposal}</td>
                            <td className="p-2 text-right">{fmtINR(Math.round(s.cost || 0))}</td>
                            <td className="p-2 max-w-xs truncate" title={s.locality}>{s.locality}</td>
                            <td className="p-2 max-w-xs truncate" title={s.latlong || "-"}>
                              {s.latlong ? (s.latlong.length > 20 ? s.latlong.substring(0, 20) + "..." : s.latlong) : "-"}
                            </td>
                            <td className="p-2 text-center">{s.priority}</td>
                            <td className="p-2">
                              {s.workImage ? (
                                <a href={getFileUrl(s.workImage)} target="_blank" rel="noreferrer" className="text-blue-600 text-xs hover:underline">View</a>
                              ) : (<span className="text-gray-400 text-xs">No image</span>)}
                            </td>
                            <td className="p-2">
                              {s.detailedReport ? (
                                <a href={getFileUrl(s.detailedReport)} target="_blank" rel="noreferrer" className="text-blue-600 text-xs hover:underline">View</a>
                              ) : (<span className="text-gray-400 text-xs">No report</span>)}
                            </td>
                            <td className="p-2">
                              {s.status === "Pending Review" ? (
                                <span className="text-yellow-600">Pending Review</span>
                              ) : s.status === "Approved" ? (
                                <span className="text-green-600">Approved</span>
                              ) : s.status === "CDMA Approved" ? (
                                <span className="text-green-600">CDMA Approved</span>
                              ) : s.status === "Rejected" ? (
                                <span className="text-red-600">Rejected by Commissioner</span>
                              ) : (
                                <span className="text-blue-600">{s.status}</span>
                              )}
                            </td>
                            {selectedView === "forwarded" && (
                              <td className="p-2 text-xs text-gray-600">
                                {s.forwardedDate ? new Date(s.forwardedDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-"}
                              </td>
                            )}
                            {selectedView === "rejected" && (
                              <td className="p-2 text-gray-600 max-w-xs truncate" title={s.remarks || "-"}>{s.remarks || "-"}</td>
                            )}
                          </tr>
                        ));
                      }
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
