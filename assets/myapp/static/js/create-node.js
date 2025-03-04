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


    
    // Validate form
    if (!title || !dateCreated || !author || !language) {
        alert('Please fill out all required fields');
        return;
    }

    if(!dateDiscovered){
        dateDiscovered = dateCreated;
    }
    
    if(!(citesContainer.style.display = secondaryRadio.checked)){
        selectedCites = [];
    }
    else{
        selectedCites = Array.from(selectedCites)
            .map(nodeId => {
                const node = nodes.find(n => n.data.id === nodeId);
                return node ? node.data.label : null;
            })
            .filter(title => title !== null); // Remove null values
    }
    console.log("Selected cites:", selectedCites);
    
    // Create node object
    const newNode = {
        title,
        author,
        is_primary: sourceType === 'primary',
        date_created: dateCreated,
        date_discovered: dateDiscovered,
        description,
        url,
        language,
        project_id : projectId,
        selected_cites : selectedCites
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
    })
    .catch(error => {
        console.error("Fetch error:", error);
    });
    
});