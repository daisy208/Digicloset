import React, { useState } from "react";

export default function VirtualTryOn() {
  const [personFile, setPersonFile] = useState(null);
  const [clothFile, setClothFile] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);

  const handleSubmit = async () => {
    if (!personFile || !clothFile) {
      alert("Please upload both images");
      return;
    }
    try {
      const url = await tryOn(personFile, clothFile);
      setResultUrl(url);
    } catch (err) {
      console.error(err);
      alert("Error generating try-on image");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Virtual Try-On</h2>
      <div style={{ marginBottom: "10px" }}>
        <label>Upload Person Image: </label>
        <input type="file" onChange={(e) => setPersonFile(e.target.files[0])} />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label>Upload Cloth Image: </label>
        <input type="file" onChange={(e) => setClothFile(e.target.files[0])} />
      </div>
      <button onClick={handleSubmit}>Try On</button>
      {resultUrl && (
        <div style={{ marginTop: "20px" }}>
          <h3>Result:</h3>
          <img src={resultUrl} alt="Try-on result" style={{ maxWidth: "100%" }} />
        </div>
      )}
    </div>
  );
}

async function tryOn(personFile, clothFile) {
  const formData = new FormData();
  formData.append("person_image", personFile);
  formData.append("cloth_image", clothFile);

  const response = await fetch(`${import.meta.env.VITE_TRYON_API}/tryon`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
