.pragma library

// Simple Markdown File Manager for Talaan App
// Basic implementation that works with QML/JavaScript limitations

// In-memory storage for testing (will be replaced with actual file operations)
var inMemoryStorage = {
    lists: {},
    saved: {},
    history: {},
    categories: [],
    nextId: 1
};

var initialized = false;

// Initialize the system
function initializeFileSystem() {
    if (initialized) return;
    
    console.log("Initializing simple markdown file system");
    
    // Initialize default categories
    inMemoryStorage.categories = [
        {
            name: "Personal",
            descr: "Personal tasks and activities", 
            icon: "contact",
            colorValue: "#3498db"
        },
        {
            name: "Work",
            descr: "Work-related tasks",
            icon: "office", 
            colorValue: "#2ecc71"
        },
        {
            name: "Shopping",
            descr: "Shopping lists",
            icon: "shopping-cart",
            colorValue: "#e74c3c"
        },
        {
            name: "Uncategorized",
            descr: "Uncategorized lists",
            icon: "default",
            colorValue: "white"
        }
    ];
    
    initialized = true;
    console.log("Simple markdown file system initialized");
}

// Generate unique ID
function generateId() {
    return "checklist_" + (inMemoryStorage.nextId++);
}

// Get current timestamp
function getCurrentTimestamp() {
    return new Date().toISOString();
}

// Save checklist
function saveChecklist(txtName, txtDescr, txtCategory, txtCreationDt, txtTargetDt, txtListType, intContinual) {
    var checklistId = generateId();
    
    var checklist = {
        id: checklistId,
        checklist: txtName,
        descr: txtDescr,
        category: txtCategory,
        creation_dt: txtCreationDt,
        completion_dt: null,
        status: txtListType,
        target_dt: txtTargetDt,
        continual: intContinual,
        favorite: 0,
        completed: 0,
        total: 0,
        items: []
    };
    
    // Store in appropriate category
    switch (txtListType) {
        case "saved":
            inMemoryStorage.saved[checklistId] = checklist;
            break;
        case "completed":
        case "history":
            inMemoryStorage.history[checklistId] = checklist;
            break;
        default:
            inMemoryStorage.lists[checklistId] = checklist;
            break;
    }
    
    console.log("Saved checklist: " + txtName + " with ID: " + checklistId);
    return checklist;
}

// Get checklist by ID
function getChecklistById(checklistId) {
    // Search in all storage areas
    if (inMemoryStorage.lists[checklistId]) {
        return inMemoryStorage.lists[checklistId];
    }
    if (inMemoryStorage.saved[checklistId]) {
        return inMemoryStorage.saved[checklistId];
    }
    if (inMemoryStorage.history[checklistId]) {
        return inMemoryStorage.history[checklistId];
    }
    return null;
}

// Get all checklists from a specific storage
function getChecklistsFromStorage(storage, searchText) {
    var checklists = [];
    var storageArea = null;
    
    switch (storage) {
        case "saved":
            storageArea = inMemoryStorage.saved;
            break;
        case "history":
            storageArea = inMemoryStorage.history;
            break;
        default:
            storageArea = inMemoryStorage.lists;
            break;
    }
    
    for (var id in storageArea) {
        if (storageArea.hasOwnProperty(id)) {
            var checklist = storageArea[id];
            
            // Apply search filter if provided
            if (searchText && searchText.trim() !== "") {
                var searchLower = searchText.toLowerCase();
                if (checklist.checklist.toLowerCase().indexOf(searchLower) === -1 &&
                    checklist.descr.toLowerCase().indexOf(searchLower) === -1) {
                    continue;
                }
            }
            
            checklists.push(checklist);
        }
    }
    
    // Sort by creation date (newest first)
    checklists.sort(function(a, b) {
        return new Date(b.creation_dt) - new Date(a.creation_dt);
    });
    
    return checklists;
}

// Update checklist
function updateChecklist(checklistId, newData) {
    var checklist = getChecklistById(checklistId);
    if (!checklist) return false;
    
    // Update properties
    for (var key in newData) {
        if (newData.hasOwnProperty(key)) {
            checklist[key] = newData[key];
        }
    }
    
    console.log("Updated checklist: " + checklistId);
    return true;
}

// Move checklist between storages
function moveChecklist(checklistId, newStatus) {
    var checklist = getChecklistById(checklistId);
    if (!checklist) return false;
    
    // Remove from current storage
    delete inMemoryStorage.lists[checklistId];
    delete inMemoryStorage.saved[checklistId];
    delete inMemoryStorage.history[checklistId];
    
    // Update status
    checklist.status = newStatus;
    if (newStatus === "completed" || newStatus === "history") {
        checklist.completion_dt = getCurrentTimestamp();
    }
    
    // Add to new storage
    switch (newStatus) {
        case "saved":
            inMemoryStorage.saved[checklistId] = checklist;
            break;
        case "completed":
        case "history":
            inMemoryStorage.history[checklistId] = checklist;
            break;
        default:
            inMemoryStorage.lists[checklistId] = checklist;
            break;
    }
    
    console.log("Moved checklist " + checklistId + " to " + newStatus);
    return true;
}

// Delete checklist
function deleteChecklist(checklistId) {
    delete inMemoryStorage.lists[checklistId];
    delete inMemoryStorage.saved[checklistId];
    delete inMemoryStorage.history[checklistId];
    
    console.log("Deleted checklist: " + checklistId);
    return true;
}

