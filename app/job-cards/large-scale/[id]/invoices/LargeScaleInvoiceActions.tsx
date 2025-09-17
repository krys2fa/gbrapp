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

      // Use a branded header and print-focused styles; include QR code and signature block
      const logoUrl = "/goldbod-logo.webp";
      const qrUrl = encodeURI(
        "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://goldbod.gov.gh/"
      );
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Large Scale Invoice</title><style>
        @page { size: A4; margin: 20mm }
        html,body{height:100%;margin:0;padding:0;}
        body{font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif;color:#111;line-height:1.5;}
        *{box-sizing:border-box;}

        /* Header Layout */
        .flex{display:flex;}
        .items-center{align-items:center;}
        .justify-between{justify-content:space-between;}
        .mb-1{margin-bottom:0.25rem;}
        .px-8{padding-left:2rem;padding-right:2rem;}

        /* Logo and Title Section */
        .p-2{padding:0.5rem;}
        .h-12{height:3rem;}
        .w-auto{width:auto;}
        .flex-1{flex:1 1 0%;}
        .justify-center{justify-content:center;}
        .text-xl{font-size:1.25rem;line-height:1.75rem;}
        .font-bold{font-weight:700;}
        .tracking-wider{letter-spacing:0.05em;}

        /* Grid Layouts */
        .grid{display:grid;}
        .grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr));}
        .gap-4{gap:1rem;}
        .mb-6{margin-bottom:1.5rem;}

        /* Text Styles */
        .text-sm{font-size:0.875rem;line-height:1.25rem;}
        .text-gray-500{color:#6b7280;}
        .font-medium{font-weight:500;}

        /* Table Styles */
        .table-auto{table-layout:auto;}
        .border-collapse{border-collapse:collapse;}
        .border{border-width:1px;}
        .border-gray-300{border-color:#d1d5db;}
        .bg-gray-50{background-color:#f9fafb;}
        .py-3{padding-top:0.75rem;padding-bottom:0.75rem;}
        .px-4{padding-left:1rem;padding-right:1rem;}
        .text-left{text-align:left;}
        .text-right{text-align:right;}
        .font-medium{font-weight:500;}
        .text-gray-700{color:#374151;}

        /* Content Container */
        .bg-white{background-color:#ffffff;}
        .shadow{box-shadow:0 1px 3px 0 rgba(0, 0, 0, 0.1),0 1px 2px 0 rgba(0, 0, 0, 0.06);}
        .rounded{border-radius:0.25rem;}
        .p-6{padding:1.5rem;}

        /* Spacing */
        .mb-4{margin-bottom:1rem;}
        .pt-4{padding-top:1rem;}
        .border-t{border-top-width:1px;}
        .text-lg{font-size:1.18rem;}
        .font-semibold{font-weight:600;}

        /* Hide elements not needed for print */
        .no-print{display:none;}

        /* Ensure images don't break layout */
        img{max-width:100%;height:auto;}

        /* Page break controls */
        .page-break{page-break-before:always;}
        .no-break{page-break-inside:avoid;}
      </style></head><body>
        .qr-box{width:140px;text-align:center}
        .qr-box img{width:120px;height:120px}
        @media print{ .no-print{display:none} }
      </style></head><body>
        <div>${content.innerHTML}</div>

        <div class="signature-wrap">
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-name">${
              signatoryName || "Authorized Signatory"
            }</div>
            <div class="muted">${signatoryPosition || "Designation"}</div>
          </div>
          <div class="qr-box">
            <img src="${qrUrl}" alt="QR code linking to goldbod.gov.gh" />
            <div class="muted" style="margin-top:8px;font-size:12px">Scan to verify<br/>https://goldbod.gov.gh/</div>
          </div>
        </div>
      </body></html>`;

      const w = window.open("", "_blank");
      if (!w) {
        alert("Please allow popups to download the invoice.");
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
