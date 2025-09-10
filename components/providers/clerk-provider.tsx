'use client'
import { useTheme } from "next-themes";
import React from "react";

import { ClerkProvider as Clerk } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

interface ClerkProviderProps {
  children: React.ReactNode;
}

const ClerkProvider = ({ children }: ClerkProviderProps) => {
  const { resolvedTheme } = useTheme();
  return (
    <Clerk
      appearance={{ baseTheme: resolvedTheme === "dark" ? dark : undefined }}
    >
      {children}
    </Clerk>
  );
};

export default ClerkProvider;
