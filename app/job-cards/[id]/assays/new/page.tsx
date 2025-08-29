"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type AssayMethod = "X_RAY" | "WATER_DENSITY";

export default function NewAssayPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [shipmentTypes, setShipmentTypes] = useState<{ id: string; name: string }[]>([]);

  const [form, setForm] = useState({
    method: "X_RAY" as AssayMethod,
    pieces: 1,
    signatory: "",
    comments: "",
    shipmentTypeId: "",
  });

  // rows for each piece: grossWeight, waterWeight, fineness, netWeight
  const [rows, setRows] = useState<Array<{ grossWeight?: number; waterWeight?: number; fineness?: number; netWeight?: number }>>([
    {},
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shipmentRes] = await Promise.all([fetch("/api/shipment-types")]);
        if (shipmentRes.ok) {
          setShipmentTypes(await shipmentRes.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // adjust rows when pieces changes
  useEffect(() => {
    const n = Math.max(0, Number(form.pieces) || 0);
    setRows((prev) => {
      const next = [...prev];
      if (n > next.length) {
        for (let i = next.length; i < n; i++) next.push({});
      } else if (n < next.length) {
        next.length = n;
      }
      return next;
    });
  }, [form.pieces]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: name === "pieces" ? Number(value) : value }));
  };

  const handleRowChange = (index: number, field: string, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value === "" ? undefined : Number(value) };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // fetch current job card
      const res = await fetch(`/api/job-cards/${id}`);
      if (!res.ok) throw new Error("Failed to load job card");
      const jobCard = await res.json();

      const newAssay = {
        id: `local-${Date.now()}`,
        method: form.method,
        pieces: Number(form.pieces),
        signatory: form.signatory,
        measurements: rows.map((r, i) => ({ piece: i + 1, grossWeight: r.grossWeight || 0, waterWeight: r.waterWeight || 0, fineness: r.fineness || 0, netWeight: r.netWeight || 0 })),
        comments: form.comments,
        shipmentTypeId: form.shipmentTypeId || null,
        createdAt: new Date().toISOString(),
      };

      const updated = { ...jobCard, assays: [...(jobCard.assays || []), newAssay] };

      const put = await fetch(`/api/job-cards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!put.ok) {
        const err = await put.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save assay");
      }

      router.push(`/job-cards/${id}`);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href={`/job-cards/${id}`} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          ← Back
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow sm:rounded-md sm:overflow-hidden">
          <div className="px-4 py-5 sm:p-6 space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Assay Method</label>
                <select name="method" value={form.method} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="X_RAY">X-ray</option>
                  <option value="WATER_DENSITY">Water density</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Pieces</label>
                <input name="pieces" type="number" min={1} value={form.pieces} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Authorized Signatory</label>
                <input name="signatory" type="text" value={form.signatory} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900">Piece measurements</h4>
              <p className="text-xs text-gray-500">Provide measurements for each piece saved.</p>

              <div className="mt-3 space-y-2">
                {rows.map((r, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-xs text-gray-600">Gross weight</label>
                      <input type="number" step="any" value={r.grossWeight ?? ""} onChange={(e) => handleRowChange(i, "grossWeight", e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Water weight</label>
                      <input type="number" step="any" value={r.waterWeight ?? ""} onChange={(e) => handleRowChange(i, "waterWeight", e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Fineness</label>
                      <input type="number" step="any" value={r.fineness ?? ""} onChange={(e) => handleRowChange(i, "fineness", e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Net weight</label>
                      <input type="number" step="any" value={r.netWeight ?? ""} onChange={(e) => handleRowChange(i, "netWeight", e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-900">Additional</h4>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Comments</label>
                  <textarea name="comments" value={form.comments} onChange={handleFormChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type of shipment</label>
                  <select name="shipmentTypeId" value={form.shipmentTypeId} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    <option value="">Select shipment type</option>
                    {shipmentTypes.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button type="submit" disabled={saving} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
              {saving ? "Saving..." : "Save Valuation"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
