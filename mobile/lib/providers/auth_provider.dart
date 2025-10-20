import 'package:flutter/material.dart';
import 'package:mobile/services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  String? _token;
  String? _refreshToken; // BARU: Simpan refresh token
  String? _role;
  Map<String, dynamic>? _userProfile;
  bool _isLoading = true;

  // Getters
  String? get token => _token;
  String? get role => _role;
  Map<String, dynamic>? get userProfile => _userProfile;
  bool get isAuthenticated => _token != null;
  bool get isLoading => _isLoading;

  // MODIFIKASI: initAuth
  Future<void> initAuth() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
    _refreshToken = prefs.getString('refreshToken'); // BARU
    _role = prefs.getString('role');

    if (_token != null) {
      // Jika ada token, coba ambil data profil terbaru
      await fetchProfile();
    }
    _isLoading = false;
    notifyListeners();
  }

  // MODIFIKASI: login
  Future<void> login(String username, String password) async {
    try {
      final response = await _apiService.login(username, password);

      // Ambil data dari response baru
      _token = response['body']['data']['accessToken'];
      _role = response['body']['data']['user']['role'];
      _refreshToken = response['refreshToken']; // BARU

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', _token!);
      await prefs.setString('role', _role!);
      if (_refreshToken != null) {
        // BARU
        await prefs.setString('refreshToken', _refreshToken!);
      }

      // Setelah login berhasil, langsung ambil data profile
      await fetchProfile();
      notifyListeners();
    } catch (e) {
      // Lempar error untuk ditangani oleh UI
      rethrow;
    }
  }

  // Fungsi Register
  Future<void> register(String username, String email, String password) async {
    // ... (tidak ada perubahan)
    try {
      await _apiService.register(username, email, password);
    } catch (e) {
      rethrow;
    }
  }

  // Fungsi ambil profil
  Future<void> fetchProfile() async {
    // ... (tidak ada perubahan)
    if (_token == null) return;
    try {
      final response = await _apiService.getProfile(_token!);
      _userProfile = response['data']['user']; // Simpan semua data profil
      notifyListeners();
    } catch (e) {
      if (e.toString().contains('401') ||
          e.toString().contains('Unauthorized')) {
        await logout();
      }
      print("Error fetching profile: $e");
    }
  }

  // MODIFIKASI: logout
  Future<void> logout() async {
    // 1. Panggil API logout SEBELUM menghapus data lokal
    if (_refreshToken != null) {
      try {
        await _apiService.logout(_refreshToken!);
      } catch (e) {
        // Jika gagal logout dari server (misal: token expired),
        // tetap lanjutkan proses logout lokal
        print("Error calling logout endpoint: $e");
      }
    }

    // 2. Hapus semua data sesi lokal
    _token = null;
    _role = null;
    _refreshToken = null; // BARU
    _userProfile = null;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('role');
    await prefs.remove('refreshToken'); // BARU

    notifyListeners();
  }
}
