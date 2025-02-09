document.addEventListener("DOMContentLoaded", function () {
    fetch(`/get_nodes/${projectId}/`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    
    .then(response => response.json())
    .then(data => {
        console.log("Fetched data:", data);  // Log the response data
        console.log("Nodes:", data.nodes);  // Log the nodes to verify
    
        var cy = cytoscape({
            container: document.getElementById("cy"),
            elements: data.nodes,  // Directly use the nodes from the fetched data
    
            style: [
                {
                    selector: "node",
                    style: {
                        "background-color": "#007bff",
                        "label": "data(label)",  // Use the label for displaying text on nodes
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
                }
            ],
    
            layout: { name: "grid", rows: 1 }
        });
    })
    .catch(error => console.error("Error fetching graph data:", error));
});
