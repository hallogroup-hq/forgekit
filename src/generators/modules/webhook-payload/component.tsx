"use client";

import React, { useState, useEffect } from "react";
import { Download, Terminal, Code2, Check, Play, Activity, Radio } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

type Provider = "stripe" | "github" | "clerk" | "shopify" | "supabase";

interface EventPreset {
  id: string;
  name: string;
  eventType: string;
  headerName: string;
  defaultPayload: object;
}

const PROVIDER_EVENTS: Record<Provider, EventPreset[]> = {
  stripe: [
    {
      id: "stripe-checkout-success",
      name: "Checkout Session Completed",
      eventType: "checkout.session.completed",
      headerName: "Stripe-Signature",
      defaultPayload: {
        id: "evt_1P9xyzLkd99321",
        object: "event",
        api_version: "2024-06-20",
        created: 1712589000,
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_a1b2c3d4e5f6g7h8",
            object: "checkout.session",
            amount_total: 4900,
            currency: "usd",
            customer_email: "customer@example.com",
            customer_details: {
              email: "customer@example.com",
              name: "Jordan Lee",
            },
            payment_status: "paid",
            status: "complete",
            subscription: "sub_1OpQrStUvWxYz",
            metadata: {
              userId: "usr_99812",
              tier: "pro",
            },
          },
        },
      },
    },
    {
      id: "stripe-sub-deleted",
      name: "Subscription Cancelled",
      eventType: "customer.subscription.deleted",
      headerName: "Stripe-Signature",
      defaultPayload: {
        id: "evt_1P8subCancel77",
        object: "event",
        type: "customer.subscription.deleted",
        data: {
          object: {
            id: "sub_1OpQrStUvWxYz",
            customer: "cus_88912345",
            status: "canceled",
            cancel_at_period_end: false,
            canceled_at: 1712589200,
          },
        },
      },
    },
  ],
  github: [
    {
      id: "github-push",
      name: "Push to Main Branch",
      eventType: "push",
      headerName: "X-Hub-Signature-256",
      defaultPayload: {
        ref: "refs/heads/main",
        before: "6113728f27ae82c7b1a12e7d8d5f3ac71cc963ff",
        after: "883aab3450926d5224a103d505b00b0f94e5da8",
        repository: {
          id: 421098,
          name: "forgekit-web",
          full_name: "acme/forgekit-web",
          private: false,
        },
        pusher: {
          name: "octocat",
          email: "octocat@github.com",
        },
        commits: [
          {
            id: "883aab3450926d5224a103d505b00b0f94e5da8",
            message: "feat: add webhook payload generator studio",
            timestamp: "2026-10-08T12:00:00Z",
            author: { name: "Octo Cat", email: "octo@github.com" },
          },
        ],
      },
    },
    {
      id: "github-pr-opened",
      name: "Pull Request Opened",
      eventType: "pull_request",
      headerName: "X-Hub-Signature-256",
      defaultPayload: {
        action: "opened",
        number: 42,
        pull_request: {
          id: 9918231,
          title: "fix: prevent unnecessary re-render on mobile navigation",
          state: "open",
          user: { login: "dev-alex" },
          head: { ref: "fix/mobile-nav" },
          base: { ref: "main" },
        },
      },
    },
  ],
  clerk: [
    {
      id: "clerk-user-created",
      name: "User Created",
      eventType: "user.created",
      headerName: "svix-signature",
      defaultPayload: {
        data: {
          id: "user_2Y0P1LkjK882A",
          first_name: "Morgan",
          last_name: "Reed",
          email_addresses: [
            {
              id: "idn_12345",
              email_address: "morgan.reed@company.com",
              verification: { status: "verified" },
            },
          ],
          created_at: 1712589000000,
        },
        object: "event",
        type: "user.created",
      },
    },
  ],
  shopify: [
    {
      id: "shopify-order-created",
      name: "Order Paid",
      eventType: "orders/create",
      headerName: "X-Shopify-Hmac-Sha256",
      defaultPayload: {
        id: 5543210987,
        email: "buyer@domain.com",
        currency: "USD",
        total_price: "128.50",
        financial_status: "paid",
        line_items: [
          {
            id: 890123,
            title: "Minimalist Mechanical Keyboard",
            quantity: 1,
            price: "128.50",
          },
        ],
      },
    },
  ],
  supabase: [
    {
      id: "supabase-db-insert",
      name: "Database Row Inserted",
      eventType: "INSERT",
      headerName: "x-supabase-signature",
      defaultPayload: {
        type: "INSERT",
        table: "profiles",
        schema: "public",
        record: {
          id: "b2d56a78-1a2b-4c3d-8e9f-0123456789ab",
          username: "synthwave_coder",
          plan: "pro",
          created_at: "2026-10-08T12:00:00Z",
        },
        old_record: null,
      },
    },
  ],
};

