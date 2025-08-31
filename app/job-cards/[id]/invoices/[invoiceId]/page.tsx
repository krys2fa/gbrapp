import React from "react";
import Link from "next/link";
import BackLink from "@/app/components/ui/BackLink";
import { prisma } from "@/app/lib/prisma";
import InvoiceActions from "@/app/job-cards/[id]/invoices/InvoiceActions"; // client component

function formatCurrency(value: number | null | undefined, code = "GHS") {
  const v = Number(value || 0);
  return (
    v.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ` ${code}`
  );
}

function formatDate(d?: Date | string | null) {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString();
}

export default async function InvoicePage(props: any) {
  // `params` may be a promise in Next.js server components; await before using
  const { id: jobCardId, invoiceId } = (await props.params) as {
    id: string;
    invoiceId: string;
  };

  // Load the invoice and related data
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      jobCard: { include: { exporter: true } },
      currency: true,
      invoiceType: true,
      assays: true,
    },
  });

  if (!invoice) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <p>Invoice not found.</p>
        <BackLink href={`/job-cards/${jobCardId}`} label="Back to Job Card" />
      </div>
    );
  }

  // Daily commodity price: pick latest commodity price (best-effort)
  const dailyPrice = await prisma.dailyPrice.findFirst({
    where: { type: "COMMODITY" },
    include: { commodity: true },
    orderBy: { createdAt: "desc" },
  });

  const dailyRate = dailyPrice?.price || 0;
  const dailyCommodityName = dailyPrice?.commodity?.name || "Commodity";

  // Use invoice stored assay values (assayUsdValue and assayGhsValue)
  const assayUsdValue = Number(invoice.assayUsdValue || 0);
  const assayGhsValue = Number(invoice.assayGhsValue || 0);

  // Fixed rate as requested
  const rate = 0.258;
  const rateCharge = assayGhsValue * rate;
  const totalInclusive = assayGhsValue + rateCharge;

  // Levies/Taxes (percentages of assay value in GHS)
  const nhil = assayGhsValue * 0.025; // 2.5%
  const getfund = assayGhsValue * 0.025; // 2.5%
  const covid = assayGhsValue * 0.01; // 1%
  const vat = assayGhsValue * 0.15; // 15%

  // Assay number(s): join certificate numbers of linked assays if present
  const assayNumbers =
    (invoice.assays || [])
      .map((a: any) => a.certificateNumber)
      .filter(Boolean)
      .join(", ") || "-";

  const exporterName = invoice.jobCard?.exporter?.name || "-";

  // derive signatory info from first linked assay if available
  const firstAssay: any =
    invoice.assays && invoice.assays.length > 0 ? invoice.assays[0] : null;
  const signatoryName =
    firstAssay?.signatory || firstAssay?.comments?.signatory || null;
  const signatoryPosition =
    firstAssay?.comments?.signatoryPosition ||
    firstAssay?.comments?.designation ||
    null;

  return (
    <>
      <div className="my-4 ml-4">
        <BackLink href={`/job-cards/${jobCardId}`} label="Back to Job Card" />
      </div>
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">
            Invoice #{invoice.invoiceNumber}
          </h1>
          {/* Client actions: back + download */}
          <InvoiceActions
            jobCardId={jobCardId}
            signatoryName={signatoryName}
            signatoryPosition={signatoryPosition}
          />
        </div>

        <div className="bg-white shadow rounded-lg p-6" id="invoice-content">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">
                {formatDate(invoice.issueDate || invoice.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Assay Number</p>
              <p className="font-medium">{assayNumbers}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Exporter</p>
              <p className="font-medium">{exporterName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Job Card ID</p>
              <p className="font-medium">{invoice.jobCardId || jobCardId}</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-500">Description</p>
            <p className="font-medium">
              {invoice.notes ||
                invoice.invoiceType?.description ||
                invoice.invoiceType?.name ||
                "Assay Invoice"}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">
                Daily price ({dailyCommodityName})
              </p>
              <p className="font-medium">
                {dailyRate.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Rate (fixed)</p>
              <p className="font-medium">{rate}</p>
            </div>
          </div>

          <table className="w-full mb-6 table-auto">
            <tbody>
              <tr>
                <td className="py-2 text-sm text-gray-600">
                  Assay value (USD)
                </td>
                <td className="py-2 font-medium text-right">
                  {formatCurrency(
                    assayUsdValue,
                    invoice.currency?.code || "USD"
                  )}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-sm text-gray-600">
                  Assay value (GHS)
                </td>
                <td className="py-2 font-medium text-right">
                  {formatCurrency(
                    assayGhsValue,
                    invoice.currency?.code || "GHS"
                  )}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-sm text-gray-600">
                  Rate charge (rate * assay value GHS)
                </td>
                <td className="py-2 font-medium text-right">
                  {formatCurrency(rateCharge, invoice.currency?.code || "GHS")}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-sm text-gray-600">
                  Total (inclusive of rate)
                </td>
                <td className="py-2 font-medium text-right">
                  {formatCurrency(
                    totalInclusive,
                    invoice.currency?.code || "GHS"
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">
              Levies & Taxes (calculated from assay value in GHS)
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-600">NHIL (2.5%)</div>
              <div className="font-medium text-right">
                {formatCurrency(nhil, invoice.currency?.code || "GHS")}
              </div>
              <div className="text-gray-600">GETFund (2.5%)</div>
              <div className="font-medium text-right">
                {formatCurrency(getfund, invoice.currency?.code || "GHS")}
              </div>
              <div className="text-gray-600">COVID (1%)</div>
              <div className="font-medium text-right">
                {formatCurrency(covid, invoice.currency?.code || "GHS")}
              </div>
              <div className="text-gray-600">VAT (15%)</div>
              <div className="font-medium text-right">
                {formatCurrency(vat, invoice.currency?.code || "GHS")}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t text-right">
            <p className="text-sm text-gray-500">Amount due</p>
            <p className="text-2xl font-semibold">
              {formatCurrency(invoice.amount, invoice.currency?.code || "GHS")}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
