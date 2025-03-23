import axios from 'axios';

export default async function handler(req, res) {
  const { imageUrls } = req.body;

  console.log("Received image URLs:", imageUrls);  // Log incoming URLs

  try {
    const response = await axios({
      method: 'POST',
      url: 'https://detect.roboflow.com/aicook-lcv4d/3',
      params: {
        api_key: 't37wtQdpUC2586fdcs4t',
        image: imageUrls[0], // RoboFlow accepts only one image per request
      },
    });

    console.log("RoboFlow response:", response.data);  // Log response data
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error in RoboFlow API:", error);
    res.status(500).json({ error: "Error processing the images" });
  }
}