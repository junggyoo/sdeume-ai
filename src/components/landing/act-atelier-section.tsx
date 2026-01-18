"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const THEMES = [
  {
    title: "White Poem",
    subtitle: "순백의 서사시",
    img: "https://picsum.photos/seed/white/600/900",
  },
  {
    title: "Garden Whisper",
    subtitle: "비밀의 정원",
    img: "https://picsum.photos/seed/garden/600/900",
  },
  {
    title: "Midnight Waltz",
    subtitle: "도시의 왈츠",
    img: "https://picsum.photos/seed/night/600/900",
  },
  {
    title: "Retro Cinema",
    subtitle: "기억의 필름",
    img: "https://picsum.photos/seed/retro/600/900",
  },
];

export function ActAtelierSection() {
  return (
    <section className="overflow-hidden py-32">
      {/* Section Header */}
      <div className="mb-16 px-6 md:px-20">
        <h2 className="font-serif text-5xl text-gray-900 md:text-7xl">
          Atelier
        </h2>
        <p className="mt-4 text-lg text-gray-500">당신의 감성을 담을 그릇들</p>
      </div>

      {/* Horizontal Scroll Gallery */}
      <div className="no-scrollbar flex snap-x space-x-8 overflow-x-auto px-6 pb-12 md:px-20">
        {THEMES.map((theme, idx) => (
          <motion.div
            key={theme.title}
            className="group w-[300px] flex-none cursor-pointer snap-center md:w-[400px]"
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Link href="/login">
              <div className="relative mb-6 h-[500px] overflow-hidden rounded-sm shadow-lg md:h-[600px]">
                {/* Hover overlay */}
                <div className="absolute inset-0 z-10 bg-white/0 transition-colors group-hover:bg-white/10" />
                <Image
                  src={theme.img}
                  alt={theme.title}
                  fill
                  className="transform object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                  sizes="(max-width: 768px) 300px, 400px"
                />
              </div>
              <h3 className="font-serif text-3xl text-gray-900 transition-colors group-hover:text-purple-600">
                {theme.title}
              </h3>
              <p className="mt-2 text-sm uppercase tracking-widest text-gray-400">
                {theme.subtitle}
              </p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
