
// These are declared globally so they can be used in the add_node function

let scaleFactor = 15;
let randomXRange = 500;  
let cy;
let yearPositions = {};
let xSpacing = 150;  
let minYear = Math.min(...nodes.map(node => new Date(node.data.date_discovered).getFullYear()));


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
        let node = evt.target;
        let nodeData = node.data();
    
        document.getElementById("source-title").textContent = nodeData.label || "N/A";
        document.getElementById("source-type").textContent = nodeData.is_primary ? "Primary" : "Secondary";
        document.getElementById("source-author").textContent = nodeData.author || "N/A";
        document.getElementById("source-date-created").textContent = nodeData.date_created || "N/A";
        document.getElementById("source-date-discovered").textContent = nodeData.date_discovered || "N/A";
        document.getElementById("source-language").textContent = nodeData.language || "N/A";

        let linkContainer = document.getElementById("source-link");
        if (nodeData.url) {
            linkContainer.innerHTML = `<a href="${nodeData.url}" target="_blank">${nodeData.url}</a>`;
        } else {
            linkContainer.textContent = "N/A";
        }
    
        document.getElementById("source-description").textContent = nodeData.description || "N/A";
    
        let tagsList = document.getElementById("source-tags");
        tagsList.innerHTML = "";
        if (nodeData.tags && nodeData.tags.length > 0) {
            nodeData.tags.forEach(tag => {
                let li = document.createElement("li");
                li.textContent = tag;
                tagsList.appendChild(li);
            });
        } else {
            let li = document.createElement("li");
            li.textContent = "No tags";
            tagsList.appendChild(li);
        }

        const labelContainer = document.getElementById("source-type");
        if (nodeData.is_primary) {
            labelContainer.innerHTML = '<label for="primary" class="node-type-primary">Primary</label>';
        } else {
            labelContainer.innerHTML = '<label for="secondary" class="node-type-secondary">Secondary</label>';
        }
    
        // Show the popup
        document.getElementById('source-info-popup').checked = true;
    });
});

// This function is declared globally so it can be used every time a node is added
function add_node(data) {
    if (!data || !data.title || !data.date_discovered) {
        console.error("Invalid node data:", data);
        return;
    }

    const year = new Date(data.date_discovered).getFullYear();
    let yPosition = (year - minYear) * scaleFactor;  // Scale based on year difference

   
    if (!yearPositions[year]) {
        yearPositions[year] = { count: 0 };
    }

    const xOffset = (Math.random()) * randomXRange + yearPositions[year].count * xSpacing;
    const xPosition = 100 + xOffset;

    

    
    const nodeId = `node-${Date.now()}`;
    
   
    nodes.push({
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
            // Only add edge if both nodes exist
            edges.push({
                data: {
                    id: `edge-${nodeId}-${citedId}`,
                    source: nodeId,
                    target: citedId
                }
            });
            
        });
    }


    init_cy();
}
