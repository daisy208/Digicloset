import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getTryOns } from "../lib/getTryOns";
import { Clock, Image as ImageIcon, Shirt } from "lucide-react";

export default function TryOnHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const tryOns = await getTryOns(user.id);
        setHistory(tryOns);
      }

      setLoading(false);
    };

    fetchHistory();
  }, []);

  if (loading) {
    return <p className="text-gray-500 text-center">Loading history...</p>;
  }

  if (history.length === 0) {
    return (
      <p className="text-gray-500 text-center">
        No try-ons yet. Start by uploading a photo!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((tryOn) => (
        <div
          key={tryOn.id}
          className="bg-white rounded-xl shadow p-4 flex space-x-4 items-center"
        >
          {/* Try-on photo */}
          <div className="w-24 h-32 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
            {tryOn.photo_url ? (
              <img
                src={tryOn.photo_url}
                alt="Try-on"
                className="object-cover w-full h-full"
              />
            ) : (
              <ImageIcon className="text-gray-400" size={32} />
            )}
          </div>

          {/* Details */}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Clock size={14} className="text-gray-500" />
              <span className="text-xs text-gray-500">
                {new Date(tryOn.created_at).toLocaleString()}
              </span>
            </div>

            {/* Clothing items */}
            <div className="flex flex-wrap gap-2">
              {tryOn.items?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded text-xs"
                >
                  <Shirt size={12} className="text-indigo-500" />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>

            {/* Analysis */}
            {tryOn.fit_analysis && (
              <p className="text-xs text-gray-600 mt-2">
                Fit:{" "}
                <span className="font-medium">
                  {tryOn.fit_analysis.overall_fit}
                </span>{" "}
                | Recommended size:{" "}
                <span className="font-medium">
                  {tryOn.fit_analysis.size_recommendation}
                </span>
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
