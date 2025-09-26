import { Role } from "@/app/generated/prisma";
import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { logger, LogCategory } from "@/lib/logger";
import { generateAssayNumber } from "@/lib/assay-number-generator";
import { withAuth } from "@/app/lib/with-auth";

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
    void logger.error(LogCategory.API, "Error extracting ID from URL", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * GET handler for fetching a single job card
 */
export async function GET(req: NextRequest) {
  try {
    const id = await getIdFromUrl(req);
    void logger.debug(LogCategory.JOB_CARD, "GET job card request", { id });

    // Ensure id exists
    if (!id) {
      return NextResponse.json(
        { error: "Job ID is required" },
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
        commodity: true,
        customsOfficer: true,
        assayOfficer: true,
        technicalDirector: true,
        seals: true,
        assays: {
          select: {
            id: true,
            jobCardId: true,
            assayOfficerId: true,
            technicalDirectorId: true,
            goldContent: true,
            silverContent: true,
            comments: true,
            assayDate: true,
            certificateNumber: true,
            remarks: true,
            measurements: true,
            grossWeight: true,
            fineness: true,
            netWeight: true,
            weightInOz: true,
            pricePerOz: true,
            totalUsdValue: true,
            totalGhsValue: true,
            commodityPrice: true,
            exchangeRate: true,
            securitySealNo: true,
            goldbodSealNo: true,
            customsSealNo: true,
            exporterSignatory: true,
            goldbodSignatory: true,
            shipmentTypeId: true,
            shipmentType: true,
            createdAt: true,
            updatedAt: true,
            assayOfficer: {
              select: {
                id: true,
                name: true,
              },
            },
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

    void logger.debug(LogCategory.JOB_CARD, "Job card fetched", {
      id: jobCard.id,
      referenceNumber: jobCard.referenceNumber,
      noteLength: String(jobCard.notes || "").length,
      assays: jobCard.assays?.map((a) => ({ id: a.id })),
    });

    return NextResponse.json(jobCard);
  } catch (error) {
    void logger.error(LogCategory.JOB_CARD, "Error fetching job card", {
      error: error instanceof Error ? error.message : String(error),
    });
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
    void logger.debug(LogCategory.JOB_CARD, "PUT job card request", { id });

    if (!id) {
      return NextResponse.json(
        { error: "Missing job ID" },
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
    void logger.debug(
      LogCategory.JOB_CARD,
      "Received update data for job card",
      {
        id,
        keys: Object.keys(requestData || {}),
      }
    );

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
      // Use relation connect form to update exporter reference to avoid
      // runtime errors when the scalar relation field is not accepted by the client.
      updateData.exporter = { connect: { id: requestData.exporterId } };
    }
    if (requestData.commodityId !== undefined) {
      // Use relation connect form to update commodity reference
      updateData.commodity = { connect: { id: requestData.commodityId } };
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
    if (requestData.buyerName !== undefined) {
      updateData.buyerName = requestData.buyerName;
    }
    if (requestData.buyerAddress !== undefined) {
      updateData.buyerAddress = requestData.buyerAddress;
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
      // Convert provided ounces to grams and store in totalNetWeight (grams)
      // 1 troy ounce = 31.1035 grams (precious metals standard)
      const oz = parseFloat(requestData.totalNetWeightOz);
      if (!Number.isNaN(oz)) {
        const grams = oz * 31.1035;
        updateData.totalNetWeight = Number(grams.toFixed(4));
      }
    }
    if (requestData.numberOfBoxes !== undefined) {
      updateData.numberOfBoxes = parseInt(requestData.numberOfBoxes);
    }
    // Handle officer name fields directly
    if (requestData.customsOfficerName !== undefined) {
      updateData.customsOfficerName = requestData.customsOfficerName;
    }
    if (requestData.technicalDirectorName !== undefined) {
      updateData.technicalDirectorName = requestData.technicalDirectorName;
    }
    if (requestData.valueGhs !== undefined) {
      updateData.valueGhs = parseFloat(requestData.valueGhs);
    }
    if (requestData.valueUsd !== undefined) {
      updateData.valueUsd = parseFloat(requestData.valueUsd);
    }
    if (requestData.certificateNumber !== undefined) {
      updateData.certificateNumber = requestData.certificateNumber;
    }
    if (requestData.pricePerOunce !== undefined) {
      updateData.pricePerOunce = parseFloat(requestData.pricePerOunce);
    }
    if (requestData.numberOfOunces !== undefined) {
      updateData.numberOfOunces = parseFloat(requestData.numberOfOunces);
    }
    // Handle customs officer assignment
    if (requestData.customsOfficer !== undefined) {
      if (
        typeof requestData.customsOfficer === "string" &&
        requestData.customsOfficer.trim() !== ""
      ) {
        // Find or create customs officer
        let customsOfficer = await prisma.customsOfficer.findFirst({
          where: { name: requestData.customsOfficer.trim() },
        });
        if (!customsOfficer) {
          customsOfficer = await prisma.customsOfficer.create({
            data: {
              name: requestData.customsOfficer.trim(),
              badgeNumber: `AUTO-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 5)}`,
            },
          });
        }
        updateData.customsOfficer = { connect: { id: customsOfficer.id } };
      } else {
        updateData.customsOfficer = { disconnect: true };
      }
    }
    // Handle technical director assignment
    if (requestData.technicalDirector !== undefined) {
      if (
        typeof requestData.technicalDirector === "string" &&
        requestData.technicalDirector.trim() !== ""
      ) {
        // Find or create technical director
        let technicalDirector = await prisma.technicalDirector.findFirst({
          where: { name: requestData.technicalDirector.trim() },
        });
        if (!technicalDirector) {
          technicalDirector = await prisma.technicalDirector.create({
            data: {
              name: requestData.technicalDirector.trim(),
              badgeNumber: `AUTO-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 5)}`,
            },
          });
        }
        updateData.technicalDirector = {
          connect: { id: technicalDirector.id },
        };
      } else {
        updateData.technicalDirector = { disconnect: true };
      }
    }

    // Handle officer ID fields (for dropdown selections)
    if (requestData.customsOfficerId !== undefined) {
      if (requestData.customsOfficerId && requestData.customsOfficerId !== "") {
        updateData.customsOfficer = {
          connect: { id: requestData.customsOfficerId },
        };
      } else {
        updateData.customsOfficer = { disconnect: true };
      }
    }
    // Handle officer assignments - disconnect if null/empty, connect if valid ID
    if (requestData.assayOfficerId !== undefined) {
      if (requestData.assayOfficerId && requestData.assayOfficerId !== "") {
        updateData.assayOfficer = {
          connect: { id: requestData.assayOfficerId },
        };
      } else {
        updateData.assayOfficer = { disconnect: true };
      }
    }
    if (requestData.technicalDirectorId !== undefined) {
      if (
        requestData.technicalDirectorId &&
        requestData.technicalDirectorId !== ""
      ) {
        updateData.technicalDirector = {
          connect: { id: requestData.technicalDirectorId },
        };
      } else {
        updateData.technicalDirector = { disconnect: true };
      }
    }

    void logger.debug(LogCategory.JOB_CARD, "Updating job card with data", {
      id,
      updateKeys: Object.keys(updateData || {}),
    });

    // If assays array is provided, persist any new/local assays to the DB
    const createdAssayIds: string[] = [];
    if (Array.isArray(requestData.assays) && requestData.assays.length > 0) {
      // Fetch the current job card data to populate assay reference fields
      const jobCard = await prisma.jobCard.findUnique({
        where: { id },
        select: {
          totalGrossWeight: true,
          totalNetWeight: true,
          fineness: true,
          numberOfOunces: true,
          pricePerOunce: true,
          valueUsd: true,
          valueGhs: true,
        },
      });

      for (const assayItem of requestData.assays) {
        try {
          // Only create assays that look local (no id or local- prefix)
          const isLocal =
            !assayItem.id || String(assayItem.id).startsWith("local-");
          if (!isLocal) continue;

          // Compute average fineness from measurements if available
          let avgFineness = 0;
          let totalGrossWeight = 0;
          let totalNetWeight = 0;

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

            // Calculate total weights
            totalGrossWeight = assayItem.measurements.reduce(
              (sum: number, m: any) => sum + (Number(m.grossWeight) || 0),
              0
            );

            totalNetWeight = assayItem.measurements.reduce(
              (sum: number, m: any) => sum + (Number(m.netWeight) || 0),
              0
            );
          }

          // Calculate weight in ounces and valuation
          const GRAMS_PER_TROY_OUNCE = 31.1035;
          const weightInOz =
            totalNetWeight > 0 ? totalNetWeight / GRAMS_PER_TROY_OUNCE : 0;

          // Get commodity price from request or use default
          const commodityPrice =
            assayItem.commodityPrice || assayItem.pricePerOz || 0;
          const pricePerOz = commodityPrice;

          // Calculate USD value
          const totalUsdValue = Number(weightInOz.toFixed(3)) * Number(pricePerOz);

          // Get exchange rate for GHS conversion
          let totalGhsValue = null;
          if (assayItem.exchangeRate && totalUsdValue > 0) {
            totalGhsValue = Number(totalUsdValue) * Number(assayItem.exchangeRate);
          }

          void logger.debug(LogCategory.JOB_CARD, "Assay calculation", {
            jobCardId: id,
            totalNetWeight,
            weightInOz,
            commodityPrice,
            pricePerOz,
            totalUsdValue,
            exchangeRate: assayItem.exchangeRate,
            totalGhsValue,
          });

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
                      meta: {
                        dailyPrice: commodityPrice,
                        valueUsd: totalUsdValue,
                        valueGhs: totalGhsValue,
                        exchangeRate: assayItem.exchangeRate,
                      },
                    }),
              assayDate: assayItem.createdAt
                ? new Date(assayItem.createdAt)
                : new Date(),
              goldContent: avgFineness || 0,
              silverContent: 0,
              // certificateNumber must be provided by client at assay/valuation time.
              // Do not auto-generate certificate numbers on the server.
              certificateNumber: assayItem.certificateNumber || undefined,
              humanReadableAssayNumber: await generateAssayNumber("SS"),

              // Store calculated valuation fields
              grossWeight: totalGrossWeight > 0 ? totalGrossWeight : null,
              fineness: avgFineness > 0 ? avgFineness : null,
              netWeight: totalNetWeight > 0 ? totalNetWeight : null,
              weightInOz: weightInOz > 0 ? weightInOz : null,
              pricePerOz: pricePerOz > 0 ? pricePerOz : null,
              totalUsdValue: totalUsdValue > 0 ? totalUsdValue : null,
              totalGhsValue: totalGhsValue,
              commodityPrice: commodityPrice > 0 ? commodityPrice : null,

              // Job card reference fields
              jbGrossWeight: jobCard?.totalGrossWeight || null,
              jbNetWeight: jobCard?.totalNetWeight || null,
              jbFineness: jobCard?.fineness || null,
              jbWeightInOz: jobCard?.numberOfOunces || null,
              jbPricePerOz: jobCard?.pricePerOunce || null,
              jbTotalUsdValue: jobCard?.valueUsd || null,
              jbTotalGhsValue: jobCard?.valueGhs || null,

              // Store seal and signatory information
              securitySealNo: assayItem.securitySealNo,
              goldbodSealNo: assayItem.goldbodSealNo,
              customsSealNo: assayItem.customsSealNo,
              exporterSignatory: assayItem.exporterSignatory,
              goldbodSignatory:
                assayItem.goldbodSignatory || assayItem.signatory,

              // Store exchange rate
              exchangeRate: assayItem.exchangeRate || null,

              // Store shipment type
              shipmentTypeId: assayItem.shipmentTypeId || null,

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
          void logger.error(
            LogCategory.JOB_CARD,
            "Failed to create assay record",
            {
              error:
                assayErr instanceof Error ? assayErr.message : String(assayErr),
            }
          );
        }
      }

      // If the request included an assay with a certificateNumber and the job card
      // does not yet have a certificateNumber, copy it to the job card to preserve
      // compatibility with views that read jobCard.certificateNumber.
      try {
        const firstProvidedCert = requestData.assays?.find(
          (a: any) => a.certificateNumber
        );
        if (
          firstProvidedCert &&
          firstProvidedCert.certificateNumber &&
          !existingJobCard.certificateNumber
        ) {
          await prisma.jobCard.update({
            where: { id },
            data: { certificateNumber: firstProvidedCert.certificateNumber },
          });
        }
      } catch (copyErr) {
        // Log but don't fail the whole update flow if copying fails due to uniqueness
        void logger.warn(
          LogCategory.JOB_CARD,
          "Failed to copy certificateNumber to job card",
          {
            error: copyErr instanceof Error ? copyErr.message : String(copyErr),
          }
        );
      }

      // mark job card as completed unless a different status is provided
      updateData.status = requestData.status || "completed";
      // Note: Invoice creation is now manual - removed auto-creation
    }

    // If seals array or officer names are provided, persist seals and/or update notes
    if (
      (Array.isArray(requestData.seals) && requestData.seals.length > 0) ||
      requestData.customsOfficerName ||
      requestData.technicalDirectorName
    ) {
      // Append officer names to the notes field so we don't need DB migrations for officer relations here
      const parts: string[] = [];
      if (requestData.customsOfficerName) {
        parts.push(`Customs Officer: ${requestData.customsOfficerName}`);
      }
      if (requestData.technicalDirectorName) {
        parts.push(`Technical Director: ${requestData.technicalDirectorName}`);
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
        if (requestData.technicalDirectorName) {
          const existing = findExisting("OTHER_SEAL");
          if (existing) {
            await prisma.seal.update({
              where: { id: existing.id },
              data: {
                sealNumber: String(requestData.technicalDirectorName),
                notes: "Updated from sealing modal - technical director",
              },
            });
          } else {
            await prisma.seal.create({
              data: {
                jobCardId: id,
                sealNumber: String(requestData.technicalDirectorName),
                sealType: "OTHER_SEAL",
                notes: "Saved from sealing modal - technical director",
              },
            });
          }
        }
      } catch (officerSealErr) {
        void logger.error(
          LogCategory.JOB_CARD,
          "Failed to persist officer seals",
          {
            error:
              officerSealErr instanceof Error
                ? officerSealErr.message
                : String(officerSealErr),
          }
        );
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
            void logger.error(
              LogCategory.JOB_CARD,
              "Failed to create seal record",
              {
                error:
                  sealErr instanceof Error ? sealErr.message : String(sealErr),
              }
            );
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
        },
      });

      // If assays were part of the request we just created, return the refreshed job card including assays/invoices
      if (Array.isArray(requestData.assays) && requestData.assays.length > 0) {
        const refreshed = await prisma.jobCard.findUnique({
          where: { id },
          include: {
            exporter: {
              include: {
                exporterType: true,
              },
            },
            commodity: true,
            customsOfficer: true,
            assayOfficer: true,
            technicalDirector: true,
            seals: true,
            assays: {
              select: {
                id: true,
                jobCardId: true,
                assayOfficerId: true,
                technicalDirectorId: true,
                goldContent: true,
                silverContent: true,
                comments: true,
                assayDate: true,
                certificateNumber: true,
                remarks: true,
                measurements: true,
                grossWeight: true,
                fineness: true,
                netWeight: true,
                weightInOz: true,
                pricePerOz: true,
                totalUsdValue: true,
                totalGhsValue: true,
                commodityPrice: true,
                exchangeRate: true,
                securitySealNo: true,
                goldbodSealNo: true,
                customsSealNo: true,
                exporterSignatory: true,
                goldbodSignatory: true,
                shipmentTypeId: true,
                shipmentType: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            invoices: true,
            fees: true,
            levies: true,
          },
        });
        return NextResponse.json(refreshed);
      }

      return NextResponse.json(updatedJobCard);
    } catch (updateError) {
      void logger.error(LogCategory.JOB_CARD, "Error during update operation", {
        error:
          updateError instanceof Error
            ? updateError.message
            : String(updateError),
      });
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
    void logger.error(LogCategory.JOB_CARD, "Error updating job card", {
      error: error instanceof Error ? error.message : String(error),
    });
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
async function deleteJobCard(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if job card exists
    const existingJobCard = await prisma.jobCard.findUnique({
      where: { id },
      include: {
        assays: {
          include: {
            measurements: true,
          },
        },
        invoices: {
          include: {
            levies: true,
          },
        },
        fees: true,
        levies: true,
        seals: true,
      },
    });

    if (!existingJobCard) {
      return NextResponse.json(
        { error: "Job card not found" },
        { status: 404 }
      );
    }

    // Delete associated records manually (since cascade delete is not set up for all relations)
    const deletedRecords = {
      assays: 0,
      measurements: 0,
      invoices: 0,
      fees: 0,
      levies: 0,
      seals: 0,
    };

    // Delete assay measurements first
    for (const assay of existingJobCard.assays) {
      const measurementDeleteResult = await prisma.assayMeasurement.deleteMany({
        where: { assayId: assay.id },
      });
      deletedRecords.measurements += measurementDeleteResult.count;
    }
    deletedRecords.assays = existingJobCard.assays.length;

    // Delete levies related to invoices
    for (const invoice of existingJobCard.invoices) {
      const levyDeleteResult = await prisma.levy.deleteMany({
        where: { invoiceId: invoice.id },
      });
      deletedRecords.levies += levyDeleteResult.count;
    }

    // Delete invoices
    const invoiceDeleteResult = await prisma.invoice.deleteMany({
      where: { jobCardId: id },
    });
    deletedRecords.invoices = invoiceDeleteResult.count;

    // Delete fees
    const feeDeleteResult = await prisma.fee.deleteMany({
      where: { jobCardId: id },
    });
    deletedRecords.fees = feeDeleteResult.count;

    // Delete levies directly related to job card
    const levyDeleteResult = await prisma.levy.deleteMany({
      where: { jobCardId: id },
    });
    deletedRecords.levies += levyDeleteResult.count;

    // Delete seals
    const sealDeleteResult = await prisma.seal.deleteMany({
      where: { jobCardId: id },
    });
    deletedRecords.seals = sealDeleteResult.count;

    // Finally, delete the job card (this will cascade delete assays)
    await prisma.jobCard.delete({
      where: { id },
    });

    void logger.info(
      LogCategory.JOB_CARD,
      "Job card deleted with all associated records",
      {
        jobCardId: id,
        deletedRecords,
      }
    );

    return NextResponse.json({
      message: "Job card and all associated records deleted successfully",
      deletedRecords,
    });
  } catch (error) {
    void logger.error(LogCategory.JOB_CARD, "Error deleting job card", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to delete job card" },
      { status: 500 }
    );
  }
}

// Export the handlers
export const DELETE = withAuth(deleteJobCard, []);
