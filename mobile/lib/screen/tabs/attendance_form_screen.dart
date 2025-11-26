import 'package:mobile/providers/auth_providers.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

// Enum untuk status absensi
enum AttendanceStatus { present, absent, excused, late }

class AttendanceFormScreen extends StatefulWidget {
  // Data sesi lengkap (dari API createSessuib atau getSessionDetails)
  final Map<String, dynamic> sessionData;

  const AttendanceFormScreen({super.key, required this.sessionData});

  @override
  State<AttendanceFormScreen> createState() => _AttendanceFormScreenState();
}

class _AttendanceFormScreenState extends State<AttendanceFormScreen> {
  // State untuk menyimpan perubahan absensi
  // Key: attendanceId, Value: status (String)
  late Map<int, AttendanceStatus> _attendanceStatus;
  // State untuk menyimpan catatan per siswa
  late Map<int, TextEditingController> _notesControllers;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _attendanceStatus = {};
    _notesControllers = {};

    // Inisialisasi status dari data prop
    final List<dynamic> attendances = widget.sessionData['attendances'];
    for (var student in attendances) {
      final int attendanceId = student['attendanceId'];
      final String status = student['status'];
      _attendanceStatus[attendanceId] = _stringToStatus(status);
      _notesControllers[attendanceId] = TextEditingController(
        text: student['notes'],
      );
    }
  }

  // Helper konversi String ke Enum
  AttendanceStatus _stringToStatus(String status) {
    switch (status.toLowerCase()) {
      case 'present':
        return AttendanceStatus.present;
      case 'excused':
        return AttendanceStatus.excused;
      case 'late':
        return AttendanceStatus.late;
      case 'absent':
      default:
        return AttendanceStatus.absent;
    }
  }

  // Helper konversi Enum ke String
  String _statusToString(AttendanceStatus status) {
    return status.name; // "present", "absent", "excused", "late"
  }

  // Helper format tanggal
  String _formatDate(String isoDate) {
    try {
      return DateFormat('d MMMM y', 'id_ID').format(DateTime.parse(isoDate));
    } catch (e) {
      return 'N/A';
    }
  }

  // Fungsi untuk submit
  Future<void> _submitAttendance() async {
    setState(() => _isLoading = true);

    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final sessionId = widget.sessionData['sessionId'];

      // 1. Ubah map status menjadi list JSON
      final List<Map<String, dynamic>> attendanceData = [];
      _attendanceStatus.forEach((attendanceId, status) {
        final note = _notesControllers[attendanceId]?.text;
        final data = {
          'attendanceId': attendanceId,
          'status': _statusToString(status),
          // Hanya kirim 'notes' jika status 'excused' dan notes tidak kosong
          if (status == AttendanceStatus.excused &&
              note != null &&
              note.isNotEmpty)
            'notes': note,
        };
        attendanceData.add(data);
      });

      // 2. Panggil API
      final response = await auth.submitAttendance(sessionId, attendanceData);

      // 3. Tampilkan hasil
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(response['message'] ?? 'Absensi berhasil disimpan!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.of(context).pop(); // Kembali ke layar sebelumnya
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal menyimpan: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final String subjectName = widget.sessionData['subjectName'];
    final String className = widget.sessionData['className'];
    final String date = _formatDate(widget.sessionData['date']);
    final String? notes = widget.sessionData['notes'];

    final List<dynamic> students = widget.sessionData['attendances'];

    return Scaffold(
      appBar: AppBar(title: Text(subjectName)),
      // Tombol Submit diletakkan di bawah
      bottomNavigationBar: _buildSubmitButton(theme),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Info Sesi
            _buildSessionHeader(theme, className, date, notes),

            // Judul List Siswa
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text(
                'Daftar Siswa (${students.length})',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[600],
                ),
              ),
            ),

            // List Siswa
            ListView.builder(
              itemCount: students.length,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemBuilder: (context, index) {
                final student = students[index];
                final int attendanceId = student['attendanceId'];
                return _buildStudentTile(
                  theme,
                  student,
                  _attendanceStatus[attendanceId]!,
                  _notesControllers[attendanceId]!,
                  (newStatus) {
                    setState(() {
                      _attendanceStatus[attendanceId] = newStatus;
                    });
                  },
                );
              },
            ),
            const SizedBox(height: 24), // Spasi di akhir list
          ],
        ),
      ),
    );
  }

  /// Header Info Sesi
  Widget _buildSessionHeader(
    ThemeData theme,
    String className,
    String date,
    String? notes,
  ) {
    return Container(
      width: double.infinity,
      color: theme.primaryColor.withValues(alpha: 0.05),
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildInfoChip(theme, Icons.class_outlined, className),
          const SizedBox(height: 8),
          _buildInfoChip(theme, Icons.calendar_today_outlined, date),
          if (notes != null && notes.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              "Catatan Sesi:",
              style: theme.textTheme.bodySmall?.copyWith(
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 4),
            Text(notes, style: theme.textTheme.bodyMedium),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoChip(ThemeData theme, IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: theme.primaryColor),
        const SizedBox(width: 8),
        Text(
          text,
          style: theme.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  /// Tombol Submit di Bawah
  Widget _buildSubmitButton(ThemeData theme) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
          ),
          onPressed: _isLoading ? null : _submitAttendance,
          child: _isLoading
              ? const SizedBox(
                  height: 24,
                  width: 24,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 3,
                  ),
                )
              : const Text('Simpan Absensi'),
        ),
      ),
    );
  }

  /// Tile untuk satu siswa (Form)
  Widget _buildStudentTile(
    ThemeData theme,
    Map<String, dynamic> student,
    AttendanceStatus currentStatus,
    TextEditingController noteController,
    Function(AttendanceStatus) onStatusChanged,
  ) {
    final String name = student['studentName'];
    final String number = student['studentNumber'];
    final bool showNotes = currentStatus == AttendanceStatus.excused;

    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Info Siswa
              CircleAvatar(
                backgroundColor: theme.primaryColor,
                child: Text(
                  name.isNotEmpty ? name[0] : 'S',
                  style: const TextStyle(color: Colors.white),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Text(
                      number,
                      style: TextStyle(color: Colors.grey[600], fontSize: 13),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Tombol Pilihan Status (Modern)
          _buildStatusSelector(theme, currentStatus, onStatusChanged),

          // Input Catatan (jika 'Izin')
          if (showNotes)
            Padding(
              padding: const EdgeInsets.only(top: 12.0),
              child: TextField(
                controller: noteController,
                decoration: const InputDecoration(
                  hintText: 'Tambahkan catatan izin...',
                  labelText: 'Catatan (Opsional)',
                  border: OutlineInputBorder(),
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  /// Widget pemilih status (H/A/I/T) yang modern
  Widget _buildStatusSelector(
    ThemeData theme,
    AttendanceStatus currentStatus,
    Function(AttendanceStatus) onStatusChanged,
  ) {
    // Definisi warna untuk setiap status
    final Map<AttendanceStatus, Color> colors = {
      AttendanceStatus.present: Colors.green,
      AttendanceStatus.absent: Colors.red,
      AttendanceStatus.excused: Colors.blue,
      AttendanceStatus.late: Colors.orange,
    };

    return ToggleButtons(
      isSelected: AttendanceStatus.values
          .map((s) => s == currentStatus)
          .toList(),
      onPressed: (index) {
        onStatusChanged(AttendanceStatus.values[index]);
      },
      borderRadius: BorderRadius.circular(8.0),
      // Warna border dan teks saat tidak dipilih
      borderColor: Colors.grey[300],
      color: Colors.grey[600],
      // Warna border dan teks saat dipilih
      selectedBorderColor: colors[currentStatus],
      selectedColor: colors[currentStatus],
      // Warna highlight saat ditekan
      splashColor: colors[currentStatus]!.withValues(alpha: 0.1),
      // Warna background saat dipilih
      fillColor: colors[currentStatus]!.withValues(alpha: 0.08),
      constraints: BoxConstraints(
        minHeight: 40.0,
        // Bagi lebar layar secara merata
        minWidth: (MediaQuery.of(context).size.width - 48) / 4,
      ),
      children: const [
        Text(
          'Hadir',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
        ),
        Text(
          'Alpha',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
        ),
        Text(
          'Izin',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
        ),
        Text(
          'Telat',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
        ),
      ],
    );
  }
}
