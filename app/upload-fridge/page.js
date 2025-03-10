"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UploadFridgePage() {
    const [fridgeImages, setFridgeImages] = useState([]);
    const [focusedImage, setFocusedImage] = useState(null);
    const [userName, setUserName] = useState(""); // Store user's name here
    const router = useRouter();

    // Fetch user data on component mount
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const response = await fetch("/api/users/me", {  // Use the correct API endpoint to get user info
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${document.cookie.replace("access-token=", "")}`,  // Assuming you have token-based authentication
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log("Fetched user data:", data);
                    setUserName(data.user.name);  // Set the user name from the API response
                } else {
                    console.error("Failed to fetch user data");
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        fetchUserInfo();
    }, []);

    // Fetch fridge images for the user
    useEffect(() => {
        const fetchImages = async () => {
            if (!userName) {
                console.log("No user name set"); // Debugging line
                return;
            }

            try {
                const url = `/api/images?name=${userName}`;  // Correct API endpoint
                console.log("Fetching images from URL:", url);  // Log the URL for debugging

                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    console.log("Fetched images:", data); // Debugging line
                    setFridgeImages(data.images);
                } else {
                    console.error("Failed to fetch images"); // Log error
                }
            } catch (error) {
                console.error("Error fetching images:", error); // Log error
            }
        };

        fetchImages();
    }, [userName]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-green-400 text-white p-6">
            <h1 className="text-4xl font-extrabold mb-4">Select Fridge Image</h1>
            <p className="text-lg mb-6">Choose an uploaded fridge image for analysis.</p>

            {/* Image Selection Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {fridgeImages.length === 0 ? (
                    <p className="text-lg text-gray-200">No images found</p>
                ) : (
                    fridgeImages.map((img, index) => (
                        <div
                            key={index}
                            onClick={() => setFocusedImage(img)}
                            className={`border-4 rounded-lg overflow-hidden cursor-pointer transition ${
                                focusedImage === img ? "border-yellow-400" : "border-transparent"
                            }`}
                        >
                            <img src={img.image} alt={`Fridge ${index}`} className="w-32 h-32 object-cover" />
                        </div>
                    ))
                )}
            </div>

            {/* Focused Image Display */}
            {focusedImage && (
                <div className="mt-6">
                    <p className="text-md font-semibold mb-2">Selected Image:</p>
                    <img src={focusedImage.image} alt="Focused Fridge" className="w-64 h-64 object-cover rounded-lg shadow-xl border-4 border-white" />
                    <button
                        onClick={() => router.push(`/analyze-fridge?image=${encodeURIComponent(focusedImage.image)}`)}
                        className="mt-4 px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition"
                    >
                        🔍 Analyze This Image
                    </button>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-12 flex gap-4">
                <Link href="/home" className="px-5 py-2 bg-gray-800 text-white rounded-lg shadow-md hover:bg-gray-700 transition">
                    🏠 Home
                </Link>
            </div>
        </div>
    );
}