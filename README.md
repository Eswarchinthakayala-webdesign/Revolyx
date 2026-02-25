<div align="center">
  <h1>🚀 Revolyx</h1>
  <p><strong>Unified Tools for Creative Developers</strong></p>
  <p>Revolyx brings design, development, and creativity together in one seamless workspace. Everything you need to bring your vision to life.</p>

  <div>
    <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/Vite-7-purple?style=for-the-badge&logo=vite" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Framer_Motion-12-black?style=for-the-badge&logo=framer" alt="Framer Motion" />
  </div>
</div>

<br />

## 🌟 Overview

**Revolyx** is a modern, all-in-one platform built for developers and designers. It provides an extensive collection of utility tools, design system playgrounds, public API demonstrations, UI generators, and workspaces—all within a single, blazing-fast React application. 

Whether you need to generate a complex CSS gradient, interact with public APIs, edit audio/video files, view scalable SVG icons, or write code in a built-in playground, Revolyx has you covered.

## ✨ Key Features

### 🎨 Design & UI Playgrounds
- **All-in-One Design System:** Explore predefined color palettes, gradients, and custom themes.
- **Background Designs:** Animated pixel, prism, and fluid backgrounds.
- **CSS Playgrounds:** Interactive tools to generate code for CSS Grid, Gradients, Clip-path, and Border-radius.
- **Neumorphism Generator:** Design sleek, modern soft-UI components with real-time feedback.
- **Icon Engine & Viewer:** Access and search thousands of icons from massive libraries (e.g., Lucide, HeroIcons, FontAwesome, Phosphor).

### 🛠 Developer Tools & Workspaces
- **Web Studio IDE:** A built-in code playground powered by Monaco Editor allowing real-time code execution.
- **Generators Suite:** Instantly generate Dummy Data, QR Codes, Barcodes, and specialized code snippets.
- **Productivity Utilities:** Dedicated tools for JSON manipulation, Security, Hardware insights, Unit conversions, File Merge & Split, and Binary conversions.
- **Flowchart Builder:** Design complex logic flows and export them safely as SVGs.

### 🌐 Massive Public API Showcase
- **API Demo Pages:** Explore interacting with over 80+ public APIs directly from the browser (e.g., GitHub, Crypto Prices, OpenWeather, SpaceX, NASA, Pokémon, Chuck Norris Jokes, OpenAQ, Dictionary, and many more).

### 🧠 AI & Media Tools
- **AI Tooling & Prompts:** Quick access to AI text tools and leaked prompts formatting.
- **Media Manipulation:** Image, Video (FFMpeg-powered), and Audio tools right in the browser.
- **Calculators & Measurements:** In-browser calculators and metric conversion utilities.

---

## 🛠️ Tech Stack

Revolyx is built using the latest bleeding-edge technologies to ensure a fast, robust, and beautiful experience.

- **Core & Routing:** [React 19](https://react.dev/), [Vite](https://vitejs.dev/), React Router DOM
- **State Management:** Zustand
- **Styling & Animation:** [Tailwind CSS v4](https://tailwindcss.com/), Framer Motion, Radix UI primitives, [Shadcn UI](https://ui.shadcn.com/), Emotion, Styled Components
- **Data Visualization & Graphics:** Recharts, Three.js, React Three Fiber, Leaflet
- **Editors & Libraries:** Monaco Editor (React Simple Code Editor), FFMPEG.wasm, Crypto.js, PDF-lib, Zx

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You will need **Node.js** (v18 or higher) and `npm` installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Eswarchinthakayala-webdesign/Revolyx.git
   cd revolyx
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

The app will be available at `http://localhost:5173`.

---

## 📂 Project Structure

```text
revolyx/
├── api/                   # Serverless functions / backend logic (e.g., transcript processing)
├── public/                # Static assets
└── src/
    ├── APIDemoPage/       # Individual demo pages for 80+ integrated public APIs
    ├── ImagePlaygrounds/  # Image editing and visual tool components
    ├── assets/            # Project vectors, images, and brand assets
    ├── components/        # Reusable UI components (Shadcn, Radix, etc.)
    ├── docs/              # Project documentation forms
    ├── layout/            # Layout wrappers (Navigation, Sidebars, AppLayout)
    ├── pages/             # Main feature pages (Playgrounds, Editors, Tools)
    ├── App.jsx            # Main app router configuring all paths
    ├── index.css          # Global styles and Tailwind configuration
    └── main.jsx           # Application entry point
```

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 💬 Contact & Support

If you have any questions, feel free to open an issue or reach out. Enjoy building with **Revolyx**!
