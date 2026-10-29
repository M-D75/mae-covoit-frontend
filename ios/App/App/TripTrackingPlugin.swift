import Foundation
import UIKit
import CoreLocation
import Capacitor

@objc(TripTrackingPlugin)
public class TripTrackingPlugin: CAPPlugin, CAPBridgedPlugin, CLLocationManagerDelegate, URLSessionTaskDelegate {
    public let identifier = "TripTrackingPlugin"
    public let jsName = "TripTracking"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise)
    ]
    private lazy var manager: CLLocationManager = { let m = CLLocationManager(); m.delegate = self; return m }()
    private lazy var http: URLSession = {
        let c = URLSessionConfiguration.ephemeral
        c.timeoutIntervalForRequest = 10; c.timeoutIntervalForResource = 15
        c.urlCache = nil; c.httpShouldSetCookies = false
        return URLSession(configuration: c, delegate: self, delegateQueue: nil)
    }()
    private var pending: CAPPluginCall?
    private var endpoint: URL?, token = "", userId = "", tripId = 0, expiresAt: Double = 0
    private var active = false, reason = "stopped", latest: CLLocation?, sequence = 0
    private var heartbeat: Timer?, request: URLSessionDataTask?
    private var backgroundTask: UIBackgroundTaskIdentifier = .invalid
    private var publishing = false, epoch = 0

    @objc public func start(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard UIApplication.shared.applicationState != .background, !self.active, self.pending == nil else { call.reject("Ouvrez l’application et arrêtez le suivi précédent."); return }
            guard CLLocationManager.locationServicesEnabled() else { call.reject("Activez la localisation dans Réglages."); return }
            let status = CLLocationManager.authorizationStatus()
            if status == .notDetermined { self.pending = call; self.manager.requestWhenInUseAuthorization(); return }
            self.begin(call)
        }
    }
    private func begin(_ call: CAPPluginCall) {
        let status = CLLocationManager.authorizationStatus()
        guard status == .authorizedWhenInUse || status == .authorizedAlways else { call.reject("Localisation non autorisée. Modifiez Réglages pour partager votre position."); return }
        guard UIApplication.shared.applicationState != .background,
              let value = call.getString("endpoint"), let url = URL(string: value), url.scheme == "https", url.host != nil,
              url.user == nil, url.password == nil, url.query == nil, url.fragment == nil, url.path.hasSuffix("/native-tracking/position"),
              let credential = call.getString("token"), credential.range(of: "^nt_[A-Za-z0-9_-]{43}$", options: .regularExpression) != nil,
              let expiry = call.getDouble("expiresAt"), expiry > Date().timeIntervalSince1970 * 1000,
              let trip = call.getInt("tripId") else { call.reject("Configuration de suivi invalide (HTTPS requis)."); return }
        self.endpoint = url; self.token = credential; self.expiresAt = expiry; self.tripId = trip; self.userId = call.getString("userId") ?? ""
        self.epoch += 1; self.lastSent = .distantPast; self.sequence = 0; self.active = true; self.reason = "active"
        manager.desiredAccuracy = kCLLocationAccuracyBest; manager.distanceFilter = 10
        manager.activityType = call.getString("role") == "driver" ? .automotiveNavigation : .otherNavigation
        manager.pausesLocationUpdatesAutomatically = false
        manager.allowsBackgroundLocationUpdates = true; manager.showsBackgroundLocationIndicator = true
        manager.startUpdatingLocation()
        heartbeat = Timer.scheduledTimer(withTimeInterval: 15, repeats: true) { [weak self] _ in self?.transmit() }
        transmit(); emitStatus(); call.resolve()
    }
    public func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        if let call = pending, status != .notDetermined { pending = nil; begin(call) }
        if active && status != .authorizedAlways && status != .authorizedWhenInUse { finish("permission") }
    }
    public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard active, let point = locations.last, point.horizontalAccuracy >= 0,
              abs(point.timestamp.timeIntervalSinceNow) <= 15 else { return }
        latest = point; notifyListeners("position", data: packet(point, sequence: 0)); transmit()
    }
    public func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        if (error as? CLError)?.code == .denied { finish("permission") }
        else { reason = "location_unavailable"; emitStatus() }
    }
    private func packet(_ point: CLLocation, sequence: Int) -> [String: Any] {
        return ["latLng": [point.coordinate.latitude, point.coordinate.longitude], "accuracyMeters": point.horizontalAccuracy,
                "timestamp": point.timestamp.timeIntervalSince1970 * 1000, "heading": max(0, point.course),
                "speedKmh": max(0, point.speed * 3.6), "sequence": sequence, "source": "gps"]
    }
    private var lastSent: Date = .distantPast
    private func transmit() {
        guard active, !publishing else { return }
        if Date().timeIntervalSince1970 * 1000 >= expiresAt { finish("expired"); return }
        guard Date().timeIntervalSince(lastSent) >= 5, let url = endpoint else { return }
        lastSent = Date(); sequence += 1
        let body: [String: Any]
        if let point = latest, abs(point.timestamp.timeIntervalSinceNow) <= 15 { body = packet(point, sequence: sequence) } else { body = [:] }
        var r = URLRequest(url: url); r.httpMethod = "POST"; r.cachePolicy = .reloadIgnoringLocalCacheData
        r.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization"); r.setValue("application/json", forHTTPHeaderField: "Content-Type")
        r.httpBody = try? JSONSerialization.data(withJSONObject: body)
        publishing = true
        backgroundTask = UIApplication.shared.beginBackgroundTask(withName: "CoviaPosition") { [weak self] in
            self?.request?.cancel(); self?.completeBackgroundTask()
        }
        let generation = epoch
        request = http.dataTask(with: r) { [weak self] _, response, _ in
            DispatchQueue.main.async {
                guard let self = self, self.epoch == generation else { return }; self.publishing = false; self.completeBackgroundTask()
                guard self.active else { return }
                let code = (response as? HTTPURLResponse)?.statusCode ?? 0
                if [401,403,410].contains(code) { self.finish("server_ended") }
                else { self.reason = (200..<300).contains(code) ? "active" : "network"; self.emitStatus() }
            }
        }; request?.resume()
    }
    private func completeBackgroundTask() {
        if backgroundTask != .invalid { UIApplication.shared.endBackgroundTask(backgroundTask); backgroundTask = .invalid }
    }
    @objc public func stop(_ call: CAPPluginCall) { DispatchQueue.main.async { self.finish("stopped"); call.resolve() } }
    private func finish(_ why: String) {
        pending?.reject("Suivi arrêté."); pending = nil
        let oldToken = token, oldEndpoint = endpoint
        epoch += 1; active = false; reason = why; token = ""; latest = nil; expiresAt = 0
        heartbeat?.invalidate(); heartbeat = nil; manager.stopUpdatingLocation(); manager.allowsBackgroundLocationUpdates = false
        request?.cancel(); request = nil; publishing = false; completeBackgroundTask()
        if !oldToken.isEmpty, let url = oldEndpoint?.deletingLastPathComponent().appendingPathComponent("session") {
            var r = URLRequest(url: url); r.httpMethod = "DELETE"; r.setValue("Bearer \(oldToken)", forHTTPHeaderField: "Authorization")
            http.dataTask(with: r).resume()
        }
        emitStatus()
    }
    private func status() -> [String: Any] {
        var result: [String: Any] = ["active": active, "reason": reason, "tripId": tripId, "userId": userId, "expiresAt": expiresAt]
        if let p = latest, abs(p.timestamp.timeIntervalSinceNow) <= 15 { result["position"] = packet(p, sequence: 0) }
        return result
    }
    private func emitStatus() { notifyListeners("status", data: status()) }
    @objc public func getStatus(_ call: CAPPluginCall) { DispatchQueue.main.async { call.resolve(self.status()) } }
    public func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse,
                           newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) { completionHandler(nil) }
}

class CoviaBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() { bridge?.registerPluginInstance(TripTrackingPlugin()) }
}
