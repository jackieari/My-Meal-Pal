"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ProfilePage() {
    const [userName, setUserName] = useState('');
    const [dietaryRestrictions, setDietaryRestrictions] = useState('');
    const [calorieLimit, setCalorieLimit] = useState('');
    const [allergens, setAllergens] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const response = await fetch('/api/users/me', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${document.cookie.replace('access-token=', '')}`, // Get token from cookies
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserName(data.user.name); // Set the user's name
                    setDietaryRestrictions(data.user.nutritionalPreferences.dietaryRestrictions.join(', ')); // Set dietary restrictions
                    setCalorieLimit(data.user.nutritionalPreferences.calorieLimit || ''); // Set calorie limit
                    setAllergens(data.user.nutritionalPreferences.allergens.join(', ')); // Set allergens
                } else {
                    console.error('Failed to fetch user data');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserInfo();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('/api/users/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${document.cookie.replace('access-token=', '')}`,
                },
                body: JSON.stringify({
                    dietaryRestrictions: dietaryRestrictions.split(',').map(item => item.trim()),
                    calorieLimit: calorieLimit ? parseInt(calorieLimit, 10) : null,
                    allergens: allergens.split(',').map(item => item.trim()),
                }),
            });

            if (response.ok) {
                alert('Profile updated successfully!');
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to update profile');
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error(err);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <h1 className="text-3xl font-bold mb-4">Welcome, {userName}</h1>
            <p className="text-lg mb-6">This is where you can manage your profile.</p>

            <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
                {/* Dietary Restrictions */}
                <div>
                    <label htmlFor="dietaryRestrictions" className="block mb-2">Dietary Restrictions (comma separated)</label>
                    <input
                        type="text"
                        id="dietaryRestrictions"
                        value={dietaryRestrictions}
                        onChange={(e) => setDietaryRestrictions(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Calorie Limit */}
                <div>
                    <label htmlFor="calorieLimit" className="block mb-2">Calorie Limit</label>
                    <input
                        type="number"
                        id="calorieLimit"
                        value={calorieLimit}
                        onChange={(e) => setCalorieLimit(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Allergens */}
                <div>
                    <label htmlFor="allergens" className="block mb-2">Allergens (comma separated)</label>
                    <input
                        type="text"
                        id="allergens"
                        value={allergens}
                        onChange={(e) => setAllergens(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Error message */}
                {error && (
                    <div className="text-red-500 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Submit button */}
                <button
                    type="submit"
                    className="w-full py-2 bg-blue-500 rounded hover:bg-blue-600 transition duration-300"
                >
                    Update Profile
                </button>
            </form>

            <div className="flex gap-4 mt-6">
                <Link href="/home" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Home
                </Link>
                <Link href="/settings" className="px-4 py-2 bg-purple-400 text-white rounded hover:bg-green-600">
                    ⚙️ Settings
                </Link>
            </div>
        </div>
    );
}