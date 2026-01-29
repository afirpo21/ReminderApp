// --- WORD COUNT VALIDATION ---
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

// --- MODAL FUNCTIONS ---
function openEditModal(id, title, date, channel, note, target, frequency) {
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-title').value = title;
    document.getElementById('edit-date').value = date;
    document.getElementById('edit-channel').value = channel;
    document.getElementById('edit-target').value = target;
    
    const editNoteElem = document.getElementById('editNoteInput');
    if (editNoteElem) editNoteElem.value = note;
    
    const freqElem = document.getElementById('edit-frequency');
    if (freqElem) freqElem.value = frequency || 'Standard';
    
    document.getElementById('deleteForm').action = "/delete_reminder/" + id;
    document.getElementById('editModal').style.display = 'block';
    
    const titleElem = document.getElementById('edit-title');
    if (titleElem) titleElem.focus();
    
    checkWordCount('editNoteInput', 'editWordCountDisplay', 'editSubmitBtn');
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) closeModal();
};

// --- TAB SWITCHING ---
window.switchTab = function(event, tabName) {
    event.preventDefault();
    
    const alertBox = document.querySelector('.alert-box');
    if (alertBox) alertBox.style.display = 'none';
    
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');
    
    const leftPanel = document.querySelector('.left-panel');
    const rightPanel = document.querySelector('.right-panel');
    
    if (tabName === 'newtask') {
        leftPanel.classList.remove('full-width');
        rightPanel.classList.remove('hidden');
    } else {
        leftPanel.classList.add('full-width');
        rightPanel.classList.add('hidden');
    }
    
    if (tabName === 'upcoming') populateUpcomingTasks();
    if (tabName === 'past') populatePastTasks();
    if (tabName === 'reminders') populateAllReminders();
};

// --- TASK CATEGORIZATION ---
function isPastTask(scheduledDate) {
    const now = new Date();
    const scheduled = new Date(scheduledDate);
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
    return scheduled < oneHourAgo;
}

