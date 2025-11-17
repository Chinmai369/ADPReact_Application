import Header from "./Header";
import React, { useEffect, useMemo, useRef, useState } from "react";
import SidebarMenu from "./SidebarMenu";
import { useLocation as useRouterLocation, useNavigate } from "react-router-dom";

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
const FilePreview = ({ file, defaultName = "document.pdf", onClick }) => {
  const [imageError, setImageError] = React.useState(false);
  
  if (!file) {
    return <span className="text-gray-400 text-xs">No file</span>;
  }
  
  const fileInfo = getFileInfo(file, defaultName);
  const fileUrl = getFileUrl(file);
  const isImage = isImageFile(file) && !imageError;
  
  const handleClick = (e) => {
    e.preventDefault();
    if (fileUrl && onClick) {
      onClick(fileUrl);
    } else if (fileUrl) {
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
  const [area, setArea] = useState("");
  const [locality, setLocality] = useState("");
  const [wardNo, setWardNo] = useState("");
  const [latlong, setLatlong] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [costError, setCostError] = useState("");
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

  // Calculate total cost of current submissions in this CR
  const calculateCurrentCRTotal = useMemo(() => {
    if (!activeCR) return 0;
    return submissions.reduce((total, sub) => {
      return total + (sub.crNumber === activeCR.crNumber ? (Number(sub.cost) || 0) : 0);
    }, 0);
  }, [submissions, activeCR]);

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

  // Image zoom modal state
  const [zoomedImage, setZoomedImage] = useState(null);

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

  // Helper: reset the form (optionally keep numberOfWorks when activeCR present)
  function resetForm(keepNumberOfWorks = false) {
    setWorkType("");
    setProposalName("");
    setArea("");
    setLocality("");
    setWardNo("");
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
    setCostError("");
    
    if (!isSelectionReady) {
      setFormError("Please choose Year, Installment, Grant Type and Program.");
      return;
    }
    
    const requiredFields = { workType, proposalName, area, locality, wardNo, estimatedCost, prioritization };
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
      
    if (missingFields.length > 0) {
      setFormError(`Please fill all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    const submissionCost = Number(estimatedCost);
    if (submissionCost > remainingBudget) {
      setCostError(`Amount exceeds remaining budget of ₹${remainingBudget.toLocaleString('en-IN')}`);
      return;
    }

    const newSub = {
      id: Date.now() + Math.random(),
      sector: workType,
      proposal: proposalName,
      locality: locality,
      latlong,
      cost: Number(estimatedCost),
      priority: Number(prioritization),
      crNumber: crStatus === "CR" ? crNumber : "",
      crDate: crStatus === "CR" ? crDate : "",
      workImage,
      detailedReport,
      area: area,
      wardNo: wardNo,
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
    setProposalName(s.proposal || "");
    
    // If submission has separate area and wardNo, use them
    if (s.area && s.wardNo) {
      setArea(s.area);
      setLocality(s.locality || "");
      setWardNo(s.wardNo);
    } else {
      // Try to parse from proposal field (backward compatibility)
      // Format: "area - locality - Ward No: wardNo"
      const proposalMatch = (s.proposal || "").match(/^(.+?)\s*-\s*(.+?)\s*-\s*Ward No:\s*(.+)$/);
      if (proposalMatch) {
        setArea(proposalMatch[1].trim());
        setLocality(proposalMatch[2].trim());
        setWardNo(proposalMatch[3].trim());
      } else {
        // Fallback: use proposal as proposalName, locality as is, area and wardNo empty
        setArea("");
        setLocality(s.locality || "");
        setWardNo("");
      }
    }
    
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
        const costStr = fmtINR(Math.round(item.cost || 0)).toLowerCase();
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

  // Helper function to format locality display (Area, Locality, Ward No)
  const formatLocality = (item) => {
    const parts = [];
    if (item.area) parts.push(item.area);
    if (item.locality) parts.push(item.locality);
    if (item.wardNo) parts.push(`Ward No: ${item.wardNo}`);
    return parts.length > 0 ? parts.join(", ") : (item.locality || "-");
  };

  // Helper function to check if latlong is a URL
  const isUrl = (str) => {
    if (!str) return false;
    return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('www.') || str.includes('maps.google') || str.includes('goo.gl/maps') || str.includes('maps.app.goo.gl');
  };

  // Helper function to convert coordinates to Google Maps URL
  const convertCoordinatesToGoogleMapsUrl = (latlong) => {
    if (!latlong) return null;
    // Try to match coordinates (e.g., "17.3850, 78.4867" or "17.3850,78.4867")
    const coordMatch = latlong.trim().match(/^([-+]?[0-9]*\.?[0-9]+)\s*,\s*([-+]?[0-9]*\.?[0-9]+)$/);
    if (coordMatch) {
      const lat = coordMatch[1].trim();
      const lng = coordMatch[2].trim();
      return `https://www.google.com/maps?q=${lat},${lng}`;
    }
    return null;
  };

  // Helper function to format latlong URL for Google Maps
  const formatLatlongUrl = (latlong) => {
    if (!latlong) return null;
    
    // Check if it's already a URL
    if (isUrl(latlong)) {
      const url = latlong.startsWith('http') ? latlong : `https://${latlong}`;
      // Ensure it's a Google Maps URL - if it's a Google Maps URL, return as is
      if (url.includes('maps.google') || url.includes('goo.gl/maps') || url.includes('maps.app.goo.gl')) {
        return url;
      }
      // If it's another URL, return as is (might be a different mapping service)
      return url;
    }
    
    // Try to convert coordinates to Google Maps URL
    const googleMapsUrl = convertCoordinatesToGoogleMapsUrl(latlong);
    if (googleMapsUrl) {
      return googleMapsUrl;
    }
    
    // If it's not a URL or coordinates, return null (will be displayed as text)
    return null;
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
        locality: locality,
        latlong,
        cost: Number(estimatedCost),
        priority: Number(prioritization),
        crNumber: crStatus === "CR" ? crNumber : "",
        crDate: crStatus === "CR" ? crDate : "",
        workImage,
        detailedReport,
        area: area,
        wardNo: wardNo,
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
  
    // CLEAR ALL FORM DATA (but keep form visible)
    // IMPORTANT: Clear in correct order to prevent useEffect from repopulating
    setSubmissions([]);
    setSelection({ year: "", installment: "", grantType: "", program: "" });
    setWorkType("");
    setProposalName("");
    setArea("");
    setLocality("");
    setWardNo("");
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
    setSuccessMsg("Forwarded to Commissioner!");
  
    // Clear message after 5 seconds
    setTimeout(() => setSuccessMsg(""), 5000);
  }
  

  // UI helpers for disabled state
  const disableCRFields = Boolean(activeCR); // lock CR fields when activeCR exists
  const submittedCount = submissions.length + (activeCR ? activeCR.submittedCount : 0);

  const [selectedMenuItem, setSelectedMenuItem] = useState("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "" },
    { id: "reports", label: "Reports", icon: "" },
    { id: "gos", label: "GO's", icon: "" },
    { id: "circular", label: "Circular & Proceedings", icon: "" },
    { id: "guidelines", label: "Guidelines", icon: "" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <img 
              src={zoomedImage} 
              alt="Zoomed" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-200 text-gray-800 font-bold text-xl w-10 h-10 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 w-full bg-white shadow-md z-50 p-6 pb-0">
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

        {/* Create New ADP Heading */}
        <h2 className="text-xl font-bold mb-4 text-gray-800">Create New ADP</h2>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-6 border mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600 font-medium">Filters</div>
            <div />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Year <span className="text-red-500">*</span></label>
              <select
                value={selection.year}
                onChange={(e) => {
                  setSelection({ ...selection, year: e.target.value });
                }}
                className="border p-2 rounded w-full"
              >
                <option value="">Select year</option>
                <option>2021-22</option>
                <option>2022-23</option>
                <option>2023-24</option>
                <option>2024-25</option>
                <option>2025-26</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Installment <span className="text-red-500">*</span></label>
              <select
                value={selection.installment}
                onChange={(e) => setSelection({ ...selection, installment: e.target.value })}
                disabled={!selection.year}
                className="border p-2 rounded w-full"
              >
                <option value="">Select installment</option>
                <option>First Installment</option>
                <option>Second Installment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Grant Type <span className="text-red-500">*</span></label>
              <select
                value={selection.grantType}
                onChange={(e) => setSelection({ ...selection, grantType: e.target.value })}
                disabled={!selection.installment}
                className="border p-2 rounded w-full"
              >
                <option value="">Select grant type</option>
                <option>Untied Grant</option>
                <option>Tied Grant</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Program <span className="text-red-500">*</span></label>
              <select
                value={selection.program}
                onChange={(e) => setSelection({ ...selection, program: e.target.value })}
                disabled={!selection.grantType}
                className="border p-2 rounded w-full"
              >
                <option value="">Select program</option>
                <option>ADP</option>
                <option>RADP</option>
              </select>
            </div>
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
                      <label className="block text-sm text-gray-600">CR Number <span className="text-red-500">*</span></label>
                      <input
                        value={crNumber}
                        onChange={(e) => setCrNumber(e.target.value)}
                        disabled={submissions.length > 0}
                        className="mt-1 w-full border p-2 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600">CR Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        value={crDate}
                        onChange={(e) => setCrDate(e.target.value)}
                        disabled={submissions.length > 0}
                        max={new Date().toISOString().split('T')[0]}
                        className="mt-1 w-full border p-2 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600">Number of Works <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={numberOfWorks}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Only allow numbers
                          if (value === '' || /^\d+$/.test(value)) {
                            setNumberOfWorks(value);
                          }
                        }}
                        disabled={submissions.length > 0}
                        className={`mt-1 w-full border p-2 rounded ${submittedCount < Number(numberOfWorks || 0) && numberOfWorks ? "border-red-500 bg-red-50" : ""}`}
                        placeholder="Enter number"
                      />
                      {activeCR && (
                        <div className="text-xs text-gray-500 mt-1">Active CR: {activeCR.submittedCount}/{activeCR.targetCount} submitted</div>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm text-gray-600">Name of the Sector <span className="text-red-500">*</span></label>
                  <select value={workType} onChange={(e) => setWorkType(e.target.value)} className="mt-1 w-full border p-2 rounded">
                    <option value="">Select type of work</option>
                    <option>SWM/LQM</option>
                    <option>Water Supply</option>
                    <option>UGD Drains</option>
                    <option>CC Drains</option>
                    <option>CC Roads</option>
                    <option>BT Roads</option>
                    <option>Construction of Slaughter Houses</option>
                    <option>Development of Parks</option>
                    <option>Protection of Open Spaces</option>
                    <option>Burial grounds & Crematoriums</option>
                    <option>Repairs to Municipal Schools</option>
                    <option>Urban Health Clinics</option>
                    <option>Greenery</option>
                    <option>Street Lighting</option>
                    <option>CC Charges</option>
                    <option>EESL Dues</option>
                    <option>ABC & ARV Activities</option>
                    <option>Solar Panels</option>
                    <option>CB</option>
                    <option>IEC</option>

                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-2">Name of the work <span className="text-red-500">*</span></label>
                  <input
                    value={proposalName}
                    onChange={(e) => setProposalName(e.target.value)}
                    className="w-full border p-2 rounded mb-3"
                    placeholder="Enter name of the work"
                  />
                  <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1 font-medium">1. Area <span className="text-red-500">*</span></label>
                        <input 
                          value={area} 
                          onChange={(e) => setArea(e.target.value)} 
                          className="w-full border border-gray-300 p-2 rounded bg-white" 
                          placeholder="Enter area"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1 font-medium">2. Locality <span className="text-red-500">*</span></label>
                        <input 
                          value={locality} 
                          onChange={(e) => setLocality(e.target.value)} 
                          className="w-full border border-gray-300 p-2 rounded bg-white" 
                          placeholder="Enter locality"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1 font-medium">3. Ward No <span className="text-red-500">*</span></label>
                        <input 
                          type="text"
                          value={wardNo} 
                          onChange={(e) => {
                            const value = e.target.value;
                            // Only allow numbers and maximum 3 digits
                            if (value === '' || /^\d{1,3}$/.test(value)) {
                              setWardNo(value);
                            }
                          }} 
                          maxLength={3}
                          className="w-full border border-gray-300 p-2 rounded bg-white" 
                          placeholder="Enter ward number"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600">Latitude/Longitude or Google Maps URL</label>
                  <div className="mt-1 relative">
                    {latlong && formatLatlongUrl(latlong) ? (
                      <div 
                        className="w-full border p-2 rounded bg-white min-h-[3rem] flex items-center cursor-pointer hover:bg-blue-50"
                        onClick={() => window.open(formatLatlongUrl(latlong), '_blank', 'noopener,noreferrer')}
                      >
                        <a 
                          href={formatLatlongUrl(latlong)}
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue-600 hover:underline flex-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {latlong}
                        </a>
                        <span className="text-xs text-gray-500 ml-2">(Click to open in Google Maps)</span>
                      </div>
                    ) : (
                      <textarea 
                        value={latlong} 
                        onChange={(e) => setLatlong(e.target.value)} 
                        className="w-full border p-2 rounded" 
                        placeholder="Enter coordinates (e.g., 17.3850, 78.4867) or Google Maps URL (e.g., https://maps.google.com/...)"
                        rows={2}
                      />
                    )}
                    {latlong && formatLatlongUrl(latlong) && (
                      <button
                        onClick={() => setLatlong("")}
                        className="absolute top-2 right-2 text-xs text-gray-500 hover:text-gray-700"
                        title="Clear and edit"
                      >
                        ✕ Edit
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <label className="block text-sm text-gray-600">Estimated Cost (₹) <span className="text-red-500">*</span></label>
                    <span className="text-xs text-gray-500">
                      {activeCR ? (
                        <>Remaining (CR {activeCR.crNumber}): ₹{(remainingBudget - calculateCurrentCRTotal).toLocaleString('en-IN')}</>
                      ) : (
                        <>Remaining: ₹{remainingBudget.toLocaleString('en-IN')}</>
                      )}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={estimatedCost}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow numbers
                      if (value === '' || /^\d+$/.test(value)) {
                        const numValue = Number(value) || 0;
                        const currentCRTotal = activeCR ? calculateCurrentCRTotal : 0;
                        const remainingForCR = remainingBudget - currentCRTotal;
                        
                        setEstimatedCost(value);
                        
                        if (numValue > remainingForCR) {
                          setCostError(`Amount exceeds remaining budget of ₹${remainingForCR.toLocaleString('en-IN')}${activeCR ? ' for this CR' : ''}`);
                        } else {
                          setCostError('');
                        }
                      }
                    }}
                    className={`mt-1 w-full border p-2 rounded ${costError ? 'border-red-500' : ''}`}
                    placeholder="Enter amount"
                  />
                  {costError && <p className="mt-1 text-sm text-red-600">{costError}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-600">Prioritization <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={prioritization} 
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow numbers
                      if (value === '' || /^\d+$/.test(value)) {
                        setPrioritization(value);
                      }
                    }} 
                    className="mt-1 w-full border p-2 rounded" 
                    placeholder="Enter priority number"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">Upload work Image (.jpg, .png, etc.)</label>
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
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file && !file.type.startsWith('image/')) {
                        setFormError("Work Image must be an image file.");
                        e.target.value = ''; // Clear the input
                        setWorkImage(null);
                        return;
                      }
                      setWorkImage(file);
                      setFormError(""); // Clear any previous errors
                    }} 
                    className="mt-1 w-full border p-2 rounded" 
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">Detailed Estimation Report (.pdf)</label>
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
                    accept=".pdf,application/pdf" 
                    ref={detailedReportInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                        setFormError("Detailed Estimation Report must be a PDF file.");
                        e.target.value = ''; // Clear the input
                        setDetailedReport(null);
                        return;
                      }
                      setDetailedReport(file);
                      setFormError(""); // Clear any previous errors
                    }} 
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
                  <label className="block text-sm text-gray-600">Committee Report (.pdf) <span className="text-red-500">*</span></label>
                  <input 
                    type="file" 
                    accept=".pdf,application/pdf" 
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                        setFormError("Committee Report must be a PDF file.");
                        e.target.value = ''; // Clear the input
                        setCommitteeFile(null);
                        return;
                      }
                      setCommitteeFile(file);
                      setFormError(""); // Clear any previous errors
                    }} 
                    className="mt-1 w-full border p-2 rounded" 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Council Resolution Report (.pdf) <span className="text-red-500">*</span></label>
                  <input 
                    type="file" 
                    accept=".pdf,application/pdf" 
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                        setFormError("Council Resolution Report must be a PDF file.");
                        e.target.value = ''; // Clear the input
                        setCouncilFile(null);
                        return;
                      }
                      setCouncilFile(file);
                      setFormError(""); // Clear any previous errors
                    }} 
                    className="mt-1 w-full border p-2 rounded" 
                  />
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
                <table className="w-full border-collapse text-xs border border-gray-300">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr className="text-left text-xs border-b border-gray-300 font-semibold">
                      <th className="p-2 whitespace-nowrap border-r border-gray-300">S.No</th>
                      <th className="p-2 whitespace-nowrap border-r border-gray-300">CR Number</th>
                      <th className="p-2 whitespace-nowrap border-r border-gray-300">CR Date</th>
                      <th className="p-2 whitespace-nowrap border-r border-gray-300">Sector</th>
                      <th className="p-2 whitespace-nowrap border-r border-gray-300">Proposal</th>
                      <th className="p-2 whitespace-nowrap text-right border-r border-gray-300">Estimated Cost</th>
                      <th className="p-2 whitespace-nowrap border-r border-gray-300">Locality</th>
                      <th className="p-2 whitespace-nowrap border-r border-gray-300">Lat/Long</th>
                      <th className="p-2 whitespace-nowrap text-center border-r border-gray-300">Priority</th>
                      <th className="p-2 whitespace-nowrap border-r border-gray-300">Work Image</th>
                      <th className="p-2 whitespace-nowrap border-r border-gray-300">Estimation Report</th>
                      <th className="p-2 whitespace-nowrap border-r border-gray-300">Committee Report</th>
                      <th className="p-2 whitespace-nowrap border-r border-gray-300">Council Resolution</th>
                      <th className="p-2 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedKeys.length === 0 ? (
                      <tr><td className="p-4 text-sm text-gray-500 border-r border-gray-300" colSpan={14}>No submissions yet.</td></tr>
                    ) : (
                      groupedKeys.map((sector, groupIdx) => {
                        const group = groupedSubmissions[sector];
                        return group.map((item, idxInGroup) => {
                          const isFirst = idxInGroup === 0;
                          return (
                            <tr key={item.__idx} className="border-b border-gray-300 align-top hover:bg-gray-50">
                              {/* S.No and sector only on first row of group */}
                              <td className="p-2 align-top border-r border-gray-300">
                                {isFirst ? groupIdx + 1 : null}
                              </td>
                              <td className="p-2 align-top border-r border-gray-300">
                                {isFirst ? (item.crNumber || "-") : null}
                              </td>
                              <td className="p-2 align-top border-r border-gray-300">
                                {isFirst ? (item.crDate || "-") : null}
                              </td>
                              <td className="p-2 align-top border-r border-gray-300">
                                {isFirst ? sector : null}
                              </td>
                              <td className="p-2 align-top max-w-xs truncate border-r border-gray-300" title={item.proposal}>
                                {item.proposal}
                              </td>
                              <td className="p-2 align-top text-right border-r border-gray-300">{fmtINR(Math.round(item.cost))}</td>
                              <td className="p-2 align-top max-w-xs truncate border-r border-gray-300" title={formatLocality(item)}>
                                {formatLocality(item)}
                              </td>
                              <td className="p-2 align-top max-w-xs truncate border-r border-gray-300" title={item.latlong || "-"}>
                                {item.latlong ? (
                                  formatLatlongUrl(item.latlong) ? (
                                    <a href={formatLatlongUrl(item.latlong)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">
                                      {item.latlong.length > 20 ? item.latlong.substring(0, 20) + "..." : item.latlong}
                                    </a>
                                  ) : (
                                    item.latlong.length > 20 ? item.latlong.substring(0, 20) + "..." : item.latlong
                                  )
                                ) : "-"}
                              </td>
                              <td className="p-2 align-top text-center border-r border-gray-300">{item.priority}</td>
                              <td className="p-2 align-top border-r border-gray-300">
                                <FilePreview 
                                  file={item.workImage} 
                                  defaultName="work-image.jpg" 
                                  onClick={(url) => setZoomedImage(url)}
                                />
                              </td>
                              <td className="p-2 align-top border-r border-gray-300">
                                <FilePreview file={item.detailedReport} defaultName="estimation-report.pdf" />
                              </td>
                              <td className="p-2 align-top border-r border-gray-300">
                                <FilePreview file={item.committeeReport} defaultName="committee-report.pdf" />
                              </td>
                              <td className="p-2 align-top border-r border-gray-300">
                                <FilePreview file={item.councilResolution} defaultName="council-resolution.pdf" />
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
          const filteredList = applyFilters(currentList);
          const viewTitle = getViewTitle(selectedView);
          const uniqueSectors = getUniqueSectors(currentList);
          const uniqueStatuses = getUniqueStatuses(currentList);
          
          // Show CDMA Approved view separately if selected
          if (selectedView === "cdmaApproved") {
            const cdmaList = applyFilters(getListForView("cdmaApproved"));
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
                <h3 className="text-sm text-gray-600 mb-4">{viewTitle}</h3>
                
                <div className="overflow-auto max-h-96">
                  <table className="w-full border-collapse text-xs border border-gray-300">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr className="text-left text-xs border-b border-gray-300 font-semibold">
                        <th className="p-2 whitespace-nowrap border-r border-gray-300">S.No</th>
                        <th className="p-2 whitespace-nowrap border-r border-gray-300">CR Number</th>
                        <th className="p-2 whitespace-nowrap border-r border-gray-300">CR Date</th>
                        <th className="p-2 whitespace-nowrap border-r border-gray-300">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <span>Sector</span>
                            </div>
                            <select
                              value={filters.sector}
                              onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
                              className="w-full border p-0.5 rounded text-xs"
                              title="Filter by Sector"
                            >
                              <option value="">All</option>
                              {uniqueSectors.map(sector => (
                                <option key={sector} value={sector}>{sector}</option>
                              ))}
                            </select>
                          </div>
                        </th>
                        <th className="p-2 whitespace-nowrap border-r border-gray-300">Proposal</th>
                        <th className="p-2 whitespace-nowrap text-right border-r border-gray-300">Estimated Cost</th>
                        <th className="p-2 whitespace-nowrap border-r border-gray-300">Locality</th>
                        <th className="p-2 whitespace-nowrap border-r border-gray-300">Lat/Long</th>
                        <th className="p-2 whitespace-nowrap border-r border-gray-300">Priority</th>
                        <th className="p-2 whitespace-nowrap border-r border-gray-300">Work Image</th>
                        <th className="p-2 whitespace-nowrap border-r border-gray-300">Estimation Report</th>
                        <th className="p-2 whitespace-nowrap border-r border-gray-300">Committee Report</th>
                        <th className="p-2 whitespace-nowrap border-r border-gray-300">Council Resolution</th>
                        <th className="p-2 whitespace-nowrap border-r border-gray-300">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <span>Status</span>
                              {(filters.sector || filters.status) && (
                                <button
                                  onClick={() => setFilters({ crNumber: "", sector: "", status: "", proposal: "", locality: "" })}
                                  className="text-xs text-blue-600 hover:text-blue-800 px-1"
                                  title="Clear Filters"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                            <select
                              value={filters.status}
                              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                              className="w-full border p-0.5 rounded text-xs"
                              title="Filter by Status"
                            >
                              <option value="">All</option>
                              {uniqueStatuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </div>
                        </th>
                        <th className="p-2 whitespace-nowrap">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                      {cdmaList.map((s, i) => (
                        <tr key={s.id} className="border-b border-gray-300 hover:bg-gray-50">
                        <td className="p-2 border-r border-gray-300">{i + 1}</td>
                          <td className="p-2 border-r border-gray-300">{s.crNumber || "-"}</td>
                          <td className="p-2 border-r border-gray-300">{s.crDate || "-"}</td>
                        <td className="p-2 border-r border-gray-300">{s.sector}</td>
                          <td className="p-2 max-w-xs truncate border-r border-gray-300" title={s.proposal}>{s.proposal}</td>
                        <td className="p-2 text-right border-r border-gray-300">{fmtINR(Math.round(s.cost || 0))}</td>
                          <td className="p-2 max-w-xs truncate border-r border-gray-300" title={formatLocality(s)}>{formatLocality(s)}</td>
                          <td className="p-2 max-w-xs truncate border-r border-gray-300" title={s.latlong || "-"}>
                            {s.latlong ? (
                              formatLatlongUrl(s.latlong) ? (
                                <a href={formatLatlongUrl(s.latlong)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">
                                  {s.latlong.length > 20 ? s.latlong.substring(0, 20) + "..." : s.latlong}
                                </a>
                              ) : (
                                s.latlong.length > 20 ? s.latlong.substring(0, 20) + "..." : s.latlong
                              )
                            ) : "-"}
                          </td>
                          <td className="p-2 text-center border-r border-gray-300">{s.priority}</td>
                          <td className="p-2 border-r border-gray-300">
                            <FilePreview 
                              file={s.workImage} 
                              defaultName="work-image.jpg" 
                              onClick={(url) => setZoomedImage(url)}
                            />
                          </td>
                          <td className="p-2 border-r border-gray-300">
                            <FilePreview file={s.detailedReport} defaultName="estimation-report.pdf" />
                          </td>
                          <td className="p-2 border-r border-gray-300">
                            <FilePreview file={s.committeeReport} defaultName="committee-report.pdf" />
                          </td>
                          <td className="p-2 border-r border-gray-300">
                            <FilePreview file={s.councilResolution} defaultName="council-resolution.pdf" />
                          </td>
                          <td className="p-2 text-green-600 border-r border-gray-300">CDMA Approved</td>
                          <td className="p-2 text-gray-600 max-w-xs truncate" title={s.remarks || "-"}>{s.remarks || "-"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
            );
          }

          return (
            <div className="bg-white rounded-xl shadow p-6 border mt-6">
              <h3 className="text-sm text-gray-600 mb-4">{viewTitle}</h3>
              
              <div className="overflow-auto max-h-96">
                <table className="w-full border-collapse text-xs border border-gray-300">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr className="text-left text-xs border-b border-gray-300 font-semibold">
                      <th className="p-2 whitespace-nowrap border-r border-gray-300">S.No</th>
                      <th className="p-2 whitespace-nowrap border-r border-gray-300">
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
                      <th className="p-2 whitespace-nowrap border-r border-gray-300">
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
                      <th className="p-2 whitespace-nowrap border-r border-gray-300">
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
                      <th className="p-2 whitespace-nowrap border-r border-gray-300">
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
                      <th className="p-2 whitespace-nowrap text-right border-r border-gray-300">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 justify-end">
                            <span>Estimated Cost</span>
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
                      <th className="p-2 whitespace-nowrap border-r border-gray-300">
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
                      <th className="p-2 whitespace-nowrap border-r border-gray-300">
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
                              placeholder="Sea7rch..."
                              autoFocus
                            />
                          )}
                        </div>
                      </th>
                      <th className="p-2 whitespace-nowrap border-r border-gray-300">
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
                      <th className="p-2 whitespace-nowrap border-r border-gray-300">Work Image</th>
                      <th className="p-2 whitespace-nowrap border-r border-gray-300">Estimation Report</th>
                      <th className="p-2 whitespace-nowrap border-r border-gray-300">Committee Report</th>
                      <th className="p-2 whitespace-nowrap border-r border-gray-300">Council Resolution</th>
                      <th className="p-2 whitespace-nowrap border-r border-gray-300">
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
                      {(selectedView === "forwarded") && <th className="p-2 whitespace-nowrap border-r border-gray-300">Forwarded Date</th>}
                      {(selectedView === "rejected") && <th className="p-2 whitespace-nowrap">Remarks</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Show "No results found" message if filteredList is empty
                      if (filteredList.length === 0) {
                        const columnCount = (selectedView === "forwarded" ? 16 : selectedView === "rejected" ? 16 : 15);
                        return (
                          <tr>
                            <td colSpan={columnCount} className="p-8 text-center text-gray-500 text-sm border-r border-gray-300">
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
                          const columnCount = (selectedView === "forwarded" ? 16 : selectedView === "rejected" ? 16 : 15);
                          return (
                            <tr>
                              <td colSpan={columnCount} className="p-8 text-center text-gray-500 text-sm border-r border-gray-300">
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
                              <tr key={s.id} className="border-b border-gray-300 hover:bg-gray-50">
                                <td className="p-2 align-top border-r border-gray-300">{isFirstInGroup ? globalSerial : ""}</td>
                                <td className="p-2 align-top border-r border-gray-300">{isFirstInGroup ? (s.crNumber || "-") : ""}</td>
                                <td className="p-2 align-top border-r border-gray-300">{isFirstInGroup ? (s.crDate || "-") : ""}</td>
                                <td className="p-2 align-top border-r border-gray-300">{isFirstInGroup ? s.sector : ""}</td>
                                <td className="p-2 max-w-xs truncate align-top border-r border-gray-300" title={s.proposal}>{s.proposal}</td>
                                <td className="p-2 text-right align-top border-r border-gray-300">{fmtINR(Math.round(s.cost || 0))}</td>
                                <td className="p-2 max-w-xs truncate align-top border-r border-gray-300" title={formatLocality(s)}>{formatLocality(s)}</td>
                                <td className="p-2 max-w-xs truncate align-top border-r border-gray-300" title={s.latlong || "-"}>
                                  {s.latlong ? (
                                    formatLatlongUrl(s.latlong) ? (
                                      <a href={formatLatlongUrl(s.latlong)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">
                                        {s.latlong.length > 20 ? s.latlong.substring(0, 20) + "..." : s.latlong}
                                      </a>
                                    ) : (
                                      s.latlong.length > 20 ? s.latlong.substring(0, 20) + "..." : s.latlong
                                    )
                                  ) : "-"}
                                </td>
                                <td className="p-2 text-center align-top border-r border-gray-300">{s.priority}</td>
                                <td className="p-2 align-top border-r border-gray-300">
                                  {s.workImage ? (
                                    <img 
                                      src={getFileUrl(s.workImage)} 
                                      alt="Work" 
                                      className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 border border-gray-300"
                                      onClick={() => setZoomedImage(getFileUrl(s.workImage))}
                                    />
                                  ) : (<span className="text-gray-400 text-xs">No image</span>)}
                                </td>
                                <td className="p-2 align-top border-r border-gray-300">
                                  <FilePreview file={s.detailedReport} defaultName="estimation-report.pdf" />
                                </td>
                                <td className="p-2 align-top border-r border-gray-300">
                                  <FilePreview file={s.committeeReport} defaultName="committee-report.pdf" />
                                </td>
                                <td className="p-2 align-top border-r border-gray-300">
                                  <FilePreview file={s.councilResolution} defaultName="council-resolution.pdf" />
                                </td>
                                <td className="p-2 align-top border-r border-gray-300">
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
                        return filteredList.map((s, i) => (
                          <tr key={s.id} className="border-b border-gray-300 hover:bg-gray-50">
                            <td className="p-2 border-r border-gray-300">{i + 1}</td>
                            <td className="p-2 border-r border-gray-300">{s.crNumber || "-"}</td>
                            <td className="p-2 border-r border-gray-300">{s.crDate || "-"}</td>
                            <td className="p-2 border-r border-gray-300">{s.sector}</td>
                            <td className="p-2 max-w-xs truncate border-r border-gray-300" title={s.proposal}>{s.proposal}</td>
                            <td className="p-2 text-right border-r border-gray-300">{fmtINR(Math.round(s.cost || 0))}</td>
                            <td className="p-2 max-w-xs truncate border-r border-gray-300" title={formatLocality(s)}>{formatLocality(s)}</td>
                            <td className="p-2 max-w-xs truncate border-r border-gray-300" title={s.latlong || "-"}>
                              {s.latlong ? (
                                formatLatlongUrl(s.latlong) ? (
                                  <a href={formatLatlongUrl(s.latlong)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">
                                    {s.latlong.length > 20 ? s.latlong.substring(0, 20) + "..." : s.latlong}
                                  </a>
                                ) : (
                                  s.latlong.length > 20 ? s.latlong.substring(0, 20) + "..." : s.latlong
                                )
                              ) : "-"}
                            </td>
                            <td className="p-2 text-center border-r border-gray-300">{s.priority}</td>
                            <td className="p-2 border-r border-gray-300">
                              {s.workImage ? (
                                <img 
                                  src={getFileUrl(s.workImage)} 
                                  alt="Work" 
                                  className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 border border-gray-300"
                                  onClick={() => setZoomedImage(getFileUrl(s.workImage))}
                                />
                              ) : (<span className="text-gray-400 text-xs">No image</span>)}
                            </td>
                            <td className="p-2 border-r border-gray-300">
                              <FilePreview file={s.detailedReport} defaultName="estimation-report.pdf" />
                            </td>
                            <td className="p-2 border-r border-gray-300">
                              <FilePreview file={s.committeeReport} defaultName="committee-report.pdf" />
                            </td>
                            <td className="p-2 border-r border-gray-300">
                              <FilePreview file={s.councilResolution} defaultName="council-resolution.pdf" />
                            </td>
                            <td className="p-2 border-r border-gray-300">
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
                              <td className="p-2 text-xs text-gray-600 border-r border-gray-300">
                                {s.forwardedDate ? new Date(s.forwardedDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-"}
                              </td>
                            )}
                            {selectedView === "rejected" && (
                              <td className="p-2 text-gray-600 max-w-xs truncate border-r border-gray-300" title={s.remarks || "-"}>{s.remarks || "-"}</td>
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
      </div>
    </div>
  );
}
