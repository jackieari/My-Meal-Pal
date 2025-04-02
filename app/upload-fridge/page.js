"use client"; 

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";

export default function MultiImageSelectionPage() {
  const [fridgeImages, setFridgeImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [userName, setUserName] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ingredients, setIngredients] = useState([]);
  const [newIngredient, setNewIngredient] = useState("");
  const router = useRouter();

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
          setUserName(data.user.name);
        } else {
          console.error("Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();

    const handleClickOutside = (event) => {
      if (settingsOpen && !event.target.closest(".settings-dropdown")) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [settingsOpen]);

  useEffect(() => {
    const fetchImages = async () => {
      if (!userName) {
        console.log("No user name set");
        return;
      }

      try {
        const url = `/api/images?name=${userName}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setFridgeImages(data.images || []);
        } else {
          console.error("Failed to fetch images");
        }
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    };

    if (userName) {
      fetchImages();
    }
  }, [userName]);

  const toggleSettings = () => {
    setSettingsOpen(!settingsOpen);
  };

  const handleLogout = () => {
    document.cookie = "access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    router.push("/login");
  };

  const toggleImageSelection = (img) => {
    if (selectedImage === img) {
      setSelectedImage(null);
    } else {
      setSelectedImage(img);
    }
  };

  const analyzeSelectedImage = async () => {
    if (!selectedImage) return;

    try {
      const imageUrl = selectedImage.image;

      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);

      reader.onloadend = async () => {
        const base64Image = reader.result.split(",")[1];

        try {
          const res = await axios({
            method: "POST",
            url: "https://detect.roboflow.com/aicook-lcv4d/3",
            params: {
              api_key: "t37wtQdpUC2586fdcs4t", // Replace with your actual API key
            },
            data: base64Image,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          });

          if (res.data && Array.isArray(res.data.predictions)) {
            const detectedIngredients = res.data.predictions.map(prediction => prediction.class);
            // Combine the new ingredients with the existing ones
            setIngredients((prevIngredients) => {
              const updatedIngredients = [...new Set([...prevIngredients, ...detectedIngredients])];
              return updatedIngredients;
            });
          } else {
            setIngredients([]);
          }
        } catch (error) {
          console.error("Error with Roboflow API:", error.message);
        }
      };
    } catch (error) {
      console.error("Error processing image:", error);
    }
  };

  const handleDeleteIngredient = (ingredientToDelete) => {
    setIngredients(ingredients.filter(ingredient => ingredient !== ingredientToDelete));
  };

  const handleAddIngredient = () => {
    if (newIngredient && !ingredients.includes(newIngredient)) {
      setIngredients(prevIngredients => {
        // Add new ingredient and remove duplicates
        const updatedIngredients = [...prevIngredients, newIngredient];
        return [...new Set(updatedIngredients)];
      });
      setNewIngredient("");
    }
  };

  const handleSubmitIngredients = () => {
    console.log("Submitting Ingredients: ", ingredients);
    //save detected ingredients
    localStorage.setItem("detectedIngredients", JSON.stringify(ingredients));
    // Redirect to the recipes page
    router.push("/recipes");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  const mockImages =
    fridgeImages.length > 0
      ? fridgeImages
      : [
          { id: 1, image: "/placeholder.svg?height=300&width=300", date: "2023-03-10" },
          { id: 2, image: "/placeholder.svg?height=300&width=300", date: "2023-03-09" },
          { id: 3, image: "/placeholder.svg?height=300&width=300", date: "2023-03-08" },
          { id: 4, image: "/placeholder.svg?height=300&width=300", date: "2023-03-07" },
        ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 p-4 shadow-md sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Meal Pal</h1>
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-white hover:text-blue-300">Home</Link>
            <Link href="/meal-planner" className="text-white hover:text-blue-300">Meal Planner</Link>
            <Link href="/nutrition" className="text-white hover:text-blue-300">Nutrition</Link>
            <div className="relative settings-dropdown">
              <button onClick={toggleSettings} className="p-2 rounded-full hover:bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              {settingsOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-10">
                  <div className="px-4 py-2 border-b border-gray-700">
                    <p className="text-sm font-medium">Signed in as</p>
                    <p className="text-sm font-bold truncate">{userName}</p>
                  </div>
                  <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-gray-700">Your Profile</Link>
                  <Link href="/settings" className="block px-4 py-2 text-sm hover:bg-gray-700">Settings</Link>
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700">
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4 md:p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Select Your Fridge Image</h2>
          <p className="text-lg">Choose one image for analysis.</p>
        </div>

        <div className="mb-4">
          {selectedImage && (
            <div className="flex items-center space-x-4">
              <img src={selectedImage.image} alt="Selected Fridge" className="w-32 h-32 object-cover rounded-md" />
              <button onClick={() => setSelectedImage(null)} className="text-red-500 hover:text-red-700">
                Deselect
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
          {mockImages.map((image) => (
            <div key={image.id} className={`cursor-pointer rounded-md ${selectedImage === image ? "border-4 border-blue-500" : ""}`} onClick={() => toggleImageSelection(image)}>
              <Image src={image.image} alt={`Fridge Image ${image.id}`} width={300} height={300} className="w-full h-full object-cover rounded-md" />
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button onClick={analyzeSelectedImage} disabled={!selectedImage} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:bg-gray-500">
            Analyze Selected Image
          </button>
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-semibold">Ingredients:</h3>
          
          <div className="flex overflow-x-auto space-x-4 mt-4">
            {ingredients.length > 0 ? (
              ingredients.map((ingredient, index) => (
                <div key={index} className="flex-shrink-0 bg-gray-800 rounded-md px-4 py-2 text-white flex items-center justify-between">
                  <span>{ingredient}</span>
                  <button onClick={() => handleDeleteIngredient(ingredient)} className="ml-2 text-red-500 hover:text-red-700">Delete</button>
                </div>
              ))
            ) : (
              <p className="text-lg text-gray-400">No ingredients detected.</p>
            )}
          </div>

          <div className="mt-4">
            <input
              type="text"
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              placeholder="Add a new ingredient"
              className="px-4 py-2 rounded-md w-full"
            />
            <button onClick={handleAddIngredient} className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500">
              Add Ingredient
            </button>
          </div>

          <div className="mt-4 flex justify-center">
            <button onClick={handleSubmitIngredients} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500">
              Submit Ingredients
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}