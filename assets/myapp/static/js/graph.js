document.addEventListener("DOMContentLoaded", function () {
    console.log(nodes);
    
    // Sort nodes by date_discovered (ascending order)
    const sortedNodes = nodes.sort((a, b) => {
        const dateA = a.data.date_discovered ? new Date(a.data.date_discovered).getFullYear() : 0;
        const dateB = b.data.date_discovered ? new Date(b.data.date_discovered).getFullYear() : 0;
        return dateA - dateB;
    });
    

    let yearPositions = {};  // Store assigned Y positions for each year
    let xSpacing = 150;  // Horizontal spacing between nodes in the same year

    // Assign y-position based on unique years
    sortedNodes.forEach((node) => {
        const year = new Date(node.data.date_discovered).getFullYear();
        
        // If the year is encountered for the first time, initialize the Y position and count
        if (!yearPositions[year]) {
            yearPositions[year] = { yPos: Object.keys(yearPositions).length * 100, count: 0 };
        }

        // Determine x position (shift horizontally if there are multiple nodes in the same year)
        const xOffset = yearPositions[year].count * xSpacing;
        node.position = { x: 100 + xOffset, y: yearPositions[year].yPos };

        // Increment counter for this year (for horizontal shifting)
        yearPositions[year].count += 1;
    });

    var cy = cytoscape({
        container: document.getElementById("cy"),
        elements: sortedNodes,  // Use the sorted nodes

        style: [
            {
                selector: "node",
                style: {
                    "background-color": function (node) {
                        return node.data('is_primary') ? '#006400' : '#008080';  // Green for primary, blue for secondary
                    },
                    "label": "data(label)",
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
     cy.nodes().forEach(function(node) {
            node.lock();  // Lock nodes to prevent movement
        });
});
