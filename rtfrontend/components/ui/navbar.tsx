"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { animate, stagger } from 'framer-motion';
import { FaBars } from 'react-icons/fa';
import Link from 'next/link';
import ThemeToggle from "@/components/ui/themeswitcher";

interface NavbarProps {
  currentPage?: string;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage = "home" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

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

    if (token) {
      fetchUsername(token);
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, [isLoggedIn]);

  const fetchUsername = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/User/Profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsername(data.userName || '');
      } else if (response.status === 401) {
        handleLogout();
      } else {
        console.error("Failed to fetch username: ", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching username:", error);
      handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    setIsLoggedIn(false);
    setUsername('');
    router.push("/auth?view=login");
  };

  const navItemStyle = (page: string) => ({
    color: 'inherit',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 'bold',
    fontSize: '0.75rem',
    transition: 'all 0.3s ease-in-out',
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
          <Link
            href="/"
            className="nav-item transition-colors px-4 py-2 text-2xl font-bold text-foreground dark:text-white"
          >
            Reel Tasty!
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
              className="px-4 py-2 rounded-lg border-2 cursor-pointer flex items-center justify-center shadow-md"
              style={{
                borderColor: "#CBACF9",
                backgroundColor: "white",
              }}
              onClick={toggleDropdown}
            >
              <span className="text-gray-800 dark:text-white font-bold text-sm">
                {username.length > 8
                  ? `${username.charAt(0).toUpperCase()}${username.slice(1, 7)}...`
                  : username.charAt(0).toUpperCase() + username.slice(1)}
              </span>
            </div>
            {showDropdown && (
              <div
              className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-16 bg-white dark:bg-gray-800 shadow-lg rounded-lg z-10 text-center"
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
              >
                <span
                  className="block px-2 py-2 text-gray-800 dark:text-gray-200 cursor-pointer"
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
            <div className="nav-item py-4 w-50px text-center">
              <div
                className="px-4 py-2 rounded-lg border-2 cursor-pointer shadow-md flex items-center justify-center"
                style={{
                  borderColor: "#CBACF9",
                  backgroundColor: "var(--color-bg-dark-mode)",
                }}
                onClick={toggleDropdown}
              >
                <span className="text-sm font-bold text-gray-800 dark:text-white">
                  {username.length > 8
                    ? `${username.charAt(0).toUpperCase()}${username.slice(1, 7)}...`
                    : username.charAt(0).toUpperCase() + username.slice(1)}
                </span>
              </div>
              {showDropdown && (
                <div
                  className="absolute right-0 md:right-0 md:left-auto left-1/2 transform md:translate-x-0 -translate-x-1/2 mt-2 w-16 bg-white dark:bg-gray-800 shadow-lg rounded-lg"
                  onMouseEnter={() => setShowDropdown(true)}
                  onMouseLeave={() => setShowDropdown(false)}
                >
                  <span
                    className="block px-2 py-2 text-gray-800 dark:text-gray-200 cursor-pointer"
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
