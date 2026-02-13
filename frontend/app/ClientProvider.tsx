"use client";

import { Provider } from "react-redux";
import { store } from "../store";
import GlobalErrorDialog from "@/components/GlobalErrorDialog";
import { ConfirmDialogProvider } from "@/components/confirm-dialog-provider";
import { Toaster } from "@/components/ui/toaster";

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <ConfirmDialogProvider>
        {children}
        <GlobalErrorDialog />
        <Toaster />
      </ConfirmDialogProvider>
    </Provider>
  );
}
