"use client";

import { Component, type ReactNode } from "react";
import { errorMessage } from "@/lib/errors";
import { ErrorState } from "./States";

type State = { error: unknown };

/** Convex useQuery throws on server errors; this turns them into an inline error state. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <ErrorState message={errorMessage(this.state.error)} onRetry={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}
