import 'package:flutter/material.dart';
import 'package:mobile/constants/app_theme.dart';
import 'package:mobile/providers/auth_provider.dart';
import 'package:mobile/screens/auth/login_screen.dart';
import 'package:mobile/screens/main_screen.dart';
import 'package:provider/provider.dart';

// MODIFIKASI: Jadikan main() sebagai async
Future<void> main() async {
  // BARU: Pastikan Flutter binding siap
  WidgetsFlutterBinding.ensureInitialized();

  runApp(
    ChangeNotifierProvider(
      // MODIFIKASI: HANYA create provider, jangan panggil initAuth()
      create: (context) => AuthProvider(),
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'School Attendance',
      theme: AppTheme.lightTheme,
      home: const AuthCheck(), // Kita pindah logikanya ke AuthCheck
      debugShowCheckedModeBanner: false,
    );
  }
}

// MODIFIKASI: Ubah AuthCheck menjadi StatefulWidget
class AuthCheck extends StatefulWidget {
  const AuthCheck({super.key});

  @override
  State<AuthCheck> createState() => _AuthCheckState();
}

class _AuthCheckState extends State<AuthCheck> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AuthProvider>(context, listen: false).initAuth();
    });
  }

  @override
  Widget build(BuildContext context) {
    // Sekarang kita 'watch' perubahannya
    final authProvider = Provider.of<AuthProvider>(context);

    // Saat isLoading, tampilkan loading screen
    if (authProvider.isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    // Setelah selesai loading, baru tentukan rute
    return authProvider.isAuthenticated
        ? const MainScreen()
        : const LoginScreen();
  }
}
