import { Header } from "@/app/components/layout/header";
import { FileText } from "lucide-react";
import QuickReports from "./QuickReports";

export default function ReportsPage() {
  return (
    <>
      <Header
        title="Reports"
        icon={<FileText className="h-5 w-5" />}
        subtitle="Generated reports from database data"
      />
      <QuickReports />
    </>
  );
}
