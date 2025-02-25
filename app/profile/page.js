"use client";
import Link from "next/link";

export default function ProfilePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <h1 className="text-3xl font-bold mb-4">Profile Page</h1>
            <p className="text-lg mb-6">This is where users can manage their profiles.</p>

            <div className="flex gap-4">
                <Link href="/" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Home
                </Link>
                {/* Changed "Upload Fridge" to "Settings" */}
                <Link href="/settings" className="px-4 py-2 bg-purple-400 -500 text-white rounded hover:bg-green-600">
                    ⚙️ Settings
                </Link>
            </div>
        </div>
    );
}