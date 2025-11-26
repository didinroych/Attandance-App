import 'dart:async';
import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:mobile/providers/auth_providers.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

class FaceScanScreen extends StatefulWidget {
  const FaceScanScreen({super.key});

  @override
  State<FaceScanScreen> createState() => _FaceScanScreenState();
}

class _FaceScanScreenState extends State<FaceScanScreen>
    with WidgetsBindingObserver {
  CameraController? _controller;
  bool _isCameraInitialized = false;
  bool _isProcessing = false;
  bool _isSuccess = false;

  // Data Session
  Map<String, dynamic>? _activeSession;
  bool _isLoadingSession = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeScreen();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller?.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final CameraController? cameraController = _controller;
    if (cameraController == null || !cameraController.value.isInitialized) {
      return;
    }
    if (state == AppLifecycleState.inactive) {
      cameraController.dispose();
    } else if (state == AppLifecycleState.resumed) {
      _initCamera();
    }
  }

  Future<void> _initializeScreen() async {
    await _fetchActiveSession();
    if (_activeSession != null) {
      await _initCamera();
    }
  }

  Future<void> _fetchActiveSession() async {
    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final response = await auth.getActiveSessions();
      final List<dynamic> sessions = response['data'] ?? [];

      if (mounted) {
        setState(() {
          if (sessions.isNotEmpty) {
            _activeSession = sessions.first;
          } else {
            _activeSession = null;
          }
          _isLoadingSession = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll("ApiException: ", "");
          _isLoadingSession = false;
        });
      }
    }
  }

  Future<void> _initCamera() async {
    try {
      final cameras = await availableCameras();
      final frontCamera = cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );

      _controller = CameraController(
        frontCamera,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: Platform.isAndroid
            ? ImageFormatGroup.jpeg
            : ImageFormatGroup.bgra8888,
      );

      await _controller!.initialize();
      if (mounted) {
        setState(() => _isCameraInitialized = true);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _errorMessage = "Gagal akses kamera: $e");
      }
    }
  }

  Future<void> _captureAndSend() async {
    if (_controller == null ||
        !_controller!.value.isInitialized ||
        _isProcessing)
      return;

    setState(() => _isProcessing = true);

    try {
      // 1. Ambil Foto
      await _controller!.setFlashMode(FlashMode.off);
      final XFile rawImage = await _controller!.takePicture();

      // 2. Rename file
      final Directory appDir = await getApplicationDocumentsDirectory();
      final String fileName =
          'att_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final String newPath = p.join(appDir.path, fileName);

      await rawImage.saveTo(newPath);
      final File imageFile = File(newPath);

      // 3. Siapkan Data
      final int sessionId = _activeSession!['sessionId'] is int
          ? _activeSession!['sessionId']
          : int.parse(_activeSession!['sessionId'].toString());

      final auth = Provider.of<AuthProvider>(context, listen: false);
      final result = await auth.checkInFace(imageFile, sessionId);

      // 4. Sukses
      _handleSuccess(result);
    } catch (e) {
      // --- LOGIKA DETEKSI ERROR YANG DIPERBAIKI ---
      String msg = e
          .toString()
          .replaceAll("ApiException: ", "")
          .replaceAll("Exception: ", "");
      String lowerMsg = msg.toLowerCase();

      // Cek berbagai kemungkinan pesan error:
      // 1. "already" / "sudah" : Pesan standar dari backend.
      // 2. "type 'Null' is not a subtype" : Backend melempar error tapi body pesannya kosong/null.
      // 3. "duplicate" : Istilah umum database.

      bool isDuplicateError =
          lowerMsg.contains("already") ||
          lowerMsg.contains("sudah") ||
          lowerMsg.contains("duplicate") ||
          lowerMsg.contains("exist") ||
          // Menangani error 'Null' yang Anda alami
          lowerMsg.contains("subtype of type 'string'");

      if (isDuplicateError) {
        _showAlreadyCheckedInDialog();
      } else {
        // Jika errornya benar-benar lain (misal koneksi), tampilkan pesan aslinya
        _showErrorDialog(msg);
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  // --- POPUP SUKSES ---
  void _handleSuccess(Map<String, dynamic> result) {
    _controller?.pausePreview(); // Stop kamera sementara
    setState(() {
      _isSuccess = true;
    });

    // Parsing Data
    final data = result['data'] ?? {};
    final session = data['session'] ?? {};

    final String statusRaw = data['status'] ?? 'present';
    final String studentName = data['studentName'] ?? 'Siswa';
    final String subject = session['subject'] ?? 'Kelas';
    final String checkInTimeRaw = data['checkInTime'];

    // Parsing Confidence
    String confidenceDisplay = "0%";
    if (data['faceConfidence'] != null) {
      try {
        final double conf = double.parse(data['faceConfidence'].toString());
        confidenceDisplay = "${(conf * 100).toStringAsFixed(0)}%";
      } catch (_) {}
    }

    // Parsing Waktu (HH:mm)
    String timeDisplay = "--:--";
    try {
      final dt = DateTime.parse(checkInTimeRaw).toLocal();
      timeDisplay = DateFormat('HH:mm').format(dt);
    } catch (_) {}

    // Styling Status
    Color statusColor = Colors.green;
    String statusText = "Hadir Tepat Waktu";
    IconData statusIcon = Icons.check_circle;

    if (statusRaw.toLowerCase() == 'late') {
      statusColor = Colors.orange;
      statusText = "Terlambat";
      statusIcon = Icons.access_time_filled;
    }

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        contentPadding: const EdgeInsets.all(24),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Ikon Status
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(statusIcon, color: statusColor, size: 50),
            ),
            const SizedBox(height: 16),

            const Text(
              "Check-in Berhasil!",
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),

            // Badge Status
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: statusColor,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                statusText.toUpperCase(),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Detail Grid
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: Column(
                children: [
                  _buildDetailRow("Nama", studentName),
                  const Divider(height: 24),
                  _buildDetailRow("Pelajaran", subject),
                  const Divider(height: 24),
                  _buildDetailRow("Waktu", timeDisplay, isBold: true),
                  const Divider(height: 24),
                  _buildDetailRow(
                    "Kecocokan",
                    confidenceDisplay,
                    valueColor: Colors.grey[600],
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.of(context).pop(); // Kembali ke Home
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: statusColor,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                "Selesai",
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // --- POPUP: SUDAH ABSEN ---
  void _showAlreadyCheckedInDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        contentPadding: const EdgeInsets.all(24),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.orange.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.priority_high_rounded,
                color: Colors.orange,
                size: 50,
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              "Sudah Absen!",
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              "Kamu sudah tercatat hadir di kelas ini sebelumnya. Tidak perlu scan wajah lagi.",
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600], fontSize: 15),
            ),
          ],
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                "Oke, Mengerti",
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Gagal"),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Tutup"),
          ),
        ],
      ),
    );
  }

  // Helper Row Popup
  Widget _buildDetailRow(
    String label,
    String value, {
    bool isBold = false,
    Color? valueColor,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(color: Colors.grey[600], fontSize: 14)),
        Flexible(
          child: Text(
            value,
            style: TextStyle(
              color: valueColor ?? Colors.black87,
              fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
              fontSize: 14,
            ),
            textAlign: TextAlign.right,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  // Helper Format Waktu
  String _formatTimeDisplay(String? isoTime) {
    if (isoTime == null) return '--:--';
    try {
      final dt = DateTime.parse(isoTime).toLocal();
      return DateFormat.Hm().format(dt);
    } catch (e) {
      return '--:--';
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoadingSession) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_errorMessage != null || _activeSession == null) {
      return Scaffold(
        appBar: AppBar(title: const Text("Scan Wajah")),
        body: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.grey.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.no_photography_outlined,
                    size: 60,
                    color: Colors.grey[500],
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  "Tidak Ada Sesi Aktif",
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[800],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _errorMessage ??
                      "Saat ini tidak ada jadwal kelas yang sedang berlangsung untuk presensi.",
                  style: TextStyle(color: Colors.grey[600], fontSize: 14),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),

                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.refresh),
                    label: const Text("Coba Lagi / Refresh"),
                    onPressed: () {
                      setState(() {
                        _isLoadingSession = true;
                        _errorMessage = null;
                      });
                      _initializeScreen();
                    },
                    style: ElevatedButton.styleFrom(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final String subject = _activeSession!['subject'] ?? 'Unknown Subject';
    final String className = _activeSession!['className'] ?? 'Unknown Class';
    final String room = _activeSession!['room'] ?? '-';

    final String startTime = _formatTimeDisplay(_activeSession!['startTime']);
    final String endTime = _formatTimeDisplay(_activeSession!['endTime']);

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          if (_isCameraInitialized && _controller != null)
            Center(child: CameraPreview(_controller!))
          else
            const Center(child: CircularProgressIndicator(color: Colors.white)),

          if (_isCameraInitialized)
            ColorFiltered(
              colorFilter: const ColorFilter.mode(
                Colors.black54,
                BlendMode.srcOut,
              ),
              child: Stack(
                children: [
                  Container(
                    decoration: const BoxDecoration(
                      color: Colors.transparent,
                      backgroundBlendMode: BlendMode.dstOut,
                    ),
                  ),
                  Align(
                    alignment: const Alignment(0, -0.2),
                    child: Container(
                      width: 280,
                      height: 350,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(200),
                      ),
                    ),
                  ),
                ],
              ),
            ),

          Align(
            alignment: const Alignment(0, -0.2),
            child: Container(
              width: 280,
              height: 350,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(200),
                border: Border.all(color: Colors.white, width: 2),
              ),
            ),
          ),

          Positioned(
            top: 60,
            left: 0,
            right: 0,
            child: const Column(
              children: [
                Text(
                  "Posisikan wajah di dalam area",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    shadows: [Shadow(blurRadius: 4, color: Colors.black)],
                  ),
                ),
              ],
            ),
          ),

          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(24, 32, 24, 48),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    subject,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "$className • $room",
                    style: TextStyle(color: Colors.grey[600], fontSize: 14),
                  ),
                  const SizedBox(height: 12),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.access_time,
                        size: 18,
                        color: Colors.blue,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        "$startTime - $endTime",
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 32),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      IconButton(
                        onPressed: _isProcessing
                            ? null
                            : () => Navigator.pop(context),
                        icon: const Icon(
                          Icons.close,
                          size: 28,
                          color: Colors.grey,
                        ),
                      ),
                      GestureDetector(
                        onTap: _isProcessing ? null : _captureAndSend,
                        child: Container(
                          height: 72,
                          width: 72,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: _isProcessing
                                ? Colors.grey[300]
                                : Theme.of(context).primaryColor,
                            boxShadow: [
                              BoxShadow(
                                color: _isProcessing
                                    ? Colors.transparent
                                    : Theme.of(
                                        context,
                                      ).primaryColor.withValues(alpha: 0.4),
                                blurRadius: 10,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                          child: _isProcessing
                              ? const Padding(
                                  padding: EdgeInsets.all(16.0),
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 3,
                                  ),
                                )
                              : const Icon(
                                  Icons.camera_alt,
                                  color: Colors.white,
                                  size: 32,
                                ),
                        ),
                      ),
                      const SizedBox(width: 48),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
