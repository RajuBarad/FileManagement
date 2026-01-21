<?php
include_once 'config/db.php';

$sqlFile = 'update_db_versions.sql';
if (!file_exists($sqlFile)) {
    die("Error: SQL file not found.");
}

$sqlContent = file_get_contents($sqlFile);

// Split by GO command as sqlsrv_query doesn't support GO
$queries = preg_split('/^GO\s*$/m', $sqlContent);

foreach ($queries as $query) {
    $query = trim($query);
    if (empty($query)) continue;

    $stmt = sqlsrv_query($conn, $query);
    if ($stmt === false) {
        echo "Error executing query: <br>";
        echo "<pre>$query</pre><br>";
        print_r(sqlsrv_errors());
        echo "<hr>";
    } else {
        echo "Successfully executed query.<br>";
        
        // Check for print output?
        // sqlsrv doesn't easily return PRINT output unless consuming stream, 
        // but success message is enough.
    }
}

echo "Migration completed.";
?>
