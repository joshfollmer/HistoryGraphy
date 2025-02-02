document.addEventListener("DOMContentLoaded", function() {
    // Add event listener to cancel button
    document.getElementById('cancel-button').addEventListener('click', function() {
        document.getElementById('create-project').checked = false; // Uncheck the checkbox to close the popup
    });
});
