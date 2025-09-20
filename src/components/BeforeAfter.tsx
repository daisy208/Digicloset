import React from "react";
import ReactCompareImage from "react-compare-image";

type BeforeAfterProps = {
  beforeUrl: string; // original user photo
  afterUrl: string;  // AI try-on result
};

export default function BeforeAfter({ beforeUrl, afterUrl }: BeforeAfterProps) {
  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-300">
      <ReactCompareImage
        leftImage={beforeUrl}
        rightImage={afterUrl}
        sliderLineColor="#2563eb"  // blue line (can match your brand color)
        sliderLineWidth={3}
      />
    </div>
  );
}
import React from "react";
import ReactCompareImage from "react-compare-image";

type BeforeAfterProps = {
  beforeUrl: string;
  afterUrl: string;
};

export default function BeforeAfter({ beforeUrl, afterUrl }: BeforeAfterProps) {
  return (
    <div className="w-full max-w-xl mx-auto rounded-lg overflow-hidden border border-gray-300">
      <ReactCompareImage
        leftImage={beforeUrl}
        rightImage={afterUrl}
        sliderLineColor="#2563eb"
        sliderLineWidth={3}
      />
    </div>
  );
}
