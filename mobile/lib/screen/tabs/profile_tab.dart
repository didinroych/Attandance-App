import 'package:mobile/providers/auth_providers.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:intl/intl.dart';

class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  /// Helper untuk format tanggal lahir
  String _formatDate(String? isoDate) {
    if (isoDate == null) return 'N/A';
    try {
      final dt = DateTime.parse(isoDate);
      return DateFormat('d MMMM y', 'id_ID').format(dt);
    } catch (e) {
      return 'N/A';
    }
  }

  // --- FUNGSI DIALOG LOGOUT (REFINED UI) ---
  Future<void> _showLogoutConfirmation(
    BuildContext context,
    AuthProvider authProvider,
  ) async {
    final theme = Theme.of(context);

    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext dialogContext) {
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
                // --- 1. Header Icon (Logout / Warning) ---
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    // Warna merah soft untuk indikasi aksi keluar
                    color: theme.colorScheme.error.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.logout_rounded,
                    size: 32,
                    color: theme.colorScheme.error,
                  ),
                ),
                const SizedBox(height: 20),

                // --- 2. Title ---
                const Text(
                  'Konfirmasi Logout',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),

                // --- 3. Subtitle ---
                Text(
                  'Apakah Anda yakin ingin keluar dari aplikasi? Sesi Anda akan berakhir.',
                  style: TextStyle(color: Colors.grey[600], fontSize: 14),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),

                // --- 4. Action Buttons ---
                Row(
                  children: [
                    // Tombol Batal (Minimalis)
                    Expanded(
                      child: TextButton(
                        onPressed: () {
                          Navigator.of(dialogContext).pop(); // Tutup dialog
                        },
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

                    // Tombol Logout (Merah Solid)
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.of(dialogContext).pop(); // Tutup dialog
                          authProvider.logout(); // Eksekusi logout
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: theme.colorScheme.error,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Logout',
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

  @override
  Widget build(BuildContext context) {
    // Ambil data dari provider
    final authProvider = Provider.of<AuthProvider>(context);
    final profile = authProvider.userProfile;
    final role = authProvider.role;
    final theme = Theme.of(context);

    if (profile == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    // Ambil data spesifik
    final String fullName = profile['fullName'] ?? 'Nama Pengguna';
    final String username = profile['username'] ?? 'username';
    final String email = profile['email'] ?? 'N/A';
    final String idLabel = role == 'student' ? 'NISN' : 'NIP / ID Guru';
    final String idValue =
        profile['studentId'] ?? profile['teacherId'] ?? 'N/A';
    final String phoneLabel = role == 'student'
        ? 'Parents Number'
        : 'Phone Number';
    final String phoneValue =
        (role == 'student' ? profile['parentPhone'] : profile['phone']) ??
        'N/A';

    final String addressValue = profile['address'] ?? 'N/A';

    final String className = profile['className'] ?? 'Belum ada kelas';
    final String dob = _formatDate(profile['dateOfBirth']);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => authProvider.fetchProfile(),
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            children: [
              const SizedBox(height: 16.0),

              // --- SECTION 1: HEADER PROFIL ---
              _buildProfileHeader(theme, fullName, username),
              const SizedBox(height: 32),

              // --- SECTION 2: PERSONAL DATA ---
              Text(
                "Personal Data",
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 12),
              Card(
                elevation: 2,
                child: Column(
                  children: [
                    // Row 1: ID
                    _buildInfoRow(
                      theme,
                      icon: Icons.badge_outlined,
                      title: idLabel,
                      value: idValue,
                    ),

                    // Row 2: Kelas (Student Only)
                    if (role == 'student') ...[
                      _buildDivider(),
                      _buildInfoRow(
                        theme,
                        icon: Icons.school_outlined,
                        title: 'Class',
                        value: className,
                      ),
                    ],

                    // Row 3: Nama Lengkap
                    _buildDivider(),
                    _buildInfoRow(
                      theme,
                      icon: Icons.person_outline,
                      title: 'Full Name',
                      value: fullName,
                    ),

                    // Row 4: Nomor Telepon
                    _buildDivider(),
                    _buildInfoRow(
                      theme,
                      icon: Icons.phone_android_outlined,
                      title: phoneLabel,
                      value: phoneValue,
                    ),

                    // Row 5: Alamat
                    _buildDivider(),
                    _buildInfoRow(
                      theme,
                      icon: Icons.home_outlined,
                      title: 'Address',
                      value: addressValue,
                    ),

                    // Row 6: Email
                    _buildDivider(),
                    _buildInfoRow(
                      theme,
                      icon: Icons.mail_outline,
                      title: 'Email',
                      value: email,
                    ),

                    // Row 7: Tanggal Lahir (Student Only)
                    if (role == 'student') ...[
                      _buildDivider(),
                      _buildInfoRow(
                        theme,
                        icon: Icons.calendar_today_outlined,
                        title: 'Date of Birth',
                        value: dob,
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // --- SECTION 3: LOGOUT ---
              ElevatedButton(
                onPressed: () {
                  // Panggil fungsi dialog
                  _showLogoutConfirmation(context, authProvider);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: theme.colorScheme.error,
                  foregroundColor: theme.colorScheme.onError,
                ),
                child: const Text('Logout'),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  // ... (Widget helper _buildProfileHeader, _buildInfoRow, _buildDivider tidak berubah)

  /// SECTION 1 HELPER
  Widget _buildProfileHeader(
    ThemeData theme,
    String fullName,
    String username,
  ) {
    return Row(
      children: [
        CircleAvatar(
          radius: 30,
          backgroundColor: theme.primaryColor,
          child: Text(
            fullName.isNotEmpty ? fullName[0].toUpperCase() : '?',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                fullName,
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
                overflow: TextOverflow.ellipsis,
              ),
              Text(
                '@$username',
                style: theme.textTheme.titleMedium?.copyWith(
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  /// SECTION 2 HELPER (Row)
  Widget _buildInfoRow(
    ThemeData theme, {
    required IconData icon,
    required String title,
    required String value,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 14.0, horizontal: 16.0),
      child: Row(
        children: [
          Icon(icon, color: theme.primaryColor, size: 22),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// SECTION 2 HELPER (Divider)
  Widget _buildDivider() {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 16.0),
      child: Divider(height: 1, thickness: 1),
    );
  }
}
