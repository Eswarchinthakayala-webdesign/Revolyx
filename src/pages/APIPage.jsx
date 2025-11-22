// src/pages/ApisPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";

import {
  Search,
  List,
  Layers,
  Atom,
  Globe,
  Image as ImageIcon,
  Code as CodeIcon,
  ChevronDown,
  Link as LinkIcon,
  ExternalLink,
  Menu,
  X,
  Copy,
  Sparkles,
  ChevronRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { Link } from "react-router-dom";
 import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

/* ---------------------------
   API DATA
   --------------------------- */
const APIS = [
  {
    id: "ipapi",
    name: "IPAPI",
    title: "IPAPI — IP Geolocation",
    category: "Utility",
    endpoint: "https://ipapi.co/json",
    description: "Fast IP geolocation and ISP data for any IPv4/IPv6.",
    code: `fetch("https://ipapi.co/json").then(r => r.json()).then(console.log);`,
  },
  {
    id: "randomuser",
    name: "RandomUser",
    title: "Random User Generator",
    category: "Utility",
    endpoint: "https://randomuser.me/api/",
    description: "Generate realistic random user profiles (images, email, location).",
    code: `fetch("https://randomuser.me/api/").then(r => r.json()).then(console.log);`,
  },
  {
    id: "dog",
    name: "Dog CEO",
    title: "Dog CEO — Random Dog",
    category: "Fun",
    endpoint: "https://dog.ceo/api/breeds/image/random",
    description: "Random dog image endpoint — great for placeholders & fun apps.",
    code: `fetch("https://dog.ceo/api/breeds/image/random").then(r => r.json()).then(console.log);`,
  },
  {
    id: "catfact",
    name: "CatFact",
    title: "Cat Fact",
    category: "Fun",
    endpoint: "https://catfact.ninja/fact",
    description: "Fetch a random cat fact for playful UI elements.",
    code: `fetch("https://catfact.ninja/fact").then(r => r.json()).then(console.log);`,
  },
  {
    id: "meal",
    name: "MealDB",
    title: "Random Meal",
    category: "Food",
    endpoint: "https://www.themealdb.com/api/json/v1/1/random.php",
    description: "Random meal with ingredient list and instructions.",
    code: `fetch("https://www.themealdb.com/api/json/v1/1/random.php").then(r => r.json()).then(console.log);`,
  },
  {
    id: "country",
    name: "RestCountries",
    title: "Country Details",
    category: "Geo",
    endpoint: "https://restcountries.com/v3.1/name/india",
    description: "Country info including capital, population, currencies.",
    code: `fetch("https://restcountries.com/v3.1/name/india").then(r => r.json()).then(console.log);`,
  },
  {
    id: "github",
    name: "GitHub API",
    title: "GitHub — User Details",
    category: "Dev",
    endpoint: "https://api.github.com/users/octocat",
    description: "Public user data: repos, followers, profile information.",
    code: `fetch("https://api.github.com/users/octocat").then(r => r.json()).then(console.log);`,
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
{
  id: "googlebooks",
  name: "Google Books Search",
  category: "Books",
  endpoint: "https://www.googleapis.com/books/v1/volumes?q=harry+potter",
  description: "Fetch book details by searching titles, authors, and descriptions using Google Books API.",
  image: "/api_previews/googlebooks.png",
  code: `fetch("https://www.googleapis.com/books/v1/volumes?q=harry+potter")
    .then(res => res.json())
    .then(console.log);`,
}
,
{
  id: "dictionary",
  name: "English Word Meaning",
  category: "Education",
  endpoint: "https://api.dictionaryapi.dev/api/v2/entries/en/hello",
  description: "Fetch definitions, phonetics, and usage examples for English words.",
  image: "/api_previews/dictionary.png",
  code: `fetch("https://api.dictionaryapi.dev/api/v2/entries/en/hello")
    .then(res => res.json())
    .then(console.log);`,
}
,
{
  id: "itunes",
  name: "iTunes Music Search",
  category: "Music",
  endpoint: "https://itunes.apple.com/search?term=drake&limit=5",
  description: "Search for songs, albums, and artists using the iTunes Search API.",
  image: "/api_previews/itunes.png",
  code: `fetch("https://itunes.apple.com/search?term=drake&limit=5")
    .then(res => res.json())
    .then(console.log);`,
}
,
{
  id: "rawg",
  name: "Video Games List",
  category: "Games",
  endpoint: "https://api.rawg.io/api/games?key=YOUR_API_KEY",
  description: "Fetch a list of video games with details such as ratings, genres, and platforms.",
  image: "/api_previews/rawg.png",
  code: `fetch("https://api.rawg.io/api/games?key=YOUR_API_KEY")
    .then(res => res.json())
    .then(console.log);`,
}
,
{
  id: "artic",
  name: "Art Institute of Chicago Artworks",
  category: "Art",
  endpoint: "https://api.artic.edu/api/v1/artworks",
  description: "Fetch artwork details including title, artist, image, and museum information from the Art Institute of Chicago.",
  image: "/api_previews/artic.png",
  code: `fetch("https://api.artic.edu/api/v1/artworks")
    .then(res => res.json())
    .then(console.log);`,
}
,
{
  id: "nasa_apod",
  name: "NASA Astronomy Picture",
  category: "Space",
  endpoint: "https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY",
  description: "Fetch NASA’s Astronomy Picture of the Day with title, explanation, and media.",
  image: "/api_previews/nasa_apod.png",
  code: `fetch("https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY")
    .then(res => res.json())
    .then(console.log);`,
}
,
{
  id: "kanye",
  name: "Kanye West Quote",
  category: "Fun",
  endpoint: "https://api.kanye.rest/",
  description: "Fetch a random Kanye West quote.",
  image: "/api_previews/kanye.png",
  code: `fetch("https://api.kanye.rest/")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "superhero",
  name: "Superhero Details (Batman)",
  category: "Entertainment",
  endpoint: "https://www.superheroapi.com/api.php/10159442934712314/batman",
  description: "Fetch superhero details such as power stats, biography, appearance, and more.",
  image: "/api_previews/superhero.png",
  code: `fetch("https://www.superheroapi.com/api.php/10159442934712314/batman")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "dnd_spells",
  name: "D&D 5e Spells",
  category: "Games",
  endpoint: "https://www.dnd5eapi.co/api/spells",
  description: "Fetch a list of Dungeons & Dragons 5th Edition spells with names and indexes.",
  image: "/api_previews/dnd_spells.png",
  code: `fetch("https://www.dnd5eapi.co/api/spells")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "hackernews",
  name: "Hacker News Top Stories",
  category: "Tech",
  endpoint: "https://hacker-news.firebaseio.com/v0/topstories.json",
  description: "Fetch a list of top story IDs from Hacker News.",
  image: "/api_previews/hackernews.png",
  code: `fetch("https://hacker-news.firebaseio.com/v0/topstories.json")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "perenual",
  name: "Plant Species List",
  category: "Nature",
  endpoint: "https://perenual.com/api/species-list?key=YOUR_API_KEY",
  description: "Fetch a list of plant species including images, common names, and scientific names.",
  image: "/api_previews/perenual.png",
  code: `fetch("https://perenual.com/api/species-list?key=YOUR_API_KEY")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "randomfox",
  name: "Random Fox Image",
  category: "Animals",
  endpoint: "https://randomfox.ca/floof/",
  description: "Fetch a random cute fox image.",
  image: "/api_previews/randomfox.png",
  code: `fetch("https://randomfox.ca/floof/")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "agify",
  name: "Age Prediction",
  category: "AI",
  endpoint: "https://api.agify.io/?name=michael",
  description: "Predict the age of a person based on their first name using Agify.io. No API key required.",
  image: "/api_previews/agify.png",
  code: `fetch("https://api.agify.io/?name=michael")
    .then(res => res.json())
    .then(console.log);`,
}
,
 { id: "weather",
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
  id: "genderize",
  name: "Gender Prediction",
  category: "AI",
  endpoint: "https://api.genderize.io/?name=emma",
  description: "Predict the gender associated with a given first name. No API key required.",
  image: "/api_previews/genderize.png",
  code: `fetch("https://api.genderize.io/?name=emma")
    .then(res => res.json())
    .then(console.log);`,
}
,
{
  id: "nationalize",
  name: "Nationality Prediction",
  category: "AI",
  endpoint: "https://api.nationalize.io/?name=michael",
  description: "Predict the nationality probabilities for a given name. No API key required.",
  image: "/api_previews/nationalize.png",
  code: `fetch("https://api.nationalize.io/?name=michael")
    .then(res => res.json())
    .then(console.log);`,
}
,
{
  id: "geodb_graphql",
  name: "GeoDB Cities (GraphQL)",
  category: "Geolocation",
  endpoint: "http://geodb-free-service.wirefreethought.com/graphql",
  description: "Query global city, country, and region data using GraphQL. No API key required.",
  image: "/api_previews/geodb_graphql.png",
  code: `fetch("http://geodb-free-service.wirefreethought.com/graphql", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: \`
        {
          cities(limit: 5, namePrefix: "del") {
            id
            name
            country {
              name
            }
            region {
              name
            }
          }
        }
      \`,
    }),
  })
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "quickchart",
  name: "QuickChart",
  category: "Images",
  endpoint: "https://quickchart.io/chart",
  description: "Generate chart images (PNG) from Chart.js configuration. No API key required.",
  image: "/api_previews/quickchart.png",
  code: `fetch("https://quickchart.io/chart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chart: {
        type: "bar",
        data: {
          labels: ["Red", "Blue", "Yellow"],
          datasets: [{
            label: "Votes",
            data: [12, 19, 3]
          }]
        }
      }
    }),
  })
    .then(res => res.blob())
    .then(img => console.log("Chart image blob:", img));`,
}
,
{
  id: "gravatar",
  name: "Gravatar User Avatar",
  category: "Profile",
  endpoint: "https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50",
  description: "Fetch a user's global avatar using their MD5-hashed email. No API key required.",
  image: "/api_previews/gravatar.png",
  code: `// Replace with MD5 hash of any email
