"use client";

import { motion } from "framer-motion";

const COPY_SEGMENTS = [
  {
    id: 1,
    text: "단순 합성이 아닙니다",
    sub: "Not just a synthesis",
    gradient: "from-[#2E5E5E] to-[#1A3C3C]",
  },
  {
    id: 2,
    text: "당신을 학습하는 시간",
    sub: "Time to learn you",
    gradient: "from-[#3D4A5E] to-[#1A2C38]",
  },
  {
    id: 3,
    text: "가장 나다운 표정으로",
    sub: "Your most authentic expression",
    gradient: "from-[#4A3B45] to-[#2A1F25]",
  },
];

export function ActValueSection() {
  return (
    <section className="relative py-24 md:py-32 bg-deep-navy">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-16 md:gap-24">
          {COPY_SEGMENTS.map((segment, index) => (
            <motion.div
              key={segment.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${segment.gradient} p-8 md:p-12 backdrop-blur-md border border-white/10`}
            >
              {/* Background overlay */}
              <div className="absolute inset-0 bg-black/20" />

              <div className="relative z-10 text-center">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-sm md:text-base font-sans tracking-[0.2em] text-champagne-gold/60 mb-4 uppercase"
                >
                  {segment.sub}
                </motion.p>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-4xl md:text-6xl font-serif text-champagne-gold font-light leading-tight break-keep"
                >
                  {segment.text}
                </motion.h2>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
