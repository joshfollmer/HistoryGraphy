document.addEventListener("DOMContentLoaded", function () {
    var cy = cytoscape({
        container: document.getElementById("cy"), // The div where the graph is rendered

        elements: [
            { data: { id: "a", label: "Node A" } },
            { data: { id: "b", label: "Node B" } },
            { data: { id: "c", label: "Node C" } },
            { data: { source: "a", target: "b" } },
            { data: { source: "b", target: "c" } }
        ],

        style: [
            {
                selector: "node",
                style: {
                    "background-color": "#007bff",
                    "label": "data(label)",
                    "color": "#fff",
                    "text-valign": "center",
                    "text-halign": "center",
                    "font-size": "14px"
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
            },
            {
                selector: ":selected",
                style: {
                    "border-width": 3,
                    "border-color": "#ff0000"
                }
            }
        ],

        layout: {
            name: "grid",
            rows: 1
        }
    });

    // Enable zooming & panning
    cy.zoomingEnabled(true);
    cy.panningEnabled(true);

    // Node click event
    cy.on("tap", "node", function (evt) {
        var node = evt.target;
        alert("You clicked on node: " + node.id());
    });

    // Edge click event
    cy.on("tap", "edge", function (evt) {
        var edge = evt.target;
        alert("You clicked on an edge from " + edge.data("source") + " to " + edge.data("target"));
    });

    // Add new nodes by clicking on empty space
    cy.on("tap", function (evt) {
        if (evt.target === cy) {
            var newNodeId = "node" + (cy.nodes().length + 1);
            cy.add({
                data: { id: newNodeId, label: newNodeId },
                position: { x: evt.position.x, y: evt.position.y }
            });
        }
    });

    // Dragging nodes
    cy.nodes().forEach(node => {
        node.on("drag", function () {
            console.log("Node " + node.id() + " is being dragged");
        });
    });

    // Right-click to delete a node
    cy.on("cxttap", "node", function (evt) {
        var node = evt.target;
        if (confirm("Delete node " + node.id() + "?")) {
            node.remove();
        }
    });

});
