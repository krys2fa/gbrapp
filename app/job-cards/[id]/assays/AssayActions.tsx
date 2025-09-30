"use client";

import React, { useState } from "react";
import { PrinterIcon } from "@heroicons/react/24/outline";

export default function AssayActions({
  jobCardId,
  signatoryName,
  signatoryPosition,
}: {
  jobCardId: string;
  signatoryName?: string;
  signatoryPosition?: string;
}) {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );

  function downloadAssay(
    printOrientation: "portrait" | "landscape" = "portrait"
  ) {
    try {
      // Apply print styles to current page for full print dialog
      const printStyles = document.createElement("style");
      const pageSize = printOrientation === "landscape" ? "A4 landscape" : "A4";
      printStyles.innerHTML = `
        @media print {
          @page { size: ${pageSize}; margin: -5mm 20mm 20mm 20mm; }
          body {
            margin: 0;
            padding: 0;
          }
          body * { visibility: hidden; }
          #assay-content, #assay-content * { visibility: visible; }
          #assay-content {
            position: static;
            margin: 0;
            padding: 0;
            margin-top: -10mm;
          }

          /* QR Code print styles */
          img[alt*="QR Code"] {
            width: 48pt !important;
            height: 48pt !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          /* Remove borders from printed content but keep table borders */
          #assay-content {
            border: none !important;
            box-shadow: none !important;
          }
          #assay-content > div:not(table):not(thead):not(tbody):not(tr):not(th):not(td) {
            border: none !important;
            box-shadow: none !important;
          }
          /* Keep table borders and header styling - high specificity */
          #assay-content table th,
          #assay-content th {
            background-color: #d4af37 !important;
            color: #111827 !important;
            border: 1px solid #d1d5db !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #assay-content table td,
          #assay-content td {
            border: 1px solid #d1d5db !important;
          }
          /* Override any Tailwind background utilities that might interfere */
          #assay-content th[class*="bg-"] {
            background-color: #d4af37 !important;
          }
        }
      `;
      document.head.appendChild(printStyles);

      // Trigger print dialog on current page
      window.print();

      // Clean up styles after printing
      setTimeout(() => {
        document.head.removeChild(printStyles);
      }, 1000);
    } catch (e) {
      console.error(e);
      alert("Failed to prepare document for printing.");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <label
          htmlFor="orientation-select"
          className="text-sm font-medium text-gray-700"
        >
          Orientation:
        </label>
        <select
          id="orientation-select"
          value={orientation}
          onChange={(e) =>
            setOrientation(e.target.value as "portrait" | "landscape")
          }
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </div>
      <button
        onClick={() => {
          try {
            downloadAssay(orientation);
          } catch (e) {
            console.error(e);
            alert("Failed to download assay results.");
          }
        }}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
      >
        <PrinterIcon className="w-4 h-4 mr-2" />
        Print Report
      </button>
    </div>
  );
}
