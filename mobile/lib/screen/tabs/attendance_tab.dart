import 'package:mobile/screen/student/face_scan_screen.dart';
import 'package:flutter/material.dart';

class AttendanceTab extends StatelessWidget {
  const AttendanceTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Attendance')),
      body: Center(
        child: SingleChildScrollView(
          // Padding agar konten tidak mepet ke tepi layar
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Ikon dengan background lingkaran tipis
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Theme.of(context).primaryColor.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.face_retouching_natural,
                  size: 80,
                  color: Theme.of(context).primaryColor,
                ),
              ),
              const SizedBox(height: 32),

              const Text(
                "Siap untuk Presensi?",
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              const Text(
                "Pastikan wajah Anda terlihat jelas\ndi dalam kamera dan pencahayaan cukup.",
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey, fontSize: 15),
              ),
              const SizedBox(height: 48),

              // --- TOMBOL SCAN WAJAH (DIPERBAIKI) ---
              SizedBox(
                width: double.infinity, // Lebar penuh mengikuti padding parent
                height: 54, // Tinggi tombol yang nyaman
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) => const FaceScanScreen(),
                      ),
                    );
                  },
                  icon: const Icon(Icons.camera_alt),
                  label: const Text("Mulai Scan Wajah"),
                  style: ElevatedButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(
                        12,
                      ), // Sudut melengkung
                    ),
                    textStyle: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
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
}
