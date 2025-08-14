import io
import torch
import uvicorn
from PIL import Image
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse, StreamingResponse
from viton_model import VITONHDModel

app = FastAPI(title="VITON-HD Inference Service", version="1.0")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = VITONHDModel(device=device)
# model.load_state_dict(torch.load("models/viton_hd_weights.pth", map_location=device))

@app.post("/tryon")
async def try_on(person_image: UploadFile = File(...), cloth_image: UploadFile = File(...)):
    try:
        person_img = Image.open(io.BytesIO(await person_image.read())).convert("RGB")
        cloth_img = Image.open(io.BytesIO(await cloth_image.read())).convert("RGB")
        output_img = model.infer(person_img, cloth_img)
        buf = io.BytesIO()
        output_img.save(buf, format="PNG")
        buf.seek(0)
        return StreamingResponse(buf, media_type="image/png")
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
