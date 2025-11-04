'use client';
import * as React from 'react';
import { useIsInView } from '@/hooks/use-is-in-view';
import { useTheme } from '../../../theme-provider';

function CodeBlock({
  ref,
  code = '',
  lang = 'js',
  themes = {
    light: 'github-light',
    dark: 'github-dark',
  },
  writing = false,
  duration = 5000,
  delay = 0,
  onDone,
  onWrite,
  scrollContainerRef,
  inView = false,
  inViewOnce = true,
  inViewMargin = '0px',
  ...props
}) {
  const { ref: localRef, isInView } = useIsInView(ref, {
    inView,
    inViewOnce,
    inViewMargin,
  });

  const [visibleCode, setVisibleCode] = React.useState('');
  const [highlightedCode, setHighlightedCode] = React.useState('');
  const [isDone, setIsDone] = React.useState(false);

  const { theme } = useTheme(); // "light" | "dark" | "system"
  const [isDark, setIsDark] = React.useState(false);

  // 🟢 Determine actual theme (system-aware)
  React.useEffect(() => {
    const updateTheme = () => {
      if (theme === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(systemDark);
      } else {
        setIsDark(theme === 'dark');
      }
    };

    updateTheme(); // Initial check

    // Listen for system theme changes (only if user selected "system")
    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      media.addEventListener('change', updateTheme);
      return () => media.removeEventListener('change', updateTheme);
    }
  }, [theme]);

  // 🟩 Highlight code whenever code or theme changes
  React.useEffect(() => {
    if (!visibleCode.length || !isInView) return;

    const loadHighlightedCode = async () => {
      try {
        const { codeToHtml } = await import('shiki');

        const selectedTheme = isDark ? themes.dark : themes.light;

        const highlighted = await codeToHtml(visibleCode, {
          lang,
          theme: selectedTheme,
        });

        setHighlightedCode(highlighted);
      } catch (e) {
        console.error(`Language "${lang}" could not be loaded.`, e);
      }
    };

    loadHighlightedCode();
  }, [lang, isDark, visibleCode, isInView, themes]);

  // 🟦 Typing animation
  React.useEffect(() => {
    if (!writing) {
      setVisibleCode(code);
      onDone?.();
      onWrite?.({ index: code.length, length: code.length, done: true });
      return;
    }

    if (!code.length || !isInView) return;

    const chars = Array.from(code);
    let index = 0;
    const intervalTime = duration / chars.length;
    let intervalId;

    const timeout = setTimeout(() => {
      intervalId = setInterval(() => {
        if (index < chars.length) {
          setVisibleCode(() => {
            const next = chars.slice(0, index + 1).join('');
            onWrite?.({ index: index + 1, length: chars.length, done: false });
            index++;
            return next;
          });
          localRef.current?.scrollTo({
            top: localRef.current?.scrollHeight,
            behavior: 'smooth',
          });
        } else {
          clearInterval(intervalId);
          setIsDone(true);
          onDone?.();
          onWrite?.({ index: chars.length, length: chars.length, done: true });
        }
      }, intervalTime);
    }, delay);

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalId);
    };
  }, [code, duration, delay, isInView, writing, onDone, onWrite, localRef]);

  // 🟨 Auto-scroll on update
  React.useEffect(() => {
    if (!writing || !isInView) return;
    const el =
      scrollContainerRef?.current ??
      localRef.current?.parentElement ??
      localRef.current;

    if (!el) return;

    requestAnimationFrame(() => {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, [highlightedCode, writing, isInView, scrollContainerRef, localRef]);

  return (
    <div
      ref={localRef}
      data-slot="code-block"
      data-writing={writing}
      data-done={isDone}
      dangerouslySetInnerHTML={{ __html: highlightedCode }}
      {...props}
    />
  );
}

export { CodeBlock };
