import * as React from "react";
import { AuthContext } from "../context";
import type { AuthContextType } from "../types";

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
