// src/pages/ApisPage.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { Toaster, toast } from "sonner";
import {
  Search,
  Star,
  StarOff,
  Code,
  Link as LinkIcon,
  ExternalLink,
  List,
  Image as ImageIcon,
  ChevronDown,
} from "lucide-react";

/* Syntax Highlighter */
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

/* SHADCN UI */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

/* ------------------------------------------------------------------------------------------
   API ITEMS (You can replace preview images when real screenshots are ready)
------------------------------------------------------------------------------------------ */

const APIS = [
  {
    id: "ipapi",
    name: "IPAPI - IP Info",
    category: "Utility",
    endpoint: "https://ipapi.co/json",
    description: "Get geolocation & ISP info for the user's IP.",
    image: "/api_previews/ipapi.png",
    code: `fetch("https://ipapi.co/json").then(r => r.json()).then(console.log);`,
  },
  {
    id: "randomuser",
    name: "Random User Generator",
    category: "Utility",
    endpoint: "https://randomuser.me/api/",
    description: "Generate random user data including image, email & more.",
    image: "/api_previews/randomuser.png",
    code: `fetch("https://randomuser.me/api/").then(r => r.json()).then(console.log);`,
  },
  {
    id: "dog",
    name: "Dog CEO - Random Dog",
    category: "Fun",
    endpoint: "https://dog.ceo/api/breeds/image/random",
    description: "Generate a random dog image.",
    image: "/api_previews/dog.png",
    code: `fetch("https://dog.ceo/api/breeds/image/random").then(r => r.json()).then(console.log);`,
  },
  {
    id: "catfact",
    name: "Cat Fact API",
    category: "Fun",
    endpoint: "https://catfact.ninja/fact",
    description: "Returns a random cat fact.",
    image: "/api_previews/catfact.png",
    code: `fetch("https://catfact.ninja/fact").then(r => r.json()).then(console.log);`,
  },
  {
    id: "quotes",
    name: "Quotable - Random Quote",
    category: "Fun",
    endpoint: "https://api.quotable.io/random",
    description: "Returns a random quote with the author.",
    image: "/api_previews/quotes.png",
    code: `fetch("https://api.quotable.io/random").then(r => r.json()).then(console.log);`,
  },
  {
    id: "picsum",
    name: "Picsum Image API",
    category: "Media",
    endpoint: "https://picsum.photos/300/200",
    description: "Generates random high-quality placeholder images.",
    image: "/api_previews/picsum.png",
    code: `fetch("https://picsum.photos/300/200")`,
  },
  {
  id: "meal",
  name: "Random Meal",
  category: "Food",
  endpoint: "https://www.themealdb.com/api/json/v1/1/random.php",
  description: "Fetch a random meal with details from TheMealDB.",
  image: "/api_previews/meal.png",
  code: `fetch("https://www.themealdb.com/api/json/v1/1/random.php")
    .then(res => res.json())
    .then(data => console.log(data.meals[0].strMeal));`,
}
,
  
{
  id: "country",
  name: "Country Details",
  category: "Geo",
  endpoint: "https://restcountries.com/v3.1/name/india",
  description: "Fetch country details such as capital, population, region, and more.",
  image: "/api_previews/country.png",
  code: `fetch("https://restcountries.com/v3.1/name/india")
    .then(res => res.json())
    .then(data => console.log(data[0].capital));`,
}
,{
    id: "github",
    name: "GitHub User Details",
    category: "Dev",
    endpoint: "https://api.github.com/users/octocat",
    description: "Fetch public GitHub profile information.",
    image: "/api_previews/github.png",
    code: `fetch("https://api.github.com/users/octocat").then(r => r.json()).then(console.log);`,
  },
  {
  id: "weather",
  name: "Weather (OpenWeatherMap)",
  category: "Utilities",
  endpoint: "https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY&units=metric",
  description: "Fetch real-time weather details for any city using OpenWeatherMap.",
  image: "/api_previews/weather.png",
  code: `fetch("https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY&units=metric")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "joke",
  name: "Programming Joke",
  category: "Fun",
  endpoint: "https://v2.jokeapi.dev/joke/Programming?type=single",
  description: "Fetch a random programming joke from JokeAPI.",
  image: "/api_previews/joke.png",
  code: `fetch("https://v2.jokeapi.dev/joke/Programming?type=single")
    .then(res => res.json())
    .then(data => console.log(data.joke));`,
}
,
{
  id: "news",
  name: "Technology News",
  category: "News",
  endpoint: "https://newsdata.io/api/1/news?apikey=YOUR_API_KEY&q=technology",
  description: "Fetch the latest technology news headlines using NewsData.io API.",
  image: "/api_previews/news.png",
  code: `fetch("https://newsdata.io/api/1/news?apikey=YOUR_API_KEY&q=technology")
    .then(res => res.json())
    .then(data => console.log(data.results[0].title));`,
}
,
{
  id: "crypto",
  name: "Crypto Prices",
  category: "Finance",
  endpoint: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd",
  description: "Fetch real-time cryptocurrency prices for Bitcoin and Ethereum in USD.",
  image: "/api_previews/crypto.png",
  code: `fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "movie",
  name: "Movie Details (OMDb)",
  category: "Entertainment",
  endpoint: "https://www.omdbapi.com/?t=Inception&apikey=YOUR_API_KEY",
  description: "Fetch movie details such as title, director, plot, and ratings using the OMDb API.",
  image: "/api_previews/movie.png",
  code: `fetch("https://www.omdbapi.com/?t=Inception&apikey=YOUR_API_KEY")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "advice",
  name: "Random Advice",
  category: "Fun",
  endpoint: "https://api.adviceslip.com/advice",
  description: "Fetch a random piece of advice using the Advice Slip API.",
  image: "/api_previews/advice.png",
  code: `fetch("https://api.adviceslip.com/advice")
    .then(res => res.json())
    .then(console.log);`,
}
,
{
  id: "activity",
  name: "Random Activity",
  category: "Fun",
  endpoint: "https://www.boredapi.com/api/activity/",
  description: "Fetch a random activity suggestion to beat boredom.",
  image: "/api_previews/activity.png",
  code: `fetch("https://www.boredapi.com/api/activity/")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "chucknorris",
  name: "Chuck Norris Joke",
  category: "Fun",
  endpoint: "https://api.chucknorris.io/jokes/random",
  description: "Fetch a random Chuck Norris joke from the official API.",
  image: "/api_previews/chucknorris.png",
  code: `fetch("https://api.chucknorris.io/jokes/random")
    .then(res => res.json())
    .then(console.log);`,
}
,
{
  id: "harrypotter",
  name: "Harry Potter Characters",
  category: "Entertainment",
  endpoint: "https://hp-api.onrender.com/api/characters",
  description: "Fetch a list of Harry Potter characters with details such as house, ancestry, and images.",
  image: "/api_previews/harrypotter.png",
  code: `fetch("https://hp-api.onrender.com/api/characters")
    .then(res => res.json())
    .then(console.log);`,
}
,
{
  id: "spacex",
  name: "SpaceX Latest Launch",
  category: "Space",
  endpoint: "https://api.spacexdata.com/v5/launches/latest",
  description: "Fetch details about the latest SpaceX launch mission.",
  image: "/api_previews/spacex.png",
  code: `fetch("https://api.spacexdata.com/v5/launches/latest")
    .then(res => res.json())
    .then(console.log);`,
}
,
{
  id: "publicapis",
  name: "Public APIs Directory",
  category: "Utilities",
  endpoint: "https://api.publicapis.org/entries",
  description: "Fetch a list of free public APIs across categories like health, finance, games, and more.",
  image: "/api_previews/publicapis.png",
  code: `fetch("https://api.publicapis.org/entries")
    .then(res => res.json())
    .then(console.log);`,
}
,




];

