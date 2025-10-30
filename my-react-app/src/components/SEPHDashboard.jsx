import Header from "./Header";
import React, { useEffect, useRef, useState } from "react";

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

  const urlCache = useRef([]);

  useEffect(() => {
    const pending = forwardedSubmissions.filter(
      (s) => {
        const status = (s.status || "").trim();
        const section = (s.forwardedTo?.section || "").trim();
        
        // Exclude already processed tasks
        const isProcessed = ["SEPH Approved", "SEPH Rejected"].includes(status);
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
    const rejected = forwardedSubmissions.filter((s) => s.status === "SEPH Rejected");
    setRejectedList(rejected);
  }, [forwardedSubmissions]);

  useEffect(() => {
    return () => {
      urlCache.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

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
        f.id === subId ? { ...f, status: "SEPH Approved" } : f
      )
    );
    setApproveBanner("Work approved successfully by SEPH.");
    setTimeout(() => setApproveBanner(""), 1500);
  };

  // --- Reject ---
  const reject = (subId) => {
    setForwardedSubmissions((prev) =>
      prev.map((f) =>
        f.id === subId ? { ...f, status: "SEPH Rejected" } : f
      )
    );
    setRejectBanner("Work rejected and sent back to EEPH.");
    setTimeout(() => setRejectBanner(""), 1500);
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
          <div className="flex justify-between mb-4">
            <h2 className="font-semibold text-gray-700">SEPH Dashboard</h2>
            <button
              onClick={() => {
                logout?.();
                window.location.href = "/";
              }}
              className="px-3 py-1 bg-gray-200 rounded text-sm"
            >
              Logout
            </button>
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

          {/* Pending table */}
          <h3 className="text-sm text-gray-600 mb-2">Pending Works</h3>
          {pendingList.length === 0 ? (
            <p className="text-gray-500 text-sm">No items to review.</p>
          ) : (
            <div className="overflow-auto max-h-80">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-2 w-16">S.No</th>
                    <th className="p-2 w-40">Sector</th>
                    <th className="p-2 w-64">Proposal</th>
                    <th className="p-2 w-32">Cost</th>
                    <th className="p-2 w-48">Locality</th>
                    <th className="p-2 w-20">Priority</th>
                    <th className="p-2 w-32">Status</th>
                    <th className="p-2 w-40">Actions</th>
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
                      <td className="p-2">{s.status}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Approved Table */}
          {approvedList.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2 text-sm">Approved by SEPH</h4>
              <div className="overflow-auto max-h-48">
               <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="p-2 w-16">S.No</th>
                      <th className="p-2 w-40">Sector</th>
                      <th className="p-2 w-64">Proposal</th>
                      <th className="p-2 w-32">Cost</th>
                      <th className="p-2 w-48">Locality</th>
                      <th className="p-2 w-20">Priority</th>
                      <th className="p-2 w-32">Status</th>
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
                        <td className="p-2 text-green-700">SEPH Approved</td>
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
              <h4 className="font-semibold mb-2 text-sm">Rejected by SEPH</h4>
              <div className="overflow-auto max-h-48">
               <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="p-2 w-16">S.No</th>
                      <th className="p-2 w-40">Sector</th>
                      <th className="p-2 w-64">Proposal</th>
                      <th className="p-2 w-32">Cost</th>
                      <th className="p-2 w-48">Locality</th>
                      <th className="p-2 w-20">Priority</th>
                      <th className="p-2 w-32">Status</th>
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
                        <td className="p-2 text-red-700">SEPH Rejected</td>
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
