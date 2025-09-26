import React from "react";
import TryOnHistory from "../components/TryOnHistory";

export default function HistoryPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">My Try-On History</h1>
      <TryOnHistory />
    </div>
  );
}
