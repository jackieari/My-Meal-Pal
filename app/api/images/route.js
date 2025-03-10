import { connectToDatabase } from "@/lib/mongodb";
import Image from "@/models/Image";

export async function POST(req) {
  await connectToDatabase();
  const { name, image } = await req.json();
  
  if (!name || !image) {
    return Response.json({ error: "Name and image are required" }, { status: 400 });
  }

  const newImage = new Image({
    name,
    image,  // URL or Base64 string
    date: new Date(),
  });

  await newImage.save();

  return Response.json(newImage, { status: 201 });
}

export async function GET(req) {
  await connectToDatabase();
  
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name) {
    return Response.json({ error: "Name query parameter is required" }, { status: 400 });
  }

  const images = await Image.find({ name }).sort({ date: -1 }); // Get images in descending order

  return Response.json({ images }, { status: 200 });
}