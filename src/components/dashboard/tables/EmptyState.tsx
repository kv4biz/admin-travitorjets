// src/components/dashboard/tables/EmptyState.tsx
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { IconFolderCode } from "@tabler/icons-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "No data found",
  description = "Try adjusting your search or filters.",
  icon = <IconFolderCode />,
}: EmptyStateProps) {
  return (
    <Empty className="h-[70vh]">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
