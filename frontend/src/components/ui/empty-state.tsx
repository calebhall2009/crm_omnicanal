import * as React from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ElementType
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50",
        className
      )}
      {...props}
    >
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        {Icon && (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
            <Icon className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          </div>
        )}
        <h3 className="mt-4 text-lg font-semibold font-display">{title}</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">{description}</p>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  )
}
