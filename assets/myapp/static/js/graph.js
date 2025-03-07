// These are declared globally so they can be used in the add_node function

let scaleFactor = 15;
let randomXRange = 500;  
let cy;
let yearPositions = {};
let xSpacing = 150;  
let minYear = Math.min(...nodes.map(node => new Date(node.data.date_discovered).getFullYear()));
let maxYear = Math.max(...nodes.map(node => new Date(node.data.date_discovered).getFullYear()));

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
                        let inDegree = node.incomers('edge').sources().length; // Count children
                        return Math.max(25, 10 + inDegree * 5);
                    },
                    "height": function (node) {
                        let inDegree = node.incomers('edge').sources().length; // Count children
                        return Math.max(25, 10 + inDegree * 5);
                    },
                    "label": 'data(label)',
                    "color": "#fff",
                    "text-valign": "center",
                    "text-halign": "center",
                    "font-size": "14px",
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
                    "width": 40,
                    "height": 40,
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
                    }
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

    

    
    
    
    // Function to add dummy nodes at every 10 years along the Y-axis
    function addTimelineNodes() {
        for (let year = minYear; year <= maxYear; year += 10) {
            let nodeId = `node-${year}`;
            let yPos = (year - minYear) * scaleFactor; // Space nodes vertically, starting from 50px
            let rightNodeId = `node-right-${year}`; // ID for the new node on the right side
    
            // Create the timeline node
            cy.add({
                group: 'nodes',
                data: { id: nodeId, label: year.toString(), isTimelineNode: true },  // Mark it as a timeline node
                position: { x: -100, y: yPos }
            });
            
            // Create the right-side node
            cy.add({
                group: 'nodes',
                data: { id: rightNodeId, label: `${year}`, isTimelineNode: true }, // Mark as timeline node
                position: { x: 1000, y: yPos } // Place it to the right of the timeline node (adjust `x` as needed)
            });
    
            // Create an edge between the timeline node and the right-side node
            cy.add({
                group: 'edges',
                data: { source: nodeId, target: rightNodeId }
            });
    
            // Create an edge to the previous timeline node (if not the first one)
            if (year > minYear) {
                let prevYear = year - 10;
                let prevNodeId = `node-${prevYear}`;
                
                cy.add({
                    group: 'edges',
                    data: { source: prevNodeId, target: nodeId }
                });
            }
        }
    }
    
    
    addTimelineNodes();
    
   
}


document.addEventListener("DOMContentLoaded", function () {
    
    nodes.forEach((node) => {
        const year = new Date(node.data.date_discovered).getFullYear();
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


function add_node(data) {
    if (!data || !data.title || !data.date_discovered) {
        console.error("Invalid node data:", data);
        return;
    }

    const year = new Date(data.date_discovered).getFullYear();
    let yPosition = (year - minYear) * scaleFactor;  

    if (!yearPositions[year]) {
        yearPositions[year] = { count: 0 };
    }

    const xOffset = rng() * randomXRange + yearPositions[year].count * xSpacing;
    const xPosition = 100 + xOffset;

    const nodeId = `node-${Date.now()}`;

    // Add new node to Cytoscape directly (instead of pushing to `nodes` array)
    cy.add({
        group: "nodes",
        data: {
            id: nodeId,
            label: data.title,
            date_discovered: data.date_discovered,
            is_primary: data.is_primary || false
        },
        position: { x: xPosition, y: yPosition }
    });

    // Add edges if the node cites other sources
    if (data.selectedCites && data.selectedCites.length > 0) {
        data.selectedCites.forEach(citedId => {
            cy.add({
                group: "edges",
                data: {
                    id: `edge-${nodeId}-${citedId}`,
                    source: nodeId,
                    target: citedId
                }
            });
        });
    }

    // Lock all nodes to prevent movement
    cy.nodes().lock();
}

function edit_node(data, nodeId) {
    let node = cy.getElementById(nodeId);
    if (!node) {
        console.error("Node not found:", nodeId);
        return;
    }

    

    // Collect outgoing edges (edges where this node is the source)
    const outgoingEdges = cy.edges().filter(edge => edge.data("source") === nodeId).map(edge => ({
        id: edge.id(),
        source: edge.data("source"),
        target: edge.data("target")
    }));

    // Collect incoming edges (edges where this node is the target)
    const incomingEdges = cy.edges().filter(edge => edge.data("target") === nodeId).map(edge => ({
        id: edge.id(),
        source: edge.data("source"),
        target: edge.data("target")
    }));

    // Remove the old node
    node.remove();

    // Calculate new year-based position (yPosition) and xOffset
    const newYear = new Date(data.date_discovered).getFullYear();
    let yPosition = (newYear - minYear) * scaleFactor;

    if (!yearPositions[newYear]) {
        yearPositions[newYear] = { count: 0 };
    }

    const xOffset = rng() * randomXRange + yearPositions[newYear].count * xSpacing;
    

    // Create a new node with updated data
    cy.add({
        group: "nodes",
        data: {
            id: nodeId,
            label: data.title,
            author: data.author,
            date_created: data.date_created,
            date_discovered: data.date_discovered,
            language: data.language,
            url: data.url,
            description: data.description,
            is_primary: data.is_primary || false,
            selectedCites: data.selectedCites
        },
        position: {
            x: 100 + xOffset, // Set the new x position
            y: yPosition      // Set the new y position
        }
    });

    yearPositions[newYear].count += 1;

    // Recreate outgoing edges (edges where this node is the source)
    outgoingEdges.forEach(edge => {
        cy.add({
            group: "edges",
            data: {
                id: edge.id,
                source: edge.source,
                target: edge.target
            }
        });
    });

    // Recreate incoming edges (edges where this node is the target)
    incomingEdges.forEach(edge => {
        cy.add({
            group: "edges",
            data: {
                id: edge.id,
                source: edge.source,
                target: edge.target
            }
        });
    });

    // Ensure all nodes remain locked
    cy.nodes().lock();
}





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




