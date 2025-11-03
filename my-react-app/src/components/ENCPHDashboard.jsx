import Header from "./Header";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function ENCPHDashboard({
  user,
  logout,
  forwardedSubmissions,
  setForwardedSubmissions,
}) {
  const fmtINR = (n) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    })
      .format(n || 0)
      .replace("INR", "₹");

  // --- States ---
  const [pendingList, setPendingList] = useState([]);
  const [approvedList, setApprovedList] = useState([]);
  const [rejectedList, setRejectedList] = useState([]);

  const [previewSubmission, setPreviewSubmission] = useState(null);
  const [editable, setEditable] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [saveBanner, setSaveBanner] = useState("");
  const [approveBanner, setApproveBanner] = useState("");
  const [rejectBanner, setRejectBanner] = useState("");

  const [showRejectPanel, setShowRejectPanel] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState("");

  const urlCache = useRef([]);

  useEffect(() => {
    const pending = forwardedSubmissions.filter(
      (s) => {
        const status = (s.status || "").trim();
        const section = (s.forwardedTo?.section || "").trim();
        
        // Exclude already processed tasks
        const isProcessed = ["ENCPH Approved", "ENCPH Rejected"].includes(status);
        if (isProcessed) return false;
        
        // Match status or section to ENCPH
        const statusLower = status.toLowerCase();
        if (statusLower.includes("forwarded to encph")) return true;
        if (section.toLowerCase().includes("encph")) return true;
        if (statusLower.startsWith("forwarded to") && section.toLowerCase().includes("encph")) return true;
        return false;
      }
    );
    setPendingList(pending);
    const approved = forwardedSubmissions.filter((s) => s.status === "ENCPH Approved");
    setApprovedList(approved);
    const rejected = forwardedSubmissions.filter((s) => s.status === "ENCPH Rejected");
    setRejectedList(rejected);
  }, [forwardedSubmissions]);

  useEffect(() => {
    return () => {
      urlCache.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  // Always add dummy entry upon entering dashboard route
  useEffect(() => {
    if (location.pathname !== "/") {
      window.history.pushState(null, "", window.location.pathname);
    }
  }, [location.pathname]);

  // Intercept back navigation reliably
  useEffect(() => {
    const handler = (event) => {
      if (location.pathname !== "/") {
        const confirmed = window.confirm("Are you sure you want to logout?");
        if (confirmed) {
          logout?.();
          navigate("/", { replace: true });
        } else {
          window.history.pushState(null, "", window.location.pathname);
        }
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [location.pathname, logout, navigate]);

  // Extra: Intercept navigation to '/' with a prompt, not just popstate
  useEffect(() => {
    if (
      location.pathname === "/" &&
      window.history.state &&
      document.referrer && !document.referrer.includes("/login")
    ) {
      const confirmed = window.confirm("Are you sure you want to logout?");
      if (!confirmed) {
        window.history.go(1);
      } else {
        logout?.();
      }
    }
  }, [location.pathname, logout]);

  // --- Modal ---
  const openPreview = (sub) => {
    setPreviewSubmission(sub);
    setEditable({
      sector: sub.sector || "",
      proposal: sub.proposal || "",
      cost: sub.cost || 0,
      locality: sub.locality || "",
      priority: sub.priority || "",
      crNumber: sub.crNumber || "",
      crDate: sub.crDate || "",
      remarks: sub.remarks || "",
    });
    setModalOpen(true);
  };

  const saveEdits = () => {
    if (!previewSubmission) return;
    setForwardedSubmissions((prev) =>
      prev.map((f) =>
        f.id === previewSubmission.id
          ? { ...f, ...editable, remarks: editable.remarks }
          : f
      )
    );
    setSaveBanner("Changes saved successfully.");
    setTimeout(() => setSaveBanner(""), 1500);
    setModalOpen(false);
  };

  // --- Approve ---
  const approve = (subId) => {
    setForwardedSubmissions((prev) =>
      prev.map((f) =>
        f.id === subId ? { ...f, status: "ENCPH Approved" } : f
      )
    );
    setApproveBanner("Work approved successfully by ENCPH.");
    setTimeout(() => setApproveBanner(""), 1500);
  };

  // --- Reject ---
  const reject = (subId) => {
    const sub = forwardedSubmissions.find((f) => f.id === subId);
    setPreviewSubmission(sub);
    setShowRejectPanel(true);
    setRejectRemarks("");
  };

  const confirmReject = () => {
    if (!rejectRemarks || !previewSubmission) {
      alert("Please enter remarks before rejecting.");
      return;
    }

    setForwardedSubmissions((prev) =>
      prev.map((f) =>
        f.id === previewSubmission.id
          ? { ...f, status: "ENCPH Rejected", remarks: rejectRemarks }
          : f
      )
    );
    setRejectBanner("Work rejected and sent back to SEPH.");
    setTimeout(() => {
      setRejectBanner("");
      setShowRejectPanel(false);
      setPreviewSubmission(null);
      setRejectRemarks("");
    }, 1500);
  };

  const renderFileLinks = (sub) => {
    const files = [];
    if (sub.detailedReport)
      files.push({ label: "Detailed Report", file: sub.detailedReport });
    if (sub.committeeReport)
      files.push({ label: "Committee Report", file: sub.committeeReport });
    if (sub.councilResolution)
      files.push({ label: "Council Resolution", file: sub.councilResolution });

    return files.map((f, i) => {
      const url = URL.createObjectURL(f.file);
      urlCache.current.push(url);
      return (
        <div key={i}>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            {f.label}
          </a>
        </div>
      );
    });
  };

  const isActionDisabled = (status) =>
    ["ENCPH Approved", "ENCPH Rejected"].includes(status);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <Header
          title="15th Finance Commission"
          user={user}
          onLogout={() => {
            logout?.();
            window.location.href = "/";
          }}
        />

        <div className="bg-white p-6 rounded-xl shadow border mt-6">
          <h2 className="font-semibold text-gray-700 mb-4">ENCPH Dashboard</h2>

          {/* banners */}
          {saveBanner && (
            <div className="p-2 bg-blue-50 border border-blue-200 text-blue-700 rounded mb-2">
              {saveBanner}
            </div>
          )}
          {approveBanner && (
            <div className="p-2 bg-green-50 border border-green-200 text-green-700 rounded mb-2">
              {approveBanner}
            </div>
          )}
          {rejectBanner && (
            <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded mb-2">
              {rejectBanner}
            </div>
          )}

          {/* Pending table */}
          <h3 className="text-sm text-gray-600 mb-2">Pending Works</h3>
          {pendingList.length === 0 ? (
            <p className="text-gray-500 text-sm">No items to review.</p>
          ) : (
            <div className="overflow-auto max-h-80">
              <table className="min-w-full text-sm border-collapse">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-2 text-left whitespace-nowrap">S.No</th>
                    <th className="p-2 text-left whitespace-nowrap">Sector</th>
                    <th className="p-2 text-left">Proposal</th>
                    <th className="p-2 text-left whitespace-nowrap">Cost</th>
                    <th className="p-2 text-left whitespace-nowrap">Locality</th>
                    <th className="p-2 text-left whitespace-nowrap">Priority</th>
                    <th className="p-2 text-left whitespace-nowrap">Status</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingList.map((s, i) => (
                    <tr key={s.id} className="border-b">
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2">{s.sector}</td>
                      <td className="p-2">{s.proposal}</td>
                      <td className="p-2">{fmtINR(s.cost)}</td>
                      <td className="p-2">{s.locality}</td>
                      <td className="p-2">{s.priority}</td>
                      <td className="p-2">Pending</td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openPreview(s)}
                            className="px-2 py-1 bg-indigo-600 text-white rounded text-xs"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => approve(s.id)}
                            disabled={isActionDisabled(s.status)}
                            className={`px-2 py-1 text-xs rounded ${
                              s.status === "ENCPH Approved"
                                ? "bg-gray-300"
                                : "bg-green-600 text-white"
                            }`}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => reject(s.id)}
                            disabled={s.status === "ENCPH Rejected"}
                            className={`px-2 py-1 text-xs rounded ${
                              s.status === "ENCPH Rejected"
                                ? "bg-gray-300"
                                : "bg-red-600 text-white"
                            }`}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showRejectPanel && previewSubmission && (
            <div className="bg-white border rounded-xl shadow p-5 mt-6">
              <h4 className="font-semibold mb-3">Reject Work</h4>
              <div>
                <label className="text-sm text-gray-600">Remarks (Required)</label>
                <textarea
                  className="w-full border p-2 rounded mt-1"
                  rows={4}
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  placeholder="Please enter reason for rejection..."
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setShowRejectPanel(false);
                    setRejectRemarks("");
                    setPreviewSubmission(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReject}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Submit Rejection
                </button>
              </div>
            </div>
          )}

          {/* Approved Table */}
          {approvedList.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2 text-sm">Approved by ENCPH</h4>
              <div className="overflow-auto max-h-48">
               <table className="min-w-full text-sm border-collapse">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="p-2 text-left whitespace-nowrap">S.No</th>
                      <th className="p-2 text-left whitespace-nowrap">Sector</th>
                      <th className="p-2 text-left">Proposal</th>
                      <th className="p-2 text-left whitespace-nowrap">Cost</th>
                      <th className="p-2 text-left">Locality</th>
                      <th className="p-2 text-left whitespace-nowrap">Priority</th>
                      <th className="p-2 text-left whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedList.map((s, i) => (
                      <tr key={s.id} className="border-b">
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2">{s.sector}</td>
                        <td className="p-2">{s.proposal}</td>
                        <td className="p-2">{fmtINR(s.cost)}</td>
                        <td className="p-2">{s.locality}</td>
                        <td className="p-2">{s.priority}</td>
                        <td className="p-2 text-green-700">ENCPH Approved</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rejected Table */}
          {rejectedList.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2 text-sm">Rejected by ENCPH</h4>
              <div className="overflow-auto max-h-48">
               <table className="min-w-full text-sm border-collapse">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="p-2 text-left whitespace-nowrap">S.No</th>
                      <th className="p-2 text-left whitespace-nowrap">Sector</th>
                      <th className="p-2 text-left">Proposal</th>
                      <th className="p-2 text-left whitespace-nowrap">Cost</th>
                      <th className="p-2 text-left whitespace-nowrap">Locality</th>
                      <th className="p-2 text-left whitespace-nowrap">Priority</th>
                      <th className="p-2 text-left whitespace-nowrap">Status</th>
                      <th className="p-2 text-left">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rejectedList.map((s, i) => (
                      <tr key={s.id} className="border-b">
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2">{s.sector}</td>
                        <td className="p-2">{s.proposal}</td>
                        <td className="p-2">{fmtINR(s.cost)}</td>
                        <td className="p-2">{s.locality}</td>
                        <td className="p-2">{s.priority}</td>
                        <td className="p-2 text-red-700">ENCPH Rejected</td>
                        <td className="p-2 text-gray-600">{s.remarks || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal */}
          {modalOpen && previewSubmission && (
            <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
              <div className="bg-white rounded-xl shadow max-w-4xl w-full p-6 overflow-auto max-h-[90vh]">
                <div className="flex justify-between mb-4">
                  <h3 className="font-semibold text-lg">
                    Work Details Review
                  </h3>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-3 py-1 bg-red-500 text-white rounded"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {["sector", "proposal", "cost", "locality", "priority"].map(
                    (field) => (
                      <div key={field}>
                        <label className="text-sm text-gray-600 capitalize">
                          {field}
                        </label>
                        <input
                          className="w-full border p-2 rounded mt-1"
                          value={editable[field]}
                          onChange={(e) =>
                            setEditable({ ...editable, [field]: e.target.value })
                          }
                        />
                      </div>
                    )
                  )}
                  {previewSubmission.workImage && (
                    <div className="md:col-span-2 mt-2">
                      <label className="text-sm text-gray-600">Work Image</label>
                      <img
                        src={URL.createObjectURL(previewSubmission.workImage)}
                        alt=""
                        className="mt-2 rounded max-h-60"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <label className="text-sm text-gray-600">
                    ENCPH Remarks
                  </label>
                  <textarea
                    className="w-full border p-2 rounded mt-1"
                    value={editable.remarks}
                    onChange={(e) =>
                      setEditable({ ...editable, remarks: e.target.value })
                    }
                  />
                </div>

                <div className="mt-4">{renderFileLinks(previewSubmission)}</div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={saveEdits}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
