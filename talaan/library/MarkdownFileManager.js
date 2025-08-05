.pragma library

.import "ProcessFunc.js" as Process
.import QtQuick 2.0 as QtQuick

// Markdown File Manager for Talaan App
// Replaces SQLite database with markdown files stored in app data directory

var fileInterface = null;
var dataDirectory = "";

// Initialize the file system
function initializeFileSystem() {
    if (!fileInterface) {
        // Create the Qt file interface
        fileInterface = Qt.createQmlObject(
            'import QtQuick 2.4; import "../library/QtFileInterface.qml" as FileInterface; FileInterface {}',
            Qt.application
        );
        dataDirectory = fileInterface.dataDirectory;
    }
    
    // Initialize directory structure
    createDirectoryStructure();
}

// Create the necessary directory structure
function createDirectoryStructure() {
    if (!fileInterface) return;
    
    try {
        // Directory structure is created by QtFileInterface.initialize()
        fileInterface.initialize();
        
        // Create default categories file if it doesn't exist
        initializeDefaultCategories();
        
        console.log("Directory structure created successfully");
    } catch (error) {
        console.log("Error creating directory structure: " + error);
    }
}

function createDirectory(path) {
    if (fileInterface) {
        return fileInterface.createDirectory(path);
    }
    console.log("Creating directory: " + path);
    return false;
}

// Initialize default categories
function initializeDefaultCategories() {
    var categoriesFile = dataDirectory + "categories/categories.json";
    
    if (!fileExists(categoriesFile)) {
        var defaultCategories = [
            {
                "name": "Personal",
                "descr": "Personal tasks and activities",
                "icon": "contact",
                "colorValue": "#3498db"
            },
            {
                "name": "Work",
                "descr": "Work-related tasks",
                "icon": "office",
                "colorValue": "#2ecc71"
            },
            {
                "name": "Shopping",
                "descr": "Shopping lists",
                "icon": "shopping-cart",
                "colorValue": "#e74c3c"
            },
            {
                "name": "Uncategorized",
                "descr": "Uncategorized lists",
                "icon": "default",
                "colorValue": "white"
            }
        ];
        
        writeJsonFile(categoriesFile, defaultCategories);
    }
}

// Check if file exists
function fileExists(filePath) {
    if (fileInterface) {
        return fileInterface.fileExists(filePath);
    }
    return false;
}

// Read text file
function readTextFile(filePath) {
    if (fileInterface) {
        return fileInterface.readTextFile(filePath);
    }
    console.log("Error reading file: " + filePath + " - No file interface");
    return "";
}

// Write text file
function writeTextFile(filePath, content) {
    if (fileInterface) {
        return fileInterface.writeTextFile(filePath, content);
    }
    console.log("Error writing file: " + filePath + " - No file interface");
    return false;
}

// Read JSON file
function readJsonFile(filePath) {
    var content = readTextFile(filePath);
    if (content !== "") {
        try {
            return JSON.parse(content);
        } catch (error) {
            console.log("Error parsing JSON from: " + filePath + " - " + error);
            return null;
        }
    }
    return null;
}

// Write JSON file
function writeJsonFile(filePath, data) {
    var jsonString = JSON.stringify(data, null, 2);
    return writeTextFile(filePath, jsonString);
}

