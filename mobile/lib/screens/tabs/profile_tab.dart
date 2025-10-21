import 'package:flutter/material.dart';
import 'package:mobile/providers/auth_provider.dart';
import 'package:provider/provider.dart';

class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    // Ambil data profil dari provider
    final authProvider = Provider.of<AuthProvider>(context);
    final profile = authProvider.userProfile;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil Saya'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
            onPressed: () {
              // Panggil fungsi logout dari provider
              authProvider.logout();
            },
          ),
        ],
      ),
      body: profile == null
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => authProvider.fetchProfile(),
              child: ListView(
                padding: const EdgeInsets.all(16.0),
                children: [
                  // Gunakan .entries.map untuk menampilkan SEMUA data
                  ...profile.entries.map((entry) {
                    return ProfileInfoTile(
                      title: _formatTitle(entry.key), // Format key
                      value: entry.value.toString(),
                    );
                  }).toList(),

                  // Tambahkan tombol logout di bawah
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      authProvider.logout();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red[700],
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Logout'),
                  ),
                ],
              ),
            ),
    );
  }

  // Helper untuk membuat key JSON lebih mudah dibaca
  String _formatTitle(String key) {
    if (key == 'profileId') return 'Profile ID';
    if (key == 'teacherId') return 'Teacher ID';
    if (key == 'studentId') return 'Student ID';
    if (key == 'fullName') return 'Nama Lengkap';
    // Tambahkan format lain jika perlu
    return key[0].toUpperCase() + key.substring(1);
  }
}

// Widget kustom untuk menampilkan info profil
class ProfileInfoTile extends StatelessWidget {
  final String title;
  final String value;

  const ProfileInfoTile({super.key, required this.title, required this.value});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6.0),
      child: ListTile(
        title: Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            color: Colors.blue,
          ),
        ),
        subtitle: Text(
          value.isEmpty ? '-' : value,
          style: Theme.of(context).textTheme.titleMedium,
        ),
      ),
    );
  }
}
