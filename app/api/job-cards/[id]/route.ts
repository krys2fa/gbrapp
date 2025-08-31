import { Role } from "@/app/generated/prisma";
import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Helper to extract ID from the URL
function getIdFromUrl(req: NextRequest): string | null {
  try {
    // Extract the ID from the URL pathname
    const pathname = req.nextUrl.pathname;
    const segments = pathname.split("/");
    // The ID should be the last segment
    const id = segments[segments.length - 1];
    return id || null;
  } catch (error) {
    console.error("Error extracting ID from URL:", error);
    return null;
  }
}

/**
 * GET handler for fetching a single job card
 */
export async function GET(req: NextRequest) {
  try {
    const id = await getIdFromUrl(req);
    console.log("GET request for job card with ID:", id);

    // Ensure id exists
    if (!id) {
      return NextResponse.json(
        { error: "Job card ID is required" },
        { status: 400 }
      );
    }

    const jobCard = await prisma.jobCard.findUnique({
      where: { id },
      include: {
        exporter: {
          include: {
            exporterType: true,
          },
        },
        shipmentType: true,
        customsOfficer: true,
        nacobOfficer: true,
        securityOfficer: true,
        assayOfficer: true,
        technicalDirector: true,
        seals: true,
        assays: {
          include: {
            measurements: true,
          },
        },
        invoices: true,
        fees: true,
        levies: true,
      },
    });

    if (!jobCard) {
      return NextResponse.json(
        { error: "Job card not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(jobCard);
  } catch (error) {
    console.error("Error fetching job card:", error);
    return NextResponse.json(
      { error: "Error fetching job card" },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a job card
 */
export async function PUT(req: NextRequest) {
  try {
    const id = getIdFromUrl(req);
    console.log("PUT request for job card with ID:", id);

    if (!id) {
      return NextResponse.json(
        { error: "Missing job card ID" },
        { status: 400 }
      );
    }

    // Check if job card exists first
    const existingJobCard = await prisma.jobCard.findUnique({
      where: { id },
    });

    if (!existingJobCard) {
      return NextResponse.json(
        { error: "Job card not found" },
        { status: 404 }
      );
    }

    // Get the data from the request
    const requestData = await req.json();
    console.log("Received update data:", JSON.stringify(requestData, null, 2));

    // Create update object with all the provided fields
    const updateData: any = {};

    // Update only the fields that are provided and belong to JobCard model
    if (requestData.referenceNumber !== undefined) {
      updateData.referenceNumber = requestData.referenceNumber;
    }
    if (requestData.receivedDate !== undefined) {
      updateData.receivedDate = new Date(requestData.receivedDate);
    }
    if (requestData.exporterId !== undefined) {
      updateData.exporterId = requestData.exporterId;
    }
    if (requestData.shipmentTypeId !== undefined) {
      updateData.shipmentTypeId = requestData.shipmentTypeId;
    }
    if (requestData.status !== undefined) {
      updateData.status = requestData.status;
    }
    if (requestData.notes !== undefined) {
      updateData.notes = requestData.notes;
    }
    // Add all the new fields from the form
    if (requestData.unitOfMeasure !== undefined) {
      updateData.unitOfMeasure = requestData.unitOfMeasure;
    }
    if (requestData.idType !== undefined) {
      updateData.idType = requestData.idType;
    }
    if (requestData.buyerIdNumber !== undefined) {
      updateData.buyerIdNumber = requestData.buyerIdNumber;
    }
    if (requestData.buyerName !== undefined) {
      updateData.buyerName = requestData.buyerName;
    }
    if (requestData.buyerPhone !== undefined) {
      updateData.buyerPhone = requestData.buyerPhone;
    }
    if (requestData.exporterPricePerOz !== undefined) {
      updateData.exporterPricePerOz = parseFloat(
        requestData.exporterPricePerOz
      );
    }
    if (requestData.teamLeader !== undefined) {
      updateData.teamLeader = requestData.teamLeader;
    }
    if (requestData.totalGrossWeight !== undefined) {
      updateData.totalGrossWeight = parseFloat(requestData.totalGrossWeight);
    }
    if (requestData.destinationCountry !== undefined) {
      updateData.destinationCountry = requestData.destinationCountry;
    }
    if (requestData.fineness !== undefined) {
      updateData.fineness = parseFloat(requestData.fineness);
    }
    if (requestData.sourceOfGold !== undefined) {
      updateData.sourceOfGold = requestData.sourceOfGold;
    }
    if (requestData.totalNetWeight !== undefined) {
      updateData.totalNetWeight = parseFloat(requestData.totalNetWeight);
    }
    if (requestData.totalNetWeightOz !== undefined) {
      updateData.totalNetWeightOz = parseFloat(requestData.totalNetWeightOz);
    }
    if (requestData.numberOfPersons !== undefined) {
      updateData.numberOfPersons = parseInt(requestData.numberOfPersons);
    }
    if (requestData.exporterValueUsd !== undefined) {
      updateData.exporterValueUsd = parseFloat(requestData.exporterValueUsd);
    }
    if (requestData.exporterValueGhs !== undefined) {
      updateData.exporterValueGhs = parseFloat(requestData.exporterValueGhs);
    }
    if (requestData.graDeclarationNumber !== undefined) {
      updateData.graDeclarationNumber = requestData.graDeclarationNumber;
    }
    if (requestData.numberOfBoxes !== undefined) {
      updateData.numberOfBoxes = parseInt(requestData.numberOfBoxes);
    }
    if (requestData.remittanceType !== undefined) {
      updateData.remittanceType = requestData.remittanceType;
    }

    console.log("Updating with data:", updateData);

    // If assays array is provided, persist any new/local assays to the DB
    const createdAssayIds: string[] = [];
    if (Array.isArray(requestData.assays) && requestData.assays.length > 0) {
      for (const assayItem of requestData.assays) {
        try {
          // Only create assays that look local (no id or local- prefix)
          const isLocal =
            !assayItem.id || String(assayItem.id).startsWith("local-");
          if (!isLocal) continue;

          // Compute average fineness from measurements if available
          let avgFineness = 0;
          if (
            Array.isArray(assayItem.measurements) &&
            assayItem.measurements.length > 0
          ) {
            const vals = assayItem.measurements
              .map((m: any) => Number(m.fineness || 0))
              .filter((v: number) => !isNaN(v));
            if (vals.length > 0)
              avgFineness =
                vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
          }

          const created = await prisma.assay.create({
            data: {
              jobCardId: id,
              comments:
                typeof assayItem.comments === "string"
                  ? assayItem.comments
                  : JSON.stringify({
                      method: assayItem.method,
                      pieces: assayItem.pieces,
                      signatory: assayItem.signatory,
                      measurements: assayItem.measurements,
                    }),
              assayDate: assayItem.createdAt
                ? new Date(assayItem.createdAt)
                : new Date(),
              goldContent: avgFineness || 0,
              silverContent: 0,
              certificateNumber: `CERT-${Date.now()}-${Math.floor(
                Math.random() * 1000
              )}`,
              // create measurement rows if provided
              measurements: Array.isArray(assayItem.measurements)
                ? {
                    create: assayItem.measurements.map(
                      (m: any, idx: number) => ({
                        pieceNumber: Number(m.piece) || idx + 1,
                        grossWeight: m.grossWeight
                          ? Number(m.grossWeight)
                          : undefined,
                        waterWeight: m.waterWeight
                          ? Number(m.waterWeight)
                          : undefined,
                        fineness: m.fineness ? Number(m.fineness) : undefined,
                        netWeight: m.netWeight
                          ? Number(m.netWeight)
                          : undefined,
                      })
                    ),
                  }
                : undefined,
            },
          });
          // collect created assay id for invoice creation
          if (created && created.id) createdAssayIds.push(created.id);
        } catch (assayErr) {
          console.error("Failed to create assay record:", assayErr);
        }
      }

      // mark job card as completed unless a different status is provided
      updateData.status = requestData.status || "completed";
      // Create an invoice for the created assays (if any)
      try {
        if (createdAssayIds.length > 0) {
          // Determine invoice amount (prefer provided exporterValueUsd)
          const amountUsd =
            requestData.exporterValueUsd != null
              ? Number(requestData.exporterValueUsd)
              : 0;

          // Ensure an InvoiceType exists for assay invoices
          let invoiceType = await prisma.invoiceType.findUnique({
            where: { name: "Assay Invoice" },
          });
          if (!invoiceType) {
            invoiceType = await prisma.invoiceType.create({
              data: {
                name: "Assay Invoice",
                description: "Automatically generated invoice for valuation",
              },
            });
          }

          // Prefer USD currency when available
          let currency = await prisma.currency.findFirst({
            where: { code: "USD" },
          });
          if (!currency) {
            currency = await prisma.currency.findFirst();
          }

          if (currency) {
            const invoice = await prisma.invoice.create({
              data: {
                invoiceNumber: `INV-${Date.now()}-${Math.floor(
                  Math.random() * 1000
                )}`,
                jobCardId: id,
                invoiceTypeId: invoiceType.id,
                amount: Number(amountUsd) || 0,
                currencyId: currency.id,
                assays: {
                  connect: createdAssayIds.map((aid) => ({ id: aid })),
                },
                assayUsdValue: Number(amountUsd) || 0,
                assayGhsValue:
                  Number(requestData.exporterValueGhs) ||
                  0,
                rate: 1,
                issueDate: new Date(),
                status: "pending",
              },
            });
            console.debug("Created invoice for assays", invoice.id);
          } else {
            console.debug("No currency found - skipping invoice creation");
          }
        }
      } catch (invoiceErr) {
        console.error("Failed to create invoice for assays:", invoiceErr);
      }
    }

    // If seals array or officer names are provided, persist seals and/or update notes
    if (
      (Array.isArray(requestData.seals) && requestData.seals.length > 0) ||
      requestData.customsOfficerName ||
      requestData.nacobOfficerName ||
      requestData.nationalSecurityName
    ) {
      // Append officer names to the notes field so we don't need DB migrations for officer relations here
      const parts: string[] = [];
      if (requestData.customsOfficerName) {
        parts.push(`Customs Officer: ${requestData.customsOfficerName}`);
      }
      if (requestData.nacobOfficerName) {
        parts.push(`NACOB Officer: ${requestData.nacobOfficerName}`);
      }
      if (requestData.nationalSecurityName) {
        parts.push(`National Security: ${requestData.nationalSecurityName}`);
      }

      if (parts.length > 0) {
        // preserve existing notes
        updateData.notes = [existingJobCard.notes || "", parts.join("; ")]
          .filter(Boolean)
          .join("\n");
      }

      // Persist any seals provided
      // Also persist officer names as Seal records so they're stored and associated to the job card
      try {
        // Upsert officer seals: if an officer seal of the expected type exists, update it; otherwise create
        const existingSeals = await prisma.seal.findMany({
          where: { jobCardId: id },
        });
        const findExisting = (sealType: string) =>
          existingSeals.find((s) => s.sealType === sealType) || null;
        if (requestData.customsOfficerName) {
          const existing = findExisting("CUSTOMS_SEAL");
          if (existing) {
            await prisma.seal.update({
              where: { id: existing.id },
              data: {
                sealNumber: String(requestData.customsOfficerName),
                notes: "Updated from sealing modal - customs officer",
              },
            });
          } else {
            await prisma.seal.create({
              data: {
                jobCardId: id,
                sealNumber: String(requestData.customsOfficerName),
                sealType: "CUSTOMS_SEAL",
                notes: "Saved from sealing modal - customs officer",
              },
            });
          }
        }
        if (requestData.nacobOfficerName) {
          // store NACOB as OTHER_SEAL to keep previous mapping
          const existing = findExisting("OTHER_SEAL");
          if (existing) {
            await prisma.seal.update({
              where: { id: existing.id },
              data: {
                sealNumber: String(requestData.nacobOfficerName),
                notes: "Updated from sealing modal - NACOB officer",
              },
            });
          } else {
            await prisma.seal.create({
              data: {
                jobCardId: id,
                sealNumber: String(requestData.nacobOfficerName),
                sealType: "OTHER_SEAL",
                notes: "Saved from sealing modal - NACOB officer",
              },
            });
          }
        }
        if (requestData.nationalSecurityName) {
          const existing = findExisting("OTHER_SEAL");
          if (existing) {
            await prisma.seal.update({
              where: { id: existing.id },
              data: {
                sealNumber: String(requestData.nationalSecurityName),
                notes: "Updated from sealing modal - national security",
              },
            });
          } else {
            await prisma.seal.create({
              data: {
                jobCardId: id,
                sealNumber: String(requestData.nationalSecurityName),
                sealType: "OTHER_SEAL",
                notes: "Saved from sealing modal - national security",
              },
            });
          }
        }
      } catch (officerSealErr) {
        console.error("Failed to persist officer seals:", officerSealErr);
      }

      if (Array.isArray(requestData.seals) && requestData.seals.length > 0) {
        for (const sealItem of requestData.seals) {
          try {
            // If an id is provided, update that seal. Otherwise create a new one.
            if (sealItem.id) {
              await prisma.seal.update({
                where: { id: sealItem.id },
                data: {
                  sealNumber: sealItem.sealNumber || undefined,
                  notes: sealItem.notes || undefined,
                  sealType: sealItem.sealType || undefined,
                },
              });
            } else {
              // Map sealType to allowed enum values; default to OTHER_SEAL
              const allowedTypes = ["CUSTOMS_SEAL", "PMMC_SEAL", "OTHER_SEAL"];
              const type = String(
                sealItem.sealType || "OTHER_SEAL"
              ).toUpperCase();
              const sealType = allowedTypes.includes(type)
                ? (type as any)
                : "OTHER_SEAL";
              await prisma.seal.create({
                data: {
                  jobCardId: id,
                  sealNumber:
                    sealItem.sealNumber ||
                    `SEAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                  sealType,
                  notes: sealItem.notes || undefined,
                },
              });
            }
          } catch (sealErr) {
            console.error("Failed to create seal record:", sealErr);
          }
        }
      }
    }

    try {
      // Update the job card with the provided data
      const updatedJobCard = await prisma.jobCard.update({
        where: { id },
        data: updateData,
        include: {
          exporter: true,
          shipmentType: true,
        },
      });

      // If assays were part of the request we just created, return the refreshed job card including assays/invoices
      if (Array.isArray(requestData.assays) && requestData.assays.length > 0) {
        const refreshed = await prisma.jobCard.findUnique({
          where: { id },
          include: {
            exporter: true,
            shipmentType: true,
            assays: true,
            invoices: true,
          },
        });
        return NextResponse.json(refreshed);
      }

      return NextResponse.json(updatedJobCard);
    } catch (updateError) {
      console.error("Error during update operation:", updateError);
      return NextResponse.json(
        {
          error: "Error updating job card",
          details:
            updateError instanceof Error
              ? updateError.message
              : String(updateError),
          stack: updateError instanceof Error ? updateError.stack : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error updating job card:", error);
    // Return detailed error information for debugging
    return NextResponse.json(
      {
        error: "Error updating job card",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        cause:
          error instanceof Error
            ? error.cause
              ? String(error.cause)
              : undefined
            : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting a job card
 */
export async function DELETE(req: NextRequest) {
  try {
    const id = getIdFromUrl(req);
    console.log("DELETE request for job card with ID:", id);

    if (!id) {
      return NextResponse.json(
        { error: "Missing job card ID" },
        { status: 400 }
      );
    }

    // Check if job card exists
    const existingJobCard = await prisma.jobCard.findUnique({
      where: { id },
    });

    if (!existingJobCard) {
      return NextResponse.json(
        { error: "Job card not found" },
        { status: 404 }
      );
    }

    // Delete the job card
    await prisma.jobCard.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Job card deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting job card:", error);
    return NextResponse.json(
      { error: "Error deleting job card" },
      { status: 500 }
    );
  }
}
