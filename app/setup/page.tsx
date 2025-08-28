import React from "react";
import { Header } from "../components/layout/header";
import Link from "next/link";
import { UserPlus, Building2, DollarSign, RefreshCw } from "lucide-react";

const setupOptions = [
  {
    label: "Create Users",
    description: "Add and manage application users.",
    icon: <UserPlus className="h-6 w-6" />,
    href: "/setup/users",
    color: "bg-blue-600",
  },
  {
    label: "Create Exporters",
    description: "Add and manage exporters.",
    icon: <Building2 className="h-6 w-6" />,
    href: "/setup/exporters",
    color: "bg-green-600",
  },
  {
    label: "Daily Price Setup",
    description: "Set up daily commodity prices.",
    icon: <DollarSign className="h-6 w-6" />,
    href: "/setup/daily-price",
    color: "bg-yellow-600",
  },
  {
    label: "Daily Exchange Setup",
    description: "Set up daily exchange rates.",
    icon: <RefreshCw className="h-6 w-6" />,
    href: "/setup/daily-exchange",
    color: "bg-purple-600",
  },
];

const SetupPage = () => {
  return (
    <>
      <Header title="Application Setup" />
      <div className="max-w-3xl mx-auto py-10 px-4">
        <h2 className="text-xl font-bold mb-6">Setup Options</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {setupOptions.map((option) => (
            <Link key={option.label} href={option.href} className="group block bg-white shadow rounded-xl p-6 hover:bg-gray-50 transition">
              <div className={`w-12 h-12 ${option.color} rounded-xl flex items-center justify-center mb-4 text-white group-hover:scale-105 transition-transform`}>
                {option.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">{option.label}</h3>
              <p className="text-sm text-gray-600">{option.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default SetupPage;
