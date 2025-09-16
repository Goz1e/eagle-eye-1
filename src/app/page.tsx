"use client";

import { useState } from "react";
import { WalletAddressInput } from "@/components/wallet";
import { TransactionExporter } from "@/components/analysis/TransactionExporter"; // We'll reuse this for now

export default function HomePage() {
  const [confirmedAddress, setConfirmedAddress] = useState<string | null>(null);

  const handleAddressConfirm = (addresses: string[]) => {
    if (addresses.length > 0) {
      setConfirmedAddress(addresses[0]);
    } else {
      setConfirmedAddress(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="inline-block bg-blue-600 rounded-lg p-3 mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5l-3 3-3-3"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            Aptos Transaction Exporter
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
            Enter a wallet address to view and export its transaction history.
          </p>
        </header>

        {/* Main Content Area */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Step 1: Enter Wallet Address
            </h2>

            <WalletAddressInput
              onAddressesConfirmed={handleAddressConfirm}
              maxAddresses={1}
              placeholder="Paste a single Aptos wallet address here..."
              className="w-full"
              hideConfirmButton={true}
            />

            {confirmedAddress && (
              <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  Step 2: Fetch Transactions
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Select a token and date range, then fetch and export the
                  transaction history for the selected wallet.
                </p>
                <TransactionExporter walletAddress={confirmedAddress} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-8 text-sm text-slate-500 dark:text-slate-400">
          <p>Powered by Eagle Eye</p>
        </footer>
      </div>
    </main>
  );
}