fetch("https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50")
  .then(res => res.blob())
  .then(console.log);`,
},
{
  id: "dicebear",
  name: "DiceBear Avatar Generator",
  category: "Design",
  endpoint: "https://api.dicebear.com/7.x/bottts/svg?seed=John",
  description: "Generate unique SVG avatars using styles like bottts, avataaars, initials, and more. No API key required.",
  image: "/api_previews/dicebear.png",
  code: `fetch("https://api.dicebear.com/7.x/bottts/svg?seed=John")
    .then(res => res.text())
    .then(console.log);`,
},
{
  id: "cocktaildb",
  name: "Cocktail Recipes",
  category: "Food & Drinks",
  endpoint: "https://www.thecocktaildb.com/api/json/v1/1/random.php",
  description: "Fetch random cocktail drink recipes with ingredients, instructions, and images. No API key required.",
  image: "/api_previews/cocktaildb.png",
  code: `fetch("https://www.thecocktaildb.com/api/json/v1/1/random.php")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "openfoodfacts",
  name: "Food Nutrition Data",
  category: "Food",
  endpoint: "https://world.openfoodfacts.org/api/v0/product/737628064502.json",
  description: "Fetch nutrition facts, ingredients, and product details from the OpenFoodFacts database. No API key required.",
  image: "/api_previews/openfoodfacts.png",
  code: `fetch("https://world.openfoodfacts.org/api/v0/product/737628064502.json")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "periodic_table",
  name: "Periodic Table Elements",
  category: "Science",
  endpoint: "https://neelpatel05.pythonanywhere.com",
  description: "Fetch detailed information about all elements in the periodic table. No API key required.",
  image: "/api_previews/periodic_table.png",
  code: `fetch("https://neelpatel05.pythonanywhere.com")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "deckofcards",
  name: "Deck of Cards",
  category: "Games",
  endpoint: "https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1",
  description: "Generate and shuffle card decks, draw cards, reshuffle, and more. No API key required.",
  image: "/api_previews/deckofcards.png",
  code: `fetch("https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "pokemon",
  name: "Pokémon Details",
  category: "Games",
  endpoint: "https://pokeapi.co/api/v2/pokemon/pikachu",
  description: "Fetch detailed Pokémon data such as stats, abilities, moves, types, and sprites. No API key required.",
  image: "/api_previews/pokemon.png",
  code: `fetch("https://pokeapi.co/api/v2/pokemon/pikachu")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "openmeteo",
  name: "Open-Meteo Weather",
  category: "Weather",
  endpoint: "https://api.open-meteo.com/v1/forecast?latitude=51.5&longitude=-0.12&hourly=temperature_2m",
  description: "Scientific weather forecasts including temperature, wind, precipitation, and more. No API key required.",
  image: "/api_previews/openmeteo.png",
  code: `fetch("https://api.open-meteo.com/v1/forecast?latitude=51.5&longitude=-0.12&hourly=temperature_2m")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "jikan",
  name: "Jikan Anime Search",
  category: "Entertainment",
  endpoint: "https://api.jikan.moe/v4/anime?q=naruto",
  description: "Search anime details using the unofficial MyAnimeList API (Jikan). No API key required.",
  image: "/api_previews/jikan.png",
  code: `fetch("https://api.jikan.moe/v4/anime?q=naruto")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "rickmorty",
  name: "Rick & Morty Characters",
  category: "Entertainment",
  endpoint: "https://rickandmortyapi.com/api/character",
  description: "Fetch characters from the Rick & Morty universe. No API key required.",
  image: "/api_previews/rickmorty.png",
  code: `fetch("https://rickandmortyapi.com/api/character")
    .then(res => res.json())
    .then(console.log);`,
},