function getMockSignature(provider: Provider): string {
  const timestamp = 1712589000;
  switch (provider) {
    case "stripe":
      return `t=${timestamp},v1=5257a869e7eceeda325490b3fa73974c35eacb533fd02d91e5ee0a163495057a`;
    case "github":
      return `sha256=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c469e4637ad85ecd9`;
    case "clerk":
      return `v1,g0hM9ssE+OTPJTGtUukkoSyqU3h0QOGNMw69WvP+Iik=`;
    case "shopify":
      return `XSRg+b2h8W2pDkWw2gH7Y3xS9K3h2s9dK2+L9s9D8ks=`;
    case "supabase":
      return `sha256=9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c`;
    default:
      return `mock_sig_12345`;
  }
}

export default function WebhookPayloadGenerator() {
  const [provider, setProvider] = useState<Provider>("stripe");
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);
  const [endpointUrl, setEndpointUrl] = useState("http://localhost:3000/api/webhook");
  const [webhookSecret, setWebhookSecret] = useState("whsec_test_secret_key_998877");
  const [rawJson, setRawJson] = useState("");
  const [activeTab, setActiveTab] = useState<"payload" | "curl" | "fetch" | "response">("payload");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [testResponse, setTestResponse] = useState<{
    status?: number;
    statusText?: string;
    durationMs?: number;
    body?: string;
    error?: string;
  } | null>(null);

  const currentEvents = PROVIDER_EVENTS[provider] || [];
  const currentEvent = currentEvents[selectedEventIndex] || currentEvents[0];
  const headerName = currentEvent?.headerName || "X-Signature";
  const mockSignature = getMockSignature(provider);

  const handleSendLiveTest = async () => {
    setIsSending(true);
    setTestResponse(null);
    setActiveTab("response");
    const start = performance.now();
    try {
      const res = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [headerName]: mockSignature,
        },
        body: rawJson,
      });
      const durationMs = Math.round(performance.now() - start);
      const text = await res.text();
      setTestResponse({
        status: res.status,
        statusText: res.statusText || (res.status === 200 ? "OK" : ""),
        durationMs,
        body: text,
      });
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
    } catch (err: unknown) {
      const durationMs = Math.round(performance.now() - start);
      const errMsg = err instanceof Error ? err.message : "Network request failed";
      setTestResponse({
        error: `${errMsg}. (If targeting localhost, verify your dev server is active and allows CORS)`,
        durationMs,
      });
    } finally {
      setIsSending(false);
    }
  };

  // Set initial payload when provider or event changes
  useEffect(() => {
    if (currentEvent) {
      setRawJson(JSON.stringify(currentEvent.defaultPayload, null, 2));
      setJsonError(null);
    }
  }, [provider, selectedEventIndex, currentEvent]);

  const handleJsonChange = (val: string) => {
    setRawJson(val);
    try {
      JSON.parse(val);
      setJsonError(null);
    } catch {
      setJsonError("Invalid JSON syntax");
    }
  };

  // Generate curl command
  const minifiedJson = rawJson.replace(/\n/g, "").replace(/\s\s+/g, " ");
  const curlCommand = `curl -X POST "${endpointUrl}" \\
  -H "Content-Type: application/json" \\
  -H "${headerName}: ${mockSignature}" \\
  -d '${minifiedJson}'`;

  // Generate fetch snippet
  const fetchSnippet = `// Test Webhook Dispatcher
const response = await fetch("${endpointUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "${headerName}": "${mockSignature}",
  },
  body: JSON.stringify(${rawJson}),
});

console.log("Status:", response.status);
const data = await response.json();
console.log("Response:", data);`;

  const handleDownload = () => {
    const eventSlug = currentEvent?.eventType ? currentEvent.eventType.replace(/[^a-z0-9]/g, "-") : "event";
    downloadFile(rawJson, `${provider}-${eventSlug}.json`, "application/json");
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
  };

  return (
    <div className="space-y-6">
      {/* Development Notice */}
      <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
        <span className="font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-[10px] uppercase tracking-wider shrink-0 mt-0.5">
          In Development
        </span>
        <p>
          This utility is currently parked for internal refinement. Sample payloads and cURL templates can be copied freely, but live cryptographic HMAC signature generation is pending implementation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Settings Column (Left) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Provider Switcher */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
            Webhook Provider
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {(["stripe", "github", "clerk", "shopify", "supabase"] as Provider[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setProvider(p);
                  setSelectedEventIndex(0);
                }}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border capitalize transition-colors ${
                  provider === p
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-2xs"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Event Type Select */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
            Event Preset
          </label>
          <div className="space-y-1.5">
            {currentEvents.map((evt, idx) => (
              <button
                key={evt.id}
                type="button"
                onClick={() => setSelectedEventIndex(idx)}
                className={`w-full text-left px-3 py-2 text-xs rounded-xl border transition-colors flex items-center justify-between ${
                  selectedEventIndex === idx
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-2xs"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <div>
                  <div className="font-semibold">{evt.name}</div>
                  <div className="font-mono text-[10px] opacity-70">{evt.eventType}</div>
                </div>
                {selectedEventIndex === idx && <Check className="w-4 h-4 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Destination & Secret Inputs */}
        <div className="space-y-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs">
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Test Webhook URL (Target)
            </label>
            <input
              type="text"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Webhook Secret (Signing Key)
            </label>
            <input
              type="text"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              <span>Simulated Header: {currentEvent?.headerName}</span>
              <CopyButton text={mockSignature} label="Copy Sig" />
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-800 dark:text-zinc-200 break-all select-all">
              {mockSignature}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSendLiveTest}
            disabled={isSending}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-60 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            {isSending ? (
              <>
                <Radio className="w-4 h-4 animate-spin" />
                Dispatching test...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Dispatch Test to Endpoint
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output Column (Right) */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("payload")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === "payload"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              JSON Event Payload
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("curl")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "curl"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              cURL Command
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("fetch")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "fetch"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Node / fetch
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("response")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "response"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Live Response
              {testResponse && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    testResponse.status === 200
                      ? "bg-emerald-500"
                      : testResponse.error
                      ? "bg-rose-500"
                      : "bg-amber-500"
                  }`}
                />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CopyButton
              text={
                activeTab === "payload"
                  ? rawJson
                  : activeTab === "curl"
                  ? curlCommand
                  : activeTab === "fetch"
                  ? fetchSnippet
                  : testResponse?.body || testResponse?.error || ""
              }
              label="Copy"
            />
            {activeTab === "payload" && (
              <button
                type="button"
                onClick={handleDownload}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 shadow-2xs transition-colors active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5" />
                Download JSON
              </button>
            )}
          </div>
        </div>

        {/* Tab View Container */}
        <div className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-5 overflow-hidden shadow-2xs flex flex-col">
          {activeTab === "payload" && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between text-xs text-zinc-400 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                <span className="font-mono">Editable Payload</span>
                {jsonError ? (
                  <span className="text-red-500 font-semibold">{jsonError}</span>
                ) : (
                  <span className="text-emerald-500 font-medium">Valid JSON</span>
                )}
              </div>
              <textarea
                rows={22}
                value={rawJson}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="flex-1 font-mono text-xs text-zinc-800 dark:text-zinc-200 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 mt-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {activeTab === "curl" && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between text-xs text-zinc-400 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                <span className="font-mono">Terminal Executable</span>
                <span>Paste directly into bash / zsh</span>
              </div>
              <pre className="flex-1 font-mono text-xs text-zinc-800 dark:text-zinc-200 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-zinc-200/60 dark:border-zinc-800/60 mt-3 max-h-[600px] overflow-y-auto">
                {curlCommand}
              </pre>
            </div>
          )}

          {activeTab === "fetch" && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between text-xs text-zinc-400 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                <span className="font-mono">Test Dispatcher Script</span>
                <span>Node.js / Bun / Browser fetch</span>
              </div>
              <pre className="flex-1 font-mono text-xs text-zinc-800 dark:text-zinc-200 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-zinc-200/60 dark:border-zinc-800/60 mt-3 max-h-[600px] overflow-y-auto">
                {fetchSnippet}
              </pre>
            </div>
          )}

          {activeTab === "response" && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between text-xs text-zinc-400 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                <span className="font-mono">Live Dispatch Result</span>
                {testResponse?.durationMs && (
                  <span className="font-mono text-zinc-500">
                    Roundtrip: {testResponse.durationMs}ms
                  </span>
                )}
              </div>
              {!testResponse && !isSending && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-400">
                  <Activity className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">No request dispatched yet.</p>
                  <p className="text-[11px] text-zinc-500 mt-1 max-w-xs">
                    Click &quot;Dispatch Test to Endpoint&quot; on the left to fire a live POST request with signed signature headers.
                  </p>
                </div>
              )}
              {isSending && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-400">
                  <Radio className="w-8 h-8 mb-2 animate-spin text-blue-500" />
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Sending POST to {endpointUrl}...
                  </p>
                </div>
              )}
              {testResponse && !isSending && (
                <div className="flex-1 mt-3 space-y-3 flex flex-col">
                  <div className="flex items-center gap-3">
                    {testResponse.status ? (
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg font-mono ${
                          testResponse.status >= 200 && testResponse.status < 300
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400"
                        }`}
                      >
                        HTTP {testResponse.status} {testResponse.statusText}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg font-mono bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400">
                        Dispatch Failed
                      </span>
                    )}
                    <span className="text-xs text-zinc-500 font-mono truncate">
                      {endpointUrl}
                    </span>
                  </div>
                  {testResponse.error ? (
                    <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 leading-relaxed font-mono">
                      {testResponse.error}
                    </div>
                  ) : (
                    <pre className="flex-1 font-mono text-xs text-zinc-800 dark:text-zinc-200 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-zinc-200/60 dark:border-zinc-800/60 max-h-[500px] overflow-y-auto">
                      {testResponse.body || "(Empty response body)"}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
}
