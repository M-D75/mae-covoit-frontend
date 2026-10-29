package com.maecovoit.app;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.location.*;
import android.os.*;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import org.json.*;
import java.net.*;
import java.io.*;
import java.util.concurrent.*;

public class TripTrackingService extends Service implements LocationListener {
    static final String STOP = "com.maecovoit.app.STOP_TRACKING";
    static volatile TripTrackingPlugin listener;
    private static volatile boolean active;
    private static volatile String reason = "stopped", owner = "";
    private static volatile int trip;
    private static volatile long expires;
    private static volatile Location latest;
    private static volatile TripTrackingService current;
    private LocationManager locations;
    private ScheduledExecutorService worker;
    private volatile String endpoint = "", token = "";
    private long sequence;
    private final Handler main = new Handler(Looper.getMainLooper());
    static boolean validEndpoint(String value) {
        try { URL u = new URL(value); return u.getProtocol().equals("https") && u.getHost().length() > 0
            && u.getUserInfo() == null && u.getQuery() == null && u.getRef() == null && u.getPath().endsWith("/native-tracking/position"); }
        catch (Exception ignored) { return false; }
    }
    static JSObject status() {
        JSObject s = new JSObject(); s.put("active", active); s.put("reason", reason); s.put("tripId", trip);
        s.put("userId", owner); s.put("expiresAt", expires);
        Location p = latest;
        if (p != null && System.currentTimeMillis() - p.getTime() <= 15000) s.put("position", packet(p, 0));
        return s;
    }
    private static JSObject packet(Location l, long seq) {
        JSObject p = new JSObject(); JSONArray coords = new JSONArray(java.util.Arrays.asList(l.getLatitude(), l.getLongitude()));
        p.put("latLng", coords); p.put("accuracyMeters", l.hasAccuracy() ? l.getAccuracy() : -1);
        p.put("heading", l.hasBearing() ? l.getBearing() : 0); p.put("speedKmh", l.hasSpeed() ? l.getSpeed()*3.6 : 0);
        p.put("timestamp", l.getTime()); p.put("sequence", seq); p.put("source", "gps"); return p;
    }
    @Override public void onCreate() {
        super.onCreate(); current = this; locations = (LocationManager)getSystemService(LOCATION_SERVICE);
        worker = Executors.newSingleThreadScheduledExecutor();
    }
    private void showForeground() {
        NotificationManager manager = (NotificationManager)getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26) manager.createNotificationChannel(new NotificationChannel("trip_tracking", "Suivi du trajet", NotificationManager.IMPORTANCE_LOW));
        Intent stop = new Intent(this, TripTrackingService.class).setAction(STOP);
        PendingIntent action = PendingIntent.getService(this, 0, stop, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        PendingIntent open = PendingIntent.getActivity(this, 1, new Intent(this, MainActivity.class), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification notification = new NotificationCompat.Builder(this,"trip_tracking").setSmallIcon(R.drawable.ic_trip_tracking)
            .setContentTitle("Covia · partage de position").setContentText("Suivi du trajet actif, même écran verrouillé.")
            .setOngoing(true).setContentIntent(open).addAction(0,"Arrêter",action).setCategory(NotificationCompat.CATEGORY_SERVICE).build();
        if (Build.VERSION.SDK_INT >= 29) startForeground(3104, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
        else startForeground(3104, notification);
    }
    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || STOP.equals(intent.getAction())) { finish("stopped"); return START_NOT_STICKY; }
        if (active) { finish("replaced"); return START_NOT_STICKY; } // JS explicitly stops before reconfiguration.
        endpoint = intent.getStringExtra("endpoint"); token = intent.getStringExtra("token");
        expires = intent.getLongExtra("expiresAt",0); trip = intent.getIntExtra("tripId",0); owner = intent.getStringExtra("userId");
        if (!validEndpoint(endpoint) || token == null || !token.matches("nt_[A-Za-z0-9_-]{43}") || expires <= System.currentTimeMillis()) { finish("invalid"); return START_NOT_STICKY; }
        try {
            boolean fine = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
            boolean coarse = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
            if (!fine && !coarse) { finish("permission"); return START_NOT_STICKY; }
            showForeground();
            boolean requested = false;
            if (fine && locations.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locations.requestLocationUpdates(LocationManager.GPS_PROVIDER,5000,10,this,Looper.getMainLooper()); requested = true;
            }
            if (locations.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locations.requestLocationUpdates(LocationManager.NETWORK_PROVIDER,5000,10,this,Looper.getMainLooper()); requested = true;
            }
            if (!requested) { finish("location_unavailable"); return START_NOT_STICKY; }
            active = true; reason = "active"; notifyStatus();
            worker.scheduleWithFixedDelay(this::transmit,0,15,TimeUnit.SECONDS);
        } catch (Exception ignored) { finish("permission"); }
        return START_NOT_STICKY; // No restart after force quit, reboot or process death, no credential on disk.
    }
    @Override public void onLocationChanged(Location location) {
        long age = System.currentTimeMillis() - location.getTime();
        if (current != this || !active || age < -2000 || age > 15000 || !location.hasAccuracy() || location.getAccuracy() < 0) return;
        latest = new Location(location);
        TripTrackingPlugin p = listener; if (p != null) p.event("position", packet(location, 0));
    }
    private void transmit() {
        if (current != this || !active) return;
        if (System.currentTimeMillis() >= expires) { main.post(() -> finish("expired")); return; }
        Location p = latest;
        String body = p != null && System.currentTimeMillis() - p.getTime() <= 15000 ? packet(p,++sequence).toString() : "{}";
        int status = request("POST", endpoint, token, body);
        if (current != this || !active) return;
        if (status == 401 || status == 403 || status == 410) main.post(() -> finish("server_ended"));
        else { reason = status >= 200 && status < 300 ? "active" : "network"; notifyStatus(); }
    }
    static int request(String method, String endpoint, String token, String body) {
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection)new URL(endpoint).openConnection(); c.setInstanceFollowRedirects(false);
            c.setConnectTimeout(10000); c.setReadTimeout(10000); c.setRequestMethod(method);
            c.setRequestProperty("Authorization", "Bearer " + token); c.setRequestProperty("Content-Type","application/json");
            c.setUseCaches(false);
            if (body != null) { c.setDoOutput(true); try(OutputStream out=c.getOutputStream()) { out.write(body.getBytes(java.nio.charset.StandardCharsets.UTF_8)); } }
            return c.getResponseCode();
        } catch(Exception noNetwork) { return 0; } finally { if(c!=null)c.disconnect(); }
    }
    private void notifyStatus() { TripTrackingPlugin p=listener; if(p!=null)p.event("status",status()); }
    private void finish(String why) {
        if (current != this) { stopSelf(); return; }
        String oldToken=token, oldEndpoint=endpoint;
        active=false; reason=why; token=""; latest=null; expires=0;
        try { locations.removeUpdates(this); } catch(Exception ignored) {}
        if(worker!=null)worker.shutdownNow();
        if(oldToken!=null && !oldToken.isEmpty() && validEndpoint(oldEndpoint))
            new Thread(() -> request("DELETE",oldEndpoint.replaceFirst("/position$","/session"),oldToken,null),"CoviaStopTracking").start();
        notifyStatus(); stopForeground(true); stopSelf();
    }
    @Override public void onTaskRemoved(Intent rootIntent) { finish("task_removed"); }
    @Override public void onDestroy() { if(current == this && active)finish("destroyed"); if(worker!=null)worker.shutdownNow(); super.onDestroy(); }
    @Override public IBinder onBind(Intent intent) { return null; }
    @Override public void onProviderDisabled(String provider) { reason="location_unavailable"; notifyStatus(); }
    @Override public void onProviderEnabled(String provider) {}
    @Override public void onStatusChanged(String provider,int status,Bundle extras) {}
}
