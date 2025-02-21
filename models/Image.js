import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  imageUrl: { type: String, required: true }, // Assuming external storage, else use Buffer
}, { timestamps: true });

export default mongoose.models.Image || mongoose.model("Image", ImageSchema);