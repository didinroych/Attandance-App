import 'package:mobile/providers/auth_providers.dart';
import 'package:mobile/screen/tabs/attendance_form_screen.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

class ManageAttendanceTab extends StatefulWidget {
  const ManageAttendanceTab({super.key});

  @override
  State<ManageAttendanceTab> createState() => _ManageAttendanceTabState();
}

class _ManageAttendanceTabState extends State<ManageAttendanceTab> {
  // Kita tidak lagi menyimpan Future sebagai state di sini,
  // karena Consumer akan menyediakannya.

  // Helper format
  String _formatTime(String isoTime) {
    try {
      return DateFormat.Hm().format(DateTime.parse(isoTime).toLocal());
    } catch (e) {
      return 'N/A';
    }
  }

  String _formatDate(String isoDate) {
    try {
      return DateFormat('d MMM y', 'id_ID').format(DateTime.parse(isoDate));
    } catch (e) {
      return 'N/A';
    }
  }

  /// Navigasi ke Form Absensi
  Future<void> _navigateToSession(BuildContext context, int sessionId) async {
    // Ambil AuthProvider (listen: false) karena kita di dalam fungsi
    final auth = Provider.of<AuthProvider>(context, listen: false);

    // Tampilkan loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      // 1. Panggil API untuk mendapatkan detail (termasuk daftar siswa)
      final sessionData = await auth.getSessionDetails(sessionId);

      if (!mounted) return;
      Navigator.of(context).pop(); // Tutup loading dialog

      // 2. Await navigasi. Ini penting.
      // Kode di bawah ini akan berjalan SETELAH layar form ditutup
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => AttendanceFormScreen(sessionData: sessionData),
        ),
      );

      // 3. Setelah kembali, refresh semua data
      auth.triggerRefresh(); // Beri tahu HomeTab (dan Consumer ini)
      setState(() {}); // Paksa Consumer untuk rebuild dan panggil API lagi
    } catch (e) {
      if (!mounted) return;
      Navigator.of(context).pop(); // Tutup loading dialog
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Gagal memuat sesi: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Kelola Absen')),
      // Gunakan Consumer untuk mendengarkan "lonceng" triggerRefresh()
      body: Consumer<AuthProvider>(
        builder: (context, auth, child) {
          // Setiap Consumer rebuild (karena triggerRefresh),
          // kita panggil API untuk mendapatkan Future baru.
          final activeSessionsFuture = auth.getActiveSessions();

          return RefreshIndicator(
            onRefresh: () async {
              // Manual pull-to-refresh juga memicu setState
              setState(() {});
            },
            child: FutureBuilder<Map<String, dynamic>>(
              // Gunakan Future baru dari Consumer
              future: activeSessionsFuture,
              builder: (context, snapshot) {
                // --- Loading State ---
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                // --- Error State ---
                if (snapshot.hasError) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Text(
                        'Gagal memuat sesi: ${snapshot.error}',
                        textAlign: TextAlign.center,
                      ),
                    ),
                  );
                }

                // --- Empty Data State ---
                if (!snapshot.hasData || snapshot.data!['data'] == null) {
                  return const Center(child: Text('Tidak ada sesi aktif.'));
                }

                final List<dynamic> sessions = snapshot.data!['data'];
                if (sessions.isEmpty) {
                  return const Center(child: Text('Tidak ada sesi aktif.'));
                }

                // --- Success State ---
                return ListView.builder(
                  padding: const EdgeInsets.all(8.0),
                  itemCount: sessions.length,
                  itemBuilder: (context, index) {
                    final session = sessions[index];
                    return _buildSessionCard(context, session);
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }

  /// Widget untuk 1 Kartu Sesi
  Widget _buildSessionCard(BuildContext context, Map<String, dynamic> session) {
    final theme = Theme.of(context);
    final String subject = session['subject'] ?? 'N/A';
    final String className = session['className'] ?? 'N/A';
    final String room = session['room'] ?? '-';
    final String date = _formatDate(session['date']);
    final String startTime = _formatTime(session['startTime']);
    final String endTime = _formatTime(session['endTime']);
    final int sessionId = session['sessionId'];

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 6.0),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () => _navigateToSession(context, sessionId),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: theme.primaryColor.withValues(alpha: 0.1),
                child: Icon(
                  Icons.class_outlined,
                  color: theme.primaryColor,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      subject,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$className • $room',
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$date ($startTime - $endTime)',
                      style: TextStyle(color: Colors.grey[600], fontSize: 13),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}
