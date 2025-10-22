import 'package:flutter/material.dart';
import 'package:mobile/providers/auth_provider.dart';
import 'package:provider/provider.dart';

class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final profile = authProvider.userProfile;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil Saya'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
            onPressed: () => authProvider.logout(),
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
                  _buildProfileHeader(context, profile),
                  const SizedBox(height: 24),
                  Text(
                    "Informasi Detail",
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Divider(height: 24),

                  ...profile.entries
                      .where(
                        (entry) => ![
                          'id',
                          'username',
                          'email',
                          'role',
                          'fullName',
                        ].contains(entry.key),
                      )
                      .map((entry) {
                        return ProfileInfoTile(
                          title: _formatTitle(entry.key),
                          value: entry.value.toString(),
                        );
                      })
                      .toList(),

                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: () => authProvider.logout(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: theme.colorScheme.error,
                      foregroundColor: theme.colorScheme.onError,
                    ),
                    child: const Text('Logout'),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildProfileHeader(
    BuildContext context,
    Map<String, dynamic> profile,
  ) {
    final theme = Theme.of(context);
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            CircleAvatar(
              radius: 40,
              backgroundColor: theme.primaryColor,
              child: Text(
                profile['fullName']?.substring(0, 1) ?? 'U',
                style: const TextStyle(fontSize: 32, color: Colors.white),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              profile['fullName'] ?? 'Nama Pengguna',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              profile['email'] ?? 'email@pengguna.com',
              style: theme.textTheme.titleMedium?.copyWith(
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Chip(
              label: Text(
                _formatTitle(profile['role'] ?? 'user'),
                style: TextStyle(
                  color: theme.primaryColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
              backgroundColor: theme.primaryColor.withOpacity(0.1),
              side: BorderSide.none,
            ),
          ],
        ),
      ),
    );
  }

  String _formatTitle(String key) {
    if (key == 'profileId') return 'Profile ID';
    if (key == 'teacherId') return 'ID Guru (NIP)';
    if (key == 'studentId') return 'ID Siswa (NISN)';
    if (key == 'fullName') return 'Nama Lengkap';
    if (key == 'phone') return 'No. Telepon';
    if (key == 'role') return 'Role';
    return key[0].toUpperCase() + key.substring(1);
  }
}

class ProfileInfoTile extends StatelessWidget {
  final String title;
  final String value;

  const ProfileInfoTile({super.key, required this.title, required this.value});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6.0, horizontal: 0),
      elevation: 0,
      color: Theme.of(context).scaffoldBackgroundColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: ListTile(
        title: Text(
          title,
          style: TextStyle(
            fontWeight: FontWeight.normal,
            color: Colors.grey[600],
          ),
        ),
        subtitle: Text(
          value.isEmpty ? '-' : value,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: Theme.of(context).colorScheme.onBackground,
          ),
        ),
      ),
    );
  }
}
