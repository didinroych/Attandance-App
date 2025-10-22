import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Ganti dengan IP/domain Anda jika menjalankan di HP
  static const String _baseUrl = "http://localhost:3000/api";

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

  // Helper untuk memproses response
  Map<String, dynamic> _handleResponse(http.Response response) {
    final body = jsonDecode(response.body);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    } else {
      throw Exception(body['message'] ?? 'An error occurred');
    }
  }
}
