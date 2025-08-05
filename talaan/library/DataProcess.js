.import "../library/SimpleMarkdownManager.js" as FileManager
.import "../library/ProcessFunc.js" as Process

// Simple DataProcess.js to use in-memory markdown-style storage
// This maintains the same API as the original but uses simplified storage

// Initialize the file system
function openDB() {
    FileManager.MarkdownFileManager.initializeFileSystem();
    return true;
}

// Save checklist
function saveChecklist(txtName, txtDescr, txtCategory, txtCreationDt, txtTargetDt, txtListType, intContinual) {
    return FileManager.MarkdownFileManager.saveChecklist(txtName, txtDescr, txtCategory, txtCreationDt, txtTargetDt, txtListType, intContinual);
}

// Save category
function saveCategory(txtName, txtDescr, txtIcon) {
    return FileManager.MarkdownFileManager.saveCategory(txtName, txtDescr, txtIcon);
}

// Mark checklist as saved
function markSavedChecklist(txtID, boolIncludeComments) {
    return FileManager.MarkdownFileManager.moveChecklist(txtID, "saved");
}

// Update checklist status to completed
function updateChecklistComplete(intID) {
    return FileManager.MarkdownFileManager.moveChecklist(intID, "completed");
}

// Update checklist status to incomplete
function updateChecklistIncomplete(intID) {
    var checklistData = {
        status: "incomplete",
        completion_dt: ""
    };
    return FileManager.MarkdownFileManager.updateChecklist(intID, checklistData);
}

// Uncheck all items in a checklist
function uncheckAllItems(intID) {
    var checklist = FileManager.MarkdownFileManager.getChecklistById(intID);
    if (!checklist || !checklist.items) return false;
    
    // Set all items to unchecked
    for (var i = 0; i < checklist.items.length; i++) {
        FileManager.MarkdownFileManager.updateItemInChecklist(intID, i, {status: 0});
    }
    
    return true;
}

// Create meta tables (now initializes storage)
function createMetaTables() {
    FileManager.MarkdownFileManager.initializeFileSystem();
}

// Initialize data for first run
function initiateData() {
    FileManager.MarkdownFileManager.initializeFileSystem();
}

// Get checklists with filtering and sorting
function getDBChecklists(searchParams, bindList) {
    var searchText = "";
    
    // Extract search text from bindList if provided
    if (bindList && bindList.length > 0) {
        searchText = bindList[0].replace(/%/g, ''); // Remove SQL wildcards
    }
    
    return FileManager.MarkdownFileManager.getChecklistsFromStorage("lists", searchText);
}

// Get saved checklists
function getSavedChecklists(searchText) {
    return FileManager.MarkdownFileManager.getChecklistsFromStorage("saved", searchText);
}

// Get history checklists
function getHistoryChecklists(searchText) {
    return FileManager.MarkdownFileManager.getChecklistsFromStorage("history", searchText);
}

// Get items for a specific checklist
function getItems(checklistId, status, searchText, sortOrder) {
    var checklist = FileManager.MarkdownFileManager.getChecklistById(checklistId);
    if (!checklist || !checklist.items) {
        return [];
    }
    
    var items = checklist.items.slice(); // Create a copy
    
    // Filter by status if specified
    if (status !== null && status !== undefined) {
        items = items.filter(function(item) {
            return item.status === status;
        });
    }
    
    // Filter by search text if specified
    if (searchText && searchText.trim() !== "") {
        var searchLower = searchText.toLowerCase();
        items = items.filter(function(item) {
            return item.name.toLowerCase().indexOf(searchLower) > -1 ||
                   (item.comments && item.comments.toLowerCase().indexOf(searchLower) > -1);
        });
    }
    
    // Sort items
    items.sort(function(a, b) {
        switch (sortOrder) {
            case 1: // By name
                return a.name.localeCompare(b.name);
            case 2: // By priority
                var priorityOrder = {"High": 3, "Normal": 2, "Low": 1};
                return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
            case 3: // By status
                return a.status - b.status;
            default:
                return 0; // Keep original order
        }
    });
    
    // Add metadata to each item for compatibility
    for (var i = 0; i < items.length; i++) {
        items[i].index = i;
        items[i].checklist_id = checklistId;
        items[i].checklist = checklist.checklist;
    }
    
    return items;
}

// Add item to checklist
function addItem(checklistId, itemName, comments, priority) {
    return FileManager.MarkdownFileManager.addItemToChecklist(checklistId, itemName, comments, priority);
}

