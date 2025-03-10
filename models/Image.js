import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, default: Date.now },
  image: { type: String, required: true }, // This should be a URL or Base64 string
});

const Image = mongoose.models.Image || mongoose.model("Image", ImageSchema);
export default Image;