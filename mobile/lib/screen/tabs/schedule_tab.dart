import 'package:mobile/providers/auth_providers.dart';
import 'package:mobile/screen/tabs/history_tab.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

class ScheduleTab extends StatefulWidget {
  const ScheduleTab({super.key});

  @override
  State<ScheduleTab> createState() => _ScheduleTabState();
}

class _ScheduleTabState extends State<ScheduleTab> {
  late Future<Map<String, dynamic>> _scheduleFuture;

  // State untuk UI
  late DateTime _today;
  late List<DateTime> _weekDays;
  late int _selectedDay; // 1=Senin, 7=Minggu

  @override
  void initState() {
    super.initState();
    // Inisialisasi state tanggal
    _today = DateTime.now();
    _weekDays = _generateWeekDays(_today);
    // Set hari yang dipilih default ke hari ini
    _selectedDay = _today.weekday;

    // Panggil API
    _scheduleFuture = Provider.of<AuthProvider>(
      context,
      listen: false,
    ).getWeeklySchedule();
  }

  // --- HELPER UNTUK LOGIKA TANGGAL ---

  // Membuat daftar 7 hari (Senin-Minggu) untuk minggu ini
  List<DateTime> _generateWeekDays(DateTime today) {
    // Cari hari Senin di minggu ini
    DateTime startOfWeek = today.subtract(Duration(days: today.weekday - 1));
    // Buat daftar 7 hari
    return List.generate(7, (index) => startOfWeek.add(Duration(days: index)));
  }

  // Helper untuk format waktu (HH:mm)
  String _formatTime(String isoTime) {
    try {
      final dateTime = DateTime.parse(isoTime);
      return DateFormat.Hm().format(dateTime.toLocal()); // Format "12:30"
    } catch (e) {
      return 'N/A';
    }
  }

