document.addEventListener("DOMContentLoaded", function () {
    document.getElementById('bib-submit').addEventListener('click', async function() {
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
    
        try {
            const response = await fetch('/parse-bib/', {
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message }) 
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            console.log("Bibliography submitted successfully!");
            console.log("Parsed Bibliography Response:", result.response);
        } catch (error) {
            console.error("Error parsing bibliography:", error);
        }
    });
    

   
    document.getElementById('bib-cancel').addEventListener('click', function() {
        document.getElementById('edit-source-info-panel').style.display = 'block';
        document.getElementById('bib-container').style.display = 'none';
    });
    

});