// Generate unique ID for new items
function generateId() {
    return Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

// Get current timestamp
function getCurrentTimestamp() {
    return new Date().toISOString();
}

// Create checklist markdown file
function saveChecklist(txtName, txtDescr, txtCategory, txtCreationDt, txtTargetDt, txtListType, intContinual) {
    var checklistId = generateId();
    var fileName = checklistId + ".md";
    var folderPath = "";
    
    // Determine folder based on list type
    switch (txtListType) {
        case "saved":
            folderPath = dataDirectory + "saved/";
            break;
        case "completed":
        case "history":
            folderPath = dataDirectory + "history/";
            break;
        default:
            folderPath = dataDirectory + "lists/";
            break;
    }
    
    var filePath = folderPath + fileName;
    
    // Create markdown content with frontmatter
    var markdownContent = createMarkdownContent(checklistId, txtName, txtDescr, txtCategory, txtCreationDt, txtTargetDt, txtListType, intContinual, []);
    
    if (writeTextFile(filePath, markdownContent)) {
        // Return checklist object for compatibility
        return {
            id: checklistId,
            checklist: txtName,
            descr: txtDescr,
            category: txtCategory,
            creation_dt: txtCreationDt,
            completion_dt: null,
            status: txtListType,
            target_dt: txtTargetDt,
            continual: intContinual,
            completed: 0,
            total: 0,
            filePath: filePath
        };
    }
    
    return null;
}

// Create markdown content with YAML frontmatter
function createMarkdownContent(id, name, description, category, creationDt, targetDt, status, continual, items) {
    var frontmatter = "---\n";
    frontmatter += "id: \"" + id + "\"\n";
    frontmatter += "name: \"" + name.replace(/"/g, '\\"') + "\"\n";
    frontmatter += "description: \"" + description.replace(/"/g, '\\"') + "\"\n";
    frontmatter += "category: \"" + category + "\"\n";
    frontmatter += "creation_dt: \"" + creationDt + "\"\n";
    frontmatter += "target_dt: \"" + (targetDt || "") + "\"\n";
    frontmatter += "status: \"" + status + "\"\n";
    frontmatter += "continual: " + (continual || 0) + "\n";
    frontmatter += "completion_dt: \"\"\n";
    frontmatter += "favorite: 0\n";
    frontmatter += "---\n\n";
    
    // Add description as markdown content
    var content = "# " + name + "\n\n";
    if (description && description.trim() !== "") {
        content += description + "\n\n";
    }
    
    // Add items as checkbox list
    content += "## Items\n\n";
    
    if (items && items.length > 0) {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var checked = item.status === 1 || item.status === 2;
            var checkbox = checked ? "- [x]" : "- [ ]";
            var priority = item.priority === "High" ? " ⚡" : "";
            
            content += checkbox + " " + item.name + priority;
            
            if (item.comments && item.comments.trim() !== "") {
                content += "\n  > " + item.comments.replace(/\n/g, "\n  > ");
            }
            
            content += "\n";
        }
    } else {
        content += "- [ ] \n";
    }
    
    return frontmatter + content;
}

// Parse markdown file and extract data
function parseMarkdownFile(filePath) {
    var content = readTextFile(filePath);
    if (!content) return null;
    
    // Extract YAML frontmatter
    var frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) return null;
    
    var frontmatterText = frontmatterMatch[1];
    var markdownContent = frontmatterMatch[2];
    
    // Parse YAML frontmatter (simple parsing)
    var metadata = parseYamlFrontmatter(frontmatterText);
    
    // Parse items from markdown content
    var items = parseMarkdownItems(markdownContent);
    
    // Calculate totals
    var completedCount = 0;
    var totalCount = items.length;
    
    for (var i = 0; i < items.length; i++) {
        if (items[i].status === 1 || items[i].status === 2) {
            completedCount++;
        }
    }
    
    return {
        id: metadata.id,
        checklist: metadata.name,
        descr: metadata.description,
        category: metadata.category,
        creation_dt: metadata.creation_dt,
        target_dt: metadata.target_dt,
        status: metadata.status,
        continual: parseInt(metadata.continual) || 0,
        completion_dt: metadata.completion_dt,
        favorite: parseInt(metadata.favorite) || 0,
        completed: completedCount,
        total: totalCount,
        items: items,
        filePath: filePath
    };
}

// Simple YAML frontmatter parser
function parseYamlFrontmatter(yamlText) {
    var lines = yamlText.split('\n');
    var result = {};
    
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line === "") continue;
        
        var colonIndex = line.indexOf(':');
        if (colonIndex > -1) {
            var key = line.substring(0, colonIndex).trim();
            var value = line.substring(colonIndex + 1).trim();
            
            // Remove quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            
            result[key] = value;
        }
    }
    
    return result;
}

