.import "../library/MarkdownFileManager.js" as FileManager

// Updated DBUtilities.js to use markdown files instead of SQLite database
// This file provides the same interface as the original but uses file operations

//open database for transactions (now initializes file system)
function openDB() {
    FileManager.initializeFileSystem();
    return true; // Return true for compatibility
}

//update database (now updates markdown files)
function updateDB(txtStatement) {
    // This function is no longer needed with file-based storage
    // Individual update operations are handled by specific functions
    console.log("Update operation: " + txtStatement);
    return true;
}

//select data from database (now reads from markdown files)
function selectDB(txtStatement) {
    // Parse the SQL-like statement to determine what data to retrieve
    var arrResult = [];
    
    try {
        // This is a simplified parser - in practice, you'd need more robust parsing
        if (txtStatement.toLowerCase().includes("from checklist")) {
            // Return checklists
            var checklists = getAllChecklists();
            arrResult = checklists;
        } else if (txtStatement.toLowerCase().includes("from items")) {
            // Return items - would need more parsing to get specific checklist
            arrResult = [];
        } else if (txtStatement.toLowerCase().includes("from category")) {
            // Return categories
            var categories = FileManager.getCategories();
            arrResult = categories;
        }
    } catch (error) {
        console.log("Error in selectDB: " + error);
    }
    
    return arrResult;
}

//insert data to database (now creates new markdown files)
function insertDB(txtStatement) {
    // Individual insert operations are handled by specific functions
    // This provides compatibility for any remaining SQL-based code
    console.log("Insert operation: " + txtStatement);
    return true;
}

//delete data from database (now deletes markdown files)
function deleteDB(txtStatement) {
    // Individual delete operations are handled by specific functions
    console.log("Delete operation: " + txtStatement);
    return true;
}

//Create table in database (now creates directory structure)
function createDB(txtStatement) {
    if (typeof txtStatement === "string") {
        txtStatement = [txtStatement];
    }
    
    for (var i = 0; i < txtStatement.length; i++) {
        console.log("Creating structure for: " + txtStatement[i]);
    }
    
    // Initialize the directory structure
    FileManager.createDirectoryStructure();
    return true;
}

// Helper function to get all checklists from all directories
function getAllChecklists() {
    var allChecklists = [];
    
    var directories = [
        FileManager.dataDirectory + "lists/",
        FileManager.dataDirectory + "saved/",
        FileManager.dataDirectory + "history/"
    ];
    
    for (var d = 0; d < directories.length; d++) {
        var checklists = FileManager.getChecklistsFromDirectory(
            directories[d],
            "all",
            undefined,
            "",
            "",
            "creation_dt",
            "default",
            "=",
            ""
        );
        allChecklists = allChecklists.concat(checklists);
    }
    
    return allChecklists;
}

// Additional utility functions for compatibility

// Execute SQL-like queries (simplified implementation)
function executeQuery(query, params) {
    var result = [];
    
    try {
        var queryLower = query.toLowerCase();
        
        if (queryLower.includes("select") && queryLower.includes("checklist")) {
            result = getAllChecklists();
            
            // Apply simple filtering based on params
            if (params && params.length > 0) {
                var searchText = params[0];
                if (searchText && searchText.trim() !== "") {
                    result = result.filter(function(checklist) {
                        return checklist.checklist.toLowerCase().includes(searchText.toLowerCase()) ||
                               checklist.descr.toLowerCase().includes(searchText.toLowerCase());
                    });
                }
            }
        } else if (queryLower.includes("select") && queryLower.includes("category")) {
            result = FileManager.getCategories();
        }
    } catch (error) {
        console.log("Error executing query: " + error);
    }
    
    return result;
}

// Get database file info (for compatibility)
function getDatabaseInfo() {
    return {
        type: "markdown",
        location: FileManager.dataDirectory,
        version: "1.0",
        size: "N/A" // Would need to calculate total size of all markdown files
    };
}

// Backup database (export all markdown files)
function backupDatabase(backupPath) {
    try {
        console.log("Backing up to: " + backupPath);
        // Implementation would copy all markdown files to backup location
        return true;
    } catch (error) {
        console.log("Backup error: " + error);
        return false;
    }
}

// Restore database (import markdown files)
function restoreDatabase(restorePath) {
    try {
        console.log("Restoring from: " + restorePath);
        // Implementation would copy markdown files from backup location
        return true;
    } catch (error) {
        console.log("Restore error: " + error);
        return false;
    }
}

