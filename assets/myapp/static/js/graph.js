// These are declared globally so they can be used in the add_node function

let scaleFactor = 15;
let randomXRange = 500;  
let cy;
let yearPositions = {};
let xSpacing = 150;  


let earliestYear = Math.min(...nodes.map(node => {
    let year = node.data.year_discovered;
    return node.data.ad_discovered === false ? -year : year; // Convert BC years to negative
}));

let minYear = earliestYear; // This now correctly handles BC
let maxYear = Math.max(...nodes.map(node => node.data.year_discovered));


let node;
const rng = new Math.seedrandom(projectId); 

function init_cy() {
    
    cy = cytoscape({
        
        container: document.getElementById("cy"),
        elements: [...nodes, ...edges],  

        style: [
            {
                selector: "node",
                style: {
                    "background-color": function (node) {
                        return node.data('is_primary') ? '#006400' : '#008080';  // Green for primary, blue for secondary
                    },
                    "width": function (node) {
                        let inDegree = node.incomers('edge').sources().length;
                        return Math.max(25, 10 + inDegree * 5);
                    },
                    "height": function (node) {
                        let inDegree = node.incomers('edge').sources().length;
                        return Math.max(25, 10 + inDegree * 5);
                    },
                    "label": 'data(label)',
                    "color": "#000",  // Black text for visibility
                    "text-valign": "top", // Align text above the node
                    "text-halign": "center",
                    "text-margin-y": "-5px", // Moves the text slightly upwards
                    "font-size": "14px",
                    "border-width": "2px",
                    "border-color": "#000",
                    "border-style": "solid"
                }
            },
            {
                selector: "node[id='dummy-start'], node[id='dummy-end']",
                style: {
                    "visibility": "hidden",  // Hide dummy nodes
                    "background-color": "#FF0000",  // Red color for dummy nodes
                    "width": 50,
                    "height": 50
                }
            },
            {
                selector: "node[id^='node-']",  // Selector to target timeline nodes (starting with "node-")
                style: {
                    "background-color": "#FF6347", // Tomato color for timeline nodes
                    "width": 60,
                    "height": 60,
                    "label": 'data(label)', 
                    "color": "#fff",
                    "text-valign": "center",
                    "text-halign": "center",
                    "font-size": "14px",
                    
                }
            },
            {
                selector: "node[id^='node-right-']",  // Selector to target right-side nodes (starting with "node-right-")
                style: {
                    "visibility": "hidden",  // Make right-side nodes invisible
                }
            },
            {
                selector: "edge",  // Style all edges
                style: {
                    "width": function (edge) {
                        // If it's an edge between two timeline nodes, make it black
                        if (edge.source().id().startsWith('node-') && edge.target().id().startsWith('node-')) {
                            return 1; // Black color for edges between timeline nodes
                        }
                        return 3;
                    },

                    "line-color": function (edge) {
                        // If it's an edge between two timeline nodes, make it black
                        if (edge.source().id().startsWith('node-') && edge.target().id().startsWith('node-')) {
                            return '#000000'; // Black color for edges between timeline nodes
                        }
                        
                        const targetNode = edge.target();
                        return targetNode.data('is_primary') ? '#006400' : '#008080'; // Green for primary, blue for secondary
                    },
                    "opacity": 0.7 
                }
            }
        ],
        


        layout: {
            name: "preset",  // Use manually assigned positions
            positions: function (node) {
                return node.position;  // Use fixed positions from our sorted nodes
            }
        },

        minZoom: 0.1,
        maxZoom: 2.0,
    });

    

    
    
    
    function addTimelineNodes() {
        // Round minYear up to the next multiple of 10
        let startYear = minYear % 10 === 0 ? minYear : Math.ceil(minYear / 10) * 10;
        startYear -= 10;
    
        // Add timeline nodes only for years within the range of minYear and maxYear
        for (let year = startYear; year <= maxYear; year += 10) {
            let displayYear = year < 0 ? `${Math.abs(year)} BC` : `${year} AD`;
    
            let nodeId = `node-${year}`;
            let yPos = (year - minYear) * scaleFactor;
            let rightNodeId = `node-right-${year}`;
    
            if (!cy.getElementById(nodeId).length) {
                cy.add({
                    group: 'nodes',
                    data: { id: nodeId, label: displayYear, isTimelineNode: true },
                    position: { x: -100, y: yPos }
                });
    
                cy.add({
                    group: 'nodes',
                    data: { id: rightNodeId, label: displayYear, isTimelineNode: true },
                    position: { x: 1000, y: yPos }
                });
    
                cy.add({
                    group: 'edges',
                    data: { source: nodeId, target: rightNodeId }
                });
    
                if (year > startYear) {
                    let prevYear = year - 10;
                    let prevNodeId = `node-${prevYear}`;
    
                    cy.add({
                        group: 'edges',
                        data: { source: prevNodeId, target: nodeId }
                    });
                }
            }
        }
    }
    
    addTimelineNodes();
    
   
}


document.addEventListener("DOMContentLoaded", function () {
    
    nodes.forEach((node) => {
        let year = node.data.year_discovered;

        if (node.data.ad_discovered === false) {
            year = -year; 
        }
        let yPosition = (year - minYear) * scaleFactor;  // Scale based on year difference

        // Handle horizontal spacing
        if (!yearPositions[year]) {
            yearPositions[year] = { count: 0 };
        }
        const xOffset = rng() * randomXRange + yearPositions[year].count * xSpacing;

        node.position = { x: 100 + xOffset, y: yPosition };

        // Increment counter for this year (for horizontal shifting)
        yearPositions[year].count += 1;
    });

    init_cy();

    // Lock nodes to prevent movement
    cy.nodes().forEach(function(node) {
        node.lock();
    });

    cy.on('tap', 'node', function(evt) {
        node = evt.target;
        if(!node.data('isTimelineNode')){
           populateData();
            toggleLabel();
            document.getElementById('source-info-popup').checked = true;
            document.getElementById('view-source-info-panel').style.display = 'block'; 
        }
    });
});


document.addEventListener("DOMContentLoaded", function () {
    const timelineCheckbox = document.getElementById("timeline-checkbox");

    timelineCheckbox.addEventListener("change", function () {
        const showTimeline = this.checked;

        cy.batch(() => {
            cy.nodes().forEach((node) => {
                if (node.id().startsWith("node-") && !node.id().startsWith("node-right-")) {
                    node.style("visibility", showTimeline ? "visible" : "hidden");
                    
                }
            });

            cy.edges().forEach((edge) => {
                if (edge.source().id().startsWith("node-") || edge.target().id().startsWith("node-")) {
                    edge.style("visibility", showTimeline ? "visible" : "hidden");
                }
            });
        });
    });
});




