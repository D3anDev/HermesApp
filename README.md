
# Project Hermes: Your Personal Anime Companion

Project Hermes is a modern, privacy-focused, desktop-first application designed for anime enthusiasts. It provides an all-in-one solution for tracking your anime progress, managing custom watch lists, discovering new series, and staying updated with the latest news from the anime world. With deep customization options and seamless integration with external services like MyAnimeList, Hermes offers a superior and personalized anime tracking experience.

## ✨ Features

*   **Comprehensive Anime Tracking:** Easily manage your watching status, episode progress, and personal scores.
*   **Customizable Watchlists:** Create and organize custom lists to perfectly suit your viewing habits.
*   **Anime Discovery:** Explore new series, detailed information, characters, related titles, and image galleries.
*   **News Feed Integration:** Stay up-to-date with the latest anime news through customizable RSS feeds.
*   **MyAnimeList (MAL) Integration:** Import your existing MAL list, export your Hermes data in MAL XML format, and connect your MAL account for seamless syncing.
*   **Advanced Customization:** Personalize the application's appearance with custom backgrounds, live visual effects, multiple theme presets, and configurable dashboard layouts.
*   **Data Privacy:** All your data is stored locally on your device, ensuring complete privacy and control.
*   **Time & Date Display:** Customizable clock and date widgets with timezone support and animation options.
*   **Detailed Statistics:** Visualize your anime watching habits with various statistical breakdowns and genre distributions.
*   **Image Viewer & Cropper:** View full-size images from anime galleries and crop profile pictures directly within the app.

## 🚀 Getting Started

To run Project Hermes locally, follow these steps:

**Prerequisites:**
*   Node.js (LTS version recommended)
*   npm (usually comes with Node.js)

**Installation:**

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/HermesApp.git
    cd HermesApp
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up Environment Variables (Optional but Recommended):
    *   If you plan to use MyAnimeList integration, you'll need a MAL Client ID. You can set it directly in the app's settings or by adding `VITE_MAL_CLIENT_ID="your_mal_client_id_here"` to a `.env.local` file in the project root.

4.  Run the application:
    ```bash
    npm run dev
    ```

    The application will typically be available at `http://localhost:3000/` or a similar port if 3000 is in use.

## 📦 Project Structure

```
.
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── cards/          # Components for displaying data in card formats (e.g., AnimeCard, ArticleCard)
│   │   ├── carousel/       # Carousel-related components
│   │   ├── layout/         # Layout-specific components (e.g., Sidebar)
│   │   ├── misc/           # Miscellaneous generic components (e.g., Clock, LiveEffectOverlay)
│   │   ├── modals/         # Modal dialog components (e.g., AnimeDetailModal, ConfirmationModal)
│   │   ├── search/         # Search-related components (e.g., GlobalSearch)
│   │   ├── settings/       # Settings-specific components (e.g., TimezoneSettings, CustomBackgroundSettings)
│   │   ├── stats/          # Components for displaying statistics (e.g., AnimeStats, GenreDistribution)
│   │   └── views/          # Top-level view components representing different sections of the app (e.g., HomeView, SettingsView)
│   ├── services/           # API interaction logic (e.g., aniListService, malService, rssService)
│   ├── utils/              # Utility functions and helpers (e.g., animeHelpers, cache, xmlParser)
│   ├── App.tsx             # Main application component
│   ├── index.css           # Global styles
│   ├── index.tsx           # Entry point for the React app
│   └── types.ts            # Global TypeScript type definitions
├── .env.local              # Environment variables (e.g., VITE_MAL_CLIENT_ID)
├── package.json            # Project dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build configuration
```

## 🤝 Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

---

**Built with React and Vite**