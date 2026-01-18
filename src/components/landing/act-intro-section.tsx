"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MousePointer2 } from "lucide-react";

export function ActIntroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#FAFAFA] p-8">
      {/* Aurora Background Effect */}
      <div className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden">
        <motion.div
          animate={{
            x: ["-20%", "20%", "-20%"],
            y: ["-20%", "20%", "-20%"],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-[10%] -top-[30%] h-[70%] w-[70%] rounded-full bg-purple-200/20 blur-[120px]"
        />
        <motion.div
          animate={{
            x: ["20%", "-20%", "20%"],
            y: ["20%", "-20%", "20%"],
            scale: [1.2, 1, 1.2],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[20%] -right-[10%] h-[70%] w-[70%] rounded-full bg-blue-200/20 blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[20%] top-[20%] h-[50%] w-[50%] rounded-full bg-pink-100/30 blur-[100px]"
        />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="relative z-10 text-center"
      >
        {/* Subtitle */}
        <span className="mb-8 block text-sm uppercase tracking-[0.5em] text-gray-500 md:text-base">
          The Atelier of Dreams
        </span>

        {/* Main Title */}
        <h1 className="font-serif text-5xl leading-tight text-gray-900 drop-shadow-sm md:text-8xl lg:text-9xl">
          <span className="block">꿈꾸던 순간을,</span>
          <span className="block font-light italic text-gray-600">
            가장 꿈처럼.
          </span>
        </h1>
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="relative z-10 mt-16"
      >
        <Link
          href="/login"
          className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-black px-12 py-5 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-gray-800"
        >
          <span className="relative mr-3 font-serif text-lg tracking-wider md:text-xl">
            스튜디오 입장하기
          </span>
          <svg
            className="h-5 w-5 transition-transform group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          {/* Shine effect */}
          <div className="absolute inset-full top-0 z-5 block h-full w-1/2 -skew-x-12 transform bg-gradient-to-r from-transparent to-white opacity-20 transition-transform group-hover:animate-[shine_1s_ease-in-out]" />
        </Link>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-12 z-10 animate-bounce text-gray-400"
      >
        <MousePointer2 size={24} className="rotate-180" />
      </motion.div>
    </section>
  );
}
