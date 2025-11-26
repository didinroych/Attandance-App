import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class SubjectExpansionCard extends StatefulWidget {
  final Map<String, dynamic> subjectData;
  final String role;

  const SubjectExpansionCard({
    super.key,
    required this.subjectData,
    required this.role,
  });

  @override
  State<SubjectExpansionCard> createState() => _SubjectExpansionCardState();
}

class _SubjectExpansionCardState extends State<SubjectExpansionCard> {
  bool _isExpanded = false;

  String _formatDate(String isoDate) {
    try {
      final dt = DateTime.parse(isoDate);
      return DateFormat('dd MMM y', 'id_ID').format(dt);
    } catch (e) {
      return 'N/A';
    }
  }

  // ===========================================================================
  // HELPER WIDGET (SHARED)
  // ===========================================================================

  /// Widget Statistik Kotak (Modern UI)
  Widget _buildStatItem(
    String label,
    String value,
    Color color,
    IconData icon,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
      decoration: BoxDecoration(
        // FIX: Menggunakan withValues(alpha: ...) pengganti withOpacity
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: color.withValues(alpha: 0.2),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(icon, size: 18, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // LOGIC & UI: STUDENT (SISWA)
  // ===========================================================================

  void _showStudentDetailsSheet(
    BuildContext context,
    String subjectName,
    String rate,
    int totalMeetings,
    int presentCount,
    List<dynamic> sessions,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.75,
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              // Header Sheet
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 8, 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      "Detail Pertemuan",
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
              ),

              // Info Subjek
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        subjectName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.green.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        rate,
                        style: const TextStyle(
                          color: Colors.green,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const Divider(height: 1, thickness: 1),

              // List Sesi
              Expanded(
                child: sessions.isEmpty
                    ? const Center(child: Text("Belum ada sesi pertemuan."))
                    : ListView.separated(
                        padding: const EdgeInsets.symmetric(vertical: 8.0),
                        itemCount: sessions.length,
                        separatorBuilder: (context, index) =>
                            const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final session = sessions[index];
                          return _buildStudentSessionTile(session);
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStudentSessionTile(Map<String, dynamic> session) {
    final String meeting = "Pertemuan ${session['meetingNumber'] ?? '-'}";
    final String date = _formatDate(session['date']);
    final String attendance = session['myAttendance'] ?? 'N/A';
    final bool isPresent = attendance.toLowerCase() == 'present';

    return ListTile(
      title: Text(meeting, style: const TextStyle(fontWeight: FontWeight.bold)),
      subtitle: Text(date),
      trailing: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isPresent
              ? Colors.green.withValues(alpha: 0.1)
              : Colors.red.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isPresent
                ? Colors.green.withValues(alpha: 0.3)
                : Colors.red.withValues(alpha: 0.3),
          ),
        ),
        child: Text(
          attendance.toUpperCase(),
          style: TextStyle(
            color: isPresent ? Colors.green : Colors.red,
            fontWeight: FontWeight.bold,
            fontSize: 12,
          ),
        ),
      ),
    );
  }

  Widget _buildStudentCard(BuildContext context) {
    final String subjectName = widget.subjectData['subject']?['name'] ?? 'N/A';
    final int totalMeetings = widget.subjectData['totalMeetings'] ?? 0;
    final List<dynamic> sessions = widget.subjectData['sessions'] ?? [];

    int presentCount = 0;
    for (var s in sessions) {
      if (s['myAttendance']?.toLowerCase() == 'present') {
        presentCount++;
      }
    }
    double rate = (totalMeetings > 0) ? (presentCount / totalMeetings) : 0;
    String ratePercent = "${(rate * 100).toStringAsFixed(0)}%";

    Color rateColor = rate >= 0.75 ? Colors.green : Colors.orange;
    if (rate < 0.5) rateColor = Colors.red;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => setState(() => _isExpanded = !_isExpanded),
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.blue.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.book_outlined,
                      color: Colors.blue,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          subjectName,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(height: 4),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: rate,
                            backgroundColor: Colors.grey[200],
                            valueColor: AlwaysStoppedAnimation<Color>(
                              rateColor,
                            ),
                            minHeight: 4,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    ratePercent,
                    style: TextStyle(
                      color: rateColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(
                    _isExpanded
                        ? Icons.keyboard_arrow_up
                        : Icons.keyboard_arrow_down,
                    color: Colors.grey,
                  ),
                ],
              ),
            ),

            // Expanded Content
            if (_isExpanded)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: Column(
                  children: [
                    const Divider(height: 1),
                    const SizedBox(height: 16),

                    Row(
                      children: [
                        Expanded(
                          child: _buildStatItem(
                            "Total Pertemuan",
                            totalMeetings.toString(),
                            Colors.blue,
                            Icons.calendar_today,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildStatItem(
                            "Kehadiran",
                            presentCount.toString(),
                            Colors.green,
                            Icons.check_circle_outline,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildStatItem(
                            "Persentase Kehadiran",
                            ratePercent,
                            rateColor,
                            Icons.pie_chart_outline,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () => _showStudentDetailsSheet(
                          context,
                          subjectName,
                          ratePercent,
                          totalMeetings,
                          presentCount,
                          sessions,
                        ),
                        icon: const Icon(Icons.list_alt, size: 18),
                        label: const Text("Lihat Riwayat Pertemuan"),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          side: BorderSide(
                            color: Theme.of(context).primaryColor,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  // ===========================================================================
  // LOGIC & UI: TEACHER (GURU)
  // ===========================================================================

  void _showTeacherDetailsSheet(
    BuildContext context,
    String subjectName,
    int totalMeetings,
    List<dynamic> sessions,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.75,
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 8, 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      "Detail Sesi",
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
              ),

              // Info Subjek
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    subjectName,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    "Menampilkan $totalMeetings total pertemuan",
                    style: TextStyle(color: Colors.grey[600], fontSize: 13),
                  ),
                ),
              ),

              const Divider(height: 1, thickness: 1),

              // List Sesi
              Expanded(
                child: sessions.isEmpty
                    ? const Center(child: Text("Belum ada sesi pertemuan."))
                    : ListView.separated(
                        padding: const EdgeInsets.symmetric(vertical: 8.0),
                        itemCount: sessions.length,
                        separatorBuilder: (context, index) =>
                            const SizedBox(height: 0),
                        itemBuilder: (context, index) {
                          final session = sessions[index];
                          return _buildTeacherSessionTile(session);
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTeacherSessionTile(Map<String, dynamic> session) {
    final String meeting = "Pertemuan ${session['meetingNumber'] ?? '-'}";
    final String date = _formatDate(session['date']);
    final summary = session['summary'];

    final int absent = summary?['absent'] ?? 0;
    final int present = summary?['present'] ?? 0;
    final int excused = summary?['excused'] ?? 0;
    final int late = summary?['late'] ?? 0;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.05),
            blurRadius: 5,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Pertemuan & Tanggal
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                meeting,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                date,
                style: TextStyle(color: Colors.grey[600], fontSize: 13),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Statistik: Grid 2x2
          Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: _buildStatItem(
                      "Hadir",
                      present.toString(),
                      Colors.green,
                      Icons.check_circle_outline,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildStatItem(
                      "Alpha",
                      absent.toString(),
                      Colors.red,
                      Icons.cancel_outlined,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildStatItem(
                      "Izin",
                      excused.toString(),
                      Colors.blue,
                      Icons.info_outline,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildStatItem(
                      "Terlambat",
                      late.toString(),
                      Colors.orange,
                      Icons.access_time,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTeacherCard(BuildContext context) {
    final String subjectName = widget.subjectData['subject']?['name'] ?? 'N/A';
    final int totalMeetings = widget.subjectData['totalMeetings'] ?? 0;
    final List<dynamic> sessions = widget.subjectData['sessions'] ?? [];

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => setState(() => _isExpanded = !_isExpanded),
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(
                vertical: 20.0,
                horizontal: 16.0,
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.orange.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.class_outlined,
                      color: Colors.orange,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      subjectName,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                  Text(
                    "$totalMeetings Pertemuan",
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(
                    _isExpanded
                        ? Icons.keyboard_arrow_up
                        : Icons.keyboard_arrow_down,
                    color: Colors.grey,
                  ),
                ],
              ),
            ),

            // Expanded Content
            if (_isExpanded)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: Column(
                  children: [
                    const Divider(height: 1),
                    const SizedBox(height: 16),

                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          _showTeacherDetailsSheet(
                            context,
                            subjectName,
                            totalMeetings,
                            sessions,
                          );
                        },
                        icon: const Icon(Icons.grid_view, size: 18),
                        label: const Text("Lihat Dashboard Sesi"),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          side: BorderSide(
                            color: Theme.of(context).primaryColor,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  // ===========================================================================
  // BUILD UTAMA (PERBAIKAN: METHOD INI SEKARANG ADA)
  // ===========================================================================

  @override
  Widget build(BuildContext context) {
    return widget.role == 'student'
        ? _buildStudentCard(context)
        : _buildTeacherCard(context);
  }
}
