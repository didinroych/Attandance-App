import 'package:flutter/material.dart';
import 'package:mobile/providers/auth_provider.dart';
import 'package:mobile/screens/tabs/attendance_tab.dart';
import 'package:mobile/screens/tabs/home_tab.dart';
import 'package:mobile/screens/tabs/manage_attendance_tab.dart';
import 'package:mobile/screens/tabs/profile_tab.dart';
import 'package:mobile/screens/tabs/schedule_tab.dart';

import 'package:provider/provider.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;
  List<Widget> _tabs = [];
  List<BottomNavigationBarItem> _navItems = [];

  @override
  void initState() {
    super.initState();
    // Ambil role dari AuthProvider
    final role = Provider.of<AuthProvider>(context, listen: false).role;

    // Tentukan tab berdasarkan role
    if (role == 'student') {
      _tabs = [
        const HomeTab(),
        const AttendanceTab(), // Layar 'Attendance' untuk student
        const ScheduleTab(),
        const ProfileTab(),
      ];
      _navItems = [
        const BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
        const BottomNavigationBarItem(
          icon: Icon(Icons.check_circle),
          label: 'Attendance',
        ),
        const BottomNavigationBarItem(
          icon: Icon(Icons.calendar_today),
          label: 'Jadwal',
        ),
        const BottomNavigationBarItem(
          icon: Icon(Icons.person),
          label: 'Profile',
        ),
      ];
    } else if (role == 'teacher') {
      _tabs = [
        const HomeTab(),
        const ManageAttendanceTab(), // Layar 'Kelola Absen' untuk teacher
        const ScheduleTab(),
        const ProfileTab(),
      ];
      _navItems = [
        const BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
        const BottomNavigationBarItem(
          icon: Icon(Icons.edit_calendar),
          label: 'Kelola Absen',
        ),
        const BottomNavigationBarItem(
          icon: Icon(Icons.calendar_today),
          label: 'Jadwal',
        ),
        const BottomNavigationBarItem(
          icon: Icon(Icons.person),
          label: 'Profile',
        ),
      ];
    } else {
      // Default (misal: admin atau role lain)
      _tabs = [const HomeTab(), const ScheduleTab(), const ProfileTab()];
      _navItems = [
        const BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
        const BottomNavigationBarItem(
          icon: Icon(Icons.calendar_today),
          label: 'Jadwal',
        ),
        const BottomNavigationBarItem(
          icon: Icon(Icons.person),
          label: 'Profile',
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
    return Scaffold(
      body: IndexedStack(index: _selectedIndex, children: _tabs),
      bottomNavigationBar: BottomNavigationBar(
        items: _navItems,
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        type: BottomNavigationBarType.fixed, // Agar semua label terlihat
        selectedItemColor: Colors.blue,
        unselectedItemColor: Colors.grey,
      ),
    );
  }
}
