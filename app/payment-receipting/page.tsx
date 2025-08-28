import React from "react";
import { Header } from "../components/layout/header";
import Link from "next/link";
import { Receipt, CreditCard, FileText } from "lucide-react";

// Dummy data for job cards
const jobCards = [
  {
    id: "JC001",
    title: "Job Card 001",
    customer: "Acme Corp",
    assayInvoiceId: "INV-1001",
    whtInvoiceId: "INV-2001",
  },
  {
    id: "JC002",
    title: "Job Card 002",
    customer: "Beta Ltd",
    assayInvoiceId: "INV-1002",
    whtInvoiceId: "INV-2002",
  },
  {
    id: "JC003",
    title: "Job Card 003",
    customer: "Gamma Inc",
    assayInvoiceId: "INV-1003",
    whtInvoiceId: "INV-2003",
  },
];

const PaymentReceiptingPage = () => {
  return (
    <>
      <Header title="Payment & Receipting" />
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Job Cards</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Job Card</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobCards.map((card) => (
                <tr key={card.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{card.title}</td>
                  <td className="px-4 py-2 text-gray-700">{card.customer}</td>
                  <td className="px-4 py-2 flex gap-2 flex-wrap">
                    <Link href={`/invoice/assay/${card.assayInvoiceId}`} className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                      <FileText className="h-4 w-4 mr-1" /> View Assay Invoice
                    </Link>
                    <Link href={`/invoice/wht/${card.whtInvoiceId}`} className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                      <FileText className="h-4 w-4 mr-1" /> View WHT Invoice
                    </Link>
                    <button className="inline-flex items-center px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700">
                      <CreditCard className="h-4 w-4 mr-1" /> Pay Assay Invoice
                    </button>
                    <button className="inline-flex items-center px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700">
                      <Receipt className="h-4 w-4 mr-1" /> Pay WHT Invoice
                    </button>
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

export default PaymentReceiptingPage;
