<?php
class Mailer {
    private $logFile = "../debug_mail.log";

    public function __construct() {
        // SMTP Config could go here
    }

    public function sendTaskAssignment($toEmail, $taskTitle, $assignerName, $taskId) {
        $subject = "New Task Assigned: $taskTitle";
        // Simple HTML body
        $message = "
        <html>
        <head>
          <title>New Task Assignment</title>
        </head>
        <body>
          <h2>You have a new task!</h2>
          <p><strong>$assignerName</strong> has assigned you a new task:</p>
          <h3>$taskTitle</h3>
          <p>Click <a href='http://localhost:4200/tasks'>here</a> to view details.</p>
        </body>
        </html>
        ";

        // 1. Log to file (Reliable for demo/local)
        $logEntry = "--------------------------------------------------\n";
        $logEntry .= "DATE: " . date('Y-m-d H:i:s') . "\n";
        $logEntry .= "TO: $toEmail\n";
        $logEntry .= "SUBJECT: $subject\n";
        $logEntry .= "BODY: $message\n";
        file_put_contents($this->logFile, $logEntry, FILE_APPEND);

        // 2. Attempt Real Send (PHP mailer or simple mail() if configured)
        // headers
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'Content-type: text/html; charset=iso-8859-1';
        $headers[] = "To: <$toEmail>";
        $headers[] = "From: TaskManager <noreply@example.com>";

        // Suppress error to avoid breaking API if no SMTP server
        @mail($toEmail, $subject, $message, implode("\r\n", $headers));
        
        return true;
    }
}
?>
