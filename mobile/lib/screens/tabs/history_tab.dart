import 'package:flutter/material.dart';

class HistoryTab extends StatelessWidget {
  const HistoryTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Riwayat Presensi')),
      body: const Center(
        child: Text(
          'Halaman Riwayat (History)',
          style: TextStyle(fontSize: 20),
        ),
      ),
    );
  }
}
