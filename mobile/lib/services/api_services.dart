import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:mobile/services/api_exception.dart';

class ApiService {
  // Ganti dengan IP/domain Anda jika menjalankan di HP
  static const String _baseUrl = "https://attendify.chafi.dev/api";

  // Helper untuk membuat header
  Map<String, String> _getHeaders(String? token) {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  // Login
  Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/auth/login'),
      headers: _getHeaders(null),
      body: jsonEncode({'username': username, 'password': password}),
    );

    // Manually handle response to extract cookie
    final body = jsonDecode(response.body);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      String? setCookie = response.headers['set-cookie'];
      String? refreshToken;

      if (setCookie != null) {
        // Parser sederhana untuk mengambil value dari "refreshToken=..."
        try {
          final cookie = setCookie
              .split(';')
              .firstWhere((c) => c.trim().startsWith('refreshToken='));
          refreshToken = cookie.split('=')[1];
        } catch (e) {
          print("Could not parse refreshToken from cookie: $e");
          refreshToken = null;
        }
      }
      // Kembalikan body dan refreshToken
      return {'body': body, 'refreshToken': refreshToken};
    } else {
      throw Exception(body['message'] ?? 'An error occurred');
    }
  }

  // logout
  Future<Map<String, dynamic>> logout(String refreshToken) async {
    // Buat header khusus untuk logout
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // Tambahkan header Cookie secara manual
      'Cookie': 'refreshToken=$refreshToken',
    };

    final response = await http.post(
      Uri.parse('$_baseUrl/auth/logout'),
      headers: headers,
    );

    // Gunakan _handleResponse standar
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> register(
    String username,
    String email,
    String password,
  ) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/auth/register'),
      headers: _getHeaders(null),
      body: jsonEncode({
        'username': username,
        'email': email,
        'password': password,
      }),
    );
    return _handleResponse(response);
  }

  // Refresh Access token
  Future<Map<String, dynamic>> refreshAccessToken(String refreshToken) async {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': 'refreshToken=$refreshToken', // Sesuai API Anda
    };

    final response = await http.post(
      Uri.parse('$_baseUrl/auth/access-token'),
      headers: headers,
    );
    // Kita pakai _handleResponse agar error-nya juga konsisten
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> getProfile(String token) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/users/profile'),
      headers: _getHeaders(token),
    );
    return _handleResponse(response);
  }

  // Future<Map<String, dynamic>> getClassSchedule(String token) async {
  //   final response = await http.get(
  //     Uri.parse('$_baseUrl/users/class-schedule'),
  //     headers: _getHeaders(token),
  //   );
  //   return _handleResponse(response);
  // }

  Future<Map<String, dynamic>> getWeeklySchedule(String token) async {
    final response = await http.get(
      // URL ENDPOINT BARU
      Uri.parse('$_baseUrl/users/schedule/weekly'),
      headers: _getHeaders(token),
    );
    // _handleResponse tidak perlu diubah
    return _handleResponse(response);
  }

  // -- API UNTUK HOME TAB --
  /// GET /api/users/schedule/date?date=$YYYY-MM-DD
  Future<Map<String, dynamic>> getScheduleByDate(
    String token,
    String date,
  ) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/users/schedule/date?date=$date'),
      headers: _getHeaders(token),
    );
    return _handleResponse(response);
  }

  /// POST /api/teacher/sessions
  // --- MODIFIKASI: Tambahkan 'notes' ---
  Future<Map<String, dynamic>> createSession(
    String token,
    int classScheduleId,
    String date,
    String? notes,
  ) async {
    // Buat body
    final Map<String, dynamic> body = {
      'classScheduleId': classScheduleId,
      'date': date,
    };
    // Tambahkan notes jika ada
    if (notes != null && notes.isNotEmpty) {
      body['notes'] = notes;
    }

    final response = await http.post(
      Uri.parse('$_baseUrl/teacher/sessions'),
      headers: _getHeaders(token),
      // --- MODIFIKASI: Gunakan body baru ---
      body: jsonEncode(body),
    );
    return _handleResponse(response);
  }

  /// GET /api/users/academic-periode
  Future<Map<String, dynamic>> getAcademicPeriods(String token) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/users/academic-periode'),
      headers: _getHeaders(token),
    );
    return _handleResponse(response);
  }

  /// GET /api/users/schedule/academic-period/{id}
  Future<Map<String, dynamic>> getAcademicSummary(
    String token,
    int periodId,
  ) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/users/schedule/academic-period/$periodId'),
      headers: _getHeaders(token),
    );
    return _handleResponse(response);
  }

  /// GET /api/users/sessions/last
  Future<Map<String, dynamic>> getActiveSessions(String token) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/users/sessions/last'),
      headers: _getHeaders(token),
    );
    return _handleResponse(response);
  }

  /// GET /api/teacher/sessions/{sessionId}
  Future<Map<String, dynamic>> getSessionDetails(
    String token,
    int sessionId,
  ) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/teacher/sessions/$sessionId'),
      headers: _getHeaders(token),
    );
    return _handleResponse(response);
  }

  /// POST /api/teacher/sessions/{sessionId}/attendance
  Future<Map<String, dynamic>> submitAttendance(
    String token,
    int sessionId,
    List<Map<String, dynamic>> attendances,
  ) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/teacher/sessions/$sessionId/attendance'),
      headers: _getHeaders(token),
      body: jsonEncode({'attendances': attendances}),
    );
    return _handleResponse(response);
  }

  /// POST /api/student/attendance/check-in
  Future<Map<String, dynamic>> checkInFaceAttendance(
    String token,
    File imageFile,
    int sessionId,
  ) async {
    var uri = Uri.parse('$_baseUrl/student/attendance/check-in');
    var request = http.MultipartRequest('POST', uri);

    request.headers.addAll({
      'Authorization': 'Bearer $token',
      'Accept': 'application/json',
    });

    request.fields['sessionId'] = sessionId.toString();

    // --- PERBAIKAN UTAMA DI SINI ---
    // Kita tambahkan contentType: MediaType('image', 'jpeg')
    request.files.add(
      await http.MultipartFile.fromPath(
        'image',
        imageFile.path,
        contentType: MediaType('image', 'jpeg'), // <--- INI KUNCINYA
      ),
    );

    var streamedResponse = await request.send();
    var response = await http.Response.fromStream(streamedResponse);

    return _handleResponse(response);
  }

  // Helper untuk memproses response
  Map<String, dynamic> _handleResponse(http.Response response) {
    final body = jsonDecode(response.body);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    } else {
      // Periksa apakah ini error autentikasi
      if (response.statusCode == 401 || response.statusCode == 403) {
        throw AuthException(body['message'] ?? 'Unauthorized');
      } else {
        // Error server biasa
        throw ApiException(body['message'] ?? 'An error occurred');
      }
    }
  }
}
