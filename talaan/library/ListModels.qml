import QtQuick 2.4
import "../library/DataProcess.js" as DataProcess
import "../library/ProcessFunc.js" as Process

// Corrected ListModels.qml that maintains the same structure as the original
// This should be an Item containing multiple ListModel children

Item {
    id: root

    // Categories model
    ListModel {
        id: modelCategories
        property string loadingStatus: "Null"

        function getCategories() {
            loadingStatus = "Loading"
            modelCategories.clear()

            try {
                var categories = DataProcess.getCategories()
                
                for (var i = 0; i < categories.length; i++) {
                    var category = categories[i]
                    modelCategories.append({
                        categoryname: category.name,
                        descr: category.descr,
                        colorValue: category.colorValue || "#3498db"
                    })
                }

                // Add "Uncategorized" if not present
                var foundUncategorized = false
                for (var j = 0; j < modelCategories.count; j++) {
                    if (modelCategories.get(j).categoryname === "Uncategorized") {
                        foundUncategorized = true
                        break
                    }
                }
                
                if (!foundUncategorized) {
                    modelCategories.append({
                        categoryname: "Uncategorized",
                        descr: "Uncategorized lists",
                        colorValue: "white"
                    })
                }

                loadingStatus = "Finished"
            } catch (error) {
                console.log("Error loading categories: " + error)
                loadingStatus = "Error"
            }
        }

        function getColor(category) {
            for (var i = 0; i < modelCategories.count; i++) {
                if (modelCategories.get(i).categoryname === category) {
                    return modelCategories.get(i).colorValue || "white"
                }
            }
            return "white"
        }

        function addAddNew() {
            modelCategories.insert(0, {
                categoryname: i18n.tr("Add new"),
                descr: "add new",
                icon: "default"
            })
        }

        function removeAddNew() {
            if (modelCategories.count > 0 && modelCategories.get(0).categoryname === i18n.tr("Add new")) {
                modelCategories.remove(0)
            }
        }
    }

    // Main checklist model
    ListModel {
        id: modelChecklist
        property string loadingStatus: "Null"

        function findChecklistIndex(id) {
            for (var i = 0; i < modelChecklist.count; i++) {
                if (id === modelChecklist.get(i).id) {
                    return i
                }
            }
            return -1
        }

        function updateTotal(checklistid, newTotal) {
            var index = findChecklistIndex(checklistid)
            if (index > -1) {
                modelChecklist.setProperty(index, "total", newTotal)
            }
        }

        function updateCheckedCount(checklistid, newCheckedCount) {
            var index = findChecklistIndex(checklistid)
            if (index > -1) {
                modelChecklist.setProperty(index, "completed", newCheckedCount)
            }
        }

        function removeItem(checklistid) {
            var index = findChecklistIndex(checklistid)
            if (index > -1) {
                modelChecklist.remove(index, 1)
            }
        }

        function getChecklists(purpose, favorite, group, filter, order, searchMode, searchCondition, searchText) {
            loadingStatus = "Loading"
            modelChecklist.clear()

            try {
                var checklists = []
                
                // Get checklists based on purpose
                switch (purpose) {
                    case "saved":
                        checklists = DataProcess.getSavedChecklists(searchText)
                        break
                    case "history":
                        checklists = DataProcess.getHistoryChecklists(searchText)
                        break
                    case "favorites":
                        checklists = DataProcess.getFavoriteChecklists()
                        break
                    default:
                        checklists = DataProcess.getDBChecklists("", searchText ? [searchText] : [])
                        break
                }

                // Apply additional filters
                if (favorite !== undefined) {
                    checklists = checklists.filter(function(checklist) {
                        return checklist.favorite === favorite
                    })
                }

                // Apply search filters
                if (searchText && searchText.trim() !== "") {
                    var searchLower = searchText.toLowerCase()
                    checklists = checklists.filter(function(checklist) {
                        switch (searchMode) {
                            case "category":
                                return checklist.category.toLowerCase() === searchLower
                            default:
                                return checklist.checklist.toLowerCase().indexOf(searchLower) > -1 ||
                                       checklist.descr.toLowerCase().indexOf(searchLower) > -1
                        }
                    })
                }

                // Sort results
                checklists.sort(function(a, b) {
                    switch (order) {
                        case "name":
                            return a.checklist.localeCompare(b.checklist)
                        case "category":
                            return a.category.localeCompare(b.category)
                        case "creation_dt":
                            return new Date(b.creation_dt) - new Date(a.creation_dt)
                        case "target_dt":
                            if (!a.target_dt && !b.target_dt) return 0
                            if (!a.target_dt) return 1
                            if (!b.target_dt) return -1
                            return new Date(a.target_dt) - new Date(b.target_dt)
                        default:
                            return new Date(b.creation_dt) - new Date(a.creation_dt)
                    }
                })

                // Add to model
                for (var i = 0; i < checklists.length; i++) {
                    var checklist = checklists[i]
                    modelChecklist.append({
                        id: checklist.id,
                        checklist: checklist.checklist,
                        descr: checklist.descr,
                        category: checklist.category,
                        creation_dt: checklist.creation_dt,
                        completion_dt: checklist.completion_dt,
                        status: checklist.status,
                        target_dt: checklist.target_dt,
                        continual: checklist.continual,
                        favorite: checklist.favorite || 0,
                        completed: checklist.completed || 0,
                        total: checklist.total || 0
                    })
                }

                loadingStatus = "Finished"

            } catch (error) {
                console.log("Error loading checklists: " + error)
                loadingStatus = "Error"
            }
        }
    }

    // Checklist items model
    ListModel {
        id: modelChecklistItems
        property string loadingStatus: "Null"

        function getItems(checklistId, status, searchText, sortOrder) {
            loadingStatus = "Loading"
            modelChecklistItems.clear()

            try {
                var items = DataProcess.getItems(checklistId, status, searchText, sortOrder)

                for (var i = 0; i < items.length; i++) {
                    var item = items[i]
                    modelChecklistItems.append({
                        index: i,
                        checklist_id: checklistId,
                        checklist: item.checklist,
                        name: item.name,
                        comments: item.comments || "",
                        status: item.status,
                        priority: item.priority || "Normal"
                    })
                }

                loadingStatus = "Finished"

            } catch (error) {
                console.log("Error loading items: " + error)
                loadingStatus = "Error"
            }
        }
    }

    // Targets model (checklists with target dates)
    ListModel {
        id: modelTargets
        property string loadingStatus: "Null"

        function getTargets() {
            loadingStatus = "Loading"
            modelTargets.clear()

            try {
                var targets = DataProcess.getTargets()

                for (var i = 0; i < targets.length; i++) {
                    var target = targets[i]
                    modelTargets.append({
                        id: target.id,
                        checklist: target.checklist,
                        target_dt: target.target_dt,
                        status: target.status,
                        overdue: target.overdue || false,
                        reminder: target.reminder || false
                    })
                }

                // Update overdue status
                updateOverdueStatus()
                loadingStatus = "Finished"

            } catch (error) {
                console.log("Error loading targets: " + error)
                loadingStatus = "Error"
            }
        }

        function updateOverdueStatus() {
            var today = new Date(Process.getToday())
            
            for (var i = 0; i < modelTargets.count; i++) {
                var targetDate = new Date(modelTargets.get(i).target_dt)
                var isOverdue = targetDate < today
                modelTargets.setProperty(i, "overdue", isOverdue)
            }
        }
    }

    // Worker script loaders (compatibility with existing code)
    WorkerScript {
        id: workerLoaderChecklist
        source: Qt.resolvedUrl("../library/DBWorker.js")

        onMessage: {
            // Handle worker messages if needed
            console.log("Worker message received for checklists")
        }
    }

    WorkerScript {
        id: workerLoaderTargets  
        source: Qt.resolvedUrl("../library/DBWorker.js")

        onMessage: {
            // Handle worker messages if needed
            console.log("Worker message received for targets")
        }
    }

    // Expose the models as properties for external access
    property alias modelCategories: modelCategories
    property alias modelChecklist: modelChecklist
    property alias modelChecklistItems: modelChecklistItems
    property alias modelTargets: modelTargets

    // Initialize models when component is loaded
    Component.onCompleted: {
        console.log("ListModels initialized")
        
        // Initialize the data system
        DataProcess.initializeSystem()
        
        // Load initial data
        modelCategories.getCategories()
    }
}
