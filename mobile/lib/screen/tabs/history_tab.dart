import 'package:mobile/providers/auth_providers.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
// Pastikan path ke widget kustom Anda benar
import 'package:mobile/widgets/subject_expansion_card.dart';

class HistoryTab extends StatefulWidget {
  const HistoryTab({super.key});

  @override
  State<HistoryTab> createState() => _HistoryTabState();
}

class _HistoryTabState extends State<HistoryTab> {
  // State untuk menyimpan daftar periode akademik
  List<dynamic> _academicPeriods = [];
  // State untuk menyimpan periode yang sedang dipilih
  Map<String, dynamic>? _selectedPeriod;
  // State untuk memuat data summary
  Future<Map<String, dynamic>>? _summaryFuture;

  @override
  void initState() {
    super.initState();
    // Panggil API untuk pertama kali
    _loadInitialData();
  }

  /// Memuat daftar periode akademik dan memicu pemuatan summary
  void _loadInitialData() {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    auth
        .getAcademicPeriods()
        .then((response) {
          if (!mounted) return;
          setState(() {
            _academicPeriods = response['data'] ?? [];
            if (_academicPeriods.isNotEmpty) {
              // Cari periode yang aktif
              _selectedPeriod = _academicPeriods.firstWhere(
                (p) => p['isActive'] == true,
                orElse: () =>
                    _academicPeriods.first, // Fallback ke item pertama
              );
              // Muat summary untuk periode yang aktif
              _loadSummary();
            }
          });
        })
        .catchError((error) {
          // Tangani error jika gagal memuat periode
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Gagal memuat periode akademik: $error')),
            );
          }
        });
  }

  /// Memuat (atau me-refresh) data summary berdasarkan _selectedPeriod
  void _loadSummary() {
    if (_selectedPeriod == null) return;
    final auth = Provider.of<AuthProvider>(context, listen: false);
    setState(() {
      _summaryFuture = auth.getAcademicSummary(_selectedPeriod!['id']);
    });
  }

  void _showPeriodSelector(BuildContext context) {
    final theme = Theme.of(context);

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true, // Agar bisa menyesuaikan tinggi konten
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        // Batasi tinggi maksimal agar tidak full screen jika list sangat panjang
        return DraggableScrollableSheet(
          initialChildSize: 0.5, // Mulai dari setengah layar
          minChildSize: 0.3,
          maxChildSize: 0.9,
          expand: false,
          builder: (context, scrollController) {
            return Column(
              children: [
                // --- 1. Drag Handle & Header ---
                Center(
                  child: Container(
                    width: 48,
                    height: 5,
                    margin: const EdgeInsets.only(top: 12, bottom: 20),
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 0,
                  ),
                  child: Row(
                    children: [
                      Text(
                        "Pilih Tahun Akademik",
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          fontSize: 20,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // --- 2. List Item (Modern Cards) ---
                Expanded(
                  child: ListView.separated(
                    controller:
                        scrollController, // Sambungkan scroll controller
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    itemCount: _academicPeriods.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final period = _academicPeriods[index];
                      final bool isSelected =
                          period['id'] == _selectedPeriod!['id'];
                      final bool isActive = period['isActive'] == true;

                      // Bersihkan nama: "Academic Year 2025/2026 - Semester 1" -> "2025/2026 - Semester 1"
                      final String displayName = period['name']
                          .toString()
                          .replaceFirst("Academic Year ", "");

                      return InkWell(
                        onTap: () {
                          Navigator.of(context).pop();
                          if (!isSelected) {
                            setState(() {
                              _selectedPeriod = period;
                              _loadSummary(); // Muat ulang data summary
                            });
                          }
                        },
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? theme.primaryColor.withValues(alpha: 0.08)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isSelected
                                  ? theme.primaryColor
                                  : Colors.grey.withValues(alpha: 0.2),
                              width: isSelected ? 2 : 1,
                            ),
                            boxShadow: isSelected
                                ? []
                                : [
                                    BoxShadow(
                                      color: Colors.grey.withValues(
                                        alpha: 0.05,
                                      ),
                                      blurRadius: 4,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                          ),
                          child: Row(
                            children: [
                              // Ikon Kalender
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? theme.primaryColor
                                      : Colors.grey.withValues(alpha: 0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  Icons.calendar_today_outlined,
                                  size: 20,
                                  color: isSelected
                                      ? Colors.white
                                      : Colors.grey[600],
                                ),
                              ),
                              const SizedBox(width: 16),

                              // Teks Informasi
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      displayName,
                                      style: TextStyle(
                                        fontSize: 15,
                                        fontWeight: isSelected
                                            ? FontWeight.bold
                                            : FontWeight.w500,
                                        color: isSelected
                                            ? theme.primaryColor
                                            : Colors.black87,
                                      ),
                                    ),
                                    // Badge "Aktif" jika isActive == true
                                    if (isActive) ...[
                                      const SizedBox(height: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: Colors.green.withValues(
                                            alpha: 0.1,
                                          ),
                                          borderRadius: BorderRadius.circular(
                                            6,
                                          ),
                                        ),
                                        child: const Text(
                                          "Sedang Berlangsung",
                                          style: TextStyle(
                                            fontSize: 10,
                                            color: Colors.green,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),

                              // Ikon Centang (Check)
                              if (isSelected)
                                Icon(
                                  Icons.check_circle,
                                  color: theme.primaryColor,
                                ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final profile = auth.userProfile;
    final role = auth.role;

    return Scaffold(
      appBar: AppBar(title: const Text('Riwayat Presensi')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // --- SECTION 1: User Header Card ---
            _buildUserHeader(theme, profile),
            const SizedBox(height: 24),

            // --- SECTION 2: Academic Period Selector ---
            Text(
              "Tahun Akademik",
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            _buildPeriodSelectorCard(theme),
            const SizedBox(height: 24),

            // --- SECTION 3: Subject List ---
            Text(
              "Mata Pelajaran",
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            _buildSummaryList(role ?? 'student'),
          ],
        ),
      ),
    );
  }

  /// SECTION 1 WIDGET
  Widget _buildUserHeader(ThemeData theme, Map<String, dynamic>? profile) {
    final String fullName = profile?['fullName'] ?? 'Nama Pengguna';
    final String idLabel = (profile?['role'] ?? 'student') == 'student'
        ? 'Student ID'
        : 'Teacher ID';
    final String idValue =
        profile?['studentId'] ?? profile?['teacherId'] ?? 'N/A';

    return Card(
      color: theme.primaryColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Row(
          children: [
            // Kolom Kiri
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Nama",
                    style: TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                  Text(
                    fullName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            // Kolom Kanan
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    idLabel,
                    style: const TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                  Text(
                    idValue,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.right,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// SECTION 2 WIDGET
  Widget _buildPeriodSelectorCard(ThemeData theme) {
    if (_selectedPeriod == null) {
      return const Card(child: ListTile(title: Text("Memuat...")));
    }

    // "Academic Year 2025/2026 - Semester 1" -> "2025/2026 - Semester 1"
    final String periodName = _selectedPeriod!['name'].toString().replaceFirst(
      "Academic Year ",
      "",
    );

    return Card(
      child: InkWell(
        onTap: () => _showPeriodSelector(context),
        child: ListTile(
          title: Text(
            periodName,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          trailing: const Icon(Icons.arrow_drop_down),
        ),
      ),
    );
  }

  /// SECTION 3 WIDGET (FutureBuilder)
  Widget _buildSummaryList(String role) {
    if (_summaryFuture == null) {
      // Tampil loading jika _selectedPeriod belum siap
      return const Center(child: CircularProgressIndicator());
    }

    return FutureBuilder<Map<String, dynamic>>(
      future: _summaryFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(child: Text('Gagal memuat data: ${snapshot.error}'));
        }
        if (!snapshot.hasData || snapshot.data!['data'] == null) {
          return const Center(child: Text('Tidak ada data.'));
        }

        final List<dynamic> subjects = snapshot.data!['data']['subjects'] ?? [];
        if (subjects.isEmpty) {
          return const Center(
            child: Text('Tidak ada mata pelajaran di periode ini.'),
          );
        }

        // Gunakan ListView.separated untuk memberi jarak
        return ListView.separated(
          shrinkWrap: true, // Wajib di dalam SingleChildScrollView
          physics: const NeverScrollableScrollPhysics(),
          itemCount: subjects.length,
          // Margin antar kartu dikurangi
          separatorBuilder: (context, index) => const SizedBox(height: 4),
          itemBuilder: (context, index) {
            final subjectData = subjects[index] as Map<String, dynamic>;
            // Kirim data ke widget kustom
            return SubjectExpansionCard(subjectData: subjectData, role: role);
          },
        );
      },
    );
  }
}
