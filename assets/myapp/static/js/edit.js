
window.toggleLabel = function (node) {
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

window.populateData = function (node) {
    const nodeData = node.data();
    // Populate fields in the info panel
    document.getElementById("source-title").textContent = nodeData.label || "N/A";
    document.getElementById("source-author").textContent = nodeData.author || "N/A";
    document.getElementById("source-year-created").textContent = nodeData.year_created;
    document.getElementById("source-year-discovered").textContent = nodeData.year_discovered;
    document.getElementById("source-publisher").textContent = nodeData.publisher || "N/A";
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
        document.getElementById("bib-button-container").style.display = "block"; 

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
        document.getElementById("bib-button-container").style.display = "none"; 
    }

    // Ensure the view panel is visible
    document.getElementById("view-source-info-panel").style.display = "block";
    document.getElementById("edit-source-info-panel").style.display = "none"; 
};







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
    document.getElementById("bib-button-container").style.display = "none"; 
});

document.getElementById("edit-secondary-label").addEventListener("click", function () {
    document.getElementById("edit-cites-container").style.display = "flex"; // Show Cites container
    document.getElementById("bib-button-container").style.display = "block"; 
});




document.getElementById('edit-button').addEventListener('click', function() {
    const node = cy.getElementById(document.getElementById('source-title').innerText);
    const nodeData = node.data();
    // Populate fields in the edit panel
    document.getElementById('edit-source-title').textContent = nodeData.label || "N/A";
    document.getElementById('edit-source-author').value = nodeData.author || "";
    document.getElementById('edit-source-year-created').value = nodeData.year_created || "";
    document.getElementById('edit-source-year-discovered').value = nodeData.year_discovered || "";
    document.getElementById('edit-source-language').value = nodeData.language || "";
    document.getElementById('edit-source-publisher').value = nodeData.publisher || "";
    document.getElementById('edit-source-link').value = nodeData.url || "";
    document.getElementById('edit-source-description').value = nodeData.description || "";
    
    // Set the selected radio button for source type
    if (nodeData.is_primary) {
        document.getElementById('edit-primary').checked = true;
        document.getElementById("edit-cites-container").style.display = "none"; // Hide cites for primary
        document.getElementById("bib-button-container").style.display = "none"; 
        document.getElementById('edit-primary-label').classList.add("selected");
        document.getElementById('edit-secondary-label').classList.remove("selected");
    } else {
        document.getElementById('edit-secondary').checked = true;
        document.getElementById("edit-cites-container").style.display = "flex"; // Show cites for secondary
        document.getElementById("bib-button-container").style.display = "block"; 
        document.getElementById('edit-secondary-label').classList.add("selected");
        document.getElementById('edit-primary-label').classList.remove("selected");
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
            });

            citeDiv.appendChild(removeBtn);
            citesContainer.appendChild(citeDiv);
        });
    } 

    const dropdown = document.getElementById("edit-cites-dropdown");
    populateCitationsDropdown(dropdown, citesContainer, node);
    dropdown.style = 'none;'

    // Show edit panel
    document.getElementById('view-source-info-panel').style.display = 'none';
    document.getElementById('edit-source-info-panel').style.display = 'block';
});

// Function to fetch and store all source nodes 
window.loadAvailableSources = function() {
    availableSources = cy.nodes()
        .filter(node => !node.data('isTimelineNode'))  // Filter out timeline nodes
        .map(node => ({
            id: node.id(),
            title: node.data().label,
            year_created: node.data().year_created
        }));

};

