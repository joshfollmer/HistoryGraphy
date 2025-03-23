document.getElementById('create-node-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const title = document.getElementById('node-name').value;
    const sourceType = document.querySelector('input[name="source_type"]:checked') ? document.querySelector('input[name="source_type"]:checked').value : null;
    const author = document.getElementById('author').value;
    const dateCreated = document.getElementById('date-created').value;
    let dateDiscovered = document.getElementById('date-discovered').value;
    const language = document.getElementById('language').value;
    const url = document.getElementById('link').value;
    const description = document.getElementById('description').value;

    const citesContainer = document.getElementById("cites-container");
    const secondaryRadio = document.getElementById("secondary");

    // Capture AD/BC selection
    const adCreated = document.getElementById('created-ad').checked; // true if AD, false if BC
    const adDiscovered = document.getElementById('discovered-ad').checked; // true if AD, false if BC

    // Validate form
    if (!title || !dateCreated) {
        alert('Please fill out all required fields');
        return;
    }

    if (!dateDiscovered) {
        dateDiscovered = dateCreated;
    }

    let selectedCites = [];
    if (!(citesContainer.style.display = secondaryRadio.checked)) {
        selectedCites = [];
    } else {
        selectedCites = Array.from(selectedCites)
            .map(nodeId => {
                const node = nodes.find(n => n.data.id === nodeId);
                return node ? node.data.label : null;
            })
            .filter(title => title !== null); // Remove null values
    }
    console.log("Selected cites:", selectedCites);

    // Create node object with new attributes
    const newNode = {
        title,
        author,
        is_primary: sourceType === 'primary',
        date_created: dateCreated,
        ad_created: adCreated, // true if AD, false if BC
        date_discovered: dateDiscovered,
        ad_discovered: adDiscovered, // true if AD, false if BC
        description,
        url,
        language,
        project_id: projectId,
        selected_cites: selectedCites
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
        add_node(data);
        loadAvailableSources();
    })
    .catch(error => {
        console.error("Fetch error:", error);
    });
});
