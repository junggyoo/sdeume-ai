"use client";

import { motion } from "framer-motion";

const PROCESS_STEPS = [
  {
    number: "01",
    title: "영감(Inspiration)",
    description:
      "당신이 꿈꾸는 분위기, 색감, 감정을 한 줄의 문장으로 속삭여주세요.",
  },
  {
    number: "02",
    title: "공명(Resonance)",
    description:
      "AI의 심장이 당신의 언어를 이해하고, 수만 가지의 빛을 조합합니다.",
  },
  {
    number: "03",
    title: "개화(Bloom)",
    description: "단 3초. 화면 너머로 당신만의 걸작이 피어납니다.",
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
          <span className="block">당신의 일상이 예술이 되는</span>
          <span className="italic text-purple-600">3초의 마법</span>
        </motion.h2>

        {/* Timeline */}
        <div className="relative ml-6 flex h-auto flex-col border-l border-gray-200 md:mx-auto md:h-[600px] md:w-0 md:items-center">
          {/* Step 1 */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.2 }}
            className="relative left-8 top-0 mb-24 w-64 text-left md:absolute md:left-12 md:mb-0"
          >
            <span className="absolute -left-16 -top-8 -z-10 font-serif text-6xl text-gray-100">
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
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.4 }}
            className="relative left-8 mb-24 w-64 text-left md:absolute md:-translate-y-1/2 md:text-right md:top-1/2 md:right-12 md:left-auto md:mb-0"
          >
            <span className="absolute -left-16 -top-8 -z-10 font-serif text-6xl text-gray-100 md:-right-16 md:left-auto">
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
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.6 }}
            className="relative bottom-0 left-8 w-64 text-left md:absolute md:left-12"
          >
            <span className="absolute -left-16 -top-8 -z-10 font-serif text-6xl text-gray-100">
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
