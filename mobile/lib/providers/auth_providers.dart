import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mobile/services/api_exception.dart';
import 'package:mobile/services/api_services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io';

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

  // Memeriksa apakah user sudah memiliki profil (Student/Teacher) yang terhubung.
  bool get isUserApproved {
    if (_userProfile == null) return false;

    // Berdasarkan response profile Anda,
    // 'profileId' adalah penanda utama.
    // Anda juga bisa menambahkan 'studentId' atau 'teacherId' jika ada.
    return _userProfile!['profileId'] != null;
  }

  void triggerRefresh() {
    notifyListeners();
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
      // 1. Coba panggil API dengan token yang ada
      return await apiFunction(_token!);
    } on AuthException catch (_) {
      // 2. Jika GAGAL (AuthException), coba refresh token
      print('Access token expired. Refreshing...');
      if (_isRefreshing) return null; // Mencegah refresh ganda
      _isRefreshing = true;

      if (_refreshToken == null) {
        // Tidak punya refresh token, langsung logout
        await logout();
        _isRefreshing = false;
        return null;
      }

      try {
        // 3. Panggil API refresh
        final response = await _apiService.refreshAccessToken(_refreshToken!);
        final newAccessToken = response['data']['accessToken'];
        final newUser = response['data']['user'];

        // 4. Simpan sesi baru
        await _saveSession(
          newAccessToken,
          _refreshToken,
          newUser['role'],
          user: newUser,
        );
        print('Token refreshed successfully.');
        _isRefreshing = false;

        // 5. Ulangi panggilan API yang gagal dengan token BARU
        return await apiFunction(newAccessToken);
      } catch (refreshError) {
        // 6. Jika REFRESH GAGAL (refresh token juga expired), logout
        print('Refresh token failed. Logging out. $refreshError');
        await logout(); // Ini akan mengarahkan ke LoginScreen
        _isRefreshing = false;
        return null;
      }
    } catch (e) {
      // 7. Untuk error lain (koneksi putus, server 500)
      print('A non-auth error occurred: $e');
      throw e; // Lempar error agar UI bisa menangani (misal: "Koneksi Gagal")
    }
  }

  // MODIFIKASI: login
  Future<void> login(String username, String password) async {
    try {
      final response = await _apiService.login(username, password);

      final token = response['body']['data']['accessToken'];
      final role = response['body']['data']['user']['role'];
      final refreshToken = response['refreshToken'];

      // Gunakan helper baru
      await _saveSession(token, refreshToken, role);

      // Ambil data profile setelah login
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
      // Gunakan wrapper _apiCall
      final response = await _apiCall((token) => _apiService.getProfile(token));

      if (response != null) {
        // Simpan data user dari response
        _userProfile = response['data']['user'];
        notifyListeners();
      }
      // Jika response null, berarti proses logout sedang berjalan
    } catch (e) {
      // Menangani error non-autentikasi (misal: "Koneksi Gagal")
      print("Error fetching profile: $e");
      // Kita bisa lempar error ini ke UI jika mau
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
    // Gunakan helper baru
    await _clearSession();
    notifyListeners();
  }

  // -- FUNCTION UNTUK HOMEPAGE

  /// Helper untuk mendapatkan tanggal hari ini dalam format YYYY-MM-DD
  String get _todayDateString {
    return DateFormat('yyyy-MM-dd').format(DateTime.now());
  }

  /// Memanggil API GET /users/schedule/date
  Future<Map<String, dynamic>> getScheduleForToday() async {
    // Cek approval dulu
    if (!isUserApproved) {
      throw ApiException('Tunggu approval dari admin');
    }

    final response = await _apiCall(
      (token) => _apiService.getScheduleByDate(token, _todayDateString),
    );

    if (response == null) {
      throw ApiException('Sesi Anda berakhir.');
    }
    return response;
  }

  /// Memanggil API POST /teacher/sessions

  Future<Map<String, dynamic>> createSession(
    int classScheduleId,
    String? notes,
  ) async {
    if (role != 'teacher') {
      throw ApiException('Hanya guru yang bisa membuat sesi.');
    }

    final response = await _apiCall(
      // --- MODIFIKASI: Kirim 'notes' ---
      (token) => _apiService.createSession(
        token,
        classScheduleId,
        _todayDateString,
        notes,
      ),
    );

    if (response == null) {
      throw ApiException('Gagal membuat sesi.');
    }
    return response['data'];
  }

  Future<Map<String, dynamic>> getAcademicPeriods() async {
    // Cek approval dulu
    if (!isUserApproved) {
      throw ApiException('Tunggu approval dari admin');
    }

    final response = await _apiCall(
      (token) => _apiService.getAcademicPeriods(token),
    );

    if (response == null) {
      throw ApiException('Sesi Anda berakhir.');
    }
    return response;
  }

  /// Memanggil API GET /api/users/schedule/academic-period/{id}
  Future<Map<String, dynamic>> getAcademicSummary(int periodId) async {
    if (!isUserApproved) {
      throw ApiException('Tunggu approval dari admin');
    }

    final response = await _apiCall(
      (token) => _apiService.getAcademicSummary(token, periodId),
    );

    if (response == null) {
      throw ApiException('Gagal memuat ringkasan.');
    }
    return response;
  }

  /// Memanggil API GET /api/users/sessions/last
  Future<Map<String, dynamic>> getActiveSessions() async {
    if (!isUserApproved) {
      throw ApiException('Tunggu approval dari admin');
    }
    final response = await _apiCall(
      (token) => _apiService.getActiveSessions(token),
    );
    if (response == null) throw ApiException('Sesi Anda berakhir.');
    return response;
  }

  /// Memanggil API GET /api/teacher/sessions/{sessionId}
  Future<Map<String, dynamic>> getSessionDetails(int sessionId) async {
    if (!isUserApproved) {
      throw ApiException('Tunggu approval dari admin');
    }
    final response = await _apiCall(
      (token) => _apiService.getSessionDetails(token, sessionId),
    );
    if (response == null) throw ApiException('Gagal memuat detail sesi.');
    return response['data']; // Langsung kembalikan objek datanya
  }

  /// Memanggil API POST /api/teacher/sessions/{sessionId}/attendance
  Future<Map<String, dynamic>> submitAttendance(
    int sessionId,
    List<Map<String, dynamic>> attendances,
  ) async {
    if (role != 'teacher') {
      throw ApiException('Hanya guru yang bisa mengirim absensi.');
    }
    final response = await _apiCall(
      (token) => _apiService.submitAttendance(token, sessionId, attendances),
    );
    if (response == null) throw ApiException('Gagal mengirim absensi.');
    return response['data']; // Kembalikan pesan sukses
  }

  /// Memanggil API POST /student/attendance/check-in
  Future<Map<String, dynamic>> checkInFace(
    File imageFile,
    int sessionId,
  ) async {
    // Tidak perlu cek teacher/student di sini, biarkan API yang validasi
    // Tapi jika mau strict:
    // if (role != 'student') throw ApiException('Hanya siswa yang bisa scan wajah.');

    final response = await _apiCall(
      (token) => _apiService.checkInFaceAttendance(token, imageFile, sessionId),
    );

    if (response == null) throw ApiException('Gagal melakukan presensi.');
    return response; // Kembalikan response sukses (biasanya berisi pesan sukses/detail)
  }

  Future<void> requestResetPassword(String email) async {
    try {
      await _apiService.requestPasswordReset(email);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> verifyOtp(String email, String otp) async {
    try {
      await _apiService.verifyOtp(email, otp);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> resetPassword(
    String email,
    String otp,
    String newPassword,
  ) async {
    try {
      await _apiService.resetPassword(email, otp, newPassword);
    } catch (e) {
      rethrow;
    }
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
