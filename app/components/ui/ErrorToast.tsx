"use client";

import { useEffect } from "react";
import { toast } from "react-hot-toast";

interface ErrorToastProps {
  error?: string;
}

export default function ErrorToast({ error }: ErrorToastProps) {
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return null;
}
