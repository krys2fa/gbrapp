"use client";

import React from "react";
import Link from "next/link";
import BackLink from "@/app/components/ui/BackLink";
import { useRouter } from "next/navigation";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

export default function InvoiceActions({
  jobCardId,
  signatoryName,
  signatoryPosition,
}: {
  jobCardId: string;
  signatoryName?: string;
  signatoryPosition?: string;
}) {
  const router = useRouter();

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

      // Enhanced CSS for proper table borders and margins
      const enhancedStyles = `
        @page { size: A4; margin: 20mm; }
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
          color: #111;
          line-height: 1.5;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        * { box-sizing: border-box; }

        /* Layout and spacing */
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-between { justify-content: space-between; }
        .justify-center { justify-content: center; }
        .justify-start { justify-content: flex-start; }
        .mb-1 { margin-bottom: 0.25rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-4 { margin-top: 1rem; }
        .my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
        .my-4 { margin-top: 1rem; margin-bottom: 1rem; }
        .my-6 { margin-top: 1.5rem; margin-bottom: 1.5rem; }
        .p-2 { padding: 0.5rem; }
        .p-6 { padding: 1.5rem; }
        .px-4 { padding-left: 1rem; padding-right: 1rem; }
        .px-8 { padding-left: 2rem; padding-right: 2rem; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
        .pt-2 { padding-top: 0.5rem; }
        .pt-4 { padding-top: 1rem; }
        .pb-2 { padding-bottom: 0.5rem; }

        /* Grid layouts */
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .gap-4 { gap: 1rem; }

        /* Typography */
        .text-xs { font-size: 0.75rem; line-height: 1rem; }
        .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
        .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
        .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
        .text-2xl { font-size: 1.5rem; line-height: 2rem; }
        .font-medium { font-weight: 500; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }
        .tracking-wider { letter-spacing: 0.05em; }

        /* Colors */
        .text-gray-500 { color: #6b7280; }
        .text-gray-600 { color: #4b5563; }
        .text-gray-700 { color: #374151; }
        .text-gray-800 { color: #1f2937; }
        .text-blue-600 { color: #2563eb; }
        .bg-gray-50 { background-color: #f9fafb; }
        .bg-white { background-color: #ffffff; }

        /* Borders */
        .border { border-width: 1px; }
        .border-t { border-top-width: 1px; }
        .border-b { border-bottom-width: 1px; }
        .border-l { border-left-width: 1px; }
        .border-gray-300 { border-color: #d1d5db; }
        .border-gray-400 { border-color: #9ca3af; }
        .border-collapse { border-collapse: collapse; }

        /* Table specific styles */
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.5rem 0 1.5rem 0;
        }
        th, td {
          border: 1px solid #d1d5db;
          padding: 0.75rem 1rem;
          text-align: left;
          font-size: 0.875rem;
          line-height: 1.25rem;
        }
        th {
          background-color: #f9fafb;
          font-weight: 600;
          color: #374151;
        }
        td {
          color: #111;
        }
        .text-right { text-align: right; }

        /* Container styles */
        .shadow {
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }
        .rounded { border-radius: 0.25rem; }
        .rounded-lg { border-radius: 0.5rem; }

        /* Image styles */
        img {
          max-width: 100%;
          height: auto;
        }
        .h-12 { height: 3rem; }
        .h-20 { height: 5rem; }
        .h-40 { height: 10rem; }
        .w-20 { width: 5rem; }
        .w-40 { width: 10rem; }
        .w-auto { width: auto; }
        .mx-auto { margin-left: auto; margin-right: auto; }

        /* Flex utilities */
        .flex-1 { flex: 1 1 0%; }

        /* Print-specific styles */
        @media print {
          .no-print { display: none !important; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .page-break { page-break-before: always; }
          .no-break { page-break-inside: avoid; }
        }

        /* QR Code styles */
        .qr-box {
          width: 140px;
          text-align: center;
          margin-top: 1rem;
        }
        .qr-box img {
          width: 120px;
          height: 120px;
          margin-bottom: 0.5rem;
        }

        /* Signature styles */
        .signature-wrap {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #d1d5db;
        }
        .sign-box {
          flex: 1;
          text-align: center;
        }
        .sign-line {
          border-bottom: 1px solid #000;
          margin-bottom: 0.5rem;
          width: 200px;
          margin: 0 auto 0.5rem auto;
        }
        .sign-name {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .muted {
          color: #6b7280;
          font-size: 0.75rem;
        }
      `;

      const logoUrl = "/goldbod-logo.webp";
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
        "https://goldbod.gov.gh/"
      )}`;

      const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Gold Assay Invoice</title>
  ${stylesheets}
  <style>${enhancedStyles}</style>
</head>
<body>
  <div class="bg-white shadow rounded-lg p-6">
    ${clonedContent.innerHTML}
  </div>

  <div class="signature-wrap">
    <div class="sign-box">
      <div class="sign-line"></div>
      <div class="sign-name">${signatoryName || "Authorized Signatory"}</div>
      <div class="muted">${signatoryPosition || "Designation"}</div>
    </div>
    <div class="qr-box">
      <img src="${qrUrl}" alt="QR Code - Visit GoldBod Website" style="width: 120px; height: 120px; margin-bottom: 0.5rem;" />
      <div class="muted">Scan to verify<br/>https://goldbod.gov.gh/</div>
    </div>
  </div>
</body>
</html>`;

      const w = window.open("", "_blank");
      if (!w) {
        alert("Please allow popups to download the invoice.");
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => {
        try {
          w.print();
        } catch (e) {
          console.error(e);
        }
      }, 500);
    } catch (e) {
      console.error(e);
      alert("Failed to generate invoice for printing.");
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* <BackLink href={`/job-cards/${jobCardId}`} label="Back to Job Card" /> */}

      <button
        onClick={() => {
          try {
            downloadInvoice();
          } catch (e) {
            console.error(e);
            alert("Failed to download invoice.");
          }
        }}
        className="inline-flex items-center px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
      >
        <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
        Download
      </button>
    </div>
  );
}
