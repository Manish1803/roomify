# Roomify 🏠

AI-powered architectural visualization SaaS built with React, TypeScript, and Puter. Use AI models from Claude to Gemini to transform 2D floor plans into photorealistic 3D renders with permanent hosting and persistent metadata. This project features 2D-to-3D photorealistic rendering, serverless workers, high-performance KV storage, and a global community feed.

## 🚀 Key Features

👉 **2D-to-3D Visualization**: Instant architectural rendering that transforms flat floor plans into photorealistic 3D models using state-of-the-art AI.

👉 **Persistent Media Hosting**: Permanent file storage that generates public URLs for every upload and output, ensuring your renders are always accessible.

👉 **Dynamic Project Gallery**: A personalized workspace that tracks your history of visualizations with instant loading and metadata persistence.

👉 **Side-by-Side Comparison**: Interactive tools designed to visualize the direct transformation from a source architectural sketch to its AI-rendered counterpart.

👉 **Global Community Feed**: A public discovery engine where users share their architectural projects with the world in a single click.

👉 **Privacy Controls**: Granular public and private toggles that give users full authority over the visibility and security of their architectural data.

👉 **Ownership Mapping**: A clean metadata system that tracks project details and user IDs across the entire platform for seamless account management.

👉 **Modern Export Functionality**: High-performance tools to download and move AI-generated renders into real-world presentations and workflows.

## 🛠️ Tech Stack

-   **Frontend**: [React Router 7](https://reactrouter.com/) (Vite), [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Platform**: [Puter.js](https://puter.com/) (Auth, Hosting, KV Storage, Workers)
-   **AI**: Claude & Gemini (via Puter Workers)
-   **UI Components**: [React Compare Slider](https://github.com/nerkmind/react-compare-slider)

## 📦 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or higher)
-   A [Puter](https://puter.com/) account for storage and workers.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Manish1803/roomify.git
    cd roomify
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

### Environment Variables

1.  Create a `.env.local` file in the root directory.
2.  Copy the contents from `.env.example` and fill in the values.

```env
VITE_PUTER_WORKER_URL=your-worker-url-here
```

### Running Locally

To start the development server with HMR:

```bash
npm run dev
```

Visit `http://localhost:5173` to view the application.

## ⚙️ Project Architecture

-   `app/`: Main application logic using React Router v7 conventions.
-   `components/`: Reusable UI components styled with Tailwind CSS.
-   `lib/`: Core logic for Puter.js integration, including hosting, storage, and worker actions.
-   `public/`: Static assets.
-   `puter-worker/`: (If applicable) Logic for the serverless workers that handle AI rendering and storage.

## 🌐 Community & Support

-   **Share your renders**: Use the Global Community Feed to showcase your designs.
-   **Privacy first**: All your projects are private by default.

---
Built with ❤️ using React Router and Puter.
