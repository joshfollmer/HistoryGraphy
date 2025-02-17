document.addEventListener("DOMContentLoaded", function () {
    let yearPositions = {};  // Store assigned X positions for each year
    let xSpacing = 150;  // Horizontal spacing between nodes in the same year
    let randomXRange = 500;  // Maximum random offset for x position

    // Find the minimum year to normalize y positions
    let minYear = Math.min(...nodes.map(node => new Date(node.data.date_discovered).getFullYear()));
    let scaleFactor = 15;  // Adjust this to control vertical spacing

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

    // Initialize Cytoscape
    var cy = cytoscape({
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

    // Lock nodes to prevent movement
    cy.nodes().forEach(function(node) {
        node.lock();
    });
});
