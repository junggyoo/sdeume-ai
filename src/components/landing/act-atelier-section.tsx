"use client";

import { motion } from "framer-motion";

const THEMES = [
  {
    id: "white",
    name: "White Poem",
    desc: "순백의 시, 빛으로 쓴 사랑의 언어",
    gradient: "from-[#EAE0D5]/20 to-[#D4C5B5]/10",
  },
  {
    id: "garden",
    name: "Garden Whisper",
    desc: "영원히 지지 않는 봄의 정원",
    gradient: "from-[#2E5E5E]/30 to-[#1A3C3C]/20",
  },
  {
    id: "classic",
    name: "Classic Legacy",
    desc: "시간을 견뎌낸 영화 같은 우아함",
    gradient: "from-[#4A3B45]/30 to-[#2A1F25]/20",
  },
];

export function ActAtelierSection() {
  return (
    <section className="relative py-24 md:py-32 bg-deep-navy overflow-hidden">
      {/* Section Header */}
      <div className="container mx-auto px-4 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center md:text-left"
        >
          <span className="text-champagne-gold/60 tracking-widest uppercase text-sm mb-4 block">
            The Atelier
          </span>
          <h2 className="text-4xl md:text-6xl font-serif text-champagne-gold font-light leading-tight break-keep">
            Choose Your Light
          </h2>
        </motion.div>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar px-4 md:px-8 pb-4">
        {/* Left spacer for first card centering on mobile */}
        <div className="flex-none w-[7.5vw] md:w-[calc((100vw-400px*3-48px)/2)] min-w-0" aria-hidden="true" />

        {/* Theme Cards */}
        {THEMES.map((theme, index) => (
          <motion.div
            key={theme.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className={`group relative flex-none w-[85vw] md:w-[400px] h-[60vh] md:h-[500px] snap-center flex flex-col justify-end p-8 md:p-10 overflow-hidden rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 transition-all duration-500`}
          >
            {/* Gradient Background */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-60 group-hover:opacity-80 transition-opacity duration-500`}
            />

            {/* Content */}
            <div className="relative z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <h3 className="text-3xl md:text-4xl font-serif text-champagne-gold mb-3 italic group-hover:not-italic transition-all duration-500 break-keep">
                {theme.name}
              </h3>
              <p className="text-base md:text-lg text-champagne-gold/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 break-keep">
                {theme.desc}
              </p>
            </div>
          </motion.div>
        ))}

        {/* Right spacer for last card centering on mobile */}
        <div className="flex-none w-[7.5vw] md:w-[calc((100vw-400px*3-48px)/2)] min-w-0" aria-hidden="true" />
      </div>

      {/* Scroll hint for mobile */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="text-center text-champagne-gold/40 text-sm mt-6 md:hidden"
      >
        ← 스와이프하여 더 보기 →
      </motion.p>
    </section>
  );
}
