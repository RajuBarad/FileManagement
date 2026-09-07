<?php
// PHP-API/permissions/get.php
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../config/db.php';

$userId = isset($_GET['userId']) ? intval($_GET['userId']) : 0;
if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Valid userId is required."]);
    exit;
}

// Check target user
$userSql = "SELECT Id, Username, Role FROM Users WHERE Id = ?";
$userStmt = sqlsrv_query($conn, $userSql, [$userId]);
if ($userStmt === false || !($targetUser = sqlsrv_fetch_array($userStmt, SQLSRV_FETCH_ASSOC))) {
    http_response_code(404);
    echo json_encode(["status" => "error", "message" => "User not found."]);
    exit;
}

$isAdmin = (strtolower($targetUser['Role'] ?? '') === 'admin');

// Standard Modules definitions with granular operations
$allModules = [
    // Core Modules
    [
        "moduleKey" => "files",
        "moduleName" => "Files & Folders",
        "category" => "Core",
        "description" => "Browse, upload, share, download, star, move, rename, and delete files",
        "availableOperations" => [
            ["key" => "view", "label" => "View / Browse"],
            ["key" => "upload", "label" => "Upload / New Folder"],
            ["key" => "share", "label" => "Share"],
            ["key" => "download", "label" => "Download"],
            ["key" => "star", "label" => "Add to Starred"],
            ["key" => "move", "label" => "Move"],
            ["key" => "rename", "label" => "Rename"],
            ["key" => "delete", "label" => "Delete"]
        ]
    ],
    [
        "moduleKey" => "tasks",
        "moduleName" => "Tasks Dashboard",
        "category" => "Core",
        "description" => "Manage tasks, split sub-tasks, comments, status movements, and assignments",
        "availableOperations" => [
            ["key" => "view", "label" => "View Tasks"],
            ["key" => "add", "label" => "Add Task"],
            ["key" => "edit", "label" => "Edit Task"],
            ["key" => "delete", "label" => "Delete Task"],
            ["key" => "split", "label" => "Split (Sub-tasks)"],
            ["key" => "comment", "label" => "Comments"],
            ["key" => "move", "label" => "Move / Change Status"]
        ]
    ],
    [
        "moduleKey" => "followups",
        "moduleName" => "Followups Dashboard",
        "category" => "Core",
        "description" => "View, create, update, and delete client followups",
        "availableOperations" => [
            ["key" => "view", "label" => "View Followups"],
            ["key" => "add", "label" => "Add Followup"],
            ["key" => "edit", "label" => "Edit Followup"],
            ["key" => "delete", "label" => "Delete Followup"]
        ]
    ],
    [
        "moduleKey" => "history",
        "moduleName" => "User History / Logs",
        "category" => "Core",
        "description" => "View audit logs and user activity history across all modules",
        "availableOperations" => [
            ["key" => "view", "label" => "View Audit Logs"]
        ]
    ],
    [
        "moduleKey" => "users",
        "moduleName" => "User Management / Admin",
        "category" => "Core",
        "description" => "Manage user accounts, credentials, and module permissions",
        "availableOperations" => [
            ["key" => "view", "label" => "View Users"],
            ["key" => "add", "label" => "Add User"],
            ["key" => "edit", "label" => "Edit User"],
            ["key" => "delete", "label" => "Delete User"],
            ["key" => "permissions", "label" => "Manage Rights"]
        ]
    ],
    // Masters Modules
    [
        "moduleKey" => "master_country",
        "moduleName" => "Country Master",
        "category" => "Masters",
        "description" => "Manage country master records",
        "availableOperations" => [
            ["key" => "view", "label" => "View"],
            ["key" => "add", "label" => "Add"],
            ["key" => "edit", "label" => "Edit"],
            ["key" => "delete", "label" => "Delete"]
        ]
    ],
    [
        "moduleKey" => "master_state",
        "moduleName" => "State Master",
        "category" => "Masters",
        "description" => "Manage state master records",
        "availableOperations" => [
            ["key" => "view", "label" => "View"],
            ["key" => "add", "label" => "Add"],
            ["key" => "edit", "label" => "Edit"],
            ["key" => "delete", "label" => "Delete"]
        ]
    ],
    [
        "moduleKey" => "master_district",
        "moduleName" => "District Master",
        "category" => "Masters",
        "description" => "Manage district master records",
        "availableOperations" => [
            ["key" => "view", "label" => "View"],
            ["key" => "add", "label" => "Add"],
            ["key" => "edit", "label" => "Edit"],
            ["key" => "delete", "label" => "Delete"]
        ]
    ],
    [
        "moduleKey" => "master_taluka",
        "moduleName" => "Taluka Master",
        "category" => "Masters",
        "description" => "Manage taluka master records",
        "availableOperations" => [
            ["key" => "view", "label" => "View"],
            ["key" => "add", "label" => "Add"],
            ["key" => "edit", "label" => "Edit"],
            ["key" => "delete", "label" => "Delete"]
        ]
    ],
    [
        "moduleKey" => "master_village",
        "moduleName" => "Village Master",
        "category" => "Masters",
        "description" => "Manage village master records",
        "availableOperations" => [
            ["key" => "view", "label" => "View"],
            ["key" => "add", "label" => "Add"],
            ["key" => "edit", "label" => "Edit"],
            ["key" => "delete", "label" => "Delete"]
        ]
    ],
    [
        "moduleKey" => "master_channel",
        "moduleName" => "Channel Master",
        "category" => "Masters",
        "description" => "Manage channel master records",
        "availableOperations" => [
            ["key" => "view", "label" => "View"],
            ["key" => "add", "label" => "Add"],
            ["key" => "edit", "label" => "Edit"],
            ["key" => "delete", "label" => "Delete"]
        ]
    ],
    [
        "moduleKey" => "master_followup",
        "moduleName" => "Followup Master",
        "category" => "Masters",
        "description" => "Manage followup master records",
        "availableOperations" => [
            ["key" => "view", "label" => "View"],
            ["key" => "add", "label" => "Add"],
            ["key" => "edit", "label" => "Edit"],
            ["key" => "delete", "label" => "Delete"]
        ]
    ],
    [
        "moduleKey" => "master_scope_of_work",
        "moduleName" => "Scope of Work Master",
        "category" => "Masters",
        "description" => "Manage scope of work master records",
        "availableOperations" => [
            ["key" => "view", "label" => "View"],
            ["key" => "add", "label" => "Add"],
            ["key" => "edit", "label" => "Edit"],
            ["key" => "delete", "label" => "Delete"]
        ]
    ],
    [
        "moduleKey" => "master_client",
        "moduleName" => "Client Master",
        "category" => "Masters",
        "description" => "Manage client master records",
        "availableOperations" => [
            ["key" => "view", "label" => "View"],
            ["key" => "add", "label" => "Add"],
            ["key" => "edit", "label" => "Edit"],
            ["key" => "delete", "label" => "Delete"]
        ]
    ],
    [
        "moduleKey" => "master_application",
        "moduleName" => "Task / Application Master",
        "category" => "Masters",
        "description" => "Manage task/application master records",
        "availableOperations" => [
            ["key" => "view", "label" => "View"],
            ["key" => "add", "label" => "Add"],
            ["key" => "edit", "label" => "Edit"],
            ["key" => "delete", "label" => "Delete"]
        ]
    ]
];

