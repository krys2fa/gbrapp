"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

      // Use a branded header and print-focused styles; include QR code and signature block
      const logoUrl = "/goldbod-logo.webp";
      const qrUrl = encodeURI(
        "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://goldbod.gov.gh/"
      );
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice</title><style>
        @page { size: A4; margin: 20mm }
        html,body{height:100%;}
        body{font-family:Segoe UI,Roboto,Arial,sans-serif;padding:16px;color:#111;box-sizing:border-box}
        .invoice-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
        .brand{display:flex;align-items:center;gap:12px}
        .brand img{height:48px}
        .company{font-size:14px;font-weight:600}
        h1,h2,h3{margin:0 0 8px}
        table{width:100%;border-collapse:collapse;margin-top:12px}
        th,td{border:1px solid #e5e7eb;padding:10px;text-align:left}
        th{background:#f9fafb;font-weight:600}
        .totals td{border:none;padding:6px}
        .right{text-align:right}
        .muted{color:#6b7280;font-size:13px}
        .signature-wrap{display:flex;justify-content:space-between;align-items:flex-start;margin-top:28px;gap:16px}
        .sign-box{width:55%;border-top:1px solid #e5e7eb;padding-top:24px}
        .sign-line{height:40px;border-bottom:1px dashed #cbd5e1;margin-bottom:8px}
        .sign-name{font-weight:600}
        .qr-box{width:140px;text-align:center}
        .qr-box img{width:120px;height:120px}
        @media print{ .no-print{display:none} }
      </style></head><body>
        <div class="invoice-header">
          <div class="brand">
            <img src="${logoUrl}" alt="Company logo" />
            <div>
              <div class="company">Gold Bod Assayers</div>
              <div class="muted">Valuation &amp; Assaying Services</div>
            </div>
          </div>
          <div class="muted">Generated: ${new Date().toLocaleString()}</div>
        </div>
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
      {/* <Link
        href={`/job-cards/${jobCardId}`}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        ← Back to Job Card
      </Link> */}

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
        Download
      </button>
    </div>
  );
}
