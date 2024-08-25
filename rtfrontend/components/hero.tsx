"use client";

import React, { useEffect } from 'react';
import { AuroraBackground } from './ui/aurora-background';
import { TextGenerateEffect } from './ui/text-generate-effect';
import CoolButton from "./ui/button";
import { FaLocationArrow } from 'react-icons/fa';
import { animate } from 'framer-motion';

const Hero = () => {
  useEffect(() => {
    const titleElement = document.querySelector('.title');
    if (titleElement) {
      animate(titleElement, { opacity: [0, 1], y: [-20, 0] }, { duration: 0.8 });
    }
  }, []);

  return (
    <AuroraBackground className='relative pb-20 pt-36'>
      {/* Container */}
      <div className="relative z-10 flex items-center justify-center h-screen w-full">
        <div className="max-w-[90vw] md:max-w-2xl lg:max-w-[60vw] flex flex-col items-center text-center px-4">
          <h2 className="title uppercase tracking-widest text-xs text-center text-blue-100 text-xl md:text-2xl lg:text-3xl mb-4">
            Reel Tasty
          </h2>
          
          {/* Text with Effect */}
          <TextGenerateEffect 
            className="text-center mt-4 mb-4"
            words="Unlock the Recipe Behind Every Video" 
          />
          
          {/* Subtext */}
          <p className="mt-4 mb-6 text-base md:text-lg lg:text-xl leading-relaxed md:tracking-wider text-gray-300">
            Turn cooking videos from TikTok, YouTube Shorts, and Instagram Reels into detailed recipes. Discover trending dishes and connect with the community.
          </p>
          
          {/* Call to Action Button */}
          <div className="mt-6">
            <a href="#">  
              <CoolButton title="Explore Recipes" icon={<FaLocationArrow />} position='right' /> 
            </a>
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
}

export default Hero;
