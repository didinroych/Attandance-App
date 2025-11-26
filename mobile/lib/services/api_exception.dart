/// Exception umum dari API
class ApiException implements Exception {
  final String message;
  ApiException(this.message);

  @override
  String toString() => message;
}

/// Exception khusus untuk masalah autentikasi (401, 403)
class AuthException extends ApiException {
  AuthException(String message) : super(message);
}
