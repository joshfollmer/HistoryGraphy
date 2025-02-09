document.addEventListener("DOMContentLoaded", function () {
    fetch(`/get_nodes/${projectId}/`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => response.json())
    .then(data => {
        console.log("Fetched data:", data);  // Log the response data

        // Sort nodes by date_discovered (ascending order)
        const sortedNodes = data.nodes.sort((a, b) => {
            const dateA = new Date(a.data.date_discovered);
            const dateB = new Date(b.data.date_discovered);
            return dateA - dateB;  // Sorting from earliest to latest
        });

        // Assign y-position based on the sorted order of date_discovered
        sortedNodes.forEach((node, index) => {
            node.position = { x: 100, y: index * 100 };  // Fixed x, dynamic y based on order
        });

        var cy = cytoscape({
            container: document.getElementById("cy"),
            elements: sortedNodes,  // Use the sorted nodes

            style: [
                {
                    selector: "node",
                    style: {
                        "background-color": function (node) {
                            // Set color based on whether it's primary or not
                            return node.data('is_primary') ? '#006400' : '#008080';  // Green for primary, blue for secondary
                        },
                        "label": "data(label)",  // Display the title as label
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
                name: "preset",  // Use 'preset' layout to respect the manually set positions
                positions: function (node) {
                    return node.position();  // Use the fixed positions from our sorted nodes
                }
            },

            minZoom: 0.1,  // Minimum zoom
            maxZoom: 2.0,  // Maximum zoom
        });
        cy.nodes().forEach(function(node) {
            node.lock();  // Lock the entire node

            // Allow horizontal movement (x-axis) by unlocking x-position
            node.position('x', node.position().x);  // Leave x unlocked
        });
    })
    .catch(error => console.error("Error fetching graph data:", error));
});
