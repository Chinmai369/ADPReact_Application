import Header from "./Header";
import React, { useEffect, useRef, useState } from "react";

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

  // --- States ---
  const [pendingList, setPendingList] = useState([]);
  const [approvedList, setApprovedList] = useState([]);
  const [forwardedList, setForwardedList] = useState([]);
  const [rejectedList, setRejectedList] = useState([]);
  const [eephRejectedList, setEephRejectedList] = useState([]);

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

  const urlCache = useRef([]);

  const sectionMap = {
    
    Administration:["EEPH","SEPH","ENCPH"]
    
  };

  // --- Update lists ---
  useEffect(() => {
    setPendingList(
      forwardedSubmissions.filter(
        (s) =>
          !["Approved", "Rejected"].includes(s.status) &&
          !s.status?.startsWith("Forwarded to")
      )
    );
    setApprovedList(forwardedSubmissions.filter((s) => s.status === "Approved"));
    setForwardedList(
      forwardedSubmissions.filter((s) => s.status?.startsWith("Forwarded to"))
    );
    setRejectedList(
      forwardedSubmissions.filter((s) => s.status === "Rejected")
    );
    setEephRejectedList(
      forwardedSubmissions.filter((s) => s.status === "EEPH Rejected")
    );
  }, [forwardedSubmissions]);

  // cleanup object URLs
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
    setForwardedSubmissions((prev) => {
      const updated = prev.map((f) =>
        f.id === subId ? { ...f, status: "Approved" } : f
      );
      // Find the updated submission to set as preview
      const updatedSub = updated.find((f) => f.id === subId);
      if (updatedSub) {
        setPreviewSubmission(updatedSub);
      }
      return updated;
    });
    setShowForwardPanel(true);
    setDept("");
    setSection("");
    setForwardRemarks("");
    setApproveBanner("Work approved successfully.");
    setTimeout(() => setApproveBanner(""), 1500);
  };

  // --- Reject ---
  const reject = (subId) => {
    setForwardedSubmissions((prev) =>
      prev.map((f) =>
        f.id === subId ? { ...f, status: "Rejected" } : f
      )
    );
    setRejectBanner("Work rejected successfully.");
    setTimeout(() => setRejectBanner(""), 1500);
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
            }
          : f
      );
      console.log("✅ Commissioner updated submissions:", updated);
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
      setPreviewSubmission(null);
      setDept("");
      setSection("");
      setForwardRemarks("");
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
    ["Approved", "Rejected"].includes(status) ||
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
          <div className="flex justify-between mb-4">
            <h2 className="font-semibold text-gray-700">
              Commissioner Dashboard
            </h2>
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
          <h3 className="text-sm text-gray-600 mb-2">
            Pending / Approval Tasks
          </h3>
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
                              s.status === "Approved"
                                ? "bg-gray-300"
                                : "bg-green-600 text-white"
                            }`}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => reject(s.id)}
                            disabled={s.status === "Rejected"}
                            className={`px-2 py-1 text-xs rounded ${
                              s.status === "Rejected"
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

          {/* Rejected Table */}
          {rejectedList.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2 text-sm">Rejected Tasks</h4>
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
                        <td className="p-2 text-red-700">Rejected</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Returned from EEPH */}
          {eephRejectedList.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2 text-sm">Returned from EEPH</h4>
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
                    {eephRejectedList.map((s, i) => (
                      <tr key={s.id} className="border-b">
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2">{s.sector}</td>
                        <td className="p-2">{s.proposal}</td>
                        <td className="p-2">{fmtINR(s.cost)}</td>
                        <td className="p-2">{s.locality}</td>
                        <td className="p-2">{s.priority}</td>
                        <td className="p-2 text-red-700">EEPH Rejected</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Forwarded Table */}
          {forwardedList.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2 text-sm">Forwarded Tasks</h4>
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
                    {forwardedList.map((s, i) => (
                      <tr key={s.id} className="border-b">
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2">{s.sector}</td>
                        <td className="p-2">{s.proposal}</td>
                        <td className="p-2">{fmtINR(s.cost)}</td>
                        <td className="p-2">{s.locality}</td>
                        <td className="p-2">{s.priority}</td>
                        <td className="p-2 text-blue-700">{s.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
  );
}
