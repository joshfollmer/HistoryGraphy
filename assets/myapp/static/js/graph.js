document.addEventListener("DOMContentLoaded", function () {
    
    
       
    console.log(nodes);
        // Sort nodes by date_discovered (ascending order)
        const sortedNodes = nodes.sort((a, b) => {
            const dateA = new Date(a.data.date_discovered).getFullYear();
            const dateB = new Date(b.data.date_discovered).getFullYear();
            return dateA - dateB;  // Sorting from earliest to latest
        });

        let yearPositions = {};  // Store assigned Y positions for each year
        let xSpacing = 150;  // Horizontal spacing between nodes in the same year

        // Assign y-position based on unique years
        sortedNodes.forEach((node) => {
            const year = new Date(node.data.date_discovered).getFullYear();
            
            if (!(year in yearPositions)) {
                // Assign a new y position for this year
                yearPositions[year] = Object.keys(yearPositions).length * 100;
            }

            // Determine x position (shift horizontally if there are multiple nodes in the same year)
            const xOffset = (yearPositions[year].count || 0) * xSpacing;
            node.position = { x: 100 + xOffset, y: yearPositions[year] };

            // Increment counter for this year (for horizontal shifting)
            yearPositions[year].count = (yearPositions[year].count || 0) + 1;
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
                    return node.position();  // Use fixed positions from our sorted nodes
                }
            },

            minZoom: 0.1,
            maxZoom: 2.0,
        });

        // cy.nodes().forEach(function(node) {
        //     node.lock();  // Lock nodes to prevent movement
        // });
    })
   
