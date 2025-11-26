import 'dart:async';
import 'package:mobile/providers/auth_providers.dart';
import 'package:mobile/screen/teacher/attendance_form_screen.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
// Import layar form absensi

class HomeTab extends StatefulWidget {
  // Callback untuk pindah tab
  final VoidCallback navigateToProfile;
  final VoidCallback navigateToSchedule;
  final VoidCallback? navigateToManageAttendance;

  const HomeTab({
    super.key,
    required this.navigateToProfile,
    required this.navigateToSchedule,
    this.navigateToManageAttendance,
  });

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  late Future<Map<String, dynamic>> _scheduleFuture;
  late DateTime _currentTime;
  Timer? _timer;

  bool _isActionLoading = false;

  @override
  void initState() {
    super.initState();
    _scheduleFuture = _fetchSchedule();

    _currentTime = DateTime.now();
    _timer = Timer.periodic(const Duration(minutes: 1), (timer) {
      if (mounted) {
        final newTime = DateTime.now();
        if (_currentTime.minute != newTime.minute) {
          setState(() {
            _currentTime = newTime;
          });
          _refreshScheduleIfPassed();
        }
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  // --- LOGIKA HELPER ---

  Future<Map<String, dynamic>> _fetchSchedule() {
    return Provider.of<AuthProvider>(
      context,
      listen: false,
    ).getScheduleForToday();
  }

  DateTime _parseTime(String isoTime) {
    try {
      final now = DateTime.now();
      final time = DateTime.parse(isoTime).toLocal();
      return DateTime(now.year, now.month, now.day, time.hour, time.minute);
    } catch (e) {
      return DateTime.now().subtract(const Duration(days: 1));
    }
  }

  void _refreshScheduleIfPassed() async {
    _scheduleFuture.then((snapshot) {
      if (snapshot.isEmpty || snapshot['data'] == null || !mounted) return;
      final List<dynamic> schedules = snapshot['data']?['data'] ?? [];
      if (schedules.isEmpty) return;
      final now = DateTime.now();
      bool needsRefresh = schedules.any((item) {
        final endTime = _parseTime(item['endTime']);
        return endTime.isBefore(now) &&
            endTime.isAfter(
              now.subtract(const Duration(minutes: 1, seconds: 5)),
            );
      });

      if (needsRefresh) {
        if (mounted) {
          setState(() {
            _scheduleFuture = _fetchSchedule();
          });
        }
      }
    });
  }

  String _formatTime(String isoTime) {
    try {
      return DateFormat.Hm().format(DateTime.parse(isoTime).toLocal());
    } catch (e) {
      return 'N/A';
    }
  }

  String get _formattedDate {
    return DateFormat('d MMMM y', 'id_ID').format(_currentTime);
  }

  String get _formattedTime {
    return DateFormat.Hm().format(_currentTime);
  }

  // --- WIDGET BUILDERS ---

  Widget _buildProfileHeader(AuthProvider auth) {
    final profile = auth.userProfile;
    if (profile == null) return const SizedBox(height: 70);

    String name = profile['fullName'] ?? 'Nama Pengguna';
    String role = auth.role ?? 'User';
    String idNumber = profile['studentId'] ?? profile['teacherId'] ?? 'N/A';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  '${role.toUpperCase()} - $idNumber',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
                ),
              ],
            ),
          ),
          InkWell(
            onTap: widget.navigateToProfile,
            borderRadius: BorderRadius.circular(25),
            child: CircleAvatar(
              radius: 25,
              backgroundColor: Theme.of(
                context,
              ).primaryColor.withValues(alpha: 0.1),
              child: Icon(
                Icons.person_outline,
                color: Theme.of(context).primaryColor,
                size: 28,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDateCard() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Card(
        color: Theme.of(context).primaryColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(10.0),
          child: Row(
            children: [
              const SizedBox(width: 8),
              const Icon(
                Icons.calendar_today_outlined,
                color: Colors.white,
                size: 28,
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _formattedDate,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    _formattedTime,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.8),
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildScheduleList(AuthProvider auth) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Card(
        elevation: 0,
        color: const Color(0xFFF0F0F0),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              FutureBuilder<Map<String, dynamic>>(
                future: _scheduleFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Padding(
                      padding: EdgeInsets.all(32.0),
                      child: CircularProgressIndicator(),
                    );
                  }
                  if (snapshot.hasError) {
                    String msg = snapshot.error.toString().replaceAll(
                      "ApiException: ",
                      "",
                    );
                    return _buildErrorState(msg);
                  }
                  if (!snapshot.hasData ||
                      snapshot.data!['data'] == null ||
                      (snapshot.data!['data']['data'] as List).isEmpty) {
                    return _buildEmptyState('Tidak ada jadwal hari ini.');
                  }

                  final List<dynamic> schedules =
                      snapshot.data!['data']['data'];
                  return _buildUpcomingScheduleViews(
                    schedules,
                    auth.role ?? 'student',
                  );
                },
              ),

              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: widget.navigateToSchedule,
                  child: const Text('Selengkapnya...'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildUpcomingScheduleViews(List<dynamic> schedules, String role) {
    final now = DateTime.now();

    final upcomingSchedules = schedules.where((s) {
      return _parseTime(s['endTime']).isAfter(now);
    }).toList();

    if (upcomingSchedules.isEmpty) {
      return _buildEmptyState('Tidak ada jadwal untuk sisa hari ini.');
    }

    upcomingSchedules.sort(
      (a, b) =>
          _parseTime(a['startTime']).compareTo(_parseTime(b['startTime'])),
    );

    final int? nextScheduleId = upcomingSchedules.isNotEmpty
        ? upcomingSchedules.first['id']
        : null;

    return Column(
      children: upcomingSchedules
          .map(
            (item) => _buildScheduleCard(
              context,
              item as Map<String, dynamic>,
              role,
              item['id'] == nextScheduleId,
            ),
          )
          .toList(),
    );
  }

  Widget _buildScheduleCard(
    BuildContext context,
    Map<String, dynamic> item,
    String role,
    bool isNextUpcoming,
  ) {
    final String subject = item['subject']?['name'] ?? 'N/A';
    final String className = item['class']?['name'] ?? 'N/A';
    final String room = item['room'] ?? '-';
    final String startTime = _formatTime(item['startTime']);
    final String endTime = _formatTime(item['endTime']);

    final bool hasSession = item['session']?['hasSession'] ?? false;
    final String status = item['session']?['status'] ?? '';
    final int classScheduleId = item['id'];

    return Card(
      margin: const EdgeInsets.only(bottom: 12.0),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '$subject - $className',
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 8),
                      _infoRow(
                        Icons.access_time_outlined,
                        '$startTime - $endTime',
                      ),
                      const SizedBox(height: 4),
                      _infoRow(Icons.location_on_outlined, 'Ruang: $room'),
                    ],
                  ),
                ),
                _statusIndicator(hasSession, status),
              ],
            ),
            if (role == 'teacher')
              _teacherActionButtons(
                context,
                hasSession,
                classScheduleId,
                subject,
                isNextUpcoming,
                item,
              ),
          ],
        ),
      ),
    );
  }

  /// Dialog Konfirmasi Pembuatan Sesi (Refined UI)
  Future<String?> _showCreateSessionDialog(
    BuildContext context,
    String subjectName,
  ) async {
    final notesController = TextEditingController();
    final theme = Theme.of(context);

    return showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          elevation: 0,
          backgroundColor: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // --- 1. Header Icon ---
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: theme.primaryColor.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.class_outlined,
                    size: 32,
                    color: theme.primaryColor,
                  ),
                ),
                const SizedBox(height: 16),

                // --- 2. Title & Subject ---
                const Text(
                  'Mulai Sesi Kelas',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'Anda akan memulai sesi untuk:',
                  style: TextStyle(color: Colors.grey[600], fontSize: 14),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  subjectName,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800, // Lebih tebal
                    color: theme.primaryColor,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),

                // --- 3. Input Field (Notes) ---
                TextField(
                  controller: notesController,
                  maxLines: 2, // Sedikit lebih tinggi
                  minLines: 1,
                  decoration: InputDecoration(
                    labelText: 'Catatan (Opsional)',
                    hintText: 'Contoh: Chapter 8 - Diskusi Kelompok',
                    hintStyle: TextStyle(color: Colors.grey[400], fontSize: 13),
                    prefixIcon: const Icon(Icons.edit_note, size: 20),
                    filled: true,
                    fillColor: Colors.grey[50],
                    contentPadding: const EdgeInsets.symmetric(
                      vertical: 12,
                      horizontal: 16,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none, // Borderless style
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                        color: theme.primaryColor,
                        width: 1.5,
                      ),
                    ),
                  ),
                  textCapitalization: TextCapitalization.sentences,
                ),
                const SizedBox(height: 32),

                // --- 4. Action Buttons ---
                Row(
                  children: [
                    // Tombol Batal
                    Expanded(
                      child: TextButton(
                        onPressed: () => Navigator.of(context).pop(null),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text(
                          'Batal',
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),

                    // Tombol Mulai (Prominent)
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.of(context).pop(notesController.text);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: theme.primaryColor,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Mulai Sesi',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _teacherActionButtons(
    BuildContext context,
    bool hasSession,
    int classScheduleId,
    String subjectName,
    bool isNextUpcoming,
    Map<String, dynamic> item,
  ) {
    // 1. Jika sesi sudah ada ("Kelola Absen")
    if (hasSession) {
      return Padding(
        padding: const EdgeInsets.only(top: 12.0),
        child: SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            icon: const Icon(Icons.edit_calendar_outlined),
            label: _isActionLoading
                ? const Text("Memuat...")
                : const Text('Kelola Absen'),
            onPressed: _isActionLoading
                ? null
                : () async {
                    setState(() => _isActionLoading = true);
                    try {
                      final auth = Provider.of<AuthProvider>(
                        context,
                        listen: false,
                      );
                      final int? sessionId = item['session']?['id'];

                      if (sessionId == null) {
                        throw Exception(
                          'Session ID tidak ditemukan di dalam item jadwal.',
                        );
                      }

                      final sessionData = await auth.getSessionDetails(
                        sessionId,
                      );

                      if (mounted) {
                        await Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) =>
                                AttendanceFormScreen(sessionData: sessionData),
                          ),
                        );
                        setState(() {
                          _scheduleFuture = _fetchSchedule();
                        });
                        auth.triggerRefresh();
                      }
                    } catch (e) {
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Gagal memuat sesi: $e'),
                            backgroundColor: Colors.red,
                          ),
                        );
                      }
                    } finally {
                      if (mounted) setState(() => _isActionLoading = false);
                    }
                  },
          ),
        ),
      );
    }

    // 2. Jika sesi BELUM ada DAN ini adalah jadwal BERIKUTNYA
    if (!hasSession && isNextUpcoming) {
      return Padding(
        padding: const EdgeInsets.only(top: 12.0),
        child: ElevatedButton.icon(
          onPressed: _isActionLoading
              ? null
              : () async {
                  final notes = await _showCreateSessionDialog(
                    context,
                    subjectName,
                  );
                  if (notes == null) return;

                  setState(() => _isActionLoading = true);
                  try {
                    final auth = Provider.of<AuthProvider>(
                      context,
                      listen: false,
                    );
                    final notesToSend = notes.isEmpty ? null : notes;
                    final newSessionData = await auth.createSession(
                      classScheduleId,
                      notesToSend,
                    );

                    setState(() {
                      _scheduleFuture = auth.getScheduleForToday();
                    });

                    if (mounted) {
                      await Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) =>
                              AttendanceFormScreen(sessionData: newSessionData),
                        ),
                      );
                      setState(() {
                        _scheduleFuture = _fetchSchedule();
                      });
                      auth.triggerRefresh();
                    }
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Gagal membuat sesi: $e'),
                          backgroundColor: Colors.red,
                        ),
                      );
                    }
                  } finally {
                    if (mounted) setState(() => _isActionLoading = false);
                  }
                },

          // --- PERBAIKAN DI SINI ---
          // Koma (,) ditambahkan setelah blok onPressed
          // -----------------------
          icon: const Icon(Icons.add_task_outlined),
          label: _isActionLoading
              ? const Text('Membuat...')
              : const Text('Create Session'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.green[700],
            foregroundColor: Colors.white,
          ),
        ),
      );
    }

    return const SizedBox.shrink();
  }

  Widget _infoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.grey[600]),
        const SizedBox(width: 8),
        Text(text, style: TextStyle(color: Colors.grey[700])),
      ],
    );
  }

  Widget _statusIndicator(bool hasSession, String status) {
    String text;
    Color color;

    if (hasSession) {
      text = status.isNotEmpty
          ? status[0].toUpperCase() + status.substring(1)
          : 'Berlangsung';
      color = Colors.green;
    } else {
      text = 'Akan Datang';
      color = Colors.red;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildEmptyState(String message) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 48.0),
      alignment: Alignment.center,
      child: Column(
        children: [
          Icon(Icons.event_note_outlined, size: 60, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            message,
            style: TextStyle(color: Colors.grey[600], fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(String message) {
    bool isApproval = message.contains('Tunggu approval');
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 48.0, horizontal: 16.0),
      alignment: Alignment.center,
      child: Column(
        children: [
          Icon(
            isApproval
                ? Icons.admin_panel_settings_outlined
                : Icons.error_outline,
            size: 60,
            color: isApproval ? Colors.blue[300] : Colors.red[300],
          ),
          const SizedBox(height: 16),
          Text(
            message,
            style: Theme.of(context).textTheme.titleMedium,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  // --- BUILD UTAMA ---
  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    Intl.defaultLocale = 'id_ID';

    return Scaffold(
      body: SingleChildScrollView(
        child: SafeArea(
          child: Column(
            children: [
              _buildProfileHeader(auth),
              _buildDateCard(),
              _buildScheduleList(auth),
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: Card(
                  child: SizedBox(
                    height: 150,
                    child: Center(
                      child: Text(
                        'Placeholder untuk Event Baru',
                        style: TextStyle(color: Colors.grey),
                      ),
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
