import Header from "./Header";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function CDMADashboard({
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
  const [showApprovePanel, setShowApprovePanel] = useState(false);
  const [approveRemarks, setApproveRemarks] = useState("");
  const [selectedView, setSelectedView] = useState("pending"); // For card-based navigation

  const urlCache = useRef([]);

  useEffect(() => {
    const pending = forwardedSubmissions.filter(
      (s) => {
        const status = (s.status || "").trim();
        const section = (s.forwardedTo?.section || "").trim();
        
        // Show only tasks forwarded from ENCPH to CDMA
        const isProcessed = ["CDMA Approved", "CDMA Rejected"].includes(status);
        if (isProcessed) return false;
        
        // Match status or section to CDMA
        const statusLower = status.toLowerCase();
        if (statusLower.includes("forwarded to cdma")) return true;
        if (section.toLowerCase().includes("cdma")) return true;
        if (statusLower.startsWith("forwarded to") && section.toLowerCase().includes("cdma")) return true;
        return false;
      }
    );
    setPendingList(pending);
    const approved = forwardedSubmissions.filter((s) => s.status === "CDMA Approved");
    setApprovedList(approved);
    const rejected = forwardedSubmissions.filter((s) => s.status === "CDMA Rejected");
    setRejectedList(rejected);
  }, [forwardedSubmissions]);

  // Helper functions for view
  const getListForView = (view) => {
    switch (view) {
      case "pending":
        return pendingList;
      case "allWorks":
        return forwardedSubmissions.filter(s => {
          const status = (s.status || "").trim().toLowerCase();
          const section = (s.forwardedTo?.section || "").trim().toLowerCase();
          return status.includes("forwarded to cdma") || section.includes("cdma") || 
                 status === "cdma approved" || status === "cdma rejected";
        });
      case "approved":
        return approvedList;
      case "rejected":
        return rejectedList;
      case "noOfCrs":
        return forwardedSubmissions.filter(s => {
          const status = (s.status || "").trim().toLowerCase();
          const section = (s.forwardedTo?.section || "").trim().toLowerCase();
          return status.includes("forwarded to cdma") || section.includes("cdma") || 
                 status === "cdma approved" || status === "cdma rejected";
        });
      default:
        return pendingList;
    }
  };

  const getViewTitle = (view) => {
    switch (view) {
      case "pending":
        return "Pending Works (Forwarded from ENCPH)";
      case "allWorks":
        return "All Works";
      case "approved":
        return "Approved Tasks";
      case "rejected":
        return "Rejected Tasks";
      case "noOfCrs":
        return "All Works (by CR Number)";
      default:
        return "Pending Works (Forwarded from ENCPH)";
    }
  };

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
    // Get fresh submission from forwardedSubmissions to ensure we have all files
    const freshSub = forwardedSubmissions.find((f) => f.id === sub.id) || sub;
    
    // Ensure we preserve files
    const mergedSub = {
      ...freshSub,
      workImage: freshSub.workImage || sub.workImage || null,
      detailedReport: freshSub.detailedReport || sub.detailedReport || null,
      committeeReport: freshSub.committeeReport || sub.committeeReport || null,
      councilResolution: freshSub.councilResolution || sub.councilResolution || null,
    };
    
    setPreviewSubmission(mergedSub);
    setEditable({
      sector: mergedSub.sector || "",
      proposal: mergedSub.proposal || "",
      cost: mergedSub.cost || 0,
      locality: mergedSub.locality || "",
      latlong: mergedSub.latlong || "",
      priority: mergedSub.priority || "",
      crNumber: mergedSub.crNumber || "",
      crDate: mergedSub.crDate || "",
      remarks: mergedSub.remarks || "",
      workImage: mergedSub.workImage || null,
      detailedReport: mergedSub.detailedReport || null,
      committeeReport: mergedSub.committeeReport || null,
      councilResolution: mergedSub.councilResolution || null,
    });
    setModalOpen(true);
  };

  const saveEdits = () => {
    if (!previewSubmission) return;
    setForwardedSubmissions((prev) =>
      prev.map((f) =>
        f.id === previewSubmission.id
          ? { 
              ...f, 
              ...editable, 
              remarks: editable.remarks,
              // Preserve files if they exist in editable, otherwise keep original
              workImage: editable.workImage || f.workImage,
              detailedReport: editable.detailedReport || f.detailedReport,
              committeeReport: editable.committeeReport || f.committeeReport,
              councilResolution: editable.councilResolution || f.councilResolution,
            }
          : f
      )
    );
    setSaveBanner("Changes saved successfully.");
    setTimeout(() => setSaveBanner(""), 1500);
    setModalOpen(false);
  };

  // --- Approve ---
  const approve = (subId) => {
    const sub = forwardedSubmissions.find((f) => f.id === subId);
    if (!sub) return;
    // Close any other panels first
    setShowRejectPanel(false);
    setModalOpen(false);
    // Open approval panel
    setPreviewSubmission(sub);
    setShowApprovePanel(true);
    setApproveRemarks("");
  };

  const confirmApprove = () => {
    if (!previewSubmission) return;
    
    setForwardedSubmissions((prev) =>
      prev.map((f) =>
        f.id === previewSubmission.id 
          ? { ...f, status: "CDMA Approved", remarks: approveRemarks || "" } 
          : f
      )
    );
    setShowApprovePanel(false);
    setApproveBanner("Work approved successfully by CDMA.");
    setTimeout(() => setApproveBanner(""), 1500);
    setPreviewSubmission(null);
    setApproveRemarks("");
  };

  // --- Reject ---
  const reject = (subId) => {
    const sub = forwardedSubmissions.find((f) => f.id === subId);
    if (!sub) return;
    // Close any other panels first
    setShowApprovePanel(false);
    setModalOpen(false);
    // Open rejection panel
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
          ? { ...f, status: "CDMA Rejected", remarks: rejectRemarks, rejectedBy: "CDMA" }
          : f
      )
    );
    setRejectBanner("Work rejected and sent back to ENCPH.");
    setTimeout(() => {
      setRejectBanner("");
      setShowRejectPanel(false);
      setPreviewSubmission(null);
      setRejectRemarks("");
    }, 1500);
  };

  const isActionDisabled = (status) =>
    ["CDMA Approved", "CDMA Rejected"].includes(status);

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
          <h2 className="font-semibold text-gray-700 mb-4">CDMA Dashboard</h2>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {/* No. of CR's */}
            <div 
              onClick={() => setSelectedView("noOfCrs")}
              className={`bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-pointer hover:bg-blue-100 transition ${selectedView === "noOfCrs" ? "ring-2 ring-blue-500" : ""}`}
            >
              <div className="text-xs text-blue-600 font-medium mb-1">No. of CR's</div>
              <div className="text-xl font-bold text-blue-700">
                {(() => {
                  // Use the same data source as getListForView("noOfCrs")
                  const crList = getListForView("noOfCrs");
                  const groupedByCR = {};
                  crList.forEach((s) => {
                    const crKey = (s.crNumber || "").trim().toUpperCase() || "__NO_CR__";
                    if (!groupedByCR[crKey]) groupedByCR[crKey] = [];
                    groupedByCR[crKey].push(s);
                  });
                  // Exclude "__NO_CR__" from count (same as table logic)
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
                {forwardedSubmissions.filter(s => {
                  const status = (s.status || "").trim().toLowerCase();
                  const section = (s.forwardedTo?.section || "").trim().toLowerCase();
                  return status.includes("forwarded to cdma") || section.includes("cdma") || 
                         status === "cdma approved" || status === "cdma rejected";
                }).length}
              </div>
            </div>

            {/* No. of Pending */}
            <div 
              onClick={() => setSelectedView("pending")}
              className={`bg-yellow-50 border border-yellow-200 rounded-lg p-3 cursor-pointer hover:bg-yellow-100 transition ${selectedView === "pending" ? "ring-2 ring-yellow-500" : ""}`}
            >
              <div className="text-xs text-yellow-600 font-medium mb-1">No. of Pending</div>
              <div className="text-xl font-bold text-yellow-700">
                {pendingList.length}
              </div>
            </div>

            {/* No. of Approved */}
            <div 
              onClick={() => setSelectedView("approved")}
              className={`bg-green-50 border border-green-200 rounded-lg p-3 cursor-pointer hover:bg-green-100 transition ${selectedView === "approved" ? "ring-2 ring-green-500" : ""}`}
            >
              <div className="text-xs text-green-600 font-medium mb-1">No. of Approved</div>
              <div className="text-xl font-bold text-green-700">
                {approvedList.length}
              </div>
            </div>

            {/* No. of Rejected */}
            <div 
              onClick={() => setSelectedView("rejected")}
              className={`bg-red-50 border border-red-200 rounded-lg p-3 cursor-pointer hover:bg-red-100 transition ${selectedView === "rejected" ? "ring-2 ring-red-500" : ""}`}
            >
              <div className="text-xs text-red-600 font-medium mb-1">No. of Rejected</div>
              <div className="text-xl font-bold text-red-700">
                {rejectedList.length}
              </div>
            </div>

          </div>

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

          {/* Dynamic Table based on selected view */}
          {(() => {
            const currentList = getListForView(selectedView);
            const viewTitle = getViewTitle(selectedView);
            
            return (
              <>
                <h3 className="text-sm text-gray-600 mb-2">{viewTitle}</h3>
                {currentList.length === 0 ? (
                  <p className="text-gray-500 text-sm">No items to display.</p>
                ) : (
                  <div className="overflow-auto max-h-80">
                    <table className="min-w-full text-sm border-collapse">
                      <thead className="bg-gray-100 border-b">
                        <tr>
                          <th className="p-2 text-left whitespace-nowrap text-xs">S.No</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs">CR Number</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs">CR Date</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs">Sector</th>
                          <th className="p-2 text-left text-xs">Proposal</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs">Cost</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs">Locality</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs">Lat/Long</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs">Priority</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs">Work Image</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs">Estimation Report</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs">Status</th>
                          {selectedView === "pending" && <th className="p-2 text-left text-xs">Actions</th>}
                          {(selectedView === "rejected") && <th className="p-2 text-left text-xs">Remarks</th>}
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
                                    <td className="p-2 text-xs align-top">{isFirstInGroup ? globalSerial : ""}</td>
                                    <td className="p-2 text-xs align-top">{isFirstInGroup ? (s.crNumber || "-") : ""}</td>
                                    <td className="p-2 text-xs align-top">{isFirstInGroup ? (s.crDate || "-") : ""}</td>
                                    <td className="p-2 text-xs align-top">{isFirstInGroup ? s.sector : ""}</td>
                                    <td className="p-2 text-xs max-w-xs truncate align-top" title={s.proposal}>{s.proposal}</td>
                                    <td className="p-2 text-xs align-top">{fmtINR(s.cost)}</td>
                                    <td className="p-2 text-xs max-w-xs truncate align-top" title={s.locality}>{s.locality}</td>
                                    <td className="p-2 text-xs max-w-xs truncate align-top" title={s.latlong || "-"}>
                                      {s.latlong ? (s.latlong.length > 20 ? s.latlong.substring(0, 20) + "..." : s.latlong) : "-"}
                                    </td>
                                    <td className="p-2 text-xs align-top">{s.priority}</td>
                                    <td className="p-2 text-xs align-top">
                                      {s.workImage ? (
                                        <a href={getFileUrl(s.workImage)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a>
                                      ) : (<span className="text-gray-400">No image</span>)}
                                    </td>
                                    <td className="p-2 text-xs align-top">
                                      {s.detailedReport ? (
                                        <a href={getFileUrl(s.detailedReport)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a>
                                      ) : (<span className="text-gray-400">No report</span>)}
                                    </td>
                                    <td className="p-2 text-xs align-top">{s.status || "Pending"}</td>
                                  </tr>
                                );
                              });
                            }).flat();
                          } else if (selectedView === "allWorks") {
                            // For allWorks view, show serial number for every row
                            return currentList.map((s, i) => (
                              <tr key={s.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 text-xs align-top">{i + 1}</td>
                                <td className="p-2 text-xs align-top">{s.crNumber || "-"}</td>
                                <td className="p-2 text-xs align-top">{s.crDate || "-"}</td>
                                <td className="p-2 text-xs align-top">{s.sector}</td>
                                <td className="p-2 text-xs max-w-xs truncate align-top" title={s.proposal}>{s.proposal}</td>
                                <td className="p-2 text-xs align-top">{fmtINR(s.cost)}</td>
                                <td className="p-2 text-xs max-w-xs truncate align-top" title={s.locality}>{s.locality}</td>
                                <td className="p-2 text-xs max-w-xs truncate align-top" title={s.latlong || "-"}>
                                  {s.latlong ? (s.latlong.length > 20 ? s.latlong.substring(0, 20) + "..." : s.latlong) : "-"}
                                </td>
                                <td className="p-2 text-xs align-top">{s.priority}</td>
                                <td className="p-2 text-xs align-top">
                                  {s.workImage ? (
                                    <a href={getFileUrl(s.workImage)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a>
                                  ) : (<span className="text-gray-400">No image</span>)}
                                </td>
                                <td className="p-2 text-xs align-top">
                                  {s.detailedReport ? (
                                    <a href={getFileUrl(s.detailedReport)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a>
                                  ) : (<span className="text-gray-400">No report</span>)}
                                </td>
                                <td className="p-2 text-xs align-top">{s.status || "Pending"}</td>
                              </tr>
                            ));
                          } else {
                            // For other views (pending, approved, rejected), show serial number for every row
                            return currentList.map((s, i) => (
                              <tr key={s.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 text-xs align-top">{i + 1}</td>
                                <td className="p-2 text-xs align-top">{s.crNumber || "-"}</td>
                                <td className="p-2 text-xs align-top">{s.crDate || "-"}</td>
                                <td className="p-2 text-xs align-top">{s.sector}</td>
                                <td className="p-2 text-xs max-w-xs truncate align-top" title={s.proposal}>{s.proposal}</td>
                                <td className="p-2 text-xs align-top">{fmtINR(s.cost)}</td>
                                <td className="p-2 text-xs max-w-xs truncate align-top" title={s.locality}>{s.locality}</td>
                                <td className="p-2 text-xs max-w-xs truncate align-top" title={s.latlong || "-"}>
                                  {s.latlong ? (s.latlong.length > 20 ? s.latlong.substring(0, 20) + "..." : s.latlong) : "-"}
                                </td>
                                <td className="p-2 text-xs align-top">{s.priority}</td>
                                <td className="p-2 text-xs align-top">
                                  {s.workImage ? (
                                    <a href={getFileUrl(s.workImage)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a>
                                  ) : (<span className="text-gray-400">No image</span>)}
                                </td>
                                <td className="p-2 text-xs align-top">
                                  {s.detailedReport ? (
                                    <a href={getFileUrl(s.detailedReport)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a>
                                  ) : (<span className="text-gray-400">No report</span>)}
                                </td>
                                <td className="p-2 text-xs align-top">{s.status || "Forwarded from ENCPH"}</td>
                                {selectedView === "pending" && (
                                  <td className="p-2 align-top">
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
                                          s.status === "CDMA Approved"
                                            ? "bg-gray-300"
                                            : "bg-green-600 text-white"
                                        }`}
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => reject(s.id)}
                                        disabled={s.status === "CDMA Rejected"}
                                        className={`px-2 py-1 text-xs rounded ${
                                          s.status === "CDMA Rejected"
                                            ? "bg-gray-300"
                                            : "bg-red-600 text-white"
                                        }`}
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  </td>
                                )}
                                {selectedView === "rejected" && (
                                  <td className="p-2 text-xs text-gray-600 max-w-xs truncate align-top" title={s.remarks || "-"}>{s.remarks || "-"}</td>
                                )}
                              </tr>
                            ));
                          }
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            );
          })()}

          {/* Approve Remarks Modal */}
          {showApprovePanel && previewSubmission && (
            <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
              <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6 overflow-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-lg">Approve Work</h4>
                  <button
                    onClick={() => {
                      setShowApprovePanel(false);
                      setApproveRemarks("");
                      setPreviewSubmission(null);
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    ✕
                  </button>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Work Details:</p>
                  <div className="bg-gray-50 p-3 rounded mb-4">
                    <p className="text-sm"><span className="font-medium">CR Number:</span> {previewSubmission.crNumber || "-"}</p>
                    <p className="text-sm"><span className="font-medium">Sector:</span> {previewSubmission.sector}</p>
                    <p className="text-sm"><span className="font-medium">Proposal:</span> {previewSubmission.proposal}</p>
                    <p className="text-sm"><span className="font-medium">Cost:</span> {fmtINR(previewSubmission.cost)}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Remarks (Optional)</label>
                  <textarea
                    className="w-full border p-3 rounded mt-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows={6}
                    value={approveRemarks}
                    onChange={(e) => setApproveRemarks(e.target.value)}
                    placeholder="Enter remarks for approval (optional)..."
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowApprovePanel(false);
                      setApproveRemarks("");
                      setPreviewSubmission(null);
                    }}
                    className="px-5 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmApprove}
                    className="px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Confirm Approval
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reject Remarks Modal */}
          {showRejectPanel && previewSubmission && (
            <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
              <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-lg">Reject Work</h4>
                  <button
                    onClick={() => {
                      setShowRejectPanel(false);
                      setRejectRemarks("");
                      setPreviewSubmission(null);
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    ✕
                  </button>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Work Details:</p>
                  <div className="bg-gray-50 p-3 rounded mb-4">
                    <p className="text-sm"><span className="font-medium">CR Number:</span> {previewSubmission.crNumber || "-"}</p>
                    <p className="text-sm"><span className="font-medium">Sector:</span> {previewSubmission.sector}</p>
                    <p className="text-sm"><span className="font-medium">Proposal:</span> {previewSubmission.proposal}</p>
                    <p className="text-sm"><span className="font-medium">Cost:</span> {fmtINR(previewSubmission.cost)}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Remarks (Required)</label>
                  <textarea
                    className="w-full border p-3 rounded mt-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={6}
                    value={rejectRemarks}
                    onChange={(e) => setRejectRemarks(e.target.value)}
                    placeholder="Please enter reason for rejection..."
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowRejectPanel(false);
                      setRejectRemarks("");
                      setPreviewSubmission(null);
                    }}
                    className="px-5 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmReject}
                    className="px-5 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Submit Rejection
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* Rejected Table - Only show if viewing default (pending) */}
          {selectedView === "pending" && rejectedList.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2 text-sm">Rejected by CDMA</h4>
              <div className="overflow-auto max-h-48">
               <table className="min-w-full text-sm border-collapse">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="p-2 text-left whitespace-nowrap text-xs">S.No</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">CR Number</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">CR Date</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">Sector</th>
                      <th className="p-2 text-left text-xs">Proposal</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">Cost</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">Locality</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">Lat/Long</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">Priority</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">Work Image</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">Estimation Report</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">Status</th>
                      <th className="p-2 text-left text-xs">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rejectedList.map((s, i) => (
                      <tr key={s.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 text-xs">{i + 1}</td>
                        <td className="p-2 text-xs">{s.crNumber || "-"}</td>
                        <td className="p-2 text-xs">{s.crDate || "-"}</td>
                        <td className="p-2 text-xs">{s.sector}</td>
                        <td className="p-2 text-xs max-w-xs truncate" title={s.proposal}>{s.proposal}</td>
                        <td className="p-2 text-xs">{fmtINR(s.cost)}</td>
                        <td className="p-2 text-xs max-w-xs truncate" title={s.locality}>{s.locality}</td>
                        <td className="p-2 text-xs max-w-xs truncate" title={s.latlong || "-"}>
                          {s.latlong ? (s.latlong.length > 20 ? s.latlong.substring(0, 20) + "..." : s.latlong) : "-"}
                        </td>
                        <td className="p-2 text-xs">{s.priority}</td>
                        <td className="p-2 text-xs">
                          {s.workImage ? (
                            <a href={getFileUrl(s.workImage)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a>
                          ) : (<span className="text-gray-400">No image</span>)}
                        </td>
                        <td className="p-2 text-xs">
                          {s.detailedReport ? (
                            <a href={getFileUrl(s.detailedReport)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a>
                          ) : (<span className="text-gray-400">No report</span>)}
                        </td>
                        <td className="p-2 text-xs text-red-700">Rejected by CDMA</td>
                        <td className="p-2 text-xs text-gray-600 max-w-xs truncate" title={s.remarks || "-"}>{s.remarks || "-"}</td>
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
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-600">Latitude/Longitude or Google Maps URL</label>
                    <textarea
                      className="w-full border p-2 rounded mt-1"
                      value={editable.latlong || ""}
                      onChange={(e) =>
                        setEditable({ ...editable, latlong: e.target.value })
                      }
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">CR Number</label>
                    <input
                      className="w-full border p-2 rounded mt-1"
                      value={editable.crNumber || ""}
                      onChange={(e) =>
                        setEditable({ ...editable, crNumber: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">CR Date</label>
                    <input
                      type="date"
                      className="w-full border p-2 rounded mt-1"
                      value={editable.crDate || ""}
                      onChange={(e) =>
                        setEditable({ ...editable, crDate: e.target.value })
                      }
                    />
                  </div>
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

                {/* File uploads section */}
                <div className="mt-4 space-y-4">
                  <h4 className="font-semibold text-sm text-gray-700">Attached Files</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Work Image */}
                    <div className="border rounded p-3 bg-gray-50">
                      <label className="text-sm text-gray-700 font-medium block mb-2">Work Image</label>
                      {(() => {
                        const imgFile = editable.workImage || previewSubmission.workImage;
                        if (imgFile && imgFile instanceof File) {
                          return (
                            <div className="mb-2">
                              <img
                                src={URL.createObjectURL(imgFile)}
                                alt="Work"
                                className="rounded max-h-40 border"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) {
                                    e.target.nextSibling.style.display = 'block';
                                  }
                                }}
                              />
                              <div style={{display: 'none'}} className="text-sm text-gray-500">Image preview unavailable</div>
                            </div>
                          );
                        }
                        return <div className="text-sm text-gray-500 mb-2">No image attached</div>;
                      })()}
                    </div>

                    {/* Detailed/Estimation Report */}
                    <div className="border rounded p-3 bg-gray-50">
                      <label className="text-sm text-gray-700 font-medium block mb-2">Detailed Estimation Report</label>
                      {(() => {
                        const reportFile = editable.detailedReport || previewSubmission.detailedReport;
                        if (reportFile && reportFile instanceof File) {
                          return (
                            <div className="mb-2">
                              <a
                                href={URL.createObjectURL(reportFile)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 underline text-sm hover:text-blue-800"
                              >
                                📄 View Report ({reportFile.name || 'file'})
                              </a>
                            </div>
                          );
                        }
                        return <div className="text-sm text-gray-500 mb-2">No report attached</div>;
                      })()}
                    </div>

                    {/* Committee Report */}
                    <div className="border rounded p-3 bg-gray-50">
                      <label className="text-sm text-gray-700 font-medium block mb-2">Committee Report</label>
                      {(() => {
                        const reportFile = editable.committeeReport || previewSubmission.committeeReport;
                        if (reportFile && reportFile instanceof File) {
                          return (
                            <div className="mb-2">
                              <a
                                href={URL.createObjectURL(reportFile)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 underline text-sm hover:text-blue-800"
                              >
                                📄 View Report ({reportFile.name || 'file'})
                              </a>
                            </div>
                          );
                        }
                        return <div className="text-sm text-gray-500 mb-2">No report attached</div>;
                      })()}
                    </div>

                    {/* Council Resolution Report */}
                    <div className="border rounded p-3 bg-gray-50">
                      <label className="text-sm text-gray-700 font-medium block mb-2">Council Resolution Report</label>
                      {(() => {
                        const reportFile = editable.councilResolution || previewSubmission.councilResolution;
                        if (reportFile && reportFile instanceof File) {
                          return (
                            <div className="mb-2">
                              <a
                                href={URL.createObjectURL(reportFile)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 underline text-sm hover:text-blue-800"
                              >
                                📄 View Report ({reportFile.name || 'file'})
                              </a>
                            </div>
                          );
                        }
                        return <div className="text-sm text-gray-500 mb-2">No report attached</div>;
                      })()}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-sm text-gray-600">
                    CDMA Remarks
                  </label>
                  <textarea
                    className="w-full border p-2 rounded mt-1"
                    value={editable.remarks}
                    onChange={(e) =>
                      setEditable({ ...editable, remarks: e.target.value })
                    }
                  />
                </div>

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

