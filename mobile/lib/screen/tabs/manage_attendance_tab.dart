import 'package:flutter/material.dart';
import 'package:mobile/screen/teacher/attendance_form_screen.dart';
import 'package:provider/provider.dart';
import 'package:mobile/providers/auth_providers.dart';
import 'package:intl/intl.dart';

class ManageAttendanceTab extends StatefulWidget {
  const ManageAttendanceTab({super.key});

  @override
  State<ManageAttendanceTab> createState() => _ManageAttendanceTabState();
}

class _ManageAttendanceTabState extends State<ManageAttendanceTab> {
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
    final auth = Provider.of<AuthProvider>(context, listen: false);

    // Tampilkan loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final sessionData = await auth.getSessionDetails(sessionId);

      if (!mounted) return;
      Navigator.of(context).pop(); // Tutup loading dialog

      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => AttendanceFormScreen(sessionData: sessionData),
        ),
      );

      auth.triggerRefresh();
      setState(() {});
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
      body: Consumer<AuthProvider>(
        builder: (context, auth, child) {
          // Ambil Future baru setiap kali refresh
          final activeSessionsFuture = auth.getActiveSessions();

          return RefreshIndicator(
            onRefresh: () async {
              setState(() {});
            },
            child: FutureBuilder<Map<String, dynamic>>(
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

                // Ambil list data mentah
                final List<dynamic> rawSessions = snapshot.data!['data'];

                // --- FILTER: HANYA TAMPILKAN 'ongoing' ---
                final List<dynamic> sessions = rawSessions.where((s) {
                  final status = s['status']?.toString().toLowerCase() ?? '';
                  return status == 'ongoing';
                }).toList();
                // ----------------------------------------

                if (sessions.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.event_available_outlined,
                          size: 60,
                          color: Colors.grey,
                        ),
                        SizedBox(height: 16),
                        Text(
                          'Tidak ada sesi yang sedang berlangsung.',
                          style: TextStyle(color: Colors.grey),
                        ),
                      ],
                    ),
                  );
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
              // Indikator visual untuk sesi aktif (Hijau berkedip/biasa)
              CircleAvatar(
                radius: 22,
                backgroundColor: Colors.green.withValues(alpha: 0.1),
                child: const Icon(Icons.sensors, color: Colors.green, size: 24),
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
                    Row(
                      children: [
                        Text(
                          '$date ($startTime - $endTime)',
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(width: 8),
                        // Badge Status Kecil
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.green,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'AKTIF',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
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
