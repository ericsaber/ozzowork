import { useState } from "react";

export interface CompleteTaskTarget {
  taskRecordId: string;
  contactId: string;
  contactName: string;
  followUpType: string;
  userId: string;
  hasInteraction: boolean;
}

interface UseCompleteTaskProps {
  onCompleted?: () => void;
}

export const useCompleteTask = (props?: UseCompleteTaskProps) => {
  const [target, setTarget] = useState<CompleteTaskTarget | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const startComplete = (t: CompleteTaskTarget) => {
    setTarget(t);
    setSheetOpen(true);
  };

  const handleSheetClose = (open: boolean) => {
    if (!open) {
      setSheetOpen(false);
      setTarget(null);
      props?.onCompleted?.();
    }
  };

  return { target, sheetOpen, startComplete, handleSheetClose };
};
