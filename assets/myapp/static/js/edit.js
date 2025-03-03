
window.toggleLabel = function () {
    const primaryLabel = document.getElementById('info-primary');
    const secondaryLabel = document.getElementById('info-secondary');

    primaryLabel.style.display = 'none';
    secondaryLabel.style.display = 'none';

    if (node.data().is_primary) {
        primaryLabel.style.display = 'flex'; 
    } else {
        secondaryLabel.style.display = 'flex'; 
    }
}

window.populateData = function () {
    const nodeData = node.data();

    // Populate fields in the info panel
    document.getElementById("source-title").textContent = nodeData.label || "N/A";
    document.getElementById("source-author").textContent = nodeData.author || "N/A";
    document.getElementById("source-date-created").textContent = nodeData.date_created || "N/A";
    document.getElementById("source-date-discovered").textContent = nodeData.date_discovered || "N/A";
    document.getElementById("source-language").textContent = nodeData.language || "N/A";

    const linkContainer = document.getElementById("source-link");
    if (nodeData.url) {
        linkContainer.innerHTML = `<a href="${nodeData.url}" target="_blank">${nodeData.url}</a>`;
    } else {
        linkContainer.textContent = "N/A";
    }

    document.getElementById("source-description").textContent = nodeData.description || "N/A";

    // Show/hide citations field based on source types
    if (!nodeData.is_primary) {
        document.getElementById("info-cites-container").style.display = "flex";

        // Get cited nodes
        let citedNodes = node.outgoers("edge").targets();
        const citesContainer = document.getElementById("info-selected-cites");
        citesContainer.innerHTML = ""; // Clear previous cites

        if (citedNodes.length > 0) {
            citedNodes.forEach(citedNode => {
                let citedData = citedNode.data();
                let citeDiv = document.createElement("div");
                citeDiv.textContent = citedData.label || "Unnamed Source";
                citeDiv.dataset.id = citedData.id;
                citeDiv.classList.add("cite-tag");
                citesContainer.appendChild(citeDiv);
            });
        } 
    } else {
        document.getElementById("info-cites-container").style.display = "none";
    }

    // Ensure the view panel is visible
    document.getElementById("view-source-info-panel").style.display = "block";
    document.getElementById("edit-source-info-panel").style.display = "none"; 
};




document.getElementById('save-button').addEventListener('click', function() {
    // Get the edited values
    const title = document.getElementById('edit-source-title').value;
    const author = document.getElementById('edit-source-author').value;
    const dateCreated = document.getElementById('edit-source-date-created').value;
    const dateDiscovered = document.getElementById('edit-source-date-discovered').value;
    const language = document.getElementById('edit-source-language').value;
    const link = document.getElementById('edit-source-link').value;
    const description = document.getElementById('edit-source-description').value;
    const sourceType = document.querySelector('input[name="edit-source-type"]:checked').value;

    // Update the view panel with the edited values
    document.getElementById('source-title').innerText = title;
    document.getElementById('source-author').innerText = author;
    document.getElementById('source-date-created').innerText = dateCreated;
    document.getElementById('source-date-discovered').innerText = dateDiscovered;
    document.getElementById('source-language').innerText = language;
    document.getElementById('source-link').innerText = link;
    document.getElementById('source-description').innerText = description;
    document.getElementById('source-type-info').innerText = sourceType.charAt(0).toUpperCase() + sourceType.slice(1);

    // Hide the edit panel and show the view panel
    document.getElementById('edit-source-info-panel').style.display = 'none';
    document.getElementById('view-source-info-panel').style.display = 'block';
});

document.getElementById('cancel-edit-button').addEventListener('click', function() {
    // Hide the edit panel and show the view panel without saving
    document.getElementById('edit-source-info-panel').style.display = 'none';
    document.getElementById('view-source-info-panel').style.display = 'block';
});

document.getElementById('close-button').addEventListener('click', function() {
    // Close the popup and hide both panels
    document.getElementById('source-info-popup').checked = false;
    document.getElementById('view-source-info-panel').style.display = 'none';
    document.getElementById('edit-source-info-panel').style.display = 'none'; // Ensure edit panel is hidden too
});

document.getElementById('close-edit-button').addEventListener('click', function() {
    // Close the popup and hide both panels
    document.getElementById('source-info-popup').checked = false;
    document.getElementById('view-source-info-panel').style.display = 'none';
    document.getElementById('edit-source-info-panel').style.display = 'none'; // Ensure edit panel is hidden too
});


// Add event listeners to the labels, not the radio buttons
document.getElementById("edit-primary-label").addEventListener("click", function () {
    document.getElementById("edit-cites-container").style.display = "none"; // Hide Cites container
});

document.getElementById("edit-secondary-label").addEventListener("click", function () {
    document.getElementById("edit-cites-container").style.display = "flex"; // Show Cites container
});




