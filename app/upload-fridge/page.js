"use client";
import { useState } from "react";
import Link from "next/link";

export default function UploadFridgePage() {
    const [selectedImage, setSelectedImage] = useState(null);

    // Handle file selection
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedImage(URL.createObjectURL(file)); // Show preview
        }
    };

    // Handle camera access
    const handleTakePhoto = () => {
        document.getElementById("cameraInput").click();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-green-400 text-white p-6">
            <h1 className="text-4xl font-extrabold mb-4">Upload Fridge</h1>
            <p className="text-lg mb-6">Upload a picture of your fridge to get recipe suggestions.</p>

            {/* Buttons for Upload & Camera - Placed Side by Side */}
            <div className="flex gap-4 mb-6">
                {/* Upload Button */}
                <input type="file" id="fileInput" accept="image/*" onChange={handleFileChange} className="hidden" />
                <button
                    onClick={() => document.getElementById("fileInput").click()}
                    className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-md hover:bg-blue-100 transition"
                >
                    📁 Upload Image
                </button>

                {/* Take a Photo Button */}
                <input type="file" id="cameraInput" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                <button
                    onClick={handleTakePhoto}
                    className="px-6 py-3 bg-white text-green-600 font-semibold rounded-lg shadow-md hover:bg-green-100 transition"
                >
                    📸 Take a Picture
                </button>
            </div>

            {/* Image Preview */}
            {selectedImage && (
                <div className="mt-6">
                    <p className="text-md font-semibold">Preview:</p>
                    <img src={selectedImage} alt="Uploaded" className="w-64 h-64 object-cover rounded-lg mt-2 shadow-xl border-4 border-white" />
                </div>
            )}

            {/* Navigation Buttons - Placed Lower */}
            <div className="mt-12 flex gap-4">
                <Link href="/" className="px-5 py-2 bg-gray-800 text-white rounded-lg shadow-md hover:bg-gray-700 transition">
                    🏠 Home
                </Link>
                <Link href="/profile" className="px-5 py-2 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-500 transition">
                    👤 Profile
                </Link>
            </div>
        </div>
    );
}