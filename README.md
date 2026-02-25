# HackxAadhar - Next-Gen Aadhaar Services Platform

## Overview
HackxAadhar is a comprehensive, modern web application ecosystem designed to enhance and streamline Aadhaar-related services. The platform integrates AI assistance, intuitive booking flows, real-time age-based alerts, and multi-stage verification workflows to provide a seamless user experience.

The project is structured into two main applications:
1. **Frontend App (`addar-main`)**: A React (Vite) based frontend application with an elegant UI and robust client-side routing.
2. **Core App (`new zip/new`)**: A Next.js full-stack application with Supabase integration, AI capabilities, and biometric authentication features.

## Key Features
- **AI Assistant**: Intelligent chatbot to handle Aadhaar-related queries, guide users on required documents, explain update processes, and provide dynamic recommendations.
- **Smart Slot Booking**: Advanced booking flow allowing users to select update types (Biometric, Demographic, etc.) before choosing a center, ensuring accurate scheduling.
- **Age-Based Alerts**: Proactive dashboard notifications tracking age milestones (e.g., mandatory biometric updates at ages 5 and 15, and revalidation at age 50).
- **Multi-Stage Verification Workflow**: Visual tracking system for Aadhaar update requests with color-coded progress indicators (`completed`, `pending`, `current`, `rejected`).
- **Biometric & Face Authentication**: Integration with `face-api.js` for secure identity verification and liveliness checks.
- **QR Code Generation**: Instantly generate QR codes for secure and easy sharing of appointment details.

## Tech Stack
### Frontend (`addar-main`)
- **React 18**
- **Vite**
- **TypeScript**
- **Tailwind CSS**
- **shadcn-ui**

### Core App (`new zip/new`)
- **Next.js 16**
- **React 19**
- **Supabase** (Database & Auth)
- **face-api.js** (Face authentication)
- **Framer Motion** (Animations)
- **bcryptjs** (Security)
- **qrcode.react** (QR generation)

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git

### Running the Frontend (`addar-main`)
1. Navigate to the `addar-main` directory:
   ```bash
   cd addar-main
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Running the Core App (`new zip/new`)
1. Navigate to the core app directory:
   ```bash
   cd "new zip/new"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables (e.g., Supabase URLs and API keys) in a `.env` file.
4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure
```text
hackxaadhar/
├── addar-main/                 # React frontend application
│   ├── src/                    # Source code (Components, Pages, Hooks)
│   ├── public/                 # Static assets
│   ├── index.html              # Entry point
│   ├── vite.config.ts          # Vite configuration
│   └── package.json            # Dependencies
├── new zip/new/                # Next.js core application
│   ├── components/             # Reusable UI components
│   ├── lib/                    # Utilities and integration logic
│   ├── next.config.ts          # Next.js configuration
│   └── package.json            # Dependencies
└── README.md                   # Project documentation
```

## Contributing
Contributions are welcome. Please ensure that any changes maintain modularity and do not break existing Aadhaar logic, frontend routing, or database queries. Ensure you don't override the `README.md` files located in the sub-directories unless necessary.

## License
ISC
