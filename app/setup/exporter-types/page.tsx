"use client";

import React, { useEffect, useState } from "react";
import BackLink from "@/app/components/ui/BackLink";
import { Header } from "../../components/layout/header";

export default function ExporterTypesPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [types, setTypes] = useState<any[]>([]);

  const fetchTypes = async () => {
    try {
      const res = await fetch("/api/exporter-types");
      if (!res.ok) throw new Error("Failed to fetch exporter types");
      const data = await res.json();
      setTypes(Array.isArray(data) ? data : []);
    } catch (e) {
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
      const res = await fetch("/api/exporter-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
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

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <Header title="Exporter Types" subtitle="Manage exporter types" />
      <div className="my-6">
        <BackLink href="/setup" label="Back to Settings" />
      </div>

      <div className="max-w-3xl">
        <form onSubmit={handleCreate} className="mb-8">
          <div className="shadow sm:rounded-md sm:overflow-hidden">
            <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
              {error && <div className="text-red-600">{error}</div>}
              {success && <div className="text-green-600">{success}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full border px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                  Create Exporter Type
                </button>
              </div>
            </div>
          </div>
        </form>

        <div className="bg-white shadow sm:rounded-md p-4">
          <h3 className="text-lg font-semibold mb-4">
            Existing Exporter Types
          </h3>
          <ul className="space-y-2">
            {types.map((t) => (
              <li key={t.id} className="p-3 border rounded">
                <div className="font-medium">{t.name}</div>
                {t.description && (
                  <div className="text-sm text-gray-600">{t.description}</div>
                )}
              </li>
            ))}
            {types.length === 0 && (
              <li className="text-sm text-gray-500">No exporter types yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
