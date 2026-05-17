import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import gsap from "gsap";

const customEase = [0.22, 1, 0.36, 1];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.2,
      ease: customEase,
    },
  },
};

const experiences = [
  {
    date: "2024 — PRESENT",
    role: "Lead UI/UX Engineer",
    company: "CREATOR OS",
    description: "Architecting and designing the core reconciliation engine interface. Building deterministic event-driven logic into a polished, high-density React application.",
  },
  {
    date: "2021 — 2024",
    role: "Senior Frontend Engineer",
    company: "FINTECH SOLUTIONS",
    description: "Developed and maintained full-stack internal tooling across the platform ecosystem. Handled complex dashboard states and built user-facing features.",
  },
  {
    date: "2018 — 2021",
    role: "Frontend Developer",
    company: "AGENCY GLOBAL",
    description: "Started writing production code seriously. Built interactive landing pages, web applications, and contributed to open-source software.",
  },
];

export default function LandingPage() {
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (marqueeRef.current) {
      const q = gsap.utils.selector(marqueeRef);
      gsap.to(q(".marquee-content"), {
        xPercent: -50,
        ease: "none",
        duration: 20,
        repeat: -1,
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 py-8 md:px-12 border-b border-zinc-800/50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: customEase }}
          className="text-xs tracking-widest font-mono uppercase text-zinc-400"
        >
          CreatorOS / Portfolio
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: customEase, delay: 0.1 }}
        >
          <Link
            to="/app"
            className="text-xs tracking-widest font-mono uppercase bg-zinc-100 text-[#09090b] px-4 py-2 hover:bg-zinc-300 transition-colors"
          >
            Open Dashboard
          </Link>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-6 md:px-12 pt-32 pb-24 md:pt-48 md:pb-32"
      >
        <div className="max-w-5xl">
          <motion.h1
            variants={itemVariants}
            className="text-6xl md:text-8xl lg:text-9xl font-serif italic font-medium tracking-tight leading-[1.05]"
          >
            Software,
            <br />
            <span className="text-zinc-400">designed with</span>
            <br />
            intention.
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="max-w-2xl mt-12 text-lg md:text-xl text-zinc-400 leading-relaxed font-light"
          >
            I'm a UI/UX Engineer focused on building production-grade web applications.
            I work primarily across the modern TypeScript stack, turning complex product
            requirements into clear, reliable features that ship to real users.
          </motion.p>
        </div>
      </motion.section>

      {/* Marquee Section */}
      <div 
        ref={marqueeRef} 
        className="border-y border-zinc-800/50 overflow-hidden py-6 bg-[#09090b] relative w-full flex whitespace-nowrap"
      >
        <div className="marquee-content flex text-3xl md:text-5xl font-serif italic text-zinc-600">
          <div className="flex items-center gap-16 px-8 pr-16 w-max">
            <span>React</span>
            <span className="font-sans text-zinc-800">*</span>
            <span>Next.js</span>
            <span className="font-sans text-zinc-800">*</span>
            <span>Node.js</span>
            <span className="font-sans text-zinc-800">*</span>
            <span>Tailwind CSS</span>
            <span className="font-sans text-zinc-800">*</span>
            <span>TypeScript</span>
            <span className="font-sans text-zinc-800">*</span>
            <span>Framer Motion</span>
            <span className="font-sans text-zinc-800">*</span>
          </div>
          <div className="flex items-center gap-16 px-8 pr-16 w-max">
            <span>React</span>
            <span className="font-sans text-zinc-800">*</span>
            <span>Next.js</span>
            <span className="font-sans text-zinc-800">*</span>
            <span>Node.js</span>
            <span className="font-sans text-zinc-800">*</span>
            <span>Tailwind CSS</span>
            <span className="font-sans text-zinc-800">*</span>
            <span>TypeScript</span>
            <span className="font-sans text-zinc-800">*</span>
            <span>Framer Motion</span>
            <span className="font-sans text-zinc-800">*</span>
          </div>
        </div>
      </div>

      {/* Experience Section */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.2, ease: customEase }}
        className="px-6 md:px-12 py-32"
      >
        <div className="flex flex-col md:flex-row gap-12 md:gap-24">
          <div className="md:w-1/3">
            <h2 className="text-4xl md:text-5xl font-serif italic tracking-tight">
              Where I've spent <br />
              <span className="text-zinc-500">the hours.</span>
            </h2>
          </div>
          
          <div className="md:w-2/3 border-l border-zinc-800 pl-8 md:pl-16 flex flex-col gap-16">
            {experiences.map((exp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, ease: customEase, delay: i * 0.1 }}
                className="flex flex-col md:flex-row gap-6 md:gap-12 group"
              >
                <div className="md:w-1/4 shrink-0 pt-1">
                  <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                    {exp.date}
                  </p>
                </div>
                <div className="md:w-3/4 pb-16 border-b border-zinc-800/50 group-last:border-0 group-last:pb-0">
                  <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-1">
                    {exp.role}
                  </h3>
                  <p className="text-xs font-mono tracking-widest text-zinc-500 uppercase mb-4">
                    {exp.company}
                  </p>
                  <p className="text-zinc-400 leading-relaxed text-sm md:text-base font-light">
                     {exp.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-12 border-t border-zinc-800/50 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
          &copy; {new Date().getFullYear()} CreatorOS. All rights reserved.
        </p>
        <a href="mailto:hello@creatoros.com" className="text-xs font-mono text-zinc-400 hover:text-zinc-100 transition-colors uppercase tracking-widest">
          hello@creatoros.com
        </a>
      </footer>
    </div>
  );
}
