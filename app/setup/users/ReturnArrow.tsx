import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
// ...existing code...
<div className="flex items-center mb-6">
  <Link
    href="/setup"
    className="inline-flex items-center text-gray-600 hover:text-blue-600"
  >
    <ArrowLeftIcon className="h-5 w-5 mr-2" />
    Back to Settings
  </Link>
</div>;
// ...existing code...
