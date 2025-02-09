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

    // Validate form
    if (!title || !dateCreated || !author || !language) {
        alert('Please fill out all required fields');
        return;
    }

    if(!dateDiscovered){
        dateDiscovered = dateCreated;
    }


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
        tags,
        project_id : projectId
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
        console.log("Response status:", response.status);
        return response.json();
    })
    .then(data => {
        console.log("Response data:", data);
    })
    .catch(error => {
        console.error("Fetch error:", error);
    })

        .then(response => response.json())
        .then(data => {
            // Render the node on the graph
            const cy = cytoscape({
                container: document.getElementById('cy'),
                elements: [
                    {
                        data: {  label: data.title }
                    }
                ],
                style: [
                    {
                        selector: 'node',
                        style: {
                            'background-color': '#007bff',
                            'label': 'data(label)',
                            'width': '30px',
                            'height': '30px'
                        }
                    }
                ],
                layout: { name: 'grid', rows: 2 }
            });
        })
        .catch(error => console.error('Error:', error));
    });