// Add item to checklist
function addItemToChecklist(checklistId, itemName, comments, priority) {
    var checklist = getChecklistById(checklistId);
    if (!checklist) return false;
    
    if (!checklist.items) {
        checklist.items = [];
    }
    
    checklist.items.push({
        name: itemName,
        comments: comments || "",
        status: 0,
        priority: priority || "Normal"
    });
    
    // Update totals
    checklist.total = checklist.items.length;
    updateCompletedCount(checklist);
    
    console.log("Added item to checklist " + checklistId + ": " + itemName);
    return true;
}

// Update item in checklist
function updateItemInChecklist(checklistId, itemIndex, newData) {
    var checklist = getChecklistById(checklistId);
    if (!checklist || !checklist.items || itemIndex >= checklist.items.length) {
        return false;
    }
    
    var item = checklist.items[itemIndex];
    for (var key in newData) {
        if (newData.hasOwnProperty(key)) {
            item[key] = newData[key];
        }
    }
    
    // Update completed count
    updateCompletedCount(checklist);
    
    console.log("Updated item " + itemIndex + " in checklist " + checklistId);
    return true;
}

// Delete item from checklist
function deleteItemFromChecklist(checklistId, itemIndex) {
    var checklist = getChecklistById(checklistId);
    if (!checklist || !checklist.items || itemIndex >= checklist.items.length) {
        return false;
    }
    
    checklist.items.splice(itemIndex, 1);
    
    // Update totals
    checklist.total = checklist.items.length;
    updateCompletedCount(checklist);
    
    console.log("Deleted item " + itemIndex + " from checklist " + checklistId);
    return true;
}

// Update completed count
function updateCompletedCount(checklist) {
    if (!checklist.items) {
        checklist.completed = 0;
        return;
    }
    
    var completedCount = 0;
    for (var i = 0; i < checklist.items.length; i++) {
        if (checklist.items[i].status === 1 || checklist.items[i].status === 2) {
            completedCount++;
        }
    }
    
    checklist.completed = completedCount;
}

// Save category
function saveCategory(txtName, txtDescr, txtIcon) {
    // Check if category already exists
    for (var i = 0; i < inMemoryStorage.categories.length; i++) {
        if (inMemoryStorage.categories[i].name === txtName) {
            // Update existing category
            inMemoryStorage.categories[i].descr = txtDescr;
            inMemoryStorage.categories[i].icon = txtIcon;
            console.log("Updated category: " + txtName);
            return true;
        }
    }
    
    // Add new category
    inMemoryStorage.categories.push({
        name: txtName,
        descr: txtDescr,
        icon: txtIcon,
        colorValue: generateRandomColor()
    });
    
    console.log("Added category: " + txtName);
    return true;
}

// Get categories
function getCategories() {
    return inMemoryStorage.categories.slice(); // Return a copy
}

// Delete category
function deleteCategory(categoryName) {
    for (var i = inMemoryStorage.categories.length - 1; i >= 0; i--) {
        if (inMemoryStorage.categories[i].name === categoryName) {
            inMemoryStorage.categories.splice(i, 1);
            console.log("Deleted category: " + categoryName);
            return true;
        }
    }
    return false;
}

// Generate random color
function generateRandomColor() {
    var colors = ["#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6", "#1abc9c", "#34495e"];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Get targets
function getTargets() {
    var targets = [];
    var allChecklists = getChecklistsFromStorage("lists").concat(getChecklistsFromStorage("saved"));
    
    for (var i = 0; i < allChecklists.length; i++) {
        var checklist = allChecklists[i];
        if (checklist.target_dt && checklist.target_dt.trim() !== "") {
            targets.push({
                id: checklist.id,
                checklist: checklist.checklist,
                target_dt: checklist.target_dt,
                status: checklist.status,
                overdue: new Date(checklist.target_dt) < new Date(),
                reminder: false
            });
        }
    }
    
    return targets;
}

// Get statistics
function getStatistics() {
    var lists = getChecklistsFromStorage("lists");
    var saved = getChecklistsFromStorage("saved");
    var history = getChecklistsFromStorage("history");
    
    var totalItems = 0;
    var completedItems = 0;
    
    var allLists = lists.concat(saved, history);
    for (var i = 0; i < allLists.length; i++) {
        if (allLists[i].items) {
            totalItems += allLists[i].items.length;
            completedItems += allLists[i].completed || 0;
        }
    }
    
    return {
        totalLists: lists.length,
        completedLists: history.length,
        savedLists: saved.length,
        totalItems: totalItems,
        completedItems: completedItems
    };
}

// Export functions for external access
var MarkdownFileManager = {
    initializeFileSystem: initializeFileSystem,
    saveChecklist: saveChecklist,
    getChecklistById: getChecklistById,
    getChecklistsFromStorage: getChecklistsFromStorage,
    updateChecklist: updateChecklist,
    moveChecklist: moveChecklist,
    deleteChecklist: deleteChecklist,
    addItemToChecklist: addItemToChecklist,
    updateItemInChecklist: updateItemInChecklist,
    deleteItemFromChecklist: deleteItemFromChecklist,
    saveCategory: saveCategory,
    getCategories: getCategories,
    deleteCategory: deleteCategory,
    getTargets: getTargets,
    getStatistics: getStatistics
};
