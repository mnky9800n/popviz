// Global variables
let countyData = {};
let cities = [];
let selectedCity = null;
let topology = null;
let path = null;
let svg = null;

// Load data
Promise.all([
    d3.json('data/counties-10m.json'),
    d3.json('data/county_populations.json'),
    d3.json('data/cities.json')
]).then(function([topoData, populationData, cityData]) {
    topology = topoData;
    cities = cityData;
    
    // Create county data lookup
    populationData.forEach(county => {
        // Ensure FIPS is padded to 5 digits
        const fips = String(county.fips).padStart(5, '0');
        countyData[fips] = county;
    });
    
    console.log('Loaded', Object.keys(countyData).length, 'counties');
    console.log('Sample county data:', Object.values(countyData).slice(0, 3));
    
    // Initialize visualization
    initCitySelector();
    initMap();
    
    // Set default city to New York
    selectedCity = cities.find(c => c.name === "New York City");
    document.getElementById('city-select').value = selectedCity.name;
    updateCityInfo();
    updateMap();
    
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            d3.select('#map').selectAll('*').remove();
            initMap();
        }, 250);
    });
});

function initCitySelector() {
    const select = d3.select('#city-select');
    
    cities.forEach(city => {
        select.append('option')
            .attr('value', city.name)
            .text(`${city.name}, ${city.country} (${city.population.toLocaleString()})`);
    });
    
    select.on('change', function() {
        selectedCity = cities.find(c => c.name === this.value);
        updateCityInfo();
        updateMap();
    });
}

function initMap() {
    // Get container dimensions
    const container = document.getElementById('map-container');
    const containerRect = container.getBoundingClientRect();
    const width = Math.min(960, containerRect.width - 40);
    const height = Math.min(600, containerRect.height - 40);
    
    svg = d3.select('#map')
        .attr('width', width)
        .attr('height', height);
    
    // Create projection for lower 48 states
    const projection = d3.geoAlbersUsa()
        .scale(width * 1.25)
        .translate([width / 2, height / 2]);
    
    path = d3.geoPath().projection(projection);
    
    // Convert TopoJSON to GeoJSON
    const counties = topojson.feature(topology, topology.objects.counties);
    const states = topojson.feature(topology, topology.objects.states);
    
    // Draw counties
    svg.append('g')
        .attr('class', 'counties')
        .selectAll('path')
        .data(counties.features)
        .enter().append('path')
        .attr('d', path)
        .attr('class', 'county')
        .attr('data-fips', d => String(d.id).padStart(5, '0'))
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOut);
    
    // Draw state boundaries
    svg.append('path')
        .datum(topojson.mesh(topology, topology.objects.states, (a, b) => a !== b))
        .attr('class', 'state-borders')
        .attr('d', path);
}

function handleMouseOver(event, d) {
    const fips = String(d.id).padStart(5, '0');
    const county = countyData[fips];
    if (!county) {
        console.log('No data for county:', d.id, fips);
        return;
    }
    
    // Show tooltip
    const tooltip = d3.select('#tooltip');
    tooltip.transition().duration(200).style('opacity', .9);
    tooltip.html(`${county.county_name}, ${county.state_name}<br/>Population: ${county.population.toLocaleString()}`)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    
    // Highlight this county
    d3.select(this).classed('hovered', true);
    
    // Find and highlight surrounding counties
    if (selectedCity) {
        highlightSurroundingCounties(fips);
    }
}

function handleMouseOut(event, d) {
    // Hide tooltip
    d3.select('#tooltip').transition().duration(500).style('opacity', 0);
    
    // Remove all highlights
    d3.selectAll('.county').classed('hovered', false).classed('selected', false);
}

function highlightSurroundingCounties(centerFips) {
    if (!selectedCity) return;
    
    const targetPopulation = selectedCity.population;
    const centerCounty = countyData[centerFips];
    if (!centerCounty) return;
    
    // Get all counties and calculate centroids once
    const counties = topojson.feature(topology, topology.objects.counties).features;
    const centerFeature = counties.find(f => f.id === centerFips);
    if (!centerFeature) return;
    
    const centerCentroid = path.centroid(centerFeature);
    // Check if center centroid is valid (not Alaska/Hawaii)
    if (!centerCentroid || isNaN(centerCentroid[0]) || isNaN(centerCentroid[1])) return;
    
    // Calculate distances for all counties
    const countyDistances = [];
    
    counties.forEach(feature => {
        const fips = String(feature.id).padStart(5, '0');
        const county = countyData[fips];
        if (!county) return;
        
        // Calculate centroid
        const centroid = path.centroid(feature);
        
        // Skip if centroid is invalid (Alaska, Hawaii, or other territories)
        if (!centroid || isNaN(centroid[0]) || isNaN(centroid[1])) return;
        
        // Calculate distance
        const distance = Math.sqrt(
            Math.pow(centroid[0] - centerCentroid[0], 2) + 
            Math.pow(centroid[1] - centerCentroid[1], 2)
        );
        
        countyDistances.push({
            fips: fips,
            distance: distance,
            population: county.population || 0
        });
    });
    
    // Sort by distance
    countyDistances.sort((a, b) => a.distance - b.distance);
    
    // Select counties until we reach target population
    let totalPopulation = 0;
    const selectedCounties = [];
    
    for (const county of countyDistances) {
        selectedCounties.push(county.fips);
        totalPopulation += county.population;
        
        if (totalPopulation >= targetPopulation) {
            break;
        }
    }
    
    // Highlight selected counties
    d3.selectAll('.county').classed('selected', function(d) {
        const fips = String(d.id).padStart(5, '0');
        return selectedCounties.includes(fips);
    });
    
    // Update info to show actual total
    const info = d3.select('#city-info');
    info.html(`${selectedCity.name} population: ${selectedCity.population.toLocaleString()}<br/>Selected counties population: ${totalPopulation.toLocaleString()}`);
}

function updateCityInfo() {
    if (!selectedCity) return;
    
    const info = d3.select('#city-info');
    info.text(`${selectedCity.name} population: ${selectedCity.population.toLocaleString()}, the colored counties contain the same number`);
}

function updateMap() {
    // Reset all county colors
    d3.selectAll('.county').classed('selected', false);
}