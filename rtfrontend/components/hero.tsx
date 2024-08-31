"use client";

import React, { useEffect } from "react";
import { animate } from "framer-motion";
import CoolButton from "./ui/button";
import { FaLocationArrow } from "react-icons/fa";
import { TextGenerateEffect } from "./ui/text-generate-effect";
import { AnimatedBeamMultipleOutputDemo } from "./magicui/animateBeamMultiple";
import Link from "next/link";

const Hero: React.FC = () => {
  useEffect(() => {
    const titleElement = document.querySelector(".title");
    if (titleElement) {
      animate(titleElement, { opacity: [0, 1], y: [-20, 0] }, { duration: 0.8 });
    }
  }, []);

  return (
    <div className="relative flex items-center justify-center min-h-screen w-full overflow-hidden">
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center w-full px-4 mt-24 md:mt-0 space-y-4 md:space-y-0">
        {/* Left Content */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-full md:max-w-lg space-y-2 md:space-y-4">
          {/* Title */}
          <h2 className="uppercase tracking-widest text-xs text-foreground dark:text-white mb-2">
            Reel Tasty
          </h2>

          {/* Text Generation Effect */}
          <TextGenerateEffect
            words="Make Meals from Reels!"
            className="text-center md:text-left w-full max-w-xs md:max-w-md lg:max-w-lg text-foreground dark:text-white"
            duration={0.7}
            filter={true}
          />

          {/* Subtitle */}
          <p className="text-sm md:text-lg lg:text-xl max-w-xs md:max-w-sm lg:max-w-md leading-relaxed text-foreground dark:text-white">
            Transforming cooking videos into detailed, actionable recipes. Discover trending dishes and connect with a vibrant community of food enthusiasts.
          </p>

          {/* Call to Action */}
          <div className="flex justify-center md:justify-start">
            <Link href="/auth">
              <CoolButton title="Explore Recipes" icon={<FaLocationArrow />} position="right" />
            </Link>
          </div>
        </div>

        {/* Animated Beam Component */}
        <div className="flex-shrink-0 mt-8 md:mt-0 md:ml-4 lg:ml-8 flex items-center">
          <AnimatedBeamMultipleOutputDemo className="bg-transparent border-none h-[250px] shadow-none" />
        </div>
      </div>
    </div>
  );
};

export default Hero;