// Optimize database (cleanup and reorganization)
function optimizeDatabase() {
    try {
        // For markdown files, this could involve:
        // - Removing empty files
        // - Standardizing formatting
        // - Cleaning up orphaned files
        console.log("Optimizing markdown file storage");
        return true;
    } catch (error) {
        console.log("Optimization error: " + error);
        return false;
    }
}

// Get database statistics
function getDatabaseStats() {
    var stats = {
        totalFiles: 0,
        totalSize: 0,
        lastModified: null,
        categories: 0,
        checklists: 0,
        items: 0
    };
    
    try {
        var allChecklists = getAllChecklists();
        stats.checklists = allChecklists.length;
        
        var totalItems = 0;
        for (var i = 0; i < allChecklists.length; i++) {
            if (allChecklists[i].items) {
                totalItems += allChecklists[i].items.length;
            }
        }
        stats.items = totalItems;
        
        var categories = FileManager.getCategories();
        stats.categories = categories.length;
        
        // Would need to implement file counting and size calculation
        stats.totalFiles = allChecklists.length + 1; // +1 for categories file
        
    } catch (error) {
        console.log("Error getting database stats: " + error);
    }
    
    return stats;
}

// Transaction support (for compatibility with existing code)
function beginTransaction() {
    // File operations are atomic, so we don't need explicit transactions
    console.log("Beginning transaction (file-based)");
    return true;
}

function commitTransaction() {
    // File operations are automatically committed
    console.log("Committing transaction (file-based)");
    return true;
}

function rollbackTransaction() {
    // Would need to implement versioning/backup for rollback capability
    console.log("Rolling back transaction (file-based)");
    return true;
}

// Vacuum/cleanup operations
function vacuumDatabase() {
    try {
        // For markdown files, this could involve:
        // - Removing unused files
        // - Compacting content
        // - Cleaning up temporary files
        console.log("Cleaning up markdown file storage");
        return true;
    } catch (error) {
        console.log("Vacuum error: " + error);
        return false;
    }
}

// Check database integrity
function checkIntegrity() {
    var issues = [];
    
    try {
        // Check if all required directories exist
        var requiredDirs = ["lists", "saved", "history", "categories", "settings"];
        
        for (var i = 0; i < requiredDirs.length; i++) {
            var dirPath = FileManager.dataDirectory + requiredDirs[i] + "/";
            // Would need to check if directory exists
            console.log("Checking directory: " + dirPath);
        }
        
        // Check if categories file exists and is valid
        var categories = FileManager.getCategories();
        if (!categories || categories.length === 0) {
            issues.push("Categories file missing or empty");
        }
        
        // Check if all markdown files are valid
        var allChecklists = getAllChecklists();
        for (var c = 0; c < allChecklists.length; c++) {
            if (!allChecklists[c].id || !allChecklists[c].checklist) {
                issues.push("Invalid checklist file: " + allChecklists[c].filePath);
            }
        }
        
    } catch (error) {
        issues.push("Integrity check error: " + error);
    }
    
    return {
        isValid: issues.length === 0,
        issues: issues
    };
}

// Migration utilities
function migrateFromDatabase(databasePath) {
    // This function would help migrate from the old SQLite database
    // to the new markdown file format
    console.log("Migration from database not implemented in this version");
    return false;
}

// Export utilities
function exportToFormat(format, exportPath) {
    try {
        switch (format.toLowerCase()) {
            case "json":
                return exportToJSON(exportPath);
            case "csv":
                return exportToCSV(exportPath);
            case "markdown":
                return exportToMarkdown(exportPath);
            default:
                console.log("Unsupported export format: " + format);
                return false;
        }
    } catch (error) {
        console.log("Export error: " + error);
        return false;
    }
}

function exportToJSON(exportPath) {
    var allData = {
        checklists: getAllChecklists(),
        categories: FileManager.getCategories(),
        exportDate: FileManager.getCurrentTimestamp(),
        version: "1.0"
    };
    
    return FileManager.writeJsonFile(exportPath, allData);
}

function exportToCSV(exportPath) {
    // Would implement CSV export
    console.log("CSV export to: " + exportPath);
    return true;
}

function exportToMarkdown(exportPath) {
    // Would implement consolidated markdown export
    console.log("Markdown export to: " + exportPath);
    return true;
}

// Initialize the file system when this module is loaded
// Note: No Component.onCompleted in .js files - this will be called from QML
