"use client";

import React from "react";
import Link from "next/link";

const HomePage: React.FC = () => {
  const trendingRecipes = [
    // Add some dummy data for the sake of the example
    {
      id: 1,
      title: "Spicy Chicken Ramen",
      image: "/images/ramen.jpg",
      description: "A fiery twist on traditional ramen.",
    },
    {
      id: 2,
      title: "Vegan Avocado Toast",
      image: "/images/avocado-toast.jpg",
      description: "Healthy and delicious avocado toast.",
    },
    {
      id: 3,
      title: "Classic Beef Tacos",
      image: "/images/tacos.jpg",
      description: "Tacos with a traditional beef filling.",
    },
  ];

  const recentRecipes = [
    // Add some dummy data for the sake of the example
    {
      id: 1,
      title: "Pancakes with Maple Syrup",
      image: "/images/pancakes.jpg",
      description: "Fluffy pancakes topped with sweet maple syrup.",
    },
    {
      id: 2,
      title: "Grilled Salmon",
      image: "/images/salmon.jpg",
      description: "Perfectly grilled salmon with a side of veggies.",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark py-8 px-4 pt-20"> 
      <div className="max-w-7xl mx-auto">
        {/* Trending Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Trending Recipes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {trendingRecipes.map((recipe) => (
              <Link key={recipe.id} href={`/recipe/${recipe.id}`}>
                <div className="bg-card dark:bg-card-dark p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <h3 className="text-xl font-semibold mb-2">{recipe.title}</h3>
                  <p className="text-sm text-muted dark:text-muted-dark">
                    {recipe.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Recipes Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Recently Saved Recipes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {recentRecipes.map((recipe) => (
              <Link key={recipe.id} href={`/recipe/${recipe.id}`}>
                <div className="bg-card dark:bg-card-dark p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <h3 className="text-xl font-semibold mb-2">{recipe.title}</h3>
                  <p className="text-sm text-muted dark:text-muted-dark">
                    {recipe.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Explore More Recipes</h2>
          <p className="text-sm mb-8 text-muted dark:text-muted-dark">
            Discover new dishes and save your favorite recipes to cook later.
          </p>
          <Link 
            href="/recipes" 
            className="inline-block bg-[primary] dark:bg-[#357ABD] text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors">
                Browse All Recipes
          </Link>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
