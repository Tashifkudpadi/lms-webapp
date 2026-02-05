"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearGlobalError } from "@/store/globalError";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function GlobalErrorDialog() {
  const [mounted, setMounted] = useState(false);
  const dispatch = useAppDispatch();
  const { message, detail } = useAppSelector((s) => s.globalErrorReducer);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render Dialog until client-side hydration is complete
  if (!mounted) return null;

  const open = Boolean(message);
  const onCopy = async () => {
    try {
      const payload = JSON.stringify({ message, detail }, null, 2);
      await navigator.clipboard.writeText(payload);
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) dispatch(clearGlobalError()); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-red-600">An error occurred</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-foreground">{message}</p>

          {/* Structured backend info if available */}
          {detail && typeof detail === "object" && (
            <div className="space-y-2 text-xs">
              {detail.status !== undefined && (
                <div><span className="font-medium">Status:</span> {detail.status} {detail.statusText ? `(${detail.statusText})` : ""}</div>
              )}
              {detail.method && (
                <div><span className="font-medium">Method:</span> {detail.method}</div>
              )}
              {detail.url && (
                <div className="break-all"><span className="font-medium">URL:</span> {detail.url}</div>
              )}

              {/* Render validation errors nicely if FastAPI sends an array in data.detail */}
              {Array.isArray(detail?.data?.detail) ? (
                <div>
                  <div className="font-medium mb-1">Validation errors:</div>
                  <div className="max-h-48 overflow-auto bg-muted rounded p-2">
                    {detail.data.detail.map((e: any, idx: number) => (
                      <div key={idx} className="mb-2">
                        <div>- {e?.msg}</div>
                        {e?.loc && <div className="text-[10px] text-muted-foreground">loc: {e.loc.join(" ")}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : detail?.data ? (
                <pre className="text-[11px] bg-muted rounded p-3 overflow-auto max-h-64">
                  {typeof detail.data === "string" ? detail.data : JSON.stringify(detail.data, null, 2)}
                </pre>
              ) : null}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCopy}>Copy details</Button>
            <Button variant="default" onClick={() => dispatch(clearGlobalError())}>Dismiss</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
