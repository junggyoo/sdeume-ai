"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function ActValueSection() {
  return (
    <section className="relative bg-[#FAFAFA] px-6 py-32 md:px-20">
      <div className="mx-auto max-w-7xl">
        {/* Concept 1 */}
        <div className="mb-40 grid grid-cols-1 items-center gap-16 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 1 }}
          >
            <h2 className="mb-8 font-serif text-4xl leading-snug text-gray-900 md:text-6xl">
              <span className="block">복잡한 준비 없이,</span>
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                로망을 현실로.
              </span>
            </h2>
            <p className="font-light text-xl leading-relaxed text-gray-600">
              예약도, 다이어트도, 추가금도 필요 없습니다.
              <br />
              제주도의 바람도, 호텔의 조명도
              <br />
              집에서 클릭 한 번으로 경험하세요.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
            className="relative aspect-[3/4] overflow-hidden rounded-sm shadow-2xl shadow-gray-200"
          >
            <Image
              src="https://picsum.photos/seed/fashion1/800/1200"
              alt="Freedom"
              fill
              className="object-cover opacity-90 transition-transform duration-700 hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </motion.div>
        </div>

        {/* Concept 2 (Reverse) */}
        <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
            className="relative order-2 aspect-square overflow-hidden rounded-sm shadow-2xl shadow-gray-200 md:order-1"
          >
            <Image
              src="https://picsum.photos/seed/ethereal2/800/800"
              alt="Light"
              fill
              className="object-cover grayscale transition-all duration-1000 hover:grayscale-0"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={{ duration: 1 }}
            className="order-1 text-right md:order-2 md:text-left"
          >
            <h2 className="mb-8 font-serif text-3xl leading-snug text-gray-900 md:text-6xl">
              <span className="block">AI 작가가 담아내는</span>
              <span className="block font-light italic">가장 아름다운 컷</span>
            </h2>
            <p className="font-light text-xl leading-relaxed text-gray-600">
              셔터를 누르는 순간, 전문 작가의 보정 노하우가 적용됩니다.
              <br />
              과한 보정 없이, 당신 본연의 매력을
              <br />
              가장 극적으로 연출해보세요.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
