import json
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ATM Access Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

with open(DATA_DIR / "access_points.json", "r", encoding="utf-8") as file:
    ACCESS_POINTS = json.load(file)

with open(DATA_DIR / "area_profiles.json", "r", encoding="utf-8") as file:
    AREA_PROFILE_ROWS = json.load(file)

AREA_PROFILES = {
    row["area"]: {
        "state": row["state"],
        "populationPressure": row["populationPressure"],
        "travelBurden": row["travelBurden"],
        "incomeFriction": row["incomeFriction"],
    }
    for row in AREA_PROFILE_ROWS
}

@app.get("/")
def root():
    return {
        "project": "Cash Access Intelligence Platform",
        "status": "running",
        "data_label": "synthetic_mock_data",
        "source": "JSON Mock Data Package",
        "access_points": len(ACCESS_POINTS),
        "areas": len(AREA_PROFILES),
    }

@app.get("/access-points")
def get_access_points():
    return ACCESS_POINTS

@app.get("/area-profiles")
def get_area_profiles():
    return AREA_PROFILES

@app.get("/areas")
def get_areas():
    return list(AREA_PROFILES.keys())

@app.get("/mock-data-dictionary")
def get_mock_data_dictionary():
    return {
        "dataset": "ATM Cash Access Mock Data Package",
        "data_label": "synthetic_mock_data",
        "note": "Mock data is stored in backend/data JSON files and loaded by FastAPI.",
        "entities": ["AccessPoint", "AreaProfile"],
        "fields": {
            "AccessPoint": ["name", "type", "area", "lat", "lng", "data_label"],
            "AreaProfile": [
                "area",
                "state",
                "populationPressure",
                "travelBurden",
                "incomeFriction",
                "data_label",
            ],
        },
    }