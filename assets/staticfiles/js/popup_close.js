document.addEventListener("DOMContentLoaded", function() {
    // Add event listener to cancel button
    document.getElementById('cancel-button').addEventListener('click', function() {
        document.getElementById('popup').checked = false; 
    });

   
    document.getElementById('create-button').addEventListener('click', function() {
        document.getElementById('popup').checked = false; 
    });

   
});
