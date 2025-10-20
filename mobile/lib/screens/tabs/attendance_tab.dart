import 'package:flutter/material.dart';

class AttendanceTab extends StatelessWidget {
  const AttendanceTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Attendance')),
      body: const Center(
        child: Text(
          'Halaman Attendance (Student)',
          style: TextStyle(fontSize: 24),
        ),
      ),
    );
  }
}
