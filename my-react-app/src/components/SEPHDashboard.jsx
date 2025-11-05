import Header from "./Header";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function SEPHDashboard({
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

  // Helper function to get file info (name, size, type)
  const getFileInfo = (file, defaultName = "document") => {
    if (!file) return null;
    
    let fileName = defaultName;
    let fileSize = null;
    let fileType = "PDF";
    
    if (file instanceof File) {
      fileName = file.name || defaultName;
      fileSize = file.size;
      const ext = fileName.split('.').pop()?.toUpperCase() || 'PDF';
      fileType = ext === 'PDF' ? 'PDF' : ext;
    } else if (typeof file === 'string') {
      if (file.startsWith('data:')) {
        const matches = file.match(/data:([^;]+);/);
        if (matches) {
          const mimeType = matches[1];
          if (mimeType.includes('pdf')) {
            fileType = 'PDF';
          } else if (mimeType.includes('image')) {
            fileType = 'IMAGE';
          } else {
            fileType = 'FILE';
          }
        }
        fileSize = Math.round((file.length * 3) / 4);
      }
      fileName = defaultName;
    }
    
    return { fileName, fileSize, fileType };
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // File Preview Component
  const FilePreview = ({ file, defaultName = "document.pdf" }) => {
    if (!file) {
      return <span className="text-gray-400 text-xs">No file</span>;
    }
    
    const fileInfo = getFileInfo(file, defaultName);
    const fileUrl = getFileUrl(file);
    
    const handleClick = (e) => {
      e.preventDefault();
      if (fileUrl) {
        window.open(fileUrl, '_blank');
      }
    };
    
    return (
      <div 
        onClick={handleClick}
        className="bg-white rounded shadow-sm border border-gray-200 p-1 cursor-pointer hover:shadow-md transition-shadow max-w-[70px]"
      >
        <div className="w-full h-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded mb-1 overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 bg-white rounded shadow-sm opacity-50"></div>
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-0.5">
            <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
            <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
          </div>
        </div>
        
        <div className="flex items-start gap-0.5">
          <div className="bg-red-600 text-white text-[5px] font-bold px-0.5 py-0.5 rounded flex-shrink-0">
            {fileInfo.fileType}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-[8px] font-medium text-gray-900 truncate" title={fileInfo.fileName}>
              {fileInfo.fileName}
            </div>
            {fileInfo.fileSize && (
              <div className="text-[7px] text-gray-500">
                {formatFileSize(fileInfo.fileSize)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- States ---
  const [pendingList, setPendingList] = useState([]);
  const [approvedList, setApprovedList] = useState([]);
  const [forwardedList, setForwardedList] = useState([]);
  const [rejectedList, setRejectedList] = useState([]);

  const [previewSubmission, setPreviewSubmission] = useState(null);
  const [editable, setEditable] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [saveBanner, setSaveBanner] = useState("");
  const [approveBanner, setApproveBanner] = useState("");
  const [rejectBanner, setRejectBanner] = useState("");

  const [dept, setDept] = useState("");
  const [section, setSection] = useState("");
  const [forwardRemarks, setForwardRemarks] = useState("");
  const [forwardSuccess, setForwardSuccess] = useState("");

  const [showRejectPanel, setShowRejectPanel] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [showApprovePanel, setShowApprovePanel] = useState(false);
  const [approveRemarks, setApproveRemarks] = useState("");
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [selectedView, setSelectedView] = useState("pending"); // For card-based navigation

  const urlCache = useRef([]);

  const sectionMap = {
    "Administration": ["ENCPH Department"],
  };

  useEffect(() => {
    const pending = forwardedSubmissions.filter(
      (s) => {
        const status = (s.status || "").trim();
        const section = (s.forwardedTo?.section || "").trim();
        
        // Exclude already processed tasks
        const isProcessed = ["SEPH Approved", "SEPH Rejected", "ENCPH Rejected"].includes(status);
        if (isProcessed) return false;
        
        // Match status or section to SEPH
        const statusLower = status.toLowerCase();
        if (statusLower.includes("forwarded to seph")) return true;
        if (section.toLowerCase() === "seph") return true;
        if (statusLower.startsWith("forwarded to") && section.toLowerCase() === "seph") return true;
        return false;
      }
    );
    setPendingList(pending);
    const approved = forwardedSubmissions.filter((s) => s.status === "SEPH Approved");
    setApprovedList(approved);
    const forwarded = forwardedSubmissions.filter((s) => {
      const status = s.status || "";
      const section = s.forwardedTo?.section || "";
      return (
        status.includes("Forwarded to ENCPH") ||
        status.toLowerCase().includes("forwarded to encph") ||
        section.toLowerCase().includes("encph")
      );
    });
    setForwardedList(forwarded);
    const rejected = forwardedSubmissions.filter(
      (s) => s.status === "SEPH Rejected" || s.status === "ENCPH Rejected"
    );
    setRejectedList(rejected);
  }, [forwardedSubmissions]);

  // Helper functions for view
  const getListForView = (view) => {
    let list = [];
    switch (view) {
      case "pending":
        list = pendingList;
        break;
      case "allWorks":
        list = forwardedSubmissions.filter(s => {
          const status = (s.status || "").trim().toLowerCase();
          const section = (s.forwardedTo?.section || "").trim().toLowerCase();
          return status.includes("forwarded to seph") || section === "seph" || 
                 status.includes("seph approved") || status.includes("seph rejected") ||
                 status.includes("forwarded to encph") || section.includes("encph");
        });
        break;
      case "forwarded":
        list = forwardedList;
        break;
      case "rejected":
        list = rejectedList.filter(s => s.status === "SEPH Rejected");
        break;
      case "sentBackRejected":
        list = forwardedSubmissions.filter(s => s.status === "ENCPH Rejected");
        break;
      case "noOfCrs":
        list = forwardedSubmissions.filter(s => {
          const status = (s.status || "").trim().toLowerCase();
          const section = (s.forwardedTo?.section || "").trim().toLowerCase();
          return status.includes("forwarded to seph") || section === "seph" || 
                 status.includes("seph approved") || status.includes("seph rejected") ||
                 status.includes("forwarded to encph") || section.includes("encph");
        });
        break;
      default:
        list = pendingList;
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
      case "pending":
        return "Pending Works";
      case "allWorks":
        return "All Works";
      case "forwarded":
        return "Forwarded Tasks";
      case "rejected":
        return "Rejected Tasks";
      case "sentBackRejected":
        return "Sent back REJECTED LIST";
      case "noOfCrs":
        return "All Works (by CR Number)";
      default:
        return "Pending Works";
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
          // Push again to prevent leaving
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
    
    console.log("🔍 SEPH openPreview - Original sub:", sub);
    console.log("🔍 SEPH openPreview - Fresh sub from array:", freshSub);
    console.log("🔍 SEPH openPreview - Files check:", {
      workImage: freshSub.workImage instanceof File,
      detailedReport: freshSub.detailedReport instanceof File,
      committeeReport: freshSub.committeeReport instanceof File,
      councilResolution: freshSub.councilResolution instanceof File,
      workImageExists: !!freshSub.workImage,
      detailedReportExists: !!freshSub.detailedReport,
      committeeReportExists: !!freshSub.committeeReport,
      councilResolutionExists: !!freshSub.councilResolution,
    });
    console.log("🔍 SEPH openPreview - File Details:", {
      workImage: freshSub.workImage ? (freshSub.workImage instanceof File ? `File: ${freshSub.workImage.name}` : typeof freshSub.workImage) : 'null',
      detailedReport: freshSub.detailedReport ? (freshSub.detailedReport instanceof File ? `File: ${freshSub.detailedReport.name}` : typeof freshSub.detailedReport) : 'null',
      committeeReport: freshSub.committeeReport ? (freshSub.committeeReport instanceof File ? `File: ${freshSub.committeeReport.name}` : typeof freshSub.committeeReport) : 'null',
      councilResolution: freshSub.councilResolution ? (freshSub.councilResolution instanceof File ? `File: ${freshSub.councilResolution.name}` : typeof freshSub.councilResolution) : 'null',
    });
    console.log("🔍 SEPH openPreview - Original sub Files:", {
      workImage: sub.workImage ? (sub.workImage instanceof File ? `File: ${sub.workImage.name}` : typeof sub.workImage) : 'null',
      detailedReport: sub.detailedReport ? (sub.detailedReport instanceof File ? `File: ${sub.detailedReport.name}` : typeof sub.detailedReport) : 'null',
      committeeReport: sub.committeeReport ? (sub.committeeReport instanceof File ? `File: ${sub.committeeReport.name}` : typeof sub.committeeReport) : 'null',
      councilResolution: sub.councilResolution ? (sub.councilResolution instanceof File ? `File: ${sub.councilResolution.name}` : typeof sub.councilResolution) : 'null',
    });
    
    // Ensure we preserve files - check if files exist in original sub and merge
    const mergedSub = {
      ...freshSub,
      // Preserve files from original if they exist there but not in fresh
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
    setApprovalConfirmed(false);
  };

  const confirmApprove = () => {
    if (!previewSubmission) return;
    
    // Validate that Verification Note is filled
    if (!approveRemarks || approveRemarks.trim() === "") {
      alert("Please enter Verification Note before approving.");
      return;
    }
    
    setForwardedSubmissions((prev) => {
      const updated = prev.map((f) =>
        f.id === previewSubmission.id 
          ? { ...f, status: "SEPH Approved", remarks: approveRemarks } 
          : f
      );
      // Find the updated submission to set as preview
      const updatedSub = updated.find((f) => f.id === previewSubmission.id);
      if (updatedSub) {
        setPreviewSubmission(updatedSub);
      }
      return updated;
    });
    // Keep modal open and show forward section
    setApprovalConfirmed(true);
    setDept("");
    setSection("");
    setForwardRemarks("");
    setApproveBanner("Work approved successfully by SEPH.");
    setTimeout(() => setApproveBanner(""), 1500);
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
          ? { ...f, status: "SEPH Rejected", remarks: rejectRemarks, rejectedBy: "SEPH" }
          : f
      )
    );
    setRejectBanner("Work rejected and sent back to EEPH.");
    setTimeout(() => {
      setRejectBanner("");
      setShowRejectPanel(false);
      setPreviewSubmission(null);
      setRejectRemarks("");
    }, 1500);
  };

  // --- Forward ---
  const forwardApprovedToDept = () => {
    if (!dept || !section || !previewSubmission)
      return alert("Select department and section");
    
    setForwardedSubmissions((prev) => {
      const updated = prev.map((f) =>
        f.id === previewSubmission.id
          ? {
              ...f,
              forwardedTo: {
                department: dept,
                section,
              },
              status: "Forwarded to ENCPH",
              // Explicitly preserve all file properties
              workImage: f.workImage || previewSubmission.workImage,
              detailedReport: f.detailedReport || previewSubmission.detailedReport,
              committeeReport: f.committeeReport || previewSubmission.committeeReport,
              councilResolution: f.councilResolution || previewSubmission.councilResolution,
            }
          : f
      );
      return updated;
    });
    // Close modal immediately
    setShowApprovePanel(false);
    setApprovalConfirmed(false);
    setApproveRemarks("");
    setPreviewSubmission(null);
    setDept("");
    setSection("");
    setForwardRemarks("");
    
    // Show alert
    alert("Forwarded successfully!");
    
    // Set banner message
    setForwardSuccess("✅ Successfully Forwarded to ENCPH Department!");
    setTimeout(() => {
      setForwardSuccess("");
    }, 5000);
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
    ["SEPH Approved", "SEPH Rejected"].includes(status);

  const [selectedMenuItem, setSelectedMenuItem] = useState("dashboard");

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "reports", label: "Reports", icon: "📄" },
    { id: "gos", label: "GO's", icon: "📋" },
    { id: "circular", label: "Circular & Proceedings", icon: "📢" },
    { id: "guidelines", label: "Guidelines", icon: "📐" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full p-6 pb-0">
        <Header
          title="15th Finance Commission"
          user={user}
          onLogout={() => {
            const confirmed = window.confirm("Are you sure you want to logout?");
            if (confirmed) {
              logout?.();
              window.location.href = "/";
            }
          }}
        />
      </div>
      
      <div className="flex items-start">
        {/* Left Sidebar Menu */}
        <div className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl min-h-[calc(100vh-80px)] border-r border-slate-700">
          <div className="p-5 border-b border-slate-700">
            <h3 className="text-base font-bold text-white uppercase tracking-wider">Menu</h3>
          </div>
          <nav className="p-3 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedMenuItem(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-left transition-all duration-200 ${
                  selectedMenuItem === item.id
                    ? "bg-emerald-600 text-white font-semibold shadow-lg transform scale-[1.02] border-l-4 border-emerald-300"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white hover:shadow-md hover:translate-x-1"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 pt-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="font-semibold text-gray-700 mb-4">SEPH Dashboard</h2>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
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
                  return status.includes("forwarded to seph") || section === "seph" || 
                         status.includes("seph approved") || status.includes("seph rejected") ||
                         status.includes("forwarded to encph") || section.includes("encph");
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

            {/* No. of Forwarded */}
            <div 
              onClick={() => setSelectedView("forwarded")}
              className={`bg-indigo-50 border border-indigo-200 rounded-lg p-3 cursor-pointer hover:bg-indigo-100 transition ${selectedView === "forwarded" ? "ring-2 ring-indigo-500" : ""}`}
            >
              <div className="text-xs text-indigo-600 font-medium mb-1">No. of Forwarded</div>
              <div className="text-xl font-bold text-indigo-700">
                {forwardedList.length}
              </div>
            </div>

            {/* No. of Rejected */}
            <div 
              onClick={() => setSelectedView("rejected")}
              className={`bg-red-50 border border-red-200 rounded-lg p-3 cursor-pointer hover:bg-red-100 transition ${selectedView === "rejected" ? "ring-2 ring-red-500" : ""}`}
            >
              <div className="text-xs text-red-600 font-medium mb-1">No. of Rejected</div>
              <div className="text-xl font-bold text-red-700">
                {rejectedList.filter(s => s.status === "SEPH Rejected").length}
              </div>
            </div>

            {/* Sent back REJECTED LIST */}
            <div 
              onClick={() => setSelectedView("sentBackRejected")}
              className={`bg-orange-50 border border-orange-200 rounded-lg p-3 cursor-pointer hover:bg-orange-100 transition ${selectedView === "sentBackRejected" ? "ring-2 ring-orange-500" : ""}`}
            >
              <div className="text-xs text-orange-600 font-medium mb-1">Sent back REJECTED LIST</div>
              <div className="text-xl font-bold text-orange-700">
                {forwardedSubmissions.filter(s => s.status === "ENCPH Rejected").length}
              </div>
            </div>
          </div>

          {/* banners */}
          {forwardSuccess && (
            <div className="mb-4 p-4 bg-green-500 text-white rounded-lg shadow-lg text-center font-semibold text-base animate-pulse">
              {forwardSuccess}
            </div>
          )}
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
                          {(selectedView === "rejected" || selectedView === "sentBackRejected") && <th className="p-2 text-left text-xs">Remarks</th>}
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
                                      <FilePreview file={s.detailedReport} defaultName="estimation-report.pdf" />
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
                                    <FilePreview file={s.detailedReport} defaultName="estimation-report.pdf" />
                                  ) : null}
                                </td>
                                <td className="p-2 text-xs align-top">{s.status || "Pending"}</td>
                              </tr>
                            ));
                          } else {
                            // For other views (pending, forwarded, rejected, sentBackRejected), show serial number for every row
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
                                    <FilePreview file={s.detailedReport} defaultName="estimation-report.pdf" />
                                  ) : null}
                                </td>
                                <td className="p-2 text-xs align-top">{s.status || "Pending"}</td>
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
                                          s.status === "SEPH Approved"
                                            ? "bg-gray-300"
                                            : "bg-green-600 text-white"
                                        }`}
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => reject(s.id)}
                                        disabled={s.status === "SEPH Rejected"}
                                        className={`px-2 py-1 text-xs rounded ${
                                          s.status === "SEPH Rejected"
                                            ? "bg-gray-300"
                                            : "bg-red-600 text-white"
                                        }`}
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  </td>
                                )}
                                {(selectedView === "rejected" || selectedView === "sentBackRejected") && (
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
                      <label className="text-sm text-gray-600 font-medium">Verification Note <span className="text-red-500">*</span></label>
                      <textarea
                        className="w-full border p-3 rounded mt-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        rows={6}
                        value={approveRemarks}
                        onChange={(e) => setApproveRemarks(e.target.value)}
                        placeholder="Enter verification note (required)..."
                        required
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

          {/* Approved Table - Only show if viewing default (pending) */}
          {selectedView === "pending" && approvedList.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2 text-sm">Approved by SEPH</h4>
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
                    </tr>
                  </thead>
                  <tbody>
                    {approvedList.map((s, i) => (
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
                            <FilePreview file={s.detailedReport} defaultName="estimation-report.pdf" />
                          ) : null}
                        </td>
                        <td className="p-2 text-xs text-green-700">SEPH Approved</td>
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
                  {(() => {
                    const imageFile = editable.workImage || previewSubmission.workImage;
                    const imageUrl = getFileUrl(imageFile);
                    return imageUrl && (
                      <div className="md:col-span-2 mt-2">
                        <label className="text-sm text-gray-600">Work Image</label>
                        <img
                          src={imageUrl}
                          alt=""
                          className="mt-2 rounded max-h-60"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    );
                  })()}
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
                        const imageUrl = getFileUrl(imgFile);
                        return imageUrl ? (
                          <div className="mb-2">
                            <img
                              src={imageUrl}
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
                        );
                      })()}
                    </div>

                    {/* Detailed/Estimation Report */}
                    <div className="border rounded p-3 bg-gray-50">
                      <label className="text-sm text-gray-700 font-medium block mb-2">Detailed Estimation Report</label>
                      {(() => {
                        const reportFile = editable.detailedReport || previewSubmission.detailedReport;
                        const reportUrl = getFileUrl(reportFile);
                        return reportUrl ? (
                          <div className="mb-2">
                            <a
                              href={reportUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 underline text-sm hover:text-blue-800"
                            >
                              📄 View Report ({reportFile instanceof File ? reportFile.name : 'file'})
                            </a>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 mb-2">No report attached</div>
                        );
                      })()}
                    </div>

                    {/* Committee Report */}
                    <div className="border rounded p-3 bg-gray-50">
                      <label className="text-sm text-gray-700 font-medium block mb-2">Committee Report</label>
                      {(() => {
                        const reportFile = editable.committeeReport || previewSubmission.committeeReport;
                        const reportUrl = getFileUrl(reportFile);
                        return reportUrl ? (
                          <div className="mb-2">
                            <a
                              href={reportUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 underline text-sm hover:text-blue-800"
                            >
                              📄 View Report ({reportFile instanceof File ? reportFile.name : 'file'})
                            </a>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 mb-2">No report attached</div>
                        );
                      })()}
                    </div>

                    {/* Council Resolution Report */}
                    <div className="border rounded p-3 bg-gray-50">
                      <label className="text-sm text-gray-700 font-medium block mb-2">Council Resolution Report</label>
                      {(() => {
                        const reportFile = editable.councilResolution || previewSubmission.councilResolution;
                        const reportUrl = getFileUrl(reportFile);
                        return reportUrl ? (
                          <div className="mb-2">
                            <a
                              href={reportUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 underline text-sm hover:text-blue-800"
                            >
                              📄 View Report ({reportFile instanceof File ? reportFile.name : 'file'})
                            </a>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 mb-2">No report attached</div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-sm text-gray-600">
                    SEPH Remarks
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
      </div>
    </div>
  );
}
