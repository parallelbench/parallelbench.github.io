"""Convert table.csv to per-model JSON files in data/leaderboard/.

Reads table.csv (columns: model, unmasking, epw80, epw75, epw70, peak_accuracy),
applies ID mappings, and writes one JSON per model.

Usage:
    python scripts/convert_table_csv.py [path/to/table.csv]

If no path is given, defaults to table.csv in the project root.
"""

import csv
import json
import os
import sys
from collections import defaultdict

BASE_DIR = os.path.join(os.path.dirname(__file__), "..")
LEADERBOARD_DIR = os.path.join(BASE_DIR, "data", "leaderboard")

MODEL_MAP = {
    "LLaDA-1.0-8B": "llada10",
    "LLaDA-1.5-8B": "llada15",
    "dream-7B": "dream",
    "DiffuCoder-7B": "diffucoder",
    "dParallel-Dream-7B": "dparallel-dream",
    "dParallel-LLaDA-8B": "dparallel-llada",
    "LLaDA-2.0-Mini": "llada20-mini",
    "LLaDA-2.0-Mini-CAP": "llada20-mini-cap",
    "LLaDA-2.1-Mini": "llada21-mini",
    "LLaDA-MoE-7B": "llada-moe",
    "LLaDA-MoE-7B-TD": "llada-moe-td",
    "SDAR-1.7B": "sdar-1.7b",
    "SDAR-4B": "sdar-4b",
    "SDAR-8B": "sdar-8b",
    "SDAR-Trado-4B": "sdar-trado-4b",
    "SDAR-Trado-8B": "sdar-trado-8b",
}

STRATEGY_MAP = {
    "random": "random",
    "left_to_right": "l2r",
    "low_confidence_threshold": "confidence-threshold",
    "low_confidence": "confidence-topk",
    "low_confidence_factor": "confidence-factor",
    "entropy": "entropy-topk",
    "apd": "apd",
    "slow_fast": "slowfast",
    "dus": "dus",
    "wino": "wino",
    "topk_margin": "topk-margin",
    "klass": "klass",
    "low_confidence_eb": "confidence-eb",
    "low_confidence_pc_sampler": "confidence-pc-sampler",
    "random_pc_sampler": "random-pc-sampler",
    "low_confidence_threshold_quality": "confidence-threshold-quality",
    "low_confidence_threshold_speed": "confidence-threshold-speed",
}

THRESHOLDS = [80, 75, 70]
THRESHOLD_COLUMNS = {80: "epw80", 75: "epw75", 70: "epw70"}


def main() -> None:
    table_csv = sys.argv[1] if len(sys.argv) > 1 else os.path.join(BASE_DIR, "table.csv")

    if not os.path.exists(table_csv):
        print(f"Error: {table_csv} not found")
        sys.exit(1)

    # Parse table.csv and group by model
    model_data = defaultdict(dict)
    skipped_models = set()
    skipped_strategies = set()

    with open(table_csv, "r") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            model = row["model"]
            strategy = row["unmasking"]

            if model not in MODEL_MAP:
                skipped_models.add(model)
                continue
            if strategy not in STRATEGY_MAP:
                skipped_strategies.add(strategy)
                continue

            model_id = MODEL_MAP[model]
            strategy_id = STRATEGY_MAP[strategy]

            epw_values = {}
            for threshold in THRESHOLDS:
                value = float(row[THRESHOLD_COLUMNS[threshold]])
                epw_values[str(threshold)] = round(value, 2)

            model_data[model_id][strategy_id] = epw_values

    # Clean existing leaderboard files and write new ones
    for filename in os.listdir(LEADERBOARD_DIR):
        if filename.endswith(".json"):
            os.remove(os.path.join(LEADERBOARD_DIR, filename))

    for model_id, strategies in sorted(model_data.items()):
        output = {
            "thresholds": THRESHOLDS,
            "results": dict(sorted(strategies.items())),
        }

        file_path = os.path.join(LEADERBOARD_DIR, f"{model_id}.json")
        with open(file_path, "w") as f:
            json.dump(output, f, indent=2)
            f.write("\n")

    print(f"Generated {len(model_data)} JSON files from {table_csv}")

    if skipped_models:
        print(f"Skipped models (unmapped): {skipped_models}")
    if skipped_strategies:
        print(f"Skipped strategies (unmapped): {skipped_strategies}")

    for filename in sorted(os.listdir(LEADERBOARD_DIR)):
        if filename.endswith(".json"):
            file_path = os.path.join(LEADERBOARD_DIR, filename)
            with open(file_path, "r") as f:
                data = json.load(f)
            print(f"  {filename} ({len(data['results'])} strategies)")


if __name__ == "__main__":
    main()
