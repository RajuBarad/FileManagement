<?php
echo "System Temp Dir: " . sys_get_temp_dir() . "<br>";
echo "Upload Temp Dir (ini): " . ini_get('upload_tmp_dir') . "<br>";
echo "Current User: " . get_current_user() . "<br>";
echo "upload_max_filesize: " . ini_get('upload_max_filesize') . "<br>";
echo "post_max_size: " . ini_get('post_max_size') . "<br>";
echo "max_execution_time: " . ini_get('max_execution_time') . "<br>";
echo "memory_limit: " . ini_get('memory_limit') . "<br>";
?>
