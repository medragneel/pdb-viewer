let element = document.querySelector('#container-01');
let config = {};
let viewer = $3Dmol.createViewer(element, config)
const proteinId_input = document.querySelector('.f-molecule')
const pdb_file = document.querySelector('.pdb-file')
const fetch_btn = document.querySelector('.fetch-btn')
const zoom_range_input = document.querySelector("#zoom")

function showErrorAlert(message) {
    const alertContainer = document.createElement('div');
    alertContainer.className = 'alert alert-danger';
    alertContainer.innerHTML = `
        <span class="close-btn" onclick="this.parentElement.style.display='none';">&times;</span>
        <strong>Error!</strong> ${message}
    `;
    document.body.appendChild(alertContainer);
}


let previousZoomValue = 1.0;

function renderPDBData(viewer, data) {
    viewer.clear()

    viewer.addModel(data, "pdb");
    viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
    // viewer.setStyle({stick:{colorscheme:"Jmol"}});
    viewer.zoomTo();
    zoom_range_input.addEventListener("input", () => {
        // console.log(zoom_range_input.value)
        // viewer.zoom(parseFloat(zoom_range_input.value))
        const zoomValue = parseFloat(document.getElementById('zoom').value);

        // Determine whether to zoom in or out based on the current and previous values
        const zoomFactor = (zoomValue > previousZoomValue) ? 1.1 : 0.9;

        // Update the viewer's zoom level
        viewer.zoom(zoomFactor);

        // Update the previous zoom value for the next comparison
        previousZoomValue = zoomValue;
    })
    viewer.render();
}

function handlePDBError(pdbUri, err) {
    console.error("Failed to load PDB " + pdbUri + ": " + err);
    showErrorAlert("Failed to load PDB " + pdbUri + ": " + err);
}

function handleInput(e) {
    const pdbUri = e.target.files ? e.target.files[0].name : e.pdbUri;

    jQuery.ajax(pdbUri, {
        success: function(data) {
            renderPDBData(viewer, data);
        },
        error: function(hdr, status, err) {
            handlePDBError(pdbUri, err);
        },
    });
}

pdb_file.addEventListener('change', handleInput);

fetch_btn.addEventListener('click', (e) => {
    e.preventDefault()
    const apiUrl = `https://alphafold.ebi.ac.uk/api/prediction/${proteinId_input.value}`;

    pdb_file.value = ''

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return response.json();
        })
        .then(d => {
            return fetch(d[0].pdbUrl);
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return response.text(); // Assuming PDB data is text
        })
        .then(data => {
            renderPDBData(viewer, data);
        })
        .catch(error => {
            console.error('Fetch error:', error);
            showErrorAlert("Fetch error: " + error);
        });
});

