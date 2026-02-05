"use client";

import { Provider } from "react-redux";
import { store } from "../store";
import GlobalErrorDialog from "@/components/GlobalErrorDialog";

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      {children}
      <GlobalErrorDialog />
    </Provider>
  );
}
