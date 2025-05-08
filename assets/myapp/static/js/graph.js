// These are declared globally so they can be used in the add_node function

let scaleFactor = 15;
let randomXRange = 500;  
let cy;
let yearPositions = {};
let xSpacing = 700;  


let earliestYear = Math.min(...nodes.map(node => {
    let year = node.data.year_discovered;
    return node.data.ad_discovered === false ? -year : year; // Convert BC years to negative
}));






let minYear = earliestYear; 

let maxYear = Math.max(...nodes.map(node => node.data.year_discovered));

const targetHeight = document.getElementById('cy').clientHeight * 2;
let yearRange = maxYear - minYear;

if (yearRange <= 0) {
    scaleFactor = 100; // fallback to a default scale if all nodes are from the same year
} else {
    scaleFactor = targetHeight / yearRange;
}


function truncateLabel(text, maxLength = 40) {
    return text.length > maxLength ? text.substring(0, maxLength) + "…" : text;
}

let node;
const rng = new Math.seedrandom(projectId); 



function resetGraph(newNodes = [], newEdges = []) {
    // 1. destroy old instance if it exists
    if (cy) {
      cy.destroy();
      cy = null;
    }
  
    // 2. replace your globals
    nodes = newNodes;
    edges = newEdges;
    
    // 3. clear your layout helpers
    yearPositions = {};
  
    // 4. recompute minYear, maxYear, scaleFactor, etc.
    const years = nodes.map(n => {
      let y = n.data.year_discovered;
      return n.data.ad_discovered === false ? -y : y;
    });
    earliestYear = Math.min(...years);
    minYear      = earliestYear;
    maxYear      = Math.max(...nodes.map(n => n.data.year_discovered));
    yearRange    = maxYear - minYear;
    scaleFactor  = yearRange <= 0
      ? 100
      : (document.getElementById('cy').clientHeight * 2) / yearRange;
  
    // 5. re-assign positions on all nodes
    nodes.forEach(n => {
      let y = n.data.year_discovered;
      if (n.data.ad_discovered === false) { y = -y; }
      let yPos = (y - minYear) * scaleFactor;
      if (!yearPositions[y]) { yearPositions[y] = { count: 0 }; }
      const xOff = rng() * randomXRange + yearPositions[y].count * xSpacing;
      n.position = { x: 100 + xOff, y: yPos };
      yearPositions[y].count++;
    });
  
    // 6. re-init Cytoscape
    init_cy();
  }
  


  function parseCitations(data, sourceId) {
    const citations = Array.isArray(data) ? data : data.citations || [];
    const newNodes = [];
    const newEdges = [];
  
    citations.forEach((cit, idx) => {
      const year = parseInt(cit.year_created, 10) || 0;
      const yPos = (year - minYear) * scaleFactor;
      if (!yearPositions[year]) yearPositions[year] = { count: 0 };
      const xOff = rng() * randomXRange + yearPositions[year].count * xSpacing;
      yearPositions[year].count++;
      const xPos = 100 + xOff;
  
      const id = cit.title;
      // build the node object
      newNodes.push({
        group: 'nodes',
        data: {
          id,
          label: cit.title,
          author: cit.author,
          publisher: cit.Publisher,
          year_discovered: year,
          ad_discovered: cit.ad_created,
          is_primary: cit.is_primary,
          language: cit.language
        },
        position: { x: xPos, y: yPos }
      });
  
      // build the edge object
      newEdges.push({
        group: 'edges',
        data: { source: sourceId, target: id }
      });
    });
  
    // merge into globals
    nodes = nodes.concat(newNodes);
    edges = edges.concat(newEdges);
  
    // now fully rebuild the graph
    resetGraph(nodes, edges);
  }
  


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
                    "label": function (node) {
                        let label = node.data('label');
                        return truncateLabel(label, 40);  // Truncate label at display time
                    },

                    "color": "#000",  
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
        // Dynamically adjust timeline interval based on scaleFactor
        let timelineInterval;
    
        if (scaleFactor >= 100) {
            timelineInterval = 1; 
        }    // Extremely detailed
        else if (scaleFactor >= 80) {
            timelineInterval = 5;     // Very detailed
        } else if (scaleFactor >= 40) {
            timelineInterval = 10;    // Default
        } else if (scaleFactor >= 20) {
            timelineInterval = 20;    // Compressed
        } else {
            timelineInterval = 50;    // Very compressed
        }
    
        // Round startYear up to nearest interval
        let startYear = minYear % timelineInterval === 0
            ? minYear
            : Math.ceil(minYear / timelineInterval) * timelineInterval;
        startYear -= timelineInterval;  // Add buffer at top
    
        // Add timeline nodes within the visible year range
        for (let year = startYear; year <= maxYear; year += timelineInterval) {
            let displayYear = year < 0 ? `${Math.abs(year)} BC` : `${year} AD`;
    
            let nodeId = `node-${year}`;
            let rightNodeId = `node-right-${year}`;
            let yPos = (year - minYear) * scaleFactor;
    
            // Add timeline nodes if they don't exist yet
            if (!cy.getElementById(nodeId).length) {
                cy.add([
                    {
                        group: 'nodes',
                        data: { id: nodeId, label: displayYear, isTimelineNode: true },
                        position: { x: -100, y: yPos }
                    },
                    {
                        group: 'nodes',
                        data: { id: rightNodeId, label: displayYear, isTimelineNode: true },
                        position: { x: 5000, y: yPos }
                    },
                    {
                        group: 'edges',
                        data: { source: nodeId, target: rightNodeId }
                    }
                ]);
    
                if (year > startYear) {
                    let prevYear = year - timelineInterval;
                    let prevNodeId = `node-${prevYear}`;
    
                    cy.add({
                        group: 'edges',
                        data: { source: prevNodeId, target: nodeId }
                    });
                }
            }
        }
    }
    
    // 2) Lock every node so it can’t be dragged
    cy.nodes().forEach(n => n.lock());

    // 3) Attach your click handler
    cy.on('tap', 'node', evt => {
        const tapped = evt.target;
        populateData(tapped);
        toggleLabel(tapped);
        document.getElementById('source-info-popup').checked = true;
        document.getElementById('view-source-info-panel').style.display = 'block';
      });

    // 4) Finally add the timeline nodes & edges
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




