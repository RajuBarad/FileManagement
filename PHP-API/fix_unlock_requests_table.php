<?php
include_once 'config/db.php';

header('Content-Type: text/plain');

$queries = [
    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[UnlockRequests]') AND name = 'IsNotificationDismissed')
    BEGIN
        ALTER TABLE UnlockRequests ADD IsNotificationDismissed BIT DEFAULT 0;
    END"
];

foreach ($queries as $q) {
    if(sqlsrv_query($conn, $q) === false) {
        echo "Error: ";
        print_r(sqlsrv_errors());
    } else {
        echo "Success\n";
    }
}
echo "Done.";
?>
