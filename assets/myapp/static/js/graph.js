
// These are declared globally so they can be used in the add_node function

let scaleFactor = 15;
let randomXRange = 500;  
let cy;
let yearPositions = {};
let xSpacing = 150;  
let minYear = Math.min(...nodes.map(node => new Date(node.data.date_discovered).getFullYear()));
let node;


function init_cy(){
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
                    selector: "edge",
                    style: {
                        "width": 2,
                        "line-color": "#aaa",
                        "target-arrow-color": "#aaa",
                        "target-arrow-shape": "triangle"
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
    }

document.addEventListener("DOMContentLoaded", function () {
    
    nodes.forEach((node) => {
        const year = new Date(node.data.date_discovered).getFullYear();
        let yPosition = (year - minYear) * scaleFactor;  // Scale based on year difference

        // Handle horizontal spacing
        if (!yearPositions[year]) {
            yearPositions[year] = { count: 0 };
        }
        const xOffset = (Math.random()) * randomXRange + yearPositions[year].count * xSpacing;

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
        
        
        populateData();
        toggleLabel();
        document.getElementById('source-info-popup').checked = true;
        document.getElementById('view-source-info-panel').style.display = 'block';
    
        
    });
    
    
    
});

// This function is declared globally so it can be used every time a node is added
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

    const xOffset = (Math.random()) * randomXRange + yearPositions[year].count * xSpacing;
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

    // Update node data
    node.data({
        label: data.title,
        date_discovered: data.date_discovered,
        is_primary: data.is_primary || false
    });

    // Handle repositioning if year changed
    const newYear = new Date(data.date_discovered).getFullYear();
    const oldYear = new Date(node.data("date_discovered")).getFullYear();

    if (newYear !== oldYear) {
        let yPosition = (newYear - minYear) * scaleFactor;

        if (!yearPositions[newYear]) {
            yearPositions[newYear] = { count: 0 };
        }

        const xOffset = (Math.random()) * randomXRange + yearPositions[newYear].count * xSpacing;
        node.position({ x: 100 + xOffset, y: yPosition });

        yearPositions[newYear].count += 1;
    }

    // Remove old edges
    cy.edges().filter(edge => edge.data("source") === nodeId).remove();

    // Add new edges if citations are updated
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

    // Ensure all nodes remain locked
    cy.nodes().lock();
}
