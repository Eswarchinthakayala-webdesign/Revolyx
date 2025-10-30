"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTheme } from "@/components/theme-provider";
import { Link } from "react-router-dom";
import { Sparkles, Code2, Layers, Zap, Shield, Globe, HeartHandshake } from "lucide-react";

export default function LandingPage() {
  const { theme } = useTheme();

  const features = [
    {
      icon: Code2,
      title: "Modern Development",
      desc: "Built with React, Tailwind, and Shadcn for seamless performance and design.",
    },
    {
      icon: Sparkles,
      title: "Beautiful Design System",
      desc: "Consistent components and motion-based interactions that feel alive.",
    },
    {
      icon: Layers,
      title: "Modular Architecture",
      desc: "Easily extend or customize sections without breaking your workflow.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      desc: "Optimized loading and minimal bundle size for top-tier performance.",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      desc: "Clean and secure codebase following the best practices.",
    },
    {
      icon: Globe,
      title: "Responsive & Global",
      desc: "Perfectly scales from small screens to ultrawide monitors.",
    },
  ];

  const faqs = [
    {
      q: "What is Revolyx?",
      a: "Revolyx is a modern developer platform offering elegant tools and UI components to build next-gen interfaces.",
    },
    {
      q: "Is it open source?",
      a: "Yes, Revolyx follows an open-source mindset, with components you can freely adapt and modify.",
    },
    {
      q: "Which technologies are used?",
      a: "It’s powered by React, Tailwind CSS, Framer Motion, and Shadcn/UI for perfect synergy.",
    },
    {
      q: "Can I use it in my project?",
      a: "Absolutely. You can clone and integrate it into your own apps with minimal setup.",
    },
    {
      q: "Does it support dark mode?",
      a: "Yes, it includes full dark/light theme synchronization using Tailwind’s dark class and ThemeProvider.",
    },
    {
      q: "Is it mobile-friendly?",
      a: "It’s fully responsive, adapting layouts and typography for all device sizes.",
    },
    {
      q: "How can I contribute?",
      a: "You can fork the repository, create pull requests, or suggest new ideas in the community section.",
    },
  ];

  return (
    <div
    >
      
      {/* === Hero Section === */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-28">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
        >
          Build the Future with{" "}
          <span className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            Revolyx
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mb-10"
        >
          A modern design system and developer platform built for creativity,
          precision, and scalability.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <Link to="/get-started">
            <Button size="lg" className="rounded-full cursor-pointer font-semibold shadow-md">
              Get Started
            </Button>
          </Link>
          <Link to="/docs">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full cursor-pointer border-gray-400 dark:border-gray-600 font-semibold"
            >
              View Docs
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* === Features Section === */}
      <section className="px-6 py-16 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {features.map(({ icon: Icon, title, desc }) => (
          <motion.div
            key={title}
            whileHover={{ scale: 1.03 }}
            className="p-6 rounded-2xl border border-gray-300 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-lg shadow-sm"
          >
            <Icon className="mb-3 h-8 w-8 text-gray-800 dark:text-gray-100" />
            <h3 className="font-semibold text-xl mb-2">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {desc}
            </p>
          </motion.div>
        ))}
      </section>

      {/* === FAQ Section === */}
      <section className="px-6 py-20 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 bg-gradient-to-r from-gray-800 to-gray-500 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
          Frequently Asked Questions
        </h2>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map(({ q, a }, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-b border-gray-300 dark:border-white/10">
              <AccordionTrigger className="text-lg font-medium hover:text-gray-800 dark:hover:text-white">
                {q}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

     
    </div>
  );
}
