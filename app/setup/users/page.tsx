"use client";
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Header } from "../../components/layout/header";
import Link from "next/link";

const roles = ["SUPERADMIN", "ADMIN", "USER"];

// Utility to capitalize only the first letter
function capitalizeFirst(str: string) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

const CreateUserPage = () => {
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: roles[0],
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  React.useEffect(() => {
    async function fetchUsers() {
      setUsersLoading(true);
      try {
        let url = "/api/users";
        const params = [];
        if (roleFilter) params.push(`role=${roleFilter}`);
        if (nameFilter) params.push(`search=${encodeURIComponent(nameFilter)}`);
        if (emailFilter)
          params.push(`search=${encodeURIComponent(emailFilter)}`);
        if (params.length) url += `?${params.join("&")}`;
        const res = await fetch(url);
        const data = await res.json();
        setUsers(data);
      } catch {
        setUsers([]);
      } finally {
        setUsersLoading(false);
      }
    }
    fetchUsers();
  }, [success, roleFilter, nameFilter, emailFilter]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // Replace with your actual API endpoint
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create user");
      setSuccess("User created successfully!");
      setForm({ name: "", email: "", password: "", role: roles[0] });
    } catch (err: any) {
      setError(err.message || "Error creating user");
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "", // Don't show password
      role: user.role,
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          role: form.role,
        }),
      });
      if (!res.ok) throw new Error("Failed to update user");
      setSuccess("User updated successfully!");
      setEditingUser(null);
      setForm({ name: "", email: "", password: "", role: roles[0] });
    } catch (err: any) {
      setError(err.message || "Error updating user");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete user");
      setSuccess("User deleted successfully!");
    } catch (err: any) {
      setError(err.message || "Error deleting user");
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (user: any) => {
    // Optionally fetch latest user details from API
    try {
      const res = await fetch(`/api/users/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch user details");
      const userDetails = await res.json();
      setViewingUser(userDetails);
      setViewModalOpen(true);
    } catch {
      setViewingUser(user);
      setViewModalOpen(true);
    }
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewingUser(null);
  };

  return (
    <>
      <Header title="Create User" />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6" style={{ width: "100%" }}>
          <div
            className="flex"
            style={{ justifyContent: "flex-start", width: "100%" }}
          >
            <Link
              href="/setup"
              className="inline-flex items-center text-gray-600 hover:text-blue-600"
              style={{ marginLeft: "0.5rem" }}
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Settings
            </Link>
          </div>
        </div>
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-6">Create a New User</h2>
          <form
            className="space-y-6"
            onSubmit={editingUser ? handleUpdateUser : handleSubmit}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <div className="relative mt-1">
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="block w-full appearance-none rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0) + role.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </span>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
            >
              {loading
                ? editingUser
                  ? "Updating..."
                  : "Creating..."
                : editingUser
                ? "Update User"
                : "Create User"}
            </button>
            {editingUser && (
              <button
                type="button"
                className="w-full py-2 px-4 bg-gray-400 text-white rounded-md hover:bg-gray-500 focus:outline-none mt-2"
                onClick={() => {
                  setEditingUser(null);
                  setForm({
                    name: "",
                    email: "",
                    password: "",
                    role: roles[0],
                  });
                }}
              >
                Cancel Edit
              </button>
            )}
            {success && (
              <p className="text-green-600 text-sm mt-2">{success}</p>
            )}
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </form>
        </div>
        <div className="mt-10">
          <h3 className="text-lg font-semibold mb-4">All Users</h3>
          <div className="flex items-center gap-4 mb-4">
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => {
                setNameFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by name"
              className="!w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
            />
            <input
              type="text"
              value={emailFilter}
              onChange={(e) => {
                setEmailFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by email"
              className="!w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
            />
            <div className="relative w-48">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="block w-full appearance-none rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
              >
                <option value="">All Roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {capitalizeFirst(role)}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </span>
            </div>
          </div>
          {usersLoading ? (
            <div className="flex justify-center items-center py-10">
              <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
              <span className="ml-2 text-gray-500">Loading users...</span>
            </div>
          ) : (
            <>
              <table className="w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Role
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Date Added
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .slice((page - 1) * pageSize, page * pageSize)
                    .map((user: any) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-900">{user.name}</td>
                        <td className="px-4 py-2 text-gray-700">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {capitalizeFirst(user.role)}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {user.isActive ? "Active" : "Inactive"}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-4 py-2 flex gap-2">
                          <button
                            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs flex items-center"
                            onClick={() => handleViewUser(user)}
                          >
                            <EyeIcon className="h-4 w-4 mr-1" /> View
                          </button>
                          <button
                            className="px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-xs flex items-center"
                            onClick={() => handleEditUser(user)}
                          >
                            <PencilSquareIcon className="h-4 w-4 mr-1" /> Edit
                          </button>
                          <button
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs flex items-center"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <TrashIcon className="h-4 w-4 mr-1" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-600">
                  Page {page} of{" "}
                  {Math.max(1, Math.ceil(users.length / pageSize))}
                </span>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                    disabled={page >= Math.ceil(users.length / pageSize)}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {viewModalOpen && viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-red-400"
              onClick={closeViewModal}
              aria-label="Close"
            >
              <span className="text-xl">&times;</span>
            </button>
            <h2 className="text-lg font-bold mb-4">User Details</h2>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Name:</span> {viewingUser.name}
              </div>
              <div>
                <span className="font-semibold">Email:</span>{" "}
                {viewingUser.email}
              </div>
              <div>
                <span className="font-semibold">Role:</span>{" "}
                {viewingUser.role
                  ? viewingUser.role.charAt(0) +
                    viewingUser.role.slice(1).toLowerCase()
                  : ""}
              </div>
              <div>
                <span className="font-semibold">Status:</span>{" "}
                {viewingUser.isActive ? "Active" : "Inactive"}
              </div>
              <div>
                <span className="font-semibold">Date Added:</span>{" "}
                {viewingUser.createdAt
                  ? new Date(viewingUser.createdAt).toLocaleDateString()
                  : "-"}
              </div>
              <div>
                <span className="font-semibold">Last Login:</span>{" "}
                {viewingUser.lastLogin
                  ? new Date(viewingUser.lastLogin).toLocaleString()
                  : "Never"}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateUserPage;