function populateUpcomingTasks() {
    const allCards = document.querySelectorAll('#allTasksData .reminder-card');
    const upcomingContainer = document.getElementById('upcomingReminders');
    upcomingContainer.innerHTML = '';
    
    let hasUpcomingTasks = false;
    allCards.forEach(card => {
        if (!isPastTask(card.getAttribute('data-scheduled'))) {
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

function populatePastTasks() {
    const allCards = document.querySelectorAll('#allTasksData .reminder-card');
    const pastContainer = document.getElementById('pastReminders');
    pastContainer.innerHTML = '';
    
    const pastTasks = [];
    allCards.forEach(card => {
        const scheduledDate = card.getAttribute('data-scheduled');
        if (isPastTask(scheduledDate)) {
            pastTasks.push({ card: card, date: new Date(scheduledDate) });
        }
    });
    
    if (pastTasks.length === 0) {
        pastContainer.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">No past tasks yet!</p>';
        return;
    }
    
    pastTasks.sort((a, b) => b.date - a.date);
    
    pastTasks.forEach(task => {
        const clonedCard = task.card.cloneNode(true);
        clonedCard.classList.add('past-task');
        clonedCard.style.display = '';
        pastContainer.appendChild(clonedCard);
    });
}

function populateAllReminders() {
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

// --- CALENDAR FUNCTIONS ---
let currentWeekOffset = 0;
let currentMonthOffset = 0;

function navigateWeeks(offset) {
    currentWeekOffset += offset;
    generateCalendar();
}

function resetCalendar() {
    currentWeekOffset = 0;
    generateCalendar();
}

function navigateFullCalendar(offset) {
    currentMonthOffset += offset;
    generateFullCalendar();
}

function resetFullCalendar() {
    currentMonthOffset = 0;
    generateFullCalendar();
}

function getTasksByDate() {
    const allCards = document.querySelectorAll('#allTasksData .reminder-card');
    const tasksByDate = {};
    
    allCards.forEach(card => {
        const scheduledStr = card.getAttribute('data-scheduled');
        if (!scheduledStr) return;
        
        const scheduled = new Date(scheduledStr);
        const dateKey = `${scheduled.getFullYear()}-${String(scheduled.getMonth() + 1).padStart(2, '0')}-${String(scheduled.getDate()).padStart(2, '0')}`;
        
        if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
        
        tasksByDate[dateKey].push({
            time: scheduled,
            title: card.getAttribute('data-title') || card.querySelector('h4')?.textContent || 'Untitled',
            note: card.getAttribute('data-note') || card.querySelector('p')?.textContent || '',
            channel: card.getAttribute('data-channel') || 'EMAIL',
            id: card.getAttribute('data-id'),
            scheduledFormatted: card.getAttribute('data-date-formatted'),
            targetContact: card.getAttribute('data-target'),
            frequency: card.getAttribute('data-frequency'),
            isPast: isPastTask(scheduledStr)
        });
    });
    
    Object.keys(tasksByDate).forEach(dateKey => {
        tasksByDate[dateKey].sort((a, b) => a.time - b.time);
    });
    
    return tasksByDate;
}

function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'calendar-task';
    if (task.isPast) taskDiv.classList.add('past');
    taskDiv.textContent = task.title;
    
    const hours = task.time.getHours();
    const minutes = task.time.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const timeStr = `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
    
    Object.assign(taskDiv.dataset, {
        title: task.title,
        time: timeStr,
        channel: task.channel,
        note: task.note || '',
        id: task.id,
        scheduledFormatted: task.scheduledFormatted,
        targetContact: task.targetContact,
        frequency: task.frequency
    });
    
    taskDiv.addEventListener('mouseenter', showTooltip);
    taskDiv.addEventListener('mouseleave', hideTooltip);
    taskDiv.addEventListener('click', () => {
        openEditModal(task.id, task.title, task.scheduledFormatted, task.channel, task.note, task.targetContact, task.frequency);
    });
    
    return taskDiv;
}

function createCalendarDay(currentDay, today, displayMonth, tasksByDate) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    
    if (currentDay.getMonth() !== displayMonth) dayDiv.classList.add('other-month');
    if (currentDay.toDateString() === today.toDateString()) dayDiv.classList.add('today');
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = currentDay.getDate();
    dayDiv.appendChild(dayNumber);
    
    const tasksDiv = document.createElement('div');
    tasksDiv.className = 'day-tasks';
    
    const dateKey = `${currentDay.getFullYear()}-${String(currentDay.getMonth() + 1).padStart(2, '0')}-${String(currentDay.getDate()).padStart(2, '0')}`;
    
    if (tasksByDate[dateKey]) {
        tasksByDate[dateKey].forEach(task => {
            tasksDiv.appendChild(createTaskElement(task));
        });
    }
    
    dayDiv.appendChild(tasksDiv);
    return dayDiv;
}

function generateCalendar() {
    const container = document.getElementById('calendarWeeks');
    if (!container) return;
    container.innerHTML = '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tasksByDate = getTasksByDate();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + (currentWeekOffset * 21));
    
    const displayMonth = startDate.getMonth();
    const displayYear = startDate.getFullYear();
    
    for (let week = 0; week < 3; week++) {
        const weekDiv = document.createElement('div');
        weekDiv.className = 'calendar-week';
        
        const weekDays = document.createElement('div');
        weekDays.className = 'week-days';
        
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + (week * 7) - weekStart.getDay());
        
        for (let day = 0; day < 7; day++) {
            const currentDay = new Date(weekStart);
            currentDay.setDate(currentDay.getDate() + day);
            weekDays.appendChild(createCalendarDay(currentDay, today, displayMonth, tasksByDate));
        }
        
        weekDiv.appendChild(weekDays);
        container.appendChild(weekDiv);
    }
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('calendarTitle').textContent = `${monthNames[displayMonth]} ${displayYear}`;
}

function generateFullCalendar() {
    const container = document.getElementById('fullCalendarWeeks');
    if (!container) return;
    container.innerHTML = '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tasksByDate = getTasksByDate();
    
    const displayDate = new Date(today.getFullYear(), today.getMonth() + currentMonthOffset, 1);
    const displayMonth = displayDate.getMonth();
    const displayYear = displayDate.getFullYear();
    
    const firstDayOfMonth = new Date(displayYear, displayMonth, 1);
    const calendarStart = new Date(firstDayOfMonth);
    calendarStart.setDate(calendarStart.getDate() - firstDayOfMonth.getDay());
    
    for (let week = 0; week < 5; week++) {
        const weekDiv = document.createElement('div');
        weekDiv.className = 'calendar-week';
        
        const weekDays = document.createElement('div');
        weekDays.className = 'week-days';
        
        for (let day = 0; day < 7; day++) {
            const currentDay = new Date(calendarStart);
            currentDay.setDate(currentDay.getDate() + (week * 7) + day);
            weekDays.appendChild(createCalendarDay(currentDay, today, displayMonth, tasksByDate));
        }
        
        weekDiv.appendChild(weekDays);
        container.appendChild(weekDiv);
    }
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('fullCalendarTitle').textContent = `${monthNames[displayMonth]} ${displayYear}`;
}

// --- TOOLTIP FUNCTIONS ---
let tooltipElement = null;

function showTooltip(event) {
    const target = event.currentTarget;
    
    if (!tooltipElement) {
        tooltipElement = document.createElement('div');
        tooltipElement.className = 'task-tooltip';
        document.body.appendChild(tooltipElement);
    }
    
    let content = `<strong>${target.dataset.title}</strong><br>⏰ ${target.dataset.time}<br>📧 ${target.dataset.channel}`;
    if (target.dataset.note) content += `<br>📝 ${target.dataset.note}`;
    content += '<div class="task-tooltip-arrow"></div>';
    
    tooltipElement.innerHTML = content;
    
    const rect = target.getBoundingClientRect();
    tooltipElement.style.opacity = '0';
    tooltipElement.style.display = 'block';
    const tooltipRect = tooltipElement.getBoundingClientRect();
    
    const left = Math.max(10, Math.min(window.innerWidth - tooltipRect.width - 10, rect.left + (rect.width / 2) - (tooltipRect.width / 2)));
    tooltipElement.style.left = left + 'px';
    tooltipElement.style.top = (rect.top - tooltipRect.height - 12) + 'px';
    
    const arrow = tooltipElement.querySelector('.task-tooltip-arrow');
    const arrowOffset = Math.max(8, Math.min(tooltipRect.width - 8, rect.left + (rect.width / 2) - left));
    arrow.style.left = arrowOffset + 'px';
    arrow.style.marginLeft = '-8px';
    
    tooltipElement.style.opacity = '';
    setTimeout(() => tooltipElement.classList.add('show'), 10);
}

function hideTooltip() {
    if (tooltipElement) tooltipElement.classList.remove('show');
}

// --- PAGE INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.querySelector('input[name="date"]');
    if (dateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');
        
        dateInput.value = `${year}-${month}-${day}T00:00`;
    }
    
    generateCalendar();
    generateFullCalendar();
    
    // Search for New Task tab
    const searchInputNewTask = document.getElementById('searchInputNewTask');
    if (searchInputNewTask) {
        const visibleContainer = document.getElementById('upcomingRemindersNewTask');
        const originalTasksHTML = visibleContainer.innerHTML;
        
        searchInputNewTask.addEventListener('input', function() {
            const filter = this.value.toLowerCase();
            const createCard = document.querySelector('.create-card');
            
            if (filter.length > 0) {
                createCard.style.display = 'none';
                visibleContainer.innerHTML = '';
                
                let hasResults = false;
                document.querySelectorAll('#searchableUpcomingTasks .reminder-card').forEach(card => {
                    if (isPastTask(card.getAttribute('data-scheduled'))) return;
                    
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
    
    // Search for other tabs
    ['searchInputUpcoming', 'searchInputPast', 'searchInputReminders'].forEach(inputId => {
        const searchInput = document.getElementById(inputId);
        if (searchInput) {
            const containerId = inputId.replace('searchInput', '').toLowerCase();
            const containerMap = {
                'upcoming': 'upcomingReminders',
                'past': 'pastReminders',
                'reminders': 'allReminders'
            };
            
            searchInput.addEventListener('input', function() {
                const query = this.value.toLowerCase();
                document.querySelectorAll(`#${containerMap[containerId]} .reminder-card`).forEach(card => {
                    const title = card.querySelector('h4')?.innerText.toLowerCase() || '';
                    const note = card.querySelector('p')?.innerText.toLowerCase() || '';
                    card.style.display = (!query || title.includes(query) || note.includes(query)) ? '' : 'none';
                });
            });
        }
    });
});
