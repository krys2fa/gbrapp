"use client";

import React, { useState } from "react";
import { PrinterIcon } from "@heroicons/react/24/outline";

export default function AssayDetailActions({
  jobCardId,
  assayId,
  signatoryName,
  signatoryPosition,
}: {
  jobCardId: string;
  assayId: string;
  signatoryName?: string;
  signatoryPosition?: string;
}) {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );

  function downloadAssayDetail(
    printOrientation: "portrait" | "landscape" = "portrait"
  ) {
    try {
      // Apply print styles to current page for full print dialog
      const printStyles = document.createElement("style");
      const pageSize = printOrientation === "landscape" ? "A4 landscape" : "A4";
      const landscapeStyles =
        printOrientation === "landscape"
          ? `
          /* Allow tables to break across pages if needed */
          table {
            page-break-inside: auto !important;
            break-inside: auto !important;
          }

          /* But keep table rows together when possible */
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Force signatories to stay together and be visible */
          .mt-12.grid.grid-cols-1.sm\\:grid-cols-4.gap-4 {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-top: 3rem !important;
            margin-bottom: 0 !important;
            page-break-before: auto !important;
            break-before: auto !important;
          }

          /* If signatories would be cut off, allow them to break to next page */
          .mt-12.grid.grid-cols-1.sm\\:grid-cols-4.gap-4 {
            page-break-before: avoid !important;
            break-before: avoid !important;
            orphans: 4 !important;
            widows: 4 !important;
          }

          /* Ensure signatory names are clearly visible in landscape */
          .text-xs.text-gray-900.text-center.uppercase.font-bold {
            font-size: 12px !important;
            font-weight: bold !important;
            color: #111827 !important;
            text-transform: uppercase !important;
            visibility: visible !important;
            display: block !important;
          }

          /* Ensure signatory labels are visible */
          .text-xs.font-medium.text-gray-500.text-center {
            font-size: 11px !important;
            color: #6b7280 !important;
            visibility: visible !important;
            display: block !important;
          }

          /* Prevent page breaks within signatory sections */
          .mt-12.grid.grid-cols-1.sm\\:grid-cols-4.gap-4 > div {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Ensure the seal container stays with signatories */
          .bg-white.flex.justify-end {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-before: avoid !important;
            break-before: avoid !important;
          }
      `
          : "";
      printStyles.innerHTML = `
        @media print {
          @page { size: ${pageSize}; margin: -5mm 20mm 20mm; }
          body {
            margin: 0;
            padding: 0;
          }
          body * { visibility: hidden; }
          #assay-detail-content, #assay-detail-content * { visibility: visible; }
          #assay-detail-content {
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
          #assay-detail-content {
            border: none !important;
            box-shadow: none !important;
          }
          #assay-detail-content > div:not(table):not(thead):not(tbody):not(tr):not(th):not(td) {
            border: none !important;
            box-shadow: none !important;
          }
          /* Keep table borders and header styling - high specificity */
          #assay-detail-content table th,
          #assay-detail-content th {
            background-color: #d4af37 !important;
            color: #111827 !important;
            border: 1px solid #d1d5db !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #assay-detail-content table td,
          #assay-detail-content td {
            border: 1px solid #d1d5db !important;
          }
          /* Override any Tailwind background utilities that might interfere */
          #assay-detail-content th[class*="bg-"] {
            background-color: #d4af37 !important;
          }
          ${landscapeStyles}
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
      alert("Failed to prepare assay detail for printing.");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <label
          htmlFor="orientation-select-detail"
          className="text-sm font-medium text-gray-700"
        >
          Orientation:
        </label>
        <select
          id="orientation-select-detail"
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
            downloadAssayDetail(orientation);
          } catch (e) {
            console.error(e);
            alert("Failed to download assay report.");
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
