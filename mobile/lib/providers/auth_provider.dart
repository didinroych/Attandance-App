import 'package:flutter/material.dart';
import 'package:mobile/services/api_exception.dart';
import 'package:mobile/services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  String? _token;
  String? _refreshToken;
  String? _role;
  Map<String, dynamic>? _userProfile;
  bool _isLoading = true;
  bool _isRefreshing = false;

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
    _refreshToken = prefs.getString('refreshToken');
    _role = prefs.getString('role');

    if (_token != null) {
      // Jika ada token, coba ambil data profil terbaru
      await fetchProfile();
    }
    _isLoading = false;
    notifyListeners();
  }

  bool get isUserApproved {
    if (_userProfile == null) return false;

    // Berdasarkan response profile Anda,
    // 'profileId' adalah penanda utama.
    // Anda juga bisa menambahkan 'studentId' atau 'teacherId' jika ada.
    return _userProfile!['profileId'] != null;
  }

  // --- BARU: Helper untuk menyimpan data sesi ---
  Future<void> _saveSession(
    String token,
    String? refreshToken,
    String role, {
    Map<String, dynamic>? user,
  }) async {
    _token = token;
    _role = role;
    if (user != null) _userProfile = user;
    if (refreshToken != null) _refreshToken = refreshToken;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
    await prefs.setString('role', role);
    if (refreshToken != null)
      await prefs.setString('refreshToken', refreshToken);
  }

  // --- BARU: Helper untuk menghapus data sesi ---
  Future<void> _clearSession() async {
    _token = null;
    _role = null;
    _refreshToken = null;
    _userProfile = null;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('role');
    await prefs.remove('refreshToken');
  }

  // --- BARU: Wrapper API dengan logika Refresh Token ---
  // Ini adalah fungsi paling penting di sini
  Future<T?> _apiCall<T>(Future<T> Function(String token) apiFunction) async {
    if (_token == null) {
      await logout();
      return null;
    }

    try {
      return await apiFunction(_token!);
    } on AuthException catch (_) {
      print('Access token expired. Refreshing...');
      if (_isRefreshing) return null;
      _isRefreshing = true;

      if (_refreshToken == null) {
        await logout();
        _isRefreshing = false;
        return null;
      }

      try {
        final response = await _apiService.refreshAccessToken(_refreshToken!);
        final newAccessToken = response['data']['accessToken'];
        final newUser = response['data']['user'];

        await _saveSession(
          newAccessToken,
          _refreshToken,
          newUser['role'],
          user: newUser,
        );
        print('Token refreshed successfully.');
        _isRefreshing = false;

        return await apiFunction(newAccessToken);
      } catch (refreshError) {
        print('Refresh token failed. Logging out. $refreshError');
        await logout();
        _isRefreshing = false;
        return null;
      }
    } catch (e) {
      print('A non-auth error occurred: $e');
      throw e;
    }
  }

  // Login handling
  Future<void> login(String username, String password) async {
    try {
      final response = await _apiService.login(username, password);

      final token = response['body']['data']['accessToken'];
      final role = response['body']['data']['user']['role'];
      final refreshToken = response['refreshToken'];

      await _saveSession(token, refreshToken, role);

      await fetchProfile();
      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }

  // Fungsi Register
  Future<void> register(String username, String email, String password) async {
    try {
      await _apiService.register(username, email, password);
    } catch (e) {
      rethrow;
    }
  }

  // Fungsi ambil profil
  Future<void> fetchProfile() async {
    if (_token == null) return;
    try {
      final response = await _apiCall((token) => _apiService.getProfile(token));

      if (response != null) {
        _userProfile = response['data']['user'];
        notifyListeners();
      }
    } catch (e) {
      print("Error fetching profile: $e");
    }
  }

  // MODIFIKASI: logout
  Future<void> logout() async {
    if (_refreshToken != null) {
      try {
        await _apiService.logout(_refreshToken!);
      } catch (e) {
        print("Error calling logout endpoint (ignored): $e");
      }
    }
    await _clearSession();
    notifyListeners();
  }

  Future<Map<String, dynamic>> getWeeklySchedule() async {
    if (!isUserApproved) {
      throw ApiException('Tunggu approval dari admin');
    }

    final response = await _apiCall(
      (token) => _apiService.getWeeklySchedule(token),
    );

    if (response == null) {
      // Jika null, berarti sesi berakhir
      throw ApiException('Sesi Anda berakhir. Silakan login kembali.');
    }
    return response;
  }
}
