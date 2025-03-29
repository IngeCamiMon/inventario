document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const inventoryTable = document.getElementById("inventoryBody");

    if (searchInput && inventoryTable) {
        searchInput.addEventListener("input", () => {
            const filter = searchInput.value.trim().toLowerCase();
            const rows = inventoryTable.getElementsByTagName("tr");

            for (let row of rows) {
                const cells = row.getElementsByTagName("td");
                let match = false;

                for (let cell of cells) {
                    if (cell.textContent.toLowerCase().includes(filter)) {
                        match = true;
                        break;
                    }
                }

                row.style.display = match ? "" : "none";
            }
        });
    }
});
