"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UploadFridgePage() {
    const [fridgeImages, setFridgeImages] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);
    const [userName, setUserName] = useState(""); // Store user's name here
    const router = useRouter();

    // Fetch user data on component mount
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const response = await fetch("/api/users/me", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${document.cookie.replace("access-token=", "")}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log("Fetched user data:", data);
                    setUserName(data.user.name);
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
            if (!userName) return;

            try {
                const url = `/api/images?name=${userName}`;
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    setFridgeImages(data.images);
                } else {
                    console.error("Failed to fetch images");
                }
            } catch (error) {
                console.error("Error fetching images:", error);
            }
        };

        fetchImages();
    }, [userName]);

    // Toggle image selection
    const toggleImageSelection = (img) => {
        setSelectedImages((prevSelected) => {
            if (prevSelected.includes(img)) {
                return prevSelected.filter((image) => image !== img);
            } else {
                return [...prevSelected, img];
            }
        });
    };

    // Navigate to analysis page with selected images
    const analyzeSelectedImages = () => {
        if (selectedImages.length === 0) return;
        const imageUrls = selectedImages.map((img) => encodeURIComponent(img.image)).join(",");
        router.push(`/analyze-fridge?images=${imageUrls}`);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-green-400 text-white p-6">
            <h1 className="text-4xl font-extrabold mb-4">Select Fridge Images</h1>
            <p className="text-lg mb-6">Choose one or more fridge images for analysis.</p>

            {/* Image Selection Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {fridgeImages.length === 0 ? (
                    <p className="text-lg text-gray-200">No images found</p>
                ) : (
                    fridgeImages.map((img, index) => (
                        <div
                            key={index}
                            onClick={() => toggleImageSelection(img)}
                            className={`border-4 rounded-lg overflow-hidden cursor-pointer transition ${
                                selectedImages.includes(img) ? "border-yellow-400 scale-110 shadow-lg" : "border-transparent"
                            }`}
                        >
                            <img src={img.image} alt={`Fridge ${index}`} className="w-32 h-32 object-cover" />
                        </div>
                    ))
                )}
            </div>

            {/* Selected Images Preview */}
            {selectedImages.length > 0 && (
                <div className="mt-6 p-4 bg-white bg-opacity-20 rounded-lg shadow-lg">
                    <h2 className="text-lg font-semibold mb-2">Selected Images:</h2>
                    <div className="flex flex-wrap gap-4">
                        {selectedImages.map((img, index) => (
                            <img key={index} src={img.image} alt="Selected Fridge" className="w-32 h-32 object-cover rounded-lg shadow-lg border-4 border-white" />
                        ))}
                    </div>
                    <button
                        onClick={analyzeSelectedImages}
                        className="mt-4 px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition"
                    >
                        🔍 Analyze Selected Images ({selectedImages.length})
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