// Parse items from markdown content
function parseMarkdownItems(markdownContent) {
    var items = [];
    var lines = markdownContent.split('\n');
    var currentItem = null;
    
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        
        // Check for checkbox items
        var checkboxMatch = line.match(/^- \[([ x])\] (.*)$/);
        if (checkboxMatch) {
            // Save previous item if exists
            if (currentItem) {
                items.push(currentItem);
            }
            
            var checked = checkboxMatch[1] === 'x';
            var itemText = checkboxMatch[2];
            var priority = "Normal";
            
            // Check for priority indicator
            if (itemText.includes("⚡")) {
                priority = "High";
                itemText = itemText.replace("⚡", "").trim();
            }
            
            currentItem = {
                name: itemText,
                status: checked ? 1 : 0,
                priority: priority,
                comments: ""
            };
        }
        // Check for comment lines (indented with >)
        else if (line.match(/^\s*>\s*(.*)$/)) {
            if (currentItem) {
                var commentText = line.replace(/^\s*>\s*/, "");
                if (currentItem.comments) {
                    currentItem.comments += "\n" + commentText;
                } else {
                    currentItem.comments = commentText;
                }
            }
        }
    }
    
    // Add the last item
    if (currentItem) {
        items.push(currentItem);
    }
    
    return items;
}

// Get all checklists from a directory
function getChecklistsFromDirectory(directoryPath, purpose, favorite, group, filter, order, searchMode, searchCondition, searchText) {
    var checklists = [];
    
    try {
        // Get all .md files from directory
        var files = getMarkdownFilesFromDirectory(directoryPath);
        
        for (var i = 0; i < files.length; i++) {
            var checklist = parseMarkdownFile(directoryPath + files[i]);
            if (checklist) {
                // Apply filters
                if (favorite !== undefined && checklist.favorite !== favorite) {
                    continue;
                }
                
                // Apply search filters
                if (searchText && searchText.trim() !== "") {
                    var searchLower = searchText.toLowerCase();
                    var matchFound = false;
                    
                    switch (searchMode) {
                        case "default":
                            matchFound = checklist.checklist.toLowerCase().indexOf(searchLower) > -1 ||
                                       checklist.descr.toLowerCase().indexOf(searchLower) > -1;
                            break;
                        case "category":
                            matchFound = checklist.category.toLowerCase() === searchLower;
                            break;
                        default:
                            matchFound = checklist.checklist.toLowerCase().indexOf(searchLower) > -1;
                            break;
                    }
                    
                    if (!matchFound) {
                        continue;
                    }
                }
                
                checklists.push(checklist);
            }
        }
        
        // Sort results
        checklists.sort(function(a, b) {
            switch (order) {
                case "name":
                    return a.checklist.localeCompare(b.checklist);
                case "category":
                    return a.category.localeCompare(b.category);
                case "creation_dt":
                    return new Date(b.creation_dt) - new Date(a.creation_dt);
                case "target_dt":
                    if (!a.target_dt && !b.target_dt) return 0;
                    if (!a.target_dt) return 1;
                    if (!b.target_dt) return -1;
                    return new Date(a.target_dt) - new Date(b.target_dt);
                default:
                    return new Date(b.creation_dt) - new Date(a.creation_dt);
            }
        });
        
    } catch (error) {
        console.log("Error getting checklists from directory: " + error);
    }
    
    return checklists;
}

// Get all markdown files from directory (placeholder implementation)
function getMarkdownFilesFromDirectory(directoryPath) {
    // This would need to be implemented with proper Qt directory operations
    // For now, return empty array
    return [];
}

// Save category
function saveCategory(txtName, txtDescr, txtIcon) {
    var categoriesFile = dataDirectory + "categories/categories.json";
    var categories = readJsonFile(categoriesFile) || [];
    
    // Check if category already exists
    for (var i = 0; i < categories.length; i++) {
        if (categories[i].name === txtName) {
            // Update existing category
            categories[i].descr = txtDescr;
            categories[i].icon = txtIcon;
            return writeJsonFile(categoriesFile, categories);
        }
    }
    
    // Add new category
    categories.push({
        name: txtName,
        descr: txtDescr,
        icon: txtIcon,
        colorValue: generateRandomColor()
    });
    
    return writeJsonFile(categoriesFile, categories);
}

