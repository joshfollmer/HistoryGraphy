
let selectedCites = new Set(); // Store selected nodes


document.addEventListener("DOMContentLoaded", function () {
    const labels = document.querySelectorAll(".node-attribute label");
    const radios = document.querySelectorAll("input[name='source_type']");
    const secondaryRadio = document.getElementById("secondary");
    const primaryRadio = document.getElementById("primary");
    const citesContainer = document.getElementById("cites-container");
    const citesSelector = document.getElementById("cites-selector");
    const selectedCitesContainer = document.getElementById("selected-cites");
    const citesDropdown = document.getElementById("cites-dropdown");



   

    function handleLabelClick(event) {
        labels.forEach(label => label.classList.remove("selected"));
        event.currentTarget.classList.add("selected");
        document.getElementById(event.currentTarget.getAttribute("for")).checked = true;
        toggleCitesField();
    }

    function toggleCitesField() {
        citesContainer.style.display = secondaryRadio.checked ? "flex" : "none";
    }

    function toggleCitesDropdown() {
        if (citesDropdown.innerHTML.trim() === "") {
            populateCitesDropdown();
        }
        citesDropdown.style.display = citesDropdown.style.display === "block" ? "none" : "block";
    }

    function selectNode(node) {
        if (!selectedCites.has(node.data.id)) {
            selectedCites.add(node.data.id);
            updateSelectedCites();
        }
    }

    function removeNode(nodeId) {
        selectedCites.delete(nodeId);
        updateSelectedCites();
    }

    function updateSelectedCites() {
        selectedCitesContainer.innerHTML = "";
        selectedCites.forEach(nodeId => {
            const node = nodes.find(n => n.data.id === nodeId);
            if (!node) return;

            const tag = document.createElement("span");
            tag.classList.add("cite-tag");
            tag.textContent = node.data.label;

            const removeBtn = document.createElement("button");
            removeBtn.textContent = "✖";
            removeBtn.onclick = () => removeNode(nodeId);

            tag.appendChild(removeBtn);
            selectedCitesContainer.appendChild(tag);
        });
    }

    function populateCitesDropdown() {
        citesDropdown.innerHTML = "";
        nodes.forEach(node => {
            if (!selectedCites.has(node.data.id)) {
                const option = document.createElement("div");
                option.classList.add("cite-option");
                option.textContent = node.data.label;
                option.onclick = () => {
                    selectNode(node);
                    citesDropdown.style.display = "none";
                };
                citesDropdown.appendChild(option);
            }
        });
    }

    // Add event listeners
    labels.forEach(label => label.addEventListener("click", handleLabelClick));
    radios.forEach(radio => {
        if (radio.checked) {
            document.querySelector(`label[for="${radio.id}"]`).classList.add("selected");
        }
    });

    toggleCitesField();
    secondaryRadio.addEventListener("change", toggleCitesField);
    primaryRadio.addEventListener("change", toggleCitesField);
    citesSelector.addEventListener("click", toggleCitesDropdown);
});