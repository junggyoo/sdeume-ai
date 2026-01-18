"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export function ActRealitySection() {
  return (
    <section className="relative flex h-screen items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://picsum.photos/seed/magic/1920/1080"
          alt="Finale"
          fill
          className="object-cover opacity-30"
          priority
        />
        {/* Gradient to white */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA]/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 font-serif text-3xl text-gray-900 drop-shadow-sm md:text-7xl"
        >
          지금 바로 무료로
          <br className="md:hidden" />
          확인해보세요.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Link
            href="/login"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-black px-8 py-5 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-gray-800 md:px-16 md:py-6"
          >
            <span className="relative mr-3 whitespace-nowrap font-serif text-base tracking-wider md:mr-4 md:text-2xl">
              무료로 화보 만들기
            </span>
            <ArrowRight className="text-white transition-transform group-hover:translate-x-2" />

            {/* Shine effect */}
            <div className="absolute inset-full top-0 z-5 block h-full w-1/2 -skew-x-12 transform bg-gradient-to-r from-transparent to-white opacity-20 transition-transform group-hover:animate-[shine_1s_ease-in-out]" />
          </Link>
          <p className="mt-6 text-sm text-gray-500">
            *가입 시 4장 무료 촬영권 즉시 지급
          </p>
        </motion.div>
      </div>
    </section>
  );
}
