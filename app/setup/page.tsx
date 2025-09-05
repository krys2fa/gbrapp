import React from "react";
import { Header } from "../components/layout/header";
import Link from "next/link";
import {
  UserPlus,
  Building2,
  Building,
  DollarSign,
  Gem,
  Settings,
  Globe,
  Repeat,
  Calendar,
  UserCircle2Icon,
  UserCheck2Icon,
  UserStarIcon,
} from "lucide-react";

const setupOptions = [
  {
    label: "Manage Users",
    description: "Add and manage application users.",
    icon: <UserPlus className="h-6 w-6" />,
    href: "/setup/users",
    color: "bg-blue-600",
  },
  {
    label: "Manage Officers",
    description: "Add and manage officers.",
    icon: <UserStarIcon className="h-6 w-6" />,
    href: "/setup/officers",
    color: "bg-blue-300",
  },
  {
    label: "Manage Exporters",
    description: "Add and manage exporters.",
    icon: <Building2 className="h-6 w-6" />,
    href: "/setup/exporters",
    color: "bg-green-600",
  },
  {
    label: "Manage Exporter Types",
    description: "Add and manage exporter types.",
    icon: <Building className="h-6 w-6" />,
    href: "/setup/exporter-types",
    color: "bg-lime-600",
  },
  {
    label: "Manage Commodities",
    description: "Add and manage commodities.",
    icon: <Gem className="h-6 w-6" />,
    href: "/setup/commodities",
    color: "bg-indigo-600",
  },
  {
    label: "Manage Exchange Rates",
    description: "Add and manage exchange rates.",
    icon: <Globe className="h-6 w-6" />,
    href: "/setup/exchanges",
    color: "bg-indigo-600",
  },
  {
    label: "Manage Daily Commodity Prices",
    description: "Set up daily commodity prices.",
    icon: <DollarSign className="h-6 w-6" />,
    href: "/setup/daily-prices",
    color: "bg-yellow-600",
  },
  // {
  //   label: "Manage Daily Exchange Rates",
  //   description: "Set up daily exchange rates.",
  //   icon: <Repeat className="h-6 w-6" />,
  //   href: "/setup/daily-exchange",
  //   color: "bg-purple-600",
  // },
  {
    label: "Manage Weekly Exchange Rates",
    description: "Set up weekly exchange rates.",
    icon: <Calendar className="h-6 w-6" />,
    href: "/setup/weekly-exchange",
    color: "bg-indigo-600",
  },
];

const SetupPage = () => {
  return (
    <>
      <Header
        title="Application Settings"
        icon={<Settings className="h-5 w-5" />}
        subtitle="Configure users, exporters, commodities and exchange rates."
      />
      <div className="max-w-7xl py-10 px-4">
        {/* <h2 className="text-xl font-bold mb-6">Setup Options</h2> */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {setupOptions.map((option) => (
            <Link
              key={option.label}
              href={option.href}
              className="group block bg-white shadow rounded-xl p-6 hover:bg-gray-50 transition"
            >
              <div
                className={`w-12 h-12 ${option.color} rounded-xl flex items-center justify-center mb-4 text-white group-hover:scale-105 transition-transform`}
              >
                {option.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">
                {option.label}
              </h3>
              <p className="text-sm text-gray-600">{option.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default SetupPage;