/* URL PARAM SYNC (Keeps API selection in URL) */
function useUrlParam(param, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const u = new URL(window.location.href);
      return u.searchParams.get(param) || fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      u.searchParams.set(param, value);
      window.history.replaceState({}, "", `${u.pathname}?${u.searchParams.toString()}`);
    } catch {}
  }, [value]);

  return [value, setValue];
}

/* ------------------------------------------------------------------------------------------
   MAIN PAGE COMPONENT
------------------------------------------------------------------------------------------ */

export default function ApisPage() {
  const [selectedId, setSelectedId] = useUrlParam("api", APIS[0].id);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showCode, setShowCode] = useState(false);

  const selected = APIS.find(a => a.id === selectedId) || APIS[0];

  const categories = ["All", ...new Set(APIS.map(a => a.category))];

  const filteredAPIs = useMemo(() => {
    const q = query.toLowerCase();

    return APIS.filter(a => {
      const matchQuery =
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q);

      const matchCategory =
        categoryFilter === "All" || a.category === categoryFilter;

      return matchQuery && matchCategory;
    });
  }, [query, categoryFilter]);

  /* ------------------------------------------------------------------------------------------
     SIDEBAR ITEM COMPONENT
  ------------------------------------------------------------------------------------------ */
  function SidebarItem({ api }) {
    return (
      <motion.div
        layout
       
        onClick={() => setSelectedId(api.id)}
        className={clsx(
          "cursor-pointer p-4 rounded-xl mb-4 hover:border-zinc-700 transition-all border bg-white/40 dark:bg-black/40 shadow-sm backdrop-blur",
          selectedId === api.id
            ? "border-zinc-500/60 shadow-md"
            : "hover:shadow-lg"
        )}
      >
        <div className="font-semibold">{api.name}</div>
        <p className="text-xs opacity-70 mt-1">{api.description}</p>
        <Badge className="mt-2 bg-blue-500/20 text-blue-600 dark:text-blue-300 dark:bg-blue-500/20">
          {api.category}
        </Badge>
      </motion.div>
    );
  }

  /* ------------------------------------------------------------------------------------------
     MOBILE SIDEBAR (SHEET)
  ------------------------------------------------------------------------------------------ */
  function MobileSidebar() {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="lg:hidden"><List /></Button>
        </SheetTrigger>

        <SheetContent side="left" className="w-[300px] p-4">
          <div className="font-bold text-lg mb-3">Browse APIs</div>

          <Input
            placeholder="Search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="mb-4"
          />

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ScrollArea className="mt-4 h-[70vh]">
            {filteredAPIs.map(api => <SidebarItem api={api} key={api.id} />)}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  /* ------------------------------------------------------------------------------------------
     RELATED GRID
  ------------------------------------------------------------------------------------------ */
  function RelatedGrid() {
    const items = APIS.filter(a => a.id !== selectedId).slice(0, 6);

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.map(a => (
          <motion.div
            key={a.id}
            whileHover={{ scale: 1.03 }}
            className="p-3 border rounded-xl bg-white/40 dark:bg-black/40 backdrop-blur-sm cursor-pointer"
            onClick={() => setSelectedId(a.id)}
          >
            <p className="text-sm font-semibold">{a.name}</p>
            <p className="text-xs opacity-60">{a.category}</p>
          </motion.div>
        ))}
      </div>
    );
  }

  /* ------------------------------------------------------------------------------------------
     PAGE UI
  ------------------------------------------------------------------------------------------ */

  return (
    <div className="min-h-screen max-w-8xl mx-auto p-6 dark:bg-black bg-white transition-colors">
      <Toaster richColors />

      {/* Header */}
      <header className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-extrabold">
            
              Revolyx API Explorer
         
          </h1>
          <p className="opacity-60 mt-1 text-sm">Explore free public APIs with powerful preview tools.</p>
        </div>

        <div className="flex items-center gap-3">
          <MobileSidebar />

          <div className="hidden lg:flex items-center gap-2 bg-white/50 dark:bg-black/40 backdrop-blur px-3 py-2 rounded-xl border">
            <Search className="w-4 h-4 opacity-60" />
            <Input
              placeholder="Search APIs..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="border-0 shadow-none bg-transparent"
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Layout Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <ScrollArea className="h-[80vh] pr-3">
            {filteredAPIs.map(api => (
              <SidebarItem className="cursor-pointer" key={api.id} api={api} />
            ))}
          </ScrollArea>
        </aside>

        {/* Main Preview Section */}
        <section className="col-span-3 space-y-10">

          {/* Preview Card */}
          <Card className="shadow-xl rounded-2xl overflow-hidden bg-white/70 dark:bg-black/40 backdrop-blur-xl border">
            {/* Preview image */}
            <div className="relative bg-gray-200 dark:bg-zinc-900 h-72 flex items-center justify-center">
              {selected.image ? (
                <img
                  src={selected.image}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="opacity-40 flex items-center gap-2">
                  <ImageIcon /> No preview image
                </div>
              )}
            </div>

            <CardHeader>
              <CardTitle className="text-2xl">{selected.name}</CardTitle>
              <p className="text-sm opacity-70">{selected.description}</p>

              {/* Endpoint */}
              <div className="mt-3 p-3 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-between border">
                <span className="text-xs opacity-80">{selected.endpoint}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(selected.endpoint);
                    toast.success("Endpoint copied");
                  }}
                >
                  <LinkIcon className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* Open / Code */}
              <div className="flex items-center gap-4 mt-4">

                <Link
                 to={`/apis/${selected.id}`}
                 
                >
                    <Button className="cursor-pointer">
                  Open API Page <ExternalLink className="w-4 h-4" />
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  className="flex cursor-pointer items-center gap-2"
                  onClick={() => setShowCode(prev => !prev)}
                >
                  <Code className="w-4 h-4" />
                  {showCode ? "Hide Code" : "Show Code"}
                  <ChevronDown
                    className={clsx(
                      "w-4 h-4 transition-transform",
                      showCode && "rotate-180"
                    )}
                  />
                </Button>

              </div>

              {/* CODE BLOCK (Animated) */}
              <AnimatePresence>
                {showCode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden mt-4"
                  >
                    <SyntaxHighlighter
                      language="javascript"
                      style={oneDark}
                      customStyle={{
                        borderRadius: 12,
                        padding: 16,
                        fontSize: 12,
                      }}
                    >
                      {selected.code}
                    </SyntaxHighlighter>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Related APIs */}
          <Card className="p-6 bg-white/60 dark:bg-black/40 border backdrop-blur-xl rounded-2xl">
            <CardTitle className="mb-4">Related APIs</CardTitle>
            <RelatedGrid />
          </Card>

        </section>
      </main>
    </div>
  );
}
