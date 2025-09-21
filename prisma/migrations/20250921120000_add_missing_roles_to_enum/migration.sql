-- Add missing Role enum values
ALTER TYPE "public"."Role" ADD VALUE 'EXECUTIVE';
ALTER TYPE "public"."Role" ADD VALUE 'SMALL_SCALE_ASSAYER';
ALTER TYPE "public"."Role" ADD VALUE 'LARGE_SCALE_ASSAYER';