{
  id: "freetogame",
  name: "Free-to-Play Games List",
  category: "Games",
  endpoint: "https://www.freetogame.com/api/games",
  description: "Fetch a list of free-to-play PC games including genre, platform, developer, and more. No API key required.",
  image: "/api_previews/freetogame.png",
  code: `fetch("https://www.freetogame.com/api/games")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "opendota",
  name: "OpenDota Stats",
  category: "Games",
  endpoint: "https://api.opendota.com/api/heroStats",
  description: "Fetch detailed Dota 2 hero statistics, match data, player rankings, and more. No API key required.",
  image: "/api_previews/opendota.png",
  code: `fetch("https://api.opendota.com/api/heroStats")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "chesscom_player",
  name: "Chess.com Player Profile",
  category: "Games",
  endpoint: "https://api.chess.com/pub/player/magnuscarlsen",
  description: "Fetch public Chess.com player profile details such as username, status, and avatar. No API key required.",
  image: "/api_previews/chesscom.png",
  code: `fetch("https://api.chess.com/pub/player/magnuscarlsen")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "ipl_dataset",
  name: "IPL Cricket Dataset",
  category: "Sports",
  endpoint: "https://github.com/ritesh-ojha/IPL-DATASET/tree/main/json",
  description: "Access IPL cricket match data, player stats, teams, and scorecards in JSON format hosted on GitHub.",
  image: "/api_previews/ipl_dataset.png",
  code: `fetch("https://raw.githubusercontent.com/ritesh-ojha/IPL-DATASET/main/json/ipl_2022.json")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "xenocanto",
  name: "Bird Recordings (Xeno-Canto v3)",
  category: "Nature",
  endpoint: "https://xeno-canto.org/api/3/recordings?query=bird&key=YOUR_API_KEY",
  description: "Fetch bird sound recordings from Xeno-canto (v3 API — requires personal key).",
  image: "/api_previews/xenocanto.png",
  code: `fetch("https://xeno-canto.org/api/3/recordings?query=bird&key=YOUR_API_KEY")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "nekosbest",
  name: "NekosBest Anime GIFs",
  category: "Entertainment",
  endpoint: "https://nekos.best/api/v2/neko",
  description: "Fetch neko images and anime role-playing GIFs. No API key required.",
  image: "/api_previews/nekosbest.png",
  code: `fetch("https://nekos.best/api/v2/neko")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "colormind",
  name: "Color Scheme Generator",
  category: "Design",
  endpoint: "http://colormind.io/api/",
  description: "Generate color palettes using Colormind's AI-powered color scheme generator. No API key required.",
  image: "/api_previews/colormind.png",
  code: `fetch("http://colormind.io/api/", {
      method: "POST",
      body: JSON.stringify({ model: "default" })
    })
    .then(res => res.json())
    .then(console.log);`,
},

{
  id: "emojihub",
  name: "EmojiHub Categories",
  category: "Fun",
  endpoint: "https://emojihub.yurace.pro/api/all",
  description: "Fetch emojis by categories, groups, and more. No API key required.",
  image: "/api_previews/emojihub.png",
  code: `fetch("https://emojihub.yurace.pro/api/all")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "iconhorse",
  name: "Website Favicon Fetcher",
  category: "Utilities",
  endpoint: "https://icon.horse/icon/google.com",
  description: "Fetch favicons for any website with automatic fallbacks. No API key required.",
  image: "/api_previews/iconhorse.png",
  code: `fetch("https://icon.horse/icon/google.com")
    .then(res => res.blob())
    .then(console.log);`,
},
{
  id: "gita_telugu_odia",
  name: "Bhagavad Gita (Telugu & Odia)",
  category: "Spiritual",
  endpoint: "https://bhagavadgitaapi.in/slok/1/1/tel.json",
  description: "Fetch Bhagavad Gita verses in Telugu and Odia languages. No API key required.",
  image: "/api_previews/gita.png",
  code: `fetch("https://bhagavadgitaapi.in/slok/1/1/tel.json")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "bible",
  name: "Bible API",
  category: "Religion",
  endpoint: "https://bible-api.com/john%203:16",
  description: "Fetch Bible verses in multiple translations and languages. No API key required.",
  image: "/api_previews/bible.png",
  code: `fetch("https://bible-api.com/john%203:16")
    .then(res => res.json())
    .then(console.log);`,
}
,

