"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function HoneyHero() {
  return (
    <section className="relative flex flex-col items-center justify-center h-[80vh] text-center overflow-hidden">
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl md:text-7xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent"
      >
        Welcome to AgentHive
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        className="mt-6 max-w-2xl text-lg text-gray-600"
      >
        Build secure, multi-agent workflows that feel like magic.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.7 }}
        className="mt-10 flex gap-4"
      >
        <Link
          href="/app"
          className="rounded-lg bg-amber-500 px-6 py-3 text-base font-medium text-white shadow hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          Launch Console
        </Link>
        <a
          href="https://docs.agenthive.ai"
          target="_blank"
          className="rounded-lg border border-amber-300 px-6 py-3 text-base font-medium text-amber-600 hover:bg-amber-50"
        >
          Documentation
        </a>
      </motion.div>
      {/* Floating Bee widget already mounted globally */}
    </section>
  );
}
