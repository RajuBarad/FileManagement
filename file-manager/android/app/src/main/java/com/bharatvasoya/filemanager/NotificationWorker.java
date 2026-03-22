package com.bharatvasoya.filemanager;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class NotificationWorker extends Worker {

    public NotificationWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        // Fetch notifications from PHP API
        // WARNING: Localhost (127.0.0.1) won't work on Android. Use PC IP or Domain.
        // We use the domain configured: https://driveapi.bharatvasoya.com
        // Or hardcode the IP if dev mode. Assuming domain for "True" PWA experience.
        
        try {
            // Replace with your actual API endpoint or IP
            // If testing locally, ensure this IP is correct and reachable from phone
             String apiUrl = "http://192.168.1.101/YashElectronics/FileManager/FileManagement/PHP-API/notifications/get_notifications.php?userId=1"; 
             // Note: Hardcoding userId=1 for demo background service. 
             // In production, you'd pass userId via inputData or SharedPreferences.

            URL url = new URL(apiUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000);
            
            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                String inputLine;
                StringBuilder content = new StringBuilder();
                while ((inputLine = in.readLine()) != null) {
                    content.append(inputLine);
                }
                in.close();
                
                String json = content.toString();
                // Simple check if there are notifications (array length > 0)
                // A robust JSON parser (Keys/Gson) would be better but keeping it simple for no-dep.
                if (json.contains("\"id\":") && !json.equals("[]")) {
                     showNotification("You have new unseen tasks!", "Check your dashboard for details.");
                }
            }
            conn.disconnect();
            
        } catch (Exception e) {
            e.printStackTrace();
            return Result.failure();
        }

        return Result.success();
    }

    private void showNotification(String title, String message) {
        NotificationManager manager = (NotificationManager) getApplicationContext().getSystemService(Context.NOTIFICATION_SERVICE);
        String channelId = "task_channel";

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(channelId, "Task Notifications", NotificationManager.IMPORTANCE_DEFAULT);
            manager.createNotificationChannel(channel);
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(getApplicationContext(), channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_info) // Default icon, replace with app icon if valid resource id
                .setContentTitle(title)
                .setContentText(message)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setAutoCancel(true);

        // Notify with a random ID or fixed ID
        manager.notify(101, builder.build());
    }
}
