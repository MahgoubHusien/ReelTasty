"use client";

import React, { useEffect } from 'react';
import { animate } from 'framer-motion';
import CoolButton from "./ui/button";
import { FaLocationArrow } from 'react-icons/fa';
import { TextGenerateEffect } from './ui/text-generate-effect';

const Hero: React.FC = () => {
  useEffect(() => {
    const titleElement = document.querySelector('.title');
    if (titleElement) {
      animate(titleElement, { opacity: [0, 1], y: [-20, 0] }, { duration: 0.8 });
    }
  }, []);

  return (
    <div className="relative flex items-center justify-center h-screen w-full bg-black text-white">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black opacity-90"></div>
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* Title */}
        <h2 className="uppercase tracking-widest text-xs text-center text-blue-100 mb-6">
          Reel Tasty
        </h2>
        
        {/* Text Generation Effect */}
        <TextGenerateEffect 
            words="Make Meals from Reels!"
            className="text-center mb-4 w-full max-w-xs md:max-w-md lg:max-w-lg mx-auto whitespace-nowrap flex justify-center"
            duration={0.7}
            filter={true}
        />


        {/* Subtitle */}
        <p className="text-base md:text-lg lg:text-xl max-w-2xl leading-relaxed mb-8 text-gray-300 mx-auto">
          Transforming cooking videos into detailed, actionable recipes. Discover trending dishes and connect with a vibrant community of food enthusiasts.
        </p>
        
        {/* Call to Action */}
        <div className="flex justify-center space-x-4">
          <a href="#">
            <CoolButton title="Explore Recipes" icon={<FaLocationArrow />} position='right' />
          </a>
        </div>
      </div>
    </div>
  );
}

export default Hero;
