"use client";

import React from "react";
import { PrinterIcon } from "@heroicons/react/24/outline";

export default function LargeScaleInvoiceActions({
  jobCardId,
  signatoryName,
  signatoryPosition,
}: {
  jobCardId: string;
  signatoryName?: string;
  signatoryPosition?: string;
}) {
  function downloadInvoice() {
    try {
      const content = document.getElementById("invoice-content");
      if (!content) {
        alert("Invoice content not found to download.");
        return;
      }

      // Clone the content to preserve all styles
      const clonedContent = content.cloneNode(true) as HTMLElement;

      // Collect all stylesheet links and inline styles from the document
      const stylesheets = Array.from(
        document.querySelectorAll('link[rel="stylesheet"], style')
      )
        .map((style) => style.outerHTML)
        .join("\n");

      // Enhanced CSS for proper print styling matching the web page exactly
      const enhancedStyles = `
        @page { size: A4; margin: 20mm; }
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
          color: #111827;
          line-height: 1.5;
        }
        
        /* A4 Document Layout - Only for Print */
        body {
          width: 210mm !important;
          max-width: 100% !important;
          margin: 0 auto !important;
        }
        #invoice-content {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 15mm !important;
        }

        /* Layout and positioning */
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-between { justify-content: space-between; }
        .justify-center { justify-content: center; }
        .justify-end { justify-content: flex-end; }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .gap-2 { gap: 0.5rem; }
        .gap-4 { gap: 1rem; }

        /* Spacing */
        .mb-1 { margin-bottom: 0.25rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-6 { margin-top: 1.5rem; }
        .px-4 { padding-left: 1rem; padding-right: 1rem; }
        .px-8 { padding-left: 2rem; padding-right: 2rem; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
        .p-2 { padding: 0.5rem; }
        .p-4 { padding: 1rem; }
        .p-6 { padding: 1.5rem; }
        .pt-2 { padding-top: 0.5rem; }
        .pt-4 { padding-top: 1rem; }
        .ml-1 { margin-left: 0.25rem; }
        .ml-2 { margin-left: 0.5rem; }
        .pr-0 { padding-right: 0; }
        .mr-0 { margin-right: 0; }

        /* Typography */
        .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
        .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
        .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
        .font-medium { font-weight: 500; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }
        .tracking-wider { letter-spacing: 0.05em; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* Colors */
        .text-gray-500 { color: #6b7280; }
        .text-gray-600 { color: #4b5563; }
        .text-gray-700 { color: #374151; }
        .bg-white { background-color: #ffffff; }
        .bg-gray-50 { background-color: #f9fafb; }
        .border-gray-300 { border-color: #d1d5db; }

        /* Borders */
        .border { border-width: 1px; }
        .border-t { border-top-width: 1px; }
        .border-collapse { border-collapse: collapse; }
        .rounded-lg { border-radius: 0.5rem; }
        .shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); }

        /* Table styling */
        .table-auto { table-layout: auto; }
        .w-full { width: 100%; }

        /* Image styling */
        img {
          max-width: 100%;
          height: auto;
        }
        .h-12 { height: 3rem; }
        .h-16 { height: 4rem; }
        .h-20 { height: 5rem; }
        .w-16 { width: 4rem; }
        .w-auto { width: auto; }

        /* Watermark styling */
        body {
          background: url('/seal.png') no-repeat center 30%;
          background-size: 280px 280px;
          background-attachment: fixed;
          opacity: 1;
        }
        body::before {
          content: "";
          position: fixed;
          top: 30%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 280px;
          height: 280px;
          background: url('/seal.png') no-repeat center center;
          background-size: contain;
          opacity: 0.15;
          z-index: 1;
          pointer-events: none;
        }
        #invoice-content {
          position: relative;
          background: transparent;
        }
        #invoice-content::before {
          content: "";
          position: absolute;
          top: 30%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 280px;
          height: 280px;
          background: url('/seal.png') no-repeat center center;
          background-size: contain;
          opacity: 0.15;
          z-index: 1;
          pointer-events: none;
        }
        #invoice-content > * {
          position: relative;
          z-index: 3;
        }

        /* Table transparency for watermark visibility */
        table {
          background: transparent !important;
        }
        table th {
          background: rgba(249, 250, 251, 0.9) !important;
        }
        table td {
          background: rgba(255, 255, 255, 0.9) !important;
        }
        .bg-gray-50 {
          background: rgba(249, 250, 251, 0.9) !important;
        }
        .bg-white {
          background: rgba(255, 255, 255, 0.9) !important;
        }

        /* Hide elements not needed for print */
        .no-print { display: none; }
        .print\\:hidden { display: none; }

        /* QR Code specific styling */
        .mt-6 { margin-top: 1.5rem; }
        
        /* Print-specific overrides */
        @media print {
          .print\\:hidden { display: none !important; }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          /* Ensure QR code is visible in print */
          img[alt*="QR Code"] {
            display: block !important;
            width: 4rem !important;
            height: 4rem !important;
            opacity: 1 !important;
          }
        }
      `;

      const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Large Scale Invoice</title>
  ${stylesheets}
  <style>${enhancedStyles}</style>
</head>
<body>
  <div class="bg-white py-2">
    ${clonedContent.innerHTML}
  </div>
</body>
</html>`;

      const w = window.open("", "_blank");
      if (!w) {
        alert("Please allow popups to print the invoice.");
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 250);
    } catch (e) {
      console.error(e);
      alert("Failed to generate invoice for printing.");
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* <BackLink href={`/job-cards/large-scale/${jobCardId}`} label="Back to Large Scale Job Card" /> */}

      <button
        onClick={() => {
          try {
            downloadInvoice();
          } catch (e) {
            console.error(e);
            alert("Failed to download invoice.");
          }
        }}
        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
      >
        <PrinterIcon className="h-4 w-4 mr-2" />
        Print Invoice
      </button>
    </div>
  );
}
