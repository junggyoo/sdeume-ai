"use client";

import { motion } from "framer-motion";

const PROCESS_STEPS = [
  {
    number: "01",
    title: "얼굴 등록",
    description: "평소 사진을 업로드하면 AI가 학습합니다.",
  },
  {
    number: "02",
    title: "테마 선택",
    description: "가든, 클래식, 미니멀 등 원하는 분위기를 고르세요.",
  },
  {
    number: "03",
    title: "화보 생성",
    description: "셔터를 누르면 고화질 웨딩 화보가 즉시 생성됩니다.",
  },
];

export function ActProcessSection() {
  return (
    <section className="relative bg-gradient-to-b from-white via-gray-50 to-white py-40">
      <div className="mx-auto max-w-4xl px-6 text-center">
        {/* Section Title */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24 font-serif text-4xl text-gray-900 md:text-6xl"
        >
          <span className="block">단 3단계로 완성되는</span>
          <span className="italic text-purple-600">우리만의 화보</span>
        </motion.h2>

        {/* Timeline */}
        <div className="relative ml-6 flex h-auto flex-col border-l border-gray-200 md:mx-auto md:h-[600px] md:w-0 md:items-center">
          {/* Step 1 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            className="relative left-8 top-0 mb-24 w-64 text-left md:absolute md:left-12 md:mb-0"
          >
            <span className="mb-2 block font-serif text-4xl text-gray-200 md:text-5xl">
              01
            </span>
            <h3 className="mb-2 font-serif text-2xl text-gray-900">
              {PROCESS_STEPS[0].title}
            </h3>
            <p className="font-light text-gray-500">
              {PROCESS_STEPS[0].description}
            </p>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
            className="relative left-8 mb-24 w-64 text-left md:absolute md:-translate-y-1/2 md:text-right md:top-1/2 md:right-12 md:left-auto md:mb-0"
          >
            <span className="mb-2 block font-serif text-4xl text-gray-200 md:text-5xl">
              02
            </span>
            <h3 className="mb-2 font-serif text-2xl text-gray-900">
              {PROCESS_STEPS[1].title}
            </h3>
            <p className="font-light text-gray-500">
              {PROCESS_STEPS[1].description}
            </p>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
            className="relative bottom-0 left-8 w-64 text-left md:absolute md:left-12"
          >
            <span className="mb-2 block font-serif text-4xl text-gray-200 md:text-5xl">
              03
            </span>
            <h3 className="mb-2 font-serif text-2xl text-gray-900">
              {PROCESS_STEPS[2].title}
            </h3>
            <p className="font-light text-gray-500">
              {PROCESS_STEPS[2].description}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
