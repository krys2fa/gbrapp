"use client";

import { withClientAuth } from "@/app/lib/with-client-auth";
import { JobCardList } from "./components/job-card-list";
import { JobCardFilters } from "./components/job-card-filters";
import { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { Header } from "../components/layout/header";
import { FileText } from "lucide-react";

function JobCardsPage() {
  const [filters, setFilters] = useState({
    exporterId: "",
    startDate: "",
    endDate: "",
    status: "",
    humanReadableId: "",
  });

  return (
    <>
      <Header
        title="Small Scale Job Cards"
        icon={<FileText className="h-5 w-5" />}
        subtitle="Create and manage small scale job cards, track status and invoices."
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            {/* <h1 className="text-2xl font-semibold text-gray-900">Job Cards</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all job cards in the system, including their reference
              number, exporter, status, and received date.
            </p> */}
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              href="/job-cards/new"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add New Job
            </Link>
          </div>
        </div>

        <JobCardFilters filters={filters} setFilters={setFilters} />

        <div className="mt-6">
          <JobCardList filters={filters} />
        </div>
      </div>
    </>
  );
}

export default withClientAuth(JobCardsPage);

// Disable prerendering for this page to avoid SSR issues
export const dynamic = "force-dynamic";
