import 'package:mobile/providers/auth_providers.dart';
import 'package:mobile/screen/tabs/attendance_tab.dart';
import 'package:mobile/screen/tabs/home_tab.dart';
import 'package:mobile/screen/tabs/manage_attendance_tab.dart';
import 'package:mobile/screen/tabs/profile_tab.dart';
import 'package:mobile/screen/tabs/schedule_tab.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:salomon_bottom_bar/salomon_bottom_bar.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;
  List<Widget> _tabs = [];

  // --- MODIFIKASI: Tipe list diubah ---
  List<SalomonBottomBarItem> _navBarItems = [];

  // Callback untuk navigasi tab dari Home
  void _navigateToTab(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  void initState() {
    super.initState();
    // Ambil role dari AuthProvider
    final role = Provider.of<AuthProvider>(context, listen: false).role;

    // Tentukan tab berdasarkan role
    if (role == 'student') {
      _tabs = [
        HomeTab(
          navigateToProfile: () => _navigateToTab(3), // Index Profile
          navigateToSchedule: () => _navigateToTab(2), // Index Jadwal
          navigateToManageAttendance: null, // Student tidak punya ini
        ),
        const AttendanceTab(), // Layar 'Attendance' untuk student
        const ScheduleTab(),
        const ProfileTab(),
      ];
      // --- MODIFIKASI: Gunakan SalomonBottomBarItem ---
      _navBarItems = [
        SalomonBottomBarItem(
          icon: const Icon(Icons.home_outlined),
          activeIcon: const Icon(Icons.home),
          title: const Text('Home'),
        ),
        SalomonBottomBarItem(
          icon: const Icon(Icons.check_circle_outline),
          activeIcon: const Icon(Icons.check_circle),
          title: const Text('Attendance'),
        ),
        SalomonBottomBarItem(
          icon: const Icon(Icons.calendar_today_outlined),
          activeIcon: const Icon(Icons.calendar_today),
          title: const Text('Jadwal'),
        ),
        SalomonBottomBarItem(
          icon: const Icon(Icons.person_outline),
          activeIcon: const Icon(Icons.person),
          title: const Text('Profile'),
        ),
      ];
    } else if (role == 'teacher') {
      _tabs = [
        HomeTab(
          navigateToProfile: () => _navigateToTab(3), // Index Profile
          navigateToSchedule: () => _navigateToTab(2), // Index Jadwal
          navigateToManageAttendance: () =>
              _navigateToTab(1), // Index Kelola Absen
        ),
        const ManageAttendanceTab(), // Layar 'Kelola Absen' untuk teacher
        const ScheduleTab(),
        const ProfileTab(),
      ];
      // --- MODIFIKASI: Gunakan SalomonBottomBarItem ---
      _navBarItems = [
        SalomonBottomBarItem(
          icon: const Icon(Icons.home_outlined),
          activeIcon: const Icon(Icons.home),
          title: const Text('Home'),
        ),
        SalomonBottomBarItem(
          icon: const Icon(Icons.edit_calendar_outlined),
          activeIcon: const Icon(Icons.edit_calendar),
          title: const Text('Kelola Absen'),
        ),
        SalomonBottomBarItem(
          icon: const Icon(Icons.calendar_today_outlined),
          activeIcon: const Icon(Icons.calendar_today),
          title: const Text('Jadwal'),
        ),
        SalomonBottomBarItem(
          icon: const Icon(Icons.person_outline),
          activeIcon: const Icon(Icons.person),
          title: const Text('Profile'),
        ),
      ];
    } else {
      // Default (misal: admin atau role lain)
      _tabs = [const ScheduleTab(), const ProfileTab()];
      // --- MODIFIKASI: Gunakan SalomonBottomBarItem ---
      _navBarItems = [
        SalomonBottomBarItem(
          icon: const Icon(Icons.calendar_today_outlined),
          activeIcon: const Icon(Icons.calendar_today),
          title: const Text('Jadwal'),
        ),
        SalomonBottomBarItem(
          icon: const Icon(Icons.person_outline),
          activeIcon: const Icon(Icons.person),
          title: const Text('Profile'),
        ),
      ];
    }
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    // Ambil warna tema
    final theme = Theme.of(context);

    return Scaffold(
      body: IndexedStack(index: _selectedIndex, children: _tabs),

      // --- PERUBAHAN UTAMA DI SINI ---
      bottomNavigationBar: SalomonBottomBar(
        // Hubungkan state
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,

        // Ambil warna dari Tema
        selectedItemColor: theme.primaryColor,
        unselectedItemColor: Colors.grey[600],

        // Tambahan styling estetik
        margin: const EdgeInsets.symmetric(horizontal: 30, vertical: 10),
        itemPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
        curve: Curves.easeOutQuint,

        // Tampilkan item yang sudah kita buat
        items: _navBarItems,
      ),
      // --- AKHIR PERUBAHAN ---
    );
  }
}
