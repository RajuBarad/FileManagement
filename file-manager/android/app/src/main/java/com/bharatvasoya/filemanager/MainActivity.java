package com.bharatvasoya.filemanager;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.ExistingPeriodicWorkPolicy;
import java.util.concurrent.TimeUnit;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Schedule Background Notification Worker (Every 15 mins)
        try {
             PeriodicWorkRequest workRequest = new PeriodicWorkRequest.Builder(NotificationWorker.class, 15, TimeUnit.MINUTES)
                .build();

            WorkManager.getInstance(this).enqueueUniquePeriodicWork(
                "PollingWorker",
                ExistingPeriodicWorkPolicy.KEEP,
                workRequest
            );
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