// Update item in checklist
function updateItem(checklistId, itemIndex, itemName, comments, priority, status) {
    var updateData = {};
    if (itemName !== undefined) updateData.name = itemName;
    if (comments !== undefined) updateData.comments = comments;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    
    return FileManager.MarkdownFileManager.updateItemInChecklist(checklistId, itemIndex, updateData);
}

// Delete item from checklist
function deleteItem(checklistId, itemIndex) {
    return FileManager.MarkdownFileManager.deleteItemFromChecklist(checklistId, itemIndex);
}

// Update item status (check/uncheck)
function updateItemStatus(checklistId, itemIndex, status) {
    return FileManager.MarkdownFileManager.updateItemInChecklist(checklistId, itemIndex, {status: status});
}

// Get categories
function getCategories() {
    return FileManager.MarkdownFileManager.getCategories();
}

// Delete category
function deleteCategory(categoryName) {
    return FileManager.MarkdownFileManager.deleteCategory(categoryName);
}

// Update category
function updateCategory(oldName, newName, description, icon) {
    // For simplicity, delete old and create new
    FileManager.MarkdownFileManager.deleteCategory(oldName);
    return FileManager.MarkdownFileManager.saveCategory(newName, description, icon);
}

// Delete checklist
function deleteChecklist(checklistId) {
    return FileManager.MarkdownFileManager.deleteChecklist(checklistId);
}

// Update checklist details
function updateChecklistDetails(checklistId, name, description, category, targetDate, continual) {
    var updateData = {};
    if (name !== undefined) updateData.checklist = name;
    if (description !== undefined) updateData.descr = description;
    if (category !== undefined) updateData.category = category;
    if (targetDate !== undefined) updateData.target_dt = targetDate;
    if (continual !== undefined) updateData.continual = continual;
    
    return FileManager.MarkdownFileManager.updateChecklist(checklistId, updateData);
}

// Toggle favorite status
function toggleFavorite(checklistId) {
    var checklist = FileManager.MarkdownFileManager.getChecklistById(checklistId);
    if (!checklist) return false;
    
    var newFavoriteStatus = checklist.favorite === 1 ? 0 : 1;
    return FileManager.MarkdownFileManager.updateChecklist(checklistId, {favorite: newFavoriteStatus});
}

// Get favorite checklists
function getFavoriteChecklists() {
    var allChecklists = FileManager.MarkdownFileManager.getChecklistsFromStorage("lists");
    return allChecklists.filter(function(checklist) {
        return checklist.favorite === 1;
    });
}

// Get targets
function getTargets() {
    return FileManager.MarkdownFileManager.getTargets();
}

// Get reminders (placeholder)
function getReminders() {
    return [];
}

// Search functionality
function searchChecklists(searchText, searchMode, directories) {
    var results = [];
    
    // Search in all storage areas
    var lists = FileManager.MarkdownFileManager.getChecklistsFromStorage("lists", searchText);
    var saved = FileManager.MarkdownFileManager.getChecklistsFromStorage("saved", searchText);
    var history = FileManager.MarkdownFileManager.getChecklistsFromStorage("history", searchText);
    
    results = lists.concat(saved, history);
    
    return results;
}

// Clear history
function clearHistory() {
    try {
        var historyChecklists = FileManager.MarkdownFileManager.getChecklistsFromStorage("history");
        for (var i = 0; i < historyChecklists.length; i++) {
            FileManager.MarkdownFileManager.deleteChecklist(historyChecklists[i].id);
        }
        return true;
    } catch (error) {
        console.log("Error clearing history: " + error);
        return false;
    }
}

// Get statistics
function getStatistics() {
    return FileManager.MarkdownFileManager.getStatistics();
}

// Version management
function checkUserVersion() {
    return 3; // Current version
}

function upgradeUserVersion() {
    return true;
}

// Migration functions (for compatibility)
function executeUserVersion1() {
    console.log("Version 1 migration: Priority field support");
}

function executeUserVersion2() {
    console.log("Version 2 migration: Favorites system");
}

function executeUserVersion3() {
    console.log("Version 3 migration: Continual lists");
}

// Initialize system
function initializeSystem() {
    try {
        createMetaTables();
        initiateData();
        
        console.log("Simple markdown system initialized successfully");
        return true;
    } catch (error) {
        console.log("Error initializing system: " + error);
        return false;
    }
}

// Export/import functions (placeholder)
function exportData(format, exportPath) {
    console.log("Export functionality - format: " + format + ", path: " + exportPath);
    return true;
}

function importData(importPath) {
    console.log("Import functionality - path: " + importPath);
    return true;
}
