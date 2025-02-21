import { connectToDatabase } from "@/lib/mongodb";
import Image from "@/models/Image";

export async function GET() {
  await connectToDatabase();
  const images = await Image.find({});
  return Response.json(images);
}

export async function POST(req) {
  await connectToDatabase();
  const data = await req.json();

  const newImage = new Image(data);
  await newImage.save();

  return Response.json(newImage, { status: 201 });
}
