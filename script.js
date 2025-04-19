document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const menuToggle = document.getElementById('menu-toggle');
    const userDropdownToggle = document.getElementById('user-dropdown-toggle');
    const userDropdown = document.getElementById('user-dropdown');
    const taskList = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    const addTaskBtn = document.getElementById('add-task-btn');
    const emptyAddTaskBtn = document.getElementById('empty-add-task-btn');
    const clearCompletedBtn = document.getElementById('clear-completed-btn');
    const taskModal = document.getElementById('task-modal');
    const closeModal = document.getElementById('close-modal');
    const cancelTask = document.getElementById('cancel-task');
    const saveTask = document.getElementById('save-task');
    const taskForm = document.getElementById('task-form');
    const taskIdInput = document.getElementById('task-id');
    const taskTitleInput = document.getElementById('task-title');
    const taskDescriptionInput = document.getElementById('task-description');
    const taskPriorityInput = document.getElementById('task-priority');
    const taskListSelect = document.getElementById('task-list-select');
    const taskDueDateInput = document.getElementById('task-due-date');
    const taskReminderInput = document.getElementById('task-reminder');
    const taskImportantInput = document.getElementById('task-important');
    const tagsContainer = document.getElementById('tags-container');
    const tagInput = document.getElementById('tag-input');
    const notification = document.getElementById('notification');
    const notificationTitle = document.getElementById('notification-title');
    const notificationMessage = document.getElementById('notification-message');
    const notificationClose = document.getElementById('notification-close');
    const filterStatus = document.getElementById('filter-status');
    const filterPriority = document.getElementById('filter-priority');
    const filterDueDate = document.getElementById('filter-due-date');
    const sortBy = document.getElementById('sort-by');
    const searchInput = document.getElementById('search-input');
    const allTasksCount = document.getElementById('all-tasks-count');
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    const highPriorityTasksEl = document.getElementById('high-priority-tasks');
    const progressFill = document.getElementById('progress-fill');
    const progressPercentage = document.getElementById('progress-percentage');
    const paginationInfo = document.getElementById('pagination-info');

    // State
    let tasks = [];
    let currentTags = [];
    let editMode = false;

    // Initialize the app
    initApp();

    // Event Listeners
    menuToggle.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', closeSidebar);
    userDropdownToggle.addEventListener('click', toggleUserDropdown);
    document.addEventListener('click', closeDropdownOnOutsideClick);
    addTaskBtn.addEventListener('click', openAddTaskModal);
    emptyAddTaskBtn.addEventListener('click', openAddTaskModal);
    closeModal.addEventListener('click', closeTaskModal);
    cancelTask.addEventListener('click', closeTaskModal);
    saveTask.addEventListener('click', saveTaskHandler);
    taskForm.addEventListener('submit', function(e) { e.preventDefault(); saveTaskHandler(); });
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    tagInput.addEventListener('keydown', handleTagInput);
    notificationClose.addEventListener('click', hideNotification);
    filterStatus.addEventListener('change', applyFilters);
    filterPriority.addEventListener('change', applyFilters);
    filterDueDate.addEventListener('change', applyFilters);
    sortBy.addEventListener('change', applyFilters);
    searchInput.addEventListener('input', applyFilters);

    // Set today's date as the default due date
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    taskDueDateInput.value = formattedDate;

    // Functions
    function initApp() {
        // Load tasks from localStorage
        loadTasks();
        renderTasks();
        updateTaskStats();
    }

    function toggleSidebar() {
        sidebar.classList.toggle('show');
        overlay.classList.toggle('show');
    }

    function closeSidebar() {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
    }

    function toggleUserDropdown() {
        userDropdown.classList.toggle('show');
    }

    function closeDropdownOnOutsideClick(event) {
        if (!userDropdownToggle.contains(event.target) && !userDropdown.contains(event.target)) {
            userDropdown.classList.remove('show');
        }
    }

    function openAddTaskModal() {
        resetTaskForm();
        editMode = false;
        document.getElementById('modal-title').textContent = 'Add New Task';
        taskModal.classList.add('show');
        taskTitleInput.focus();
    }

    function openEditTaskModal(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        editMode = true;
        document.getElementById('modal-title').textContent = 'Edit Task';

        taskIdInput.value = task.id;
        taskTitleInput.value = task.title;
        taskDescriptionInput.value = task.description || '';
        taskPriorityInput.value = task.priority;
        taskListSelect.value = task.list;
        taskDueDateInput.value = task.dueDate;
        taskReminderInput.value = task.reminder;
        taskImportantInput.checked = task.important;

        // Clear existing tags
        currentTags = [];
        updateTagsUI();

        // Add task tags
        if (task.tags && task.tags.length) {
            task.tags.forEach(tag => {
                currentTags.push(tag);
            });
            updateTagsUI();
        }

        taskModal.classList.add('show');
        taskTitleInput.focus();
    }

    function closeTaskModal() {
        taskModal.classList.remove('show');
        resetTaskForm();
    }

    function resetTaskForm() {
        taskForm.reset();
        taskIdInput.value = '';
        currentTags = [];
        updateTagsUI();

        // Set today's date as the default due date
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        taskDueDateInput.value = formattedDate;
    }

    function saveTaskHandler() {
        if (!taskTitleInput.value.trim()) {
            showNotification('Error', 'Task title cannot be empty', 'error');
            return;
        }

        if (editMode) {
            updateTask();
        } else {
            addNewTask();
        }
    }

    function addNewTask() {
        const newTask = {
            id: Date.now().toString(),
            title: taskTitleInput.value.trim(),
            description: taskDescriptionInput.value.trim(),
            priority: taskPriorityInput.value,
            list: taskListSelect.value,
            dueDate: taskDueDateInput.value,
            reminder: taskReminderInput.value,
            important: taskImportantInput.checked,
            tags: [...currentTags],
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();
        updateTaskStats();
        closeTaskModal();
        showNotification('Success', 'Task added successfully');
    }

    function updateTask() {
        const taskId = taskIdInput.value;
        const taskIndex = tasks.findIndex(t => t.id === taskId);

        if (taskIndex === -1) return;

        tasks[taskIndex] = {
            ...tasks[taskIndex],
            title: taskTitleInput.value.trim(),
            description: taskDescriptionInput.value.trim(),
            priority: taskPriorityInput.value,
            list: taskListSelect.value,
            dueDate: taskDueDateInput.value,
            reminder: taskReminderInput.value,
            important: taskImportantInput.checked,
            tags: [...currentTags],
            updatedAt: new Date().toISOString()
        };

        saveTasks();
        renderTasks();
        updateTaskStats();
        closeTaskModal();
        showNotification('Success', 'Task updated successfully');
    }

    function deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            tasks = tasks.filter(task => task.id !== taskId);
            saveTasks();
            renderTasks();
            updateTaskStats();
            showNotification('Success', 'Task deleted successfully');
        }
    }

    function toggleTaskCompletion(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;

        saveTasks();
        renderTasks();
        updateTaskStats();

        if (task.completed) {
            showNotification('Success', 'Task marked as completed');
        }
    }

    function clearCompletedTasks() {
        if (!tasks.some(task => task.completed)) {
            showNotification('Info', 'No completed tasks to clear', 'info');
            return;
        }

        if (confirm('Are you sure you want to clear all completed tasks?')) {
            tasks = tasks.filter(task => !task.completed);
            saveTasks();
            renderTasks();
            updateTaskStats();
            showNotification('Success', 'Completed tasks cleared successfully');
        }
    }

    function handleTagInput(e) {
        if (e.key === 'Enter' && tagInput.value.trim()) {
            e.preventDefault();
            const tag = tagInput.value.trim();

            // Check if tag already exists
            if (!currentTags.includes(tag)) {
                currentTags.push(tag);
                updateTagsUI();
            }

            tagInput.value = '';
        }
    }

    function removeTag(tag) {
        currentTags = currentTags.filter(t => t !== tag);
        updateTagsUI();
    }

    function updateTagsUI() {
        // Clear all tags except the input
        Array.from(tagsContainer.children).forEach(child => {
            if (child !== tagInput) {
                child.remove();
            }
        });

        // Add current tags
        currentTags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag';
            tagElement.innerHTML = `
                <span>${tag}</span>
                <button type="button" class="tag-remove">&times;</button>
            `;
            tagElement.querySelector('.tag-remove').addEventListener('click', () => removeTag(tag));

            // Insert before the input
            tagsContainer.insertBefore(tagElement, tagInput);
        });
    }

    function showNotification(title, message, type = 'success') {
        notificationTitle.textContent = title;
        notificationMessage.textContent = message;

        // Reset classes
        notification.className = 'notification';

        // Add type class
        notification.classList.add(`notification-${type}`);

        // Update icon
        const icon = notification.querySelector('.notification-icon i');
        if (type === 'success') {
            icon.className = 'fas fa-check';
        } else if (type === 'error') {
            icon.className = 'fas fa-times';
        } else if (type === 'info') {
            icon.className = 'fas fa-info';
        }

        // Show notification
        notification.classList.add('show');

        // Hide after 5 seconds
        setTimeout(hideNotification, 5000);
    }

    function hideNotification() {
        notification.classList.remove('show');
    }

    function applyFilters() {
        renderTasks();
    }

    function getFilteredTasks() {
        const statusFilter = filterStatus.value;
        const priorityFilter = filterPriority.value;
        const dueDateFilter = filterDueDate.value;
        const sortOption = sortBy.value;
        const searchTerm = searchInput.value.toLowerCase().trim();

        let filteredTasks = [...tasks];

        // Apply status filter
        if (statusFilter === 'pending') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        } else if (statusFilter === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        }

        // Apply priority filter
        if (priorityFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
        }

        // Apply due date filter
        if (dueDateFilter !== 'all') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (dueDateFilter === 'today') {
                filteredTasks = filteredTasks.filter(task => {
                    const dueDate = new Date(task.dueDate);
                    dueDate.setHours(0, 0, 0, 0);
                    return dueDate.getTime() === today.getTime();
                });
            } else if (dueDateFilter === 'week') {
                const endOfWeek = new Date(today);
                endOfWeek.setDate(today.getDate() + 7);

                filteredTasks = filteredTasks.filter(task => {
                    const dueDate = new Date(task.dueDate);
                    return dueDate >= today && dueDate <= endOfWeek;
                });
            } else if (dueDateFilter === 'month') {
                const endOfMonth = new Date(today);
                endOfMonth.setMonth(today.getMonth() + 1);

                filteredTasks = filteredTasks.filter(task => {
                    const dueDate = new Date(task.dueDate);
                    return dueDate >= today && dueDate <= endOfMonth;
                });
            }
        }

        // Apply search filter
        if (searchTerm) {
            filteredTasks = filteredTasks.filter(task => {
                return (
                    task.title.toLowerCase().includes(searchTerm) ||
                    (task.description && task.description.toLowerCase().includes(searchTerm)) ||
                    (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
                );
            });
        }

        // Apply sorting
        filteredTasks.sort((a, b) => {
            switch (sortOption) {
                case 'date-asc':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'date-desc':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'priority-desc':
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                case 'priority-asc':
                    const priorityOrderAsc = { high: 3, medium: 2, low: 1 };
                    return priorityOrderAsc[a.priority] - priorityOrderAsc[b.priority];
                case 'name-asc':
                    return a.title.localeCompare(b.title);
                case 'name-desc':
                    return b.title.localeCompare(a.title);
                default:
                    return 0;
            }
        });

        return filteredTasks;
    }

    function renderTasks() {
        const filteredTasks = getFilteredTasks();
        taskList.innerHTML = '';

        if (filteredTasks.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';

            filteredTasks.forEach(task => {
                const taskItem = document.createElement('li');
                taskItem.className = 'task-item';
                taskItem.dataset.id = task.id;

                const isOverdue = !task.completed && new Date(task.dueDate) < new Date() && task.dueDate;

                let dueDateText = '';
                if (task.dueDate) {
                    const dueDate = new Date(task.dueDate);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const tomorrow = new Date(today);
                    tomorrow.setDate(today.getDate() + 1);

                    if (dueDate.getTime() === today.getTime()) {
                        dueDateText = 'Today';
                    } else if (dueDate.getTime() === tomorrow.getTime()) {
                        dueDateText = 'Tomorrow';
                    } else {
                        dueDateText = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }
                }

                taskItem.innerHTML = `
                    <div class="task-checkbox">
                        <input type="checkbox" ${task.completed ? 'checked' : ''}>
                        <span class="checkbox-icon"></span>
                    </div>
                    <div class="task-content">
                        <div class="task-title">${task.title}${task.important ? ' <i class="fas fa-star" style="color: #F59E0B;"></i>' : ''}</div>
                        <div class="task-details">
                            ${task.description ? `<div class="task-detail"><i class="fas fa-align-left"></i> ${task.description.length > 50 ? task.description.substring(0, 50) + '...' : task.description}</div>` : ''}
                            ${task.dueDate ? `<div class="task-detail ${isOverdue ? 'text-danger' : ''}"><i class="fas fa-calendar-alt"></i> ${dueDateText}</div>` : ''}
                            <div class="task-detail"><i class="fas fa-layer-group"></i> ${task.list}</div>
                            <span class="task-priority priority-${task.priority}">${task.priority}</span>
                        </div>
                        ${task.tags && task.tags.length ? `
                        <div class="tag-list" style="margin-top: 5px;">
                            ${task.tags.map(tag => `<span class="chip"><i class="fas fa-tag"></i> ${tag}</span>`).join('')}
                        </div>
                        ` : ''}
                    </div>
                    <div class="task-actions">
                        <button class="action-btn edit" title="Edit Task"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete" title="Delete Task"><i class="fas fa-trash-alt"></i></button>
                    </div>
                `;

                // Add event listeners
                taskItem.querySelector('.task-checkbox input').addEventListener('change', () => toggleTaskCompletion(task.id));
                taskItem.querySelector('.action-btn.edit').addEventListener('click', () => openEditTaskModal(task.id));
                taskItem.querySelector('.action-btn.delete').addEventListener('click', () => deleteTask(task.id));

                taskList.appendChild(taskItem);
            });
        }

        // Update pagination info
        paginationInfo.textContent = `Showing ${filteredTasks.length} of ${tasks.length} tasks`;
    }

    function updateTaskStats() {
        // Update counts
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        const highPriorityTasks = tasks.filter(task => task.priority === 'high').length;

        // Update UI
        allTasksCount.textContent = totalTasks;
        totalTasksEl.textContent = totalTasks;
        completedTasksEl.textContent = completedTasks;
        pendingTasksEl.textContent = pendingTasks;
        highPriorityTasksEl.textContent = highPriorityTasks;

        // Update progress
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        progressFill.style.width = `${progress}%`;
        progressPercentage.textContent = `${progress}%`;
    }

    function loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        tasks = savedTasks ? JSON.parse(savedTasks) : generateSampleTasks();
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function generateSampleTasks() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        return [
            {
                id: '1',
                title: 'Complete project proposal',
                description: 'Finish the initial draft of the Q2 marketing proposal',
                priority: 'high',
                list: 'work',
                dueDate: today.toISOString().split('T')[0],
                reminder: '1hour',
                important: true,
                tags: ['Project', 'Marketing'],
                completed: false,
                createdAt: new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: '2',
                title: 'Buy groceries',
                description: 'Milk, eggs, bread, and vegetables',
                priority: 'medium',
                list: 'shopping',
                dueDate: tomorrow.toISOString().split('T')[0],
                reminder: 'none',
                important: false,
                tags: ['Personal', 'Shopping'],
                completed: false,
                createdAt: new Date(today.getTime() - 48 * 60 * 60 * 1000).toISOString()
            },
            {
                id: '3',
                title: 'Schedule dentist appointment',
                description: 'Call Dr. Smith for annual checkup',
                priority: 'low',
                list: 'personal',
                dueDate: nextWeek.toISOString().split('T')[0],
                reminder: '1day',
                important: false,
                tags: ['Health'],
                completed: true,
                completedAt: new Date(today.getTime() - 12 * 60 * 60 * 1000).toISOString(),
                createdAt: new Date(today.getTime() - 72 * 60 * 60 * 1000).toISOString()
            }
        ];
    }
});
