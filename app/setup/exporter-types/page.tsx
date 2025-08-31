 "use client";

  import React, { useEffect, useState } from "react";
  import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
  import BackLink from "@/app/components/ui/BackLink";
  import { Header } from "../../components/layout/header";

  export default function ExporterTypesPage() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [types, setTypes] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [editing, setEditing] = useState<any | null>(null);

    const fetchTypes = async () => {
      try {
        const res = await fetch("/api/exporter-types");
        if (!res.ok) throw new Error("Failed to fetch exporter types");
        const data = await res.json();
        setTypes(Array.isArray(data) ? data : []);
      } catch {
        setTypes([]);
      }
    };

    useEffect(() => {
      fetchTypes();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        const token = localStorage.getItem("auth-token");
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch("/api/exporter-types", { method: "POST", headers, body: JSON.stringify({ name, description }) });
        if (!res.ok) throw new Error("Failed to create exporter type");
        setSuccess("Exporter type created");
        setName("");
        setDescription("");
        fetchTypes();
      } catch (err: any) {
        setError(err.message || "Error creating exporter type");
      } finally {
        setLoading(false);
      }
    };

    const handleStartEdit = (t: any) => {
      setEditing(t);
      setName(t.name || "");
      setDescription(t.description || "");
    };

    const handleCancelEdit = () => {
      setEditing(null);
      setName("");
      setDescription("");
    };

    const handleUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editing) return;
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        const token = localStorage.getItem("auth-token");
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`/api/exporter-types/${editing.id}`, { method: "PUT", headers, body: JSON.stringify({ name, description }) });
        if (!res.ok) throw new Error("Failed to update exporter type");
        setSuccess("Exporter type updated");
        setEditing(null);
        setName("");
        setDescription("");
        fetchTypes();
      } catch (err: any) {
        setError(err.message || "Error updating exporter type");
      } finally {
        setLoading(false);
      }
    };

    const handleDelete = async (id: string) => {
      if (!window.confirm("Delete this exporter type?")) return;
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        const token = localStorage.getItem("auth-token");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`/api/exporter-types/${id}`, { method: "DELETE", headers });
        if (!res.ok) throw new Error("Failed to delete exporter type");
        setSuccess("Exporter type deleted");
        fetchTypes();
      } catch (err: any) {
        setError(err.message || "Error deleting exporter type");
      } finally {
        setLoading(false);
      }
    };

    return (
      <>
        <Header title="Exporter Types" subtitle="Manage exporter types" />
        <div className="my-6 px-4" style={{ width: "100%" }}>
          <BackLink href="/setup" label="Back to Settings" />
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-xl">
            <form onSubmit={editing ? handleUpdate : handleCreate} className="mb-8">
              <div className="shadow sm:rounded-md sm:overflow-hidden">
                <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                  {error && <div className="text-red-600">{error}</div>}
                  {success && <div className="text-green-600">{success}</div>}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div className="flex justify-end">
                    {editing ? (
                      <>
                        <button type="button" onClick={handleCancelEdit} className="mr-2 px-4 py-2 border rounded-md">Cancel</button>
                        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-md">Update</button>
                      </>
                    ) : (
                      <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-md">Create Exporter Type</button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="mt-10">
            <h3 className="text-lg font-semibold mb-4">All Exporter Types</h3>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {types.slice((page - 1) * pageSize, page * pageSize).map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-900">{t.name}</td>
                        <td className="px-4 py-2 text-gray-700">{t.description}</td>
                        <td className="px-4 py-2 flex gap-2">
                          <button className="px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-xs flex items-center" onClick={() => handleStartEdit(t)}>
                            <PencilSquareIcon className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                          <button className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs flex items-center" onClick={() => handleDelete(t.id)}>
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {types.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-4 text-sm text-gray-500">No exporter types yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(page * pageSize, types.length)}</span> of <span className="font-medium">{types.length}</span> results</p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1} className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${page === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-50"}`}>
                        Previous
                      </button>
                      {Array.from({ length: Math.max(1, Math.ceil(types.length / pageSize)) }, (_, i) => i + 1).map((p) => (
                        <button key={p} onClick={() => setPage(p)} className={`relative inline-flex items-center px-4 py-2 border ${page === p ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600" : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"} text-sm font-medium`}>{p}</button>
                      ))}
                      <button onClick={() => setPage((prev) => Math.min(prev + 1, Math.max(1, Math.ceil(types.length / pageSize))))} disabled={page === Math.max(1, Math.ceil(types.length / pageSize))} className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${page === Math.max(1, Math.ceil(types.length / pageSize)) ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-50"}`}>
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