document.addEventListener("DOMContentLoaded", function () {
    let selectedCitations = []; // Stores selected citations for the current node
    
    // Function to populate dropdown for selecting citations
    window.populateCitationsDropdown = function(dropdown, selectedContainer, node) {
        
        dropdown.innerHTML = ""; // Clear existing dropdown items
        const yearCreated = node.data().year_created;
        const existingCitations = new Set(
            cy.edges().filter(edge => edge.data('source') === node.id()).map(edge => edge.data('target'))
        );
        console.log(availableSources);
        availableSources.forEach(source => {
            let testyearCreated =  source.year_created;
            if(testyearCreated < yearCreated && !existingCitations.has(source.id)){
                let option = document.createElement("div");
                option.textContent = source.title;
                option.dataset.id = source.id;
                option.classList.add("citation-option");

                option.addEventListener("click", function () {
                    addCitation(source.id, source.title, selectedContainer);
                    dropdown.style.display = "none"; // Hide dropdown after selection
                });

                dropdown.appendChild(option);  
            }
            
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


    document.getElementById("edit-cites-selector").addEventListener("click", function (event) {
        event.stopPropagation(); // Prevents click from immediately closing the dropdown
    
        const dropdown = document.getElementById("edit-cites-dropdown");
        const selectedContainer = document.getElementById("edit-selected-cites");
    
        if (dropdown.style.display === "block") {
            dropdown.style.display = "none"; // Close if already open
        } else {
            const node = cy.getElementById(document.getElementById('source-title').innerText);
            populateCitationsDropdown(dropdown, selectedContainer, node);
            dropdown.style.display = "block"; // Open dropdown
        }
    });
    
    // Close dropdown when clicking anywhere else
    document.addEventListener("click", function (event) {
        const dropdown = document.getElementById("edit-cites-dropdown");
        const citesButton = document.getElementById("edit-cites-selector");
    
        if (dropdown.style.display === "block" && event.target !== dropdown && event.target !== citesButton) {
            dropdown.style.display = "none"; // Close dropdown
        }
    });
    
    
    document.getElementById('save-button').addEventListener('click', async function () {
        // Collect edited values
        const editedData = {
            title: document.getElementById('edit-source-title').textContent,
            author: document.getElementById('edit-source-author').value,
            year_created: document.getElementById('edit-source-year-created').value,
            ad_created : document.getElementById("edit-source-created-ad").checked,
            year_discovered: document.getElementById('edit-source-year-discovered').value,
            ad_discovered : document.getElementById("edit-source-discovered-ad").checked,
            language: document.getElementById('edit-source-language').value,
            publisher: document.getElementById('edit-source-publisher').value,
            url: document.getElementById('edit-source-link').value,
            description: document.getElementById('edit-source-description').value,
            is_primary: document.getElementById('edit-primary')?.checked || false,
            selectedCites: Array.from(document.getElementById("edit-selected-cites")?.children || [])
                .map(cite => cite.textContent.replace("✖", "").trim())
        };

        if (editedData.year_discovered < editedData.year_created) {
            editedData.year_discovered = editedData.year_created;
        }
        

        try {
            // Send edit request to backend
            const response = await fetch('/edit-source/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editedData)
            });
    
            if (!response.ok) {
                throw new Error('Failed to save changes');
            }
            
            console.log(editedData);
            updateNode(editedData);
            loadAvailableSources();
            
            
    
            // Update the view panel with the new data
            document.getElementById('source-title').innerText = editedData.title;
            document.getElementById('source-author').innerText = editedData.author;
            document.getElementById('source-year-created').innerText = editedData.year_created;
            document.getElementById('source-year-discovered').innerText = editedData.year_discovered;
            document.getElementById('source-publisher').innerText = editedData.publisher;
            document.getElementById('source-language').innerText = editedData.language;
            document.getElementById('source-link').innerHTML = editedData.url ? `<a href="${editedData.url}" target="_blank">${editedData.url}</a>` : "N/A";
            document.getElementById('source-description').innerText = editedData.description;
            
            if (editedData.is_primary) {
                document.getElementById('info-primary').style.display = 'flex';
                document.getElementById('info-secondary').style.display = 'none';
            } else {
                document.getElementById('info-primary').style.display = 'none';
                document.getElementById('info-secondary').style.display = 'flex';
            }
    
            // Hide the edit panel and show the view panel
            document.getElementById('edit-source-info-panel').style.display = 'none';
            document.getElementById('view-source-info-panel').style.display = 'block';
    
            // Close the popup
            document.getElementById('source-info-popup').checked = false;
            document.getElementById('view-source-info-panel').style = 'none';
            document.getElementById('edit-source-info-panel').style = 'none';

    
        } catch (error) {
            console.error("Error saving source:", error);
            alert("An error occurred while saving the source.");
        }
    });

    document.getElementById("delete-button").addEventListener("click", async function() {
        const sourceTitle = document.getElementById("edit-source-title").textContent;
    
        if (!sourceTitle) {
            alert("No source selected for deletion.");
            return;
        }
    
        const confirmDelete = confirm(`Are you sure you want to delete "${sourceTitle}"?`);
        if (!confirmDelete) return;
        document.getElementById('source-info-popup').checked = false;
        document.getElementById('edit-source-info-panel').style.display = 'none';
        document.getElementById('view-source-info-panel').style.display = 'none';
        try {
            const response = await fetch('/delete-source/', {
                method: 'DELETE',  
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: sourceTitle }) 
            });
    
            const data = await response.json();
    
            if (data.success) {
                deleteNode(sourceTitle); 
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error("Error deleting source:", error);
        }
    });

    document.getElementById("bib-button").addEventListener("click", async function() {
        const sourceTitle = document.getElementById("edit-source-title").textContent;
    
        if (!sourceTitle) {
            
            return;
        }
    
        document.getElementById('edit-source-info-panel').style.display = 'none';
        document.getElementById('view-source-info-panel').style.display = 'none';
        document.getElementById('bib-container').style.display = 'block';

        
        
    });
    
    

    // Load sources on page load
    loadAvailableSources();
});
