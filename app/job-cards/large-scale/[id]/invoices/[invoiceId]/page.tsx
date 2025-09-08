import React from "react";
import HistoryBackLink from "@/app/components/ui/HistoryBackLink";
import { prisma } from "@/app/lib/prisma";
import LargeScaleInvoiceActions from "../LargeScaleInvoiceActions"; // client component

function formatCurrency(value: number | null | undefined, code = "GHS") {
  const v = Number(value || 0);
  return (
    `${code} ` +
    v.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function formatDate(d?: Date | string | null) {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString();
}

export default async function LargeScaleInvoicePage(props: any) {
  // `params` may be a promise in Next.js server components; await before using
  const { id: jobCardId, invoiceId } = (await props.params) as {
    id: string;
    invoiceId: string;
  };

  // Load the invoice and only the related fields needed for rendering (defensive)
  let invoice: any = null;
  try {
    invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        invoiceNumber: true,
        largeScaleJobCardId: true,
        assayUsdValue: true,
        assayGhsValue: true,
        amount: true,
        rate: true,
        issueDate: true,
        createdAt: true,
        notes: true,
        // Include calculated fields
        grandTotal: true,
        subTotal: true,
        covid: true,
        getfund: true,
        nhil: true,
        rateCharge: true,
        totalInclusive: true,
        totalExclusive: true,
        vat: true,
        exchangeRate: true,
        currency: { select: { id: true, code: true, symbol: true } },
        invoiceType: { select: { id: true, name: true, description: true } },
        largeScaleJobCard: {
          select: {
            id: true,
            referenceNumber: true,
            destinationCountry: true,
            exporter: { select: { id: true, name: true } },
            assays: {
              select: {
                id: true,
                method: true,
                dateOfAnalysis: true,
                comments: true,
                totalCombinedValue: true,
                totalValueGhs: true,
                measurements: true,
              },
            },
          },
        },
      },
    });
  } catch (e) {
    // Log error server-side but don't expose to client
    console.log("Failed to load large scale invoice for invoice page:", e);
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <p>Failed to load invoice data. Please try again later.</p>
        <HistoryBackLink label="Back" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <p>Invoice not found.</p>
        <HistoryBackLink label="Back" />
      </div>
    );
  }

  // Use stored values from database
  const assayUsdValue = invoice.assayUsdValue || 0;
  const assayGhsValue = invoice.assayGhsValue || 0;
  const exchangeRate = invoice.exchangeRate || 0;

  // Use calculated values from database
  const grandTotal = invoice.grandTotal || 0;
  const subTotal = invoice.subTotal || 0;
  const covid = invoice.covid || 0;
  const getfund = invoice.getfund || 0;
  const nhil = invoice.nhil || 0;
  const rate = invoice.rate || 0;
  const totalInclusive = invoice.totalInclusive || 0;
  const totalExclusive = invoice.totalExclusive || 0;
  const vat = invoice.vat || 0;

  // Get job card data
  const jobCardData = invoice.largeScaleJobCard;

  // Assay number(s): join assay IDs of linked assays if present
  const assayNumbers =
    (jobCardData?.assays || [])
      .map((a: any) => `Assay-${a.id.slice(-8)}`)
      .filter(Boolean)
      .join(", ") || "-";

  const exporterName = jobCardData?.exporter?.name || "-";
  const destinationCountry = jobCardData?.destinationCountry || "-";
  const referenceNumber =
    jobCardData?.referenceNumber || invoice.largeScaleJobCardId || jobCardId;

  // derive signatory info from first linked assay if available
  const firstAssay: any =
    jobCardData?.assays && jobCardData.assays.length > 0
      ? jobCardData.assays[0]
      : null;
  const signatoryName =
    firstAssay?.signatory || firstAssay?.comments?.signatory || null;
  const signatoryPosition =
    firstAssay?.comments?.signatoryPosition ||
    firstAssay?.comments?.designation ||
    null;

  return (
    <>
      <div className="my-4 ml-4">
        <HistoryBackLink label="Back" />
      </div>
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">
            Invoice #{invoice.invoiceNumber}
          </h1>
          {/* Client actions: back + download */}
          <LargeScaleInvoiceActions
            jobCardId={jobCardId}
            signatoryName={signatoryName}
            signatoryPosition={signatoryPosition}
          />
        </div>

        <div className="bg-white shadow rounded-lg p-6" id="invoice-content">
          <div className="flex items-center justify-between mb-1 px-8">
            <div className="p-2">
              <img
                src="/goldbod-logo-black.png"
                alt="GoldBod Logo"
                className="h-12 w-auto"
              />
            </div>

            <div className="flex justify-center">
              <h1 className="text-xl font-bold tracking-wider">
                ASSAY INVOICE
              </h1>
            </div>

            <div className="bg-white p-4">
              <img
                src="/coat-of-arms.jpg"
                alt="Coat of Arms"
                className="h-20 w-auto"
              />
            </div>

            <div className="bg-white p-4">
              <img src="/seal.png" alt="Seal" className="h-20 w-auto" />
            </div>
          </div>
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
              <p className="font-medium">{referenceNumber}</p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Assay Rate</p>
              <p className="font-medium">{rate}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Destination</p>
              <p className="font-medium">{destinationCountry}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">Exchange Rate</p>
            <p className="font-medium">{exchangeRate}</p>
          </div>

          <table className="w-full mt-2 mb-6 table-auto border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 items-center text-sm font-medium text-gray-700 border border-gray-300">
                  Description
                </th>
                <th className="py-3 px-4 items-center text-sm font-medium text-gray-700 border border-gray-300">
                  Assay value (USD)
                </th>
                <th className="py-3 px-4 items-center text-sm font-medium text-gray-700 border border-gray-300">
                  Assay value (GHS)
                </th>
                <th className="py-3 px-4 items-center text-sm font-medium text-gray-700 border border-gray-300">
                  Rate %
                </th>
                <th className="py-3 px-4 items-center text-sm font-medium text-gray-700 border border-gray-300">
                  Total - Inclusive (GHS)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-4 font-medium items-center border border-gray-300">
                  Assay Service Fee
                </td>
                <td className="py-2 px-4 font-medium text-right border border-gray-300">
                  {assayUsdValue.toLocaleString()}
                </td>
                <td className="py-2 px-4 font-medium text-right border border-gray-300">
                  {assayGhsValue.toLocaleString()}
                </td>
                <td className="py-2 px-4 font-medium text-right border border-gray-300">
                  {rate.toLocaleString()}
                </td>
                <td className="py-2 px-4 font-medium text-right border border-gray-300">
                  {totalInclusive.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2 text-center">
              Total - Exclusive (GHS)
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
              <div className="text-gray-600 text">Total - Exclusive</div>
              <div className="font-medium text-right">
                {formatCurrency(totalExclusive, "GHS")}
              </div>
            </div>
            <h3 className="text-sm font-medium mb-2 text-center">
              Levies & Taxes
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-600">NHIL (2.5%)</div>
              <div className="font-medium text-right">
                {formatCurrency(nhil, "GHS")}
              </div>
              <div className="text-gray-600">GETFund (2.5%)</div>
              <div className="font-medium text-right">
                {formatCurrency(getfund, "GHS")}
              </div>
              <div className="text-gray-600">COVID (1%)</div>
              <div className="font-medium text-right">
                {formatCurrency(covid, "GHS")}
              </div>

              <div className="text-gray-700 font-medium border-t border-gray-300 pt-2 mt-2">
                Subtotal
              </div>
              <div className="font-semibold text-right border-t border-gray-300 pt-2 mt-2">
                {formatCurrency(subTotal, "GHS")}
              </div>
              <div className="text-gray-600">VAT (15%)</div>
              <div className="font-medium text-right">
                {formatCurrency(vat, "GHS")}
              </div>
              <div className="text-gray-700 font-medium border-t border-gray-300 pt-2 mt-2">
                Total
              </div>
              <div className="font-semibold text-right border-t border-gray-300 pt-2 mt-2">
                {formatCurrency(grandTotal, "GHS")}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t text-left">
            <p className="text-lg font-bold flex justify-between">
              <span>Grand Total:</span> {formatCurrency(grandTotal, "GHS")}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
