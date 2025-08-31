"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

interface BackLinkProps {
  href: string;
  label?: string;
}

export default function BackLink({ href, label }: BackLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-3 text-sm text-gray-700 bg-white border border-gray-200 shadow-sm px-3 py-2 rounded-lg hover:shadow-md hover:bg-gray-50 transition-all"
    >
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700">
        <ArrowLeftIcon className="h-4 w-4" />
      </span>
      <span className="font-medium">{label || "Back"}</span>
    </Link>
  );
}
