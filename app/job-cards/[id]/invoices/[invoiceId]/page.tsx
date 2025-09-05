import React from "react";
import BackLink from "@/app/components/ui/BackLink";
import HistoryBackLink from "@/app/components/ui/HistoryBackLink";
import { prisma } from "@/app/lib/prisma";
import InvoiceActions from "@/app/job-cards/[id]/invoices/InvoiceActions"; // client component

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

export default async function InvoicePage(props: any) {
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
        jobCardId: true,
        assayUsdValue: true,
        assayGhsValue: true,
        amount: true,
        rate: true,
        issueDate: true,
        createdAt: true,
        notes: true,
        currency: { select: { id: true, code: true, symbol: true } },
        invoiceType: { select: { id: true, name: true, description: true } },
        assays: {
          select: {
            id: true,
            certificateNumber: true,
            assayDate: true,
            comments: true,
          },
        },
        jobCard: {
          select: {
            id: true,
            referenceNumber: true,
            destinationCountry: true,
            exporter: { select: { id: true, name: true } },
          },
        },
      },
    });
  } catch (e) {
    // Log error server-side but don't expose to client
    console.log("Failed to load invoice for invoice page:", e);
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

  // Daily commodity price: pick latest commodity price (best-effort)
  const dailyPrice = await prisma.dailyPrice.findFirst({
    where: { type: "COMMODITY" },
    include: { commodity: true },
    orderBy: { createdAt: "desc" },
  });


  // Use invoice stored assay values (assayUsdValue and assayGhsValue)
  // Prefer per-assay saved meta if present
  let assayUsdValue = Number(invoice.assayUsdValue || 0);
  let assayGhsValue = Number(invoice.assayGhsValue || 0);
  let exchangeRate = 0;
  if (
    (!assayUsdValue || !assayGhsValue) &&
    invoice.assays &&
    invoice.assays.length
  ) {
    // try to use first linked assay's comments.meta
    try {
      const a = invoice.assays[0];
      let meta: any = null;
      if (a?.comments) {
        if (typeof a.comments === "string") {
          meta = JSON.parse(a.comments || "{}")?.meta;
        } else {
          meta = (a.comments as any)?.meta;
        }
      }
      if (meta) {
        if (meta.valueUsd) assayUsdValue = Number(meta.valueUsd);
        if (meta.valueGhs) assayGhsValue = Number(meta.valueGhs);
        if (meta.exchangeRate) exchangeRate = Number(meta.exchangeRate);
      }
    } catch (e) {
      // ignore
    }
  }

  // Round assay values to 2 decimal places
  assayUsdValue = Number(assayUsdValue.toFixed(2));
  assayGhsValue = Number(assayGhsValue.toFixed(2));
  exchangeRate = Number(exchangeRate.toFixed(2));

  // If no exchange rate from assay, get daily exchange rate for invoice date
  if (exchangeRate === 0) {
    const invoiceDate = invoice.issueDate || invoice.createdAt;
    try {
      // Get the start and end of the invoice date
      const startOfDay = new Date(invoiceDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(invoiceDate);
      endOfDay.setHours(23, 59, 59, 999);

      const dailyExchangeRate = await prisma.dailyPrice.findFirst({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (dailyExchangeRate) {
        exchangeRate = Number(dailyExchangeRate.price);
      }
    } catch (error) {
      // Silently handle exchange rate fetch failure
      // Rate will remain 0 if not found
    }
  }

  // Fixed rates
  const rate = 0.258;
  const inclusiveVatRate = 1.219;
  const nhilRate = 0.025; // 2.5%
  const getfundRate = 0.025; // 2.5%
  const covidRate = 0.01; // 1%
  const vatRate = 0.15; // 15%
  const totalInclusive = Number(((assayGhsValue * rate) / 100).toFixed(2));
  const totalExclusive = Number((totalInclusive / inclusiveVatRate).toFixed(2));

  // Assay Service Charge
  const rateCharge = totalInclusive;

  // Levies/Taxes (percentages of assay value in GHS)
  const nhil = Number((totalExclusive * nhilRate).toFixed(2)); // 2.5%
  const getfund = Number((totalExclusive * getfundRate).toFixed(2)); // 2.5%
  const covid = Number((totalExclusive * covidRate).toFixed(2)); // 1%
  const subTotal = Number((totalExclusive + nhil + getfund + covid).toFixed(2));
  const vat = Number((subTotal * vatRate).toFixed(2)); // 15%
  const grandTotal = subTotal + vat;

  // Update invoice amount if it doesn't match the calculated amount
  if (invoice.amount !== grandTotal) {
    try {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { amount: grandTotal },
      });
      // Update the local invoice object to reflect the change
      invoice.amount = grandTotal;
    } catch (error) {
      // Silently handle invoice amount update failure
      // Invoice will display with the calculated amount even if DB update fails
    }
  }

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
        <HistoryBackLink label="Back" />
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
              <p className="font-medium">{invoice.jobCardId || jobCardId}</p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Assay Rate</p>
              <p className="font-medium">{rate}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Destination</p>
              <p className="font-medium">
                {invoice.jobCard?.destinationCountry || "-"}
              </p>
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
                  {rateCharge.toLocaleString()}
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
