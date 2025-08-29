import React from "react";
import { Header } from "../components/layout/header";
import Link from "next/link";
import { BadgeCheck, FileText, Search, Award } from "lucide-react";

// Dummy data for pending job cards
const pendingJobCards = [
  {
    id: "JC001",
    title: "Job Card 001",
    customer: "Acme Corp",
    certificateId: "CERT-1001",
    analysisId: "AN-2001",
  },
  {
    id: "JC002",
    title: "Job Card 002",
    customer: "Beta Ltd",
    certificateId: "CERT-1002",
    analysisId: "AN-2002",
  },
  {
    id: "JC003",
    title: "Job Card 003",
    customer: "Gamma Inc",
    certificateId: "CERT-1003",
    analysisId: "AN-2003",
  },
];

const SealingCertificationPage = () => {
  return (
    <>
      <Header
        title="Sealing & Certification"
        icon={<Award className="h-5 w-5" />}
        subtitle="Seal and certify completed job cards."
      />
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Pending Job Cards</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Job Card
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pendingJobCards.map((card) => (
                <tr key={card.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {card.title}
                  </td>
                  <td className="px-4 py-2 text-gray-700">{card.customer}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                      <BadgeCheck className="h-4 w-4 mr-1" /> Add Seal
                    </button>
                    <Link
                      href={`/certificate/${card.certificateId}`}
                      className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                    >
                      <FileText className="h-4 w-4 mr-1" /> View Certificate
                    </Link>
                    <Link
                      href={`/analysis/${card.analysisId}`}
                      className="inline-flex items-center px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                    >
                      <Search className="h-4 w-4 mr-1" /> View Analysis
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default SealingCertificationPage;
