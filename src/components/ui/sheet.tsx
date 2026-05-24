"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root {...props} />;
}

function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger {...props} />;
}

function SheetClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close {...props} />;
}

function SheetContent({
  className,
  children,
  side = "end",
  ...props
}: DialogPrimitive.Popup.Props & {
  side?: "start" | "end";
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
      <DialogPrimitive.Popup
        className={cn(
          "fixed inset-y-0 z-50 flex w-full max-w-xs flex-col bg-surface shadow-purple-md outline-none data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
          side === "end" ? "end-0 border-s border-outline-variant/30" : "start-0 border-e",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-outline-variant/30 px-4 py-4",
        className,
      )}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      className={cn("text-lg font-semibold text-primary", className)}
      {...props}
    />
  );
}

function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex-1 overflow-y-auto p-4", className)} {...props} />;
}

function SheetCloseButton() {
  return (
    <DialogPrimitive.Close
      className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label="סגירה"
    >
      <XIcon className="size-5" />
    </DialogPrimitive.Close>
  );
}

export {
  Sheet,
  SheetBody,
  SheetClose,
  SheetCloseButton,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
};
