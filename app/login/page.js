"use client";
import Link from "next/link";

import { useState } from 'react';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (isLogin) {
                // Login logic
                const response = await fetch('/api/users/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });

                if (response.ok) {
                    // Redirect to profile or dashboard
                    window.location.href = '/profile';
                } else {
                    const errorData = await response.json();
                    setError(errorData.message || 'Login failed');
                }
            } else {
                // Registration logic
                const response = await fetch('/api/users/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });

                if (response.ok) {
                    // Automatically log in after registration
                    window.location.href = '/profile';
                } else {
                    const errorData = await response.json();
                    setError(errorData.message || 'Registration failed');
                }
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error(err);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold text-center">
                    {isLogin ? 'Login' : 'Register'}
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block mb-2">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block mb-2">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-3 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="w-full py-2 bg-blue-500 rounded hover:bg-blue-600 transition duration-300"
                    >
                        {isLogin ? 'Login' : 'Register'}
                    </button>
                </form>

                <div className="text-center">
                    <button 
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-blue-400 hover:underline"
                    >
                        {isLogin 
                            ? 'Need an account? Register' 
                            : 'Already have an account? Login'}
                    </button>
                </div>

                <div className="flex gap-4 justify-center">
                    <Link href="/" className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">
                        Home
                    </Link>
                    <Link href="/profile" className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
                        Profile
                    </Link>
                </div>
            </div>
        </div>
    );
}