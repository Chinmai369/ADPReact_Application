import Header from "./Header";
import SidebarMenu from "./SidebarMenu";
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
  
  // Multiple selection states
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [bulkRejectRemarks, setBulkRejectRemarks] = useState("");
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false);
  const [bulkApproveRemarks, setBulkApproveRemarks] = useState("");
  const [approveRemarks, setApproveRemarks] = useState("");
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [showBulkForwardModal, setShowBulkForwardModal] = useState(false);
  const [bulkApprovedItems, setBulkApprovedItems] = useState([]);
  
  // View state for card-based navigation
  const [selectedView, setSelectedView] = useState("pending");

  // Menu state
  const [selectedMenuItem, setSelectedMenuItem] = useState("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "reports", label: "Reports", icon: "📄" },
    { id: "gos", label: "GO's", icon: "📋" },
    { id: "circular", label: "Circular & Proceedings", icon: "📢" },
    { id: "guidelines", label: "Guidelines", icon: "📐" },
  ];

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

  // Clear selection when view changes
  useEffect(() => {
    setSelectedItems([]);
  }, [selectedView]);

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

  // Calculate unique CR count using the same logic as the table
  const uniqueCRCount = useMemo(() => {
    // Use the same data source as getListForView("noOfCrs") - which returns forwardedSubmissions
    const crList = forwardedSubmissions;
    const groupedByCR = {};
    crList.forEach((s) => {
      const crKey = (s.crNumber || "").trim().toUpperCase() || "__NO_CR__";
      if (!groupedByCR[crKey]) {
        groupedByCR[crKey] = [];
      }
      groupedByCR[crKey].push(s);
    });
    // Exclude "__NO_CR__" from count (same as table logic)
    return Object.keys(groupedByCR).filter(key => key !== "__NO_CR__").length;
  }, [forwardedSubmissions]);

  // Helper function to get the list for selected view
  const getListForView = (view) => {
    let list = [];
    switch (view) {
      case "pending":
        list = pendingList;
        break;
      case "allWorks":
        list = forwardedSubmissions;
        break;
      case "approved":
        list = [...approvedList, ...forwardedList];
        break;
      case "forwarded":
        list = forwardedList;
        break;
      case "selfRejected":
        list = selfRejectedList;
        break;
      case "sentBackRejected":
        list = rejectedList;
        break;
      case "noOfCrs":
        list = forwardedSubmissions; // All works for CR view
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
        return "Pending / Approval Tasks";
      case "allWorks":
        return "All Works";
      case "approved":
        return "Approved & Forwarded Tasks";
      case "forwarded":
        return "Forwarded Tasks";
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

  // --- Multiple Selection Functions ---
  const handleSelectItem = (itemId) => {
    setSelectedItems((prev) => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    const currentList = getListForView(selectedView);
    const eligibleItems = currentList.filter(s => {
      const isCommissionerRejected = s.status === "Rejected" && 
        (!s.rejectedBy || s.rejectedBy === "Commissioner" || s.rejectedBy === user?.username);
      return !isActionDisabled(s.status) || isCommissionerRejected;
    }).map(s => s.id);
    
    if (selectedItems.length === eligibleItems.length && eligibleItems.length > 0) {
      setSelectedItems([]);
    } else {
      setSelectedItems(eligibleItems);
    }
  };

  const handleBulkApprove = () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one item to approve.");
      return;
    }

    // Open approval remarks modal
    setShowBulkApproveModal(true);
    setBulkApproveRemarks("");
  };

  const confirmBulkApprove = () => {
    const count = selectedItems.length;

    // First, approve the items
    setForwardedSubmissions((prev) => {
      return prev.map((f) => {
        if (selectedItems.includes(f.id)) {
          return { ...f, status: "Approved", remarks: bulkApproveRemarks || "" };
        }
        return f;
      });
    });

    // Store the approved item IDs for forwarding
    setBulkApprovedItems([...selectedItems]);
    setSelectedItems([]);
    
    // Close approval modal
    setShowBulkApproveModal(false);
    setBulkApproveRemarks("");
    
    // Open forwarding modal
    setShowBulkForwardModal(true);
    setDept("");
    setSection("");
    setForwardRemarks("");
  };

  const handleBulkReject = () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one item to reject.");
      return;
    }

    setShowBulkRejectModal(true);
  };

  const confirmBulkReject = () => {
    if (!bulkRejectRemarks) {
      alert("Please enter remarks before rejecting.");
      return;
    }

    const count = selectedItems.length;

    setForwardedSubmissions((prev) => {
      return prev.map((f) => {
        if (selectedItems.includes(f.id)) {
          return { 
            ...f, 
            status: "Rejected", 
            remarks: bulkRejectRemarks, 
            rejectedBy: "Commissioner" 
          };
        }
        return f;
      });
    });

    setSelectedItems([]);
    setBulkRejectRemarks("");
    setShowBulkRejectModal(false);
    setRejectBanner(`${count} work(s) rejected successfully.`);
    setTimeout(() => setRejectBanner(""), 3000);
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
      
      console.log("✅ Commissioner forwarded - Final submission details:", {
        id: forwardedSub?.id,
        status: forwardedSub?.status,
        forwardedTo: forwardedSub?.forwardedTo,
        section: forwardedSub?.forwardedTo?.section,
        department: forwardedSub?.forwardedTo?.department,
        willAppearInEEPH: forwardedSub?.status?.toLowerCase().includes("forwarded to eeph") || 
                         forwardedSub?.forwardedTo?.section?.toLowerCase() === "eeph"
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

    // Close modal immediately
      setShowForwardPanel(false);
    setShowApprovePanel(false);
    setApprovalConfirmed(false);
      setPreviewSubmission(null);
      setDept("");
      setSection("");
      setForwardRemarks("");
    setApproveRemarks("");
    
    // Show alert
    alert("Forwarded successfully!");
    
    // Set banner message
    setForwardSuccess(`✅ Successfully Forwarded to ${section}!`);
    setTimeout(() => {
      setForwardSuccess("");
    }, 5000);
  };

  // --- Bulk Forward ---
  const forwardBulkApprovedToDept = () => {
    if (!dept || !section || bulkApprovedItems.length === 0) {
      alert("Select department and section");
      return;
    }

    const newStatus = `Forwarded to ${section}`;
    const count = bulkApprovedItems.length;

    setForwardedSubmissions((prev) => {
      return prev.map((f) => {
        if (bulkApprovedItems.includes(f.id)) {
          return {
            ...f,
            forwardedTo: {
              department: dept,
              section,
              remarks: forwardRemarks,
            },
            status: newStatus,
          };
        }
        return f;
      });
    });

    // Close modal and clear state
    setShowBulkForwardModal(false);
    setBulkApprovedItems([]);
    setDept("");
    setSection("");
    setForwardRemarks("");
    
    // Show alert
    alert("Forwarded successfully!");
    
    // Set banner message
    setForwardSuccess(`✅ Successfully Forwarded ${count} work(s) to ${section}!`);
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
    status === "Approved" ||
    status?.startsWith("Forwarded to");

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
          <h2 className="font-semibold text-gray-700 mb-4">
            Commissioner Dashboard
          </h2>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {/* No. of CR's */}
            <div 
              onClick={() => setSelectedView("noOfCrs")}
              className={`bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-pointer hover:bg-blue-100 transition ${selectedView === "noOfCrs" ? "ring-2 ring-blue-500" : ""}`}
            >
              <div className="text-xs text-blue-600 font-medium mb-1">No. of CR's</div>
              <div className="text-xl font-bold text-blue-700">
                {uniqueCRCount}
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
            const filteredList = applyFilters(currentList);
            const showActions = selectedView === "pending";
            const uniqueSectors = getUniqueSectors(currentList);
            const uniqueStatuses = getUniqueStatuses(currentList);
            
            return (
              <>
          <h3 className="text-sm text-gray-600 mb-4">
                  {getViewTitle(selectedView)}
          </h3>
                
                {/* Bulk Action Buttons */}
                {showActions && filteredList.length > 0 && (
                  <div className="mb-3 flex gap-2 items-center">
                    <button
                      onClick={handleBulkApprove}
                      disabled={selectedItems.length === 0}
                      className={`px-4 py-2 text-xs rounded ${
                        selectedItems.length === 0
                          ? "bg-gray-300 cursor-not-allowed text-gray-500"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      Approve Selected ({selectedItems.length})
                    </button>
                    <button
                      onClick={handleBulkReject}
                      disabled={selectedItems.length === 0}
                      className={`px-4 py-2 text-xs rounded ${
                        selectedItems.length === 0
                          ? "bg-gray-300 cursor-not-allowed text-gray-500"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                    >
                      Reject Selected ({selectedItems.length})
                    </button>
                    {selectedItems.length > 0 && (
                      <button
                        onClick={() => setSelectedItems([])}
                        className="px-3 py-2 text-xs rounded bg-gray-400 text-white hover:bg-gray-500"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>
                )}

                <div className="overflow-auto max-h-80">
              <table className="min-w-full text-sm border-collapse border border-gray-300">
                <thead className="bg-gray-100 border-b border-gray-300">
  <tr>
                          {showActions && (
                            <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">
                              <input
                                type="checkbox"
                                checked={(() => {
                                  const eligibleItems = filteredList.filter(s => {
                                    const isCommissionerRejected = s.status === "Rejected" && 
                                      (!s.rejectedBy || s.rejectedBy === "Commissioner" || s.rejectedBy === user?.username);
                                    return !isActionDisabled(s.status) || isCommissionerRejected;
                                  }).map(s => s.id);
                                  return eligibleItems.length > 0 && eligibleItems.every(id => selectedItems.includes(id));
                                })()}
                                onChange={handleSelectAll}
                                className="cursor-pointer"
                              />
                            </th>
                          )}
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">S.No</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">
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
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span>CR Date</span>
                                <button
                                  onClick={() => toggleFilter('crDate')}
                                  className="text-xs"
                                  title="Filter by CR Date"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                  </svg>
                                </button>
                              </div>
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
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span>Sector</span>
                                <button
                                  onClick={() => toggleFilter('sector')}
                                  className="text-xs"
                                  title="Filter by Sector"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                  </svg>
                                </button>
                              </div>
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
                          <th className="p-2 text-left text-xs border-r border-gray-300">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span>Proposal</span>
                                <button
                                  onClick={() => toggleFilter('proposal')}
                                  className="text-xs"
                                  title="Filter by Proposal"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                  </svg>
                                </button>
                              </div>
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
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span>Cost</span>
                                <button
                                  onClick={() => toggleFilter('cost')}
                                  className="text-xs"
                                  title="Filter by Cost"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                  </svg>
                                </button>
                              </div>
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
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span>Locality</span>
                                <button
                                  onClick={() => toggleFilter('locality')}
                                  className="text-xs"
                                  title="Filter by Locality"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                  </svg>
                                </button>
                              </div>
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
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span>Lat/Long</span>
                                <button
                                  onClick={() => toggleFilter('latLong')}
                                  className="text-xs"
                                  title="Filter by Lat/Long"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                  </svg>
                                </button>
                              </div>
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
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span>Priority</span>
                                <button
                                  onClick={() => toggleFilter('priority')}
                                  className="text-xs"
                                  title="Filter by Priority"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                  </svg>
                                </button>
                              </div>
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
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">Work Image</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">Estimation Report</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">Committee Report</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">Council Resolution</th>
                          <th className="p-2 text-left whitespace-nowrap text-xs border-r border-gray-300">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span>Status</span>
                                <button
                                  onClick={() => toggleFilter('status')}
                                  className="text-xs"
                                  title="Filter by Status"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                  </svg>
                                </button>
                                {(filters.crNumber || filters.crDate || filters.sector || filters.status || filters.proposal || filters.cost || filters.locality || filters.latLong || filters.priority) && (
                                  <button
                                    onClick={() => {
                                      setFilters({ crNumber: "", crDate: "", sector: "", status: "", proposal: "", cost: "", locality: "", latLong: "", priority: "" });
                                      setActiveFilters({ crNumber: false, crDate: false, sector: false, status: false, proposal: false, cost: false, locality: false, latLong: false, priority: false });
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 px-1"
                                    title="Clear Filters"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
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
                            </div>
                          </th>
                          {showActions && <th className="p-2 text-left border-r border-gray-300">Actions</th>}
                          {!showActions && (selectedView === "selfRejected" || selectedView === "sentBackRejected") && (
                            <th className="p-2 text-left text-xs">Remarks</th>
                          )}
                        </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Show "No results found" message if filteredList is empty
                    if (filteredList.length === 0) {
                      const columnCount = showActions ? 16 : (selectedView === "selfRejected" || selectedView === "sentBackRejected") ? 16 : 15;
                      return (
                        <tr>
                          <td colSpan={columnCount} className="p-8 text-center text-gray-500 text-sm">
                            No results found. Please try different search criteria.
                          </td>
                        </tr>
                      );
                    }

                    // Views that should show serial number for every row: allWorks, pending, forwarded, selfRejected, sentBackRejected
                    const viewsWithSerialNumbers = ["allWorks", "pending", "forwarded", "selfRejected", "sentBackRejected"];
                    
                    if (viewsWithSerialNumbers.includes(selectedView)) {
                            return filteredList.map((s, i) => {
                              const isCommissionerRejected = s.status === "Rejected" && 
                                (!s.rejectedBy || s.rejectedBy === "Commissioner" || s.rejectedBy === user?.username);
                              const canSelect = !isActionDisabled(s.status) || isCommissionerRejected;
                              return (
                                <tr key={s.id} className="border-b border-gray-300 hover:bg-gray-50">
                                  {showActions && (
                                    <td className="p-2 text-xs align-top">
                                      <input
                                        type="checkbox"
                                        checked={selectedItems.includes(s.id)}
                                        onChange={() => handleSelectItem(s.id)}
                                        disabled={!canSelect}
                                        className="cursor-pointer"
                                      />
                                    </td>
                                  )}
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
                                    ) : null}
                                  </td>
                                  <td className="p-2 text-xs align-top">
                                    <FilePreview file={s.committeeReport} defaultName="committee-report.pdf" />
                                  </td>
                                  <td className="p-2 text-xs align-top">
                                    <FilePreview file={s.councilResolution} defaultName="council-resolution.pdf" />
                                  </td>
                                  <td className="p-2 text-xs align-top">
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
                                    <td className="p-2 text-xs text-gray-600 max-w-xs truncate align-top" title={s.remarks || "-"}>{s.remarks || "-"}</td>
                                  )}
                                </tr>
                              );
                            });
                          }
                          
                          // For other views (like "noOfCrs", "approved"), group by CR number (case-insensitive, trimmed)
                          const groupedByCR = {};
                          filteredList.forEach((s) => {
                            const crKey = (s.crNumber || "").trim().toUpperCase() || "__NO_CR__";
                            if (!groupedByCR[crKey]) {
                              groupedByCR[crKey] = [];
                            }
                            groupedByCR[crKey].push(s);
                          });
                          
                          // Filter out groups with __NO_CR__ key (same as card count logic)
                          const crGroups = Object.values(groupedByCR).filter(group => {
                            const firstItem = group[0];
                            const crKey = (firstItem.crNumber || "").trim().toUpperCase() || "__NO_CR__";
                            return crKey !== "__NO_CR__";
                          });
                          
                          // If no groups found, show message
                          if (crGroups.length === 0) {
                            const columnCount = showActions ? 16 : (selectedView === "selfRejected" || selectedView === "sentBackRejected") ? 16 : 15;
                            return (
                              <tr>
                                <td colSpan={columnCount} className="p-8 text-center text-gray-500 text-sm">
                                  No results found. Please try different search criteria.
                                </td>
                              </tr>
                            );
                          }
                          
                          let globalSerial = 0;
                          
                          return crGroups.map((group, groupIdx) => {
                            return group.map((s, idxInGroup) => {
                              const isFirstInGroup = idxInGroup === 0;
                              if (isFirstInGroup) globalSerial++;
                              const isCommissionerRejected = s.status === "Rejected" && 
                                (!s.rejectedBy || s.rejectedBy === "Commissioner" || s.rejectedBy === user?.username);
                              const canSelect = !isActionDisabled(s.status) || isCommissionerRejected;
                              return (
                                <tr key={s.id} className="border-b border-gray-300 hover:bg-gray-50">
                                  {showActions && (
                                    <td className="p-2 text-xs align-top">
                                      <input
                                        type="checkbox"
                                        checked={selectedItems.includes(s.id)}
                                        onChange={() => handleSelectItem(s.id)}
                                        disabled={!canSelect}
                                        className="cursor-pointer"
                                      />
                                    </td>
                                  )}
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
                                    ) : null}
                                  </td>
                                  <td className="p-2 text-xs align-top">
                                    <FilePreview file={s.committeeReport} defaultName="committee-report.pdf" />
                                  </td>
                                  <td className="p-2 text-xs align-top">
                                    <FilePreview file={s.councilResolution} defaultName="council-resolution.pdf" />
                                  </td>
                                  <td className="p-2 text-xs align-top">
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
                                    <td className="p-2 text-xs text-gray-600 max-w-xs truncate align-top" title={s.remarks || "-"}>{s.remarks || "-"}</td>
                                  )}
                    </tr>
                              );
                            });
                          }).flat();
                        })()}
                </tbody>
              </table>
            </div>
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

          {/* Bulk Approve Modal */}
          {showBulkApproveModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
              <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-lg">Approve {selectedItems.length} Selected Work(s)</h4>
                  <button
                    onClick={() => {
                      setShowBulkApproveModal(false);
                      setBulkApproveRemarks("");
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    ✕
                  </button>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">You are about to approve {selectedItems.length} work(s).</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Remarks (Optional)</label>
                  <textarea
                    className="w-full border p-3 rounded mt-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows={6}
                    value={bulkApproveRemarks}
                    onChange={(e) => setBulkApproveRemarks(e.target.value)}
                    placeholder="Enter remarks for approval (optional)..."
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowBulkApproveModal(false);
                      setBulkApproveRemarks("");
                    }}
                    className="px-5 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmBulkApprove}
                    className="px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Confirm Approval
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Reject Modal */}
          {showBulkRejectModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
              <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-lg">Reject {selectedItems.length} Selected Work(s)</h4>
                  <button
                    onClick={() => {
                      setShowBulkRejectModal(false);
                      setBulkRejectRemarks("");
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    ✕
                  </button>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">You are about to reject {selectedItems.length} work(s).</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Remarks (Required)</label>
                  <textarea
                    className="w-full border p-3 rounded mt-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={6}
                    value={bulkRejectRemarks}
                    onChange={(e) => setBulkRejectRemarks(e.target.value)}
                    placeholder="Please enter reason for rejection (will be applied to all selected items)..."
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowBulkRejectModal(false);
                      setBulkRejectRemarks("");
                    }}
                    className="px-5 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmBulkReject}
                    className="px-5 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Submit Rejection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Forward Modal */}
          {showBulkForwardModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
              <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6 overflow-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-lg">Forward {bulkApprovedItems.length} Approved Work(s) to Department</h4>
                  <button
                    onClick={() => {
                      setShowBulkForwardModal(false);
                      setBulkApprovedItems([]);
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
                  <p className="text-sm text-gray-600 mb-2">You are about to forward {bulkApprovedItems.length} approved work(s).</p>
                </div>
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
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowBulkForwardModal(false);
                      setBulkApprovedItems([]);
                      setDept("");
                      setSection("");
                      setForwardRemarks("");
                    }}
                    className="px-5 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={forwardBulkApprovedToDept}
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
              </div>
            </div>
          )}

            </div>
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
                    {(() => {
                      const imageFile = editable.workImage || previewSubmission.workImage;
                      const imageUrl = getFileUrl(imageFile);
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
                            📄 View Current Report ({reportFile instanceof File ? reportFile.name : 'file'})
                        </a>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 mb-2">No report attached</div>
                      );
                    })()}
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
                            📄 View Current Report ({reportFile instanceof File ? reportFile.name : 'file'})
                        </a>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 mb-2">No report attached</div>
                      );
                    })()}
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
                            📄 View Current Report ({reportFile instanceof File ? reportFile.name : 'file'})
                        </a>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 mb-2">No report attached</div>
                      );
                    })()}
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
    </div>
  );
}
