// routes/tryon.js
import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.post("/", async (req, res) => {
  const { userImage, garmentImage } = req.body;

  if (!userImage || !garmentImage) {
    return res.status(400).json({ error: "Missing inputs" });
  }

  try {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "YOUR_MODEL_ID", // Replace with real try-on model ID
        input: { person: userImage, clothing: garmentImage },
      }),
    });

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    // Result will have output URLs
    res.json({ resultUrl: result.output[0] });
  } catch (err) {
    console.error("AI Try-On Error:", err);
    res.status(500).json({ error: "AI try-on failed" });
  }
});

export default router;