// Generate random color for categories
function generateRandomColor() {
    var colors = ["#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6", "#1abc9c", "#34495e"];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Get all categories
function getCategories() {
    var categoriesFile = dataDirectory + "categories/categories.json";
    return readJsonFile(categoriesFile) || [];
}

// Update checklist
function updateChecklist(checklistId, newData) {
    var checklist = getChecklistById(checklistId);
    if (!checklist) return false;
    
    // Update metadata
    Object.keys(newData).forEach(function(key) {
        if (newData.hasOwnProperty(key)) {
            checklist[key] = newData[key];
        }
    });
    
    // Regenerate markdown content
    var markdownContent = createMarkdownContent(
        checklist.id,
        checklist.checklist,
        checklist.descr,
        checklist.category,
        checklist.creation_dt,
        checklist.target_dt,
        checklist.status,
        checklist.continual,
        checklist.items || []
    );
    
    return writeTextFile(checklist.filePath, markdownContent);
}

// Get checklist by ID
function getChecklistById(checklistId) {
    var directories = [
        dataDirectory + "lists/",
        dataDirectory + "saved/",
        dataDirectory + "history/"
    ];
    
    for (var d = 0; d < directories.length; d++) {
        var files = getMarkdownFilesFromDirectory(directories[d]);
        for (var f = 0; f < files.length; f++) {
            var checklist = parseMarkdownFile(directories[d] + files[f]);
            if (checklist && checklist.id === checklistId) {
                return checklist;
            }
        }
    }
    
    return null;
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
    
    return updateChecklist(checklistId, {items: checklist.items});
}

// Update item in checklist
function updateItemInChecklist(checklistId, itemIndex, newData) {
    var checklist = getChecklistById(checklistId);
    if (!checklist || !checklist.items || itemIndex >= checklist.items.length) {
        return false;
    }
    
    Object.keys(newData).forEach(function(key) {
        if (newData.hasOwnProperty(key)) {
            checklist.items[itemIndex][key] = newData[key];
        }
    });
    
    return updateChecklist(checklistId, {items: checklist.items});
}

// Delete item from checklist
function deleteItemFromChecklist(checklistId, itemIndex) {
    var checklist = getChecklistById(checklistId);
    if (!checklist || !checklist.items || itemIndex >= checklist.items.length) {
        return false;
    }
    
    checklist.items.splice(itemIndex, 1);
    return updateChecklist(checklistId, {items: checklist.items});
}

// Move checklist between folders (e.g., from lists to history)
function moveChecklist(checklistId, newStatus) {
    var checklist = getChecklistById(checklistId);
    if (!checklist) return false;
    
    var oldFilePath = checklist.filePath;
    var fileName = checklistId + ".md";
    var newFolderPath = "";
    
    switch (newStatus) {
        case "saved":
            newFolderPath = dataDirectory + "saved/";
            break;
        case "completed":
        case "history":
            newFolderPath = dataDirectory + "history/";
            break;
        default:
            newFolderPath = dataDirectory + "lists/";
            break;
    }
    
    var newFilePath = newFolderPath + fileName;
    
    // Update status and completion date if completing
    checklist.status = newStatus;
    if (newStatus === "completed" || newStatus === "history") {
        checklist.completion_dt = getCurrentTimestamp();
    }
    
    // Create new file content
    var markdownContent = createMarkdownContent(
        checklist.id,
        checklist.checklist,
        checklist.descr,
        checklist.category,
        checklist.creation_dt,
        checklist.target_dt,
        checklist.status,
        checklist.continual,
        checklist.items || []
    );
    
    // Write to new location
    if (writeTextFile(newFilePath, markdownContent)) {
        // Delete old file
        deleteFile(oldFilePath);
        return true;
    }
    
    return false;
}

// Delete file
function deleteFile(filePath) {
    // Placeholder for Qt file deletion
    console.log("Deleting file: " + filePath);
    return true;
}

// Delete checklist
function deleteChecklist(checklistId) {
    var checklist = getChecklistById(checklistId);
    if (!checklist) return false;
    
    return deleteFile(checklist.filePath);
}

// Initialize the file system when this module is loaded
Component.onCompleted: initializeFileSystem();