{
  id: "xcolors",
  name: "xColors – Color Generator & Converter",
  category: "Design",
  endpoint: "https://x-colors.yurace.pro/api/random",
  description: "Generate random colors, convert between formats (HEX, RGB, HSL), and explore color palettes. No API key required.",
  image: "/api_previews/xcolors.png",
  code: `fetch("https://x-colors.yurace.pro/api/random")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "poetrydb",
  name: "Poetry Database",
  category: "Literature",
  endpoint: "https://poetrydb.org/author/Shakespeare",
  description: "Fetch poems from a vast poetry collection by author, title, or random. No API key required.",
  image: "/api_previews/poetrydb.png",
  code: `fetch("https://poetrydb.org/author/Shakespeare")
    .then(res => res.json())
    .then(console.log);`,
}
,
{
  id: "openlibrary",
  name: "Open Library Books",
  category: "Books",
  endpoint: "https://openlibrary.org/search.json?q=harry+potter",
  description: "Fetch book data, authors, editions, and cover images from Open Library. No API key required.",
  image: "/api_previews/openlibrary.png",
  code: `fetch("https://openlibrary.org/search.json?q=harry+potter")
    .then(res => res.json())
    .then(console.log);`,
}
,
{
  id: "quran_api",
  name: "Quran REST API",
  category: "Religion",
  endpoint: "https://api.alquran.cloud/v1/quran/en.asad",
  description: "Fetch Quran text in multiple languages with chapters, verses, and metadata. No API key required.",
  image: "/api_previews/quran.png",
  code: `fetch("https://api.alquran.cloud/v1/quran/en.asad")
    .then(res => res.json())
    .then(console.log);`,
}

,
{
  id: "gbif",
  name: "Global Biodiversity Data",
  category: "Nature",
  endpoint: "https://api.gbif.org/v1/species",
  description: "Access global biodiversity data, species information, taxonomy, and occurrence records. No API key required.",
  image: "/api_previews/gbif.png",
  code: `fetch("https://api.gbif.org/v1/species")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "idigbio",
  name: "iDigBio Museum Specimens",
  category: "Science",
  endpoint: "https://api.idigbio.org/v2/search/records",
  description: "Access millions of biodiversity and museum specimen records from institutions around the world. No API key required.",
  image: "/api_previews/idigbio.png",
  code: `fetch("https://api.idigbio.org/v2/search/records")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "indian_mutual_fund",
  name: "Indian Mutual Fund History",
  category: "Finance",
  endpoint: "https://api.mfapi.in/mf/119551",
  description: "Fetch complete historical NAV data for Indian Mutual Funds. No API key required.",
  image: "/api_previews/mutualfund.png",
  code: `fetch("https://api.mfapi.in/mf/119551")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "openbrewery",
  name: "Open Brewery DB",
  category: "Food & Drinks",
  endpoint: "https://api.openbrewerydb.org/v1/breweries",
  description: "Fetch data about breweries, cideries, brewpubs, and craft beer bottle shops. No API key required.",
  image: "/api_previews/openbrewery.png",
  code: `fetch("https://api.openbrewerydb.org/v1/breweries")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "fruityvice",
  name: "Fruityvice Fruit Data",
  category: "Food",
  endpoint: "https://www.fruityvice.com/api/fruit/all",
  description: "Fetch nutritional and general data about a wide variety of fruits. No API key required.",
  image: "/api_previews/fruityvice.png",
  code: `fetch("https://www.fruityvice.com/api/fruit/all")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "foodish",
  name: "Random Food Image",
  category: "Food",
  endpoint: "https://foodish-api.com/api/",
  description: "Fetch a random image of a food dish. No API key required.",
  image: "/api_previews/foodish.png",
  code: `fetch("https://foodish-api.com/api/")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "amiibo",
  name: "Nintendo Amiibo Information",
  category: "Games",
  endpoint: "https://amiiboapi.com/api/amiibo/",
  description: "Fetch detailed information about Nintendo Amiibo figures, including series, character, game appearances, and images. No API key required.",
  image: "/api_previews/amiibo.png",
  code: `fetch("https://amiiboapi.com/api/amiibo/")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "disney",
  name: "Disney Characters",
  category: "Entertainment",
  endpoint: "https://api.disneyapi.dev/characters",
  description: "Fetch detailed information about Disney characters including films, TV shows, and more. No API key required.",
  image: "/api_previews/disney.png",
  code: `fetch("https://api.disneyapi.dev/characters")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "naruto_characters",
  name: "Naruto Characters",
  category: "Entertainment",
  endpoint: "https://dattebayo-api.onrender.com/characters",
  description: "Fetch a list of Naruto characters with detailed information such as clan, rank, and abilities.",
  image: "/api_previews/naruto_characters.png",
  code: `fetch("https://dattebayo-api.onrender.com/characters")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "opentopodata",
  name: "Elevation & Ocean Depth",
  category: "Geography",
  endpoint: "https://api.opentopodata.org/v1/test-dataset?locations=51.509865,-0.118092",
  description: "Fetch elevation or ocean depth for given latitude and longitude coordinates. No API key required.",
  image: "/api_previews/opentopodata.png",
  code: `fetch("https://api.opentopodata.org/v1/test-dataset?locations=51.509865,-0.118092")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "covid_current",
  name: "COVID-19 India Current Data",
  category: "Health",
  endpoint: "https://data.covid19india.org/v4/min/data.min.json",
  description: "Fetch current day numbers across districts and states including confirmed, recovered, and tested.",
  image: "/api_previews/covid_current.png",
  code: `fetch("https://data.covid19india.org/v4/min/data.min.json")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "openwhyd",
  name: "Openwhyd Playlists",
  category: "Music",
  endpoint: "https://openwhyd.org/hot",
  description: "Download and explore curated playlists of streaming tracks from platforms like YouTube, SoundCloud, and more. No API key required.",
  image: "/api_previews/openwhyd.png",
  code: `fetch("https://openwhyd.org/hot")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "spaceflightnews",
  name: "Spaceflight News",
  category: "Space",
  endpoint: "https://api.spaceflightnewsapi.net/v4/articles",
  description: "Fetch the latest spaceflight-related news articles, launches, and updates. No API key required.",
  image: "/api_previews/spaceflightnews.png",
  code: `fetch("https://api.spaceflightnewsapi.net/v4/articles")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "universities",
  name: "World Universities List",
  category: "Education",
  endpoint: "https://raw.githubusercontent.com/Hipo/university-domains-list/refs/heads/master/world_universities_and_domains.json",
  description: "Fetch a complete global list of universities with country, domains, and web pages.",
  image: "/api_previews/universities.png",
  code: `fetch("https://raw.githubusercontent.com/Hipo/university-domains-list/refs/heads/master/world_universities_and_domains.json")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "nobelprize",
  name: "Nobel Prize Open Data",
  category: "Education",
  endpoint: "https://api.nobelprize.org/2.1/nobelPrizes",
  description: "Fetch open data about Nobel Prizes, laureates, categories, and award years. No API key required.",
  image: "/api_previews/nobelprize.png",
  code: `fetch("https://api.nobelprize.org/2.1/nobelPrizes")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "github_contributions",
  name: "GitHub Contribution Chart",
  category: "Dev",
  endpoint: "https://ghchart.rshah.org/username",
  description: "Generate an image of a user's GitHub contribution chart. No API key required.",
  image: "/api_previews/github_contributions.png",
  code: `fetch("https://ghchart.rshah.org/username")
    .then(res => res.blob())
    .then(img => console.log(img));`,
},
{
  id: "github_readme_stats",
  name: "GitHub ReadMe Stats",
  category: "Dev",
  endpoint: "https://github-readme-stats.vercel.app/api?username=octocat",
  description: "Generate dynamic stats cards for your GitHub profile README. No API key required.",
  image: "/api_previews/github_readme_stats.png",
  code: `fetch("https://github-readme-stats.vercel.app/api?username=octocat")
    .then(res => res.text())
    .then(console.log); // returns SVG`,
},
{
  id: "dictum",
  name: "Dictum Inspiring Quotes",
  category: "Motivation",
  endpoint: "https://www.quoterism.com/api/quotes",
  description: "Access a collection of the most inspiring expressions of mankind. No API key required.",
  image: "/api_previews/dictum.png",
  code: `fetch("https://www.quoterism.com/api/quotes")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "forismatic",
  name: "Inspirational Quote",
  category: "Motivation",
  endpoint: "https://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=en",
  description: "Fetch a random inspirational quote using the Forismatic API. No API key required.",
  image: "/api_previews/forismatic.png",
  code: `fetch("https://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=en")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "icanhazdadjoke",
  name: "Random Dad Joke",
  category: "Fun",
  endpoint: "https://icanhazdadjoke.com/",
  description: "Fetch a random dad joke from the largest collection of dad jokes on the internet. No API key required.",
  image: "/api_previews/icanhazdadjoke.png",
  code: `fetch("https://icanhazdadjoke.com/", {
      headers: { "Accept": "application/json" }
    })
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "stoicquote",
  name: "Stoic Quote",
  category: "Motivation",
  endpoint: "https://stoic.tekloon.net/stoic-quote",
  description: "Fetch a random stoic philosophy quote with author.",
  image: "/api_previews/stoicquote.png",
  code: `fetch("https://stoic.tekloon.net/stoic-quote")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "worldbank",
  name: "World Bank Global Data",
  category: "Data",
  endpoint: "https://api.worldbank.org/v2/country/ind/indicator/SP.POP.TOTL?format=json",
  description: "Fetch global development, economic, population, and financial data from the World Bank. No API key required.",
  image: "/api_previews/worldbank.png",
  code: `fetch("https://api.worldbank.org/v2/country/ind/indicator/SP.POP.TOTL?format=json")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "usgs_earthquakes",
  name: "USGS Earthquake Data",
  category: "Geology",
  endpoint: "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2014-01-01&endtime=2014-01-02",
  description: "Fetch earthquake event data from the USGS Earthquake Hazards Program within a specified date range.",
  image: "/api_previews/usgs_earthquakes.png",
  code: `fetch("https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2014-01-01&endtime=2014-01-02")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "tle",
  name: "Satellite TLE Data",
  category: "Space",
  endpoint: "https://tle.ivanstanojevic.me/api/tle/25544",
  description: "Fetch Two-Line Element (TLE) orbital data for satellites such as the ISS. No API key required.",
  image: "/api_previews/tle.png",
  code: `fetch("https://tle.ivanstanojevic.me/api/tle/25544")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "sunrise_sunset",
  name: "Sunrise & Sunset Times",
  category: "Geolocation",
  endpoint: "https://api.sunrise-sunset.org/json?lat=36.7201600&lng=-4.4203400",
  description: "Get daily sunrise and sunset times for any latitude and longitude. No API key required.",
  image: "/api_previews/sunrise_sunset.png",
  code: `fetch("https://api.sunrise-sunset.org/json?lat=36.7201600&lng=-4.4203400")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "opennotify_iss",
  name: "ISS Current Location",
  category: "Space",
  endpoint: "http://api.open-notify.org/iss-now.json",
  description: "Fetch the current geographic location of the International Space Station (ISS). No API key required.",
  image: "/api_previews/opennotify_iss.png",
  code: `fetch("http://api.open-notify.org/iss-now.json")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "nasa_images",
  name: "NASA Images & Data",
  category: "Space",
  endpoint: "https://images-api.nasa.gov/search?q=earth",
  description: "Access NASA's public image and video library including space imagery, missions, planets, and astronomy. No API key required.",
  image: "/api_previews/nasa_images.png",
  code: `fetch("https://images-api.nasa.gov/search?q=earth")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "launchlibrary",
  name: "Launch Library 2",
  category: "Space",
  endpoint: "https://ll.thespacedevs.com/2.2.0/launch/upcoming/",
  description: "A public spaceflight database providing information about upcoming and past rocket launches and events. No API key required.",
  image: "/api_previews/launchlibrary.png",
  code: `fetch("https://ll.thespacedevs.com/2.2.0/launch/upcoming/")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "4chan",
  name: "4chan JSON API",
  category: "Misc",
  endpoint: "https://a.4cdn.org/boards.json",
  description: "A public JSON API for retrieving boards, threads, and posts from 4chan. No API key required.",
  image: "/api_previews/4chan.png",
  code: `// Fetch all boards
fetch("https://a.4cdn.org/boards.json")
  .then(res => res.json())
  .then(console.log);

// Fetch threads of a specific board (example: 'g' - technology)
fetch("https://a.4cdn.org/g/threads.json")
  .then(res => res.json())
  .then(console.log);`,
},
{
  id: "squiggle",
  name: "Squiggle",
  category: "Sports",
  endpoint: "https://api.squiggle.com.au/",
  description: "Fixtures, results, team rankings, and match predictions for the Australian Football League (AFL). No API key required.",
  image: "/api_previews/squiggle.png",
  code: `fetch("https://api.squiggle.com.au/?q=games;year=2024")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "mlb-records",
  name: "MLB Records & Stats",
  category: "Sports",
  endpoint: "https://statsapi.mlb.com/api/v1/stats",
  description:
    "Provides current and historical MLB statistics, records, player data, and game information. No API key required.",
  image: "/api_previews/mlb.png",
  code: `fetch("https://statsapi.mlb.com/api/v1/stats?stats=season&group=hitting")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "citybikes",
  name: "CityBikes",
  category: "Transport",
  endpoint: "https://api.citybik.es/v2/networks",
  description: "A free, public API providing bike-sharing networks and real-time station data from cities around the world. No API key required.",
  image: "/api_previews/citybikes.png",
  code: `fetch("https://api.citybik.es/v2/networks")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "postalpincode",
  name: "Postal Pin Code (India)",
  category: "Location",
  endpoint: "https://api.postalpincode.in/pincode/110001",
  description: "API for retrieving detailed information about Indian Postal PIN codes, including district, state, and post office details. No API key required.",
  image: "/api_previews/postalpincode.png",
  code: `fetch("https://api.postalpincode.in/pincode/110001")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "aviationapi",
  name: "AviationAPI",
  category: "Aviation",
  endpoint: "https://api.aviationapi.com/",
  description: "Provides FAA aeronautical charts, airport data, publications, and real-time airport weather information. No API key required.",
  image: "/api_previews/aviationapi.png",
  code: `fetch("https://api.aviationapi.com/v1/airports?apt=JFK")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "tvmaze",
  name: "TVMaze",
  category: "Entertainment",
  endpoint: "https://api.tvmaze.com/shows",
  description: "A free TV show and series database providing details like cast, episodes, schedules, networks, and more. No API key required.",
  image: "/api_previews/tvmaze.png",
  code: `fetch("https://api.tvmaze.com/shows")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "thronesapi",
  name: "Thrones API",
  category: "Entertainment",
  endpoint: "https://thronesapi.com/api/v2/Characters",
  description: "Game of Thrones characters API providing detailed character information with imagery. No API key required.",
  image: "/api_previews/thronesapi.png",
  code: `fetch("https://thronesapi.com/api/v2/Characters")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "swapi",
  name: "SWAPI",
  category: "Entertainment",
  endpoint: "https://swapi.dev/api/people/1/",
  description: "The Star Wars API providing data about films, characters, planets, starships, and more. No API key required.",
  image: "/api_previews/swapi.png",
  code: `fetch("https://swapi.dev/api/people/1/")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "finalspace",
  name: "Final Space API",
  category: "Entertainment",
  endpoint: "https://finalspaceapi.com/api/v0/",
  description: "A public API providing data about characters, episodes, locations, and quotes from the Final Space animated series. No API key required.",
  image: "/api_previews/finalspace.png",
  code: `fetch("https://finalspaceapi.com/api/v0/character/")
    .then(res => res.json())
    .then(console.log);`,
},
{
  id: "goldapi",
  name: "GoldAPI",
  category: "Finance",
  endpoint: "https://www.goldapi.io/api/XAU/INR",
  description: "Real-time gold and precious metal price API. Requires an API key via x-access-token header.",
  image: "/api_previews/goldapi.png",
  code: `var myHeaders = new Headers();
myHeaders.append("x-access-token", "YOUR_API_KEY");
myHeaders.append("Content-Type", "application/json");

var requestOptions = {
  method: 'GET',
  headers: myHeaders,
  redirect: 'follow'
};

fetch("https://www.goldapi.io/api/XAU/INR", requestOptions)
  .then(response => response.json())
  .then(console.log)
  .catch(console.error);`
},
{
  id: "goldapi2",
  name: "Gold API2",
  category: "Finance",
  endpoint: "https://api.gold-api.com/price/{symbol}",
  description: "Provides real-time and historical gold, silver, and metal prices. No API key required for basic endpoints.",
  image: "/api_previews/goldapi.png",
  code: `// Get price for a specific metal (e.g., XAU, XAG)
fetch("https://api.gold-api.com/price/XAU")
  .then(res => res.json())
  .then(console.log);

// Get list of supported symbols
fetch("https://api.gold-api.com/symbols")
  .then(res => res.json())
  .then(console.log);`,
},
{
  id: "fdaAnimalVet",
  name: "FDA Animal & Veterinary",
  category: "Health",
  endpoint: "https://api.fda.gov/animalandveterinary/event.json",
  description: "FDA's database for animal and veterinary adverse events. No API key required.",
  image: "/api_previews/fda_animalvet.png",
  code: `fetch("https://api.fda.gov/animalandveterinary/event.json?search=primary_reporter:Veterinarian&limit=5")
    .then(res => res.json())
    .then(console.log);`,
},





























];

/* Category Icon mapping */
const CATEGORY_ICON = {
  Utility: Layers,
  Fun: Sparkles,
  Geo: Globe,
  Food: Atom,
  Dev: CodeIcon,
  Media: ImageIcon,
};

function CategoryIcon({ category, className }) {
  const Icon = CATEGORY_ICON[category] || Layers;
  return <Icon className={className} />;
}

/* ---------------------------
   Small helpers / components
   --------------------------- */

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/* Small reusable Info row */
function InfoRow({ icon, label, children }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="mt-1 opacity-70">{icon}</div>
      <div>
        <div className="text-xs opacity-60">{label}</div>
        <div className="font-medium">{children}</div>
      </div>
    </div>
  );
}

/* ---------------------------
   Main Page
   --------------------------- */

export default function ApisPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // state
  const [selectedId, setSelectedId] = useState(APIS[0].id);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showCode, setShowCode] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [rawExample, setRawExample] = useState(null);
  const [loadingInvoke, setLoadingInvoke] = useState(false);

  const searchRef = useRef(null);
  const suggestTimer = useRef(null);

  const selected = APIS.find((a) => a.id === selectedId) || APIS[0];

  const categories = useMemo(() => ["All", ...Array.from(new Set(APIS.map((p) => p.category)))], []);

  // filtered list
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return APIS.filter((a) => {
      const qMatch = !q || a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
      const cMatch = categoryFilter === "All" || a.category === categoryFilter;
      return qMatch && cMatch;
    });
  }, [query, categoryFilter]);

  // suggestions based on typed text
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return APIS.filter((a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  // related APIs for right panel
  const related = APIS.filter((a) => a.category === selected.category && a.id !== selected.id).slice(0, 6);

  useEffect(() => {
    // focus search on load for quick keyboard
    // comment out if undesired
    // searchRef.current?.focus();
  }, []);

  /* ---------------------------
     Handlers
     --------------------------- */
  function onSearchChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      // show suggestions (already computed)
    }, 250);
  }

  function selectApi(id) {
    setSelectedId(id);
    setShowCode(false);
    setShowSuggest(false);
    setRawExample(null);
  }

  async function tryInvoke(endpoint) {
    setLoadingInvoke(true);
    setRawExample(null);
    try {
      // Basic GET request; no CORS handling here (may fail in browser for some endpoints)
      const res = await fetch(endpoint, { method: "GET" });
      const ct = res.headers.get("content-type") || "";
      let body;
      if (ct.includes("application/json")) {
        body = await res.json();
      } else {
        body = await res.text();
      }
      setRawExample({ status: res.status, headers: { "content-type": ct }, body });
      toast.success("Fetched example response");
    } catch (err) {
      console.error(err);
      setRawExample({ error: String(err) });
      toast.error("Failed to fetch (CORS or network error). See console.");
    } finally {
      setLoadingInvoke(false);
    }
  }

  function copyEndpoint(ep) {
    navigator.clipboard.writeText(ep);
    toast.success("Endpoint copied");
  }

  /* ---------------------------
     UI Rendering
     --------------------------- */
  return (
    <div className={clsx("min-h-screen max-w-8xl mx-auto p-6 transition-colors", isDark ? "dark" : "")}>
      <Toaster />

      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold">Revolyx API Explorer</h1>
          <p className="text-sm opacity-70 mt-1">Beautiful curated APIs — search, preview, and copy quickly.</p>
        </div>

        {/* search + category */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className={clsx("flex items-center gap-2 px-3 py-2 rounded-lg border", isDark ? "bg-black/60 border-zinc-800" : "bg-white border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search APIs, e.g. 'weather', 'random', 'geo'..."
              className="border-0 bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />

<Select value={categoryFilter} onValueChange={setCategoryFilter}>
  <SelectTrigger className="w-32 border-none bg-transparent focus:ring-0 focus:ring-offset-0 text-sm">
    <SelectValue placeholder="Category" />
  </SelectTrigger>
  <SelectContent>
    {categories.map((c) => (
      <SelectItem key={c} value={c} className="cursor-pointer">
        {c}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold">APIs</div>
                <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setCategoryFilter("All"); }}>
                  Reset
                </Button>
              </div>

              <Input value={query} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search..." className="mb-3" />

              <div className="mb-3">
                <div className="text-xs opacity-60 mb-2">Category</div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <Button key={c} variant={c === categoryFilter ? "default" : "ghost"} size="sm" onClick={() => setCategoryFilter(c)}>{c}</Button>
                  ))}
                </div>
              </div>

              <ScrollArea className="h-[60vh]">
                <div className="space-y-3">
                  {filtered.map((api) => (
                    <motion.div key={api.id}  className={clsx("p-3 rounded-lg border cursor-pointer", api.id === selectedId ? "border-zinc-500 bg-zinc-50 dark:bg-zinc-900/30" : "border-zinc-200 dark:border-zinc-700")} onClick={() => { selectApi(api.id); }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CategoryIcon category={api.category} className="w-5 h-5 opacity-80" />
                          <div>
                            <div className="font-semibold">{api.name}</div>
                            <div className="text-xs opacity-60">{api.description}</div>
                          </div>
                        </div>
                        <Badge className="text-xs">{api.category}</Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* suggestions dropdown (desktop) */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute left-6 right-6 md:left-[calc(50%_-_360px)] md:right-auto max-w-3xl z-50 rounded-xl overflow-hidden border", isDark ? "bg-black/60 border-zinc-800" : "bg-white border-zinc-200")}>
            {suggestions.map((s) => (
              <div key={s.id} className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer flex items-center gap-3" onClick={() => { selectApi(s.id); }}>
                <CategoryIcon category={s.category} className="w-5 h-5 opacity-80" />
                <div className="flex-1">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs opacity-60">{s.category} • {s.description}</div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-60" />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        {/* Left Sidebar (desktop) */}
        <aside className="hidden lg:block lg:col-span-3">
          <Card className={clsx("p-4 rounded-2xl border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className="mb-3">
              <div className="text-sm font-semibold">APIs</div>
              <div className="text-xs opacity-60">Browse curated endpoints</div>
            </div>

            <ScrollArea className="h-[72vh] pr-2">
              <div className="space-y-3">
                {filtered.map((api) => (
                  <motion.div key={api.id} className={clsx("p-3 rounded-lg border cursor-pointer", api.id === selectedId ? "border-zinc-500 bg-zinc-50 dark:bg-zinc-700/30" : "border-zinc-200 dark:border-zinc-700")} onClick={() => selectApi(api.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CategoryIcon category={api.category} className="w-5 h-5 opacity-80" />
                        <div>
                          <div className="font-semibold">{api.name}</div>
                          <div className="text-xs opacity-60">{api.description}</div>
                        </div>
                      </div>
                      <Badge className="text-xs">{api.category}</Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </aside>

        {/* Main Content */}
        <section className="lg:col-span-9 space-y-6">
          {/* Hero header */}
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className={clsx("p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div className="flex items-start gap-4">
                <div className="rounded-lg w-14 h-14 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 border">
                  <CategoryIcon category={selected.category} className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold truncate">{selected.name}</h2>
                  <p className="text-sm opacity-60 mt-1">{selected.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* <div className="px-3 py-2 rounded-lg border bg-black/5 dark:bg-white/5 text-sm">
                  <div className="text-xs opacity-60">Endpoint</div>
                  <div className="font-mono text-sm">{selected.endpoint}</div>
                </div> */}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => copyEndpoint(selected.endpoint)}><Copy /></Button>
                  <Button onClick={() => tryInvoke(selected.endpoint)} disabled={loadingInvoke}>{loadingInvoke ? "Fetching..." : "Try"}</Button>
                  <Link to={`/apis/${selected.id}`}>
                    <Button variant="ghost">Open <ExternalLink className="w-4 h-4 inline ml-1" /></Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Content body */}
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left / Primary details */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Key info */}
                  <div className="grid grid-cols-1  gap-4">
                    <div className="p-4 rounded-lg overflow-y-auto np-scrollbar border">
                      <InfoRow icon={<LinkIcon />} label="Endpoint">
                        <div className="font-mono text-sm break-words">{selected.endpoint}</div>
                      </InfoRow>
                    </div>

                    <div className="p-4 rounded-lg border">
                      <InfoRow icon={<CodeIcon />} label="Category">
                        {selected.category}
                      </InfoRow>
                    </div>
                  </div>

                  <Separator />

                  {/* Description + Use cases */}
                  <div className="space-y-3">
                    <div className="text-sm font-semibold">Overview</div>
                    <div className="text-sm opacity-80 leading-relaxed">{selected.description}</div>

                    <div className="mt-4 text-sm font-semibold">Example Code</div>
                    <div className={clsx("relative mt-2 rounded-xl p-4 border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                      {/* Floating glass code box */}
                      <div className={clsx("p-3 rounded-lg shadow-md border", isDark ? "bg-black/60 border-zinc-700" : "bg-white border-zinc-200")}>
                        <pre className="text-xs overflow-auto" style={{ maxHeight: 240 }}>
                          <code>{selected.code}</code>
                        </pre>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Right / Compact info */}
                <aside className="space-y-4">
                  <Card className="p-4 rounded-lg border">
                    <div className="text-sm font-semibold mb-2">Quick Info</div>
                    <div className="space-y-3">
                      <InfoRow icon={<CategoryIcon category={selected.category} className="w-4 h-4" />} label="Category">
                        {selected.category}
                      </InfoRow>

                      <InfoRow icon={<ImageIcon />} label="Preview">
                        <div className="text-sm font-medium">{selected.name}</div>
                      </InfoRow>

                      <InfoRow icon={<ExternalLink />} label="Docs / Link">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => window.open(selected.endpoint, "_blank")}>Open</Button>
                          <Button variant="ghost" size="sm" onClick={() => toast("No docs provided — use endpoint")}>Docs</Button>
                        </div>
                      </InfoRow>
                    </div>
                  </Card>

                  <Card className="p-4 rounded-lg border">
                    <div className="text-sm font-semibold mb-2">Test Console</div>
                    <div className="text-xs opacity-60 mb-2">Invoke the endpoint (GET) — may fail in-browser due to CORS.</div>
                    <div className="flex gap-2">
                      <Button onClick={() => tryInvoke(selected.endpoint)} disabled={loadingInvoke}>{loadingInvoke ? "Running..." : "Invoke"}</Button>
                      <Button variant="outline" onClick={() => copyEndpoint(selected.endpoint)}><Copy /></Button>
                    </div>

                    <AnimatePresence>
                      {rawExample && (
                        <motion.pre initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="text-xs mt-3 p-3 rounded-md bg-black/90 text-white overflow-auto" style={{ maxHeight: 220 }}>
                          {prettyJSON(rawExample)}
                        </motion.pre>
                      )}
                    </AnimatePresence>
                  </Card>
                </aside>
              </div>
            </CardContent>
          </Card>

          {/* More from this category */}
          <Card className="p-6 rounded-2xl border bg-white/60 dark:bg-black/40">
            <CardTitle className="text-lg mb-4">More in <span className="font-semibold">{selected.category}</span></CardTitle>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {related.length === 0 ? <div className="text-sm opacity-60">No related APIs</div> : related.map((r) => (
                <motion.div key={r.id} whileHover={{ scale: 1.03 }} onClick={() => selectApi(r.id)} className="p-3 rounded-md border cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs opacity-60">{r.description}</div>
                    </div>
                    <Badge className="text-xs">{r.category}</Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
