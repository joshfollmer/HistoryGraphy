document.addEventListener("DOMContentLoaded", function () {
    document.getElementById('bib-submit').addEventListener('click', async function() {
        const node = cy.getElementById(document.getElementById('source-title').innerText);

        const nodeData = node.data();  // Retrieve node data
        const sourceTitle = nodeData.label|| "Unknown Title";
        const sourceAuthor = nodeData.author || "Unknown Author";
        const sourceYear = nodeData.date_created || "Unknown Year";
        // Get the text from the input box
        const bibliographyText = document.querySelector('.textbox').value.trim();
        if (!bibliographyText) {
            alert("Please enter bibliography text before submitting.");
            return;
        }
    
        // Construct the message
        const message = `Current source info: Title: ${sourceTitle}, Author: ${sourceAuthor}, Date created: ${sourceYear}. Bibliography: ${bibliographyText}`;
        console.log(currentUser);
        try {
            document.getElementById('bib-overlay').style.display = 'flex';
            const response = await fetch('/parse-bib/', {
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: message, 
                    projectId: projectId, 
                    currentSource: sourceTitle, 
                    username: currentUser 
                }) 
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const jsonResponse = await response.json();

            if (jsonResponse.success && jsonResponse.response) {
                const sourceId = node.id();
                parseCitations(jsonResponse.response, sourceId);
            } else {
                console.error("Server returned success=False or missing response data.");
            }
            document.getElementById('bib-overlay').style.display = 'none';
            document.getElementById('bib-container').style.display = 'none';
            document.getElementById('source-info-popup').checked = false;


            //window.location.reload();
        } catch (error) {
            console.error("Error parsing bibliography:", error);
            //window.location.reload();
        }
    });
    

   
    document.getElementById('bib-cancel').addEventListener('click', function() {
        document.getElementById('edit-source-info-panel').style.display = 'block';
        document.getElementById('bib-container').style.display = 'none';
        
    });
    

});