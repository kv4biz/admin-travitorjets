"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";

export function SupabaseConnectionTest() {
  const [status, setStatus] = useState<"testing" | "success" | "error">(
    "testing",
  );
  const [message, setMessage] = useState("Testing connection...");
  const [details, setDetails] = useState<string>("");

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createClient();

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          setStatus("error");
          setMessage("❌ Connection failed");
          setDetails(error.message);
        } else {
          setStatus("success");
          setMessage("✅ Connection successful!");
          setDetails(
            "Successfully connected to Supabase. Client initialized and API is responding. " +
              (data.session
                ? "User session active."
                : "No active session (expected for admin panel)."),
          );
        }
      } catch (err) {
        setStatus("error");
        setMessage("❌ Connection failed");
        setDetails(
          err instanceof Error ? err.message : "Unknown error occurred",
        );
      }
    }

    testConnection();
  }, []);

  return (
    <div className="w-full max-w-2xl p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
        Supabase Connection Test
      </h2>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div
            className={`text-2xl ${
              status === "testing" ? "animate-pulse" : ""
            }`}
          >
            {status === "testing" && "⏳"}
            {status === "success" && "✅"}
            {status === "error" && "❌"}
          </div>
          <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            {message}
          </p>
        </div>

        {details && (
          <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
            <p className="text-sm font-mono text-zinc-700 dark:text-zinc-300 wrap-break-word">
              {details}
            </p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            <strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            <strong>Key:</strong>{" "}
            {process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.substring(
              0,
              20,
            )}
            ...
          </p>
        </div>
      </div>
    </div>
  );
}
