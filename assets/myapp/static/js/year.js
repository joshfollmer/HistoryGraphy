document.addEventListener('DOMContentLoaded', function () {
    const yearInput = document.getElementById('year-created');
    const yearOptions = document.getElementById('year-options');
    
    // Get the current year
    const currentYear = new Date().getFullYear();

    // Populate the datalist with years (e.g., from current year down to 0)
    for (let i = currentYear; i >= 0; i--) {
        let option = document.createElement('option');
        option.value = i;
        yearOptions.appendChild(option);
    }

    // Handle input changes to keep the input value valid
    yearInput.addEventListener('input', function () {
        const value = this.value;
        if (!/^\d{1,4}$/.test(value)) {
            // Optionally, you can add custom validation here
            // for instance, to make sure it's a 4-digit year
            this.setCustomValidity("Please enter a valid year");
        } else {
            this.setCustomValidity("");
        }
    });
});

