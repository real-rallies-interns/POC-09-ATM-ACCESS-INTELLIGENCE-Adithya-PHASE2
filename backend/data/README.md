# Cash Access Intelligence Platform

A geospatial financial infrastructure intelligence system designed to analyze ATM and bank accessibility across India using synthetic infrastructure datasets, interactive mapping, and regional intelligence scoring.

---

# Overview

The platform visualizes ATM and banking infrastructure distribution across multiple Indian regions and generates comparative intelligence insights such as:

- Coverage Score
- Access Gap
- ATM / Bank Density
- Travel Burden
- Underserved Zone Detection
- Demographic Pressure Visualization
- Area-to-Area Infrastructure Comparison

The system follows a Real Rails inspired 70/30 visualization-to-intelligence layout using a dark intelligence dashboard design.

---

# Features

## Interactive Intelligence Map
- Dark themed geospatial visualization
- ATM and Bank infrastructure plotting
- Dynamic map zoom and pan
- Underserved zone overlays
- Demographic pressure radius visualization

## Intelligence Dashboard
- Priority Coverage Score
- Access Gap Classification
- ATM / Bank Ratio
- Nearest ATM Distance Estimation
- Comparative Area Intelligence
- Access Risk Classification

## Comparison Engine
Compare two Indian regions simultaneously:
- Coverage performance
- Infrastructure imbalance
- Intervention priority
- Relative access quality

## Synthetic Data Infrastructure
- Structured JSON-based mock datasets
- Scalable backend ingestion
- Synthetic labels for all records
- Edge-case infrastructure testing
- Realistic ATM/Bank simulation

---

# Tech Stack

## Frontend
- Next.js
- TypeScript
- Tailwind CSS
- React Leaflet
- OpenStreetMap / CARTO Dark Tiles

## Backend
- FastAPI
- Python
- JSON-based data ingestion

---

# Project Structure

```bash
ATM-FINAL/
│
├── backend/
│   ├── data/
│   │   ├── access_points.json
│   │   ├── area_profiles.json
│   │   └── edge_cases.json
│   │
│   └── main.py
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── MapClient.tsx
│   │   └── globals.css
│   │
│   └── package.json