"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Bottom sheet on phones, centred dialog on wider screens (Radix Dialog: focus trap, Esc, aria). */
export function Sheet({
  open, onOpenChange, title, description, children, className,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgb(10_16_13/0.55)] backdrop-blur-[2px] data-[state=open]:animate-[fade_180ms_ease-out]" />
        <Dialog.Content
          className={cn(
            "fixed z-50 inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-3xl border border-rule bg-paper p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl",
            "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[min(92vw,30rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl",
            "data-[state=open]:animate-[sheet-in_260ms_var(--ease-out)]",
            className,
          )}
          {...(description ? {} : { "aria-describedby": undefined })}
        >
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-rule sm:hidden" aria-hidden />
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Dialog.Title className="font-display text-xl font-bold">{title}</Dialog.Title>
              {description && <Dialog.Description className="mt-1 text-sm text-muted">{description}</Dialog.Description>}
            </div>
            <Dialog.Close className="-mr-2 -mt-1 grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-paper-2 hover:text-ink" aria-label="Close">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
