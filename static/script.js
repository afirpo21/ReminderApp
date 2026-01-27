// Handles word counting for both Create and Edit forms
function checkWordCount(inputId, displayId, btnId) {
    const noteInput = document.getElementById(inputId);
    const display = document.getElementById(displayId);
    const btn = document.getElementById(btnId);
    
    if (!noteInput || !display || !btn) return;

    const text = noteInput.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    display.innerText = words + " / 1500 words";

    if (words > 1500) {
        display.style.color = "red";
        btn.disabled = true;
        btn.style.opacity = "0.5";
    } else {
        display.style.color = "#666";
        btn.disabled = false;
        btn.style.opacity = "1";
    }
}

// Opens the modal and populates it with existing data
function openEditModal(id, title, date, channel, note, target, frequency) {
    console.log("Opening modal for ID:", id); // Debugging line
    
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-title').value = title;
    document.getElementById('edit-date').value = date;
    document.getElementById('edit-channel').value = channel;
    // populate the modal textarea (template uses id 'editNoteInput')
    const editNoteElem = document.getElementById('editNoteInput');
    if (editNoteElem) editNoteElem.value = note;
    document.getElementById('edit-target').value = target;
    // Set frequency dropdown
    const freqElem = document.getElementById('edit-frequency');
    if (freqElem) freqElem.value = frequency || 'Standard';
    // Set the dynamic delete URL
    document.getElementById('deleteForm').action = "/delete_reminder/" + id;
    
    // Show the modal
    document.getElementById('editModal').style.display = 'block';
    
    // give keyboard focus to the title for easier editing
    const titleElem = document.getElementById('edit-title');
    if (titleElem) titleElem.focus();
    
    // Initial word count check for the loaded note
    checkWordCount('editNoteInput', 'editWordCountDisplay', 'editSubmitBtn');
}

// Closes the modal
function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Close if user clicks background
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target == modal) {
        closeModal();
    }
}

// --- SEARCH BAR FUNCTIONALITY ---
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = searchInput.value.toLowerCase();
            const cards = document.querySelectorAll('.reminder-card');
            cards.forEach(card => {
                const title = card.querySelector('h4')?.innerText.toLowerCase() || '';
                const note = card.querySelector('p')?.innerText.toLowerCase() || '';
                // Show if title or note contains the query, or if query is empty
                if (!query || title.includes(query) || note.includes(query)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
});