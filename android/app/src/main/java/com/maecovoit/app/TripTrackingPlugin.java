package com.maecovoit.app;

import android.Manifest;
import android.content.Intent;
import android.os.Build;
import androidx.core.content.ContextCompat;
import androidx.lifecycle.Lifecycle;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;

@CapacitorPlugin(name = "TripTracking", permissions = {
    @Permission(alias = "location", strings = {Manifest.permission.ACCESS_COARSE_LOCATION}),
    @Permission(alias = "precise", strings = {Manifest.permission.ACCESS_FINE_LOCATION}),
    @Permission(alias = "notifications", strings = {Manifest.permission.POST_NOTIFICATIONS})
})
public class TripTrackingPlugin extends Plugin {
    private PluginCall pending;
    private void reject(PluginCall call, String message) { if (pending == call) pending = null; call.reject(message); }
    @Override public void load() { TripTrackingService.listener = this; }
    @PluginMethod public void start(PluginCall call) {
        if (pending != null) { reject(call, "Activation en cours."); return; }
        pending = call;
        if (!getActivity().getLifecycle().getCurrentState().isAtLeast(Lifecycle.State.STARTED)) {
            reject(call, "Ouvrez l’application pour activer le suivi."); return;
        }
        if (getPermissionState("location") != PermissionState.GRANTED) {
            requestPermissionForAliases(new String[]{"location", "precise"}, call, "locationResult"); return;
        }
        locationResult(call);
    }
    @PermissionCallback private void locationResult(PluginCall call) {
        if (pending != call) { reject(call,"Activation arrêtée."); return; }
        if (getPermissionState("location") != PermissionState.GRANTED) { reject(call, "Localisation non autorisée."); return; }
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "notificationResult"); return;
        }
        notificationResult(call);
    }
    @PermissionCallback private void notificationResult(PluginCall call) {
        if (pending != call) { reject(call,"Activation arrêtée."); return; }
        if (!getActivity().getLifecycle().getCurrentState().isAtLeast(Lifecycle.State.STARTED)) { reject(call,"Ouvrez l’application pour activer le suivi."); return; }
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED) {
            reject(call, "Autorisez la notification de suivi pour continuer."); return;
        }
        String url = call.getString("endpoint", ""), token = call.getString("token", "");
        Long expires = call.getLong("expiresAt");
        Integer tripId = call.getInt("tripId");
        if (!TripTrackingService.validEndpoint(url) || !token.matches("nt_[A-Za-z0-9_-]{43}") || expires == null || expires <= System.currentTimeMillis() || tripId == null) {
            reject(call, "Configuration de suivi invalide (serveur HTTPS requis)."); return;
        }
        try {
            Intent intent = new Intent(getContext(), TripTrackingService.class);
            intent.putExtra("endpoint", url).putExtra("token", token).putExtra("expiresAt", expires)
                .putExtra("tripId", tripId).putExtra("userId", call.getString("userId", ""));
            ContextCompat.startForegroundService(getContext(), intent);
            new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> { if (pending == call) { reject(call,"Le service de suivi n’a pas démarré."); getContext().stopService(new Intent(getContext(), TripTrackingService.class)); } }, 10000);
        } catch (Exception ignored) { reject(call, "Le service de suivi ne peut pas démarrer. Vérifiez les autorisations."); }
    }
    @PluginMethod public void stop(PluginCall call) {
        if (pending != null) { pending.reject("Suivi arrêté."); pending = null; }
        getContext().stopService(new Intent(getContext(), TripTrackingService.class));
        android.os.Handler handler = new android.os.Handler(android.os.Looper.getMainLooper());
        handler.postDelayed(new Runnable() { int tries = 0; public void run() {
            if (!TripTrackingService.status().optBoolean("active")) call.resolve();
            else if (++tries < 40) handler.postDelayed(this,50);
            else call.reject("L’arrêt du service n’est pas confirmé.");
        } },50);
    }
    @PluginMethod public void getStatus(PluginCall call) { call.resolve(TripTrackingService.status()); }
    void event(String name, JSObject data) {
        if (name.equals("status") && pending != null) {
            PluginCall call = pending; pending = null;
            if (data.optBoolean("active")) call.resolve(); else call.reject("Suivi indisponible : " + data.optString("reason"));
        }
        notifyListeners(name, data);
    }
    @Override protected void handleOnDestroy() { if (TripTrackingService.listener == this) TripTrackingService.listener = null; }
}
