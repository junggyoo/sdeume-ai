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
              <span className="block">우리는 촬영이 아닌</span>
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                자유를 발명했다.
              </span>
            </h2>
            <p className="font-light text-xl leading-relaxed text-gray-600">
              무거운 장비, 어색한 미소, 타인의 시선은 잊으세요.
              <br />
              오직 당신과 빛, 그리고 상상력만 존재합니다.
              <br />
              셔터를 누르는 순간, 현실은 시(詩)가 됩니다.
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
            <h2 className="mb-8 font-serif text-4xl leading-snug text-gray-900 md:text-6xl">
              <span className="block">완벽한 빛을</span>
              <span className="block font-light italic">소유하는 방법</span>
            </h2>
            <p className="font-light text-xl leading-relaxed text-gray-600">
              스튜디오 조명 없이도, 새벽녘의 푸른 빛이나
              <br />
              노을이 내려앉은 금빛 순간을 연출하세요.
              <br />
              Sdeume AI는 당신의 손끝에서 빛을 조각합니다.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