// Fetch saved permissions
$permSql = "SELECT ModuleKey, CanView, CanAdd, CanUpdate, CanDelete, Operations FROM UserPermissions WHERE UserId = ?";
$permStmt = sqlsrv_query($conn, $permSql, [$userId]);

$savedPerms = [];
if ($permStmt !== false) {
    while ($row = sqlsrv_fetch_array($permStmt, SQLSRV_FETCH_ASSOC)) {
        $ops = [];
        if (!empty($row['Operations']) && $row['Operations'] !== '{}') {
            $decoded = json_decode($row['Operations'], true);
            if (is_array($decoded)) {
                $ops = $decoded;
            }
        }
        $savedPerms[$row['ModuleKey']] = [
            "canView" => (bool)$row['CanView'],
            "canAdd" => (bool)$row['CanAdd'],
            "canUpdate" => (bool)$row['CanUpdate'],
            "canDelete" => (bool)$row['CanDelete'],
            "operations" => $ops
        ];
    }
}

// Build final list with defaults
$result = [];
foreach ($allModules as $mod) {
    $key = $mod['moduleKey'];
    $availOps = $mod['availableOperations'];
    
    $opsState = [];
    $canView = false;
    $canAdd = false;
    $canUpdate = false;
    $canDelete = false;

    if (isset($savedPerms[$key])) {
        $saved = $savedPerms[$key];
        $canView = $saved['canView'];
        $canAdd = $saved['canAdd'];
        $canUpdate = $saved['canUpdate'];
        $canDelete = $saved['canDelete'];

        // Populate operations from saved JSON or fallback to standard columns
        foreach ($availOps as $op) {
            $opKey = $op['key'];
            if (isset($saved['operations'][$opKey])) {
                $opsState[$opKey] = (bool)$saved['operations'][$opKey];
            } else {
                // Infer from base columns if not specifically set in JSON
                if ($opKey === 'view') $opsState[$opKey] = $canView;
                else if (in_array($opKey, ['add', 'upload', 'split'])) $opsState[$opKey] = $canAdd;
                else if (in_array($opKey, ['edit', 'update', 'rename', 'move', 'permissions'])) $opsState[$opKey] = $canUpdate;
                else if ($opKey === 'delete') $opsState[$opKey] = $canDelete;
                else $opsState[$opKey] = $canView; // default view-based actions like share/download/comment to canView
            }
        }
    } else {
        // Defaults for brand new user
        $defaultFlag = false;
        if ($isAdmin) {
            $defaultFlag = true;
        } else {
            // Default core modules for regular user
            if (in_array($key, ["files", "tasks", "followups"])) {
                $defaultFlag = true;
            }
        }

        $canView = $defaultFlag;
        $canAdd = $defaultFlag;
        $canUpdate = $defaultFlag;
        $canDelete = $defaultFlag;

        foreach ($availOps as $op) {
            $opsState[$op['key']] = $defaultFlag;
        }
    }

    $result[] = [
        "moduleKey" => $key,
        "moduleName" => $mod['moduleName'],
        "category" => $mod['category'],
        "description" => $mod['description'],
        "availableOperations" => $availOps,
        "operations" => $opsState,
        "canView" => $canView,
        "canAdd" => $canAdd,
        "canUpdate" => $canUpdate,
        "canDelete" => $canDelete
    ];
}

echo json_encode([
    "status" => "success",
    "user" => [
        "id" => $targetUser['Id'],
        "name" => $targetUser['Username'],
        "role" => $targetUser['Role'],
        "isAdmin" => $isAdmin
    ],
    "permissions" => $result
]);
?>
