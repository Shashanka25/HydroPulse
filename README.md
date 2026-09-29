# HydroPulse: Next-Gen IoT Water Intelligence Platform

![HydroPulse Cover](https://via.placeholder.com/1200x400/0b1326/4cd7f6?text=HydroPulse+IoT+Command+Center)

## 🌊 Overview

**HydroPulse** is a proactive, AI-driven IoT water management platform designed for modern urban infrastructure and large-scale industrial complexes. It functions as the central nervous system of a facility's water grid, combining sub-second IoT telemetry polling with real-time digital twin visualization and predictive AI forecasting.

By empowering facility managers and field engineers to detect anomalies instantly and predict maintenance needs before failures occur, HydroPulse ensures zero-waste operations and sustainable water management.

## ✨ Key Features

*   **📡 Real-Time IoT Telemetry:** Sub-second polling engine for real-time metrics (Total Flow Rate, System Pressure, Active Anomalies) with zero lag.
*   **🌐 Digital Twin & Interactive Topology:** A visually stunning, real-time map of the water grid where nodes and pipes dynamically change color based on live pressure readings.
*   **🚨 Intelligent Anomaly Detection:** Automated alerting system that pinpoints leak origins and calculates wasted water volume in real-time.
*   **🧠 Predictive Analytics:** "AI Forecast" tab featuring 7-day demand forecasting and predictive maintenance warnings for impending hardware failures.
*   **📱 "Field Engineer" Mobile View:** Deeply responsive architecture that seamlessly transitions from a massive command-center sidebar to a mobile-friendly bottom navigation bar.
*   **🏢 Multi-Facility Management:** Interactive dropdown for the Chief Utility Officer to hot-swap between multiple geographic locations (e.g., East Campus, North Sector Plant).
*   **🎮 Interactive Sensor Simulator:** A built-in Dev Console for live testing and investor demos, allowing manual manipulation of pressure metrics to trigger platform-wide anomalies.
*   **📄 Automated PDF Reports:** 1-click PDF export functionality for fast regulatory compliance reporting and flow audits.
*   **🌙 Premium Dark Mode UI:** Built with a custom `#0b1326` deep-blue palette, glassmorphic blurred panels, and smooth micro-animations.

## 🚀 Getting Started

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

### Prerequisites
*   Node.js 18.x or later
*   npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/hydropulse.git
cd hydropulse
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the dashboard.

## 🛠 Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Icons:** Google Material Symbols
*   **Language:** TypeScript / React

## 👨‍💻 Developer Guide

**Accessing the Dev Console:**
To simulate IoT sensor failures or leaks locally, click the floating `< / >` (Developer Board) button in the bottom right corner of the dashboard. Use the slider to increase Zone 2 Pressure above 80 PSI to trigger an automatic layout reaction and anomaly alert.

---
*Built for the future of water conservation.*
