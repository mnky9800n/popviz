# US County Population Visualization

An interactive visualization that compares US county populations to major world cities. Hover over any county to see surrounding counties that together equal a selected city's population.

Inspired by [Derek Camp's LinkedIn post](https://www.linkedin.com/posts/derek-camp_map-monday-population-of-new-york-city-activity-7355575328552980486-sbhQ) showing New York City's population compared to surrounding counties.

## Live Demo

View the live demo at: https://[your-username].github.io/popviz/

## Features

- Interactive map of US counties (lower 48 states only)
- Compare county populations to 20 major cities (10 US + 10 world cities)
- Hover functionality that highlights counties based on population
- Shows how many counties it takes to equal a city's population
- Responsive design that works on different screen sizes

## How to Use

1. Select a city from the dropdown menu (defaults to New York City)
2. Hover over any county on the map
3. The visualization will highlight surrounding counties in green
4. The highlighted counties together contain approximately the same population as the selected city
5. The tooltip shows individual county populations

## Data Sources

- County boundaries: US Census Bureau (via TopoJSON US Atlas)
- County populations: US Census Bureau ACS 2022 5-year estimates
- City populations: 2023 estimates from various sources

## Deploying to GitHub Pages

1. Fork or clone this repository
2. Push to your GitHub repository
3. Go to Settings � Pages
4. Under "Source", select "Deploy from a branch"
5. Choose "main" branch and "/ (root)" folder
6. Click Save
7. Your site will be available at `https://[your-username].github.io/popviz/`

## Local Development

To run locally:

```bash
# Clone the repository
git clone https://github.com/[your-username]/popviz.git
cd popviz

# Start a local server
python3 -m http.server 8000

# Open in browser
# Navigate to http://localhost:8000
```

## Building from Source

If you want to update the data or modify the data collection:

```bash
# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create virtual environment and install dependencies
uv sync

# Download fresh data
uv run python download_data.py
```

## Technical Details

Built with:
- D3.js v7 for data visualization
- TopoJSON for efficient geographic data
- Vanilla JavaScript (no framework dependencies)
- Pure CSS for styling

## License

This project is open source and available under the MIT License.