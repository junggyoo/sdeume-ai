"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function BottomSheet({ open, onOpenChange, children }: BottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </Drawer.Root>
  );
}

const BottomSheetTrigger = Drawer.Trigger;

function BottomSheetContent({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Drawer.Content>) {
  return (
    <Drawer.Portal>
      <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <Drawer.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto max-h-[90vh] flex-col rounded-t-2xl bg-background",
          className
        )}
        {...props}
      >
        <div className="mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-muted" />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </Drawer.Content>
    </Drawer.Portal>
  );
}

function BottomSheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-4 pb-2 pt-4 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function BottomSheetTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <Drawer.Title
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  );
}

function BottomSheetDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <Drawer.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function BottomSheetBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 pb-6", className)} {...props} />;
}

function BottomSheetClose({
  className,
  ...props
}: React.ComponentProps<typeof Drawer.Close>) {
  return (
    <Drawer.Close
      className={cn(
        "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none",
        className
      )}
      {...props}
    />
  );
}

export {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
  BottomSheetBody,
  BottomSheetClose,
};
