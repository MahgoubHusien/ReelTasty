"use client";

import React, { useEffect, useState } from 'react';
import { animate, stagger } from 'framer-motion';
import { FaBars } from 'react-icons/fa';
import userProfilePic from '/public/major.png';
import ThemeToggle from "@/components/ui/themeswitcher";

interface NavbarProps {
  isLoggedIn?: boolean;
  currentPage?: string;
}

const Navbar: React.FC<NavbarProps> = ({
  isLoggedIn = false,
  currentPage = "home",
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
    color: 'inherit', // Allow text color to be inherited based on the theme
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 'bold',
    fontSize: '0.75rem',
    transition: 'all 0.3s ease-in-out',
    borderBottom: currentPage === page ? '2px solid currentColor' : 'none',
  });

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-background bg-opacity-70 shadow-lg' : 'bg-transparent'
      } ${!isVisible ? '-top-20' : 'top-0'} text-foreground dark:text-white`}
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center">
          <a
            href="#home"
            className="nav-item transition-colors px-4 py-2 text-xl font-bold text-foreground dark:text-white"
          >
            Reel Tasty
          </a>
          <div className="ml-4 md:hidden">
            <ThemeToggle />
          </div>
          <div className="hidden md:flex space-x-4 items-center ml-8">
            <a href="#home" className="nav-item transition-colors px-2 py-1" style={navItemStyle('home')}>Home</a>
            <a href="#video-submission" className="nav-item transition-colors px-2 py-1" style={navItemStyle('video-submission')}>Recipe Generation</a>
            <a href="#trending-foods" className="nav-item transition-colors px-2 py-1" style={navItemStyle('trending-foods')}>Trending Foods</a>
            <a href="#recipes" className="nav-item transition-colors px-2 py-1" style={navItemStyle('recipes')}>Recipes</a>
          </div>
        </div>
        <div className="flex-grow"></div>
        <div className="hidden md:flex items-center space-x-4">
          <a
            href="#login"
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
          </a>
          <div className="ml-4">
            <ThemeToggle />
          </div>
        </div>
        <div className="md:hidden flex items-center space-x-4">
          {isLoggedIn && (
            <img src={userProfilePic as unknown as string} alt="User Profile" className="w-8 h-8 rounded-full object-cover" />
          )}
          <button onClick={toggleMenu} className="text-foreground dark:text-white focus:outline-none">
            <FaBars size={24} />
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-background bg-opacity-90 dark:bg-black text-foreground dark:text-white flex flex-col items-center md:hidden pb-4">
          <a href="#home" className="nav-item py-4 w-full text-center" style={navItemStyle('home')} onClick={toggleMenu}>Home</a>
          <a href="#video-submission" className="nav-item py-4 w-full text-center" style={navItemStyle('video-submission')} onClick={toggleMenu}>Recipe Generation</a>
          <a href="#trending-foods" className="nav-item py-4 w-full text-center" style={navItemStyle('trending-foods')} onClick={toggleMenu}>Trending Foods</a>
          <a href="#recipes" className="nav-item py-4 w-full text-center" style={navItemStyle('recipes')} onClick={toggleMenu}>Recipes</a>
          {isLoggedIn ? (
            <a href="#profile" className="nav-item py-4 w-full text-center" style={navItemStyle('profile')} onClick={toggleMenu}>
              <img src={userProfilePic as unknown as string} alt="User Profile" className="w-8 h-8 rounded-full object-cover mx-auto" />
            </a>
          ) : (
            <a
              href="#login"
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
            </a>
            
          )}
        </div>
        
      )}
    </nav>
  );
};

export default Navbar;
