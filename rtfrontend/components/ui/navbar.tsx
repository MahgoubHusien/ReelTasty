"use client";

import React, { useEffect, useState } from 'react';
import { animate, stagger } from 'framer-motion';
import { FaBars } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';
import userProfilePic from '/public/major.png';
import ThemeToggle from "@/components/ui/themeswitcher";

interface NavbarProps {
  currentPage?: string;
}

const Navbar: React.FC<NavbarProps> = ({
  currentPage = "home",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [showDropdown, setShowDropdown] = useState(false); 

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleDropdown = () => setShowDropdown(!showDropdown);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.pageYOffset;
      setIsScrolled(currentScrollPos > 50);
      setIsVisible(prevScrollPos > currentScrollPos || currentScrollPos < 10);
      setPrevScrollPos(currentScrollPos);
    };

    setPrevScrollPos(window.pageYOffset);
    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

  useEffect(() => {
    const navItems = document.querySelectorAll('.nav-item');
    animate(navItems, { opacity: [0, 1], y: [-10, 0] }, { duration: 0.3, delay: stagger(0.05) });
  }, [isOpen]);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    console.log("Checking token in localStorage:", token); 

    if (token) {
      console.log("User is logged in"); 
      setIsLoggedIn(true);
    } else {
      console.log("User is not logged in"); 
      setIsLoggedIn(false);
    }
  }, [isLoggedIn]); 

  const handleLogout = () => {
    console.log("Logging out"); 
    localStorage.removeItem("authToken");
    setIsLoggedIn(false);
  };

  const navItemStyle = (page: string) => ({
    color: 'inherit', 
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 'bold',
    fontSize: '0.75rem',
    transition: 'all 0.3s ease-in-out',
    borderBottom: currentPage === page ? '2px solid currentColor' : 'none',
  });

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled || isOpen
          ? 'bg-background dark:bg-background-dark shadow-lg'
          : 'bg-transparent'
      } ${!isVisible ? '-top-20' : 'top-0'} text-foreground dark:text-white`}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center">
          {/* Logo Element */}
          <Link
            href="/"
            className="nav-item transition-colors px-4 py-2 text-xl font-bold text-foreground dark:text-white"
          >
            Reel Tasty
          </Link>
          <div className="ml-4 md:hidden">
            <ThemeToggle />
          </div>
          <div className="hidden md:flex space-x-4 items-center ml-8">
            <Link href="/" className="nav-item transition-colors px-2 py-1" style={navItemStyle('home')}>Home</Link>
            <Link href="/recipeGeneration" className="nav-item transition-colors px-2 py-1" style={navItemStyle('recipeGeneration')}>Recipe Generation</Link>
            <Link href="/trendingFoods" className="nav-item transition-colors px-2 py-1" style={navItemStyle('trendingFoods')}>Trending Foods</Link>
            <Link href="/yourRecipes" className="nav-item transition-colors px-2 py-1" style={navItemStyle('yourRecipes')}>Your Recipes</Link>
          </div>
        </div>
        <div className="flex-grow"></div>
        <div className="hidden md:flex items-center space-x-4">
        {isLoggedIn ? (
          <div className="relative inline-block">
          <div
            className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-700 cursor-pointer flex items-center justify-center bg-white dark:bg-gray-800 shadow-md"
            onClick={toggleDropdown}
          >
            <Image
              src={userProfilePic}
              alt="User Profile"
              className="w-full h-full object-cover"
            />
          </div>
          {showDropdown && (
            <div
              className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-20 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2 z-10 text-center"
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              <Link href="/profile">
                <span className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Profile
                </span>
              </Link>
              <span
                className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                onClick={handleLogout}
              >
                Logout
              </span>
            </div>
          )}
        </div>
        ) : (
          <Link
            href="/auth?view=login"
            className="relative inline-flex h-8 px-4 py-2 items-center justify-center overflow-hidden rounded-lg transition-transform transform hover:scale-105"
            style={{
              backgroundColor: '#357ABD',
              color: 'white',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 'bold',
              fontSize: '0.75rem',
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            Login
          </Link>
        )}

          <div className="ml-4">
            <ThemeToggle />
          </div>
        </div>

        <div className="md:hidden flex items-center space-x-4">
          <button onClick={toggleMenu} className="text-foreground dark:text-white focus:outline-none">
            <FaBars size={24} />
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-background bg-opacity-100 dark:bg-background-dark text-foreground dark:text-white flex flex-col items-center md:hidden pb-4">
          <Link href="/" className="nav-item py-4 w-full text-center" style={navItemStyle('home')} onClick={toggleMenu}>Home</Link>
          <Link href="/recipeGeneration" className="nav-item py-4 w-full text-center" style={navItemStyle('recipeGeneration')} onClick={toggleMenu}>Recipe Generation</Link>
          <Link href="/trendingFoods" className="nav-item py-4 w-full text-center" style={navItemStyle('trendingFoods')} onClick={toggleMenu}>Trending Foods</Link>
          <Link href="/yourRecipes" className="nav-item py-4 w-full text-center" style={navItemStyle('yourRecipes')} onClick={toggleMenu}>Your Recipes</Link>
          {isLoggedIn ? (
            <div className="nav-item py-4 w-full text-center">
              <Image src={userProfilePic} alt="User Profile" className="w-8 h-8 rounded-full object-cover mx-auto cursor-pointer" onClick={toggleDropdown} />
              {showDropdown && (
                <div
                  className="absolute right-0 md:right-0 md:left-auto left-1/2 transform md:translate-x-0 -translate-x-1/2 mt-2 w-20 bg-white dark:bg-gray-800 shadow-lg rounded-lg py-2"
                  onMouseEnter={() => setShowDropdown(true)}
                  onMouseLeave={() => setShowDropdown(false)}
                >
                  <Link href="/profile">
                    <span className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                      Profile
                    </span>
                  </Link>
                  <span
                    className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={handleLogout}
                  >
                    Logout
                  </span>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth?view=login"
              className="nav-item relative inline-flex h-8 px-4 py-2 items-center justify-center overflow-hidden rounded-lg transition-transform transform hover:scale-105"
              style={{
                backgroundColor: '#357ABD',
                color: 'white',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 'bold',
                fontSize: '0.75rem',
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                marginBottom: '12px',
              }}
              onClick={toggleMenu}
            >
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
