import Header from "./Header";
import SidebarMenu from "./SidebarMenu";
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

  // Helper function to check if file is an image
  const isImageFile = (file) => {
    if (!file) return false;
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
    if (file instanceof File) {
      const fileName = file.name || '';
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      return imageExtensions.includes(ext) || imageMimeTypes.includes(file.type);
    } else if (typeof file === 'string') {
      if (file.startsWith('data:')) {
        const matches = file.match(/data:([^;]+);/);
        if (matches) {
          const mimeType = matches[1].toLowerCase();
          return imageMimeTypes.some(imgType => mimeType.includes(imgType.split('/')[1]));
        }
      }
      const ext = file.split('.').pop()?.toLowerCase() || '';
      return imageExtensions.includes(ext);
    }
    return false;
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
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      if (isImageFile(file)) {
        fileType = 'IMAGE';
      } else if (ext === 'pdf') {
        fileType = 'PDF';
      } else if (['doc', 'docx'].includes(ext)) {
        fileType = 'DOC';
      } else {
        fileType = ext.toUpperCase() || 'FILE';
      }
    } else if (typeof file === 'string') {
      if (file.startsWith('data:')) {
        const matches = file.match(/data:([^;]+);/);
        if (matches) {
          const mimeType = matches[1].toLowerCase();
          if (mimeType.includes('pdf')) {
            fileType = 'PDF';
          } else if (mimeType.includes('image')) {
            fileType = 'IMAGE';
          } else if (mimeType.includes('document') || mimeType.includes('msword')) {
            fileType = 'DOC';
          } else {
            fileType = 'FILE';
          }
        }
        fileSize = Math.round((file.length * 3) / 4);
      } else {
        const ext = file.split('.').pop()?.toLowerCase() || '';
        if (isImageFile(file)) {
          fileType = 'IMAGE';
        } else if (ext === 'pdf') {
          fileType = 'PDF';
        } else if (['doc', 'docx'].includes(ext)) {
          fileType = 'DOC';
        } else {
          fileType = ext.toUpperCase() || 'FILE';
        }
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
    const [imageError, setImageError] = useState(false);
    if (!file) {
      return <span className="text-gray-400 text-xs">No file</span>;
    }
    const fileInfo = getFileInfo(file, defaultName);
    const fileUrl = getFileUrl(file);
    const isImage = isImageFile(file) && !imageError;
    const handleClick = (e) => {
      e.preventDefault();
      if (fileUrl) {
        window.open(fileUrl, '_blank');
      }
    };
    if (isImage && fileUrl) {
      return (
        <div 
          onClick={handleClick}
          className="bg-white rounded shadow-sm border border-gray-200 p-1 cursor-pointer hover:shadow-md transition-shadow max-w-[70px] overflow-hidden"
        >
          <img 
            src={fileUrl} 
            alt={fileInfo.fileName}
            className="w-full h-16 object-cover rounded mb-1"
            onError={() => setImageError(true)}
          />
          <div className="text-[8px] font-medium text-gray-900 truncate" title={fileInfo.fileName}>
            {fileInfo.fileName}
          </div>
        </div>
      );
    }
    return (
      <div 
        onClick={handleClick}
        className="bg-white rounded shadow-sm border border-gray-200 p-1 cursor-pointer hover:shadow-md transition-shadow max-w-[70px]"
      >
        <div className={`w-full h-8 rounded mb-1 overflow-hidden relative flex items-center justify-center ${
          fileInfo.fileType === 'PDF' 
            ? 'bg-gradient-to-br from-red-100 to-red-200' 
            : fileInfo.fileType === 'DOC' || fileInfo.fileType === 'DOCX'
            ? 'bg-gradient-to-br from-blue-100 to-blue-200'
            : 'bg-gradient-to-br from-gray-100 to-gray-200'
        }`}>
          <div className={`text-[10px] font-bold ${
            fileInfo.fileType === 'PDF' 
              ? 'text-red-600' 
              : fileInfo.fileType === 'DOC' || fileInfo.fileType === 'DOCX'
              ? 'text-blue-600'
              : 'text-gray-700'
          }`}>
            {fileInfo.fileType}
          </div>
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
    );
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

  // Filter state
  const [filters, setFilters] = useState({
    crNumber: "",
    crDate: "",
    sector: "",
    status: "",
    proposal: "",
    cost: "",
    locality: "",
    latLong: "",
    priority: "",
  });

  // State to track which filter inputs are visible
  const [activeFilters, setActiveFilters] = useState({
    crNumber: false,
    crDate: false,
    sector: false,
    status: false,
    proposal: false,
    cost: false,
    locality: false,
    latLong: false,
    priority: false,
  });

  // Toggle filter input visibility
  const toggleFilter = (columnName) => {
    setActiveFilters(prev => ({
      ...prev,
      [columnName]: !prev[columnName]
    }));
  };

  const urlCache = useRef([]);

  useEffect(() => {
    const pending = forwardedSubmissions.filter(
      (s) => {
        const status = (s.status || "").trim();
        const section = (s.forwardedTo?.section || "").trim();
        
        // Exclude already processed tasks
        const isProcessed = ["Forwarded to CDMA", "CDMA Approved", "ENCPH Rejected"].includes(status);
        if (isProcessed) return false;
        
        // Match status or section to ENCPH
        const statusLower = status.toLowerCase();
        if (statusLower.includes("forwarded to encph")) return true;
        if (section.toLowerCase().includes("encph")) return true;
        if (statusLower.startsWith("forwarded to") && section.toLowerCase().includes("encph")) return true;
        return false;
      }
    );
    
    // Debug: Log files in pending submissions
    if (pending.length > 0) {
      console.log("🔍 ENCPH - Pending submissions count:", pending.length);
      pending.forEach((s, index) => {
        console.log(`🔍 ENCPH - Submission ${index + 1}:`, {
          id: s.id,
          status: s.status,
          hasCommitteeReport: !!s.committeeReport,
          hasCouncilResolution: !!s.councilResolution,
          committeeReportType: s.committeeReport ? (typeof s.committeeReport) : 'null',
          councilResolutionType: s.councilResolution ? (typeof s.councilResolution) : 'null',
          committeeReportValue: s.committeeReport ? (s.committeeReport.substring ? s.committeeReport.substring(0, 50) + '...' : 'not a string') : 'null',
          councilResolutionValue: s.councilResolution ? (s.councilResolution.substring ? s.councilResolution.substring(0, 50) + '...' : 'not a string') : 'null',
          allKeys: Object.keys(s).filter(k => k.includes('Report') || k.includes('Resolution') || k.includes('Image')),
        });
      });
    } else {
      console.log("🔍 ENCPH - No pending submissions");
    }
    
    setPendingList(pending);
    const approved = forwardedSubmissions.filter((s) => s.status === "Forwarded to CDMA" || s.status === "CDMA Approved");
    setApprovedList(approved);
    const rejected = forwardedSubmissions.filter((s) => s.status === "ENCPH Rejected");
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
          return status.includes("forwarded to encph") || section.includes("encph") || 
                 status.includes("forwarded to cdma") || status === "cdma approved" ||
                 status === "encph rejected";
        });
        break;
      case "forwarded":
        list = approvedList; // Forwarded to CDMA
        break;
      case "rejected":
        list = rejectedList;
        break;
      case "sentBackRejected":
        list = forwardedSubmissions.filter(s => s.status === "CDMA Rejected");
        break;
      case "noOfCrs":
        list = forwardedSubmissions.filter(s => {
          const status = (s.status || "").trim().toLowerCase();
          const section = (s.forwardedTo?.section || "").trim().toLowerCase();
          return status.includes("forwarded to encph") || section.includes("encph") || 
                 status.includes("forwarded to cdma") || status === "cdma approved" ||
                 status === "encph rejected";
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

  // Helper function to format locality display
  const formatLocality = (item) => {
    if (!item) return "";
    if (item.locality) return item.locality;
    if (item.area && item.wardNo) {
      const parts = [];
      if (item.area) parts.push(item.area);
      if (item.locality) parts.push(item.locality);
      if (item.wardNo) parts.push(`Ward No: ${item.wardNo}`);
      return parts.join(", ");
    }
    return item.locality || "-";
  };

  // Filter function to apply filters to list
  const applyFilters = (list) => {
    return list.filter((item) => {
      // CR Number filter
      if (filters.crNumber && !(item.crNumber || "").toLowerCase().includes(filters.crNumber.toLowerCase())) {
        return false;
      }
      // CR Date filter
      if (filters.crDate && !(item.crDate || "").toLowerCase().includes(filters.crDate.toLowerCase())) {
        return false;
      }
      // Sector filter
      if (filters.sector && item.sector !== filters.sector) {
        return false;
      }
      // Status filter
      if (filters.status && item.status !== filters.status) {
        return false;
      }
      // Proposal filter
      if (filters.proposal && !(item.proposal || "").toLowerCase().includes(filters.proposal.toLowerCase())) {
        return false;
      }
      // Cost filter
      if (filters.cost) {
        const costStr = fmtINR(item.cost || 0).toLowerCase();
        if (!costStr.includes(filters.cost.toLowerCase())) {
          return false;
        }
      }
      // Locality filter
      const localityStr = formatLocality(item).toLowerCase();
      if (filters.locality && !localityStr.includes(filters.locality.toLowerCase())) {
        return false;
      }
      // Lat/Long filter
      const latLongStr = (item.latlong || "").toLowerCase();
      if (filters.latLong && !latLongStr.includes(filters.latLong.toLowerCase())) {
        return false;
      }
      // Priority filter
      if (filters.priority && !(item.priority || "").toString().includes(filters.priority)) {
        return false;
      }
      return true;
    });
  };

  // Get unique sectors and statuses for filter dropdowns
  const getUniqueSectors = (list) => {
    const sectors = new Set();
    list.forEach(item => {
      if (item.sector) sectors.add(item.sector);
    });
    return Array.from(sectors).sort();
  };

  const getUniqueStatuses = (list) => {
    const statuses = new Set();
    list.forEach(item => {
      if (item.status) statuses.add(item.status);
    });
    return Array.from(statuses).sort();
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
    
    console.log("🔍 ENCPH openPreview - Original sub:", sub);
    console.log("🔍 ENCPH openPreview - Fresh sub from array:", freshSub);
    console.log("🔍 ENCPH openPreview - Files check:", {
      workImage: freshSub.workImage instanceof File,
      detailedReport: freshSub.detailedReport instanceof File,
      committeeReport: freshSub.committeeReport instanceof File,
      councilResolution: freshSub.councilResolution instanceof File,
      workImageExists: !!freshSub.workImage,
      detailedReportExists: !!freshSub.detailedReport,
      committeeReportExists: !!freshSub.committeeReport,
      councilResolutionExists: !!freshSub.councilResolution,
    });
    console.log("🔍 ENCPH openPreview - File Details:", {
      workImage: freshSub.workImage ? (freshSub.workImage instanceof File ? `File: ${freshSub.workImage.name}` : typeof freshSub.workImage) : 'null',
      detailedReport: freshSub.detailedReport ? (freshSub.detailedReport instanceof File ? `File: ${freshSub.detailedReport.name}` : typeof freshSub.detailedReport) : 'null',
      committeeReport: freshSub.committeeReport ? (freshSub.committeeReport instanceof File ? `File: ${freshSub.committeeReport.name}` : typeof freshSub.committeeReport) : 'null',
      councilResolution: freshSub.councilResolution ? (freshSub.councilResolution instanceof File ? `File: ${freshSub.councilResolution.name}` : typeof freshSub.councilResolution) : 'null',
    });
    console.log("🔍 ENCPH openPreview - Original sub Files:", {
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

  // --- Approve and Forward to CDMA ---
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
    
    // Validate that Verification Note is filled
    if (!approveRemarks || approveRemarks.trim() === "") {
      alert("Please enter Verification Note before approving.");
      return;
    }
    
    setForwardedSubmissions((prev) => {
      const currentSub = prev.find((f) => f.id === previewSubmission.id);
      return prev.map((f) =>
        f.id === previewSubmission.id
          ? {
              ...f,
              status: "Forwarded to CDMA",
              forwardedTo: {
                department: "Administration",
                section: "CDMA",
                remarks: approveRemarks,
              },
              remarks: approveRemarks,
              // Explicitly preserve all file properties - check multiple sources
              workImage: previewSubmission.workImage || f.workImage || currentSub?.workImage || null,
              detailedReport: previewSubmission.detailedReport || f.detailedReport || currentSub?.detailedReport || null,
              committeeReport: previewSubmission.committeeReport || f.committeeReport || currentSub?.committeeReport || null,
              councilResolution: previewSubmission.councilResolution || f.councilResolution || currentSub?.councilResolution || null,
            }
          : f
      );
    });
    // Close modal immediately
    setShowApprovePanel(false);
    setPreviewSubmission(null);
    setApproveRemarks("");
    
    // Show alert
    alert("Forwarded successfully!");
    
    // Set banner message
    setApproveBanner("✅ Successfully Approved and Forwarded to CDMA!");
    setTimeout(() => setApproveBanner(""), 5000);
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

    setForwardedSubmissions((prev) => {
      const currentSub = prev.find((f) => f.id === previewSubmission.id);
      return prev.map((f) =>
        f.id === previewSubmission.id
          ? { 
              ...f, 
              status: "ENCPH Rejected", 
              remarks: rejectRemarks, 
              rejectedBy: "ENCPH",
              // Explicitly preserve all file properties - check multiple sources
              workImage: previewSubmission.workImage || f.workImage || currentSub?.workImage || null,
              detailedReport: previewSubmission.detailedReport || f.detailedReport || currentSub?.detailedReport || null,
              committeeReport: previewSubmission.committeeReport || f.committeeReport || currentSub?.committeeReport || null,
              councilResolution: previewSubmission.councilResolution || f.councilResolution || currentSub?.councilResolution || null,
            }
          : f
      );
    });
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
    ["Forwarded to CDMA", "CDMA Approved", "ENCPH Rejected"].includes(status);

  const [selectedMenuItem, setSelectedMenuItem] = useState("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "reports", label: "Reports", icon: "📄" },
    { id: "gos", label: "GO's", icon: "📋" },
    { id: "circular", label: "Circular & Proceedings", icon: "📢" },
    { id: "guidelines", label: "Guidelines", icon: "📐" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 w-full bg-white shadow-md z-50 p-6 pb-0">
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
      
      <div className="flex items-start relative pt-20 overflow-x-hidden">
        <SidebarMenu
          menuItems={menuItems}
          selectedMenuItem={selectedMenuItem}
          onMenuItemSelect={setSelectedMenuItem}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
        />

        {/* Main Content Area */}
        <div className={`flex-1 p-6 pt-4 transition-all duration-300 min-w-0 ${isMenuOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="max-w-[95%] mx-auto">
            <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="font-semibold text-gray-700 mb-4">ENCPH Dashboard</h2>

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
                  return status.includes("forwarded to encph") || section.includes("encph") || 
                         status.includes("forwarded to cdma") || status === "cdma approved" ||
                         status === "encph rejected";
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
                {forwardedSubmissions.filter(s => s.status === "Forwarded to CDMA" || s.status === "CDMA Approved").length}
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

            {/* Sent back REJECTED LIST */}
            <div 
              onClick={() => setSelectedView("sentBackRejected")}
              className={`bg-orange-50 border border-orange-200 rounded-lg p-3 cursor-pointer hover:bg-orange-100 transition ${selectedView === "sentBackRejected" ? "ring-2 ring-orange-500" : ""}`}
            >
              <div className="text-xs text-orange-600 font-medium mb-1">Sent back REJECTED LIST</div>
              <div className="text-xl font-bold text-orange-700">
                {forwardedSubmissions.filter(s => s.status === "CDMA Rejected").length}
              </div>
            </div>
          </div>

          {/* banners */}
          {approveBanner && (
            <div className="mb-4 p-4 bg-green-500 text-white rounded-lg shadow-lg text-center font-semibold text-base animate-pulse">
              {approveBanner}
            </div>
          )}
          {saveBanner && (
            <div className="p-2 bg-blue-50 border border-blue-200 text-blue-700 rounded mb-2">
              {saveBanner}
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
            const filteredList = applyFilters(currentList);
            const viewTitle = getViewTitle(selectedView);
            const uniqueSectors = getUniqueSectors(currentList);
            const uniqueStatuses = getUniqueStatuses(currentList);
            
            return (
              <>
                <h3 className="text-sm text-gray-600 mb-4">{viewTitle}</h3>
                
                <div className="overflow-auto max-h-80">
                  <table className="min-w-full text-sm border-collapse border border-gray-300">
                    <thead className="bg-gray-100 border-b border-gray-300">
                      <tr>
                        <th className="p-2 text-left whitespace-nowrap text-xs">S.No</th>
                        <th className="p-2 text-left whitespace-nowrap text-xs">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <span>CR Number</span>
                              <button
                                onClick={() => toggleFilter('crNumber')}
                                className="text-xs"
                                title="Filter by CR Number"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="11" cy="11" r="8"></circle>
                                  <path d="m21 21-4.35-4.35"></path>
                                </svg>
                              </button>
                            </div>
                            {activeFilters.crNumber && (
                              <input
                                type="text"
                                value={filters.crNumber}
                                onChange={(e) => setFilters({ ...filters, crNumber: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full border p-0.5 rounded text-xs"
                                placeholder="Search..."
                                autoFocus
                              />
                            )}
                          </div>
                        </th>
                        <th className="p-2 text-left whitespace-nowrap text-xs">
                          <div className="flex items-center gap-1">
                            <span>CR Date</span>
                            <button
                              onClick={() => toggleFilter('crDate')}
                              className="text-xs "
                              title="Filter by CR Date"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="11" cy="11" r="8"></circle>
                                  <path d="m21 21-4.35-4.35"></path>
                                </svg>
                            </button>
                            {activeFilters.crDate && (
                              <input
                                type="text"
                                value={filters.crDate}
                                onChange={(e) => setFilters({ ...filters, crDate: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full border p-0.5 rounded text-xs"
                                placeholder="Search..."
                                autoFocus
                              />
                            )}
                          </div>
                        </th>
                        <th className="p-2 text-left whitespace-nowrap text-xs">
                          <div className="flex items-center gap-1">
                            <span>Sector</span>
                            <button
                              onClick={() => toggleFilter('sector')}
                              className="text-xs "
                              title="Filter by Sector"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="11" cy="11" r="8"></circle>
                                  <path d="m21 21-4.35-4.35"></path>
                                </svg>
                            </button>
                            {activeFilters.sector && (
                              <select
                                value={filters.sector}
                                onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full border p-0.5 rounded text-xs"
                                autoFocus
                              >
                                <option value="">All</option>
                                {uniqueSectors.map(sector => (
                                  <option key={sector} value={sector}>{sector}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </th>
                        <th className="p-2 text-left text-xs">
                          <div className="flex items-center gap-1">
                            <span>Proposal</span>
                            <button
                              onClick={() => toggleFilter('proposal')}
                              className="text-xs "
                              title="Filter by Proposal"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="11" cy="11" r="8"></circle>
                                  <path d="m21 21-4.35-4.35"></path>
                                </svg>
                            </button>
                            {activeFilters.proposal && (
                              <input
                                type="text"
                                value={filters.proposal}
                                onChange={(e) => setFilters({ ...filters, proposal: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full border p-0.5 rounded text-xs"
                                placeholder="Search..."
                                autoFocus
                              />
                            )}
                          </div>
                        </th>
                        <th className="p-2 text-left whitespace-nowrap text-xs">
                          <div className="flex items-center gap-1">
                            <span>Cost</span>
                            <button
                              onClick={() => toggleFilter('cost')}
                              className="text-xs "
                              title="Filter by Cost"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="11" cy="11" r="8"></circle>
                                  <path d="m21 21-4.35-4.35"></path>
                                </svg>
                            </button>
                            {activeFilters.cost && (
                              <input
                                type="text"
                                value={filters.cost}
                                onChange={(e) => setFilters({ ...filters, cost: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full border p-0.5 rounded text-xs"
                                placeholder="Search..."
                                autoFocus
                              />
                            )}
                          </div>
                        </th>
                        <th className="p-2 text-left whitespace-nowrap text-xs">
                          <div className="flex items-center gap-1">
                            <span>Locality</span>
                            <button
                              onClick={() => toggleFilter('locality')}
                              className="text-xs "
                              title="Filter by Locality"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="11" cy="11" r="8"></circle>
                                  <path d="m21 21-4.35-4.35"></path>
                                </svg>
                            </button>
                            {activeFilters.locality && (
                              <input
                                type="text"
                                value={filters.locality}
                                onChange={(e) => setFilters({ ...filters, locality: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full border p-0.5 rounded text-xs"
                                placeholder="Search..."
                                autoFocus
                              />
                            )}
                          </div>
                        </th>
                        <th className="p-2 text-left whitespace-nowrap text-xs">
                          <div className="flex items-center gap-1">
                            <span>Lat/Long</span>
                            <button
                              onClick={() => toggleFilter('latLong')}
                              className="text-xs "
                              title="Filter by Lat/Long"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="11" cy="11" r="8"></circle>
                                  <path d="m21 21-4.35-4.35"></path>
                                </svg>
                            </button>
                            {activeFilters.latLong && (
                              <input
                                type="text"
                                value={filters.latLong}
                                onChange={(e) => setFilters({ ...filters, latLong: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full border p-0.5 rounded text-xs"
                                placeholder="Search..."
                                autoFocus
                              />
                            )}
                          </div>
                        </th>
                        <th className="p-2 text-left whitespace-nowrap text-xs">
                          <div className="flex items-center gap-1">
                            <span>Priority</span>
                            <button
                              onClick={() => toggleFilter('priority')}
                              className="text-xs "
                              title="Filter by Priority"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="11" cy="11" r="8"></circle>
                                  <path d="m21 21-4.35-4.35"></path>
                                </svg>
                            </button>
                            {activeFilters.priority && (
                              <input
                                type="text"
                                value={filters.priority}
                                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full border p-0.5 rounded text-xs"
                                placeholder="Search..."
                                autoFocus
                              />
                            )}
                          </div>
                        </th>
                        <th className="p-2 text-left whitespace-nowrap text-xs">Work Image</th>
                        <th className="p-2 text-left whitespace-nowrap text-xs">Estimation Report</th>
                        <th className="p-2 text-left whitespace-nowrap text-xs">Committee Report</th>
                        <th className="p-2 text-left whitespace-nowrap text-xs">Council Resolution</th>
                        <th className="p-2 text-left whitespace-nowrap text-xs">
                          <div className="flex items-center gap-1">
                            <span>Status</span>
                            <button
                              onClick={() => toggleFilter('status')}
                              className="text-xs "
                              title="Filter by Status"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="11" cy="11" r="8"></circle>
                                  <path d="m21 21-4.35-4.35"></path>
                                </svg>
                            </button>
                            {activeFilters.status && (
                              <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full border p-0.5 rounded text-xs"
                                autoFocus
                              >
                                <option value="">All</option>
                                {uniqueStatuses.map(status => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                            )}
                            {(filters.crNumber || filters.crDate || filters.sector || filters.status || filters.proposal || filters.cost || filters.locality || filters.latLong || filters.priority) && (
                              <button
                                onClick={() => {
                                  setFilters({ crNumber: "", crDate: "", sector: "", status: "", proposal: "", cost: "", locality: "", latLong: "", priority: "" });
                                  setActiveFilters({ crNumber: false, crDate: false, sector: false, status: false, proposal: false, cost: false, locality: false, latLong: false, priority: false });
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 px-1 ml-1"
                                title="Clear Filters"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </th>
                          {selectedView === "pending" && <th className="p-2 text-left text-xs">Actions</th>}
                          {(selectedView === "rejected" || selectedView === "sentBackRejected") && <th className="p-2 text-left text-xs">Remarks</th>}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Show "No results found" message if filteredList is empty
                    if (filteredList.length === 0) {
                      const columnCount = selectedView === "pending" ? 16 : (selectedView === "rejected" || selectedView === "sentBackRejected") ? 16 : 15;
                      return (
                        <tr>
                          <td colSpan={columnCount} className="p-8 text-center text-gray-500 text-sm">
                            No results found. Please try different search criteria.
                          </td>
                        </tr>
                      );
                    }

                    if (selectedView === "noOfCrs") {
                      // Group by CR number for CR view
                      const groupedByCR = {};
                      filteredList.forEach((s) => {
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
                      
                      // If no groups found, show message
                      if (crGroups.length === 0) {
                        const columnCount = selectedView === "pending" ? 16 : (selectedView === "rejected" || selectedView === "sentBackRejected") ? 16 : 15;
                        return (
                          <tr>
                            <td colSpan={columnCount} className="p-8 text-center text-gray-500 text-sm">
                              No results found. Please try different search criteria.
                            </td>
                          </tr>
                        );
                      }
                      
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
                                      <FilePreview file={s.workImage} defaultName="work-image.jpg" />
                                    </td>
                                    <td className="p-2 text-xs align-top">
                                      {s.detailedReport ? (
                                        <FilePreview file={s.detailedReport} defaultName="estimation-report.pdf" />
                                      ) : (<span className="text-gray-400">No report</span>)}
                                    </td>
                                    <td className="p-2 text-xs align-top">
                                      {(() => {
                                        // Debug log for first item
                                        if (idxInGroup === 0 && globalSerial === 1) {
                                          console.log("🔍 ENCPH Table - Rendering files for submission:", {
                                            id: s.id,
                                            hasCommitteeReport: !!s.committeeReport,
                                            hasCouncilResolution: !!s.councilResolution,
                                            committeeReportType: s.committeeReport ? (typeof s.committeeReport) : 'null',
                                            councilResolutionType: s.councilResolution ? (typeof s.councilResolution) : 'null',
                                          });
                                        }
                                        return <FilePreview file={s.committeeReport} defaultName="committee-report.pdf" />;
                                      })()}
                                    </td>
                                    <td className="p-2 text-xs align-top">
                                      <FilePreview file={s.councilResolution} defaultName="council-resolution.pdf" />
                                    </td>
                                    <td className="p-2 text-xs align-top">{s.status || "Pending"}</td>
                                  </tr>
                                );
                              });
                            }).flat();
                          } else if (selectedView === "allWorks") {
                            // For allWorks view, show serial number for every row
                            return filteredList.map((s, i) => (
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
                                  <FilePreview file={s.workImage} defaultName="work-image.jpg" />
                                </td>
                                <td className="p-2 text-xs align-top">
                                  {s.detailedReport ? (
                                    <FilePreview file={s.detailedReport} defaultName="estimation-report.pdf" />
                                  ) : (<span className="text-gray-400">No report</span>)}
                                </td>
                                <td className="p-2 text-xs align-top">
                                  <FilePreview file={s.committeeReport} defaultName="committee-report.pdf" />
                                </td>
                                <td className="p-2 text-xs align-top">
                                  <FilePreview file={s.councilResolution} defaultName="council-resolution.pdf" />
                                </td>
                                <td className="p-2 text-xs align-top">{s.status || "Pending"}</td>
                              </tr>
                            ));
                          } else {
                            // For other views (pending, forwarded, rejected, sentBackRejected), show serial number for every row
                            return filteredList.map((s, i) => (
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
                                  <FilePreview file={s.workImage} defaultName="work-image.jpg" />
                                </td>
                                <td className="p-2 text-xs align-top">
                                  {s.detailedReport ? (
                                    <FilePreview file={s.detailedReport} defaultName="estimation-report.pdf" />
                                  ) : (<span className="text-gray-400">No report</span>)}
                                </td>
                                <td className="p-2 text-xs align-top">
                                  <FilePreview file={s.committeeReport} defaultName="committee-report.pdf" />
                                </td>
                                <td className="p-2 text-xs align-top">
                                  <FilePreview file={s.councilResolution} defaultName="council-resolution.pdf" />
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
                                          ["Forwarded to CDMA", "CDMA Approved"].includes(s.status)
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
                    Confirm Approval & Forward to CDMA
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
              <h4 className="font-semibold mb-2 text-sm">Rejected by ENCPH</h4>
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
                      <th className="p-2 text-left whitespace-nowrap text-xs">Committee Report</th>
                      <th className="p-2 text-left whitespace-nowrap text-xs">Council Resolution</th>
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
                          <FilePreview file={s.workImage} defaultName="work-image.jpg" />
                        </td>
                        <td className="p-2 text-xs">
                          <FilePreview file={s.detailedReport} defaultName="estimation-report.pdf" />
                        </td>
                        <td className="p-2 text-xs">
                          <FilePreview file={s.committeeReport} defaultName="committee-report.pdf" />
                        </td>
                        <td className="p-2 text-xs">
                          <FilePreview file={s.councilResolution} defaultName="council-resolution.pdf" />
                        </td>
                        <td className="p-2 text-xs text-red-700">Rejected by ENCPH</td>
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
