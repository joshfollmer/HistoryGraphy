document.getElementById('create-node-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const title = document.getElementById('node-name').value;
    const sourceType = document.querySelector('input[name="source_type"]:checked') ? document.querySelector('input[name="source_type"]:checked').value : null;
    const author = document.getElementById('author').value;
    const yearCreated = document.getElementById('year-created').value;
    let yearDiscovered = document.getElementById('year-discovered').value;
    const language = document.getElementById('language').value;
    const url = document.getElementById('link').value;
    const description = document.getElementById('description').value;

    const citesContainer = document.getElementById("cites-container");
    const secondaryRadio = document.getElementById("secondary");

    // Capture AD/BC selection
    const adCreated = document.getElementById('created-ad').checked; // true if AD, false if BC
    const adDiscovered = document.getElementById('discovered-ad').checked; // true if AD, false if BC

    // Validate form
    if (!title || !yearCreated) {
        alert('Please fill out all required fields');
        return;
    }

    if (!yearDiscovered) {
        yearDiscovered = yearCreated;
    }
    
    let nodeCites = [];

    if (secondaryRadio.checked && citesContainer.style.display !== 'none') {
        nodeCites = Array.from(selectedCites)
            .map(nodeId => {
                const node = nodes.find(n => n.data.id === nodeId);
                return node ? node.data.label : null;
            })
            .filter(label => label !== null); // Filter out any invalid ones
    }
    
    // Create node object with new attributes
    const newNode = {
        title,
        author,
        is_primary: sourceType === 'primary',
        year_created: yearCreated,
        ad_created: adCreated, // true if AD, false if BC
        year_discovered: yearDiscovered,
        ad_discovered: adDiscovered, // true if AD, false if BC
        description,
        url,
        language,
        project_id: projectId,
        selected_cites: nodeCites
    };


    // Send data to Django server
    fetch('/create-node/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}'
        },
        body: JSON.stringify(newNode)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();  
    })
    .then(data => {
        console.log("Response data:", data);
        window.location.reload();
        loadAvailableSources();
    })
    .catch(error => {
        console.error("Fetch error:", error);
    });
});
