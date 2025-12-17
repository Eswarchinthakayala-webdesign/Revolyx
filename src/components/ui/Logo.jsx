'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../theme-provider'

const text = 'Revolyx'

/* ---------------- LETTER ANIMATION ---------------- */

const letterVariants = {
  hidden: {
    opacity: 0,
    y: 24,
    filter: 'blur(12px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      damping: 14,
      stiffness: 120,
    },
  },
}

/* ---------------- CONTAINER STAGGER ---------------- */

const textContainer = {
  visible: {
    transition: {
      staggerChildren: 0.09,
    },
  },
}

/* ---------------- MAIN COMPONENT ---------------- */

const RevolyxLoader = ({ setLoading }) => {
  const { theme } = useTheme()
  const [viewport, setViewport] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const update = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center  grid-background bg-white dark:bg-zinc-950"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 4.2, duration: 0.8 }}
      onAnimationComplete={() => setLoading(false)}
    >
      {/* MOVING GROUP */}
      <motion.div
        className="relative flex items-center gap-2"
        initial={{ x: 0, y: 0, scale: 1 }}
        animate={{
          x: [0, 0, -viewport.w * 0.42],
          y: [0, 0, -viewport.h * 0.42],
          scale: [1, 1, 0.42],
        }}
        transition={{
          duration: 4.2,
          times: [0, 0.65, 1],
          ease: [0.19, 1, 0.22, 1], // realistic inertia
        }}
      >
        {/* LOGO IMAGE */}
        <div className='bg-gradient-to-r from-black to-gray-700 dark:from-white dark:to-gray-400 bg-clip-text text-transparent'>
        <motion.img
          src="/logo.png"
          alt="Revolyx Logo"
          className={`h-14 md:h-20 ${
            isDark ? 'invert brightness-150' : 'brightness-1000'
          }`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
        </div>

        {/* TEXT */}
        <motion.h1
          className="flex text-6xl md:text-8xl font-black tracking-tight"
          variants={textContainer}
          initial="hidden"
          animate="visible"
        >
          {text.split('').map((char, i) => (
            <motion.span
              key={i}
              variants={letterVariants}
              className="relative inline-block text-zinc-900 dark:text-white"
            >
              {/* MAIN LETTER */}
              <span className="relative z-10">{char}</span>

              {/* GLOW STROKE */}
              <motion.span
                className="absolute inset-0 z-0 text-transparent"
                style={{
                  WebkitTextStroke: '1px rgba(139,92,246,0.35)',
                }}
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {char}
              </motion.span>
            </motion.span>
          ))}
        </motion.h1>

        {/* AMBIENT GLOW */}
        <motion.div
          className="absolute -z-10 h-40 w-40 rounded-full bg-violet-500/20 blur-[120px]"
          animate={{
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
    </motion.div>
  )
}

export default RevolyxLoader
