// ============================================
// GLOBAL STATE
// ============================================
let currentWeekOffset = 0;      // For 3-week calendar navigation
let currentMonthOffset = 0;     // For 5-week calendar navigation
let tooltipElement = null;      // Shared tooltip element


// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Checks if a task is in the past (more than 1 hour ago)
 */
function isPastTask(scheduledDate) {
    const now = new Date();
    const scheduled = new Date(scheduledDate);
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
    return scheduled < oneHourAgo;
}

/**
 * Handles word counting for textareas with word limit
 */
function checkWordCount(inputId, displayId, btnId) {
    const noteInput = document.getElementById(inputId);
    const display = document.getElementById(displayId);
    const btn = document.getElementById(btnId);
    
    if (!noteInput || !display || !btn) return;

    const text = noteInput.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    display.innerText = `${words} / 1500 words`;

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


// ============================================
// TAB MANAGEMENT
// ============================================

/**
 * Switches between different dashboard tabs
 */
function switchTab(event, tabName) {
    event.preventDefault();
    console.log('Switching to tab:', tabName);
    
    // Hide alert box when switching tabs
    const alertBox = document.querySelector('.alert-box');
    if (alertBox) {
        alertBox.style.display = 'none';
    }
    
    // Hide all tab contents and remove active class from nav links
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    
    // Show selected tab and activate nav link
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
    
    // Manage calendar visibility
    const leftPanel = document.querySelector('.left-panel');
    const rightPanel = document.querySelector('.right-panel');
    
    if (tabName === 'newtask') {
        // Show calendar for New Task tab
        leftPanel.classList.remove('full-width');
        rightPanel.classList.remove('hidden');
    } else {
        // Hide calendar for other tabs
        leftPanel.classList.add('full-width');
        rightPanel.classList.add('hidden');
    }
    
    // Populate tab-specific content
    switch(tabName) {
        case 'upcoming':
            populateUpcomingTasks();
            break;
        case 'past':
            populatePastTasks();
            break;
        case 'reminders':
            populateAllReminders();
            break;
    }
}


// ============================================
// TASK POPULATION FUNCTIONS
// ============================================

/**
 * Populates the upcoming tasks tab with future tasks
 */
function populateUpcomingTasks() {
    console.log('Populating upcoming tasks...');
    const allCards = document.querySelectorAll('#allTasksData .reminder-card');
    const upcomingContainer = document.getElementById('upcomingReminders');
    upcomingContainer.innerHTML = '';
    
    let hasUpcomingTasks = false;
    
    allCards.forEach(card => {
        const scheduledDate = card.getAttribute('data-scheduled');
        if (!isPastTask(scheduledDate)) {
            const clonedCard = card.cloneNode(true);
            clonedCard.style.display = '';
            upcomingContainer.appendChild(clonedCard);
            hasUpcomingTasks = true;
        }
    });
    
    if (!hasUpcomingTasks) {
        upcomingContainer.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">No upcoming tasks!</p>';
    }
}

/**
 * Populates the past tasks tab with completed/past tasks
 */
function populatePastTasks() {
    console.log('Populating past tasks...');
    const allCards = document.querySelectorAll('#allTasksData .reminder-card');
    const pastContainer = document.getElementById('pastReminders');
    pastContainer.innerHTML = '';
    
    // Collect and sort past tasks
    const pastTasks = [];
    allCards.forEach(card => {
        const scheduledDate = card.getAttribute('data-scheduled');
        if (isPastTask(scheduledDate)) {
            pastTasks.push({
                card: card,
                date: new Date(scheduledDate)
            });
        }
    });
    
    if (pastTasks.length === 0) {
        pastContainer.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">No past tasks yet!</p>';
        return;
    }
    
    // Sort in reverse chronological order (most recent first)
    pastTasks.sort((a, b) => b.date - a.date);
    
    // Add sorted cards to container
    pastTasks.forEach(task => {
        const clonedCard = task.card.cloneNode(true);
        clonedCard.classList.add('past-task');
        clonedCard.style.display = '';
        pastContainer.appendChild(clonedCard);
    });
}

/**
 * Populates the all reminders tab with all tasks
 */
function populateAllReminders() {
    console.log('Populating all reminders...');
    const allCards = document.querySelectorAll('#allTasksData .reminder-card');
    const remindersContainer = document.getElementById('allReminders');
    remindersContainer.innerHTML = '';
    
    if (allCards.length === 0) {
        remindersContainer.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">No reminders yet!</p>';
        return;
    }
    
    allCards.forEach(card => {
        const clonedCard = card.cloneNode(true);
        clonedCard.style.display = '';
        remindersContainer.appendChild(clonedCard);
    });
}


// ============================================
// CALENDAR FUNCTIONS
// ============================================

/**
 * Navigate the 3-week calendar view
 */
function navigateWeeks(offset) {
    currentWeekOffset += offset;
    generateCalendar();
}

/**
 * Reset 3-week calendar to current week
 */
function resetCalendar() {
    currentWeekOffset = 0;
    generateCalendar();
}

/**
 * Navigate the 5-week calendar view
 */
function navigateFullCalendar(offset) {
    currentMonthOffset += offset;
    generateFullCalendar();
}

/**
 * Reset 5-week calendar to current month
 */
function resetFullCalendar() {
    currentMonthOffset = 0;
    generateFullCalendar();
}

/**
 * Groups tasks by date for calendar display
 */
function groupTasksByDate() {
    const allCards = document.querySelectorAll('#allTasksData .reminder-card');
    const tasksByDate = {};
    
    allCards.forEach(card => {
        try {
            const scheduledStr = card.getAttribute('data-scheduled');
            if (!scheduledStr) return;
            
            const scheduled = new Date(scheduledStr);
            const year = scheduled.getFullYear();
            const month = String(scheduled.getMonth() + 1).padStart(2, '0');
            const day = String(scheduled.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;
            
            if (!tasksByDate[dateKey]) {
                tasksByDate[dateKey] = [];
            }
            
            const taskData = {
                time: scheduled,
                title: card.getAttribute('data-title') || card.querySelector('h4')?.textContent || 'Untitled',
                note: card.getAttribute('data-note') || card.querySelector('p')?.textContent || '',
                channel: card.getAttribute('data-channel') || card.querySelector('.tag')?.textContent || 'EMAIL',
                id: card.getAttribute('data-id'),
                scheduledFormatted: card.getAttribute('data-date-formatted'),
                targetContact: card.getAttribute('data-target'),
                frequency: card.getAttribute('data-frequency'),
                isPast: isPastTask(scheduledStr)
            };
            
            tasksByDate[dateKey].push(taskData);
        } catch (error) {
            console.error('Error processing card:', error);
        }
    });
    
    // Sort tasks by time for each day
    Object.keys(tasksByDate).forEach(dateKey => {
        tasksByDate[dateKey].sort((a, b) => a.time - b.time);
    });
    
    return tasksByDate;
}

/**
 * Creates a calendar day element with tasks
 */
function createCalendarDay(currentDay, displayMonth, tasksByDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    
    // Gray out days not in the display month
    if (currentDay.getMonth() !== displayMonth) {
        dayDiv.classList.add('other-month');
    }
    
    // Highlight today
    if (currentDay.toDateString() === today.toDateString()) {
        dayDiv.classList.add('today');
    }
    
    // Day number
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = currentDay.getDate();
    dayDiv.appendChild(dayNumber);
    
    // Tasks for this day
    const tasksDiv = document.createElement('div');
    tasksDiv.className = 'day-tasks';
    
    const year = currentDay.getFullYear();
    const month = String(currentDay.getMonth() + 1).padStart(2, '0');
    const day = String(currentDay.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    
    if (tasksByDate[dateKey]) {
        tasksByDate[dateKey].forEach(task => {
            const taskDiv = createCalendarTask(task);
            tasksDiv.appendChild(taskDiv);
        });
    }
    
    dayDiv.appendChild(tasksDiv);
    return dayDiv;
}

/**
 * Creates a calendar task element
 */
function createCalendarTask(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'calendar-task';
    
    if (task.isPast) {
        taskDiv.classList.add('past');
    }
    
    taskDiv.textContent = task.title;
    
    // Format time
    const hours = task.time.getHours();
    const minutes = task.time.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    const timeStr = `${displayHours}:${displayMinutes} ${ampm}`;
    
    // Store data for tooltip and edit modal
    taskDiv.dataset.title = task.title;
    taskDiv.dataset.time = timeStr;
    taskDiv.dataset.channel = task.channel;
    taskDiv.dataset.note = task.note || '';
    taskDiv.dataset.id = task.id;
    taskDiv.dataset.scheduledFormatted = task.scheduledFormatted;
    taskDiv.dataset.targetContact = task.targetContact;
    taskDiv.dataset.frequency = task.frequency;
    
    // Add event listeners
    taskDiv.addEventListener('mouseenter', showTooltip);
    taskDiv.addEventListener('mouseleave', hideTooltip);
    taskDiv.addEventListener('click', () => {
        openEditModal(
            task.id,
            task.title,
            task.scheduledFormatted,
            task.channel,
            task.note,
            task.targetContact,
            task.frequency
        );
    });
    
    return taskDiv;
}

/**
 * Generates the 3-week calendar view
 */
function generateCalendar() {
    const container = document.getElementById('calendarWeeks');
    if (!container) return;
    
    container.innerHTML = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tasksByDate = groupTasksByDate();
    
    // Calculate start date
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + (currentWeekOffset * 21)); // 21 days = 3 weeks
    
    const displayMonth = startDate.getMonth();
    const displayYear = startDate.getFullYear();
    
    // Generate 3 weeks
    for (let week = 0; week < 3; week++) {
        const weekDiv = document.createElement('div');
        weekDiv.className = 'calendar-week';
        
        const weekDays = document.createElement('div');
        weekDays.className = 'week-days';
        
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + (week * 7));
        
        // Start from Sunday
        const dayOfWeek = weekStart.getDay();
        weekStart.setDate(weekStart.getDate() - dayOfWeek);
        
        for (let day = 0; day < 7; day++) {
            const currentDay = new Date(weekStart);
            currentDay.setDate(currentDay.getDate() + day);
            
            const dayDiv = createCalendarDay(currentDay, displayMonth, tasksByDate);
            weekDays.appendChild(dayDiv);
        }
        
        weekDiv.appendChild(weekDays);
        container.appendChild(weekDiv);
    }
    
    // Update title
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('calendarTitle').textContent = `${monthNames[displayMonth]} ${displayYear}`;
}

/**
 * Generates the 5-week full calendar view
 */
function generateFullCalendar() {
    const container = document.getElementById('fullCalendarWeeks');
    if (!container) return;
    
    container.innerHTML = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tasksByDate = groupTasksByDate();
    
    // Calculate display month
    const displayDate = new Date(today.getFullYear(), today.getMonth() + currentMonthOffset, 1);
    const displayMonth = displayDate.getMonth();
    const displayYear = displayDate.getFullYear();
    
    // Get first day of the month
    const firstDayOfMonth = new Date(displayYear, displayMonth, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // Calculate starting Sunday
    const calendarStart = new Date(firstDayOfMonth);
    calendarStart.setDate(calendarStart.getDate() - firstDayOfWeek);
    
    // Generate 5 weeks
    for (let week = 0; week < 5; week++) {
        const weekDiv = document.createElement('div');
        weekDiv.className = 'calendar-week';
        
        const weekDays = document.createElement('div');
        weekDays.className = 'week-days';
        
        for (let day = 0; day < 7; day++) {
            const currentDay = new Date(calendarStart);
            currentDay.setDate(currentDay.getDate() + (week * 7) + day);
            
            const dayDiv = createCalendarDay(currentDay, displayMonth, tasksByDate);
            weekDays.appendChild(dayDiv);
        }
        
        weekDiv.appendChild(weekDays);
        container.appendChild(weekDiv);
    }
    
    // Update title
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('fullCalendarTitle').textContent = `${monthNames[displayMonth]} ${displayYear}`;
}


// ============================================
// TOOLTIP FUNCTIONS
// ============================================

/**
 * Shows tooltip on calendar task hover
 */
function showTooltip(event) {
    const target = event.currentTarget;
    const title = target.dataset.title;
    const time = target.dataset.time;
    const channel = target.dataset.channel;
    const note = target.dataset.note;
    
    // Create tooltip if it doesn't exist
    if (!tooltipElement) {
        tooltipElement = document.createElement('div');
        tooltipElement.className = 'task-tooltip';
        document.body.appendChild(tooltipElement);
    }
    
    // Build tooltip content
    let content = `<strong>${title}</strong><br>⏰ ${time}<br>📧 ${channel}`;
    if (note) {
        content += `<br>📝 ${note}`;
    }
    content += '<div class="task-tooltip-arrow"></div>';
    
    tooltipElement.innerHTML = content;
    
    // Position tooltip
    const rect = target.getBoundingClientRect();
    tooltipElement.style.opacity = '0';
    tooltipElement.style.display = 'block';
    
    const tooltipRect = tooltipElement.getBoundingClientRect();
    
    // Calculate position
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    const top = rect.top - tooltipRect.height - 12;
    
    // Constrain to viewport
    const minLeft = 10;
    const maxLeft = window.innerWidth - tooltipRect.width - 10;
    const constrainedLeft = Math.max(minLeft, Math.min(maxLeft, left));
    
    tooltipElement.style.left = constrainedLeft + 'px';
    tooltipElement.style.top = top + 'px';
    
    // Adjust arrow position
    const arrow = tooltipElement.querySelector('.task-tooltip-arrow');
    const taskCenter = rect.left + (rect.width / 2);
    let arrowOffset = taskCenter - constrainedLeft;
    arrowOffset = Math.max(8, Math.min(tooltipRect.width - 8, arrowOffset));
    arrow.style.left = arrowOffset + 'px';
    arrow.style.marginLeft = '-8px';
    
    // Show tooltip with animation
    setTimeout(() => {
        tooltipElement.classList.add('show');
    }, 10);
}

/**
 * Hides tooltip
 */
function hideTooltip() {
    if (tooltipElement) {
        tooltipElement.classList.remove('show');
    }
}


// ============================================
// MODAL FUNCTIONS
// ============================================

/**
 * Opens the edit modal with task data
 */
function openEditModal(id, title, date, channel, note, target, frequency) {
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-title').value = title;
    document.getElementById('edit-date').value = date;
    document.getElementById('edit-channel').value = channel;
    document.getElementById('editNoteInput').value = note;
    document.getElementById('edit-target').value = target;
    document.getElementById('edit-frequency').value = frequency || 'Standard';
    document.getElementById('deleteForm').action = `/delete_reminder/${id}`;
    
    document.getElementById('editModal').style.display = 'block';
    document.getElementById('edit-title').focus();
    
    checkWordCount('editNoteInput', 'editWordCountDisplay', 'editSubmitBtn');
}

/**
 * Closes the edit modal
 */
function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}


// ============================================
// SEARCH FUNCTIONALITY
// ============================================

/**
 * Sets up search functionality for a specific tab
 */
function setupSearch(inputId, containerId) {
    const searchInput = document.getElementById(inputId);
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const filter = this.value.toLowerCase();
        const cards = document.querySelectorAll(`#${containerId} .reminder-card`);
        
        cards.forEach(card => {
            const title = card.querySelector('h4')?.textContent.toLowerCase() || '';
            const note = card.querySelector('p')?.textContent.toLowerCase() || '';
            
            if (title.includes(filter) || note.includes(filter)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

/**
 * Sets up special search for New Task tab (searches all upcoming tasks)
 */
function setupNewTaskSearch() {
    const searchInput = document.getElementById('searchInputNewTask');
    if (!searchInput) return;
    
    const visibleContainer = document.getElementById('upcomingRemindersNewTask');
    const originalTasksHTML = visibleContainer.innerHTML;
    const createCard = document.querySelector('.create-card');
    
    searchInput.addEventListener('input', function() {
        const filter = this.value.toLowerCase();
        
        if (filter.length > 0) {
            createCard.style.display = 'none';
            visibleContainer.innerHTML = '';
            
            const searchableCards = document.querySelectorAll('#searchableUpcomingTasks .reminder-card');
            let hasResults = false;
            
            searchableCards.forEach(card => {
                const scheduledDate = card.getAttribute('data-scheduled');
                if (isPastTask(scheduledDate)) return;
                
                const title = card.querySelector('h4').textContent.toLowerCase();
                const note = card.querySelector('p').textContent.toLowerCase();
                
                if (title.includes(filter) || note.includes(filter)) {
                    const clonedCard = card.cloneNode(true);
                    clonedCard.style.display = '';
                    visibleContainer.appendChild(clonedCard);
                    hasResults = true;
                }
            });
            
            if (!hasResults) {
                visibleContainer.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">No matching tasks found</p>';
            }
        } else {
            createCard.style.display = 'block';
            visibleContainer.innerHTML = originalTasksHTML;
        }
    });
}


// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard initializing...');
    
    // Set default date/time to tomorrow at 12:00 AM
    const dateInput = document.querySelector('input[name="date"]');
    if (dateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');
        const hours = String(tomorrow.getHours()).padStart(2, '0');
        const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
        
        dateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    // Generate calendars
    generateCalendar();
    generateFullCalendar();
    
    // Setup search functionality for all tabs
    setupNewTaskSearch();
    setupSearch('searchInputUpcoming', 'upcomingReminders');
    setupSearch('searchInputPast', 'pastReminders');
    setupSearch('searchInputReminders', 'allReminders');
    
    console.log('Dashboard initialized successfully');
});

// Close modal when clicking background
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        closeModal();
    }
};

// Make functions globally accessible (for inline onclick handlers)
window.switchTab = switchTab;
window.openEditModal = openEditModal;
window.closeModal = closeModal;
window.checkWordCount = checkWordCount;
window.navigateWeeks = navigateWeeks;
window.resetCalendar = resetCalendar;
window.navigateFullCalendar = navigateFullCalendar;
window.resetFullCalendar = resetFullCalendar;
