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


function parseCitations(data, sourceId) {
    // allow either raw array or { citations: [...] } wrapper
    const citations = Array.isArray(data) ? data : data.citations || [];
  
    citations.forEach((cit, idx) => {
      // 1. parse the year
      const rawYear = parseInt(cit.year_created, 10) || 0;
      const year = cit.ad_created ? rawYear : -rawYear;
  
      // 2. compute positions
      const yPosition = (year - minYear) * scaleFactor;
      if (!yearPositions[year]) yearPositions[year] = { count: 0 };
      const xOffset = rng() * randomXRange + yearPositions[year].count * xSpacing;
      yearPositions[year].count += 1;
      const xPosition = 100 + xOffset;
  
      // 3. make a unique node ID
      const newNodeId = `new-${Date.now()}-${idx}`;
  
      // 4. add the citation node
      cy.add({
        group: 'nodes',
        data: {
          id: newNodeId,
          label: cit.title,
          author: cit.author,
          publisher: cit.Publisher,
          year_discovered: rawYear,
          ad_discovered: cit.ad_created,
          is_primary: cit.is_primary,
          language: cit.language
        },
        position: { x: xPosition, y: yPosition }
      }).lock();
  
      // 5. add an edge from the source node → this new citation
      cy.add({
        group: 'edges',
        data: {
          source: sourceId,
          target: newNodeId
        }
      });
    });
  
    // 6. (optional) re‐run your preset layout if you need edges to “take”
    // cy.layout({ name: 'preset' }).run();
  }




function add_node(data) {
  if (!data || !data.title || typeof data.year_discovered === 'undefined') {
    console.error("Invalid node data:", data);
    return;
  }

  // Year (negate if BC)
  const year = data.ad_discovered ? +data.year_discovered : -data.year_discovered;

  // Positions
  const y = (year - minYear) * scaleFactor;
  if (!yearPositions[year]) yearPositions[year] = { count: 0 };
  const x = 100 + (rng() * randomXRange + yearPositions[year].count * xSpacing);
  yearPositions[year].count += 1;

  // ID (use server-generated if present, else a timestamp)
  const id = data.id != null ? data.id.toString() : `new-${Date.now()}`;

  // Add node
  cy.add({
    group: "nodes",
    data: {
      id,
      label: data.title,
      ...data  // spreads in author, publisher, is_primary, etc.
    },
    position: { x, y }
  }).lock();

  // Add edges from each cited source
  (data.selected_cites || []).forEach(srcId =>
    cy.add({
      group: "edges",
      data: { source: srcId.toString(), target: id }
    })
  );
}



function edit_node(data, nodeId) {
    const node = cy.getElementById(nodeId);
    if (!node.length) {
      console.error("Node not found:", nodeId);
      return;
    }
  
    // Recompute year (negative if BC)
    const rawYear = +data.year_discovered;
    const newYear = data.ad_discovered ? rawYear : -rawYear;
  
    // New position
    const yPos = (newYear - minYear) * scaleFactor;
    const xPos = node.position('x'); // keep the old x
  
    // Gather new outgoing edges data
    const newEdgeDatas = (data.selected_cites || []).map(targetId => ({
      group: 'edges',
      data: {
        id: `edge-${nodeId}-${targetId}`,
        source: nodeId,
        target: targetId.toString()
      }
    }));
  
    // Do all mutations in one batch to avoid firing save events on every little change
    cy.batch(() => {
      // 1) Update node’s data and position
      node.data({
        ...node.data(), // preserve any fields you’re not overwriting
        title: data.title,
        author: data.author,
        publisher: data.publisher,
        year_discovered: rawYear,
        ad_discovered: data.ad_discovered,
        language: data.language,
        url: data.url,
        description: data.description,
        is_primary: data.is_primary || false,
        selected_cites: data.selected_cites || []
      });
      node.position({ x: xPos, y: yPos });
  
      // 2) Remove all its old outgoing edges
      cy.remove(node.outgoers('edge'));
  
      // 3) Add back the new ones
      cy.add(newEdgeDatas);
    });
  
    // Lock it (just in case) and re‐layout
    node.lock();
    cy.layout({ name: 'preset' }).run();
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