  // Helper untuk nama hari (Senin, Selasa, ...)
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
    return (day >= 1 && day <= 7) ? days[day - 1] : 'Error';
  }

  // Helper untuk nama bulan (Januari, Februari, ...)
  String _getMonthName(int month) {
    const months = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    return (month >= 1 && month <= 12) ? months[month - 1] : 'Error';
  }

  // --- WIDGET BUILDER ---

  // AppBar sesuai permintaan
  AppBar _buildAppBar(BuildContext context) {
    return AppBar(
      // Hanya tampilkan tombol back jika layar ini dibuka dari layar lain (push)
      // Jika ini adalah tab utama, tombol back tidak akan muncul
      leading: Navigator.canPop(context) ? const BackButton() : null,
      title: const Text('Jadwal & Presensi'),
      actions: [
        IconButton(
          icon: const Icon(Icons.history),
          tooltip: 'Riwayat Presensi',
          onPressed: () {
            // Navigasi ke Halaman History
            Navigator.of(
              context,
            ).push(MaterialPageRoute(builder: (context) => const HistoryTab()));
          },
        ),
      ],
    );
  }

  // Tampilan {Bulan} {Tahun}
  Widget _buildMonthYearTitle() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: Text(
        '${_getMonthName(_today.month)} ${_today.year}',
        style: Theme.of(
          context,
        ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w600),
      ),
    );
  }

  // Scroller hari horizontal (Senin - Minggu)
  Widget _buildDayScroller() {
    return Container(
      height: 85,
      padding: const EdgeInsets.symmetric(vertical: 16.0),
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        scrollDirection: Axis.horizontal,
        itemCount: _weekDays.length,
        separatorBuilder: (context, index) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final date = _weekDays[index];
          final dayName = _getDayName(date.weekday);

          final isSelected = date.weekday == _selectedDay;
          final isToday =
              date.day == _today.day &&
              date.month == _today.month &&
              date.year == _today.year;

          return GestureDetector(
            onTap: () {
              // Ganti hari yang dipilih
              setState(() {
                _selectedDay = date.weekday;
              });
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              width: 100,
              decoration: BoxDecoration(
                color: isSelected
                    ? Theme.of(context).primaryColor
                    : Theme.of(context).colorScheme.surface,
                borderRadius: BorderRadius.circular(8.0),
                border: isToday && !isSelected
                    ? Border.all(
                        color: Theme.of(context).primaryColor,
                        width: 2,
                      )
                    : null,
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: Theme.of(
                            context,
                          ).primaryColor.withOpacity(0.4),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 5,
                          offset: const Offset(0, 2),
                        ),
                      ],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    dayName,
                    style: TextStyle(
                      fontSize: 16,
                      color: isSelected ? Colors.white : Colors.grey[600],
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // Tampilan info hari yang dipilih (e.g., "Rabu", "22 Oktober")
  Widget _buildSelectedDayInfo(DateTime selectedDate) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16.0, 24.0, 16.0, 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _getDayName(selectedDate.weekday),
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w600),
          ),
          Text(
            '${selectedDate.day} ${_getMonthName(selectedDate.month)}',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  // Card untuk setiap jadwal pelajaran
  Widget _buildScheduleCard(Map<String, dynamic> scheduleItem) {
    final theme = Theme.of(context);
    final subject = scheduleItem['subjectName'] ?? 'Mata Pelajaran';
    final room = scheduleItem['room'] ?? '-';
    final startTime = _formatTime(scheduleItem['startTime'] ?? '');
    final endTime = _formatTime(scheduleItem['endTime'] ?? '');

    return Card(
      color: Theme.of(context).primaryColor,

      // CardTheme dari app_theme.dart akan diterapkan
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Kiri: Info Pelajaran & Ruang
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    subject,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.access_time, size: 16, color: Colors.white),
                      const SizedBox(width: 7),
                      Text(
                        "$startTime - $endTime",
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.location_on_outlined,
                        size: 16,
                        color: Colors.white,
                      ),
                      const SizedBox(width: 7),
                      Text(
                        "Ruang: $room",
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- BUILD UTAMA ---

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildAppBar(context),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _scheduleFuture,
        builder: (context, snapshot) {
          // --- Loading State ---
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          // --- Error State ---
          if (snapshot.hasError) {
            String errorMessage = snapshot.error.toString();
            // Hapus "Exception: " atau "ApiException: " dari pesan
            errorMessage = errorMessage.replaceAll("Exception: ", "");
            errorMessage = errorMessage.replaceAll("ApiException: ", "");

            if (errorMessage.contains('Tunggu approval')) {
              // Tampilkan UI khusus untuk "Tunggu Approval"
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(32.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.admin_panel_settings_outlined,
                        size: 80,
                        color: Colors.grey[400],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        errorMessage, // "Tunggu approval dari admin"
                        style: Theme.of(context).textTheme.titleLarge,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Akun Anda sedang ditinjau dan belum terhubung ke jadwal kelas.',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[600],
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              );
            }
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.error_outline, size: 80, color: Colors.red[300]),
                    const SizedBox(height: 16),
                    Text(
                      errorMessage, // Tampilkan pesan errornya
                      style: Theme.of(context).textTheme.titleLarge,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          }
          // --- Empty Data State ---
          if (!snapshot.hasData || snapshot.data!['data'] == null) {
            return const Center(child: Text('Tidak ada data jadwal.'));
          }

          // --- Success State ---
          final responseData = snapshot.data!['data'];
          // Ambil map jadwal ("1": [...], "2": [...], dst)
          final Map<String, dynamic> scheduleMap = responseData['schedule'];

          // Ambil daftar pelajaran untuk hari yang dipilih
          final List<dynamic> selectedDaySchedule =
              scheduleMap[_selectedDay.toString()] ?? [];

          // Ambil tanggal (DateTime) untuk hari yang dipilih
          final selectedDate = _weekDays[_selectedDay - 1]; // index 0-6

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildMonthYearTitle(),
              _buildDayScroller(),
              _buildSelectedDayInfo(selectedDate),
              // Daftar Card Jadwal
              Expanded(
                child: selectedDaySchedule.isEmpty
                    ? Align(
                        alignment: Alignment.topCenter,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.dangerous_outlined,
                              size: 180,
                              color: Theme.of(context).primaryColor,
                            ),
                            Text(
                              'Tidak ada jadwal',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                color: Theme.of(context).primaryColor,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 8.0),
                        itemCount: selectedDaySchedule.length,
                        itemBuilder: (context, index) {
                          final scheduleItem =
                              selectedDaySchedule[index]
                                  as Map<String, dynamic>;
                          return _buildScheduleCard(scheduleItem);
                        },
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}
