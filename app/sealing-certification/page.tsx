"use client";

import { withClientAuth } from "@/app/lib/with-client-auth";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowPathIcon, EyeIcon } from "@heroicons/react/24/outline";
import { Header } from "../components/layout/header";
import { Award, Loader2 } from "lucide-react";
import Select from "react-select";

function SealingList({ onAddSeal }: { onAddSeal?: (id: string) => void }) {
  const [jobCards, setJobCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [referenceFilter, setReferenceFilter] = useState("");
  const [pmmcFilter, setPmmcFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  useEffect(() => {
    fetchSealingList();
  }, [currentPage]);

  useEffect(() => {
    const handler = () => fetchSealingList();
    window.addEventListener("refreshSealingList", handler);
    return () => window.removeEventListener("refreshSealingList", handler);
  }, []);

  const fetchSealingList = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(currentPage));
      params.append("limit", String(itemsPerPage));
      params.append("hasAssays", "true");
      if (referenceFilter) params.append("reference", referenceFilter);
      if (pmmcFilter) params.append("pmmc", pmmcFilter);
      if (startDateFilter) params.append("startDate", startDateFilter);
      if (endDateFilter) params.append("endDate", endDateFilter);

      const res = await fetch(`/api/job-cards?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch job cards");
      const data = await res.json();
      setJobCards(data.jobCards || []);
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mr-2" />
          <span className="text-gray-500">Loading sealing data...</span>
        </div>
      ) : jobCards.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No job cards with assays found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div className="px-4 py-3 bg-white border-b">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600">Reference</label>
                  <input
                    value={referenceFilter}
                    onChange={(e) => setReferenceFilter(e.target.value)}
                    className="mt-1 border rounded px-2 py-1"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600">GOLDBOD Seal</label>
                  <input
                    value={pmmcFilter}
                    onChange={(e) => setPmmcFilter(e.target.value)}
                    className="mt-1 border rounded px-2 py-1"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600">Start Date</label>
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    className="mt-1 border rounded px-2 py-1"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600">End Date</label>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="mt-1 border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <button
                    onClick={() => {
                      setCurrentPage(1);
                      fetchSealingList();
                    }}
                    className="inline-flex items-center px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assay Date
                  </th> */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customs Officer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NACOB Officer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    National Security
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Security Seal Ref
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PMMC Seal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Other Seal
                  </th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th> */}
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobCards.map((jc) => {
                  // const assay =
                  //   jc.assays && jc.assays.length ? jc.assays[0] : null;
                  // helper to find a seal by type
                  const findSeal = (type: string) => {
                    if (!jc.seals || !jc.seals.length) return "";
                    const s = jc.seals.find(
                      (x: any) =>
                        x.sealType === type ||
                        String(x.notes || "")
                          .toUpperCase()
                          .includes(type)
                    );
                    return s ? s.sealNumber || String(s.notes || "") : "";
                  };

                  // Determine if this is a large scale job card
                  const isLargeScale = !!(jc._count || jc.largeScaleJobCardId);

                  return (
                    <tr key={jc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                        <Link
                          href={
                            isLargeScale
                              ? `/job-cards/large-scale/${jc.id}`
                              : `/job-cards/${jc.id}`
                          }
                          className="hover:underline"
                        >
                          {jc.referenceNumber}
                        </Link>
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assay
                          ? formatDate(
                              new Date(
                                assay.assayDate || assay.createdAt || Date.now()
                              )
                            )
                          : "-"}
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {jc.notes
                          ? (jc.notes.match(/Customs Officer: ([^;\n]+)/) ||
                              [])[1] || ""
                          : ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {jc.notes
                          ? (jc.notes.match(/NACOB Officer: ([^;\n]+)/) ||
                              [])[1] || ""
                          : ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {jc.notes
                          ? (jc.notes.match(/National Security: ([^;\n]+)/) ||
                              [])[1] || ""
                          : ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {findSeal("CUSTOMS_SEAL")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {findSeal("PMMC_SEAL")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {findSeal("OTHER_SEAL")}
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{jc.notes || ""}</td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {(() => {
                            const hasSealInfo =
                              (jc.seals && jc.seals.length) ||
                              (jc.notes &&
                                /Customs Officer|NACOB Officer|National Security/.test(
                                  jc.notes
                                ));
                            return (
                              <button
                                onClick={() => {
                                  if (onAddSeal) return onAddSeal(jc.id);
                                  const ev = new CustomEvent(
                                    "openAddSealModal",
                                    { detail: { jobCardId: jc.id } }
                                  );
                                  window.dispatchEvent(ev);
                                }}
                                className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                              >
                                {hasSealInfo ? "Edit Seal" : "Add Seal"}
                              </button>
                            );
                          })()}
                          <Link
                            href={`/job-cards/${jc.id}`}
                            className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(
                      currentPage * itemsPerPage,
                      totalPages * itemsPerPage
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">
                    {totalPages * itemsPerPage}
                  </span>{" "}
                  results
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border ${
                          currentPage === page
                            ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        } text-sm font-medium`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SealingCertificationPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalJobCardId, setModalJobCardId] = useState<string | null>(null);

  const openModalFor = (id: string) => {
    setModalJobCardId(id);
    console.debug("openModalFor called for", id);
    setModalOpen(true);
  };

  // closeModal(refresh = true) -- when refresh=true we trigger list refresh
  const closeModal = (refresh = true) => {
    setModalOpen(false);
    setModalJobCardId(null);
    if (refresh) {
      // trigger a refresh event for the list
      window.dispatchEvent(new CustomEvent("refreshSealingList"));
    }
  };

  return (
    <>
      <Header
        title="Sealing & Certification"
        icon={<Award className="h-5 w-5" />}
        subtitle="Seal and certify completed job cards."
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto"></div>
        </div>

        <div className="mt-6">
          <SealingList onAddSeal={openModalFor} />
        </div>
        <AddSealModal
          open={modalOpen}
          jobCardId={modalJobCardId}
          onClose={(refresh = true) => closeModal(refresh)}
        />
      </div>
    </>
  );
}

export default withClientAuth(SealingCertificationPage);

function AddSealModal({
  open,
  jobCardId,
  onClose,
}: {
  open: boolean;
  jobCardId: string | null;
  onClose: (refresh?: boolean) => void;
}) {
  console.debug("AddSealModal render", { open, jobCardId });
  const [customsOfficerId, setCustomsOfficerId] = useState<string | null>(null);
  const [nacobOfficerId, setNacobOfficerId] = useState<string | null>(null);
  const [nationalSecurityOfficerId, setNationalSecurityOfficerId] = useState<
    string | null
  >(null);
  const [customsSeal, setCustomsSeal] = useState("");
  const [pmmcSeal, setPmmcSeal] = useState("");
  const [otherSeal, setOtherSeal] = useState("");
  const [customsSealId, setCustomsSealId] = useState<string | null>(null);
  const [pmmcSealId, setPmmcSealId] = useState<string | null>(null);
  const [otherSealId, setOtherSealId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Officers state
  const [officers, setOfficers] = useState<{
    customsOfficers: { id: string; name: string; badgeNumber: string }[];
    nacobOfficers: { id: string; name: string; badgeNumber: string }[];
    nationalSecurityOfficers: {
      id: string;
      name: string;
      badgeNumber: string;
    }[];
  }>({
    customsOfficers: [],
    nacobOfficers: [],
    nationalSecurityOfficers: [],
  });

  // Custom styles for React Select to match other form inputs
  const customSelectStyles = {
    container: (provided: Record<string, unknown>) => ({
      ...provided,
      minHeight: "38px",
    }),
    control: (provided: Record<string, unknown>) => ({
      ...provided,
      border: "1px solid #d1d5db",
      borderRadius: "0.375rem",
      minHeight: "38px",
      fontSize: "14px",
    }),
    menu: (provided: Record<string, unknown>) => ({
      ...provided,
      zIndex: 9999,
    }),
  };

  // Fetch officers on component mount
  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        const response = await fetch("/api/officers");
        if (response.ok) {
          const officersData = await response.json();
          // Group officers by type
          const groupedOfficers = {
            customsOfficers: officersData.filter(
              (o: any) => o.officerType === "CUSTOMS_OFFICER"
            ),
            nacobOfficers: officersData.filter(
              (o: any) => o.officerType === "NACOB_OFFICER"
            ),
            nationalSecurityOfficers: officersData.filter(
              (o: any) => o.officerType === "NATIONAL_SECURITY_OFFICER"
            ),
          };
          setOfficers(groupedOfficers);
        }
      } catch (error) {
        console.error("Failed to fetch officers:", error);
      }
    };

    fetchOfficers();
  }, []);

  const close = () => {
    // close without refreshing list
    onClose(false);
    setCustomsOfficerId(null);
    setNacobOfficerId(null);
    setNationalSecurityOfficerId(null);
    setCustomsSeal("");
    setPmmcSeal("");
    setOtherSeal("");
    setCustomsSealId(null);
    setPmmcSealId(null);
    setOtherSealId(null);
    setNotes("");
  };

  const submit = async () => {
    if (!jobCardId) return;
    setSaving(true);
    try {
      // Get officer names from IDs
      const customsOfficerName = customsOfficerId
        ? officers.customsOfficers.find((o) => o.id === customsOfficerId)?.name
        : undefined;
      const nacobOfficerName = nacobOfficerId
        ? officers.nacobOfficers.find((o) => o.id === nacobOfficerId)?.name
        : undefined;
      const nationalSecurityName = nationalSecurityOfficerId
        ? officers.nationalSecurityOfficers.find(
            (o) => o.id === nationalSecurityOfficerId
          )?.name
        : undefined;

      const payload: any = {
        customsOfficerName: customsOfficerName || undefined,
        nacobOfficerName: nacobOfficerName || undefined,
        nationalSecurityName: nationalSecurityName || undefined,
        seals: [],
      };
      if (customsSeal)
        payload.seals.push({
          id: customsSealId || undefined,
          sealType: "CUSTOMS_SEAL",
          sealNumber: customsSeal,
          notes,
        });
      if (pmmcSeal)
        payload.seals.push({
          id: pmmcSealId || undefined,
          sealType: "PMMC_SEAL",
          sealNumber: pmmcSeal,
          notes,
        });
      if (otherSeal)
        payload.seals.push({
          id: otherSealId || undefined,
          sealType: "OTHER_SEAL",
          sealNumber: otherSeal,
          notes,
        });

      const res = await fetch(`/api/job-cards/${jobCardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save seal");
      // close and request a refresh so the list updates
      onClose(true);
    } catch (err) {
      console.error(err);
      alert("Failed to save seal");
    } finally {
      setSaving(false);
    }
  };

  // When jobCardId changes (and modal is open) attempt to load existing seal/note data
  useEffect(() => {
    if (!open || !jobCardId) return;
    let mounted = true;
    (async () => {
      setLoadingExisting(true);
      try {
        const res = await fetch(`/api/job-cards/${jobCardId}`);
        if (!res.ok) throw new Error("Failed to load job card");
        const jc = await res.json();
        if (!mounted) return;
        // parse notes for officer names and find corresponding IDs
        const notesText = jc.notes || "";
        setNotes(notesText);
        const customsMatch = notesText.match(/Customs Officer: ([^;\n]+)/);
        const nacobMatch = notesText.match(/NACOB Officer: ([^;\n]+)/);
        const nationalMatch = notesText.match(/National Security: ([^;\n]+)/);

        // Find officer IDs by name
        if (customsMatch) {
          const officerName = customsMatch[1].trim();
          const officer = officers.customsOfficers.find(
            (o) => o.name === officerName
          );
          setCustomsOfficerId(officer?.id || null);
        }
        if (nacobMatch) {
          const officerName = nacobMatch[1].trim();
          const officer = officers.nacobOfficers.find(
            (o) => o.name === officerName
          );
          setNacobOfficerId(officer?.id || null);
        }
        if (nationalMatch) {
          const officerName = nationalMatch[1].trim();
          const officer = officers.nationalSecurityOfficers.find(
            (o) => o.name === officerName
          );
          setNationalSecurityOfficerId(officer?.id || null);
        }
        // populate seals
        const seals = jc.seals || [];
        const findObj = (type: string) =>
          seals.find((s: any) => s.sealType === type) || null;
        const customsObj = findObj("CUSTOMS_SEAL");
        const pmmcObj = findObj("PMMC_SEAL");
        const otherObj = findObj("OTHER_SEAL");
        setCustomsSeal(
          customsObj
            ? customsObj.sealNumber || String(customsObj.notes || "")
            : ""
        );
        setCustomsSealId(customsObj ? customsObj.id : null);
        setPmmcSeal(
          pmmcObj ? pmmcObj.sealNumber || String(pmmcObj.notes || "") : ""
        );
        setPmmcSealId(pmmcObj ? pmmcObj.id : null);
        setOtherSeal(
          otherObj ? otherObj.sealNumber || String(otherObj.notes || "") : ""
        );
        setOtherSealId(otherObj ? otherObj.id : null);
      } catch (e) {
        console.debug("Failed to prefill seal modal", e);
      } finally {
        setLoadingExisting(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open, jobCardId, officers]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
        <h3 className="text-lg font-medium mb-4">Add Seal</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Customs Officer</span>
            <Select
              options={officers.customsOfficers.map((officer) => ({
                value: officer.id,
                label: `${officer.name} (${officer.badgeNumber})`,
              }))}
              value={
                customsOfficerId
                  ? officers.customsOfficers
                      .map((officer) => ({
                        value: officer.id,
                        label: `${officer.name} (${officer.badgeNumber})`,
                      }))
                      .find((o) => o.value === customsOfficerId)
                  : null
              }
              onChange={(selectedOption) =>
                setCustomsOfficerId(selectedOption?.value || null)
              }
              className="mt-1"
              classNamePrefix="react-select"
              styles={customSelectStyles}
              isClearable
              placeholder="Select customs officer"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">NACOB Officer</span>
            <Select
              options={officers.nacobOfficers.map((officer) => ({
                value: officer.id,
                label: `${officer.name} (${officer.badgeNumber})`,
              }))}
              value={
                nacobOfficerId
                  ? officers.nacobOfficers
                      .map((officer) => ({
                        value: officer.id,
                        label: `${officer.name} (${officer.badgeNumber})`,
                      }))
                      .find((o) => o.value === nacobOfficerId)
                  : null
              }
              onChange={(selectedOption) =>
                setNacobOfficerId(selectedOption?.value || null)
              }
              className="mt-1"
              classNamePrefix="react-select"
              styles={customSelectStyles}
              isClearable
              placeholder="Select NACOB officer"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">National Security</span>
            <Select
              options={officers.nationalSecurityOfficers.map((officer) => ({
                value: officer.id,
                label: `${officer.name} (${officer.badgeNumber})`,
              }))}
              value={
                nationalSecurityOfficerId
                  ? officers.nationalSecurityOfficers
                      .map((officer) => ({
                        value: officer.id,
                        label: `${officer.name} (${officer.badgeNumber})`,
                      }))
                      .find((o) => o.value === nationalSecurityOfficerId)
                  : null
              }
              onChange={(selectedOption) =>
                setNationalSecurityOfficerId(selectedOption?.value || null)
              }
              className="mt-1"
              classNamePrefix="react-select"
              styles={customSelectStyles}
              isClearable
              placeholder="Select national security officer"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">
              Security Seal Ref (Customs)
            </span>
            <input
              value={customsSeal}
              onChange={(e) => setCustomsSeal(e.target.value)}
              className="mt-1 border rounded px-2 py-1"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">PMMC Seal Ref</span>
            <input
              value={pmmcSeal}
              onChange={(e) => setPmmcSeal(e.target.value)}
              className="mt-1 border rounded px-2 py-1"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Other Seal Ref</span>
            <input
              value={otherSeal}
              onChange={(e) => setOtherSeal(e.target.value)}
              className="mt-1 border rounded px-2 py-1"
            />
          </label>
          <label className="col-span-2 flex flex-col">
            <span className="text-sm text-gray-600">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 border rounded px-2 py-1"
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={close}
            className="px-4 py-2 border rounded"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
