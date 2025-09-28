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
          @page { size: ${pageSize}; margin: 20mm; }
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
          }

          /* QR Code print styles */
          img[alt*="QR Code"] {
            width: 48pt !important;
            height: 48pt !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
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
