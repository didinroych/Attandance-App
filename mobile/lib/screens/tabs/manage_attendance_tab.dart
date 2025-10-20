import 'package:flutter/material.dart';

class ManageAttendanceTab extends StatelessWidget {
  const ManageAttendanceTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Kelola Absen')),
      body: const Center(
        child: Text(
          'Halaman Kelola Absen (Teacher)',
          style: TextStyle(fontSize: 24),
        ),
      ),
    );
  }
}
