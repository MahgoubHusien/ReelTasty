"use client";

import React, { useEffect, useState } from 'react';
import { animate, stagger } from 'framer-motion';
import { FaBars } from 'react-icons/fa'; 
import userProfilePic from '/public/major.png'; // Replace with the actual path to the profile picture
import ToggleSwitch from "@/components/ui/themeswitcher"; // Import the ToggleSwitch component

interface NavbarProps {
  isLoggedIn?: boolean;
  currentPage?: string;
}

const Navbar: React.FC<NavbarProps> = ({
  isLoggedIn = false, // Default to not logged in
  currentPage = "home", // Default to "home" page
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const toggleMenu = () => setIsOpen(!isOpen);

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

  const navItemStyle = (page: string) => ({
    color: currentPage === page ? 'rgb(153, 102, 255)' : 'white',
    fontFamily: "'Poppins', sans-serif",
    transition: 'all 0.3s ease-in-out',
    borderBottom: 'none', // No underline for dropdown menu items
  });

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 backdrop-blur-md transition-all duration-300 ${
        isScrolled ? 'bg-black bg-opacity-80' : 'bg-transparent'
      } ${!isVisible ? '-top-20' : 'top-0'}`}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center space-x-4">
          <div className="nav-item text-xl font-bold" style={{ color: 'white' }}>
            Reel Tasty
          </div>
          <ToggleSwitch /> {/* Place ToggleSwitch button next to Reel Tasty */}
        </div>
        <div className="flex-grow"></div>
        <div className="hidden md:flex space-x-6 items-center">
          <a href="#home" className="nav-item transition-colors px-4 py-2" style={navItemStyle('home')}>Home</a>
          <a href="#video-submission" className="nav-item transition-colors px-4 py-2" style={navItemStyle('video-submission')}>Recipe Generation</a>
          <a href="#trending-foods" className="nav-item transition-colors px-4 py-2" style={navItemStyle('trending-foods')}>Trending Foods</a>
          <a href="#recipes" className="nav-item transition-colors px-4 py-2" style={navItemStyle('recipes')}>Recipes</a>
          {isLoggedIn ? (
            <img src={userProfilePic as unknown as string} alt="User Profile" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <a href="#login" className="nav-item transition-colors px-4 py-2 rounded-full" style={{ backgroundColor: 'rgb(153, 102, 255)', color: 'white', fontFamily: "'Poppins', sans-serif" }}>Login</a>
          )}
        </div>
        <div className="md:hidden flex items-center space-x-4">
          {isLoggedIn && (
            <img src={userProfilePic as unknown as string} alt="User Profile" className="w-8 h-8 rounded-full object-cover" />
          )}
          <button onClick={toggleMenu} className="text-white focus:outline-none">
            <FaBars size={24} /> {/* Menu icon */}
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-zinc-900 text-white flex flex-col items-center md:hidden pb-4">
          <a href="#home" className="nav-item py-4 w-full text-center" style={navItemStyle('home')} onClick={toggleMenu}>Home</a>
          <a href="#video-submission" className="nav-item py-4 w-full text-center" style={navItemStyle('video-submission')} onClick={toggleMenu}>Recipe Generation</a>
          <a href="#trending-foods" className="nav-item py-4 w-full text-center" style={navItemStyle('trending-foods')} onClick={toggleMenu}>Trending Foods</a>
          <a href="#recipes" className="nav-item py-4 w-full text-center" style={navItemStyle('recipes')} onClick={toggleMenu}>Recipes</a>
          {isLoggedIn ? (
            <a href="#profile" className="nav-item py-4 w-full text-center" style={navItemStyle('profile')} onClick={toggleMenu}>
              <img src={userProfilePic as unknown as string} alt="User Profile" className="w-8 h-8 rounded-full object-cover mx-auto" />
            </a>
          ) : (
            <a href="#login" className="nav-item py-4 pb-6 mt-4 text-center transition-colors rounded-full inline-block" style={{ backgroundColor: 'rgb(153, 102, 255)', color: 'white', width: 'auto', padding: '8px 16px', fontFamily: "'Poppins', sans-serif", marginBottom: '12px' }} onClick={toggleMenu}>Login</a>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
