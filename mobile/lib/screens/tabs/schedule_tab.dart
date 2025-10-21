import 'package:flutter/material.dart';
import 'package:mobile/providers/auth_provider.dart';
import 'package:mobile/services/api_service.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

class ScheduleTab extends StatefulWidget {
  const ScheduleTab({super.key});

  @override
  State<ScheduleTab> createState() => _ScheduleTabState();
}

class _ScheduleTabState extends State<ScheduleTab> {
  late Future<Map<String, dynamic>> _scheduleFuture;
  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    // Ambil token dan panggil API
    final token = Provider.of<AuthProvider>(context, listen: false).token;
    _scheduleFuture = _apiService.getClassSchedule(token!);
  }

  // Helper untuk mengubah 'dayOfWeek' (1-7) menjadi nama hari
  String _getDayName(int day) {
    const days = [
      'Senin',
      'Selasa',
      'Rabu',
      'Kamis',
      'Jumat',
      'Sabtu',
      'Minggu',
    ];
    return (day >= 1 && day <= 7) ? days[day - 1] : 'Hari Tidak Valid';
  }

  // Helper untuk format waktu
  String _formatTime(String isoTime) {
    try {
      final dateTime = DateTime.parse(isoTime);
      return DateFormat.Hm().format(dateTime.toLocal()); // Format "HH:mm"
    } catch (e) {
      return 'Invalid Time';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Jadwal Pelajaran')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _scheduleFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          if (!snapshot.hasData || snapshot.data!['data'] == null) {
            return const Center(child: Text('Tidak ada data jadwal.'));
          }

          final List schedules = snapshot.data!['data'];

          if (schedules.isEmpty) {
            return const Center(child: Text('Jadwal kosong.'));
          }

          return ListView.builder(
            padding: const EdgeInsets.all(8.0),
            itemCount: schedules.length,
            itemBuilder: (context, index) {
              final schedule = schedules[index];
              final subject = schedule['subject']?['name'] ?? 'N/A';
              final teacher = schedule['teacher']?['fullName'] ?? 'N/A';
              final className = schedule['class']?['name'] ?? 'N/A';
              final day = _getDayName(schedule['dayOfWeek'] ?? 0);
              final startTime = _formatTime(schedule['startTime'] ?? '');
              final endTime = _formatTime(schedule['endTime'] ?? '');

              return Card(
                margin: const EdgeInsets.symmetric(
                  vertical: 8.0,
                  horizontal: 8.0,
                ),
                elevation: 3,
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: Colors.blue[100],
                    child: Text(
                      subject.isNotEmpty ? subject[0] : '?',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.blue,
                      ),
                    ),
                  ),
                  title: Text(
                    subject,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('$day, $startTime - $endTime'),
                      Text('Guru: $teacher'),
                      Text(
                        'Kelas: $className (Ruang: ${schedule['room'] ?? 'N/A'})',
                      ),
                    ],
                  ),
                  isThreeLine: true,
                ),
              );
            },
          );
        },
      ),
    );
  }
}
