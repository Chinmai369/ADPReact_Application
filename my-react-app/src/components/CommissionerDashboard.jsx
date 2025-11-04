import Header from "./Header";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function CommissionerDashboard({
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

  const [previewSubmission, setPreviewSubmission] = useState(null);
  const [editable, setEditable] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [showForwardPanel, setShowForwardPanel] = useState(false);
  const [dept, setDept] = useState("");
  const [section, setSection] = useState("");
  const [forwardRemarks, setForwardRemarks] = useState("");
  const [forwardSuccess, setForwardSuccess] = useState("");

  const [saveBanner, setSaveBanner] = useState("");
  const [approveBanner, setApproveBanner] = useState("");
  const [rejectBanner, setRejectBanner] = useState("");

  const [showRejectPanel, setShowRejectPanel] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [showApprovePanel, setShowApprovePanel] = useState(false);
  const [approveRemarks, setApproveRemarks] = useState("");
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  
  // View state for card-based navigation
  const [selectedView, setSelectedView] = useState("pending");

  const urlCache = useRef([]);

  const sectionMap = {
    
    Administration:["EEPH","SEPH","ENCPH"]
    
  };

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

  // --- Calculate lists using useMemo for reactive updates ---
  const pendingList = useMemo(() => {
    // Pending list: excludes Commissioner rejected works (they have their own card)
    const pending = forwardedSubmissions.filter(
      (s) => {
        // Exclude Commissioner rejected works from pending
        if (s.status === "Rejected") {
          // Exclude if rejected by Commissioner
          const isCommissionerRejected = !s.rejectedBy || 
                                         s.rejectedBy === "Commissioner" || 
                                         s.rejectedBy === user?.username ||
                                         s.rejectedBy === "Ramesh";
          return !isCommissionerRejected;
        }
        // Exclude other processed statuses
        return !["Approved", "EEPH Rejected", "SEPH Rejected", "ENCPH Rejected"].includes(s.status) &&
               !s.status?.startsWith("Forwarded to");
      }
    );
    console.log("📊 Pending list recalculated:", {
      totalSubmissions: forwardedSubmissions.length,
      pendingCount: pending.length,
      rejectedItems: forwardedSubmissions.filter(s => s.status === "Rejected" && s.rejectedBy === "Commissioner").length
    });
    return pending;
  }, [forwardedSubmissions, user]);

  const selfRejectedList = useMemo(() => {
    // Self Rejected: Commissioner rejected tasks
    return forwardedSubmissions.filter((s) => 
      s.status === "Rejected" && (
        !s.rejectedBy || 
        s.rejectedBy === "Commissioner" || 
        s.rejectedBy === user?.username ||
        s.rejectedBy === "Ramesh"
      )
    );
  }, [forwardedSubmissions, user]);

  const approvedList = useMemo(() => {
    return forwardedSubmissions.filter((s) => s.status === "Approved");
  }, [forwardedSubmissions]);

  const forwardedList = useMemo(() => {
    return forwardedSubmissions.filter((s) => s.status?.startsWith("Forwarded to"));
  }, [forwardedSubmissions]);

  const rejectedList = useMemo(() => {
    // Rejected list: includes only EEPH rejected works (for "Sent back REJECTED LIST" card)
    return forwardedSubmissions.filter((s) => 
      s.status === "EEPH Rejected"
    );
  }, [forwardedSubmissions]);

  const eephRejectedList = useMemo(() => {
    return forwardedSubmissions.filter((s) => s.status === "EEPH Rejected");
  }, [forwardedSubmissions]);

  // Helper function to get the list for selected view
  const getListForView = (view) => {
    switch (view) {
      case "pending":
        return pendingList;
      case "allWorks":
        return forwardedSubmissions;
      case "approved":
        return [...approvedList, ...forwardedList];
      case "selfRejected":
        return selfRejectedList;
      case "sentBackRejected":
        return rejectedList;
      case "noOfCrs":
        return forwardedSubmissions; // All works for CR view
      default:
        return pendingList;
    }
  };

  const getViewTitle = (view) => {
    switch (view) {
      case "pending":
        return "Pending / Approval Tasks";
      case "allWorks":
        return "All Works";
      case "approved":
        return "Approved & Forwarded Tasks";
      case "selfRejected":
        return "Self Rejected Tasks";
      case "sentBackRejected":
        return "Sent back REJECTED LIST";
      case "noOfCrs":
        return "All Works (by CR Number)";
      default:
        return "Pending / Approval Tasks";
    }
  };

  // cleanup object URLs
  useEffect(() => {
    return () => {
      urlCache.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  // --- Modal ---
  const openPreview = (sub) => {
    // Get fresh submission from forwardedSubmissions to ensure we have all files
    const freshSub = forwardedSubmissions.find((f) => f.id === sub.id) || sub;
    
    console.log("🔍 Commissioner openPreview - Original sub:", sub);
    console.log("🔍 Commissioner openPreview - Fresh sub from array:", freshSub);
    console.log("🔍 Commissioner openPreview - Files check:", {
      workImage: freshSub.workImage instanceof File,
      detailedReport: freshSub.detailedReport instanceof File,
      committeeReport: freshSub.committeeReport instanceof File,
      councilResolution: freshSub.councilResolution instanceof File,
    });
    
    setPreviewSubmission(freshSub);
    setEditable({
      sector: freshSub.sector || "",
      proposal: freshSub.proposal || "",
      cost: freshSub.cost || 0,
      locality: freshSub.locality || "",
      latlong: freshSub.latlong || "",
      priority: freshSub.priority || "",
      crNumber: freshSub.crNumber || "",
      crDate: freshSub.crDate || "",
      remarks: freshSub.remarks || "",
      workImage: freshSub.workImage || null,
      detailedReport: freshSub.detailedReport || null,
      committeeReport: freshSub.committeeReport || null,
      councilResolution: freshSub.councilResolution || null,
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
    const sub = forwardedSubmissions.find((f) => f.id === subId);
    if (!sub) return;
    // Close any other panels first
    setShowRejectPanel(false);
    setShowForwardPanel(false);
    setModalOpen(false);
    // Open approval panel
    setPreviewSubmission(sub);
    setShowApprovePanel(true);
    setApproveRemarks("");
    setApprovalConfirmed(false);
  };

  const confirmApprove = () => {
    if (!previewSubmission) return;
    
    setForwardedSubmissions((prev) => {
      const updated = prev.map((f) =>
        f.id === previewSubmission.id 
          ? { ...f, status: "Approved", remarks: approveRemarks || "" } 
          : f
      );
      // Find the updated submission to set as preview
      const updatedSub = updated.find((f) => f.id === previewSubmission.id);
      if (updatedSub) {
        setPreviewSubmission(updatedSub);
      }
      return updated;
    });
    // Keep popup open and show forward section
    setApprovalConfirmed(true);
    setDept("");
    setSection("");
    setForwardRemarks("");
    setApproveBanner("Work approved successfully.");
    setTimeout(() => setApproveBanner(""), 1500);
  };

  // --- Reject ---
  const reject = (subId) => {
    const sub = forwardedSubmissions.find((f) => f.id === subId);
    if (!sub) return;
    // Close any other panels first
    setShowApprovePanel(false);
    setShowForwardPanel(false);
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

    console.log("🔴 Commissioner rejecting task:", {
      taskId: previewSubmission.id,
      currentStatus: previewSubmission.status,
      remarks: rejectRemarks
    });

    setForwardedSubmissions((prev) => {
      const updated = prev.map((f) => {
        if (f.id === previewSubmission.id) {
          const updatedItem = { 
            ...f, 
            status: "Rejected", 
            remarks: rejectRemarks, 
            rejectedBy: "Commissioner" 
          };
          console.log("🔴 Updated item:", updatedItem);
          return updatedItem;
        }
        return f;
      });
      
      console.log("🔴 Updated submissions count:", updated.length);
      console.log("🔴 Rejected items in updated array:", updated.filter(s => s.status === "Rejected" && s.rejectedBy === "Commissioner"));
      
      // Update previewSubmission to reflect the new status
      const updatedSub = updated.find((f) => f.id === previewSubmission.id);
      if (updatedSub) {
        setPreviewSubmission(updatedSub);
      }
      return updated;
    });
    
    setRejectBanner("Work rejected successfully.");
    setTimeout(() => {
      setRejectBanner("");
      setShowRejectPanel(false);
      setPreviewSubmission(null);
      setRejectRemarks("");
    }, 1500);
  };

  // --- Forward ---
  const forwardApprovedToDept = () => {
    if (!dept || !section || !previewSubmission) {
      alert("Select department and section");
      return;
    }

    const newStatus = `Forwarded to ${section}`;
    
    console.log("📤 Commissioner forwarding task:", {
      taskId: previewSubmission.id,
      dept,
      section,
      newStatus,
      forwardedTo: {
        department: dept,
        section,
        remarks: forwardRemarks,
      }
    });

    setForwardedSubmissions((prev) => {
      // Get current submission from array
      const currentSub = prev.find((f) => f.id === previewSubmission.id);
      
      // Log files before forwarding
      console.log("📤 Commissioner forwarding - Files check:", {
        fromCurrentSub: {
          workImage: currentSub?.workImage instanceof File,
          detailedReport: currentSub?.detailedReport instanceof File,
          committeeReport: currentSub?.committeeReport instanceof File,
          councilResolution: currentSub?.councilResolution instanceof File,
        },
        fromPreview: {
          workImage: previewSubmission.workImage instanceof File,
          detailedReport: previewSubmission.detailedReport instanceof File,
          committeeReport: previewSubmission.committeeReport instanceof File,
          councilResolution: previewSubmission.councilResolution instanceof File,
        }
      });
      
      const updated = prev.map((f) =>
        f.id === previewSubmission.id
          ? {
              ...f,
              forwardedTo: {
                department: dept,
                section,
                remarks: forwardRemarks,
              },
              status: newStatus,
              // Explicitly preserve all file properties - check multiple sources
              workImage: previewSubmission.workImage || f.workImage || currentSub?.workImage || null,
              detailedReport: previewSubmission.detailedReport || f.detailedReport || currentSub?.detailedReport || null,
              committeeReport: previewSubmission.committeeReport || f.committeeReport || currentSub?.committeeReport || null,
              councilResolution: previewSubmission.councilResolution || f.councilResolution || currentSub?.councilResolution || null,
            }
          : f
      );
      
      // Log files after forwarding
      const forwardedSub = updated.find((f) => f.id === previewSubmission.id);
      console.log("✅ Commissioner forwarded - Files after:", {
        workImage: forwardedSub?.workImage instanceof File,
        detailedReport: forwardedSub?.detailedReport instanceof File,
        committeeReport: forwardedSub?.committeeReport instanceof File,
        councilResolution: forwardedSub?.councilResolution instanceof File,
      });
      
      return updated;
    });

    // Update previewSubmission with new status
    setPreviewSubmission({
      ...previewSubmission,
      forwardedTo: {
        department: dept,
        section,
        remarks: forwardRemarks,
      },
      status: newStatus,
    });

    setForwardSuccess(`Work forwarded to ${section} successfully!`);
    setTimeout(() => {
      setForwardSuccess("");
      setShowForwardPanel(false);
      setShowApprovePanel(false);
      setApprovalConfirmed(false);
      setPreviewSubmission(null);
      setDept("");
      setSection("");
      setForwardRemarks("");
      setApproveRemarks("");
    }, 1200);
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
    status === "Approved" ||
    status?.startsWith("Forwarded to");

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
          <h2 className="font-semibold text-gray-700 mb-4">
            Commissioner Dashboard
          </h2>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {/* No. of CR's */}
            <div 
              onClick={() => setSelectedView("noOfCrs")}
              className={`bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-pointer hover:bg-blue-100 transition ${selectedView === "noOfCrs" ? "ring-2 ring-blue-500" : ""}`}
            >
              <div className="text-xs text-blue-600 font-medium mb-1">No. of CR's</div>
              <div className="text-xl font-bold text-blue-700">
                {new Set(forwardedSubmissions.filter(s => s.crNumber && s.crNumber.trim() !== "").map(s => s.crNumber)).size}
              </div>
            </div>

            {/* No. of Works */}
            <div 
              onClick={() => setSelectedView("allWorks")}
              className={`bg-purple-50 border border-purple-200 rounded-lg p-3 cursor-pointer hover:bg-purple-100 transition ${selectedView === "allWorks" ? "ring-2 ring-purple-500" : ""}`}
            >
              <div className="text-xs text-purple-600 font-medium mb-1">No. of Works</div>
              <div className="text-xl font-bold text-purple-700">
                {forwardedSubmissions.length}
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

            {/* Self Rejected */}
            <div 
              onClick={() => setSelectedView("selfRejected")}
              className={`bg-orange-50 border border-orange-200 rounded-lg p-3 cursor-pointer hover:bg-orange-100 transition ${selectedView === "selfRejected" ? "ring-2 ring-orange-500" : ""}`}
            >
              <div className="text-xs text-orange-600 font-medium mb-1">Self Rejected</div>
              <div className="text-xl font-bold text-orange-700">
                {selfRejectedList.length}
              </div>
            </div>

            {/* Sent back REJECTED LIST */}
            <div 
              onClick={() => setSelectedView("sentBackRejected")}
              className={`bg-red-50 border border-red-200 rounded-lg p-3 cursor-pointer hover:bg-red-100 transition ${selectedView === "sentBackRejected" ? "ring-2 ring-red-500" : ""}`}
            >
              <div className="text-xs text-red-600 font-medium mb-1">Sent back REJECTED LIST</div>
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
            const showActions = selectedView === "pending";
            
            return (
              <>
                <h3 className="text-sm text-gray-600 mb-2">
                  {getViewTitle(selectedView)}
                </h3>
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
                          {showActions && <th className="p-2 text-left">Actions</th>}
                          {!showActions && (selectedView === "selfRejected" || selectedView === "sentBackRejected") && (
                            <th className="p-2 text-left text-xs">Remarks</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {currentList.map((s, i) => {
                          const isCommissionerRejected = s.status === "Rejected" && 
                            (!s.rejectedBy || s.rejectedBy === "Commissioner" || s.rejectedBy === user?.username);
                          return (
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
                              <td className="p-2 text-xs">
                                {selectedView === "pending" && isCommissionerRejected ? (
                                  <span className="text-orange-600">Rejected (Re-review)</span>
                                ) : selectedView === "selfRejected" || selectedView === "sentBackRejected" ? (
                                  <span className="text-red-700">
                                    {s.rejectedBy 
                                      ? `Rejected by ${s.rejectedBy}` 
                                      : s.status === "EEPH Rejected" 
                                      ? "Rejected by EEPH"
                                      : s.status === "SEPH Rejected"
                                      ? "Rejected by SEPH"
                                      : s.status === "ENCPH Rejected"
                                      ? "Rejected by ENCPH"
                                      : s.status === "Rejected"
                                      ? "Rejected by Commissioner"
                                      : s.status}
                                  </span>
                                ) : selectedView === "approved" ? (
                                  <span className="text-green-700">{s.status}</span>
                                ) : (
                                  s.status || "Pending"
                                )}
                              </td>
                              {showActions && (
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
                                      disabled={isActionDisabled(s.status) && !isCommissionerRejected}
                                      className={`px-2 py-1 text-xs rounded ${
                                        s.status === "Approved"
                                          ? "bg-gray-300"
                                          : "bg-green-600 text-white"
                                      }`}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => reject(s.id)}
                                      disabled={false}
                                      className="px-2 py-1 text-xs rounded bg-red-600 text-white"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                </td>
                              )}
                              {!showActions && (selectedView === "selfRejected" || selectedView === "sentBackRejected") && (
                                <td className="p-2 text-xs text-gray-600 max-w-xs truncate" title={s.remarks || "-"}>{s.remarks || "-"}</td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            );
          })()}

          {/* Forward panel */}
          {showForwardPanel && previewSubmission && previewSubmission.status === "Approved" && (
            <div className="bg-white border rounded-xl shadow p-5 mt-6">
              <h4 className="font-semibold mb-3">
                Forward Approved Work to Department
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Department</label>
                  <select
                    className="w-full border p-2 rounded mt-1"
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                  >
                    <option value="">Select department</option>
                    {Object.keys(sectionMap).map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Section</label>
                  <select
                    className="w-full border p-2 rounded mt-1"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    disabled={!dept}
                  >
                    <option value="">Select section</option>
                    {dept &&
                      sectionMap[dept].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Remarks</label>
                  <input
                    className="w-full border p-2 rounded mt-1"
                    value={forwardRemarks}
                    onChange={(e) => setForwardRemarks(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={forwardApprovedToDept}
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Forward
                </button>
              </div>
              {forwardSuccess && (
                <div className="mt-2 text-green-700 text-sm">
                  {forwardSuccess}
                </div>
              )}
            </div>
          )}

          {/* Approve Remarks Modal */}
          {showApprovePanel && previewSubmission && (
            <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
              <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6 overflow-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-lg">
                    {approvalConfirmed ? "Forward Approved Work to Department" : "Approve Work"}
                  </h4>
                  <button
                    onClick={() => {
                      setShowApprovePanel(false);
                      setApproveRemarks("");
                      setApprovalConfirmed(false);
                      setPreviewSubmission(null);
                      setDept("");
                      setSection("");
                      setForwardRemarks("");
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
                
                {!approvalConfirmed ? (
                  <>
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
                          setApprovalConfirmed(false);
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
                  </>
                ) : (
                  <>
                    {approveBanner && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">
                        {approveBanner}
                      </div>
                    )}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-600 font-medium">Department</label>
                        <select
                          className="w-full border p-3 rounded mt-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          value={dept}
                          onChange={(e) => setDept(e.target.value)}
                        >
                          <option value="">Select department</option>
                          {Object.keys(sectionMap).map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 font-medium">Section</label>
                        <select
                          className="w-full border p-3 rounded mt-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          value={section}
                          onChange={(e) => setSection(e.target.value)}
                          disabled={!dept}
                        >
                          <option value="">Select section</option>
                          {dept &&
                            sectionMap[dept].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 font-medium">Remarks (Optional)</label>
                        <textarea
                          className="w-full border p-3 rounded mt-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          rows={4}
                          value={forwardRemarks}
                          onChange={(e) => setForwardRemarks(e.target.value)}
                          placeholder="Enter remarks for forwarding (optional)..."
                        />
                      </div>
                    </div>
                    {forwardSuccess && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">
                        {forwardSuccess}
                      </div>
                    )}
                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={() => {
                          setShowApprovePanel(false);
                          setApproveRemarks("");
                          setApprovalConfirmed(false);
                          setPreviewSubmission(null);
                          setDept("");
                          setSection("");
                          setForwardRemarks("");
                        }}
                        className="px-5 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={forwardApprovedToDept}
                        disabled={!dept || !section}
                        className={`px-5 py-2 rounded ${
                          !dept || !section
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        } text-white`}
                      >
                        Forward
                      </button>
                    </div>
                  </>
                )}
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

        </div>

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
              </div>

              {/* File uploads section */}
              <div className="mt-4 space-y-4">
                <h4 className="font-semibold text-sm text-gray-700">Attached Files</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Work Image */}
                  <div className="border rounded p-3 bg-gray-50">
                    <label className="text-sm text-gray-700 font-medium block mb-2">Work Image</label>
                    {(previewSubmission.workImage && previewSubmission.workImage instanceof File) || (editable.workImage && editable.workImage instanceof File) ? (
                      <div className="mb-2">
                        <img
                          src={URL.createObjectURL((editable.workImage && editable.workImage instanceof File) ? editable.workImage : previewSubmission.workImage)}
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
                    ) : (
                      <div className="text-sm text-gray-500 mb-2">No image attached</div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setEditable({ ...editable, workImage: file });
                        }
                      }}
                      className="w-full border p-2 rounded text-sm bg-white"
                    />
                  </div>

                  {/* Detailed/Estimation Report */}
                  <div className="border rounded p-3 bg-gray-50">
                    <label className="text-sm text-gray-700 font-medium block mb-2">Estimation Report</label>
                    {((previewSubmission.detailedReport && previewSubmission.detailedReport instanceof File) || (editable.detailedReport && editable.detailedReport instanceof File)) ? (
                      <div className="mb-2">
                        <a
                          href={URL.createObjectURL((editable.detailedReport && editable.detailedReport instanceof File) ? editable.detailedReport : previewSubmission.detailedReport)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline text-sm hover:text-blue-800"
                        >
                          📄 View Current Report ({((editable.detailedReport && editable.detailedReport instanceof File) ? editable.detailedReport : previewSubmission.detailedReport).name || 'file'})
                        </a>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 mb-2">No report attached</div>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setEditable({ ...editable, detailedReport: file });
                        }
                      }}
                      className="w-full border p-2 rounded text-sm bg-white"
                    />
                  </div>

                  {/* Committee Report */}
                  <div className="border rounded p-3 bg-gray-50">
                    <label className="text-sm text-gray-700 font-medium block mb-2">Committee Report</label>
                    {((previewSubmission.committeeReport && previewSubmission.committeeReport instanceof File) || (editable.committeeReport && editable.committeeReport instanceof File)) ? (
                      <div className="mb-2">
                        <a
                          href={URL.createObjectURL((editable.committeeReport && editable.committeeReport instanceof File) ? editable.committeeReport : previewSubmission.committeeReport)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline text-sm hover:text-blue-800"
                        >
                          📄 View Current Report ({((editable.committeeReport && editable.committeeReport instanceof File) ? editable.committeeReport : previewSubmission.committeeReport).name || 'file'})
                        </a>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 mb-2">No report attached</div>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setEditable({ ...editable, committeeReport: file });
                        }
                      }}
                      className="w-full border p-2 rounded text-sm bg-white"
                    />
                  </div>

                  {/* Council Resolution Report */}
                  <div className="border rounded p-3 bg-gray-50">
                    <label className="text-sm text-gray-700 font-medium block mb-2">Council Resolution Report</label>
                    {((previewSubmission.councilResolution && previewSubmission.councilResolution instanceof File) || (editable.councilResolution && editable.councilResolution instanceof File)) ? (
                      <div className="mb-2">
                        <a
                          href={URL.createObjectURL((editable.councilResolution && editable.councilResolution instanceof File) ? editable.councilResolution : previewSubmission.councilResolution)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline text-sm hover:text-blue-800"
                        >
                          📄 View Current Report ({((editable.councilResolution && editable.councilResolution instanceof File) ? editable.councilResolution : previewSubmission.councilResolution).name || 'file'})
                        </a>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 mb-2">No report attached</div>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setEditable({ ...editable, councilResolution: file });
                        }
                      }}
                      className="w-full border p-2 rounded text-sm bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm text-gray-600">
                  Commissioner Remarks
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
  );
}