document.getElementById('edit-button').addEventListener('click', function() {
    const nodeData = cy.getElementById(document.getElementById('source-title').innerText).data();

    // Populate fields in the edit panel
    document.getElementById('edit-source-title').value = nodeData.label || "";
    document.getElementById('edit-source-author').value = nodeData.author || "";
    document.getElementById('edit-source-date-created').value = nodeData.date_created || "";
    document.getElementById('edit-source-date-discovered').value = nodeData.date_discovered || "";
    document.getElementById('edit-source-language').value = nodeData.language || "";
    document.getElementById('edit-source-link').value = nodeData.url || "";
    document.getElementById('edit-source-description').value = nodeData.description || "";

    // Set the selected radio button for source type
    if (nodeData.is_primary) {
        document.getElementById('edit-primary').checked = true;
        document.getElementById("edit-cites-container").style.display = "none"; // Hide cites for primary
    } else {
        document.getElementById('edit-secondary').checked = true;
        document.getElementById("edit-cites-container").style.display = "flex"; // Show cites for secondary
    }

    
    const citesContainer = document.getElementById("edit-selected-cites");
    citesContainer.innerHTML = ""; // Clear any existing citations

    // Get cited nodes 
    let citedNodes = cy.getElementById(nodeData.id).outgoers("edge").targets();

    if (citedNodes.length > 0) {
        citedNodes.forEach(citedNode => {
            let citedData = citedNode.data();
            let citeDiv = document.createElement("div");
            citeDiv.textContent = citedData.label || "Unnamed Source";
            citeDiv.dataset.id = citedData.id;
            citeDiv.classList.add("cite-tag");

            // Add remove button for each citation
            let removeBtn = document.createElement("button");
            removeBtn.textContent = "✖";
            removeBtn.classList.add("remove-cite");
            removeBtn.addEventListener("click", function () {
                citeDiv.remove();
                
                let node = cy.getElementById(nodeData.id);
                node.removeEdgeTo(citedNode); 
            });

            citeDiv.appendChild(removeBtn);
            citesContainer.appendChild(citeDiv);
        });
    } 

    // Show edit panel
    document.getElementById('view-source-info-panel').style.display = 'none';
    document.getElementById('edit-source-info-panel').style.display = 'block';
});



document.addEventListener("DOMContentLoaded", function () {
    let availableSources = []; // Will hold all available sources
    let selectedCitations = []; // Stores selected citations for the current node

    // Function to fetch and store all source nodes 
    function loadAvailableSources() {
        availableSources = cy.nodes().map(node => ({
            id: node.id(),
            title: node.data().label 
        }));
    }

    // Function to populate dropdown for selecting citations
    function populateCitationsDropdown(dropdown, selector, selectedContainer) {
        dropdown.innerHTML = ""; // Clear existing dropdown items

        availableSources.forEach(source => {
            let option = document.createElement("div");
            option.textContent = source.title;
            option.dataset.id = source.id;
            option.classList.add("citation-option");

            option.addEventListener("click", function () {
                addCitation(source.id, source.title, selectedContainer);
                dropdown.style.display = "none"; // Hide dropdown after selection
            });

            dropdown.appendChild(option);
        });

        // Show the dropdown
        dropdown.style.display = "block";
    }

    // Function to add selected citation
    function addCitation(id, title, selectedContainer) {
        if (selectedCitations.some(cite => cite.id === id)) return; // Prevent duplicates

        let citeDiv = document.createElement("div");
        citeDiv.textContent = title;
        citeDiv.dataset.id = id;
        citeDiv.classList.add("cite-tag");

        let removeBtn = document.createElement("button");
        removeBtn.textContent = "✖";
        removeBtn.classList.add("remove-cite");
        removeBtn.addEventListener("click", function () {
            citeDiv.remove();
            selectedCitations = selectedCitations.filter(cite => cite.id !== id);
        });

        citeDiv.appendChild(removeBtn);
        selectedContainer.appendChild(citeDiv);

        selectedCitations.push({ id, title });
    }


    document.getElementById("edit-cites-selector").addEventListener("click", function () {
        populateCitationsDropdown(
            document.getElementById("edit-cites-dropdown"),
            this,
            document.getElementById("edit-selected-cites")
        );
    });

    // Function to update the displayed citations when a node is loaded
    function updateCitationsDisplay(node) {
        selectedCitations = node.data().cites || [];
        let displayContainer = document.getElementById("info-selected-cites");
        let editContainer = document.getElementById("edit-selected-cites");
        
        displayContainer.innerHTML = "";
        editContainer.innerHTML = "";

        selectedCitations.forEach(cite => {
            addCitation(cite.id, cite.title, displayContainer);
            addCitation(cite.id, cite.title, editContainer);
        });
    }

    

    
    document.getElementById("save-button").addEventListener("click", function () {
        let node = cy.getElementById(document.getElementById("edit-source-title").value);
        node.data().cites = selectedCitations;
    });

    // Load sources on page load
    loadAvailableSources();
});
